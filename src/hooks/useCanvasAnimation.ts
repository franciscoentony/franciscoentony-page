import { useEffect, useRef } from "react";
import { MAX_DPR } from "../lib/motion";
import { subscribe } from "../lib/ticker";
import type { WorkerKind } from "../workers/canvasWorker";
import { useQuality } from "./useQuality";

export interface CanvasFrame {
  ctx: CanvasRenderingContext2D;
  /** Tamanho do canvas em pixels CSS (já considera o DPR). */
  width: number;
  height: number;
  /** Tempo em ms desde que a página abriu (igual ao do requestAnimationFrame). */
  time: number;
  /** true no nível Baixo (e com reduced motion): desenhe um quadro parado. */
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

/**
 * Canvases já entregues a um worker. Um canvas transferido não pode ser
 * usado de novo: quem usa a opção `worker` precisa remontar o <canvas>
 * (key) quando algo que reinicia o efeito mudar (ex.: nível de qualidade).
 */
const transferredCanvases = new WeakSet<HTMLCanvasElement>();

/** Desenho dentro de um Web Worker com OffscreenCanvas (PERF-PLAN A8). */
export interface CanvasWorkerOptions {
  /** O que o worker desenha (src/workers/canvasWorker.ts). */
  kind: WorkerKind;
  /** Fonte que o worker precisa carregar (o planeta usa Geist Mono). */
  fontUrl?: string;
  /**
   * Monta o estado de cada quadro, enviado ao worker (scroll, mouse...).
   * Devolva null para não enviar este quadro (nada mudou).
   */
  frameData: (frame: Omit<CanvasFrame, "ctx">) => unknown;
  /** Opcional: recebe a resposta "drawn" do worker (ex.: posições). */
  onDrawn?: (message: { type: "drawn"; [key: string]: unknown }) => void;
  /**
   * Opcional: recebe uma função para mandar mensagens ao worker (ou null
   * quando não há worker, ex.: caiu para a página ou desmontou).
   */
  onPost?: (post: ((message: unknown) => void) | null) => void;
}

interface CanvasAnimationOptions {
  /** Intervalo mínimo entre quadros em ms. 0 = todo frame (60fps). */
  frameInterval?: number;
  /**
   * Opcional: desenha num Web Worker (A8). Se o navegador não suportar
   * OffscreenCanvas/fontes no worker, cai automaticamente para `draw` na
   * página. Atenção: depois de transferido, o canvas não volta; quem usa
   * deve remontar o <canvas> (key) quando o nível de qualidade mudar.
   */
  worker?: CanvasWorkerOptions;
  /**
   * Se o `draw` devolver `false` ("nada a fazer"), o canvas sai do ticker e
   * só volta no próximo evento do ponteiro (mover, apertar, soltar ou
   * entrar em outro elemento). Usado pelo cursor custom parado (P5 I-B, I-7).
   */
  sleepUntilPointer?: boolean;
}

/**
 * Base para todos os canvases animados (estrelas, planeta, campos ASCII...).
 *
 * O que ele já resolve para você:
 * - ajusta o tamanho do canvas ao elemento, com DPR limitado a 2 (D9);
 * - só começa depois das fontes carregadas e do primeiro paint (D9);
 * - começa escalonado: 1 canvas por frame, e os fora da tela só quando
 *   chegam a ~1 tela de distância E o navegador está ocioso (BL1, A3);
 * - desenha pelo ticker único (A2): fora da tela, cancela a inscrição e
 *   não agenda mais nenhum quadro (D9);
 * - no nível Baixo (e com reduced motion) desenha um único quadro parado (D8).
 *
 * Exemplo:
 *   const canvasRef = useCanvasAnimation(({ ctx, width, height, time }) => {
 *     ctx.clearRect(0, 0, width, height);
 *     // ...desenha aqui
 *   });
 *   return <canvas ref={canvasRef} aria-hidden="true" />;
 */
export function useCanvasAnimation(
  draw: (frame: CanvasFrame) => void | boolean,
  {
    frameInterval = 0,
    worker: workerOptions,
    sleepUntilPointer = false,
  }: CanvasAnimationOptions = {},
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Nível Baixo (inclui reduced motion): um quadro parado por canvas
  const isStatic = useQuality().quality === "baixo";

  // Guarda sempre a versão mais nova da função de desenho,
  // sem precisar reiniciar o loop a cada render.
  const drawRef = useRef(draw);
  useEffect(() => {
    drawRef.current = draw;
  }, [draw]);

  // Idem para as opções do worker (a função frameData muda a cada render)
  const workerOptionsRef = useRef(workerOptions);
  useEffect(() => {
    workerOptionsRef.current = workerOptions;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Proteção (P5 S-B): este canvas já foi para um worker e não volta
    if (transferredCanvases.has(canvas)) {
      if (import.meta.env.DEV) {
        console.error(
          "useCanvasAnimation: canvas já transferido para um worker. Remonte o <canvas> com uma key nova quando o efeito reiniciar.",
        );
      }
      return;
    }

    // Onde o desenho acontece: na página (ctx) ou num worker (A8).
    // Só sabemos depois que o worker responde se tem suporte.
    let ctx: CanvasRenderingContext2D | null = null;
    let worker: Worker | null = null;
    let modeReady = false;

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
    // Função para sair do ticker (null = não inscrito)
    let unsubscribe: (() => void) | null = null;
    let lastDrawTime = -Infinity;
    let cancelled = false;

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      width = rect.width;
      height = rect.height;

      // No worker, quem muda o tamanho do OffscreenCanvas é o próprio worker
      if (worker) {
        worker.postMessage({ type: "resize", width, height, dpr });
        return;
      }
      if (!ctx) return;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Contrapressão (P5 S-A): só manda um quadro novo ao worker depois que
    // ele avisa que desenhou o anterior. Se chegar outro antes, fica só o
    // mais recente esperando (os do meio são descartados).
    let workerBusy = false;
    let pendingTime: number | null = null;

    function sendFrameToWorker(time: number) {
      if (!worker) return;
      if (workerBusy) {
        pendingTime = time;
        return;
      }
      const data = workerOptionsRef.current?.frameData({
        width,
        height,
        time,
        isStatic,
      });
      if (data === null || data === undefined) return; // nada a desenhar
      workerBusy = true;
      worker.postMessage({ type: "frame", data });
    }

    function drawFrame(time: number) {
      if (worker) {
        sendFrameToWorker(time);
        return;
      }
      if (!ctx) return;
      return drawRef.current({ ctx, width, height, time, isStatic });
    }

    function tick(time: number) {
      if (time - lastDrawTime < frameInterval) return;
      lastDrawTime = time;
      const result = drawFrame(time);
      if (result === false && sleepUntilPointer) sleep();
    }

    // Dormindo: fora do ticker até o próximo movimento do ponteiro
    let sleeping = false;

    // Acorda com qualquer mudança do ponteiro: mover, apertar, SOLTAR (senão
    // o cursor dormia na escala de "pressionado") e passar para outro
    // elemento sem mexer o mouse (o modo do cursor muda no pointerover, I-7)
    function sleep() {
      sleeping = true;
      updateSubscription();
      window.addEventListener("pointermove", wake, { passive: true });
      window.addEventListener("pointerdown", wake);
      window.addEventListener("pointerup", wake);
      document.addEventListener("pointerover", wake);
    }

    function wake() {
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("pointerup", wake);
      document.removeEventListener("pointerover", wake);
      sleeping = false;
      updateSubscription();
    }

    function start() {
      if (cancelled || started) return;
      started = true;
      resize();
      if (isStatic) {
        drawFrame(0);
      } else {
        updateSubscription();
      }
    }

    /** Entra no ticker quando está visível e sai quando deixa de estar. */
    function updateSubscription() {
      const shouldRun =
        started && !isStatic && isVisible && !cancelled && !sleeping;
      if (shouldRun && !unsubscribe) {
        unsubscribe = subscribe(tick);
      } else if (!shouldRun && unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    }

    /**
     * Agenda o início quando as fontes carregaram e o canvas está visível
     * ou perto (a ~1 tela). Longe da tela, nem começa.
     */
    function scheduleStart() {
      if (scheduled || !modeReady || !fontsReady || !visibilityKnown) return;
      if (!isVisible && !isNear) return;
      scheduled = true;
      if (isVisible) {
        startOnNextFrame(start);
      } else {
        startWhenIdle(start);
      }
    }

    // Decide entre worker e página (A8)
    const options = workerOptionsRef.current;
    const canUseWorker =
      options &&
      typeof Worker !== "undefined" &&
      typeof canvas.transferControlToOffscreen === "function";

    /** Sem worker: desenha na página, como os outros canvases. */
    function fallBackToMainThread() {
      worker?.terminate();
      worker = null;
      ctx = canvas!.getContext("2d");
      modeReady = true;
      scheduleStart();
    }

    if (canUseWorker) {
      worker = new Worker(
        new URL("../workers/canvasWorker.ts", import.meta.url),
        { type: "module" },
      );
      worker.onmessage = (event: MessageEvent) => {
        if (cancelled) return;

        // O worker terminou um quadro: libera e manda o pendente, se houver
        if (event.data.type === "drawn") {
          workerOptionsRef.current?.onDrawn?.(event.data);
          workerBusy = false;
          if (pendingTime !== null) {
            const time = pendingTime;
            pendingTime = null;
            sendFrameToWorker(time);
          }
          return;
        }

        if (event.data.type !== "capabilities") return;
        if (!event.data.ok) {
          fallBackToMainThread();
          return;
        }
        // Transfere o canvas para o worker (não tem volta)
        const offscreen = canvas.transferControlToOffscreen();
        transferredCanvases.add(canvas);
        worker!.postMessage(
          { type: "init", canvas: offscreen, kind: options.kind },
          [offscreen],
        );
        modeReady = true;
        const activeWorker = worker!;
        workerOptionsRef.current?.onPost?.((message) =>
          activeWorker.postMessage(message),
        );
        scheduleStart();
      };
      // Erro ao carregar o worker antes da transferência: volta para a página
      worker.onerror = () => {
        if (!cancelled && !modeReady) fallBackToMainThread();
      };
      worker.postMessage({ type: "check", fontUrl: options.fontUrl });
    } else {
      ctx = canvas.getContext("2d");
      modeReady = true;
    }

    // Pausa quando o canvas sai da tela
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        visibilityKnown = true;
        scheduleStart();
        // Ficou visível antes do ócio chegar? Começa já no próximo frame livre.
        if (isVisible && scheduled && !started) startOnNextFrame(start);
        updateSubscription();
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
      unsubscribe?.();
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("pointerup", wake);
      document.removeEventListener("pointerover", wake);
      worker?.terminate();
      if (worker) workerOptionsRef.current?.onPost?.(null);
      visibilityObserver.disconnect();
      nearObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [isStatic, frameInterval, sleepUntilPointer]);

  return canvasRef;
}
