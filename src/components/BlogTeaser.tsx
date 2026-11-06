import { blog, sectionIds } from "../content/ui";
import { usePosts } from "../hooks/usePosts";
import DiaryTiles from "./blog/DiaryTiles";
import Reveal from "./ui/Reveal";
import { Kicker } from "./ui/RichText";
import Section from "./ui/Section";

/** Seção "Diário de bordo" da Home: as fotos dos 2 posts mais recentes (item 12). */
export default function BlogTeaser() {
  const { status, posts } = usePosts();

  return (
    <Section id={sectionIds.blog}>
      <Reveal>
        <h2 className="mb-10 max-w-[22ch] text-h2">
          <Kicker text={blog.eyebrow} />
          {blog.title}
        </h2>
      </Reveal>

      <DiaryTiles status={status} posts={posts} />
    </Section>
  );
}
