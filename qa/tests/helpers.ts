import { expect, type Page, type TestInfo, type ConsoleMessage } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { BASE_URL, OUT_DIR } from "../qa.config.mjs";
import { httpGet } from "../scripts/http.mjs";

export type RouteDef = { id: string; path: string; label: string };

let slugCache: string | null = null;

/** Descobre um slug real a partir do índice gerado pelo Hugo. */
export async function firstSlug(): Promise<string> {
  if (slugCache) return slugCache;
  if (process.env.QA_SLUG) return (slugCache = process.env.QA_SLUG);
  let posts: { slug: string; date: string }[];
  try {
    // httpGet em vez de fetch: o fetch do Node bloqueia "bad ports" como a 4190
    const res = await httpGet(`${BASE_URL}/blog-data/index.json`);
    if (!res.ok) throw new Error(String(res.status));
    posts = await res.json();
  } catch {
    // o servidor local ainda não subiu na fase de coleta: usa o índice do repo
    const file = path.resolve(import.meta.dirname, "../../public/blog-data/index.json");
    posts = JSON.parse(fs.readFileSync(file, "utf8"));
  }
  posts.sort((a, b) => b.date.localeCompare(a.date));
  slugCache = posts[0].slug;
  return slugCache;
}

export async function routes(): Promise<RouteDef[]> {
  const slug = await firstSlug();
  return [
    { id: "home", path: "/", label: "Home" },
    { id: "blog", path: "/blog", label: "Blog" },
    { id: "post", path: `/blog/${slug}`, label: `Post (${slug})` },
  ];
}

export type Issue = { type: string; text: string; url?: string };

/**
 * Coleta tudo que suja o console: console.error/warning, exceções não tratadas,
 * requests que falharam e respostas >= 400 (exceto o documento principal, que é
 * avaliado à parte por causa do fallback 404.html do GitHub Pages).
 */
export function watchConsole(page: Page) {
  const issues: Issue[] = [];
  let documentStatus: number | null = null;

  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      const loc = msg.location();
      // O próprio Chrome loga "Failed to load resource" para o documento servido
      // como 404 pelo GitHub Pages; isso é coberto pelo teste de status HTTP.
      if (documentStatus === 404 && /status of 404/.test(msg.text()) && loc.url === page.url()) return;
      issues.push({ type: `console.${msg.type()}`, text: msg.text(), url: loc.url });
    }
  });
  page.on("pageerror", (err) => issues.push({ type: "pageerror", text: String(err.stack ?? err) }));
  page.on("requestfailed", (req) => {
    const reason = req.failure()?.errorText ?? "";
    if (reason.includes("ERR_ABORTED")) return; // navegação/cancelamento normal
    issues.push({ type: "requestfailed", text: reason, url: req.url() });
  });
  page.on("response", (res) => {
    if (res.request().isNavigationRequest() && res.request().frame() === page.mainFrame()) {
      documentStatus = res.status();
      return;
    }
    if (res.status() >= 400) issues.push({ type: `http.${res.status()}`, text: res.statusText(), url: res.url() });
  });

  return {
    issues,
    get documentStatus() {
      return documentStatus;
    },
  };
}

/** Espera rede ociosa e fontes carregadas. */
export async function settle(page: Page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts.ready).catch(() => {});
}

/** Rola a página inteira devagar (dispara revelações, IO e lazy-load) e volta ao topo. */
export async function autoScroll(page: Page, { step = 0.6, delay = 120 } = {}) {
  await page.evaluate(
    async ({ step, delay }) => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const vh = window.innerHeight;
      let y = 0;
      // limite de segurança para páginas com scroll infinito
      for (let i = 0; i < 400; i++) {
        const max = document.documentElement.scrollHeight - vh;
        if (y >= max) break;
        y = Math.min(max, y + vh * step);
        window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
        await sleep(delay);
      }
      await sleep(400);
    },
    { step, delay },
  );
}

export async function scrollTop(page: Page) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior }));
  await page.waitForTimeout(300);
}

/** Diretório de screenshots: <OUT>/screenshots/<projeto>/ */
export function shotPath(testInfo: TestInfo, name: string) {
  const dir = path.join(OUT_DIR, "screenshots", testInfo.project.name);
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${name}.png`);
}

export function attachJson(testInfo: TestInfo, name: string, data: unknown) {
  return testInfo.attach(name, { body: JSON.stringify(data, null, 2), contentType: "application/json" });
}

export function formatIssues(issues: Issue[]) {
  return issues.map((i) => `- [${i.type}] ${i.text}${i.url ? ` (${i.url})` : ""}`).join("\n");
}

export { expect };
