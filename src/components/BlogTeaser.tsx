import { useEffect, useState } from "react";
import { blog, sectionIds } from "../content/ui";
import type { Post } from "../data/posts";
import { fetchPosts } from "../lib/blog";
import PostCard from "./blog/PostCard";
import Button from "./ui/Button";
import Reveal from "./ui/Reveal";
import Section from "./ui/Section";

type Status = "loading" | "error" | "ready";

/** Seção "Diário de bordo": os 3 posts mais recentes do blog. */
export default function BlogTeaser() {
  const [status, setStatus] = useState<Status>("loading");
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    // Se a seção sair da tela antes do fetch terminar, ignoramos a resposta
    let ignore = false;

    fetchPosts()
      .then((data) => {
        if (ignore) return;
        // Mais recentes primeiro (datas "AAAA-MM-DD" podem ser comparadas como texto)
        const newest = [...data].sort((a, b) => b.date.localeCompare(a.date));
        setPosts(newest.slice(0, 3));
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

      {status === "loading" && (
        <div role="status" className="grid gap-5 tab:grid-cols-3">
          <span className="sr-only">{blog.loading}</span>
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              aria-hidden="true"
              className="min-h-[250px] animate-pulse rounded-lg border border-line bg-raised"
            />
          ))}
        </div>
      )}

      {status === "error" && (
        <p role="status" className="text-secondary">
          {blog.error}
        </p>
      )}

      {status === "ready" && posts.length === 0 && (
        <p className="text-secondary">{blog.empty}</p>
      )}

      {status === "ready" && posts.length > 0 && (
        <ul className="grid gap-5 tab:grid-cols-3">
          {posts.map((post, index) => (
            <li key={post.slug}>
              <Reveal delay={(index + 1) as 1 | 2 | 3} className="h-full">
                <PostCard post={post} />
              </Reveal>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
