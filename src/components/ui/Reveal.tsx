import { useRef, type ReactNode } from "react";
import { useInView } from "../../hooks/useInView";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { REVEAL } from "../../lib/motion";

interface RevealProps {
  children: ReactNode;
  /** Atraso escalonado: 0 a 4 (cada passo = 80ms), como .d1–.d4 do protótipo. */
  delay?: 0 | 1 | 2 | 3 | 4;
  className?: string;
}

/**
 * Faz o conteúdo surgir de baixo para cima quando entra na tela (.rv do protótipo).
 * Acontece uma vez só. Com reduced motion, o conteúdo já aparece visível.
 */
export default function Reveal({ children, delay = 0, className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { threshold: REVEAL.threshold, once: true });
  const reducedMotion = usePrefersReducedMotion();
  const visible = inView || reducedMotion;

  return (
    <div
      ref={ref}
      className={`transition-[opacity,translate] [transition-duration:1s,1.1s] ${
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } ${className}`}
      style={{ transitionDelay: `${delay * REVEAL.stepDelay}ms` }}
    >
      {children}
    </div>
  );
}
