import { blog, sectionIds } from "../content/ui";
import { usePosts } from "../hooks/usePosts";
import PostGrid from "./blog/PostGrid";
import Button from "./ui/Button";
import Reveal from "./ui/Reveal";
import Section from "./ui/Section";

/** Seção "Diário de bordo" da Home: os 3 posts mais recentes do blog. */
export default function BlogTeaser() {
  const { status, posts } = usePosts();

  return (
    <Section id={sectionIds.blog}>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <Reveal>
            <p className="text-eyebrow text-secondary">{blog.eyebrow}</p>
          </Reveal>
          <Reveal delay={1}>
            <h2 className="mt-3 max-w-[22ch] text-h2">{blog.title}</h2>
          </Reveal>
        </div>
        <Reveal delay={2}>
          <Button variant="link" to="/blog">
            {blog.allPostsLink}
          </Button>
        </Reveal>
      </div>

      <PostGrid status={status} posts={posts.slice(0, 3)} />
    </Section>
  );
}
