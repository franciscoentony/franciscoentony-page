// Lighthouse nas 3 rotas, perfis mobile e desktop. DoD: Performance e Acessibilidade >= 90.
// Uso: node scripts/lighthouse.mjs          (local: build + preview)
//      QA_BASE_URL=https://... node scripts/lighthouse.mjs
// Variáveis: QA_OUT (pasta de saída), QA_LH_MIN (padrão 90), QA_LH_RUNS (padrão 1; usa a mediana de performance)
import fs from "node:fs";
import path from "node:path";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import { BASE_URL, OUT_DIR } from "../qa.config.mjs";
import { ensureServer } from "./server.mjs";

const MIN = Number(process.env.QA_LH_MIN ?? 90);
const RUNS = Number(process.env.QA_LH_RUNS ?? 1);
const outDir = path.join(OUT_DIR, "lighthouse");
fs.mkdirSync(outDir, { recursive: true });

async function slug() {
  const posts = await (await fetch(`${BASE_URL}/blog-data/index.json`)).json();
  posts.sort((a, b) => b.date.localeCompare(a.date));
  return posts[0].slug;
}

const stop = await ensureServer();
// pré-checagem: sem rede, aborta com mensagem clara em vez de gerar relatório vazio
try {
  await fetch(BASE_URL + "/");
} catch (e) {
  console.error(`[lh] ${BASE_URL} inacessível (${e.cause?.code ?? e.message}). Verifique a rede e rode de novo.`);
  stop();
  process.exit(2);
}
const s = await slug();
const ROUTES = [
  ["home", "/"],
  ["blog", "/blog"],
  ["post", `/blog/${s}`],
];
const PRESETS = ["mobile", "desktop"];
const CATS = ["performance", "accessibility", "best-practices", "seo"];

const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless=new", "--no-sandbox"] });
const rows = [];
try {
  for (const [id, p] of ROUTES) {
    for (const preset of PRESETS) {
      const url = BASE_URL + p;
      const runs = [];
      for (let i = 0; i < RUNS; i++) {
        const config = preset === "desktop" ? (await import("lighthouse/core/config/desktop-config.js")).default : undefined;
        try {
          const r = await lighthouse(url, { port: chrome.port, output: ["html", "json"], logLevel: "error", onlyCategories: CATS }, config);
          if (r) runs.push(r);
        } catch (e) {
          console.error(`[lh] falha em ${id}/${preset} (run ${i + 1}): ${e.message}`);
        }
      }
      if (!runs.length) {
        rows.push({ rota: id, url, perfil: preset, erro: "todas as execuções falharam", falhasA11y: [], falhasBP: [], falhasSEO: [] });
        continue;
      }
      runs.sort((a, b) => (a.lhr.categories.performance.score ?? 0) - (b.lhr.categories.performance.score ?? 0));
      const r = runs[Math.floor(runs.length / 2)];
      const base = path.join(outDir, `${id}-${preset}`);
      fs.writeFileSync(`${base}.html`, r.report[0]);
      fs.writeFileSync(`${base}.json`, r.report[1]);
      const lhr = r.lhr;
      const score = (k) => (lhr.categories[k]?.score == null ? null : Math.round(lhr.categories[k].score * 100));
      const a = lhr.audits;
      const row = {
        rota: id,
        url,
        perfil: preset,
        erro: lhr.runtimeError?.message ?? null,
        performance: score("performance"),
        accessibility: score("accessibility"),
        bestPractices: score("best-practices"),
        seo: score("seo"),
        LCP: a["largest-contentful-paint"]?.displayValue,
        CLS: a["cumulative-layout-shift"]?.displayValue,
        TBT: a["total-blocking-time"]?.displayValue,
        FCP: a["first-contentful-paint"]?.displayValue,
        falhasA11y: Object.values(a)
          .filter((x) => lhr.categories.accessibility?.auditRefs.some((ref) => ref.id === x.id) && x.score !== null && x.score < 1)
          .map((x) => x.id),
        falhasBP: Object.values(a)
          .filter((x) => lhr.categories["best-practices"]?.auditRefs.some((ref) => ref.id === x.id) && x.score !== null && x.score < 1)
          .map((x) => x.id),
        falhasSEO: Object.values(a)
          .filter((x) => lhr.categories.seo?.auditRefs.some((ref) => ref.id === x.id) && x.score !== null && x.score < 1)
          .map((x) => x.id),
      };
      rows.push(row);
      console.log(`[lh] ${id.padEnd(4)} ${preset.padEnd(7)} perf=${row.performance} a11y=${row.accessibility} bp=${row.bestPractices} seo=${row.seo} LCP=${row.LCP} CLS=${row.CLS} TBT=${row.TBT}${row.erro ? "  ERRO: " + row.erro : ""}`);
    }
  }
} finally {
  await chrome.kill();
  stop();
}

fs.writeFileSync(path.join(outDir, "summary.json"), JSON.stringify(rows, null, 2));
const md = [
  `# Lighthouse — ${BASE_URL}`,
  "",
  `Gerado em ${new Date().toISOString()} · mínimo exigido (DoD): Performance e Acessibilidade ≥ ${MIN}`,
  "",
  "| Rota | Perfil | Perf | A11y | BP | SEO | LCP | CLS | TBT | Status |",
  "|---|---|---|---|---|---|---|---|---|---|",
  ...rows.map((r) => {
    const ok = r.performance >= MIN && r.accessibility >= MIN && !r.erro;
    return `| ${r.rota} | ${r.perfil} | ${r.performance ?? "—"} | ${r.accessibility ?? "—"} | ${r.bestPractices ?? "—"} | ${r.seo ?? "—"} | ${r.LCP ?? "—"} | ${r.CLS ?? "—"} | ${r.TBT ?? "—"} | ${ok ? "✅" : "❌"}${r.erro ? " " + r.erro.slice(0, 80) : ""} |`;
  }),
  "",
  "## Auditorias reprovadas",
  "",
  ...rows.map((r) => `- **${r.rota}/${r.perfil}** — a11y: ${r.falhasA11y.join(", ") || "nenhuma"} · best-practices: ${r.falhasBP.join(", ") || "nenhuma"} · seo: ${r.falhasSEO.join(", ") || "nenhuma"}`),
  "",
].join("\n");
fs.writeFileSync(path.join(outDir, "summary.md"), md);
console.log(`\n[lh] relatórios em ${outDir}/`);
const reprovado = rows.some((r) => r.erro || r.performance < MIN || r.accessibility < MIN);
process.exit(reprovado ? 1 : 0);
