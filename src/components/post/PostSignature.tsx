import { useEffect, useRef } from "react";
import { blog } from "../../content/ui";
import { useQuality } from "../../hooks/useQuality";
import { drawAsciiImage } from "../../lib/asciiImage";
import { resolveAssetPath } from "../../utils/resolvePath";

const AVATAR = resolveAssetPath("/home/avatar-entony.webp");

/** Junta as tags numa frase: "Palestras, Google I/O e IFRN". */
function joinTags(tags: string[]) {
  if (tags.length <= 1) return tags.join("");
  return `${tags.slice(0, -1).join(", ")} e ${tags[tags.length - 1]}`;
}

/**
 * Assinatura no fim do post (adendo v3): o retrato da ficha da Home em
 * glifos ASCII (desenhado uma vez, com a borda esfumada) + o nome + as tags
 * em forma de frase ("Arquivado em ...").
 */
export default function PostSignature({ tags }: { tags: string[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { settings } = useQuality();

  useEffect(() => {
    let stopped = false;
    const image = new Image();
    image.src = AVATAR;
    Promise.all([image.decode(), document.fonts.ready])
      .then(() => {
        if (!stopped && canvasRef.current) {
          drawAsciiImage(canvasRef.current, image, {
            cell: 6,
            lift: 1.6,
            hueBands: settings.hueBands,
          });
        }
      })
      .catch(() => {});
    return () => {
      stopped = true;
    };
  }, [settings.hueBands]);

  return (
    <div className="mt-20 grid grid-cols-[auto_1fr] items-end gap-5">
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="size-28 [mask:radial-gradient(circle_at_50%_46%,#000_52%,transparent_71%)]"
      />
      <p className="text-body-sm text-secondary">
        <b className="block text-body font-semibold tracking-[-0.015em] text-paper">
          {blog.post.author}
        </b>
        {tags.length > 0 && blog.post.filedUnder(joinTags(tags))}
      </p>
    </div>
  );
}
