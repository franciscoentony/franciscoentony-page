import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { blog } from "../../content/ui";
import type { Post } from "../../data/posts";
import { useQuality } from "../../hooks/useQuality";
import { drawAsciiImage } from "../../lib/asciiImage";
import { resolveAssetPath, resolveContentHtml } from "../../lib/blog";
import { watchMediaFrame } from "../../lib/mediaLoader";
import { getPostPhoto } from "../../lib/postContent";
import { decodeHtmlEntities } from "../../lib/text";

/** Mouse de verdade (a lente não existe no toque). */
const finePointer = () =>
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/**
 * Foto do próximo post em 16:7 com a lente ASCII: sob o cursor, a foto vira
 * ASCII (como a ficha da Home). O ASCII é desenhado uma vez, no primeiro
 * hover; depois a lente é só uma máscara CSS (custo zero por quadro).
 * Sem lente no nível Baixo, com reduced motion e no toque.
 */
function LensPhoto({ post }: { post: Post }) {
  const frameRef = useRef<HTMLSpanElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { quality, settings } = useQuality();
  const photo = getPostPhoto(
    post.cover ? resolveAssetPath(post.cover) : null,
    resolveContentHtml(post.content),
  );

  // Skeleton enquanto carrega
  useEffect(() => {
    if (!frameRef.current) return;
    return watchMediaFrame(frameRef.current);
  }, [photo?.src]);

  // Lente: liga só com mouse e fora do Baixo/RM
  useEffect(() => {
    const frame = frameRef.current;
    const host = frame?.closest("a");
    if (!frame || !host || quality === "baixo" || !finePointer()) return;
    let drawn = false;

    function handleEnter() {
      const img = frame!.querySelector("img");
      if (!drawn && img?.complete && img.naturalWidth && canvasRef.current) {
        drawAsciiImage(canvasRef.current, img, {
          cell: 8,
          hueBands: settings.hueBands,
        });
        drawn = true;
      }
      if (drawn) frame!.dataset.lens = "on";
    }
    function handleMove(event: PointerEvent) {
      const rect = frame!.getBoundingClientRect();
      frame!.style.setProperty("--px", `${event.clientX - rect.left}px`);
      frame!.style.setProperty("--py", `${event.clientY - rect.top}px`);
    }
    function handleLeave() {
      delete frame!.dataset.lens;
    }

    frame.addEventListener("pointerenter", handleEnter);
    frame.addEventListener("pointermove", handleMove);
    frame.addEventListener("pointerleave", handleLeave);
    return () => {
      frame.removeEventListener("pointerenter", handleEnter);
      frame.removeEventListener("pointermove", handleMove);
      frame.removeEventListener("pointerleave", handleLeave);
    };
  }, [quality, settings.hueBands, photo?.src]);

  if (!photo) return null;

  return (
    <span ref={frameRef} className="media-frame photo mt-10 aspect-[16/7]">
      <span className="media-skel" aria-hidden="true" />
      <canvas ref={canvasRef} className="lens" aria-hidden="true" />
      <img
        src={photo.src}
        srcSet={photo.srcSet}
        sizes={
          photo.srcSet
            ? "(min-width: 1128px) 1080px, calc(100vw - 48px)"
            : undefined
        }
        alt=""
        width={photo.width}
        height={photo.height}
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}

/** "Próximo post." sem o ponto final, para o nome acessível do link. */
const label = (text: string) => text.replace(/\.$/, "");

/**
 * Fim do post (adendo v3): o próximo destino em escala de manchete.
 * - Próximo post (o mais antigo): manchete em dois tons + foto com a lente.
 * - Post anterior (o mais novo): uma linha em dois tons, só se existir.
 * O que não existe não aparece (sem card-convite).
 */
export default function PostOnward({
  next,
  prev,
}: {
  next: Post | null;
  prev: Post | null;
}) {
  if (!next && !prev) return null;

  return (
    <div className="mx-auto w-[min(1080px,calc(100%-48px))]">
      {next && (
        <Link
          to={`/blog/${next.slug}`}
          aria-label={`${label(blog.post.next)}: ${decodeHtmlEntities(next.title)}`}
          className="group mt-40 block"
        >
          <p
            aria-hidden="true"
            className="max-w-[20ch] text-onward text-balance"
          >
            <span className="text-secondary">{blog.post.next}</span>{" "}
            <span className="decoration-accent-soft/60 decoration-2 group-hover:underline">
              {decodeHtmlEntities(next.title)}.
            </span>
          </p>
          <LensPhoto post={next} />
        </Link>
      )}

      {prev && (
        <Link
          to={`/blog/${prev.slug}`}
          aria-label={`${label(blog.post.prev)}: ${decodeHtmlEntities(prev.title)}`}
          className={`group block text-onward-sm ${next ? "mt-12" : "mt-40"}`}
        >
          <span aria-hidden="true">
            <span className="text-secondary">{blog.post.prev}</span>{" "}
            <span className="decoration-accent-soft/60 group-hover:underline">
              {decodeHtmlEntities(prev.title)}.
            </span>
          </span>
        </Link>
      )}
    </div>
  );
}
