/**
 * P0 do plano de desempenho (docs/redesign/PERF-PLAN.md §2): testes de orçamento.
 *
 * Roda só nos projetos perf-mobile (412×915, DPR 2.75, toque, CPU 6×) e perf-desktop
 * (1440×900, sem throttling). Fora da suíte padrão: `bun run test:perf`.
 *
 * Cada teste grava as métricas em <QA_OUT>/perf/<projeto>/<teste>.json, que o
 * scripts/perf-report.mjs transforma numa tabela markdown.
 */
import { test, type Page, type CDPSession, type TestInfo } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { attachJson, expect } from "./helpers";
import { OUT_DIR } from "../qa.config.mjs";

// ---------- metas (PERF-PLAN §2) ----------
export const BUDGET = {
  tbtMs: 200,
  longTaskAfterLoadMs: 50,
  idleMainThreadPct: 10,
  scrollFps: 30,
  scrollMaxFrameMs: 50,
  inpMs: 200,
};

/** Fim do "carregamento" para efeito de long tasks: load + este intervalo. */
const LOAD_GRACE_MS = 3000;
const IDLE_WINDOW_MS = 3000;
const IDLE_SETTLE_MS = 1500;
const SECTIONS = ["top", "sobre", "habilidades", "projetos", "experiencia", "blog", "contato"] as const;

type LongTask = { start: number; dur: number };
const ambiente = new Map<string, { calibracaoMs: number; cargaSistema: number[]; nucleos: number }>();

function throttleRate(testInfo: TestInfo) {
  return Number((testInfo.project.metadata as { cpuThrottle?: number })?.cpuThrottle ?? 1);
}

/** CDP com CPU throttling aplicado ANTES da navegação. */
async function setup(page: Page, testInfo: TestInfo): Promise<CDPSession> {
  // Observers instalados antes de qualquer script da página
  await page.addInitScript(() => {
    const w = window as unknown as { __qa: { lt: { start: number; dur: number }[]; ev: { name: string; dur: number; id: number; start: number }[] } };
    w.__qa = { lt: [], ev: [] };
    try {
      new PerformanceObserver((l) => l.getEntries().forEach((e) => w.__qa.lt.push({ start: e.startTime, dur: e.duration }))).observe({ type: "longtask", buffered: true });
    } catch {}
    try {
      new PerformanceObserver((l) =>
        l.getEntries().forEach((e) => {
          const pe = e as PerformanceEventTiming;
          w.__qa.ev.push({ name: pe.name, dur: pe.duration, id: pe.interactionId ?? 0, start: pe.startTime });
        }),
      ).observe({ type: "event", buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
    } catch {}
  });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Performance.enable", { timeDomain: "timeTicks" });
  // Calibração (antes do throttling): loop fixo de JS. Serve para comparar runs e
  // detectar máquina saturada (outros processos competindo pela CPU).
  await page.goto("about:blank");
  const calibracaoMs = await page.evaluate(() => {
    const t = performance.now();
    let x = 0;
    for (let i = 0; i < 2e7; i++) x = (x + i * 7) % 1000003;
    return Math.round(performance.now() - t + (x < 0 ? 1 : 0));
  });
  ambiente.set(testInfo.testId, { calibracaoMs, cargaSistema: os.loadavg().map((v) => +v.toFixed(1)), nucleos: os.cpus().length });
  const rate = throttleRate(testInfo);
  if (rate > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate });
  return cdp;
}

async function metrics(cdp: CDPSession) {
  const { metrics } = await cdp.send("Performance.getMetrics");
  const m = Object.fromEntries(metrics.map((x) => [x.name, x.value]));
  return { task: m.TaskDuration as number, script: m.ScriptDuration as number, layout: (m.LayoutDuration as number) + (m.RecalcStyleDuration as number), ts: m.Timestamp as number };
}

const longTasks = (page: Page) => page.evaluate(() => (window as unknown as { __qa: { lt: LongTask[] } }).__qa.lt.slice());

function save(testInfo: TestInfo, name: string, data: unknown) {
  const dir = path.join(OUT_DIR, "perf", testInfo.project.name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${name}.json`), JSON.stringify({ projeto: testInfo.project.name, cpu: throttleRate(testInfo), ambiente: ambiente.get(testInfo.testId) ?? null, ...((data as object) ?? {}) }, null, 2));
  return attachJson(testInfo, name, data);
}

async function gotoHome(page: Page, hash = "") {
  await page.goto(`/${hash}`, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready).catch(() => {});
}

test.describe("Orçamento de desempenho (PERF-PLAN §2)", () => {
  test.beforeEach(async ({ context }, testInfo) => {
    test.skip(!testInfo.project.name.startsWith("perf-"), "só nos projetos perf-*");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {});
  });

  test("[PERF-01] carregamento: TBT e long tasks depois do load", async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await setup(page, testInfo);
    await gotoHome(page);
    // janela pós-load: inicialização escalonada/idle dos canvases cai aqui
    await page.waitForTimeout(LOAD_GRACE_MS + 4000);
    const nav = await page.evaluate(() => {
      const n = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0;
      const lcpEntries = (window as unknown as { __lcp?: number }).__lcp;
      return { fcp, load: n.loadEventEnd, dcl: n.domContentLoadedEventEnd, lcp: lcpEntries ?? null };
    });
    const lt = await longTasks(page);
    const fimCarregamento = nav.load + LOAD_GRACE_MS;
    // TBT aproximado como no Lighthouse: soma do excedente de 50ms das long tasks depois do FCP
    const tbt = lt.filter((t) => t.start >= nav.fcp).reduce((a, t) => a + Math.max(0, t.dur - 50), 0);
    const depois = lt.filter((t) => t.start > fimCarregamento);
    const dados = {
      fcpMs: Math.round(nav.fcp),
      loadMs: Math.round(nav.load),
      tbtMs: Math.round(tbt),
      longTasks: lt.length,
      maiorLongTaskMs: Math.round(Math.max(0, ...lt.map((t) => t.dur))),
      longTasksDepoisDoLoad: depois.map((t) => ({ inicioMs: Math.round(t.start), duracaoMs: Math.round(t.dur) })),
      todas: lt.map((t) => ({ inicioMs: Math.round(t.start), duracaoMs: Math.round(t.dur) })),
    };
    await save(testInfo, "carregamento", dados);
    expect.soft(dados.tbtMs, `TBT aproximado (FCP→load+${LOAD_GRACE_MS + 4000}ms)`).toBeLessThan(BUDGET.tbtMs);
    expect
      .soft(dados.longTasksDepoisDoLoad.filter((t) => t.duracaoMs > BUDGET.longTaskAfterLoadMs).map((t) => `${t.duracaoMs}ms em ${t.inicioMs}ms`), `long tasks > ${BUDGET.longTaskAfterLoadMs}ms depois de load+${LOAD_GRACE_MS}ms`)
      .toEqual([]);
  });

  test("[PERF-02] página parada: % da main thread por seção", async ({ page }, testInfo) => {
    test.setTimeout(420_000);
    const cdp = await setup(page, testInfo);
    await gotoHome(page);
    await page.waitForTimeout(LOAD_GRACE_MS);
    await page.addStyleTag({ content: "html{scroll-behavior:auto!important}" });

    const linhas: Record<string, unknown>[] = [];
    for (const id of SECTIONS) {
      await page.evaluate((id) => {
        if (id === "top") window.scrollTo(0, 0);
        else document.getElementById(id)?.scrollIntoView({ block: "start" });
      }, id);
      await page.waitForTimeout(IDLE_SETTLE_MS); // inicialização do que acabou de entrar na tela
      const ltAntes = (await longTasks(page)).length;
      const a = await metrics(cdp);
      await page.waitForTimeout(IDLE_WINDOW_MS);
      const b = await metrics(cdp);
      const lt = (await longTasks(page)).slice(ltAntes);
      const wall = b.ts - a.ts;
      const linha = {
        secao: id,
        mainThreadPct: +(((b.task - a.task) / wall) * 100).toFixed(1),
        scriptMsPorS: Math.round(((b.script - a.script) / wall) * 1000),
        layoutStyleMsPorS: Math.round(((b.layout - a.layout) / wall) * 1000),
        longTasks: lt.length,
        maiorLongTaskMs: Math.round(Math.max(0, ...lt.map((t) => t.dur))),
        longTasksMsPorS: Math.round(lt.reduce((s, t) => s + t.dur, 0) / (wall)),
      };
      linhas.push(linha);
    }
    await save(testInfo, "parada", { janelaMs: IDLE_WINDOW_MS, secoes: linhas });
    const acima = linhas.filter((l) => (l.mainThreadPct as number) >= BUDGET.idleMainThreadPct).map((l) => `${l.secao}: ${l.mainThreadPct}%`);
    expect.soft(acima, `main thread parada ≥ ${BUDGET.idleMainThreadPct}%`).toEqual([]);
    const lts = linhas.filter((l) => (l.maiorLongTaskMs as number) > BUDGET.longTaskAfterLoadMs).map((l) => `${l.secao}: ${l.maiorLongTaskMs}ms`);
    expect.soft(lts, `long tasks > ${BUDGET.longTaskAfterLoadMs}ms com a página parada`).toEqual([]);
  });

  test("[PERF-03] scroll contínuo da Home inteira: FPS e quadros > 50ms", async ({ page }, testInfo) => {
    test.setTimeout(420_000);
    const cdp = await setup(page, testInfo);
    await gotoHome(page);
    await page.waitForTimeout(LOAD_GRACE_MS);
    await page.addStyleTag({ content: "html{scroll-behavior:auto!important}" });

    await page.evaluate(() => {
      const w = window as unknown as { __frames: number[]; __rafOn: boolean };
      w.__frames = [];
      w.__rafOn = true;
      let last = performance.now();
      const loop = (t: number) => {
        w.__frames.push(t - last);
        last = t;
        if (w.__rafOn) requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    });
    const ltAntes = (await longTasks(page)).length;
    const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const vp = page.viewportSize()!;
    const touch = testInfo.project.use.hasTouch;
    const SPEED = 1500; // px/s: rolagem contínua "de leitura rápida"
    const t0 = Date.now();
    // gesto real do Chrome (compositor + main thread), em blocos para não estourar o limite do gesto
    let feito = 0;
    while (feito < total - 2) {
      const passo = Math.min(3000, total - feito);
      await cdp.send("Input.synthesizeScrollGesture", {
        x: Math.round(vp.width / 2),
        y: Math.round(vp.height * 0.6),
        yDistance: -passo,
        speed: SPEED,
        gestureSourceType: touch ? "touch" : "mouse",
        preventFling: true,
      });
      const y = await page.evaluate(() => window.scrollY);
      if (y <= feito + 1) break; // não andou: chegou ao fim
      feito = y;
    }
    const duracaoMs = Date.now() - t0;
    const frames: number[] = await page.evaluate(() => {
      const w = window as unknown as { __frames: number[]; __rafOn: boolean };
      w.__rafOn = false;
      return w.__frames.slice(2);
    });
    const lt = (await longTasks(page)).slice(ltAntes);
    const sorted = [...frames].sort((a, b) => a - b);
    const avg = frames.reduce((a, b) => a + b, 0) / Math.max(1, frames.length);
    const dados = {
      alturaRolavelPx: total,
      roladoPx: Math.round(feito),
      duracaoMs,
      velocidadePxS: SPEED,
      fpsMedio: Math.round(1000 / avg),
      p95FrameMs: Math.round(sorted[Math.floor(sorted.length * 0.95)] ?? 0),
      maiorFrameMs: Math.round(sorted.at(-1) ?? 0),
      framesAcima50ms: frames.filter((f) => f > 50).length,
      frames: frames.length,
      longTasks: lt.length,
      maiorLongTaskMs: Math.round(Math.max(0, ...lt.map((t) => t.dur))),
    };
    await save(testInfo, "scroll", dados);
    expect.soft(dados.roladoPx, "sanidade: o gesto deve rolar a Home inteira").toBeGreaterThan(total * 0.95);
    expect.soft(dados.fpsMedio, `FPS médio no scroll (meta ≥ ${BUDGET.scrollFps})`).toBeGreaterThanOrEqual(BUDGET.scrollFps);
    expect.soft(dados.framesAcima50ms, "quadros > 50ms durante o scroll").toBe(0);
  });

  test("[PERF-04] INP aproximado: botão de e-mail e menu mobile", async ({ page }, testInfo) => {
    test.setTimeout(240_000);
    await setup(page, testInfo);
    await gotoHome(page);
    await page.waitForTimeout(LOAD_GRACE_MS);
    const touch = !!testInfo.project.use.hasTouch;

    async function interacao(nome: string, acao: () => Promise<void>) {
      const n0 = await page.evaluate(() => (window as unknown as { __qa: { ev: unknown[] } }).__qa.ev.length);
      await acao();
      await page.waitForTimeout(600); // o observer entrega depois do próximo paint
      const ev = await page.evaluate((n0) => (window as unknown as { __qa: { ev: { name: string; dur: number; id: number }[] } }).__qa.ev.slice(n0), n0);
      const comId = ev.filter((e) => e.id > 0);
      return { interacao: nome, inpMs: Math.round(Math.max(0, ...comId.map((e) => e.dur))), eventos: ev.map((e) => `${e.name}:${Math.round(e.dur)}`) };
    }

    const resultados = [];
    // e-mail (Contato)
    const email = page.locator("#contato button").first();
    await email.scrollIntoViewIfNeeded();
    await page.waitForTimeout(IDLE_SETTLE_MS);
    resultados.push(await interacao("botão de e-mail", () => (touch ? email.tap() : email.click())));
    // menu mobile (só abaixo de 860px)
    const menu = page.locator("button[aria-controls][aria-expanded]").first();
    // Depois de rolar até o Contato, a navbar está escondida (some ao rolar para baixo).
    // Como um usuário faria: rola um pouco para cima para ela voltar.
    await page.mouse.wheel(0, -400);
    await page.waitForTimeout(900);
    if (await menu.isVisible()) {
      resultados.push(await interacao("abrir menu mobile", () => (touch ? menu.tap() : menu.click())));
      await page.keyboard.press("Escape");
      await page.waitForTimeout(400);
    }
    await save(testInfo, "inp", { resultados });
    for (const r of resultados) expect.soft(r.inpMs, `INP de "${r.interacao}" (eventos: ${r.eventos.join(", ")})`).toBeLessThan(BUDGET.inpMs);
  });

  test("[DF-15] revelação do teaser ao pular para #blog", async ({ page }, testInfo) => {
    test.setTimeout(300_000);
    await setup(page, testInfo);
    const cenarios: Record<string, unknown>[] = [];

    async function medir(nome: string, pular: () => Promise<void>) {
      await page.evaluate(() => {
        const w = window as unknown as { __df15: { chegou?: number; inicio?: number; fim?: number } };
        w.__df15 = {};
        const sec = document.getElementById("blog");
        const alvos = () => [...(sec?.querySelectorAll<HTMLElement>("[class*='transition-[opacity']") ?? [])];
        const t0 = performance.now();
        const poll = () => {
          const r = sec?.getBoundingClientRect();
          const now = performance.now() - t0;
          // "chegou": o topo da seção passou de 85% da viewport (IO do Reveal usa threshold .15)
          if (w.__df15.chegou === undefined && r && r.top < innerHeight * 0.85) w.__df15.chegou = now;
          // só o que está na tela: em 412px o 3º card empilhado pode ficar abaixo da dobra
          const ops = alvos().filter((el) => el.getBoundingClientRect().top < innerHeight).map((el) => Number(getComputedStyle(el).opacity));
          if (w.__df15.inicio === undefined && ops.some((o) => o > 0.05)) w.__df15.inicio = now;
          if (w.__df15.fim === undefined && ops.length && ops.every((o) => o > 0.99)) w.__df15.fim = now;
          if (now < 8000 && w.__df15.fim === undefined) requestAnimationFrame(poll);
        };
        requestAnimationFrame(poll);
      });
      await pular();
      await page.waitForFunction(() => (window as unknown as { __df15: { fim?: number } }).__df15.fim !== undefined, null, { timeout: 10_000 }).catch(() => {});
      const r = await page.evaluate(() => (window as unknown as { __df15: { chegou?: number; inicio?: number; fim?: number } }).__df15);
      const atraso = r.inicio !== undefined && r.chegou !== undefined ? Math.round(r.inicio - r.chegou) : null;
      cenarios.push({ cenario: nome, chegouMs: Math.round(r.chegou ?? -1), inicioRevelacaoMs: Math.round(r.inicio ?? -1), revelacaoCompletaMs: Math.round(r.fim ?? -1), atrasoAposChegarMs: atraso });
    }

    // A) já na Home: pulo instantâneo para #blog (como um link de âncora)
    await gotoHome(page);
    await page.waitForTimeout(LOAD_GRACE_MS);
    await medir("pulo na página (topo → #blog)", async () => {
      await page.evaluate(() => {
        history.pushState(null, "", "/#blog");
        document.getElementById("blog")?.scrollIntoView({ behavior: "instant" as ScrollBehavior });
      });
    });

    // B) carga direta de /#blog (página fria)
    const page2 = await page.context().newPage();
    await setup(page2, testInfo);
    await page2.addInitScript(() => {
      // instala a medição o mais cedo possível
      const w = window as unknown as { __df15: { chegou?: number; inicio?: number; fim?: number } };
      w.__df15 = {};
      const tick = () => {
        const sec = document.getElementById("blog");
        const now = performance.now();
        if (sec) {
          const r = sec.getBoundingClientRect();
          if (w.__df15.chegou === undefined && r.top < innerHeight * 0.85) w.__df15.chegou = now;
          const ops = [...sec.querySelectorAll<HTMLElement>("[class*='transition-[opacity']")].filter((el) => el.getBoundingClientRect().top < innerHeight).map((el) => Number(getComputedStyle(el).opacity));
          if (w.__df15.inicio === undefined && ops.some((o) => o > 0.05)) w.__df15.inicio = now;
          if (w.__df15.fim === undefined && ops.length && ops.every((o) => o > 0.99)) w.__df15.fim = now;
        }
        if (now < 15000 && w.__df15.fim === undefined) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page2.goto("/#blog", { waitUntil: "load" });
    await page2.waitForFunction(() => (window as unknown as { __df15: { fim?: number } }).__df15.fim !== undefined, null, { timeout: 15_000 }).catch(() => {});
    const r2 = await page2.evaluate(() => (window as unknown as { __df15: { chegou?: number; inicio?: number; fim?: number } }).__df15);
    cenarios.push({
      cenario: "carga direta de /#blog",
      chegouMs: Math.round(r2.chegou ?? -1),
      inicioRevelacaoMs: Math.round(r2.inicio ?? -1),
      revelacaoCompletaMs: Math.round(r2.fim ?? -1),
      atrasoAposChegarMs: r2.inicio !== undefined && r2.chegou !== undefined ? Math.round(r2.inicio - r2.chegou) : null,
    });
    await page2.close();

    await save(testInfo, "df15", { cenarios });
    // Meta: a revelação começa em até 250ms depois de a seção chegar à tela (IO + 1 frame com folga)
    for (const c of cenarios) {
      expect.soft(c.atrasoAposChegarMs, `DF-15 "${c.cenario}": atraso entre chegar e começar a revelar`).not.toBeNull();
      if (c.atrasoAposChegarMs !== null) expect.soft(c.atrasoAposChegarMs as number, `DF-15 "${c.cenario}"`).toBeLessThanOrEqual(250);
    }
  });
});
