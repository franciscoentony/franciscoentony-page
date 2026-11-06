import { test } from "@playwright/test";
import {
  routes,
  watchConsole,
  settle,
  autoScroll,
  scrollTop,
  shotPath,
  attachJson,
  formatIssues,
  expect,
} from "./helpers";
import { BASE_URL, IS_LOCAL } from "../qa.config.mjs";

const ROUTES = await routes();

for (const route of ROUTES) {
  test.describe(`Rota ${route.label}`, () => {
    test(`[RT] ${route.id}: acesso direto renderiza, console limpo e screenshots @dod`, async ({ page }, testInfo) => {
      const con = watchConsole(page);
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await settle(page);

      // 1) A SPA montou e há um h1 visível (conteúdo real, não tela em branco)
      await expect(page.locator("#root")).not.toBeEmpty();
      await expect(page.locator("h1").first()).toBeVisible();

      // 2) Screenshot acima da dobra (estado inicial, antes de qualquer scroll)
      await page.screenshot({ path: shotPath(testInfo, `${route.id}-viewport`) });

      // 3) Rola tudo para disparar revelações/IO; depois screenshot da página inteira
      await autoScroll(page);
      await scrollTop(page);
      await page.screenshot({ path: shotPath(testInfo, `${route.id}-full`), fullPage: true });

      // 4) Sem scroll horizontal (responsividade)
      const overflow = await page.evaluate(() => {
        const w = document.documentElement.clientWidth;
        const offenders: string[] = [];
        document.querySelectorAll("body *").forEach((el) => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          if (cs.position === "fixed" || r.width === 0) return;
          if (r.right > w + 1 || r.left < -1) {
            // ignora filhos de quem já corta o overflow
            let p = el.parentElement;
            while (p && p !== document.body) {
              const o = getComputedStyle(p).overflowX;
              if (o === "hidden" || o === "clip" || o === "auto" || o === "scroll") return;
              p = p.parentElement;
            }
            offenders.push(`${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}.${[...el.classList].slice(0, 3).join(".")} (${Math.round(r.left)}→${Math.round(r.right)})`);
          }
        });
        return {
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: w,
          offenders: offenders.slice(0, 15),
        };
      });
      await attachJson(testInfo, "overflow", overflow);
      expect.soft(overflow.scrollWidth, `Scroll horizontal. Elementos vazando:\n${overflow.offenders.join("\n")}`).toBeLessThanOrEqual(overflow.clientWidth + 1);

      // 5) Imagens: todas com alt e carregadas
      const imgs = await page.evaluate(() =>
        [...document.images].map((img) => ({
          src: img.currentSrc || img.src,
          alt: img.getAttribute("alt"),
          loaded: img.complete && img.naturalWidth > 0,
          decorative: img.getAttribute("aria-hidden") === "true" || img.getAttribute("role") === "presentation",
        })),
      );
      await attachJson(testInfo, "imagens", imgs);
      const semAlt = imgs.filter((i) => i.alt === null);
      const quebradas = imgs.filter((i) => !i.loaded);
      expect.soft(semAlt.map((i) => i.src), "Imagens sem atributo alt").toEqual([]);
      expect.soft(quebradas.map((i) => i.src), "Imagens que não carregaram").toEqual([]);

      // 6) Âncoras internas (#id) apontam para elementos existentes
      const ancorasQuebradas = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLAnchorElement>('a[href^="#"], a[href^="/#"]')]
          .map((a) => a.getAttribute("href")!)
          .filter((h) => h.length > 1 && !h.startsWith("/#"))
          .filter((h) => !document.getElementById(decodeURIComponent(h.slice(1)))),
      );
      expect.soft(ancorasQuebradas, "Âncoras sem alvo na página").toEqual([]);

      // 7) Console limpo (DoD: nenhum erro ou warning)
      await page.waitForTimeout(500);
      await attachJson(testInfo, "console", con.issues);
      expect.soft(con.issues, `Console/rede com problemas:\n${formatIssues(con.issues)}`).toEqual([]);

      // 8) Status HTTP do documento. Em produção (GitHub Pages) as rotas SPA são
      //    servidas pelo 404.html com status 404: a página funciona, mas o status é
      //    registrado como achado (impacta SEO, compartilhamento e Lighthouse).
      testInfo.annotations.push({ type: "http-status", description: String(con.documentStatus) });
      if (IS_LOCAL || route.path === "/") {
        expect.soft(con.documentStatus, "Status HTTP do documento").toBe(200);
      }
    });
  });
}

test("[RT-04] slug inexistente mostra estado de 'não encontrado' sem quebrar @dod", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "w1280", "uma largura basta");
  const con = watchConsole(page);
  await page.goto("/blog/post-que-nao-existe-qa", { waitUntil: "domcontentloaded" });
  await settle(page);
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.locator("body")).toContainText(/não encontrado|404/i);
  await expect(page.locator('a[href="/blog"], a[href$="/blog"]').first()).toBeVisible();
  await page.screenshot({ path: shotPath(testInfo, "post-404") });
  expect.soft(con.issues, formatIssues(con.issues)).toEqual([]);
});

test("[RT-04b] /projetos/<slug inexistente> mostra 'não encontrado' sem quebrar @dod", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "w1280", "uma largura basta");
  const con = watchConsole(page);
  await page.goto("/projetos/projeto-que-nao-existe-qa", { waitUntil: "domcontentloaded" });
  await settle(page);
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.locator("body")).toContainText(/não encontrado|404/i);
  await page.screenshot({ path: shotPath(testInfo, "projeto-404") });
  expect.soft(con.issues, formatIssues(con.issues)).toEqual([]);
});

test("[RT-05] 404.html existe e é a SPA (fallback do GitHub Pages) @dod", async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== "w1280", "uma largura basta");
  // Em local o vite preview não usa 404.html; buscamos o arquivo diretamente.
  const [idx, notFound] = await Promise.all([request.get("/index.html"), request.get("/404.html")]);
  expect(notFound.status(), "/404.html precisa existir no build").toBe(200);
  const body = await notFound.text();
  expect(body).toContain('id="root"');
  const idxBody = await idx.text();
  // mesmo bundle JS que o index.html
  const bundle = (s: string) => s.match(/assets\/index-[\w-]+\.js/)?.[0];
  expect(bundle(body), "404.html deve carregar o mesmo bundle que index.html").toBe(bundle(idxBody));
});

test("[RT-06] navegação pela navbar entre rotas sem recarregar e sem erro @dod", async ({ page }, testInfo) => {
  test.skip(!["w1280", "w375"].includes(testInfo.project.name), "desktop e mobile");
  const con = watchConsole(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await settle(page);
  const header = page.locator("header, nav").first();
  await expect(header).toBeVisible();

  const blogLinks = page.locator('header a[href="/blog"], nav a[href="/blog"], nav a[href$="/blog"]');
  if (!(await blogLinks.locator("visible=true").count())) {
    // HANDOFF: abaixo de 860px os links somem; deve haver menu mobile
    const toggle = page.locator("button[aria-controls][aria-expanded]").or(page.getByRole("button", { name: /menu/i })).first();
    expect.soft(await toggle.count(), "Sem link de Blog visível e sem botão de menu mobile").toBeGreaterThan(0);
    if (await toggle.count()) await toggle.click();
  }
  await blogLinks.locator("visible=true").first().click();
  await expect(page).toHaveURL(/\/blog\/?$/);
  await expect(page.locator("h1").first()).toBeVisible();

  // abre o primeiro post a partir da listagem
  const firstPost = page.locator('a[href*="/blog/"]').first();
  await firstPost.click();
  await expect(page).toHaveURL(/\/blog\/[^/]+$/);
  await expect(page.locator("h1").first()).toBeVisible();

  // volta para a listagem
  await page.goBack();
  await expect(page).toHaveURL(/\/blog\/?$/);
  expect.soft(con.issues, formatIssues(con.issues)).toEqual([]);
});

test("[RT-07] links externos abrem com segurança e links internos respondem @dod", async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== "w1440", "uma largura basta");
  const problemas: string[] = [];
  for (const r of ROUTES) {
    await page.goto(r.path, { waitUntil: "domcontentloaded" });
    await settle(page);
    const links = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLAnchorElement>("a[href]")].map((a) => ({
        href: a.href,
        raw: a.getAttribute("href")!,
        target: a.target,
        rel: a.rel,
        text: (a.textContent ?? "").trim() || a.getAttribute("aria-label") || "",
      })),
    );
    for (const l of links) {
      if (!l.text) problemas.push(`${r.path}: link sem nome acessível → ${l.raw}`);
      if (l.raw === "#" || l.raw === "") problemas.push(`${r.path}: link vazio/placeholder "${l.text}"`);
      if (l.target === "_blank" && !/noopener|noreferrer/.test(l.rel)) problemas.push(`${r.path}: _blank sem rel=noopener → ${l.raw}`);
      if (l.href.startsWith(BASE_URL) && !l.raw.startsWith("#")) {
        const res = await request.get(l.href.split("#")[0]);
        // em produção, rotas SPA respondem 404 com a SPA; validamos que é a SPA
        const ok = res.status() === 200 || (res.status() === 404 && (await res.text()).includes('id="root"'));
        if (!ok) problemas.push(`${r.path}: link interno quebrado (${res.status()}) → ${l.raw}`);
      }
      // links para o GitHub (projetos/perfil) precisam existir
      if (/^https:\/\/github\.com\//.test(l.href)) {
        const res = await request.get(l.href, { maxRedirects: 5 }).catch(() => null);
        if (!res || res.status() >= 400) problemas.push(`${r.path}: link externo quebrado (${res?.status() ?? "erro"}) → ${l.href}`);
      }
    }
    await attachJson(testInfo, `links-${r.id}`, links);
  }
  expect.soft(problemas, problemas.join("\n")).toEqual([]);
});
