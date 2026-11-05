/*
 * Valor suavizado para animações ligadas ao scroll (feedback do Entony).
 *
 * Antes: o progresso cru da rolagem ia direto para as animações. Cada
 * "degrau" da roda do mouse virava um salto, e a animação congelava quando
 * a rolagem parava.
 * Agora: um valor "exibido" persegue o progresso real com amortecimento
 * exponencial dependente do tempo:
 *     exibido += (alvo - exibido) * (1 - exp(-dt / TAU))
 * Ele roda no ticker único e continua andando DEPOIS que a rolagem para,
 * até chegar perto o bastante do alvo; aí sai do ticker.
 *
 * A rolagem do usuário continua nativa: só as animações ficam suavizadas.
 *
 * Uso:
 *   const smooth = createSmoothedValue((value) => aplicar(value));
 *   smooth.setTarget(progressoDaRolagem); // a cada scroll
 *   smooth.dispose();                     // ao desmontar
 */
import { SCROLL_SMOOTHING } from "./motion";
import { subscribe } from "./ticker";

export interface SmoothedValue {
  /** Novo alvo (progresso real). O 1º valor é aplicado na hora, sem animar. */
  setTarget: (target: number) => void;
  /** Valor exibido no momento. */
  readonly value: number;
  /** Sai do ticker (ao desmontar). */
  dispose: () => void;
}

export function createSmoothedValue(
  onChange: (value: number) => void,
  tau = SCROLL_SMOOTHING.tau,
): SmoothedValue {
  let target = 0;
  let displayed = 0;
  let initialized = false;
  let lastTime = 0;
  let unsubscribe: (() => void) | null = null;

  function stop() {
    unsubscribe?.();
    unsubscribe = null;
    lastTime = 0;
  }

  function tick(time: number) {
    const dt = lastTime === 0 ? 16 : Math.min(time - lastTime, 100);
    lastTime = time;
    displayed += (target - displayed) * (1 - Math.exp(-dt / tau));

    // Chegou: encaixa no alvo e sai do ticker
    if (Math.abs(target - displayed) < SCROLL_SMOOTHING.epsilon) {
      displayed = target;
      stop();
    }
    onChange(displayed);
  }

  return {
    setTarget(value: number) {
      // 1º valor (carregamento, Voltar): aplica direto, sem animar
      if (!initialized) {
        initialized = true;
        target = value;
        displayed = value;
        onChange(value);
        return;
      }
      target = value;
      const settled = Math.abs(target - displayed) < SCROLL_SMOOTHING.epsilon;
      if (!settled && !unsubscribe) unsubscribe = subscribe(tick);
    },
    get value() {
      return displayed;
    },
    dispose: stop,
  };
}
