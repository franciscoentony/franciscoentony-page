import { blog } from "../../content/ui";
import type { Post } from "../../data/posts";
import type { PostsStatus } from "../../hooks/usePosts";
import Reveal from "../ui/Reveal";
import PostCard from "./PostCard";

interface PostGridProps {
  status: PostsStatus;
  posts: Post[];
  headingLevel?: "h2" | "h3";
  showTags?: boolean;
  /**
   * Página /blog (DF-11): cards com capa e 2 colunas a partir de 640px;
   * só com 5 posts ou mais passa a 3 colunas a partir de 860px.
   */
  pageLayout?: boolean;
}

/** Grade de posts (3 colunas; 1 abaixo de 860px) com os estados de loading, erro e vazio. */
export default function PostGrid({
  status,
  posts,
  headingLevel,
  showTags,
  pageLayout = false,
}: PostGridProps) {
  // Teaser: 1 → 2 (640px) → 3 colunas (860px). /blog com menos de 5 posts: fica em 2.
  const columns =
    pageLayout && posts.length < 5
      ? "sm:grid-cols-2"
      : "sm:grid-cols-2 tab:grid-cols-3";

  if (status === "loading") {
    return (
      <div role="status" className="grid gap-5 sm:grid-cols-2 tab:grid-cols-3">
        <span className="sr-only">{blog.loading}</span>
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            aria-hidden="true"
            className="min-h-[250px] animate-pulse rounded-lg border border-line bg-raised"
          />
        ))}
      </div>
    );
  }

  if (status === "error") {
    return (
      <p role="status" className="text-secondary">
        {blog.error}
      </p>
    );
  }

  if (posts.length === 0) {
    return <p className="text-secondary">{blog.empty}</p>;
  }

  return (
    <ul className={`grid gap-5 ${columns}`}>
      {posts.map((post, index) => (
        <li key={post.slug}>
          <Reveal delay={((index % 3) + 1) as 1 | 2 | 3} className="h-full">
            <PostCard
              post={post}
              headingLevel={headingLevel}
              showTags={showTags}
              showCover={pageLayout}
            />
          </Reveal>
        </li>
      ))}
    </ul>
  );
}
