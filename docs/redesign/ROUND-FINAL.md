# Rodada final de correções (antes do plano de desempenho)

Consolida a R2 (Revisor), a revisão de design 1 (designer) e a rodada R1 do QA sobre f28ce72. A Fase 4 (ed18c27) já resolveu o I-2 da R2 e o S-8. O QA precisa revalidar o Voltar (I2 do QA) no código novo.

**Desempenho:** I-5 (R2), DS-1 (designer) e BL1 (QA) passam para o `PERF-PLAN.md`. A **exceção** é a correção mínima do BL1 (abaixo), que entra já por ser bloqueadora do DoD.

## Bloqueador

| # | Item | Onde |
|---|---|---|
| BL1-min | `isVisible = false` até o IntersectionObserver responder (canvas fora da tela não desenha nunca) + início escalonado: no máximo 1 canvas iniciando por quadro, os que estão fora da tela só em `requestIdleCallback` | `useCanvasAnimation.ts` |

## Importante

| # | Origem | Item |
|---|---|---|
| I-1 | R2 | A navbar não some depois de clicar com o mouse: usar `has-[:focus-visible]:translate-y-0` |
| I-3 | R2 | Card de projeto corta o conteúdo em 375px: `aspect-auto` com o thumb em altura fixa abaixo de 860px. Validar os 4 cards |
| I-4 | R2 | Reduced motion: o HoloCard não inclina |
| QA-I1 | QA | O h1 (e os capítulos) não podem sair da árvore de acessibilidade: fade só com `opacity` (sem `visibility:hidden`), com `inert`/`tabIndex` para os CTAs invisíveis não receberem foco |
| QA-I3 | QA | `scrollTo({ top: 0, behavior: "instant" })` no ScrollToHash |
| QA-I4 | QA | Prettier em `src/main.tsx`, `.prettierignore` com `blog-cms/layouts`, e `public/robots.txt` (permitir tudo + sitemap opcional) |
| D18 | Designer | `text-balance` em todos os h1/h2; teaser com `max-w-[22ch]` |
| DS-21 / D20 | Designer | Menu mobile em overlay de tela cheia, modal (foco preso, Esc fecha), com animação em escada (sem animação em RM) |
| DS-4 | Designer | h1 do hero em 375px: 3 linhas |
| DS-14 | Designer | Card-convite no teaser quando houver menos de 3 posts |
| DS-15 | Designer | Grade de posts com 2 colunas de 640px a 859px |

## Baixa e sugestões

| # | Origem | Item |
|---|---|---|
| DS-5 | Designer | Larguras dos capítulos C1 e C2 |
| DS-7 | Designer | Ritmo dos capítulos em RM (~120px, C1 à esquerda, C2 à direita) |
| DS-19 | Designer | Contato abaixo de 860px: e-mail numa linha, GitHub e LinkedIn juntos na seguinte |
| QA-S1 | QA | Em 375px, "ROLE PARA EXPLORAR" fica sobre o planeta: subir a dica ou afastar o planeta |
| QA-S2 | QA | A outline do foco não anima (tirar `outline-color` do `transition-colors`) |
| S-2, S-4, S-5, S-7 | R2 | Último dot do carrossel; remover `dotLabel`; tokens `hero-top` e `line-holo`; cursor com `matchMedia` change |

## Fica para depois

| # | Motivo |
|---|---|
| S-1, S-3 | Entram no `PERF-PLAN.md` (A1 e A6) |
| F4-1 | Imagens dos posts com 19,5 MB (`drone.jpg` 10 MB): é conteúdo, depende do Entony |
| F4-2, F4-3 | Já resolvidos na Fase 4 (4b0d281 e ed18c27); o QA confirma |
| F4-4 | D15 só é testável no GitHub Pages: o QA testa no deploy |

## Adendo: revisão de design da Fase 4 (ed18c27)

O relatório completo está em `~/Documents/franciscoentony-v3/REVISAO-ed18c27.md`. Base aprovada: console limpo, prosa fiel ao §7 e footer consistente.

### Decisões do designer (valem como spec)

- **D21. Título do post:** estilo próprio `text-post-title` com `clamp(32px, 4vw, 52px)`, `line-height` 1.08, `letter-spacing` -0.035em, Geist 600 e `text-balance`. O post deixa de usar o clamp do h1 da Home. Espaço de 20px até o resumo e as tags.
- **D22. `--color-prose` #D2D2D7** no corpo: aprovado (13,9:1).
- **D23. Tags nos cards do `/blog`:** no máximo 3 numa linha, e o excedente vira uma pill "+N". O teaser da Home continua **sem** tags.

### Itens

| # | Prioridade | Item |
|---|---|---|
| DF-5 | Alta | Resumo duplicado: esconder o resumo quando o corpo começa com ele (normalizar espaços e entidades e comparar os primeiros ~120 caracteres). Se existir, usar `line-clamp-3` em `secondary`. Regra só no código, sem mexer nos posts |
| DF-4 | Alta | Aplicar a D21 |
| DF-6 | Média | A partir de 860px: corpo em 19px e coluna de leitura de 640px (cerca de 73 caracteres por linha). Meta, tags e imagens acompanham. Abaixo de 860px, 18px |
| DF-7 | Média | Imagens verticais no corpo: `max-height: min(80svh, 720px)`, `width: auto`, centralizadas, mantendo raio e borda |
| DF-11 | Média | `/blog`: 2 colunas a partir de 860px, com **capa 16:9** no topo do card (raio 16). Com 5 posts ou mais, passa a 3 colunas |
| DF-12 | Média | `/blog`: 2 colunas de 640px a 859px (igual ao DS-15) |
| DF-18 | Média | Footer: área de toque de pelo menos 24×24 (`py-1.5`, `gap-x-5`). WCAG 2.5.8 |
| D7 | Baixa | **Limpeza de imagens antigas**, no último commit da rodada: remover `public/home/{avatar.JPG, SEI.png, solar-system.png, the-heroes-journey.png, to-do-list.png, petca.png, connect-responsibly.png}` e `public/EU-PNG.png` (cerca de 13 MB, sem referência em `src`, `index.html` nem nos posts, conferido pelo Tech Lead). O campo `image` de `types/project.ts` fica, porque é tipo de dados |

### Outros destinos

| # | Destino |
|---|---|
| DF-8 (alt dos posts) | Depende do Entony (conteúdo) |
| DF-9 (card "Próximo registro") | Backlog para depois do lançamento |
| DF-15 (revelação do teaser atrasada) | O QA verifica. Provavelmente é o mesmo caso do BL1 |
| DF-20 (imagem de compartilhamento) | O **designer** monta a peça 1200×630 e o Tech Lead faz o commit dela no lugar de `og-foto-entony.jpg` |
| OG por post | Backlog para depois do lançamento |
