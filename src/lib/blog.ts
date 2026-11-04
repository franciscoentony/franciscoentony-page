import type { Post } from "../data/posts";

/** Base do site (respeita subpastas, ex.: deploy em subdiretório). */
function getBase(): string {
  return import.meta.env.BASE_URL.replace(/\/$/, "");
}

/** Busca o índice de posts gerado pelo Hugo. */
export async function fetchPosts(): Promise<Post[]> {
  const res = await fetch(`${getBase()}/blog-data/index.json`);
  if (!res.ok) throw new Error(`Falha ao carregar posts (${res.status})`);
  return res.json();
}

/** Busca um post específico pelo slug. */
export async function fetchPost(slug: string): Promise<Post | null> {
  const posts = await fetchPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

/** Reescreve o caminho de uma imagem de capa pra apontar pra pasta gerada pelo Hugo. */
export function resolveAssetPath(path: string): string {
  if (!path) return "";
  const base = getBase();
  return path.replace(/^\/(blog|blog-data)\//, `${base}/blog-data/`);
}

/** Reescreve os `src` de imagens dentro do HTML do conteúdo do post. */
export function resolveContentHtml(html: string): string {
  if (!html) return "";
  const base = getBase();

  const out = html
    .replace(/src="\/blog\/images\//g, `src="${base}/blog-data/images/`)
    .replace(/src="\/blog-data\/images\//g, `src="${base}/blog-data/images/`)
    .replace(/src="\/blog\//g, `src="${base}/blog-data/`)
    .replace(/src="\/blog-data\//g, `src="${base}/blog-data/`);

  // O visual das imagens (raio, borda) vem da classe post-content em
  // src/index.css (D14), não mais de estilo inline.
  return out;
}
