import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BlogPostCard from "../components/BlogPostCard";
import type { Post } from "../data/posts"; // Importa diretamente daqui

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}blog-data/index.json`)
      .then((res) => res.json())
      .then((data) => setPosts(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div id="top">
      <Navbar />

      <section className="mx-auto max-w-220 px-7 pt-44 pb-16 text-center">
        <span className="mb-4 block text-[13px] uppercase tracking-[0.08em] text-muted">
          Blog
        </span>
        <h1 className="mb-4 text-4xl font-bold leading-[1.1] sm:text-5xl">
          Anotações sobre código, dados e aprendizado.
        </h1>
        <p className="mx-auto max-w-115 text-[17px] text-secondary">
          Registros do que vou construindo e aprendendo — de projetos pessoais a
          bastidores dos sistemas que desenvolvo no IFRN.
        </p>
      </section>

      <section className="mx-auto max-w-220 px-7 pb-24">
        <div className="flex flex-col gap-3.5 text-left">
          {posts.map((post) => (
            <BlogPostCard key={post.slug} post={post} />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
