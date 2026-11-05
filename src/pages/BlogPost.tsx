import { useEffect, useRef, useState } from "react";
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
import { watchMediaFrame } from "../lib/mediaLoader";
import {
  decodeHtmlEntities,
  isSummaryRepeated,
  toMetaDescription,
} from "../lib/text";

/**
 * Coluna de leitura: 680px com 24px de respiro no celular e 640px a partir
 * de 860px (cerca de 73 caracteres por linha com o corpo em 19px, DF-6).
 */
const readingColumn = "mx-auto w-[min(680px,calc(100%-48px))] tab:w-[640px]";

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

  // Skeleton das imagens do corpo: depois de injetar o HTML do Hugo, liga
  // cada moldura (.media-frame) ao carregamento da sua imagem
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const frames = content.querySelectorAll<HTMLElement>(".media-frame");
    const stops = Array.from(frames).map(watchMediaFrame);
    return () => stops.forEach((stop) => stop());
  }, [post, loading]);

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

      <main className="min-h-svh pt-[calc(var(--spacing-nav)+64px)] pb-section">
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

            <h1 className="mt-4 text-post-title">
              {decodeHtmlEntities(post.title)}
            </h1>

            {/* O resumo só aparece se o corpo não começar com o mesmo texto (DF-5) */}
            {post.summary && !isSummaryRepeated(post.summary, post.content) && (
              <p className="mt-5 line-clamp-3 text-lead text-secondary">
                {decodeHtmlEntities(post.summary)}
              </p>
            )}

            {post.tags?.length > 0 && (
              <ul
                aria-label={blog.tagsLabel}
                className="mt-5 flex flex-wrap gap-1.5"
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
              ref={contentRef}
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
