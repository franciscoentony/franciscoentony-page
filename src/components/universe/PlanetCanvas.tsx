import { useEffect, useRef, useState, type RefObject } from "react";
import {
  useCanvasAnimation,
  type CanvasFrame,
} from "../../hooks/useCanvasAnimation";
import { usePointer } from "../../hooks/usePointer";
import { resolveAssetPath } from "../../utils/resolvePath";
import { HeroObjects } from "../../lib/heroObjects";
import type { HeroObjectsLink } from "../../lib/heroObjectsLink";
import { drawPlanet, type PlanetLight } from "../../lib/planet";
import { useQuality } from "../../hooks/useQuality";

interface PlanetCanvasProps {
  /** Progresso suavizado da seção Universe (0 a 1). Sem ele, progresso = 0. */
  progressRef?: RefObject<number>;
  /** Objetos do hero (satélite, astronauta, meteoro) no mesmo canvas. */
  objects?: HeroObjectsLink;
}

/** Canvas do planeta ASCII (fica atrás do texto da seção Universe). */
/** Fonte que o worker do planeta carrega (o worker não enxerga as fontes da página). */
const PLANET_FONT_URL = resolveAssetPath("/fonts/geist-mono-latin.woff2");

export default function PlanetCanvas({
  progressRef,
  objects,
}: PlanetCanvasProps) {
  // O canvas vai para um Web Worker (A8) e não volta: quando o nível de
  // qualidade muda, remontamos o <canvas> (key) para começar do zero.
  const { quality } = useQuality();
  return (
    <PlanetCanvasInner
      key={quality}
      progressRef={progressRef}
      objects={objects}
    />
  );
}

function PlanetCanvasInner({ progressRef, objects }: PlanetCanvasProps) {
  const pointer = usePointer();
  // Parâmetros do nível de qualidade (células, faixas de matiz, fps)
  const { settings } = useQuality();
  const light = useRef<PlanetLight>({ x: -0.5, y: -0.5 });
  // true depois de mandar o quadro "limpo" do fim da seção (S-A)
  const clearedAfterEnd = useRef(false);
  // Rastro do meteoro: 26 posições no Alto, 14 no Médio
  const trailLength = useQuality().quality === "alto" ? 26 : 14;

  // Sem worker, a simulação dos objetos roda aqui na página. Com worker,
  // o onPost (abaixo) troca o destino do ponteiro para lá.
  const [localObjects] = useState(() => (objects ? new HeroObjects() : null));
  useEffect(() => {
    if (objects && localObjects) {
      objects.setSender((input) => localObjects.input(input));
    }
  }, [objects, localObjects]);

  /** Estado dos objetos que vai junto com cada quadro. */
  function objectsFrame(isStatic: boolean) {
    if (!objects) return undefined;
    return { isStatic, trailLength, textBox: objects.getTextBox() };
  }

  function draw({ ctx, width, height, time, isStatic }: CanvasFrame) {
    const progress = progressRef && !isStatic ? progressRef.current : 0;

    // Depois do fim da seção o planeta já se dissolveu: não precisa desenhar
    if (progress >= 1) {
      ctx.clearRect(0, 0, width, height);
      return;
    }

    const scene = drawPlanet(
      ctx,
      width,
      height,
      time,
      progress,
      pointer.current,
      light.current,
      { hueBands: settings.hueBands, cellScale: settings.cellScale },
    );

    // Objetos do hero na página (sem worker): mesma simulação do worker
    const simulation = localObjects;
    const extra = objectsFrame(isStatic);
    if (!simulation || !extra || !objects) return;
    const frame = {
      width,
      height,
      time,
      progress,
      hueBands: settings.hueBands,
      ...extra,
    };
    simulation.step(frame, scene);
    simulation.draw(ctx, frame, scene);
    objects.emitPositions(simulation.snapshot(isStatic));
  }

  const canvasRef = useCanvasAnimation(draw, {
    frameInterval: settings.asciiInterval,
    // Desenha num Web Worker quando o navegador suporta (A8); senão, `draw`
    worker: {
      kind: "planet",
      fontUrl: PLANET_FONT_URL,
      frameData: (frame) => {
        const progress =
          progressRef && !frame.isStatic ? progressRef.current : 0;
        // Depois do fim da seção, o worker só precisa limpar uma vez (S-A)
        if (progress >= 1 && clearedAfterEnd.current) return null;
        clearedAfterEnd.current = progress >= 1;
        return {
          ...frame,
          progress,
          pointer: { ...pointer.current },
          hueBands: settings.hueBands,
          cellScale: settings.cellScale,
          objects: objectsFrame(frame.isStatic),
        };
      },
      // Posições dos objetos calculadas no worker
      onDrawn: (message) => {
        const positions = message.objects as number[] | undefined;
        if (positions) objects?.emitPositions(positions);
      },
      // Com worker, o ponteiro vai para lá; sem ele, volta para a página
      onPost: (post) => {
        if (!objects) return;
        objects.setSender(
          post
            ? (input) => post({ type: "objects", input })
            : (input) => localObjects?.input(input),
        );
      },
    },
  });

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 size-full"
    />
  );
}
