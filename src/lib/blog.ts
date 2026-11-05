import type { Post } from "../data/posts";

/** Base do site (respeita subpastas, ex.: deploy em subdiretório). */
function getBase(): string {
  return import.meta.env.BASE_URL.replace(/\/$/, "");
}

/*
 * Cache dos posts: o index.json é buscado UMA vez por visita.
 * - postsPromise: evita dois fetch ao mesmo tempo (Home e /blog, por exemplo).
 * - postsCache: os dados já carregados, para as páginas renderizarem na hora
 *   (sem "Carregando...") ao voltar para /blog. Assim o navegador consegue
 *   restaurar a rolagem inteira no botão Voltar (R2, I-2).
 */
let postsPromise: Promise<Post[]> | null = null;
let postsCache: Post[] | null = null;

/** Busca o índice de posts gerado pelo Hugo (com cache). */
export function fetchPosts(): Promise<Post[]> {
  if (!postsPromise) {
    postsPromise = fetch(`${getBase()}/blog-data/index.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Falha ao carregar posts (${res.status})`);
        return res.json() as Promise<Post[]>;
      })
      .then((posts) => {
        postsCache = posts;
        return posts;
      })
      .catch((error) => {
        // Se falhar, limpa o cache para a próxima tentativa buscar de novo
        postsPromise = null;
        throw error;
      });
  }
  return postsPromise;
}

/** Posts já carregados nesta visita, ou null se ainda não foram buscados. */
export function getCachedPosts(): Post[] | null {
  return postsCache;
}

/** Busca um post específico pelo slug. */
export async function fetchPost(slug: string): Promise<Post | null> {
  const posts = await fetchPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

/**
 * Vizinhos de um post na lista (o index.json vem do mais novo para o mais
 * antigo): `next` = o registro mais antigo, `prev` = o mais novo. null quando
 * não existe (ex.: o primeiro post não tem `next`). Usado no "Continue no
 * diário" do detalhe do post (adendo B).
 */
export function getAdjacentPosts(
  posts: Post[],
  slug: string,
): { prev: Post | null; next: Post | null } {
  const index = posts.findIndex((p) => p.slug === slug);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: posts[index - 1] ?? null,
    next: posts[index + 1] ?? null,
  };
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
    .replace(/src="\/blog-data\//g, `src="${base}/blog-data/`)
    // srcset (versões de 800px do render hook do Hugo, A9): várias URLs
    .replace(/srcset="[^"]*"/g, (srcset) =>
      srcset.replace(/\/blog\/images\//g, `${base}/blog-data/images/`),
    );

  // O visual das imagens (raio, borda) vem da classe post-content em
  // src/index.css (D14), não mais de estilo inline.
  return out;
}
