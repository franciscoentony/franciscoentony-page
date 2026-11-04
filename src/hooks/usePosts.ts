import { useEffect, useState } from "react";
import type { Post } from "../data/posts";
import { fetchPosts } from "../lib/blog";

export type PostsStatus = "loading" | "error" | "ready";

/**
 * Busca os posts do blog (/blog-data/index.json), do mais novo para o mais antigo.
 *
 * Exemplo:
 *   const { status, posts } = usePosts();
 *   if (status === "ready") posts.slice(0, 3) // 3 mais recentes
 */
export function usePosts() {
  const [status, setStatus] = useState<PostsStatus>("loading");
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    // Se o componente sair da tela antes do fetch terminar, ignoramos a resposta
    let ignore = false;

    fetchPosts()
      .then((data) => {
        if (ignore) return;
        // Datas "AAAA-MM-DD" podem ser comparadas como texto
        const newestFirst = [...data].sort((a, b) =>
          b.date.localeCompare(a.date),
        );
        setPosts(newestFirst);
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
