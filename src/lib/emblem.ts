/*
 * Emblema do projeto em ASCII (adendo v3): o mesmo desenho SDF dos cards da
 * Home (src/lib/asciiShapes.ts), maior e sem moldura. A "luz" segue o
 * ponteiro: as células perto dele ficam mais claras.
 */
import { drawAsciiGrid, getAsciiAtlas, type Canvas2D } from "./asciiAtlas";
import { shapes, type ShapeName } from "./asciiShapes";
import { clamp } from "./motion";

export interface EmblemFrame {
  ctx: Canvas2D;
  width: number;
  height: number;
  /** Tempo em ms (0 = quadro parado). */
  time: number;
  shape: ShapeName;
  /** true: o desenho ondula e o brilho de fora pulsa (emblema do hero). */
  live: boolean;
  /** Ponteiro em fração do canvas (0..1). Fora: valores negativos. */
  pointer: { x: number; y: number };
  /** settings.cellScale e settings.hueBands do nível de qualidade. */
  cellScale: number;
  hueBands: number;
}

/** Ponteiro "fora do canvas" (sem luz). */
export const NO_POINTER = { x: -9, y: -9 };

export function drawEmblem({
  ctx,
  width,
  height,
  time,
  shape,
  live,
  pointer,
  cellScale,
  hueBands,
}: EmblemFrame) {
  ctx.clearRect(0, 0, width, height);
  const fontSize = Math.round(10 * cellScale);
  const cellWidth = fontSize * 0.62;
  const cellHeight = fontSize * 1.12;
  const cols = Math.ceil(width / cellWidth);
  const rows = Math.ceil(height / cellHeight);
  const scale = Math.min(height * 0.8, width * 0.66);
  const distanceTo = shapes[shape];
  const t = time;

  const atlas = getAsciiAtlas({
    font: `600 ${fontSize}px "Geist Mono", monospace`,
    fontSize,
    hueBands,
    saturations: [90],
    lightness: (bright) => 55 + bright * 35,
  });

  drawAsciiGrid(ctx, atlas, {
    cols,
    rows,
    cellWidth,
    cellHeight,
    cell: (i, j, out) => {
      const x = (i * cellWidth - width / 2) / scale;
      const y = (j * cellHeight - height / 2) / scale;
      const wobble = live ? Math.sin(t * 0.003 + i * 0.3 + j * 0.2) * 0.03 : 0;
      const d = distanceTo(x + wobble, y);

      // Dentro da forma: claro. Fora: um brilho fraco que pulsa.
      let bright =
        d < 0
          ? clamp(0.55 - d * 1.2)
          : clamp(0.22 - d * 0.9) *
            (0.4 +
              0.6 *
                Math.sin(t * 0.002 + i * 0.7) *
                Math.cos(j * 0.9 + t * 0.001));

      // Luz do ponteiro (distância corrigida pela proporção do canvas)
      if (bright > 0.05) {
        const dx = ((i * cellWidth) / width - pointer.x) * (width / height);
        const dy = (j * cellHeight) / height - pointer.y;
        bright = clamp(bright + Math.max(0, 0.32 - Math.hypot(dx, dy)) * 0.9);
      }
      if (bright < 0.08) return false;

      out.bright = bright;
      out.hue = 255 + x * 40;
      out.alpha = 0.25 + bright * 0.75;
      return true;
    },
  });
}
