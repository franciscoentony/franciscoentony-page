import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCodeCommit } from "@fortawesome/free-solid-svg-icons";
import type { Post } from "../data/posts";

export default function BlogPostCard({ post }: { post: Post }) {
  return (
    <a
      href={`/blog/${post.slug}`}
      className="group block rounded-md border border-line bg-raised px-6 py-5 transition-colors hover:border-line-strong"
    >
      <div className="mb-2.5 flex items-center gap-2.5 font-mono text-xs text-muted">
        <FontAwesomeIcon icon={faCodeCommit} className="h-3.5 w-3.5" />
        <span>{post.hash}</span>
        <span>·</span>
        <span>{post.date}</span>
        <span>·</span>
        <span>{post.readTime}</span>
      </div>
      <h3 className="mb-2 text-lg font-semibold group-hover:text-accent">
        {post.title}
      </h3>
      <p className="mb-4 max-w-150 text-sm text-secondary">{post.excerpt}</p>
      <div className="flex flex-wrap gap-1.5">
        {post.tags?.map((t) => (
          <span
            key={t}
            className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent"
          >
            {t}
          </span>
        ))}
      </div>
    </a>
  );
}
