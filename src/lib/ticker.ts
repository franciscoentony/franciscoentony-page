/*
 * Ticker único (PERF-PLAN A2).
 *
 * Antes: cada canvas, a esfera, os contadores e o cursor tinham o próprio
 * requestAnimationFrame (~10 loops), que continuavam agendando quadros mesmo
 * fora da tela.
 * Agora: UM requestAnimationFrame chama quem está inscrito. Quem sai da tela
 * cancela a inscrição; sem inscritos (ou com a aba oculta), o loop para.
 *
 * Uso:
 *   const unsubscribe = subscribe((time) => { ...desenha... });
 *   // depois: unsubscribe();
 */

export type TickCallback = (time: number) => void;

const subscribers = new Set<TickCallback>();
let frameId = 0;

/** Avisos de duração de quadro (usado pelo governador de FPS, nível de qualidade). */
const frameListeners = new Set<(frameMs: number) => void>();
let lastFrameTime = 0;

function loop(time: number) {
  frameId = 0;

  // Duração do quadro anterior (ignora o 1º quadro depois de uma pausa)
  if (lastFrameTime > 0) {
    const frameMs = time - lastFrameTime;
    frameListeners.forEach((listener) => listener(frameMs));
  }
  lastFrameTime = time;

  subscribers.forEach((callback) => callback(time));
  scheduleNextFrame();
}

function scheduleNextFrame() {
  if (frameId !== 0 || subscribers.size === 0 || document.hidden) {
    if (subscribers.size === 0 || document.hidden) lastFrameTime = 0;
    return;
  }
  frameId = requestAnimationFrame(loop);
}

/** Inscreve uma função para ser chamada a cada quadro. Devolve a função que cancela. */
export function subscribe(callback: TickCallback): () => void {
  subscribers.add(callback);
  scheduleNextFrame();
  return () => {
    subscribers.delete(callback);
  };
}

/** Recebe a duração de cada quadro em ms enquanto o ticker estiver rodando. */
export function onFrameDuration(listener: (frameMs: number) => void) {
  frameListeners.add(listener);
  return () => {
    frameListeners.delete(listener);
  };
}

// Aba oculta: para tudo. Aba visível de novo: retoma.
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    cancelAnimationFrame(frameId);
    frameId = 0;
    lastFrameTime = 0;
  } else {
    scheduleNextFrame();
  }
});
