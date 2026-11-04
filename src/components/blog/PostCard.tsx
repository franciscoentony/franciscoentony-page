import { Link } from "react-router-dom";
import type { Post } from "../../data/posts";
import { formatShortDate } from "../../lib/date";

/** Card de post (Home e, na fase 4, a página /blog). */
export default function PostCard({ post }: { post: Post }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="flex h-full min-h-[250px] flex-col gap-3 rounded-lg border border-line bg-raised p-6.5 transition duration-500 hover:-translate-y-1.5 hover:border-line-strong"
    >
      <span className="font-mono text-label text-gold">#{post.hash}</span>
      <h3 className="text-title-sm">{post.title}</h3>
      <div className="mt-auto flex justify-between gap-3 font-mono text-label text-secondary">
        <span>{formatShortDate(post.date)}</span>
        <span>{post.readTime}</span>
      </div>
    </Link>
  );
}
