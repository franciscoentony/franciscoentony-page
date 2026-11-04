// Garante um servidor para os scripts que não passam pelo Playwright (Lighthouse).
// Sem QA_BASE_URL: sobe `bun run build && bun run preview` na raiz do repo.
import { spawn } from "node:child_process";
import { httpGet } from "./http.mjs";
import { BASE_URL, IS_LOCAL, SERVER_COMMAND } from "../qa.config.mjs";

async function up(url) {
  try {
    const r = await httpGet(url);
    return r.status < 500;
  } catch {
    return false;
  }
}

export async function ensureServer() {
  if (!IS_LOCAL || (await up(BASE_URL))) return () => {};
  console.log(`[qa] subindo servidor local: ${SERVER_COMMAND}`);
  const child = spawn(SERVER_COMMAND, { cwd: "..", shell: true, stdio: "inherit", detached: true });
  const t0 = Date.now();
  while (!(await up(BASE_URL))) {
    if (Date.now() - t0 > 240_000) throw new Error("servidor local não respondeu em 240s");
    if (child.exitCode !== null) throw new Error(`servidor saiu com código ${child.exitCode}`);
    await new Promise((r) => setTimeout(r, 1000));
  }
  return () => {
    try {
      process.kill(-child.pid);
    } catch {}
  };
}
