import { useEffect, useState, type RefObject } from "react";

interface UseInViewOptions {
  /** Quanto do elemento precisa aparecer (0 a 1). */
  threshold?: number;
  /** Se true, depois de aparecer uma vez fica true para sempre. */
  once?: boolean;
  /** Margem extra ao redor da tela, ex.: "100px". */
  rootMargin?: string;
}

/**
 * Diz se um elemento está visível na tela, usando IntersectionObserver.
 *
 * Exemplo:
 *   const ref = useRef<HTMLDivElement>(null);
 *   const visible = useInView(ref, { threshold: 0.15, once: true });
 */
export function useInView(
  ref: RefObject<Element | null>,
  { threshold = 0, once = false, rootMargin = "0px" }: UseInViewOptions = {},
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, threshold, once, rootMargin]);

  return inView;
}
