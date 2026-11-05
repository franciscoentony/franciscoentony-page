import { useRef, type RefObject } from "react";
import {
  useCanvasAnimation,
  type CanvasFrame,
} from "../../hooks/useCanvasAnimation";
import { usePointer } from "../../hooks/usePointer";
import { getScrollProgress } from "../../lib/motion";
import { drawPlanet, type PlanetLight } from "../../lib/planet";
import { useQuality } from "../../hooks/useQuality";

interface PlanetCanvasProps {
  /** Seção alta da qual lemos o progresso de scroll. Sem ela, progresso = 0. */
  sectionRef?: RefObject<HTMLElement | null>;
}

/** Canvas do planeta ASCII (fica atrás do texto da seção Universe). */
export default function PlanetCanvas({ sectionRef }: PlanetCanvasProps) {
  const pointer = usePointer();
  // Parâmetros do nível de qualidade (células, faixas de matiz, fps)
  const { settings } = useQuality();
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
      { hueBands: settings.hueBands, cellScale: settings.cellScale },
    );
  }

  const canvasRef = useCanvasAnimation(draw, {
    frameInterval: settings.asciiInterval,
  });

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 size-full"
    />
  );
}
