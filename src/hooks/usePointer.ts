import { useEffect, useRef } from "react";

export interface PointerPosition {
  /** Posição em pixels na janela. */
  x: number;
  y: number;
  /** Posição normalizada de -1 (esquerda/topo) a 1 (direita/baixo). */
  nx: number;
  ny: number;
}

/**
 * Guarda a posição do mouse num ref (não causa re-render).
 * Feito para ser lido dentro de loops de animação de canvas.
 */
export function usePointer() {
  const pointer = useRef<PointerPosition>({ x: 0, y: 0, nx: 0, ny: 0 });

  useEffect(() => {
    pointer.current.x = window.innerWidth / 2;
    pointer.current.y = window.innerHeight / 2;

    function handleMove(event: PointerEvent) {
      pointer.current.x = event.clientX;
      pointer.current.y = event.clientY;
      pointer.current.nx = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.ny = (event.clientY / window.innerHeight) * 2 - 1;
    }

    window.addEventListener("pointermove", handleMove, { passive: true });
    return () => window.removeEventListener("pointermove", handleMove);
  }, []);

  return pointer;
}
