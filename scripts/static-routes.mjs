/*
 * D15: cria cópias do index.html para as rotas do blog dentro de dist/.
 *
 * Por quê: no GitHub Pages, abrir /blog ou /blog/<slug> direto respondia
 * HTTP 404 (o 404.html servia a SPA, mas com status de erro). Isso atrapalha
 * SEO, previews de link e o Lighthouse. Com um index.html em cada pasta,
 * o Pages responde 200 e o React Router cuida do resto.
 *
 * Gera:
 *   dist/blog/index.html
 *   dist/blog/<slug>/index.html   (um para cada post de blog-data/index.json)
 *
 * Roda depois do "vite build" (veja build:react no package.json).
 * Só usa módulos nativos do Node/Bun, sem dependências.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
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

/** Copia o index.html para dist/<pasta>/index.html */
function createRoute(folder) {
  const targetDir = join(distDir, folder);
  mkdirSync(targetDir, { recursive: true });
  copyFileSync(indexHtml, join(targetDir, "index.html"));
  console.log(`[static-routes] /${folder}/`);
}

createRoute("blog");

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
  createRoute(`blog/${post.slug}`);
}

console.log(`[static-routes] ${posts.length} post(s) + /blog/ gerados.`);
