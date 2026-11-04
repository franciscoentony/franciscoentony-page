import { test } from "@playwright/test";
import { routes, settle, attachJson, expect } from "./helpers";
import { TOKENS } from "../qa.config.mjs";

const ROUTES = await routes();
const MAX_TABS = 120;

type Stop = {
  i: number;
  tag: string;
  text: string;
  href: string | null;
  visible: boolean;
  inViewport: boolean;
  outlineStyle: string;
  outlineWidth: number;
  outlineColor: string;
  outlineOffset: number;
  boxShadow: string;
};

// Teclado é testado em desktop (1280) e mobile (375): no mobile o menu muda.
for (const route of ROUTES) {
  test(`[KB-01] ${route.id}: Tab percorre tudo com foco visível @dod`, async ({ page }, testInfo) => {
    test.skip(!["w1280", "w375"].includes(testInfo.project.name), "teclado: 1280 e 375");
    await page.goto(route.path, { waitUntil: "domcontentloaded" });
    await settle(page);
    // scroll suave atrasa a chegada do foco à tela; aqui queremos o estado final
    await page.addStyleTag({ content: "html{scroll-behavior:auto!important}" });
    // começa do início do documento (sem clicar: o clique mudaria o ponto de partida do Tab)
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

    const stops: Stop[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < MAX_TABS; i++) {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(120);
      const s = await page.evaluate((i) => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
          i,
          key: el.outerHTML.slice(0, 200),
          tag: el.tagName.toLowerCase(),
          text: (el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 50),
          href: el.getAttribute("href"),
          visible: r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && Number(cs.opacity) > 0,
          inViewport: r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth,
          outlineStyle: cs.outlineStyle,
          outlineWidth: parseFloat(cs.outlineWidth),
          outlineColor: cs.outlineColor,
          outlineOffset: parseFloat(cs.outlineOffset),
          boxShadow: cs.boxShadow,
        };
      }, i);
      if (!s) break; // saiu da página (voltou ao body/URL bar)
      if (seen.has(s.key)) break; // deu a volta
      seen.add(s.key);
      const stop: Stop = { ...s };
      delete (stop as Partial<typeof s>).key;
      stops.push(stop);
    }
    await attachJson(testInfo, "tab-order", stops);

    expect(stops.length, "nenhum elemento focável alcançado por Tab").toBeGreaterThan(0);

    // DoD: foco visível em todos
    const semIndicador = stops.filter(
      (s) => !(s.outlineStyle !== "none" && s.outlineWidth >= 1) && (s.boxShadow === "none" || !s.boxShadow),
    );
    expect.soft(semIndicador.map((s) => `#${s.i} <${s.tag}> "${s.text}"`), "Elementos sem indicador de foco").toEqual([]);

    const invisiveis = stops.filter((s) => !s.visible || !s.inViewport);
    expect
      .soft(invisiveis.map((s) => `#${s.i} <${s.tag}> "${s.text}" visible=${s.visible} inViewport=${s.inViewport}`), "Foco em elemento invisível ou fora da tela (ex.: nav escondida)")
      .toEqual([]);

    // HANDOFF/D8: outline lavanda #C9BCFF, 2px, offset 3px
    const foraDoPadrao = stops.filter(
      (s) => !(s.outlineStyle === "solid" && s.outlineWidth === 2 && s.outlineColor === TOKENS.focusOutline && s.outlineOffset === 3),
    );
    expect
      .soft(
        foraDoPadrao.map((s) => `#${s.i} <${s.tag}> "${s.text}": ${s.outlineStyle} ${s.outlineWidth}px ${s.outlineColor} offset ${s.outlineOffset}`),
        "@redesign: :focus-visible fora do padrão D8 (2px solid #C9BCFF, offset 3px)",
      )
      .toEqual([]);
  });
}

test("[KB-02] Home: links de seção levam o foco/scroll ao destino @dod", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "w1280", "1280");
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await settle(page);
  const ancoras = await page.locator('a[href^="#"]:visible').evaluateAll((as) =>
    as.map((a) => a.getAttribute("href")!).filter((h) => h.length > 1),
  );
  const falhas: string[] = [];
  for (const h of [...new Set(ancoras)]) {
    await page.evaluate(() => window.scrollTo(0, 0));
    const link = page.locator(`a[href="${h}"]:visible`).first();
    await link.focus();
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1200);
    const ok = await page.evaluate((id) => {
      const el = document.getElementById(id);
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.top < innerHeight && r.bottom > 0;
    }, h.slice(1));
    if (!ok) falhas.push(h);
  }
  expect.soft(falhas, "Âncoras que não levaram ao destino").toEqual([]);
});

test("[KB-03] Home: carrossel de projetos operável por Tab/setas @redesign", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "w1280", "1280");
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await settle(page);
  // heurística: container com scroll-snap horizontal
  const handle = await page.evaluateHandle(() =>
    [...document.querySelectorAll<HTMLElement>("*")].find((el) => {
      const cs = getComputedStyle(el);
      return cs.scrollSnapType.includes("x") && el.scrollWidth > el.clientWidth;
    }) ?? null,
  );
  const el = handle.asElement();
  test.skip(!el, "carrossel ainda não implementado (sem scroll-snap horizontal)");
  await el!.scrollIntoViewIfNeeded();
  const before = await el!.evaluate((e) => (e as HTMLElement).scrollLeft);

  // Tab até um item dentro do carrossel
  const focaveis = await el!.evaluate((e) => e.querySelectorAll("a,button,[tabindex]:not([tabindex='-1'])").length);
  expect(focaveis, "itens do carrossel precisam ser focáveis").toBeGreaterThan(0);
  await el!.evaluate((e) => (e.querySelector("a,button,[tabindex]:not([tabindex='-1'])") as HTMLElement).focus());
  for (let i = 0; i < Math.max(1, focaveis - 1); i++) await page.keyboard.press("Tab");
  await page.waitForTimeout(600);
  const afterTab = await el!.evaluate((e) => (e as HTMLElement).scrollLeft);

  await el!.evaluate((e) => (e as HTMLElement).scrollTo({ left: 0 }));
  await el!.evaluate((e) => (e.querySelector("a,button,[tabindex]:not([tabindex='-1'])") as HTMLElement).focus());
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(600);
  const afterArrow = await el!.evaluate((e) => (e as HTMLElement).scrollLeft);

  testInfo.annotations.push({ type: "carrossel", description: `scrollLeft: inicial ${before}, após Tab ${afterTab}, após → ${afterArrow}` });
  expect.soft(afterTab, "Tab dentro do carrossel deve trazer os cards seguintes à vista").toBeGreaterThan(before);
  expect.soft(afterArrow, "Seta → deve avançar o carrossel").toBeGreaterThan(0);
});
