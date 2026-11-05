import {
  useCanvasAnimation,
  type CanvasFrame,
} from "../../hooks/useCanvasAnimation";
import { usePointer } from "../../hooks/usePointer";
import { ASCII_FRAME_INTERVAL, FIELD } from "../../lib/motion";
import { drawAsciiGrid, getAsciiAtlas } from "../../lib/asciiAtlas";

/**
 * Campo ASCII do contato (HANDOFF §4): um padrão lento de senos com vinheta,
 * mais uma onda que sai do cursor num raio de 340px.
 */
export default function ContactField() {
  const pointer = usePointer();

  function draw({ ctx, width, height, time, isStatic }: CanvasFrame) {
    ctx.clearRect(0, 0, width, height);
    const t = isStatic ? 0 : time;
    const rect = ctx.canvas.getBoundingClientRect();
    // Com reduced motion o campo não reage ao mouse (quadro estático)
    const mouseX = isStatic ? -9999 : pointer.current.x - rect.left;
    const mouseY = isStatic ? -9999 : pointer.current.y - rect.top;
    const hueShift = Math.sin(t * 0.001) * 15;

    const cols = Math.ceil(width / FIELD.cellWidth);
    const rows = Math.ceil(height / FIELD.cellHeight);

    const atlas = getAsciiAtlas({
      font: '500 12px "Geist Mono", monospace',
      fontSize: 12,
      hueBands: 6,
      saturations: [90],
      lightness: (bright) => 50 + bright * 40,
    });

    drawAsciiGrid(ctx, atlas, {
      cols,
      rows,
      cellWidth: FIELD.cellWidth,
      cellHeight: FIELD.cellHeight,
      cell: (i, j, out) => {
        const x = i * FIELD.cellWidth;
        const y = j * FIELD.cellHeight;
        const distance = Math.hypot(x - mouseX, y - mouseY);

        const wave = Math.sin(distance * 0.035 - t * 0.004) * 0.5 + 0.5;
        const near = Math.max(0, 1 - distance / FIELD.cursorRadius);
        const base =
          Math.sin(i * 0.21 + t * 0.0006) *
            Math.cos(j * 0.27 - t * 0.0005) *
            0.5 +
          0.5;
        const vignette =
          1 -
          Math.min(
            1,
            Math.hypot(
              (x - width / 2) / (width * 0.55),
              (y - height / 2) / (height * 0.6),
            ),
          );

        const bright = base * 0.3 * vignette + Math.pow(near, 1.5) * wave * 0.9;
        if (bright < 0.07) return false;

        out.bright = bright;
        out.hue = 255 + near * 40 + hueShift;
        out.alpha = Math.min(1, bright * 1.3);
        return true;
      },
    });
  }

  const canvasRef = useCanvasAnimation(draw, {
    frameInterval: ASCII_FRAME_INTERVAL,
  });

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 size-full"
    />
  );
}
