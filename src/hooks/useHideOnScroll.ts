import { useEffect, useState } from "react";
import { NAVBAR } from "../lib/motion";

/**
 * Retorna true quando a navbar deve sumir:
 * o usuário está rolando para BAIXO e já passou de 200px.
 * Ao rolar para cima, volta a ser false.
 */
export function useHideOnScroll(): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;

    function handleScroll() {
      const y = window.scrollY;
      const goingDown = y > lastY;
      setHidden(goingDown && y > NAVBAR.hideAfter);
      lastY = y;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return hidden;
}
