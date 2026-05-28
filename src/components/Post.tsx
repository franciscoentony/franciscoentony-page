import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

interface PostData {
  title: string;
  content: string;
}

export default function Post() {
  const { slug } = useParams();
  const [post, setPost] = useState<PostData | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}blog-data/index.json`)
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((p: any) => p.slug === slug);
        setPost(found || null);
      });
  }, [slug]);

  const getResolvedContent = (contentHtml: string) => {
    if (!contentHtml) return "";
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    return contentHtml
      .replace(/src="\/blog\//g, `src="${base}/blog-data/`)
      .replace(/src="\/blog-data\//g, `src="${base}/blog-data/`);
  };

  if (!post) return <div>Post não encontrado</div>;

  return (
    <div>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: getResolvedContent(post.content) }} />
    </div>
  );
}