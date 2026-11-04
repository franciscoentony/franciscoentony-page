import { useEffect, useRef, useState } from "react";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { WORDS, clamp } from "../../lib/motion";

interface WordRevealProps {
  text: string;
  className?: string;
}

/**
 * Parágrafo que "acende" palavra por palavra conforme o scroll (HANDOFF §4).
 * As palavras começam em muted (estado transitório) e terminam em paper.
 * Com reduced motion, todas já aparecem acesas.
 */
export default function WordReveal({ text, className = "" }: WordRevealProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const words = text.split(" ");
  const [litCount, setLitCount] = useState(0);

  useEffect(() => {
    if (reducedMotion) return;

    let frameId = 0;

    function update() {
      frameId = 0;
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress = clamp((0.85·vh − top) / (altura + 0.35·vh))
      const progress = clamp(
        (vh * WORDS.startAt - rect.top) / (rect.height + vh * WORDS.extra),
      );
      setLitCount(Math.floor(progress * words.length * 1.05));
    }

    function handleScroll() {
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
  }, [reducedMotion, words.length]);

  const count = reducedMotion ? words.length : litCount;

  return (
    <p ref={ref} className={className}>
      {words.map((word, index) => (
        <span key={index}>
          {index > 0 && " "}
          <span
            className={`transition-colors duration-400 ${
              index < count ? "text-paper" : "text-muted"
            }`}
          >
            {word}
          </span>
        </span>
      ))}
    </p>
  );
}
