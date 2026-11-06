import { test, type Page } from "@playwright/test";
import { routes, settle, attachJson, expect } from "./helpers";

const ROUTES = await routes();

/**
 * Instrumenta os canvases 2D: conta chamadas de desenho por canvas. Permite saber
 * se um canvas está animando (contador cresce) sem depender de comparar pixels.
 */
async function instrumentCanvas(page: Page) {
  await page.addInitScript(() => {
    const P = CanvasRenderingContext2D.prototype as unknown as Record<string, unknown>;
    for (const m of ["fillText", "strokeText", "fillRect", "strokeRect", "drawImage", "putImageData", "fill", "stroke", "clearRect"]) {
      const orig = P[m] as (...a: unknown[]) => unknown;
      if (typeof orig !== "function") continue;
      P[m] = function (this: CanvasRenderingContext2D, ...args: unknown[]) {
        const c = this.canvas as HTMLCanvasElement & { __qaDraws?: number };
        c.__qaDraws = (c.__qaDraws ?? 0) + 1;
        return orig.apply(this, args);
      };
    }
  });
}

async function canvasDraws(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll("canvas")].map((c, i) => {
      const r = c.getBoundingClientRect();
      const cs = getComputedStyle(c);
      return {
        i,
        id: c.id || [...c.classList].join(".") || c.parentElement?.className?.toString().slice(0, 40) || "",
        draws: (c as HTMLCanvasElement & { __qaDraws?: number }).__qaDraws ?? 0,
        fixed: cs.position === "fixed",
        inViewport: r.bottom > 0 && r.top < innerHeight && r.width > 0,
        ratio: c.clientWidth ? c.width / c.clientWidth : 0,
        // canvas entregue a um Worker (OffscreenCanvas): não dá para instrumentar na main thread
        worker: (() => { try { c.getContext("2d"); c.getContext("webgl"); return false; } catch { return true; } })(),
      };
    }),
  );
}

test.describe("prefers-reduced-motion: reduce (comportamento do HANDOFF §4, D8)", () => {
  test.use({ reducedMotion: "reduce" });

  for (const route of ROUTES) {
    test(`[RM-01] ${route.id}: nenhuma animação/transição CSS dispara desde o carregamento @dod`, async ({ page }, testInfo) => {
      test.skip(!["w1280", "w375"].includes(testInfo.project.name), "1280 e 375");
      // registra toda animação/transição desde o primeiro frame (não depende de timing)
      await page.addInitScript(() => {
        const w = window as unknown as { __qaAnims: { tipo: string; nome: string; alvo: string; dur: number }[] };
        w.__qaAnims = [];
        const desc = (t: EventTarget | null) => {
          const el = t as Element | null;
          return el && el.tagName ? `${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 3).join(".")}` : "?";
        };
        const maxDur = (v: string) => Math.max(0, ...v.split(",").map((x) => (x.trim().endsWith("ms") ? parseFloat(x) : parseFloat(x) * 1000)));
        document.addEventListener("animationstart", (e) => {
          const dur = maxDur(getComputedStyle(e.target as Element).animationDuration);
          if (dur > 10) w.__qaAnims.push({ tipo: "animation", nome: e.animationName, alvo: desc(e.target), dur });
        }, true);
        document.addEventListener("transitionrun", (e) => {
          const dur = maxDur(getComputedStyle(e.target as Element).transitionDuration);
          if (dur > 10) w.__qaAnims.push({ tipo: "transition", nome: e.propertyName, alvo: desc(e.target), dur });
        }, true);
      });
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await settle(page);
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2));
      await page.waitForTimeout(600);
      const anims = await page.evaluate(() => {
        const w = window as unknown as { __qaAnims: { tipo: string; nome: string; alvo: string; dur: number }[] };
        // + animações Web Animations API (JS) ainda rodando
        const waapi = document.getAnimations()
          .filter((a) => a.playState === "running" && Number(a.effect?.getTiming().duration ?? 0) > 10)
          .map((a) => ({ tipo: a.constructor.name, nome: (a as CSSAnimation).animationName ?? "", alvo: "?", dur: Number(a.effect?.getTiming().duration) }));
        const all = [...w.__qaAnims, ...waapi];
        const key = (a: { tipo: string; nome: string; alvo: string }) => `${a.tipo}|${a.nome}|${a.alvo}`;
        return [...new Map(all.map((a) => [key(a), a])).values()];
      });
      await attachJson(testInfo, "animacoes", anims);
      expect.soft(anims.map((a) => `${a.alvo}: ${a.tipo} ${a.nome} (${a.dur}ms)`), "Animações/transições com reduced-motion").toEqual([]);
    });

    test(`[RM-02] ${route.id}: conteúdo visível sem depender de scroll/animação @dod`, async ({ page }, testInfo) => {
      test.skip(!["w1280", "w375"].includes(testInfo.project.name), "1280 e 375");
      await page.goto(route.path, { waitUntil: "domcontentloaded" });
      await page.locator("h1").first().waitFor({ state: "attached" });
      await page.waitForTimeout(150); // de propósito, sem esperar animações terminarem
      // texto com opacidade efetiva < 1 (somando ancestrais) ainda não revelado
      const ocultos = await page.evaluate(() => {
        const out: string[] = [];
        document.querySelectorAll("h1,h2,h3,h4,p,li,a,button,span,time").forEach((el) => {
          if (!el.textContent?.trim() || el.closest('[aria-hidden="true"]')) return;
          // não renderizado (ex.: menu mobile fechado, atributo hidden / display:none): ninguém vê
          if (!(el as HTMLElement).checkVisibility()) return;
          let o = 1;
          let t = false;
          for (let p: Element | null = el; p; p = p.parentElement) {
            const cs = getComputedStyle(p);
            o *= Number(cs.opacity);
            if (cs.transform !== "none" && /matrix\(1, 0, 0, 1, 0, [1-9]/.test(cs.transform)) t = true;
          }
          // < 0.5: "ainda não revelado" (.rv começa em 0). Opacidades de design, como os links
          // da nav a 0.8 (HANDOFF §2), não contam.
          if (o < 0.5 || t) out.push(`${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 50)}" opacity=${o.toFixed(2)}${t ? " translateY" : ""}`);
        });
        return [...new Set(out)].slice(0, 40);
      });
      await attachJson(testInfo, "textos-ocultos", ocultos);
      expect.soft(ocultos, "Com reduced-motion o texto (.rv etc.) deve já estar visível e no lugar").toEqual([]);
    });
  }

  test("[RM-03] Home: canvases estáticos (um quadro, sem redesenho contínuo) @redesign", async ({ page }, testInfo) => {
    test.skip(!["w1280", "w375"].includes(testInfo.project.name), "1280 e 375");
    await instrumentCanvas(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await settle(page);
    await page.waitForTimeout(1500);
    const a = await canvasDraws(page);
    test.skip(a.length === 0, "nenhum canvas na página (ainda)");
    await page.mouse.move(200, 200);
    await page.mouse.move(600, 400, { steps: 10 });
    await page.waitForTimeout(2000);
    const b = await canvasDraws(page);
    const animando = b.filter((c, i) => c.draws > (a[i]?.draws ?? 0));
    await attachJson(testInfo, "canvas-draws", { antes: a, depois: b });
    expect.soft(animando.map((c) => `canvas #${c.i} (${c.id}): +${c.draws - a[c.i].draws} chamadas em 2s`), "Canvas animando com reduced-motion (lacuna do protótipo, não copiar)").toEqual([]);
  });

  test("[RM-04] Home: cursor nativo (sem cursor custom) @redesign", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "w1280", "cursor custom só existe com pointer fino");
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await settle(page);
    const cursors = await page.evaluate(() => ({
      html: getComputedStyle(document.documentElement).cursor,
      body: getComputedStyle(document.body).cursor,
      link: document.querySelector("a") ? getComputedStyle(document.querySelector("a")!).cursor : "n/a",
    }));
    await attachJson(testInfo, "cursor", cursors);
    expect.soft(cursors.html).not.toBe("none");
    expect.soft(cursors.body).not.toBe("none");
    expect.soft(cursors.link).not.toBe("none");
  });

  test("[RM-05] Home: seção Universe sem pin (hero e capítulos empilhados) @redesign", async ({ page }, testInfo) => {
    test.skip(!["w1280", "w375"].includes(testInfo.project.name), "1280 e 375");
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await settle(page);
    const pins = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("body *")]
        .filter((el) => getComputedStyle(el).position === "sticky")
        .map((el) => ({
          el: `${el.tagName.toLowerCase()}.${[...el.classList].slice(0, 3).join(".")}`,
          alturaPai: el.parentElement?.getBoundingClientRect().height ?? 0,
          vh: innerHeight,
        }))
        // nav sticky é aceitável; pin de palco (pai com várias telas de altura) não
        .filter((p) => p.alturaPai > p.vh * 2),
    );
    await attachJson(testInfo, "sticky-pins", pins);
    expect.soft(pins.map((p) => `${p.el} (pai ${Math.round(p.alturaPai)}px)`), "Elemento sticky com palco de várias telas sob reduced-motion").toEqual([]);
  });
});

test.describe("Objetos arrastáveis do hero (RM)", () => {
  test.use({ reducedMotion: "reduce" });
  test("[RM-06] Home: objetos do hero parados e sem áreas de arrasto @redesign", async ({ page }, testInfo) => {
    test.skip(!["w1280", "w375"].includes(testInfo.project.name), "1280 e 375");
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await settle(page);
    await page.waitForTimeout(1000);
    const grabs = await page.locator('#top [data-cursor="drag"].rounded-full').count();
    expect.soft(grabs, "com reduced-motion não pode haver áreas de pegar/arrastar no hero").toBe(0);
    // tentativa de arrasto no centro do hero: nada pode "pegar" (html.grabbing) nem mover objetos
    const v = page.viewportSize()!;
    await page.mouse.move(v.width * 0.7, v.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(v.width * 0.3, v.height * 0.3, { steps: 12 });
    const grabbing = await page.evaluate(() => document.documentElement.classList.contains("grabbing"));
    await page.mouse.up();
    await attachJson(testInfo, "hero-arrasto", { grabs, grabbing });
    expect.soft(grabbing, "html.grabbing durante o arrasto: objeto foi pego com reduced-motion").toBe(false);
  });
});

test.describe("Performance dos canvases (D9)", () => {
  test("[PF-01] canvas fora da viewport fica pausado; visível anima @redesign", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "w1440", "1440");
    await instrumentCanvas(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await settle(page);
    await page.waitForTimeout(1500);
    const inicio = await canvasDraws(page);
    test.skip(inicio.length === 0, "nenhum canvas na página (ainda)");

    // no topo: o canvas visível (planeta/estrelas) deve animar
    await page.waitForTimeout(1000);
    const topo = await canvasDraws(page);
    const animandoNoTopo = topo.filter((c) => c.inViewport && c.draws > inicio[c.i].draws);
    // planeta e estrelas rodam em Worker (A8) e não são contáveis aqui: a sanidade só vale se houver canvas da main thread visível
    const visiveisMain = topo.filter((c) => c.inViewport && !c.worker && !c.fixed); // fixed da main thread = trilha do cursor, só desenha com o mouse em movimento
    if (visiveisMain.length > 0) expect.soft(animandoNoTopo.length, "sanidade: algum canvas visível deveria animar sem reduced-motion").toBeGreaterThan(0);

    // vai para o rodapé e mede quem continua desenhando sem estar visível
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" as ScrollBehavior }));
    await page.waitForTimeout(800);
    const a = await canvasDraws(page);
    await page.waitForTimeout(1500);
    const b = await canvasDraws(page);
    const vazando = b.filter((c) => !c.inViewport && !c.fixed && c.draws > a[c.i].draws);
    await attachJson(testInfo, "canvas-offscreen", { a, b });
    expect.soft(vazando.map((c) => `canvas #${c.i} (${c.id}) desenhou +${c.draws - a[c.i].draws} fora da tela`), "Canvas não pausado fora da viewport").toEqual([]);
  });

  test.describe("DPR alto", () => {
    test.use({ deviceScaleFactor: 3 });
    test("[PF-02] backing store dos canvases limitado a DPR 2 @redesign", async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "w375", "aparelho com DPR 3");
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await settle(page);
      await page.waitForTimeout(1500);
      const c = await canvasDraws(page);
      test.skip(c.length === 0, "nenhum canvas na página (ainda)");
      await attachJson(testInfo, "canvas-ratio", c);
      expect.soft(c.filter((x) => x.ratio > 2.01).map((x) => `canvas #${x.i} ratio ${x.ratio.toFixed(2)}`), "DPR acima de 2").toEqual([]);
    });
  });

  test("[PF-03] Home: FPS e long tasks durante o scroll @dod", async ({ page }, testInfo) => {
    test.skip(!["w1440", "w375"].includes(testInfo.project.name), "1440 e 375");
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await settle(page);
    await page.waitForTimeout(1000);
    const m = await page.evaluate(async () => {
      const longTasks: number[] = [];
      const po = new PerformanceObserver((l) => l.getEntries().forEach((e) => longTasks.push(e.duration)));
      po.observe({ type: "longtask", buffered: false });
      const frames: number[] = [];
      let last = performance.now();
      let running = true;
      const loop = (t: number) => {
        frames.push(t - last);
        last = t;
        if (running) requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
      const total = document.documentElement.scrollHeight - innerHeight;
      const dur = 5000;
      const t0 = performance.now();
      await new Promise<void>((res) => {
        const step = () => {
          const k = Math.min(1, (performance.now() - t0) / dur);
          window.scrollTo(0, total * k);
          if (k < 1) requestAnimationFrame(step);
          else res();
        };
        requestAnimationFrame(step);
      });
      running = false;
      po.disconnect();
      const ft = frames.slice(2);
      const avg = ft.reduce((a, b) => a + b, 0) / ft.length;
      const sorted = [...ft].sort((a, b) => a - b);
      return {
        fpsMedio: Math.round(1000 / avg),
        p95FrameMs: Math.round(sorted[Math.floor(sorted.length * 0.95)]),
        framesAcima50ms: ft.filter((f) => f > 50).length,
        longTasks: longTasks.length,
        longTasksMs: Math.round(longTasks.reduce((a, b) => a + b, 0)),
      };
    });
    await attachJson(testInfo, "scroll-perf", m);
    testInfo.annotations.push({ type: "scroll-perf", description: JSON.stringify(m) });
    // headless sem GPU é pessimista: limites conservadores, ver números no relatório
    expect.soft(m.fpsMedio, "FPS médio no scroll").toBeGreaterThanOrEqual(45);
    expect.soft(m.framesAcima50ms, "frames travados (>50ms)").toBeLessThanOrEqual(5);
  });
});
