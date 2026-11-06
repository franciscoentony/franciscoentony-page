// Gera o baseline ("antes") contra produção: Playwright + Lighthouse em qa/baseline/.
import { spawnSync } from "node:child_process";
const env = { ...process.env, QA_BASE_URL: process.env.QA_BASE_URL ?? "https://franciscoentony.com", QA_OUT: "baseline" };
const pw = spawnSync("bunx", ["playwright", "test"], { stdio: "inherit", env });
spawnSync("node", ["scripts/summarize.mjs"], { stdio: "inherit", env });
const lh = spawnSync("node", ["scripts/lighthouse.mjs"], { stdio: "inherit", env });
console.log(`\n[baseline] playwright exit=${pw.status} · lighthouse exit=${lh.status} (falhas são esperadas no "antes")`);
