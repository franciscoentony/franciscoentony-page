/*
 * D15: cria cópias do index.html para as rotas do blog dentro de dist/.
 *
 * Por quê: no GitHub Pages, abrir /blog ou /blog/<slug> direto respondia
 * HTTP 404 (o 404.html servia a SPA, mas com status de erro). Isso atrapalha
 * SEO, previews de link e o Lighthouse. Com um index.html em cada pasta,
 * o Pages responde 200 e o React Router cuida do resto.
 *
 * Gera também dist/sitemap.xml (citado em public/robots.txt).
 *
 * Gera:
 *   dist/blog/index.html
 *   dist/blog/<slug>/index.html   (um para cada post de blog-data/index.json)
 *
 * Cada cópia recebe título, descrição e og:url/og:title/og:description
 * próprios, para os previews de link (WhatsApp, LinkedIn...) que não rodam JS.
 *
 * Roda depois do "vite build" (veja build:react no package.json).
 * Só usa módulos nativos do Node/Bun, sem dependências.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const distDir = "dist";
const indexHtml = join(distDir, "index.html");
const postsJson = join(distDir, "blog-data", "index.json");

if (!existsSync(indexHtml)) {
  console.error(
    `[static-routes] ${indexHtml} não existe. Rode o vite build antes.`,
  );
  process.exit(1);
}

const siteUrl = "https://franciscoentony.com";
const titleSuffix = " · Francisco Entony"; // igual a seo.titleSuffix em src/content/ui.ts
const baseHtml = readFileSync(indexHtml, "utf8");

/** Escapa texto para usar dentro de atributos HTML. */
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Converte entidades que o Hugo já deixa no texto (ex.: &ldquo;) de volta. */
function decodeEntities(text) {
  const named = {
    amp: "&",
    quot: '"',
    lt: "<",
    gt: ">",
    ldquo: "“",
    rdquo: "”",
    lsquo: "‘",
    rsquo: "’",
    ndash: "–",
    mdash: "—",
    hellip: "…",
    nbsp: " ",
  };
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&(\w+);/g, (match, name) => named[name] ?? match);
}

/** Junta espaços/quebras de linha e corta em ~160 caracteres sem partir palavra. */
function shorten(text, max = 160) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, clean.lastIndexOf(" ", max)) + "…";
}

/** Troca o content de uma <meta name|property="..."> do HTML. */
function setMeta(html, key, value) {
  const pattern = new RegExp(
    `(<meta\\s+(?:name|property)="${key}"\\s+content=")[^"]*(")`,
  );
  return html.replace(pattern, `$1${escapeHtml(value)}$2`);
}

/** Cria dist/<pasta>/index.html com o título e a descrição da página. */
/**
 * Preload da 1ª imagem do post (é o LCP): o navegador começa a baixá-la
 * junto com o HTML, sem esperar o JS buscar o index.json (A9).
 */
function firstImagePreload(contentHtml) {
  const img = /<img\b[^>]*>/i.exec(contentHtml ?? "")?.[0];
  if (!img) return "";
  const attr = (name) => new RegExp(`${name}="([^"]*)"`).exec(img)?.[1];
  const toSite = (url) =>
    url.replace(/\/blog\/images\//g, "/blog-data/images/");
  const src = attr("src");
  if (!src) return "";
  const srcset = attr("srcset");
  const sizes = attr("sizes");
  return (
    `<link rel="preload" as="image" fetchpriority="high" href="${escapeHtml(toSite(src))}"` +
    (srcset ? ` imagesrcset="${escapeHtml(toSite(srcset))}"` : "") +
    (sizes ? ` imagesizes="${escapeHtml(sizes)}"` : "") +
    " />"
  );
}

function createRoute(
  folder,
  title,
  description,
  type = "website",
  extraHead = "",
) {
  let html = baseHtml.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(title)}</title>`,
  );
  html = setMeta(html, "description", description);
  html = setMeta(html, "og:type", type);
  html = setMeta(html, "og:url", `${siteUrl}/${folder}/`);
  html = setMeta(html, "og:title", title);
  html = setMeta(html, "og:description", description);
  html = setMeta(html, "twitter:title", title);
  html = setMeta(html, "twitter:description", description);
  if (extraHead) html = html.replace("</head>", `    ${extraHead}\n  </head>`);

  const targetDir = join(distDir, folder);
  mkdirSync(targetDir, { recursive: true });
  writeFileSync(join(targetDir, "index.html"), html);
  console.log(`[static-routes] /${folder}/`);
}

// Preload do índice de posts: o navegador já começa a baixá-lo junto com o
// HTML, em vez de esperar o JS da página pedir (A9)
const postsPreload =
  '<link rel="preload" as="fetch" href="/blog-data/index.json" crossorigin="anonymous" />';

// /blog (textos iguais a seo.blogTitle e blog.lead em src/content/ui.ts)
createRoute(
  "blog",
  `Blog${titleSuffix}`,
  "Registros do que vou construindo e aprendendo — de projetos pessoais a bastidores dos sistemas que desenvolvo no IFRN.",
  "website",
  postsPreload,
);

const posts = existsSync(postsJson)
  ? JSON.parse(readFileSync(postsJson, "utf8"))
  : [];

for (const post of posts) {
  // Só aceita slugs simples (letras, números e hífen) para não criar
  // pastas fora de dist/ por engano.
  if (!/^[a-z0-9-]+$/i.test(post.slug ?? "")) {
    console.warn(`[static-routes] slug ignorado: ${JSON.stringify(post.slug)}`);
    continue;
  }
  const title = decodeEntities(post.title ?? "");
  const description = shorten(
    decodeEntities(post.summary || post.excerpt || ""),
  );
  createRoute(
    `blog/${post.slug}`,
    `${title}${titleSuffix}`,
    description,
    "article",
    `${postsPreload}\n    ${firstImagePreload(post.content)}`,
  );
}

// sitemap.xml com as URLs reais do site (o sitemap do Hugo em blog-data
// usa caminhos do Hugo, que não são as rotas do site). Citado no robots.txt.
const urls = [
  { loc: `${siteUrl}/` },
  { loc: `${siteUrl}/blog/` },
  ...posts
    .filter((post) => /^[a-z0-9-]+$/i.test(post.slug ?? ""))
    .map((post) => ({
      loc: `${siteUrl}/blog/${post.slug}/`,
      lastmod: String(post.date ?? "").slice(0, 10),
    })),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) =>
      `  <url><loc>${url.loc}</loc>${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ""}</url>`,
  )
  .join("\n")}
</urlset>
`;
writeFileSync(join(distDir, "sitemap.xml"), sitemap);

console.log(
  `[static-routes] ${posts.length} post(s) + /blog/ gerados (+ sitemap.xml).`,
);
