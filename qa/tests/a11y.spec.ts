import { test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { routes, settle, autoScroll, attachJson, expect } from "./helpers";
import { TOKENS } from "../qa.config.mjs";

const ROUTES = await routes();

for (const route of ROUTES) {
  test(`[A11Y-01] ${route.id}: axe-core WCAG 2.1 A/AA sem violações @dod`, async ({ page }, testInfo) => {
    await page.goto(route.path, { waitUntil: "domcontentloaded" });
    await settle(page);
    // Estado final: rola até o fim (tudo revelado e "lido") e analisa ali, sem voltar ao
    // topo. Voltar ao topo faria o lead palavra a palavra (ligado ao scroll) regredir a
    // muted, estado transitório aceito pelo HANDOFF §4 (o A11Y-02 cobre o estado final).
    await autoScroll(page);
    await page.waitForTimeout(600);

    let axe = new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
      // Decoração com aria-hidden (esfera de tags, canvases): exceção da WCAG 1.4.3
      // para texto "puramente decorativo". O HANDOFF §4 define a esfera como decorativa.
      .exclude('[aria-hidden="true"]');
    // skip-link: o axe trata href="/#secao" como âncora da própria página; fora da Home
    // esses links apontam para outra rota e o alerta é falso positivo.
    if (route.id !== "home") axe = axe.disableRules(["skip-link"]);
    const results = await axe.analyze();
    const resumo = results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      count: v.nodes.length,
      exemplos: v.nodes.slice(0, 5).map((n) => ({ alvo: n.target.join(" "), detalhe: n.failureSummary })),
    }));
    await attachJson(testInfo, "axe-violations", resumo);
    const texto = resumo.map((v) => `- ${v.id} [${v.impact}] ×${v.count}: ${v.help}\n    ${v.exemplos.map((e) => e.alvo).join("\n    ")}`).join("\n");
    expect.soft(resumo, `Violações axe:\n${texto}`).toEqual([]);
  });

  test(`[A11Y-02] ${route.id}: nenhum texto final na cor muted #48484D @dod`, async ({ page }, testInfo) => {
    await page.goto(route.path, { waitUntil: "domcontentloaded" });
    await settle(page);
    await autoScroll(page, { step: 0.4, delay: 250 }); // dá tempo das palavras "lerem"
    await page.waitForTimeout(800);

    const ofensores = await page.evaluate((muted) => {
      const out: { texto: string; seletor: string }[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const vistos = new Set<Element>();
      while (walker.nextNode()) {
        const node = walker.currentNode as Text;
        const el = node.parentElement;
        if (!el || vistos.has(el) || !node.textContent?.trim()) continue;
        vistos.add(el);
        if (el.closest('[aria-hidden="true"]')) continue; // decorativo
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) === 0) continue;
        if (cs.color === muted) {
          out.push({
            texto: node.textContent.trim().slice(0, 60),
            seletor: `${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 4).join(".")}`,
          });
        }
      }
      return out;
    }, TOKENS.muted);
    await attachJson(testInfo, "muted-texts", ofensores);
    expect
      .soft(ofensores.map((o) => `${o.seletor}: "${o.texto}"`), "Texto em muted (#48484D ≈ 2.3:1) no estado final; precisa ser decorativo (aria-hidden) ou paper/secondary")
      .toEqual([]);
  });

  test(`[A11Y-03] ${route.id}: estrutura semântica básica @dod`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "w1280", "independe da largura");
    await page.goto(route.path, { waitUntil: "domcontentloaded" });
    await settle(page);
    const info = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      title: document.title,
      h1: document.querySelectorAll("h1").length,
      main: document.querySelectorAll("main, [role=main]").length,
      nav: document.querySelectorAll("nav").length,
      headings: [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => Number(h.tagName[1])),
      canvasSemAriaHidden: [...document.querySelectorAll("canvas")].filter(
        (c) => !c.closest('[aria-hidden="true"]') && !c.getAttribute("role") && !c.getAttribute("aria-label"),
      ).length,
    }));
    await attachJson(testInfo, "semantica", info);
    expect.soft(info.lang.toLowerCase(), "html[lang] deve ser pt-BR").toMatch(/^pt/);
    expect.soft(info.title.trim().length, "<title> vazio").toBeGreaterThan(0);
    expect.soft(info.h1, "deve haver exatamente um h1").toBe(1);
    expect.soft(info.main, "deve haver um landmark <main>").toBeGreaterThanOrEqual(1);
    expect.soft(info.nav, "deve haver <nav>").toBeGreaterThanOrEqual(1);
    const saltos = info.headings.filter((h, i) => i > 0 && h - info.headings[i - 1] > 1);
    expect.soft(saltos, `Saltos de nível de heading: ${info.headings.join(",")}`).toEqual([]);
    expect.soft(info.canvasSemAriaHidden, "canvases decorativos devem ser aria-hidden (HANDOFF §4)").toBe(0);
  });
}

test("[A11Y-04] Home: h1 continua na árvore de acessibilidade em qualquer posição do scroll @dod", async ({ page }, testInfo) => {
  test.skip(!["w1280", "w375"].includes(testInfo.project.name), "1280 e 375");
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await settle(page);
  const falhas: string[] = [];
  for (const frac of [0, 0.25, 0.5, 1]) {
    await page.evaluate((f) => window.scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) * f, behavior: "instant" as ScrollBehavior }), frac);
    await page.waitForTimeout(500);
    // visibility:hidden / display:none / aria-hidden tiram o h1 da árvore (leitor de tela não o encontra)
    const ok = await page.evaluate(() =>
      [...document.querySelectorAll("h1")].some((h) => h.checkVisibility({ visibilityProperty: true }) && !h.closest('[aria-hidden="true"]')),
    );
    if (!ok) falhas.push(`scroll ${frac * 100}%`);
  }
  expect.soft(falhas, "h1 some da árvore de acessibilidade (use só opacity no fade, ou um h1/sr-only persistente)").toEqual([]);
});
