import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import Button from "../components/ui/Button";
import { blog, seo } from "../content/ui";
import { usePageMeta } from "../hooks/usePageMeta";
import type { Post } from "../data/posts";
import {
  fetchPosts,
  getCachedPosts,
  resolveAssetPath,
  resolveContentHtml,
} from "../lib/blog";
import { formatShortDate } from "../lib/date";
import { decodeHtmlEntities, toMetaDescription } from "../lib/text";

/** Coluna de leitura de 680px (HANDOFF §7), com 24px de respiro no celular. */
const readingColumn = "mx-auto w-[min(680px,calc(100%-48px))]";

/** Link "‹ Voltar pro blog" (o -ml compensa o padding do botão link). */
function BackLink() {
  return (
    <Button variant="link" to="/blog" className="-ml-1.5">
      {blog.backLink}
    </Button>
  );
}

/** Página de um post: /blog/:slug */
export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  // Se os posts já estão em cache, a página começa pronta (sem "Carregando...")
  const cached = getCachedPosts();
  const [post, setPost] = useState<Post | null>(
    cached?.find((p) => p.slug === slug) ?? null,
  );
  // Guarda de qual slug é o post carregado. Enquanto não for o slug atual, está carregando.
  const [loadedSlug, setLoadedSlug] = useState<string | undefined>(
    cached ? slug : undefined,
  );
  const loading = loadedSlug !== slug;

  // Título da aba: o do post (ou "Post não encontrado")
  let pageTitle = seo.blogTitle;
  if (!loading && post)
    pageTitle = decodeHtmlEntities(post.title) + seo.titleSuffix;
  if (!loading && !post) pageTitle = seo.notFoundTitle;
  usePageMeta(
    pageTitle,
    post ? toMetaDescription(post.summary || post.excerpt) : undefined,
  );

  useEffect(() => {
    // Se o slug mudar antes do fetch terminar, ignoramos a resposta antiga
    let ignore = false;

    fetchPosts()
      .then((data) => {
        if (!ignore) setPost(data.find((p) => p.slug === slug) ?? null);
      })
      .catch((err) => {
        if (ignore) return;
        console.error("Erro ao carregar o post:", err);
        setPost(null);
      })
      .finally(() => {
        if (!ignore) setLoadedSlug(slug);
      });

    return () => {
      ignore = true;
    };
  }, [slug]);

  return (
    <div id="top">
      <Navbar />

      <main className="pt-[calc(var(--spacing-nav)+64px)] pb-section">
        {loading && (
          <p role="status" className={`${readingColumn} text-secondary`}>
            {blog.loadingPost}
          </p>
        )}

        {!loading && !post && (
          <div className={readingColumn}>
            <p className="font-mono text-label-lg tracking-label text-secondary">
              {blog.notFoundEyebrow}
            </p>
            <h1 className="mt-4 mb-4 text-h2">{blog.notFoundTitle}</h1>
            <p className="mb-8 text-lead text-secondary">{blog.notFoundText}</p>
            <BackLink />
          </div>
        )}

        {!loading && post && (
          <article className={readingColumn}>
            <BackLink />

            {/* Meta: #hash · data · tempo de leitura */}
            <p className="mt-10 flex flex-wrap gap-x-2.5 font-mono text-label-lg tracking-label text-secondary">
              <span className="text-gold">#{post.hash}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={post.date}>{formatShortDate(post.date)}</time>
              <span aria-hidden="true">·</span>
              <span>{post.readTime}</span>
            </p>

            <h1 className="mt-4 text-h1">{decodeHtmlEntities(post.title)}</h1>

            {post.summary && (
              <p className="mt-5 text-lead text-secondary">
                {decodeHtmlEntities(post.summary)}
              </p>
            )}

            {post.tags?.length > 0 && (
              <ul
                aria-label={blog.tagsLabel}
                className="mt-6 flex flex-wrap gap-1.5"
              >
                {post.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full border border-line px-3 py-1 font-mono text-label text-secondary"
                  >
                    {tag}
                  </li>
                ))}
              </ul>
            )}

            {post.cover && (
              <img
                src={resolveAssetPath(post.cover)}
                alt={`${blog.coverAltPrefix} ${post.title}`}
                className="mt-10 aspect-video w-full rounded-lg border border-line object-cover"
              />
            )}

            {/* Corpo do post (HTML gerado pelo Hugo), estilizado por post-content */}
            <div
              className="post-content mt-12 border-t border-line pt-12"
              dangerouslySetInnerHTML={{
                __html: resolveContentHtml(post.content),
              }}
            />

            <div className="mt-16 border-t border-line pt-8">
              <BackLink />
            </div>
          </article>
        )}
      </main>

      <Footer />
    </div>
  );
}
