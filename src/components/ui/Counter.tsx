import { useEffect, useRef, useState } from "react";
import { useInView } from "../../hooks/useInView";
import { useQuality } from "../../hooks/useQuality";
import { COUNTER, clamp, smoothstep } from "../../lib/motion";
import { subscribe } from "../../lib/ticker";

interface CounterProps {
  value: number;
  suffix?: string;
  className?: string;
}

/**
 * Número que conta de 0 até `value` quando aparece na tela (1400ms).
 * O leitor de tela lê só o valor final (texto sr-only).
 */
export default function Counter({
  value,
  suffix = "",
  className = "",
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { threshold: COUNTER.threshold, once: true });
  const reducedMotion = useQuality().motion === "reduced";
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!inView || reducedMotion) return;

    const startTime = performance.now();

    // Conta pelo ticker único (A2) e sai dele quando termina
    const unsubscribe = subscribe((now) => {
      const t = smoothstep(clamp((now - startTime) / COUNTER.duration));
      setCurrent(Math.round(value * t));
      if (t >= 1) unsubscribe();
    });

    return unsubscribe;
  }, [inView, reducedMotion, value]);

  const shown = reducedMotion ? value : current;

  return (
    <span ref={ref} className={className}>
      <span aria-hidden="true">
        {shown}
        {suffix}
      </span>
      <span className="sr-only">
        {value}
        {suffix}
      </span>
    </span>
  );
}
