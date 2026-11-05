import { useRef } from "react";
import {
  useCanvasAnimation,
  type CanvasFrame,
} from "../../hooks/useCanvasAnimation";
import { usePointer } from "../../hooks/usePointer";
import { FIELD } from "../../lib/motion";
import { drawAsciiGrid, getAsciiAtlas } from "../../lib/asciiAtlas";
import { useQuality } from "../../hooks/useQuality";

/**
 * Campo ASCII do contato (HANDOFF §4): um padrão lento de senos com vinheta,
 * mais uma onda que sai do cursor num raio de 340px.
 */
export default function ContactField() {
  const pointer = usePointer();
  // Parâmetros do nível de qualidade (células 1.2× maiores no Médio/Baixo)
  const { motion, settings } = useQuality();
  // Vinheta pré-calculada para o tamanho atual do canvas (A1b)
  const vignetteCache = useRef<{ key: string; values: Float32Array }>({
    key: "",
    values: new Float32Array(0),
  });

  function draw({ ctx, width, height, time, isStatic }: CanvasFrame) {
    ctx.clearRect(0, 0, width, height);
    const t = isStatic ? 0 : time;
    const rect = ctx.canvas.getBoundingClientRect();
    // Com reduced motion o campo não reage ao mouse (quadro estático)
    // Quadro parado: no nível Baixo a onda fica no centro; com reduced
    // motion, sem onda nenhuma
    let mouseX = pointer.current.x - rect.left;
    let mouseY = pointer.current.y - rect.top;
    if (isStatic) {
      mouseX = motion === "reduced" ? -9999 : width / 2;
      mouseY = motion === "reduced" ? -9999 : height / 2;
    }
    const cellWidth = FIELD.cellWidth * settings.fieldCellScale;
    const cellHeight = FIELD.cellHeight * settings.fieldCellScale;
    const fontSize = Math.round(12 * settings.fieldCellScale * 10) / 10;
    const hueShift = Math.sin(t * 0.001) * 15;

    const cols = Math.ceil(width / cellWidth);
    const rows = Math.ceil(height / cellHeight);

    const atlas = getAsciiAtlas({
      font: `500 ${fontSize}px "Geist Mono", monospace`,
      fontSize,
      hueBands: settings.hueBands,
      saturations: [90],
      lightness: (bright) => 50 + bright * 40,
    });

    // Pré-cálculos (A1b): o padrão base é sen(coluna) × cos(linha), então
    // calculamos cada seno/cosseno uma vez por coluna/linha, não por célula.
    const columnWave = new Float32Array(cols);
    for (let i = 0; i < cols; i++)
      columnWave[i] = Math.sin(i * 0.21 + t * 0.0006);
    const rowWave = new Float32Array(rows);
    for (let j = 0; j < rows; j++) rowWave[j] = Math.cos(j * 0.27 - t * 0.0005);

    // A vinheta só depende do tamanho: calcula de novo só quando ele muda
    const vignetteKey = `${cols}x${rows}x${width}x${height}`;
    if (vignetteCache.current.key !== vignetteKey) {
      const values = new Float32Array(cols * rows);
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const x = i * cellWidth;
          const y = j * cellHeight;
          values[j * cols + i] =
            1 -
            Math.min(
              1,
              Math.hypot(
                (x - width / 2) / (width * 0.55),
                (y - height / 2) / (height * 0.6),
              ),
            );
        }
      }
      vignetteCache.current = { key: vignetteKey, values };
    }
    const vignette = vignetteCache.current.values;
    const radiusSquared = FIELD.cursorRadius * FIELD.cursorRadius;

    drawAsciiGrid(ctx, atlas, {
      cols,
      rows,
      cellWidth,
      cellHeight,
      cell: (i, j, out) => {
        const x = i * cellWidth;
        const y = j * cellHeight;
        const cellVignette = vignette[j * cols + i];

        // Onda do cursor: só existe a até 340px dele
        const dx = x - mouseX;
        const dy = y - mouseY;
        const distanceSquared = dx * dx + dy * dy;
        let near = 0;
        let cursorPart = 0;
        if (distanceSquared < radiusSquared) {
          const distance = Math.sqrt(distanceSquared);
          const wave = Math.sin(distance * 0.035 - t * 0.004) * 0.5 + 0.5;
          near = 1 - distance / FIELD.cursorRadius;
          cursorPart = Math.pow(near, 1.5) * wave * 0.9;
        } else if (cellVignette * 0.3 < 0.07) {
          return false; // longe do cursor e na borda escura: nunca aparece
        }

        const base = columnWave[i] * rowWave[j] * 0.5 + 0.5;
        const bright = base * 0.3 * cellVignette + cursorPart;
        if (bright < 0.07) return false;

        out.bright = bright;
        out.hue = 255 + near * 40 + hueShift;
        out.alpha = Math.min(1, bright * 1.3);
        return true;
      },
    });
  }

  const canvasRef = useCanvasAnimation(draw, {
    frameInterval: settings.fieldInterval,
  });

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 size-full"
    />
  );
}
