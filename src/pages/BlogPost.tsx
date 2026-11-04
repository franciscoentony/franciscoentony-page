import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, GitCommitHorizontal } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import {
  fetchPosts,
  resolveAssetPath,
  resolveContentHtml,
  formatDate,
} from "../lib/blog";
import type { Post } from "../data/posts";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  // Guarda de qual slug é o post carregado. Enquanto não for o slug atual, está carregando.
  const [loadedSlug, setLoadedSlug] = useState<string | undefined>(undefined);
  const loading = loadedSlug !== slug;

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

  if (loading) {
    return (
      <div id="top">
        <Navbar />
        <main className="flex min-h-screen items-center justify-center px-7">
          <p className="animate-pulse text-sm text-secondary">
            Carregando post...
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div id="top">
        <Navbar />
        <main className="mx-auto max-w-170 px-7 pt-44 pb-24 text-center">
          <span className="mb-4 block text-[13px] uppercase tracking-[0.08em] text-secondary">
            404
          </span>
          <h1 className="mb-4 text-3xl font-bold">Post não encontrado.</h1>
          <p className="mb-8 text-secondary">
            O link pode estar quebrado ou o post foi movido.
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            Voltar pro blog
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div id="top">
      <Navbar />
      <main>
        <article className="mx-auto max-w-170 px-7 pt-44 pb-28">
          <Link
            to="/blog"
            className="mb-10 inline-flex items-center gap-2 text-sm text-secondary transition-colors hover:text-paper"
          >
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            Voltar pro blog
          </Link>

          <div className="mb-5 flex flex-wrap items-center gap-2.5 font-mono text-xs text-secondary">
            <GitCommitHorizontal aria-hidden="true" className="h-3.5 w-3.5" />
            <span>{post.hash}</span>
            <span>·</span>
            <time>{formatDate(post.date)}</time>
            <span>·</span>
            <span>{post.readTime}</span>
          </div>

          <h1 className="mb-4 text-3xl font-bold leading-[1.15] sm:text-4xl">
            {post.title}
          </h1>

          {post.summary && (
            <p className="mb-6 text-[17px] text-secondary">{post.summary}</p>
          )}

          {post.tags?.length > 0 && (
            <div className="mb-10 flex flex-wrap gap-1.5">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {post.cover && (
            <div className="mb-10 h-64 w-full overflow-hidden rounded-lg border border-line sm:h-96">
              <img
                src={resolveAssetPath(post.cover)}
                alt={`Capa do post: ${post.title}`}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div
            className="prose prose-invert max-w-none border-t border-line pt-10 text-[15px] leading-relaxed text-secondary prose-headings:font-display gap-8 flex flex-col prose-headings:text-paper prose-a:text-accent prose-strong:text-paper prose-code:text-accent prose-img:rounded-lg! prose-img:border! prose-img:border-line!"
            dangerouslySetInnerHTML={{
              __html: resolveContentHtml(post.content),
            }}
          />

          <div className="mt-16 border-t border-line pt-8">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 text-sm text-accent hover:underline"
            >
              <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
              Voltar pro blog
            </Link>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
