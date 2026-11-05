/*
 * Web Worker que desenha o planeta ou as estrelas num OffscreenCanvas
 * (PERF-PLAN A8). Assim o desenho, que é a parte cara, sai da main thread.
 *
 * Quem decide QUANDO desenhar continua sendo a página (useCanvasAnimation:
 * visibilidade, pausa fora da tela, nível de qualidade, quadro estático).
 * A página manda uma mensagem "frame" com o estado do quadro e este worker
 * só desenha.
 *
 * Mensagens recebidas:
 *   check   → responde se dá para rodar aqui (OffscreenCanvas + fontes)
 *   init    → recebe o canvas transferido e o tipo ("stars" | "planet")
 *   resize  → novo tamanho do canvas
 *   frame   → desenha um quadro e responde "drawn"
 */
import { drawPlanet, type PlanetLight } from "../lib/planet";
import { drawStars, type StarsFrame, type StarsState } from "../lib/stars";

export type WorkerKind = "stars" | "planet";

/** Estado de um quadro do planeta, vindo da página. */
export interface PlanetFrame {
  width: number;
  height: number;
  time: number;
  progress: number;
  pointer: { x: number; y: number; nx: number; ny: number };
  hueBands: number;
  cellScale: number;
}

// "self" aqui é o escopo do worker (usamos o tipo Worker para ter postMessage)
const scope = self as unknown as Worker & { fonts?: FontFaceSet };

let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let kind: WorkerKind = "stars";
let dpr = 1;

const starsState: StarsState = { stars: [], key: "" };
const planetLight: PlanetLight = { x: -0.5, y: -0.5 };

/** Carrega a Geist Mono dentro do worker (as fontes da página não chegam aqui). */
async function loadFont(fontUrl: string) {
  const face = new FontFace("Geist Mono", `url(${fontUrl})`, {
    weight: "400 700",
  });
  await face.load();
  scope.fonts?.add(face);
}

scope.onmessage = async (event: MessageEvent) => {
  const message = event.data;

  if (message.type === "check") {
    let ok = typeof OffscreenCanvas !== "undefined";
    if (ok && message.fontUrl) {
      try {
        ok = typeof FontFace !== "undefined" && Boolean(scope.fonts);
        if (ok) await loadFont(message.fontUrl);
      } catch {
        ok = false;
      }
    }
    scope.postMessage({ type: "capabilities", ok });
    return;
  }

  if (message.type === "init") {
    canvas = message.canvas as OffscreenCanvas;
    kind = message.kind;
    ctx = canvas.getContext("2d");
    return;
  }

  if (!canvas || !ctx) return;

  if (message.type === "resize") {
    dpr = message.dpr;
    canvas.width = Math.max(1, Math.round(message.width * dpr));
    canvas.height = Math.max(1, Math.round(message.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return;
  }

  if (message.type === "frame") {
    drawFrame(message.data);
    // Avisa a página que terminou (contrapressão, P5 S-A)
    scope.postMessage({ type: "drawn" });
  }
};

function drawFrame(data: StarsFrame | PlanetFrame) {
  if (!ctx) return;

  if (kind === "stars") {
    drawStars(ctx, starsState, data as StarsFrame);
    return;
  }

  const frame = data as PlanetFrame;
  // Depois do fim da seção o planeta já se dissolveu: só limpa
  if (frame.progress >= 1) {
    ctx.clearRect(0, 0, frame.width, frame.height);
    return;
  }
  drawPlanet(
    ctx,
    frame.width,
    frame.height,
    frame.time,
    frame.progress,
    frame.pointer,
    planetLight,
    { hueBands: frame.hueBands, cellScale: frame.cellScale, dpr },
  );
}
