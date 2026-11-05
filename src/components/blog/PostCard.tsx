import { Link } from "react-router-dom";
import { blog } from "../../content/ui";
import type { Post } from "../../data/posts";
import { resolveAssetPath } from "../../lib/blog";
import { formatShortDate } from "../../lib/date";
import { decodeHtmlEntities } from "../../lib/text";

interface PostCardProps {
  post: Post;
  /** Nível do título: h3 na Home (abaixo do h2 da seção), h2 na página /blog. */
  headingLevel?: "h2" | "h3";
  /** Mostra as tags do post (página /blog). */
  showTags?: boolean;
  /** Mostra a capa 16:9 no topo, se o post tiver capa (página /blog, DF-11). */
  showCover?: boolean;
}

/** No card cabem no máximo 3 tags; o resto vira uma pill "+N" (D23). */
const MAX_TAGS = 3;

/** Card de post usado no teaser da Home e na página /blog. */
export default function PostCard({
  post,
  headingLevel = "h3",
  showTags = false,
  showCover = false,
}: PostCardProps) {
  const Heading = headingLevel;
  const visibleTags = post.tags?.slice(0, MAX_TAGS) ?? [];
  const hiddenTagCount = (post.tags?.length ?? 0) - visibleTags.length;
  // Card do /blog sem capa: sem altura mínima e com a data logo abaixo das
  // tags (DS-P5c). O teaser da Home mantém os 250px com a data no rodapé.
  const compact = showTags && !(showCover && post.cover);

  return (
    <Link
      to={`/blog/${post.slug}`}
      className={`flex h-full flex-col gap-3 rounded-lg ${compact ? "" : "min-h-[250px]"} border border-line bg-raised p-6.5 transition-[translate,border-color] duration-500 hover:-translate-y-1.5 hover:border-line-strong`}
    >
      {showCover && post.cover && (
        <img
          src={resolveAssetPath(post.cover)}
          alt=""
          loading="lazy"
          className="mb-2 aspect-video w-full rounded-md border border-line object-cover"
        />
      )}

      <span className="font-mono text-label text-gold">#{post.hash}</span>
      <Heading className="text-title-sm">
        {decodeHtmlEntities(post.title)}
      </Heading>

      {showTags && visibleTags.length > 0 && (
        <ul aria-label={blog.tagsLabel} className="flex flex-wrap gap-1.5">
          {visibleTags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-line px-2.5 py-0.5 font-mono text-label text-secondary"
            >
              {tag}
            </li>
          ))}
          {hiddenTagCount > 0 && (
            <li className="rounded-full border border-line px-2.5 py-0.5 font-mono text-label text-secondary">
              +{hiddenTagCount}
              <span className="sr-only"> {blog.moreTagsLabel}</span>
            </li>
          )}
        </ul>
      )}

      <div
        className={`flex justify-between gap-3 font-mono text-label text-secondary ${compact ? "mt-1" : "mt-auto"}`}
      >
        <span>{formatShortDate(post.date)}</span>
        <span>{post.readTime}</span>
      </div>
    </Link>
  );
}
