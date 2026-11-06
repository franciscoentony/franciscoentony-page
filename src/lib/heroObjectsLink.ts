/*
 * Ponte entre a página e quem simula os objetos do hero (o worker do
 * planeta ou, sem worker, a própria página):
 * - caixa do texto do hero, medida na página;
 * - envio do ponteiro (grab/move/release/nudge) para a simulação;
 * - posições [x, y, r, pegável] × 3 a cada quadro desenhado.
 * É um objeto simples (fora do estado do React): nada disso causa re-render.
 */
import type { HeroObjectsInput, TextBox } from "./heroObjects";

type PositionsListener = (positions: ArrayLike<number>) => void;

export interface HeroObjectsLink {
  getTextBox: () => TextBox | null;
  setTextBox: (box: TextBox | null) => void;
  /** Manda o ponteiro para a simulação atual. */
  send: (input: HeroObjectsInput) => void;
  /** Troca o destino do ponteiro (worker ou página). */
  setSender: (sender: (input: HeroObjectsInput) => void) => void;
  /** Avisa quem posiciona as áreas de pegar. */
  emitPositions: (positions: ArrayLike<number>) => void;
  setPositionsListener: (listener: PositionsListener | null) => void;
}

export function createHeroObjectsLink(): HeroObjectsLink {
  let textBox: TextBox | null = null;
  let sender: (input: HeroObjectsInput) => void = () => {};
  let listener: PositionsListener | null = null;
  return {
    getTextBox: () => textBox,
    setTextBox: (box) => {
      textBox = box;
    },
    send: (input) => sender(input),
    setSender: (next) => {
      sender = next;
    },
    emitPositions: (positions) => listener?.(positions),
    setPositionsListener: (next) => {
      listener = next;
    },
  };
}
