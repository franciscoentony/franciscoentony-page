# Revisão R2: Fase 3 + correções da R1 (94b707a..f28ce72)

**Veredito do Revisor:** aprovado com ressalvas, sem bloqueadores. Data: 04/11/2026.

## O que foi confirmado rodando

- Lint, build e Prettier passam. O bundle JS caiu de 341 kB para 294 kB (gzip: de 108,5 kB para 94,6 kB).
- axe-core na Home: **0 violações**. Há um único `<main>` e um único `h1`, e os 9 canvases têm `aria-hidden`.
- LCP de cerca de 0,7 s no desktop e cerca de 1,2 s em 412px com CPU 4×.
- Itens da R1: 2, 3, 4, 7–16 corrigidos. Os itens 1 e 2 tiveram problemas (I-1 e I-2 abaixo).
- Fidelidade ao HANDOFF §3/§4 confirmada seção por seção. Reduced motion está correto, com exceção do tilt (I-4).
- Decisões do Front-End (a)–(d) **aprovadas**: cursor a cada frame, dots `aria-hidden`, parsing manual de datas e `sr-only` nos links GitHub.

## Triagem do Tech Lead

### Entra na Fase 4 (já repassado ao Front-End)

| # | Item |
|---|---|
| I-2 | Voltar para `/blog` restaura só parte da rolagem: cachear a promise de `fetchPosts()` no módulo (`src/lib/blog.ts`) |
| S-8 | Unificar `lib/date.ts` (`formatShortDate`) e `lib/blog.ts` (`formatDate`) |

### Rodada R2 de correções: depois da Fase 4 (obrigatório antes do merge)

Será consolidada com os relatórios do QA e do designer.

| # | Severidade | Item | Onde |
|---|---|---|---|
| I-1 | Importante | Regressão: depois de um clique de mouse num link, a navbar não some mais. Usar `has-[:focus-visible]:translate-y-0` | `Navbar.tsx` |
| I-3 | Importante | Card de projeto corta o conteúdo em 375px (o "GitHub ›" fica 7px para fora). Abaixo de 860px, usar `aspect-auto` com o thumb em altura fixa | `ProjectCard.tsx:20`, `ProjectThumb.tsx:79` |
| I-4 | Importante | Reduced motion: o HoloCard ainda inclina em 3D. Retornar logo no início do `handlePointerMove` | `HoloCard.tsx:32-55` |
| I-5 | Importante | Custo dos canvases (até cerca de 40% da main thread com a página parada). (a) quantização + cache de `fillStyle` nos ASCII, (b) esfera a 30fps sem trocar `zIndex`/`color` a cada frame, (c) ticker único de rAF, (d) cursor pula frame quando ocioso. Medir de novo no Lighthouse mobile | Portrait, ProjectThumb, ContactField, SkillsSphere, useCanvasAnimation, CustomCursor |
| S-1 | Sugestão | Extrair `drawAsciiGrid` (resolve junto o I-5a) | canvases ASCII |
| S-2 | Sugestão | Último dot do carrossel nunca acende em 1440 | carrossel |
| S-3 | Sugestão | Timeline escreve a altura via ref e liga o listener só com o IntersectionObserver | `Experience.tsx:34-68` |
| S-4 | Sugestão | Remover `projects.dotLabel`, que não é usado | `content/ui.ts` |
| S-5 | Sugestão | Tokens `--spacing-hero-top` e `--color-line-holo` | `Universe.tsx`, `HoloCard.tsx` |
| S-7 | Sugestão | Cursor acompanha a troca de dispositivo de entrada (`matchMedia` change) | `CustomCursor.tsx:19` |

### Não fazer

| # | Motivo |
|---|---|
| S-6 | Sem efeito visível, confirmado pelo próprio Revisor |
