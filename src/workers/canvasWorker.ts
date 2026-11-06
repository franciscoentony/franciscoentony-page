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
 *   objects → ponteiro nos objetos do hero (grab/move/release/nudge)
 *
 * Objetos do hero (SPEC-HERO-OBJETOS): desenhados no mesmo canvas, logo
 * depois do planeta, com a física aqui dentro (fonte única da verdade).
 * O "drawn" leva as posições ([x, y, r, pegável] × 3) para a página
 * posicionar as áreas de pegar.
 */
import {
  HeroObjects,
  type HeroObjectsFrame,
  type HeroObjectsInput,
  type TextBox,
} from "../lib/heroObjects";
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
  /** Objetos do hero (só no hero da Home). */
  objects?: {
    isStatic: boolean;
    trailLength: number;
    textBox: TextBox | null;
  };
}

// "self" aqui é o escopo do worker (usamos o tipo Worker para ter postMessage)
const scope = self as unknown as Worker & { fonts?: FontFaceSet };

let canvas: OffscreenCanvas | null = null;
let ctx: OffscreenCanvasRenderingContext2D | null = null;
let kind: WorkerKind = "stars";
let dpr = 1;

const starsState: StarsState = { stars: [], key: "" };
const planetLight: PlanetLight = { x: -0.5, y: -0.5 };
const heroObjects = new HeroObjects();

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

  if (message.type === "objects") {
    heroObjects.input(message.input as HeroObjectsInput);
    return;
  }

  if (message.type === "frame") {
    let objects: number[] | undefined;
    try {
      objects = drawFrame(message.data);
    } finally {
      // Avisa a página que terminou (contrapressão, P5 S-A), mesmo se o
      // desenho der erro: senão a página espera para sempre e o planeta
      // congela (I-3). Com os objetos do hero, vão as posições deles.
      scope.postMessage({ type: "drawn", objects });
    }
  }
};

/** Desenha e devolve as posições dos objetos do hero (se houver). */
function drawFrame(data: StarsFrame | PlanetFrame): number[] | undefined {
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
  const scene = drawPlanet(
    ctx,
    frame.width,
    frame.height,
    frame.time,
    frame.progress,
    frame.pointer,
    planetLight,
    { hueBands: frame.hueBands, cellScale: frame.cellScale, dpr },
  );

  if (!frame.objects) return;
  const objectsFrame: HeroObjectsFrame = {
    width: frame.width,
    height: frame.height,
    time: frame.time,
    progress: frame.progress,
    hueBands: frame.hueBands,
    dpr,
    ...frame.objects,
  };
  heroObjects.step(objectsFrame, scene);
  heroObjects.draw(ctx, objectsFrame, scene);
  return heroObjects.snapshot(frame.objects.isStatic);
}
