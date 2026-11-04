import { blog } from "../../content/ui";
import type { Post } from "../../data/posts";
import type { PostsStatus } from "../../hooks/usePosts";
import Button from "../ui/Button";
import Reveal from "../ui/Reveal";
import PostCard from "./PostCard";

interface PostGridProps {
  status: PostsStatus;
  posts: Post[];
  headingLevel?: "h2" | "h3";
  showTags?: boolean;
  /** Teaser da Home: completa a 3ª posição com um card-convite (DS-14). */
  showInvite?: boolean;
}

/** Grade de posts (3 colunas; 1 abaixo de 860px) com os estados de loading, erro e vazio. */
export default function PostGrid({
  status,
  posts,
  headingLevel,
  showTags,
  showInvite = false,
}: PostGridProps) {
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
    <ul className="grid gap-5 sm:grid-cols-2 tab:grid-cols-3">
      {posts.map((post, index) => (
        <li key={post.slug}>
          <Reveal delay={((index % 3) + 1) as 1 | 2 | 3} className="h-full">
            <PostCard
              post={post}
              headingLevel={headingLevel}
              showTags={showTags}
            />
          </Reveal>
        </li>
      ))}

      {/* Menos de 3 posts no teaser: convite para o blog na posição que sobra */}
      {showInvite && posts.length < 3 && (
        <li>
          <Reveal
            delay={((posts.length % 3) + 1) as 1 | 2 | 3}
            className="h-full"
          >
            <div className="flex h-full min-h-[250px] flex-col justify-between gap-3 rounded-lg border border-dashed border-line-strong p-6.5">
              <p className="text-title-sm text-secondary">{blog.inviteTitle}</p>
              <Button variant="link" to="/blog" className="-ml-1.5 self-start">
                {blog.allPostsLink}
              </Button>
            </div>
          </Reveal>
        </li>
      )}
    </ul>
  );
}
