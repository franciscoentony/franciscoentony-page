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

  let out = html
    .replace(/src="\/blog\/images\//g, `src="${base}/blog-data/images/`)
    .replace(/src="\/blog-data\/images\//g, `src="${base}/blog-data/images/`)
    .replace(/src="\/blog\//g, `src="${base}/blog-data/`)
    .replace(/src="\/blog-data\//g, `src="${base}/blog-data/`);

  // Aplica o arredondamento direto como inline style no <img>. Isso evita
  // depender da cascata do CSS — se o tema do Hugo carregar alguma folha de
  // estilo depois do Tailwind com regra pra <img>, ela venceria mesmo com
  // "!important" nas classes do prose. Inline style sempre tem prioridade.
  const imgStyle =
    "border-radius:0.75rem;border:1px solid #1E1E22;display:block;";
  out = out.replace(/<img\b([^>]*)>/gi, (match, attrs) => {
    if (/style\s*=\s*"/i.test(attrs)) {
      return match.replace(
        /style\s*=\s*"([^"]*)"/i,
        (_m: string, existing: string) => `style="${existing};${imgStyle}"`,
      );
    }
    return `<img${attrs} style="${imgStyle}">`;
  });

  return out;
}

/** Formata uma data ISO (front matter do Hugo) no padrão pt-BR. */
export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
