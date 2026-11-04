# CLAUDE.md

Guia para agentes (Claude Code e afins) que trabalham neste repositório.

## Projeto

Site pessoal, portfólio e blog de Francisco Entony, publicado em **https://franciscoentony.com**.

**Projeto em andamento: redesign do layout.** O designer entregou o novo layout no Figma, e a implementação acontece na branch `redesign`. O objetivo é trocar a camada visual sem perder conteúdo, rotas nem o pipeline de deploy.

## Stack

- React 19, TypeScript e Vite 8
- Tailwind CSS v4, com tokens definidos em `src/index.css` dentro de `@theme`
- React Router 7
- Hugo para o blog: os posts em Markdown são compilados para JSON
- Bun como gerenciador de pacotes e runner (existe `package-lock.json`, mas o CI usa `bun install`)
- Ícones: `lucide-react` e Font Awesome

## Comandos

```bash
bun install
bun run dev:react   # servidor Vite
bun run dev:hugo    # recompila o blog (watch) para public/blog-data
bun run build       # Hugo + Vite; copia index.html para 404.html
bun run lint        # ESLint
bun run lint:check  # Prettier
bun run preview
```

Antes de considerar uma tarefa pronta, `bun run lint` e `bun run build` precisam passar.

## Estrutura

```
src/
  pages/        Home, Blog, BlogPost (rotas: /, /blog, /blog/:slug)
  components/   Navbar, Hero, About, Experience, Projects, Skills, Contact, Footer, BlogPostCard
  data/         Conteúdo do site (experience, projects, skills, posts): fonte da verdade do texto
  lib/blog.ts   Busca /blog-data/index.json e reescreve caminhos de imagens
  types/        Tipos compartilhados
  index.css     Fontes, tokens do @theme e estilos globais
blog-cms/       Projeto Hugo (content/posts, layouts/index.json)
public/blog-data/  Saída do Hugo (versionada; consumida em runtime)
.github/workflows/deploy.yml  Deploy no GitHub Pages
```

## Regras importantes

- **Todo push na `main` vai direto para produção** (GitHub Pages). Nunca faça commit ou push direto na `main`. Trabalhe em branch e abra PR. Os PRs são abertos pelo dono do repositório.
- **Separe visual de conteúdo.** No redesign, mexa nos componentes e estilos. Não altere textos em `src/data/` nem posts em `blog-cms/content/` sem pedido explícito.
- **Use só Tailwind.** O projeto está sendo padronizado em Tailwind v4. Não introduza `styled-components` (o único uso que resta, em `Hero.tsx`, deve ser migrado) nem CSS-in-JS.
- **Use tokens, não valores soltos.** Cores, fontes e raios vêm do `@theme` em `src/index.css` (`bg-ink`, `text-paper`, `text-accent`, `font-display`, `rounded-md`, etc.). Tokens novos do Figma entram ali.
- **SPA no GitHub Pages:** o deploy depende de `dist/404.html` (uma cópia do `index.html`) para que a abertura direta de `/blog/:slug` funcione. Não quebre isso.
- **`public/blog/` está no `.gitignore` de propósito**, porque conflita com a rota `/blog`. Os dados do blog ficam em `public/blog-data/`.
- Caminhos de assets devem respeitar `import.meta.env.BASE_URL` (veja `src/lib/blog.ts`).
- Formatação: 2 espaços (`.editorconfig`) e Prettier.
- Idioma: interface e conteúdo em pt-BR.

## Fluxo do redesign (time de agentes)

| Papel | Responsabilidade |
|---|---|
| Gerente de Projetos / Tech Lead | Planejamento, critérios de aceite, branch e release |
| Designer | Layout no Figma; tira dúvidas de spacing, estados e responsividade |
| Desenvolvedor Front-End | Implementação fiel ao Figma |
| QA | Testes funcionais, responsivos, de acessibilidade e performance |
| Revisor | Comparação Figma × implementação e revisão crítica do código |

Ordem de implementação: **tokens → componentes base (Navbar, Footer, botões, cards) → seções da Home → Blog e BlogPost.**

### Critérios de aceite (Definition of Done)

- Fidelidade ao Figma nas larguras 375, 768, 1280 e 1440px
- Lighthouse com Performance e Acessibilidade ≥ 90
- Nenhum erro ou warning no console
- `bun run lint` e `bun run build` sem erros
- Rotas `/`, `/blog` e `/blog/:slug` funcionando, inclusive ao abrir a URL diretamente
- Navegação por teclado, foco visível, `alt` nas imagens e contraste AA
- Conteúdo de `src/data/` preservado
