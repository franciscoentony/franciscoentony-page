import { useEffect, useRef } from "react";
import { watchMediaFrame } from "../../lib/mediaLoader";

interface MediaFrameProps {
  src: string;
  alt: string;
  /** Proporção da moldura (largura/altura). Padrão 16/9 (capas dos cards). */
  ratio?: string;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  /** Classes extras da <img> (ex.: zoom no hover do card). */
  imgClassName?: string;
}

/**
 * Imagem com skeleton ASCII enquanto carrega (SPEC-SKELETON-IMAGENS).
 * A moldura tem proporção fixa, então nada "pula" quando a foto chega.
 */
export default function MediaFrame({
  src,
  alt,
  ratio = "16 / 9",
  width,
  height,
  sizes,
  className = "",
  imgClassName = "",
}: MediaFrameProps) {
  const frameRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!frameRef.current) return;
    return watchMediaFrame(frameRef.current);
  }, [src]);

  return (
    <span
      ref={frameRef}
      className={`media-frame ${className}`}
      style={{ aspectRatio: ratio }}
    >
      <span className="media-skel" aria-hidden="true" />
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        className={imgClassName}
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}
