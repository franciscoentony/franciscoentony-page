export default function Post() {
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ... seu useEffect com fetch aqui ...

  if (loading) {
    return <div className="text-white text-center py-20">Carregando post...</div>;
  }

  if (!post) {
    return <div className="text-white text-center py-20">Post não encontrado.</div>;
  }

  return (
    <article className="max-w-3xl mx-auto py-20 text-white">
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}