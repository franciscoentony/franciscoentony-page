import { useRef } from "react";
import {
  useCanvasAnimation,
  type CanvasFrame,
} from "../../hooks/useCanvasAnimation";
import { usePointer } from "../../hooks/usePointer";
import { useQuality } from "../../hooks/useQuality";
import { ASCII_FRAME_INTERVAL, warpState } from "../../lib/motion";
import { drawStars, type StarsState } from "../../lib/stars";

/**
 * Fundo de estrelas com parallax (HANDOFF §4, "Fundo de estrelas").
 * Canvas fixo atrás de todo o conteúdo. No fim da seção Universe as estrelas
 * viram linhas saindo do centro (efeito "velocidade da luz", warpState).
 */
export default function Starfield() {
  // O canvas vai para um Web Worker (A8) e não volta: quando o nível de
  // qualidade muda, remontamos o <canvas> (key) para começar do zero.
  const { quality } = useQuality();
  return <StarfieldCanvas key={quality} />;
}

function StarfieldCanvas() {
  const pointer = usePointer();
  // Nível de qualidade: menos estrelas, sem halo/cruz e sem warp no Médio/Baixo
  const { settings } = useQuality();
  const state = useRef<StarsState>({ stars: [], key: "" });

  function draw({ ctx, width, height, time, isStatic }: CanvasFrame) {
    drawStars(ctx, state.current, {
      width,
      height,
      time,
      isStatic,
      scrollY: window.scrollY,
      pointerNx: pointer.current.nx,
      warpValue: warpState.value,
      settings,
    });
  }

  // ~30fps, como os outros canvases (D9 / R1 item 9)
  const canvasRef = useCanvasAnimation(draw, {
    frameInterval: ASCII_FRAME_INTERVAL,
    // Desenha num Web Worker quando o navegador suporta (A8); senão, `draw`
    worker: {
      kind: "stars",
      frameData: (frame) => ({
        ...frame,
        scrollY: window.scrollY,
        pointerNx: pointer.current.nx,
        warpValue: warpState.value,
        settings: {
          areaPerStar: settings.areaPerStar,
          starDetails: settings.starDetails,
          warp: settings.warp,
        },
      }),
    },
  });

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 size-full"
    />
  );
}
