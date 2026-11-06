import { useEffect, useRef, type RefObject } from "react";
import {
  useCanvasAnimation,
  type CanvasFrame,
} from "../../hooks/useCanvasAnimation";
import { useQuality } from "../../hooks/useQuality";
import type { ShapeName } from "../../lib/asciiShapes";
import { drawEmblem, NO_POINTER } from "../../lib/emblem";
import { MAX_DPR } from "../../lib/motion";

/** Mouse de verdade (a luz não existe no toque). */
const finePointer = () =>
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;

interface EmblemProps {
  shape: ShapeName;
  className?: string;
}

/**
 * Liga a luz que segue o ponteiro (só com mouse e fora do nível Baixo/RM).
 * `host` é quem recebe o movimento; o ponto é medido no canvas.
 */
function usePointerLight(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  pointer: RefObject<{ x: number; y: number }>,
  hostOf: (canvas: HTMLCanvasElement) => HTMLElement | null,
  enabled: boolean,
  onChange?: () => void,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas && hostOf(canvas);
    if (!canvas || !host || !enabled || !finePointer()) return;

    function handleMove(event: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      pointer.current.x = (event.clientX - rect.left) / rect.width;
      pointer.current.y = (event.clientY - rect.top) / rect.height;
      onChange?.();
    }
    function handleLeave() {
      pointer.current = { ...NO_POINTER };
      onChange?.();
    }
    host.addEventListener("pointermove", handleMove);
    host.addEventListener("pointerleave", handleLeave);
    return () => {
      host.removeEventListener("pointermove", handleMove);
      host.removeEventListener("pointerleave", handleLeave);
    };
    // hostOf e onChange são estáveis para quem usa (funções do módulo/ref)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}

/**
 * Emblema do hero: animado (30 fps no Alto, 20 fps e célula 1.3 no Médio,
 * 1 quadro no Baixo), só enquanto visível (useCanvasAnimation).
 */
export function LiveEmblem({ shape, className = "" }: EmblemProps) {
  const { quality, settings } = useQuality();
  const isStatic = quality === "baixo";
  const pointer = useRef({ ...NO_POINTER });

  function draw({ ctx, width, height, time, isStatic }: CanvasFrame) {
    drawEmblem({
      ctx,
      width,
      height,
      time: isStatic ? 0 : time,
      shape,
      live: !isStatic,
      pointer: pointer.current,
      cellScale: settings.cellScale,
      hueBands: settings.hueBands,
    });
  }

  const canvasRef = useCanvasAnimation(draw, {
    frameInterval: settings.asciiInterval,
  });
  usePointerLight(canvasRef, pointer, (canvas) => canvas, !isStatic);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`block w-full ${className}`}
    />
  );
}

/**
 * Emblema do "Próximo projeto.": parado. Só redesenha quando o ponteiro se
 * move sobre o link (a luz acompanha). No Baixo/RM, parado e sem luz.
 */
export function StillEmblem({ shape, className = "" }: EmblemProps) {
  const { quality, settings } = useQuality();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useRef(0);
  const ready = useRef(false);
  const pointer = useRef({ ...NO_POINTER });

  function paint() {
    const canvas = canvasRef.current;
    if (!canvas || !ready.current) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    if (canvas.width !== Math.round(rect.width * dpr)) {
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawEmblem({
      ctx,
      width: rect.width,
      height: rect.height,
      time: 0,
      shape,
      live: false,
      pointer: pointer.current,
      cellScale: settings.cellScale,
      hueBands: settings.hueBands,
    });
  }

  // Um quadro por movimento do ponteiro, no máximo (rAF)
  function schedulePaint() {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(paint);
  }

  usePointerLight(
    canvasRef,
    pointer,
    (canvas) => canvas.closest("a"),
    quality !== "baixo",
    schedulePaint,
  );

  // Primeiro desenho: com as fontes prontas, quando chega perto da tela.
  // Depois, só no resize.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let stopped = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        document.fonts.ready.then(() => {
          if (stopped) return;
          ready.current = true;
          paint();
        });
      },
      { rootMargin: "200px" },
    );
    observer.observe(canvas);
    const resize = new ResizeObserver(() => schedulePaint());
    resize.observe(canvas);
    return () => {
      stopped = true;
      observer.disconnect();
      resize.disconnect();
      cancelAnimationFrame(frame.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shape, settings.cellScale, settings.hueBands]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`block w-full ${className}`}
    />
  );
}
