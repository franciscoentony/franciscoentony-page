# Revisão R1: Fases 1 e 2 (c393c70..94b707a)

**Veredito do Revisor:** aprovado com ressalvas, sem bloqueadores. Data: 04/11/2026.

A triagem e os prazos abaixo são do Tech Lead. O relatório completo está no histórico do Maestri (Revisor → Gerente de Projetos).

## Aplicar já, durante a Fase 3

Estes itens afetam o código novo da Fase 3.

| # | Item | Onde |
|---|---|---|
| 14 | Criar tokens antes de usar: número de stat (Doto 900, `clamp(40px,4.4vw,56px)`), número de capítulo (Doto 800, 15px, +0.2em) e labels mono (10.5–12px, +0.04 a +0.12em). Substituir os valores soltos já existentes (`text-[13px]`, `text-[12.5px]`, `tracking-[0.02em]`, `pt-5.5`/`gap-5.5`) | `src/index.css`, Navbar, Toast, Footer |
| 15 | `html { scroll-padding-top: var(--spacing-nav) }` | `src/index.css` |
| 9 | Starfield com `frameInterval` de cerca de 33ms (30fps). Todos os canvases novos também a 30fps | `Starfield.tsx:89` |
| 12 | O stat "4 missões" passa a ser derivado de `projects.length` | `content/ui.ts:119` |
| — | Rodar Prettier em todo arquivo novo ou alterado antes do commit | — |

## Rodada R1: logo depois da Fase 3 (obrigatório antes do merge)

| # | Severidade | Item | Onde |
|---|---|---|---|
| 1 | Importante | Navbar visível enquanto houver foco dentro dela (`focus-within:translate-y-0` ou estado de foco). WCAG 2.4.11 | `Navbar.tsx`, `useHideOnScroll.ts` |
| 2 | Importante | Não rolar para o topo em navegação POP (`useNavigationType`). O Voltar precisa manter a posição | `ScrollToHash.tsx:20` |
| 3 | Importante | Menu mobile: fechar no focusout do header, no clique fora e ao passar de 860px (`matchMedia`) | `Navbar.tsx:91-113` |
| 4 | Importante | `prettier --write` nos arquivos do diff, num commit `style:` separado | 9 arquivos |
| 7 | Sugestão | Condição de corrida no fetch: flag `ignore` no cleanup | `BlogPost.tsx` |
| 8 | Sugestão | Starfield recria as estrelas só quando a largura muda | `Starfield.tsx:46` |
| 10 | Sugestão | Toast: limpar a mensagem ao esconder, para que ela seja anunciada de novo | `Toast.tsx:35-42` |
| 11 | Sugestão | Menu mobile com `bg-ink` sólido | `Navbar.tsx` |
| 13 | Sugestão | Favicon com `type="image/png"` | `index.html:5` |
| 16 | Sugestão | Links externos com o texto sr-only "(abre em nova aba)" | `Footer.tsx` |

## Fase 4 (Blog e Post)

| # | Item |
|---|---|
| 5 | Preload real das fontes: `rel=preload as=font` do woff2 de Geist 400/600, ou fontes auto-hospedadas (preferível para o Lighthouse) |
| 6 | SEO: meta description, og:title/description/image (foto nova), twitter:card, `document.title` por rota (título do post no BlogPost) |

## Achados do baseline do QA (produção atual): destino

O relatório completo está em `qa/baseline/RELATORIO.md`.

| Achado | Destino |
|---|---|
| B1: `/blog` e `/blog/:slug` respondem 404 no GitHub Pages | Fase 4 (D15) |
| B2: contraste do `muted` | Fase 3 e R1 (D17) |
| B3: sem landmark `<main>` | R1, em todas as páginas |
| B4: Hero ignora reduced-motion | Já resolvido pela Universe; o QA confirma |
| B6: salto de heading h1→h3 no Blog | Fase 4 |
| B7: NavLink marca Início e Contato ativos ao mesmo tempo | R1 |
| B8: `BlogPostCard` usa `<a>` puro e recarrega a SPA | Fase 3 (teaser) e Fase 4 |
| B9: alts genéricos nos posts | Depende do Entony (conteúdo) |
| B10: "View on GitHub" ×4 sem contexto | Fase 3 (cards de projeto com `aria-label` por projeto) |
| B11: type do favicon | R1 (#13) |
| B12: meta description | Fase 4 (#6) |
| B13: arquivos soltos em `public/blog-data` | Depende do Entony |
| B14: lint e Prettier na `main` | Lint já corrigido (501af91); Prettier na R1 (#4) |
