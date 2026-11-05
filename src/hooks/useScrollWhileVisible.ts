import { useEffect, useRef, type RefObject } from "react";

/**
 * Chama `onScroll` (no máximo uma vez por quadro) enquanto o elemento estiver
 * na tela ou perto dela. Fora da tela, nem escuta o scroll (PERF-PLAN A6).
 *
 * A ideia é escrever estilos direto no DOM (ref.style / variáveis CSS) em vez
 * de usar setState a cada quadro, que re-renderizava o componente inteiro.
 *
 * Ao sair da tela, chama `onScroll` uma última vez, para aplicar o estado
 * final mesmo depois de uma rolagem rápida.
 *
 * Exemplo:
 *   useScrollWhileVisible(sectionRef, () => {
 *     fillRef.current!.style.height = `${calcularAltura()}px`;
 *   });
 */
export function useScrollWhileVisible(
  ref: RefObject<HTMLElement | null>,
  onScroll: () => void,
) {
  // Sempre a versão mais nova do callback, sem reiniciar os listeners
  const callbackRef = useRef(onScroll);
  useEffect(() => {
    callbackRef.current = onScroll;
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let frameId = 0;
    let listening = false;

    function run() {
      frameId = 0;
      callbackRef.current();
    }

    function handleScroll() {
      if (frameId === 0) frameId = requestAnimationFrame(run);
    }

    function start() {
      if (listening) return;
      listening = true;
      window.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("resize", handleScroll);
      handleScroll();
    }

    function stop(applyFinalState: boolean) {
      if (!listening) return;
      listening = false;
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      cancelAnimationFrame(frameId);
      frameId = 0;
      if (applyFinalState) callbackRef.current();
    }

    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop(true)),
      { rootMargin: "100px" },
    );
    observer.observe(element);

    return () => {
      observer.disconnect();
      stop(false);
    };
  }, [ref]);
}
