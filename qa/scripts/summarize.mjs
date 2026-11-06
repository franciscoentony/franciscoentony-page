// Resume <QA_OUT>/results.json do Playwright em <QA_OUT>/playwright-summary.md
import fs from "node:fs";
import path from "node:path";
import { OUT_DIR, BASE_URL } from "../qa.config.mjs";

const data = JSON.parse(fs.readFileSync(path.join(OUT_DIR, "results.json"), "utf8"));
const rows = [];
const walk = (suite, trail = []) => {
  for (const s of suite.suites ?? []) walk(s, [...trail, s.title]);
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests) {
      const r = t.results.at(-1);
      const strip = (s) => s.replace(/\u001b\[[0-9;]*m/g, "");
      rows.push({
        file: spec.file,
        title: spec.title,
        project: t.projectName,
        status: t.status === "skipped" ? "skipped" : r?.status === "passed" && !(r.errors?.length) ? "passed" : "failed",
        errors: (r?.errors ?? []).map((e) => strip(e.message ?? "").split("\n").filter(Boolean).slice(0, 14).join("\n")),
        annotations: [...new Set([...(t.annotations ?? []), ...(r?.annotations ?? [])].map((a) => `${a.type}: ${a.description}`))],
      });
    }
  }
};
walk(data);
const n = (s) => rows.filter((r) => r.status === s).length;
const failed = rows.filter((r) => r.status === "failed");
const md = [
  `# Playwright — ${BASE_URL}`,
  "",
  `Gerado em ${new Date().toISOString()} · ✅ ${n("passed")} passaram · ❌ ${n("failed")} falharam · ⏭ ${n("skipped")} pulados (fora da largura alvo ou recurso ainda inexistente)`,
  "",
  "## Falhas",
  "",
  ...failed.flatMap((r) => [`### ❌ [${r.project}] ${r.title}`, "", "```", ...r.errors, "```", ""]),
  "## Anotações (status HTTP, métricas)",
  "",
  ...rows.filter((r) => r.annotations.length && r.status !== "skipped").map((r) => `- [${r.project}] ${r.title}: ${r.annotations.filter((a) => !a.startsWith("skip")).join(" · ")}`),
  "",
].join("\n");
fs.writeFileSync(path.join(OUT_DIR, "playwright-summary.md"), md);
console.log(md.split("\n").slice(0, 4).join("\n"));
