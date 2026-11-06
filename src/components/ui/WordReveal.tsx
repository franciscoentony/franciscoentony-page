import { useEffect, useRef, useState } from "react";
import { createSmoothedValue, type SmoothedValue } from "../../lib/smoothing";
import { useScrollWhileVisible } from "../../hooks/useScrollWhileVisible";
import { useQuality } from "../../hooks/useQuality";
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
  const reducedMotion = useQuality().motion === "reduced";
  const words = text.split(" ");
  const [litCount, setLitCount] = useState(0);

  // Só escuta o scroll com o parágrafo na tela (A6). O React só
  // re-renderiza quando o número de palavras acesas muda.
  // O número de palavras acesas segue o scroll com amortecimento: continua
  // acendendo até o ponto certo depois que a rolagem para
  const smoothRef = useRef<SmoothedValue | null>(null);
  useEffect(() => {
    const smooth = createSmoothedValue((progress) => {
      setLitCount(Math.floor(progress * words.length * 1.05));
    });
    smoothRef.current = smooth;
    return smooth.dispose;
  }, [words.length]);

  useScrollWhileVisible(ref, () => {
    if (reducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const vh = window.innerHeight;
    // progress = clamp((0.85·vh − top) / (altura + 0.35·vh))
    const progress = clamp(
      (vh * WORDS.startAt - rect.top) / (rect.height + vh * WORDS.extra),
    );
    smoothRef.current?.setTarget(progress);
  });

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
