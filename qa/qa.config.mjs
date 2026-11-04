// Configuração central do QA. Tudo pode ser sobrescrito por variáveis de ambiente.
export const LOCAL_PORT = Number(process.env.QA_PORT ?? 4173);
export const LOCAL_URL = `http://localhost:${LOCAL_PORT}`;

/** URL alvo. Sem QA_BASE_URL, sobe `bun run build && bun run preview` na raiz. */
export const BASE_URL = (process.env.QA_BASE_URL ?? LOCAL_URL).replace(/\/$/, "");
export const IS_LOCAL = !process.env.QA_BASE_URL;

/** Pasta de saída (reports/ por padrão; o baseline usa baseline/). */
export const OUT_DIR = process.env.QA_OUT ?? "reports";

/** Larguras exigidas pelo DoD / D1. Altura típica de cada classe de aparelho. */
export const VIEWPORTS = [
  { name: "375", width: 375, height: 812, mobile: true },
  { name: "768", width: 768, height: 1024, mobile: true },
  { name: "1280", width: 1280, height: 800, mobile: false },
  { name: "1440", width: 1440, height: 900, mobile: false },
];

/** Tokens do HANDOFF usados nas asserções. */
export const TOKENS = {
  muted: "rgb(72, 72, 77)", // #48484D, contraste ~2.3:1: só transitório/decorativo
  focusOutline: "rgb(201, 188, 255)", // #C9BCFF
};

/** Comando do servidor local (padrão pedido: build + preview). QA_SKIP_BUILD=1 só serve o dist/ existente. */
export const SERVER_COMMAND = process.env.QA_SKIP_BUILD
  ? `bun run preview --port ${LOCAL_PORT} --strictPort`
  : `bun run build && bun run preview --port ${LOCAL_PORT} --strictPort`;
