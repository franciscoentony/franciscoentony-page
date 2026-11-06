import { useEffect, useState } from "react";
import type { Post } from "../data/posts";
import { fetchPosts, getCachedPosts } from "../lib/blog";

export type PostsStatus = "loading" | "error" | "ready";

/** Do mais novo para o mais antigo (datas "AAAA-MM-DD" podem ser comparadas como texto). */
function sortNewestFirst(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Busca os posts do blog (/blog-data/index.json), do mais novo para o mais antigo.
 * Se os posts já foram carregados antes (cache em lib/blog.ts), começa pronto.
 *
 * Exemplo:
 *   const { status, posts } = usePosts();
 *   if (status === "ready") posts.slice(0, 3) // 3 mais recentes
 */
export function usePosts() {
  const cached = getCachedPosts();
  const [status, setStatus] = useState<PostsStatus>(
    cached ? "ready" : "loading",
  );
  const [posts, setPosts] = useState<Post[]>(
    cached ? sortNewestFirst(cached) : [],
  );

  useEffect(() => {
    // Se o componente sair da tela antes do fetch terminar, ignoramos a resposta
    let ignore = false;

    fetchPosts()
      .then((data) => {
        if (ignore) return;
        setPosts(sortNewestFirst(data));
        setStatus("ready");
      })
      .catch((error) => {
        if (ignore) return;
        console.error("Erro ao carregar os posts:", error);
        setStatus("error");
      });

    return () => {
      ignore = true;
    };
  }, []);

  return { status, posts };
}
