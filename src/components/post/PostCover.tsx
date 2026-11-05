import { useEffect, useLayoutEffect, useRef } from "react";
import { useQuality } from "../../hooks/useQuality";
import { drawAsciiImage } from "../../lib/asciiImage";
import type { PostCover as Cover } from "../../lib/postContent";

/** Larguras da capa: ela sangra de ponta a ponta (100vw). */
export const COVER_SIZES = "100vw";

/** Quanto tempo o ASCII fica sozinho antes de a foto entrar (ms). */
const ASCII_HOLD_MS = 700;

/**
 * Capa do post (adendo v3): a foto sangra de ponta a ponta, sem raio
 * (21:9 no desktop, até 78% da altura da tela; 16:10 de 640 a 859px; 4:3 no
 * celular). A legenda fica alinhada à coluna do texto.
 *
 * Revelação: quando a foto chega, ela vira ASCII primeiro (como a ficha da
 * Home) e a foto entra por cima. No nível Baixo e com reduced motion, a foto
 * aparece direto.
 */
export default function PostCover({ cover }: { cover: Cover }) {
  const frameRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { quality, settings } = useQuality();
  const reveal = quality !== "baixo";
  const hueBands = settings.hueBands;

  // Antes do primeiro paint: se a foto ainda não chegou, mostra o skeleton
  useLayoutEffect(() => {
    const img = frameRef.current?.querySelector("img");
    if (frameRef.current && img && !img.complete) {
      frameRef.current.dataset.state = "loading";
    }
  }, [cover.src]);

  useEffect(() => {
    const frame = frameRef.current;
    const img = frame?.querySelector("img");
    if (!frame || !img) return;
    let stopped = false;
    let holdTimer = 0;

    function show() {
      if (stopped || !frame || !img) return;
      if (reveal && canvasRef.current) {
        // O ASCII é desenhado UMA vez; depois é só opacity no CSS
        drawAsciiImage(canvasRef.current, img, { cell: 7, hueBands });
        frame.dataset.reveal = "ascii";
        frame.dataset.state = "loaded";
        holdTimer = window.setTimeout(() => {
          frame.dataset.reveal = "photo";
        }, ASCII_HOLD_MS);
      } else {
        frame.dataset.state = "loaded";
      }
    }

    function handleLoad() {
      const decoding = img!.decode();
      // As fontes precisam estar prontas para o atlas de glifos
      Promise.all([decoding, document.fonts.ready])
        .catch(() => undefined)
        .then(show);
    }

    function handleError() {
      if (stopped || !frame || !img) return;
      if (img.alt) frame.dataset.alt = img.alt;
      frame.dataset.state = "error";
    }

    if (img.complete && img.naturalWidth > 0) handleLoad();
    else {
      img.addEventListener("load", handleLoad, { once: true });
      img.addEventListener("error", handleError, { once: true });
    }

    return () => {
      stopped = true;
      window.clearTimeout(holdTimer);
      img.removeEventListener("load", handleLoad);
      img.removeEventListener("error", handleError);
    };
  }, [cover.src, reveal, hueBands]);

  return (
    <figure className="mt-16">
      <span
        ref={frameRef}
        className="media-frame bleed aspect-[4/3] max-h-[78svh] w-full sm:aspect-[16/10] tab:aspect-[21/9]"
      >
        <span className="media-skel" aria-hidden="true" />
        <canvas ref={canvasRef} className="reveal" aria-hidden="true" />
        <img
          src={cover.src}
          srcSet={cover.srcSet}
          sizes={cover.srcSet ? COVER_SIZES : undefined}
          alt={cover.alt}
          width={cover.width}
          height={cover.height}
          fetchPriority="high"
          decoding="async"
        />
      </span>
      {cover.caption && (
        <figcaption className="fig-caption mx-auto w-[min(640px,calc(100%-48px))] max-w-none">
          {cover.caption}
        </figcaption>
      )}
    </figure>
  );
}
