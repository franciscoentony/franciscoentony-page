// Gera a tabela markdown do orçamento de desempenho a partir de <QA_OUT>/perf/<projeto>/*.json
// Uso: QA_OUT=reports/perf-xyz node scripts/perf-report.mjs [arquivo-saida.md]
// Para comparar antes × depois: rode nos dois diretórios e compare as tabelas (ou passe
// QA_PERF_BASE=<pasta do antes> para incluir a coluna "antes").
import fs from "node:fs";
import path from "node:path";
import { OUT_DIR, BASE_URL } from "../qa.config.mjs";

const META = { tbtMs: 200, longTaskMs: 50, idlePct: 10, fps: 30, frameMs: 50, inpMs: 200 };
const PROJETOS = ["perf-mobile", "perf-desktop"];

function ler(dir, projeto, nome) {
  const f = path.join(dir, "perf", projeto, `${nome}.json`);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null;
}
const ok = (cond) => (cond === null ? "—" : cond ? "✅" : "❌");
const base = process.env.QA_PERF_BASE;
const fmt = (v, ant, suf = "") => (v == null ? "—" : `${v}${suf}${ant != null && base ? ` (antes ${ant}${suf})` : ""}`);

const out = [`# Orçamento de desempenho: ${BASE_URL}`, "", `Gerado em ${new Date().toISOString()} · metas do PERF-PLAN §2`, ""];

for (const proj of PROJETOS) {
  const c = ler(OUT_DIR, proj, "carregamento");
  const p = ler(OUT_DIR, proj, "parada");
  const s = ler(OUT_DIR, proj, "scroll");
  const i = ler(OUT_DIR, proj, "inp");
  const d = ler(OUT_DIR, proj, "df15");
  if (!c && !p && !s && !i && !d) continue;
  const B = (n) => (base ? ler(base, proj, n) : null);
  const amb = (c ?? p ?? s ?? i ?? d)?.ambiente;
  out.push(`## ${proj} (CPU ${(c ?? p ?? s ?? i ?? d).cpu}×)`, "");
  if (amb) out.push(`Ambiente: calibração ${amb.calibracaoMs} ms (loop fixo; menor = máquina mais livre) · carga do sistema ${amb.cargaSistema.join(" / ")} em ${amb.nucleos} núcleos`, "");

  out.push("### Carregamento, scroll e INP", "", "| Métrica | Valor | Meta | OK |", "|---|---|---|---|");
  if (c) {
    const cb = B("carregamento");
    const lt = c.longTasksDepoisDoLoad.filter((t) => t.duracaoMs > META.longTaskMs);
    out.push(`| TBT aprox. (FCP → load+7s) | ${fmt(c.tbtMs, cb?.tbtMs, " ms")} | < ${META.tbtMs} ms | ${ok(c.tbtMs < META.tbtMs)} |`);
    out.push(`| Maior long task no carregamento | ${fmt(c.maiorLongTaskMs, cb?.maiorLongTaskMs, " ms")} | — | — |`);
    out.push(`| Long tasks > 50 ms depois de load+3s | ${lt.length ? lt.map((t) => `${t.duracaoMs} ms @${t.inicioMs}`).join(", ") : "nenhuma"} | nenhuma | ${ok(lt.length === 0)} |`);
  }
  if (s) {
    const sb = B("scroll");
    out.push(`| FPS médio no scroll (${s.velocidadePxS} px/s, ${s.roladoPx} px) | ${fmt(s.fpsMedio, sb?.fpsMedio)} | ≥ ${META.fps} | ${ok(s.fpsMedio >= META.fps)} |`);
    out.push(`| Quadros > 50 ms no scroll | ${fmt(s.framesAcima50ms, sb?.framesAcima50ms)} de ${s.frames} (maior ${s.maiorFrameMs} ms, p95 ${s.p95FrameMs} ms) | 0 | ${ok(s.framesAcima50ms === 0)} |`);
  }
  if (i) {
    const ib = B("inp");
    for (const r of i.resultados) {
      const ant = ib?.resultados?.find((x) => x.interacao === r.interacao)?.inpMs;
      out.push(`| INP: ${r.interacao} | ${fmt(r.inpMs, ant, " ms")} | < ${META.inpMs} ms | ${ok(r.inpMs < META.inpMs)} |`);
    }
  }
  out.push("");

  if (p) {
    const pb = B("parada");
    out.push(`### Página parada (${p.janelaMs / 1000}s por seção)`, "", "| Seção | Main thread | Script | Estilo+layout | Long tasks | Maior | OK |", "|---|---|---|---|---|---|---|");
    for (const l of p.secoes) {
      const ant = pb?.secoes?.find((x) => x.secao === l.secao);
      out.push(
        `| ${l.secao} | ${fmt(l.mainThreadPct, ant?.mainThreadPct, "%")} | ${l.scriptMsPorS} ms/s | ${l.layoutStyleMsPorS} ms/s | ${l.longTasks} | ${l.maiorLongTaskMs} ms | ${ok(l.mainThreadPct < META.idlePct && l.maiorLongTaskMs <= META.longTaskMs)} |`,
      );
    }
    out.push("", `Meta: main thread < ${META.idlePct}% e nenhuma long task > ${META.longTaskMs} ms em qualquer seção.`, "");
  }
  if (d) {
    out.push("### DF-15: revelação do teaser em #blog", "", "| Cenário | Seção chegou | Revelação começou | Revelação completa | Atraso após chegar | OK (≤ 250 ms) |", "|---|---|---|---|---|---|");
    for (const x of d.cenarios) out.push(`| ${x.cenario} | ${x.chegouMs} ms | ${x.inicioRevelacaoMs} ms | ${x.revelacaoCompletaMs} ms | ${x.atrasoAposChegarMs ?? "—"} ms | ${ok(x.atrasoAposChegarMs !== null && x.atrasoAposChegarMs <= 250)} |`);
    out.push("");
  }
}
const md = out.join("\n");
const destino = process.argv[2] ?? path.join(OUT_DIR, "perf", "PERF-REPORT.md");
fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.writeFileSync(destino, md);
console.log(md);
