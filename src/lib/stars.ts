/*
 * Desenho do fundo de estrelas (HANDOFF §4), em função pura: roda tanto na
 * página quanto dentro do Web Worker (OffscreenCanvas, PERF-PLAN A8).
 */
import type { Canvas2D } from "./asciiAtlas";
import { STARS } from "./motion";

export interface Star {
  x: number;
  y: number;
  /** Profundidade: 0.1 (longe) a 1 (perto). */
  z: number;
  /** Fase da cintilação, para cada estrela piscar num tempo diferente. */
  phase: number;
  /** 2% das estrelas têm uma cruz de brilho. */
  hasSpark: boolean;
}

/** Estado guardado entre quadros (as estrelas sorteadas e a chave de tamanho). */
export interface StarsState {
  stars: Star[];
  key: string;
}

/** O que muda a cada quadro, vindo da página. */
export interface StarsFrame {
  width: number;
  height: number;
  time: number;
  isStatic: boolean;
  scrollY: number;
  /** Posição horizontal do mouse de -1 a 1. */
  pointerNx: number;
  /** Intensidade do warp (0 = desligado). */
  warpValue: number;
  settings: { areaPerStar: number; starDetails: boolean; warp: boolean };
}

function createStars(width: number, height: number, areaPerStar: number) {
  const count = Math.round((width * height) / areaPerStar);
  const stars: Star[] = [];

  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height * STARS.wrapScreens,
      z: Math.random() ** 2 * 0.9 + 0.1,
      phase: Math.random() * 6,
      hasSpark: Math.random() < STARS.sparkChance,
    });
  }

  return stars;
}

export function drawStars(ctx: Canvas2D, state: StarsState, frame: StarsFrame) {
  const {
    width,
    height,
    time,
    isStatic,
    scrollY,
    pointerNx,
    warpValue,
    settings,
  } = frame;

  // Recria as estrelas só quando a LARGURA muda (no celular a altura muda o
  // tempo todo com a barra do navegador) ou quando o nível muda a densidade
  const key = `${width}/${settings.areaPerStar}`;
  if (key !== state.key) {
    state.stars = createStars(width, height, settings.areaPerStar);
    state.key = key;
  }

  ctx.clearRect(0, 0, width, height);

  const totalHeight = height * STARS.wrapScreens;
  const warp = isStatic || !settings.warp ? 0 : warpValue;

  for (const star of state.stars) {
    // Parallax vertical com "volta" (wrap) a cada 3 alturas de tela
    const shiftedY = star.y - scrollY * star.z * STARS.parallax;
    const y = (((shiftedY % totalHeight) + totalHeight) % totalHeight) - height;
    if (y < -10 || y > height + 10) continue;

    const x = star.x + pointerNx * STARS.mouseShift * star.z;

    // Cintilação (desligada com reduced motion)
    const twinkle = isStatic
      ? 1
      : 0.7 + 0.3 * Math.sin(time * 0.002 + star.phase);
    const alpha = (0.35 + 0.6 * star.z) * twinkle;
    const size = STARS.sizeBase + star.z * STARS.sizeDepth;

    // Velocidade da luz: cada estrela vira uma linha saindo do centro da tela
    if (warp > 0.01) {
      const length = warp * star.z * 0.6;
      ctx.strokeStyle = `rgba(${STARS.color}, ${alpha})`;
      ctx.lineWidth = 0.6 + star.z * 1.8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (x - width / 2) * length, y + (y - height / 2) * length);
      ctx.stroke();
      continue;
    }

    // Halo lavanda nas estrelas mais próximas
    if (settings.starDetails && star.z > STARS.haloDepth) {
      ctx.fillStyle = `rgba(${STARS.haloColor}, ${0.12 * twinkle})`;
      ctx.fillRect(x - size, y - size, size * 3, size * 3);
      ctx.fillStyle = `rgba(${STARS.nearColor}, ${alpha})`;
    } else {
      ctx.fillStyle = `rgba(${STARS.color}, ${alpha})`;
    }
    ctx.fillRect(x, y, size, size);

    // Cruz de brilho
    if (settings.starDetails && star.hasSpark) {
      const length = 3 + 4 * twinkle;
      ctx.fillStyle = `rgba(${STARS.sparkColor}, ${0.55 * twinkle})`;
      ctx.fillRect(x + size / 2 - 0.5, y - length, 1, length * 2 + size);
      ctx.fillRect(x - length, y + size / 2 - 0.5, length * 2 + size, 1);
    }
  }
}
