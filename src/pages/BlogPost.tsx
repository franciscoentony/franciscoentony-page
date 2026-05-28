import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";

interface Post {
  title: string;
  slug: string;
  date: string;
  summary: string;
  cover: string;
  content: string;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}blog-data/index.json`)
      .then((res) => res.json())
      .then((data: Post[]) => {
        const foundPost = data.find((p) => p.slug === slug);
        setPost(foundPost || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar o post:", err);
        setLoading(false);
      });
  }, [slug]);

  const getResolvedCover = (coverPath: string) => {
    if (!coverPath) return "";
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    return coverPath.replace(/^\/(blog|blog-data)\//, `${base}/blog-data/`);
  };

  const getResolvedContent = (contentHtml: string) => {
    if (!contentHtml) return "";
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    return contentHtml
      .replace(/src="\/blog\//g, `src="${base}/blog-data/`)
      .replace(/src="\/blog-data\//g, `src="${base}/blog-data/`);
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-stone-950 flex items-center justify-center text-white">
        <p className="text-lg animate-pulse">Carregando post...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="w-full min-h-screen bg-stone-950 flex flex-col items-center justify-center text-white gap-4">
        <h1 className="text-2xl font-bold">Post não encontrado</h1>
        <Link to="/blog" className="text-emerald-400 hover:underline">
          Voltar para o Blog
        </Link>
      </div>
    );
  }

  return (
    <main className="w-full min-h-screen bg-stone-950 text-stone-100 py-20 pt-30 pb-4 px-5">
      <article className="max-w-3xl mx-auto flex flex-col gap-6">
        <Link to="/blog" className="text-xl mb-4 inline-block">
          <FontAwesomeIcon icon={faArrowLeft} />
        </Link>

        <header className="flex flex-col gap-2 border-b border-stone-800 pb-6">
          <h1 className="text-3xl lg:text-5xl font-bold text-white tracking-tight">
            {post.title}
          </h1>
          <time className="text-sm text-stone-400">
            {new Date(post.date).toLocaleDateString("pt-BR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </time>
        </header>

        {post.cover && (
          <div className="w-full h-64 lg:h-96 overflow-hidden rounded-3xl border border-stone-800">
            <img
              src={getResolvedCover(post.cover)}
              alt={`Capa do post: ${post.title}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}

        <div
          className="conteudo-blog prose prose-invert max-w-none text-stone-300 leading-relaxed space-y-4 pb-20"
          dangerouslySetInnerHTML={{ __html: getResolvedContent(post.content) }}
        />
      </article>
    </main>
  );
}