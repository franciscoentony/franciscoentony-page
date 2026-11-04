import { Link } from "react-router-dom";
import { blog } from "../../content/ui";
import type { Post } from "../../data/posts";
import { formatShortDate } from "../../lib/date";
import { decodeHtmlEntities } from "../../lib/text";

interface PostCardProps {
  post: Post;
  /** Nível do título: h3 na Home (abaixo do h2 da seção), h2 na página /blog. */
  headingLevel?: "h2" | "h3";
  /** Mostra as tags do post (página /blog). */
  showTags?: boolean;
}

/** Card de post usado no teaser da Home e na página /blog. */
export default function PostCard({
  post,
  headingLevel = "h3",
  showTags = false,
}: PostCardProps) {
  const Heading = headingLevel;

  return (
    <Link
      to={`/blog/${post.slug}`}
      className="flex h-full min-h-[250px] flex-col gap-3 rounded-lg border border-line bg-raised p-6.5 transition-[translate,border-color] duration-500 hover:-translate-y-1.5 hover:border-line-strong"
    >
      <span className="font-mono text-label text-gold">#{post.hash}</span>
      <Heading className="text-title-sm">
        {decodeHtmlEntities(post.title)}
      </Heading>

      {showTags && post.tags?.length > 0 && (
        <ul aria-label={blog.tagsLabel} className="flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-line px-2.5 py-0.5 font-mono text-label text-secondary"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex justify-between gap-3 font-mono text-label text-secondary">
        <span>{formatShortDate(post.date)}</span>
        <span>{post.readTime}</span>
      </div>
    </Link>
  );
}
