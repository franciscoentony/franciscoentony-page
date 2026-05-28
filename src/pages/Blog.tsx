import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface Post {
  title: string;
  slug: string;
  date: string;
  summary: string;
}

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}blog-data/index.json`)
      .then((res) => res.json())
      .then((data) => setPosts(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="max-w-4xl mx-auto min-h-270 px-5 pt-30">
      <div className="flex flex-col gap-3 mb-10">
        <h3 className="text-2xl font-sans">Seja bem vindo(a) ao</h3>
        <h1 className="text-4xl font-bold">Mundo de Entony! 🌎</h1>
        <p className="text-stone-400 text-xl">
          Aqui, compartilho um pouco de meus pensamentos, experiências e
          tecnologia.
        </p>
      </div>
      <div className="grid gap-6">
        {posts.length > 0 ? (
          posts.map((post) => (
            <div key={post.slug} className="p-1 group">
              <article className="p-6 bg-stone-800 rounded-3xl border-2 border-zinc-700 hover:border-stone-500 hover:bg-[#3e3736] duration-300 relative bottom-0 group-hover:bottom-3">
                <Link
                  to={`/blog/${post.slug}`}
                  key={post.slug}
                  className="w-full h-full"
                >
                  <h2 className="text-2xl font-medium transition">
                    {post.title}
                  </h2>
                  <span className="text-zinc-500 text-sm block mt-1">
                    {post.date}
                  </span>
                  <p className="mt-3 text-zinc-300 line-clamp-2">
                    {post.summary}
                  </p>
                </Link>
              </article>
            </div>
          ))
        ) : (
          <div className="w-full h-150 flex items-center justify-center">
            <p className="text-xl text-stone-500">Nenhuma Publicação</p>
          </div>
        )}
      </div>
    </div>
  );
}
