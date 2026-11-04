import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import PostGrid from "../components/blog/PostGrid";
import Reveal from "../components/ui/Reveal";
import Section from "../components/ui/Section";
import { blog, seo } from "../content/ui";
import { usePageMeta } from "../hooks/usePageMeta";
import { usePosts } from "../hooks/usePosts";

/**
 * Página /blog (HANDOFF §7): cabeçalho "Diário de bordo" e grade com todos
 * os posts. Hierarquia de títulos: h1 da página → h2 em cada card (B6).
 */
export default function Blog() {
  const { status, posts } = usePosts();
  usePageMeta(seo.blogTitle, blog.lead);

  return (
    <div id="top">
      <Navbar />

      <main>
        <Section>
          <header className="mb-14 max-w-[720px]">
            <Reveal>
              <p className="text-eyebrow text-secondary">{blog.eyebrow}</p>
            </Reveal>
            <Reveal delay={1}>
              <h1 className="mt-3 mb-4.5 text-h2">{blog.title}</h1>
            </Reveal>
            <Reveal delay={2}>
              <p className="text-lead text-secondary">{blog.lead}</p>
            </Reveal>
          </header>

          <PostGrid status={status} posts={posts} headingLevel="h2" showTags />
        </Section>
      </main>

      <Footer />
    </div>
  );
}
