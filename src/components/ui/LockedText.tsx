import { useEffect, useRef } from "react";
import { useQuality } from "../../hooks/useQuality";
import { ASCII_RAMP } from "../../lib/motion";

/** A cada quantos ms os glifos trocam. */
const SCRAMBLE_MS = 160;
/** Fração das letras que fica em glifo a cada troca. */
const SCRAMBLE_SHARE = 0.55;

/**
 * Texto que nunca termina de decodificar (item 11, "Bloqueada"): parte das
 * letras vira glifo da rampa ASCII e muda a cada 160ms, só enquanto está na
 * tela. O leitor de tela ouve o texto limpo. No Baixo/RM, o texto fica parado.
 */
export default function LockedText({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isStatic = useQuality().quality === "baixo";

  useEffect(() => {
    const element = ref.current;
    if (!element || isStatic) return;
    let timer = 0;

    function scramble() {
      element!.textContent = Array.from(text, (char) =>
        char !== " " && Math.random() < SCRAMBLE_SHARE
          ? ASCII_RAMP[2 + Math.floor(Math.random() * (ASCII_RAMP.length - 2))]
          : char,
      ).join("");
    }

    // Só embaralha enquanto está visível (nada roda fora da tela)
    const observer = new IntersectionObserver(([entry]) => {
      window.clearInterval(timer);
      if (entry.isIntersecting)
        timer = window.setInterval(scramble, SCRAMBLE_MS);
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
      element.textContent = text;
    };
  }, [text, isStatic]);

  return (
    <>
      <span className="sr-only">{text}</span>
      <span
        ref={ref}
        aria-hidden="true"
        className="font-mono font-medium tracking-mono"
      >
        {text}
      </span>
    </>
  );
}
