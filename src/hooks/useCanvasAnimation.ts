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

// ---------- Início escalonado dos canvases (BL1) ----------
// Se todos os canvases começassem no mesmo frame, o navegador travaria por
// algumas centenas de ms (TBT alto no Lighthouse). Por isso:
// - canvases VISÍVEIS entram numa fila e começam um por frame;
// - canvases FORA DA TELA só começam quando o navegador estiver ocioso.

const startQueue: (() => void)[] = [];
let queueIsRunning = false;

function runStartQueue() {
  const nextStart = startQueue.shift();
  nextStart?.();

  if (startQueue.length > 0) {
    requestAnimationFrame(runStartQueue);
  } else {
    queueIsRunning = false;
  }
}

/** Começa no próximo frame livre (no máximo 1 canvas por frame). */
function startOnNextFrame(start: () => void) {
  startQueue.push(start);
  if (!queueIsRunning) {
    queueIsRunning = true;
    requestAnimationFrame(runStartQueue);
  }
}

/** Começa quando o navegador estiver ocioso (Safari não tem requestIdleCallback). */
function startWhenIdle(start: () => void) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(start, { timeout: 3000 });
  } else {
    setTimeout(start, 300);
  }
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
 * - começa escalonado: 1 canvas por frame, e os fora da tela só quando
 *   chegam a ~1 tela de distância E o navegador está ocioso (BL1, A3);
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
    let scheduled = false;
    let fontsReady = false;
    let visibilityKnown = false;
    // Começa como "fora da tela": nada é desenhado antes de o
    // IntersectionObserver responder (BL1).
    let isVisible = false;
    // "Perto": a até ~1 tela de distância (A3)
    let isNear = false;
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
      if (cancelled || started) return;
      started = true;
      resize();
      if (isStatic) {
        drawFrame(0);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    /**
     * Agenda o início quando as fontes carregaram e o canvas está visível
     * ou perto (a ~1 tela). Longe da tela, nem começa.
     */
    function scheduleStart() {
      if (scheduled || !fontsReady || !visibilityKnown) return;
      if (!isVisible && !isNear) return;
      scheduled = true;
      if (isVisible) {
        startOnNextFrame(start);
      } else {
        startWhenIdle(start);
      }
    }

    // Pausa quando o canvas sai da tela
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        visibilityKnown = true;
        scheduleStart();
        // Ficou visível antes do ócio chegar? Começa já no próximo frame livre.
        if (isVisible && scheduled && !started) startOnNextFrame(start);
      },
      { rootMargin: "100px" },
    );
    visibilityObserver.observe(canvas);

    // Avisa quando o canvas chega a ~1 tela de distância (A3)
    const nearObserver = new IntersectionObserver(
      ([entry]) => {
        isNear = entry.isIntersecting;
        scheduleStart();
      },
      { rootMargin: "100% 0px" },
    );
    nearObserver.observe(canvas);

    // Recalcula o tamanho quando o canvas muda de tamanho
    const resizeObserver = new ResizeObserver(() => {
      if (!started) return;
      resize();
      if (isStatic) drawFrame(0);
    });
    resizeObserver.observe(canvas);

    // Espera as fontes antes de começar
    document.fonts.ready.then(() => {
      fontsReady = true;
      scheduleStart();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      visibilityObserver.disconnect();
      nearObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [isStatic, frameInterval]);

  return canvasRef;
}
