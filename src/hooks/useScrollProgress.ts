import { useEffect, useState, type RefObject } from "react";
import { getScrollProgress } from "../lib/motion";

/**
 * Progresso de rolagem (0 a 1) de uma seção alta com palco "sticky".
 * Atualiza no máximo uma vez por frame.
 *
 * Use para animar textos (opacidade, posição). Dentro de um loop de canvas,
 * prefira chamar getScrollProgress(elemento) direto, sem re-render.
 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frameId = 0;

    function update() {
      frameId = 0;
      if (ref.current) setProgress(getScrollProgress(ref.current));
    }

    function handleScroll() {
      // Junta vários eventos de scroll em uma única atualização por frame
      if (frameId === 0) frameId = requestAnimationFrame(update);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [ref]);

  return progress;
}
