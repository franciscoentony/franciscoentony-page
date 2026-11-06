/*
 * "Decodificação" de um texto pela rampa ASCII (adendo v3): as letras
 * chegam da esquerda para a direita, e o que ainda não chegou é um glifo
 * aleatório. Usado no "Copiar link" → "Link copiado" e nos números.
 *
 * Quem chama decide se anima: em reduced motion e no nível Baixo, troque o
 * texto direto (sem chamar esta função).
 */
import { ASCII_RAMP, clamp } from "./motion";

/** Duração padrão da decodificação (ms). */
export const DECODE_MS = 520;

/** Glifo aleatório da rampa (sem o espaço). */
function randomGlyph() {
  return ASCII_RAMP[1 + Math.floor(Math.random() * (ASCII_RAMP.length - 1))];
}

/**
 * Anima `element.textContent` até virar `text`. Devolve a função que cancela.
 */
export function decodeText(
  element: HTMLElement,
  text: string,
  duration = DECODE_MS,
): () => void {
  const start = performance.now();
  let frame = 0;

  function step(now: number) {
    const progress = clamp((now - start) / duration);
    const revealed = Math.floor(progress * text.length);
    const rest = Array.from(text.slice(revealed), (char) =>
      char === " " ? " " : randomGlyph(),
    ).join("");
    element.textContent = text.slice(0, revealed) + rest;
    if (progress < 1) frame = requestAnimationFrame(step);
  }

  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
}
