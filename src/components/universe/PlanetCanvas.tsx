import { useRef, type RefObject } from "react";
import {
  useCanvasAnimation,
  type CanvasFrame,
} from "../../hooks/useCanvasAnimation";
import { usePointer } from "../../hooks/usePointer";
import { ASCII_FRAME_INTERVAL, getScrollProgress } from "../../lib/motion";
import { drawPlanet, type PlanetLight } from "../../lib/planet";

interface PlanetCanvasProps {
  /** Seção alta da qual lemos o progresso de scroll. Sem ela, progresso = 0. */
  sectionRef?: RefObject<HTMLElement | null>;
}

/** Canvas do planeta ASCII (fica atrás do texto da seção Universe). */
export default function PlanetCanvas({ sectionRef }: PlanetCanvasProps) {
  const pointer = usePointer();
  const light = useRef<PlanetLight>({ x: -0.5, y: -0.5 });

  function draw({ ctx, width, height, time, isStatic }: CanvasFrame) {
    const section = sectionRef?.current;
    const progress = section && !isStatic ? getScrollProgress(section) : 0;

    // Depois do fim da seção o planeta já se dissolveu: não precisa desenhar
    if (progress >= 1) {
      ctx.clearRect(0, 0, width, height);
      return;
    }

    drawPlanet(
      ctx,
      width,
      height,
      time,
      progress,
      pointer.current,
      light.current,
    );
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
