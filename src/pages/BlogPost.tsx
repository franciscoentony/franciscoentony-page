import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import LocalNav from "../components/page/LocalNav";
import PostCover from "../components/post/PostCover";
import PostOnward from "../components/post/PostOnward";
import PostSignature from "../components/post/PostSignature";
import ShareLine from "../components/post/ShareLine";
import CopyButton from "../components/ui/CopyButton";
import { blog, seo } from "../content/ui";
import type { Post } from "../data/posts";
import { usePageMeta } from "../hooks/usePageMeta";
import {
  fetchPosts,
  getAdjacentPosts,
  getCachedPosts,
  postUrl,
  resolveAssetPath,
  resolveContentHtml,
} from "../lib/blog";
import { formatLongDate, readMinutes } from "../lib/date";
import { watchMediaFrame } from "../lib/mediaLoader";
import {
  preparePostContent,
  type PostCover as Cover,
} from "../lib/postContent";
import {
  decodeHtmlEntities,
  isSummaryRepeated,
  toMetaDescription,
} from "../lib/text";

/** Largura do cabeçalho do post: 880px, com 24px de respiro no celular. */
const headColumn = "mx-auto w-[min(880px,calc(100%-48px))]";
/** Coluna de leitura (640px), a mesma do texto do corpo. */
const readingColumn = "mx-auto w-[min(640px,calc(100%-48px))]";

/**
 * Página de um post: /blog/:slug (adendo v3,
 * docs/redesign/HANDOFF-ADENDO-V3-PROJETO-POST.md).
 *
 * De cima para baixo: local nav ("Blog" é o voltar) → dataline por extenso →
 * título → abertura → capa sangrando → corpo → assinatura em ASCII →
 * compartilhar → "Próximo post." / "Post anterior.".
 */
export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  // Se os posts já estão em cache, a página começa pronta (sem "Carregando...")
  const [posts, setPosts] = useState<Post[] | null>(getCachedPosts);
  // Guarda de qual slug é a lista carregada. Enquanto não for o atual, está carregando.
  const [loadedSlug, setLoadedSlug] = useState<string | undefined>(
    getCachedPosts() ? slug : undefined,
  );
  const loading = loadedSlug !== slug;
  const post = posts?.find((p) => p.slug === slug) ?? null;
  const { prev, next } =
    posts && slug ? getAdjacentPosts(posts, slug) : { prev: null, next: null };

  const articleRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Corpo preparado: a imagem de abertura sobe para a capa, as fotos viram
  // pares e as legendas viram <figcaption> (src/lib/postContent.ts)
  const prepared = useMemo(
    () =>
      post
        ? preparePostContent(
            resolveContentHtml(post.content),
            Boolean(post.cover),
          )
        : null,
    [post],
  );

  const title = post ? decodeHtmlEntities(post.title) : "";

  // Capa: o campo `cover` ou a imagem de abertura do corpo
  let cover: Cover | null = null;
  if (post?.cover) {
    cover = {
      src: resolveAssetPath(post.cover),
      alt: `${blog.coverAltPrefix} ${title}`,
      caption: post.coverCaption,
    };
  } else if (prepared?.openingImage) {
    cover = {
      ...prepared.openingImage,
      caption: post?.coverCaption || prepared.openingImage.caption,
    };
  }

  // Skeleton das imagens do corpo: depois de injetar o HTML do Hugo, liga
  // cada moldura (.media-frame) ao carregamento da sua imagem
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const frames = content.querySelectorAll<HTMLElement>(".media-frame");
    const stops = Array.from(frames).map(watchMediaFrame);
    return () => stops.forEach((stop) => stop());
  }, [prepared, loading]);

  // Título da aba: o do post (ou "Post não encontrado")
  let pageTitle = seo.blogTitle;
  if (!loading && post) pageTitle = title + seo.titleSuffix;
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
        if (!ignore) setPosts(data);
      })
      .catch((err) => {
        if (ignore) return;
        console.error("Erro ao carregar o post:", err);
        setPosts(null);
      })
      .finally(() => {
        if (!ignore) setLoadedSlug(slug);
      });

    return () => {
      ignore = true;
    };
  }, [slug]);

  const minutes = post ? readMinutes(post.readTime) : null;
  const showIntro =
    post?.summary && !isSummaryRepeated(post.summary, post.content);

  return (
    <div id="top">
      <Navbar />
      <LocalNav
        section={blog.post.section}
        sectionTo="/blog"
        title={post ? title : undefined}
        titleRef={titleRef}
        readRef={articleRef}
      >
        {post && (
          <CopyButton
            value={postUrl}
            idle={blog.post.copyLink}
            done={blog.post.linkCopied}
            failed={blog.post.copyFailed}
          />
        )}
      </LocalNav>

      <main className="min-h-svh pt-[calc(var(--spacing-nav)+var(--spacing-lnav))]">
        {loading && (
          <p
            role="status"
            className={`${headColumn} pt-14 text-secondary tab:pt-22`}
          >
            {blog.loadingPost}
          </p>
        )}

        {/* Post inexistente: o "Blog" da local nav é o caminho de volta */}
        {!loading && !post && (
          <div className={`${headColumn} pt-14 tab:pt-22`}>
            <h1 className="text-page-title text-balance">
              {blog.notFoundTitle}
            </h1>
            <p className="mt-6 max-w-[34em] text-intro text-secondary">
              {blog.notFoundText}
            </p>
          </div>
        )}

        {!loading && post && prepared && (
          <>
            <article ref={articleRef}>
              <header className={`${headColumn} pt-14 tab:pt-22`}>
                {/* Dataline por extenso, como num jornal (sem hash e sem mono) */}
                <p className="text-body-sm text-secondary">
                  <time dateTime={post.date.slice(0, 10)}>
                    {formatLongDate(post.date)}
                  </time>
                  {minutes && (
                    <>
                      {" · "}
                      <span className="whitespace-nowrap">
                        {blog.post.readTime(minutes)}
                      </span>
                    </>
                  )}
                </p>

                <h1
                  ref={titleRef}
                  className="mt-4.5 text-page-title text-balance"
                >
                  {title}
                </h1>

                {/* A abertura só aparece se o corpo não começar com o mesmo texto (DF-5) */}
                {showIntro && (
                  <p className="mt-6 max-w-[34em] text-intro text-pretty text-secondary">
                    {decodeHtmlEntities(post.summary)}
                  </p>
                )}
              </header>

              {cover && <PostCover cover={cover} />}

              {/* Corpo do post (HTML do Hugo), estilizado por .post-body em index.css */}
              <div
                ref={contentRef}
                className={`post-body ${cover ? "mt-18" : "mt-14"}`}
                dangerouslySetInnerHTML={{ __html: prepared.bodyHtml }}
              />

              <div className={readingColumn}>
                <PostSignature tags={post.tags ?? []} />
                <ShareLine title={title} />
              </div>
            </article>

            <PostOnward next={next} prev={prev} />
          </>
        )}
      </main>

      <div className="mt-30">
        <Footer />
      </div>
    </div>
  );
}
