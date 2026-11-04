import { useEffect, useRef } from "react";
import { MAX_DPR } from "../lib/motion";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

export interface CanvasFrame {
  ctx: CanvasRenderingContext2D;
  /** Tamanho do canvas em pixels CSS (já considera o DPR). */
  width: number;
  height: number;
  /** Tempo em ms desde que a página abriu (igual ao do requestAnimationFrame). */
  time: number;
  /** true quando o usuário pediu menos movimento: desenhe um quadro parado. */
  isStatic: boolean;
}

interface CanvasAnimationOptions {
  /** Intervalo mínimo entre quadros em ms. 0 = todo frame (60fps). */
  frameInterval?: number;
}

/**
 * Base para todos os canvases animados (estrelas, planeta, campos ASCII...).
 *
 * O que ele já resolve para você:
 * - ajusta o tamanho do canvas ao elemento, com DPR limitado a 2 (D9);
 * - só começa depois das fontes carregadas e do primeiro paint (D9);
 * - pausa quando o canvas sai da tela (IntersectionObserver) (D9);
 * - com prefers-reduced-motion desenha um único quadro parado (D8).
 *
 * Exemplo:
 *   const canvasRef = useCanvasAnimation(({ ctx, width, height, time }) => {
 *     ctx.clearRect(0, 0, width, height);
 *     // ...desenha aqui
 *   });
 *   return <canvas ref={canvasRef} aria-hidden="true" />;
 */
export function useCanvasAnimation(
  draw: (frame: CanvasFrame) => void,
  { frameInterval = 0 }: CanvasAnimationOptions = {},
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isStatic = usePrefersReducedMotion();

  // Guarda sempre a versão mais nova da função de desenho,
  // sem precisar reiniciar o loop a cada render.
  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let width = 0;
    let height = 0;
    let started = false;
    let isVisible = true;
    let frameId = 0;
    let lastDrawTime = -Infinity;
    let cancelled = false;

    function resize() {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawFrame(time: number) {
      if (!ctx) return;
      drawRef.current({ ctx, width, height, time, isStatic });
    }

    function tick(time: number) {
      frameId = requestAnimationFrame(tick);
      if (!isVisible) return;
      if (time - lastDrawTime < frameInterval) return;
      lastDrawTime = time;
      drawFrame(time);
    }

    function start() {
      if (cancelled) return;
      started = true;
      resize();
      if (isStatic) {
        drawFrame(0);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    // Pausa quando o canvas sai da tela
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { rootMargin: "100px" },
    );
    visibilityObserver.observe(canvas);

    // Recalcula o tamanho quando o canvas muda de tamanho
    const resizeObserver = new ResizeObserver(() => {
      if (!started) return;
      resize();
      if (isStatic) drawFrame(0);
    });
    resizeObserver.observe(canvas);

    // Espera as fontes e o primeiro paint antes de começar
    document.fonts.ready.then(() => {
      frameId = requestAnimationFrame(start);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [isStatic, frameInterval]);

  return canvasRef;
}
