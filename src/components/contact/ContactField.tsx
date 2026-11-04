import {
  useCanvasAnimation,
  type CanvasFrame,
} from "../../hooks/useCanvasAnimation";
import { usePointer } from "../../hooks/usePointer";
import {
  ASCII_FRAME_INTERVAL,
  ASCII_RAMP,
  FIELD,
  clamp,
} from "../../lib/motion";

/**
 * Campo ASCII do contato (HANDOFF §4): um padrão lento de senos com vinheta,
 * mais uma onda que sai do cursor num raio de 340px.
 */
export default function ContactField() {
  const pointer = usePointer();

  function draw({ ctx, width, height, time, isStatic }: CanvasFrame) {
    ctx.clearRect(0, 0, width, height);
    ctx.font = '500 12px "Geist Mono", monospace';
    ctx.textBaseline = "top";

    const t = isStatic ? 0 : time;
    const rect = ctx.canvas.getBoundingClientRect();
    // Com reduced motion o campo não reage ao mouse (quadro estático)
    const mouseX = isStatic ? -9999 : pointer.current.x - rect.left;
    const mouseY = isStatic ? -9999 : pointer.current.y - rect.top;

    const cols = Math.ceil(width / FIELD.cellWidth);
    const rows = Math.ceil(height / FIELD.cellHeight);

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
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
        if (bright < 0.07) continue;

        const hue = 255 + near * 40 + Math.sin(t * 0.001) * 15;
        ctx.fillStyle = `hsla(${hue},90%,${50 + bright * 40}%,${Math.min(1, bright * 1.3)})`;
        ctx.fillText(
          ASCII_RAMP[Math.round(clamp(bright) * (ASCII_RAMP.length - 1))],
          x,
          y,
        );
      }
    }
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
