import { useRef, type RefObject } from "react";
import {
  useCanvasAnimation,
  type CanvasFrame,
} from "../../hooks/useCanvasAnimation";
import { shapes, type ShapeName } from "../../lib/asciiShapes";
import {
  ASCII_FRAME_INTERVAL,
  ASCII_RAMP,
  clamp,
  lerp,
} from "../../lib/motion";

interface ProjectThumbProps {
  shape: ShapeName;
  /** true enquanto o mouse está sobre o card: a forma "esquenta" e mexe mais. */
  activeRef: RefObject<boolean>;
}

/** Ícone do projeto desenhado em ASCII (58% de cima do card). */
export default function ProjectThumb({ shape, activeRef }: ProjectThumbProps) {
  const heat = useRef(0);

  function draw({ ctx, width, height, time, isStatic }: CanvasFrame) {
    ctx.clearRect(0, 0, width, height);
    ctx.font = '600 9px "Geist Mono", monospace';
    ctx.textBaseline = "top";

    heat.current = lerp(heat.current, activeRef.current ? 1 : 0, 0.08);
    const t = isStatic ? 0 : time;
    const distanceTo = shapes[shape];

    const cellWidth = 6;
    const cellHeight = 10;
    const cols = Math.ceil(width / cellWidth);
    const rows = Math.ceil(height / cellHeight);
    const scale = Math.min(width, height) * 0.62;

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = (i * cellWidth - width / 2) / scale;
        const y = (j * cellHeight - height / 2) / scale;
        const wobble =
          Math.sin(t * 0.003 + i * 0.3 + j * 0.2) *
          0.03 *
          (1 + heat.current * 3);
        const d = distanceTo(x + wobble, y);

        // Dentro da forma: claro. Fora: um "brilho" fraco que pulsa.
        const bright =
          d < 0
            ? clamp(0.55 - d * 1.2)
            : clamp(0.25 - d * 0.9) *
              (0.4 +
                0.6 *
                  Math.sin(t * 0.002 + i * 0.7) *
                  Math.cos(j * 0.9 + t * 0.001));
        if (bright < 0.08) continue;

        const hue = 255 + x * 40 + heat.current * 60 * Math.sin(t * 0.002 + j);
        ctx.fillStyle = `hsla(${hue},90%,${55 + bright * 35}%,${0.25 + bright * 0.75})`;
        ctx.fillText(
          ASCII_RAMP[Math.round(bright * (ASCII_RAMP.length - 1))],
          i * cellWidth,
          j * cellHeight,
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
      className="block h-[220px] w-full shrink-0 border-b border-line tab:h-[58%]"
    />
  );
}
