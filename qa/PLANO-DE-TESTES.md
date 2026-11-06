# Plano de testes: redesign v3 do franciscoentony.com

**Autor:** QA · **Data:** 04/11/2026 · **Branch:** `redesign`
**Fontes:** `CLAUDE.md` (DoD, D1–D10) e `docs/redesign/HANDOFF.md` (§2 tokens, §4 estados/animações/notas para o QA, §7 Blog/Post).

## 1. Escopo e abordagem

| Item | Como |
|---|---|
| Ambiente alvo | URL configurável (`QA_BASE_URL`). Padrão: `bun run build && bun run preview` em `http://localhost:4173` |
| "Antes" | Baseline contra a produção `https://franciscoentony.com`, salvo em `qa/baseline/` |
| Navegador | Chrome estável (channel `chrome`), headless |
| Larguras | 375, 768, 1280 e 1440px (D1: fidelidade estrita em 1280/1440; 375/768 validadas por QA + designer) |
| Rotas | `/`, `/blog`, `/blog/:slug` (slug real do `index.json`), slug inexistente, `/404.html` |
| Automação | Playwright + axe-core (`qa/tests/`), Lighthouse (`qa/scripts/lighthouse.mjs`) |
| Manual | Fidelidade visual contra o protótipo/Figma, sensação das animações, leitores de tela, Safari/iOS |

**Tags dos casos automatizados**
- `@dod`: critério do DoD, vale para o site atual e para o redesign.
- `@redesign`: comportamento específico do HANDOFF (canvas, cursor, foco lavanda, carrossel). No baseline esses casos **são pulados** quando o recurso não existe, ou **falham de propósito** (ex.: cor do foco), para servir de régua.

**Critério de severidade**
- **Bloqueante:** quebra um item do DoD (rota não abre, erro no console, Lighthouse < 90, falha AA, foco invisível, conteúdo de `src/data/` alterado).
- **Alta:** diverge do HANDOFF em 1280/1440, ou quebra o layout em 375/768.
- **Média/Baixa:** detalhe visual, copy, melhoria.

## 2. Casos de teste

Legenda da coluna **Auto:** ✅ automatizado · 🟡 parcial (automação mais conferência manual) · ✋ manual.

### 2.1 Rotas e acesso direto (DoD: rotas funcionando, inclusive por URL direta)

| ID | Caso | Passos | Esperado | Auto |
|---|---|---|---|---|
| RT-01 | Home por URL direta | Abrir `/` | 200, `#root` montado, h1 visível | ✅ `routes.spec` |
| RT-02 | Blog por URL direta | Abrir `/blog` | Lista de posts do `index.json` renderizada | ✅ |
| RT-03 | Post por URL direta | Abrir `/blog/<slug>` em aba nova | Post completo (meta, h1, tags, corpo, imagens) | ✅ |
| RT-04 | Slug inexistente | Abrir `/blog/post-que-nao-existe-qa` | Estado "não encontrado" com link para `/blog`, sem exceção | ✅ |
| RT-05 | Fallback SPA | `GET /404.html` no build | Existe e carrega o mesmo bundle que `index.html` | ✅ |
| RT-06 | Navegação client-side | Navbar → Blog → primeiro post → voltar | URL e conteúdo corretos, Back funciona, sem erro | ✅ (1280, 375) |
| RT-07 | Links | Varre todos os `<a>` das 3 rotas | Links internos respondem; links do GitHub existem; `_blank` com `rel=noopener`; nenhum link sem nome nem `href="#"` vazio | ✅ |
| RT-08 | Âncoras da Home | Links `#sobre`, `#projetos` etc. | Alvo existe e entra na viewport (descontando a nav de 48px) | ✅ `KB-02` + ✋ offset |
| RT-09 | Status HTTP em produção | Acesso direto a `/blog` no GitHub Pages | Hoje retorna **404** com a SPA (limitação do 404.html): o Lighthouse não audita e o SEO é afetado. Ver achado B1 do baseline | ✅ anotação |
| RT-10 | Blog teaser na Home | Seção "Diário de bordo" | Exatamente os **3 posts mais recentes** do `index.json`, em ordem de data; "Todos os posts ›" leva a `/blog` | ✋ (+ RT-07) |
| RT-11 | Reload em rota interna | F5 em `/blog/<slug>` | Mesmo conteúdo (SPA reidrata) | ✅ (equivale a RT-03) |

### 2.2 Responsividade (375 / 768 / 1280 / 1440)

| ID | Caso | Esperado | Auto |
|---|---|---|---|
| RS-01 | Sem scroll horizontal nas 3 rotas × 4 larguras | `scrollWidth ≤ clientWidth`; lista dos elementos que vazam | ✅ |
| RS-02 | Screenshots acima da dobra e página inteira | Gerados em `<out>/screenshots/w<largura>/` para comparação com o Figma e o protótipo | ✅ |
| RS-03 | Breakpoint 860px (`--breakpoint-tab`) | Abaixo: Player e Experiência em 1 coluna, Skills em 2, Posts em 1, capítulos centralizados embaixo, planeta 25% maior, título da Experiência não-sticky | ✋ (screenshots 768/375) |
| RS-04 | Menu mobile | Abaixo de 860px os links da nav somem; **precisa existir** um menu alternativo acessível (o HANDOFF não define) | 🟡 RT-06 avisa se não houver botão "menu" |
| RS-05 | Fidelidade 1280/1440 | Container `min(1080px, 100% - 48px)`, nav de 48px, gaps e raios do HANDOFF §2 | ✋ (com o Revisor) |
| RS-06 | Carrossel em telas pequenas | Cards de 360px não estouram em 375; scroll-snap funciona com toque | 🟡 RS-01 + ✋ |
| RS-07 | Imagens do post | Capa e imagens do corpo com raio 16, borda line e largura máxima da coluna (680px) | ✋ |
| RS-08 | Tipografia fluida | h1/h2/lead com os `clamp()` do HANDOFF nos 4 tamanhos | ✋ |

### 2.3 Teclado e foco (DoD: navegação por teclado e foco visível)

| ID | Caso | Esperado | Auto |
|---|---|---|---|
| KB-01 | Tab percorre a página inteira | Todos os focáveis alcançados, sem armadilha de foco | ✅ (1280, 375) |
| KB-01a | Foco visível | Todo elemento focado tem indicador | ✅ |
| KB-01b | Padrão D8 | `:focus-visible` = `outline: 2px solid #C9BCFF; outline-offset: 3px` | ✅ `@redesign` |
| KB-01c | Foco nunca em elemento escondido | Nav escondida pelo scroll (`translateY(-100%)`) **reaparece** ao receber foco, ou não recebe foco | ✅ |
| KB-02 | Âncoras via Enter | Leva ao destino | ✅ |
| KB-03 | Carrossel por teclado | Tab nos cards traz o próximo à vista; setas avançam (HANDOFF §4) | ✅ `@redesign` |
| KB-04 | Card holo com foco | Outline no card, **sem tilt** | ✋ |
| KB-05 | Botão de e-mail (Contato) | Enter/Espaço copia o e-mail e mostra o toast; toast anunciado (`role=status`/`aria-live`) | ✋ |
| KB-06 | Esfera de skills | Não precisa ser focável (decorativa), mas não pode prender o foco; as 4 colunas trazem a mesma informação | 🟡 KB-01 |
| KB-07 | Skip link (recomendado) | "Pular para o conteúdo" antes da Universe de 520vh | ✋ recomendação |

### 2.4 Acessibilidade e contraste (DoD: alt nas imagens, contraste AA)

| ID | Caso | Esperado | Auto |
|---|---|---|---|
| A11Y-01 | axe-core WCAG 2.1 A/AA + best-practice | 0 violações nas 3 rotas × 4 larguras, no estado final (depois de rolar tudo) | ✅ |
| A11Y-02 | **Muted `#48484D`** (≈ 2.3:1 sobre preto) | No estado final, nenhum texto não decorativo em muted. Só é aceito em transição (palavras ainda não lidas) ou com `aria-hidden` | ✅ |
| A11Y-03 | Semântica | `lang=pt-BR`, `<title>`, um único h1, `<main>`, `<nav>`, headings sem salto, canvases com `aria-hidden` | ✅ (1280) |
| A11Y-04 | `alt` em todas as imagens | Foto com `alt="Foto de Francisco Entony"`; imagens dos posts com alt descritivo (não "Imagem-palestra") | ✅ presença · ✋ qualidade |
| A11Y-05 | Contraste de secondary `#86868B` | ≈ 5.8:1, passa AA no texto normal | ✅ via axe |
| A11Y-06 | Texto com gradiente (`.grad`) | Contraste do trecho mais escuro (`#8B6CFF` sobre preto ≈ 5.7:1, passa) ≥ 4.5 em texto normal ou ≥ 3 em títulos grandes; atenção se houver card/fundo atrás | ✋ (o axe não mede gradiente) |
| A11Y-07 | Palavra a palavra (lead do Player 1) | Leitor de tela lê o parágrafo inteiro, não palavra por palavra em `<span>` soltos | ✋ VoiceOver |
| A11Y-08 | Contadores (19 / 30+ / 4) | Valor final acessível (não ler "0") | ✋ |
| A11Y-09 | Zoom 200% / texto 200% | Sem perda de conteúdo nem sobreposição | ✋ |

### 2.5 prefers-reduced-motion (seguir o HANDOFF, **não** o protótipo, D8)

| ID | Caso | Esperado | Auto |
|---|---|---|---|
| RM-01 | Animações e transições CSS | Nenhuma rodando (`document.getAnimations()`) | ✅ (1280, 375) |
| RM-02 | `.rv` e textos de entrada | Já visíveis (opacidade 1, sem translateY) sem precisar rolar | ✅ |
| RM-03 | **Canvases** (planeta, esfera, campo ASCII, estrelas, thumbs) | **Um quadro estático**: zero redesenho contínuo, sem rotação, cintilação nem dissolução. É a lacuna do protótipo, **não copiar** | ✅ instrumentação do contexto 2D |
| RM-04 | Cursor | Cursor nativo; sem losango/anel/rastro | ✅ (1280) |
| RM-05 | Universe | Sem pin (sem palco sticky de 520vh); hero e 3 capítulos empilhados | ✅ |
| RM-06 | Warp | Ausente | ✋ (coberto por RM-03) |
| RM-07 | Foto da ficha | Entra sem fade/scale | 🟡 RM-01 |
| RM-08 | Troca em tempo real | Ligar reduced-motion com a página aberta: animações param (listener de `matchMedia`) | ✋ |

### 2.6 Console e rede (DoD: nenhum erro ou warning)

| ID | Caso | Esperado | Auto |
|---|---|---|---|
| CN-01 | Console nas 3 rotas × 4 larguras | Zero `console.error`/`console.warning`, zero `pageerror` | ✅ |
| CN-02 | Rede | Nenhuma resposta ≥ 400 (exceto o documento em RT-09) nem request falhando (fonte, imagem, JSON) | ✅ |
| CN-03 | Avisos do React em dev | `bun run dev:react` sem warnings de key, hooks ou StrictMode | ✋ |
| CN-04 | Lint e build | `bun run lint` e `bun run build` sem erros | ✋ (rodar na raiz no fechamento de cada fase) |

### 2.7 Performance (DoD: Lighthouse ≥ 90; D9)

| ID | Caso | Esperado | Auto |
|---|---|---|---|
| PF-LH | Lighthouse mobile e desktop nas 3 rotas | **Performance ≥ 90 e Acessibilidade ≥ 90** (Best Practices e SEO registrados) | ✅ `scripts/lighthouse.mjs` |
| PF-01 | Canvas fora da viewport | Pausado (IntersectionObserver): zero chamadas de desenho fora da tela, exceto o fundo fixo de estrelas | ✅ `@redesign` |
| PF-02 | DPR | Backing store ≤ 2× o tamanho CSS com `devicePixelRatio = 3` | ✅ `@redesign` |
| PF-03 | Scroll da Home | FPS médio ≥ 45 no headless (≥ 55 esperado em máquina real); ≤ 5 frames > 50ms; long tasks registradas | ✅ |
| PF-04 | Inicialização após o primeiro paint | Canvases não atrasam o LCP (LCP = headline, não o canvas); conferir no trace do Lighthouse | 🟡 |
| PF-05 | Preload de fontes | `<link rel=preload>`/`preconnect` para Geist, Geist Mono e Doto; `font-display: swap`; CLS < 0.1 | 🟡 Lighthouse |
| PF-06 | Foto | WebP de ~760px em uso, sem o original de 4.9 MB; `width`/`height` definidos (sem CLS) | ✋ + Lighthouse |
| PF-07 | Bundle | Sem `styled-components` (D5) e sem novas libs de animação (D4) | ✋ `package.json` |

### 2.8 Conteúdo e regras do projeto

| ID | Caso | Esperado | Auto |
|---|---|---|---|
| CT-01 | `src/data/` preservado | `git diff main -- src/data blog-cms/content` vazio (salvo pedido explícito) | ✋ |
| CT-02 | Ordem dos projetos | Igual a `projects.ts`; 2 primeiros "★ MISSÃO PRINCIPAL", demais "◇ MISSÃO SECUNDÁRIA" (D2) | ✋ |
| CT-03 | Copy nova | Toda em `src/content/ui.ts` (D3), pendente do OK do Entony | ✋ |
| CT-04 | LinkedIn | Link real no Footer (pendência); nunca `href="#"` | ✅ RT-07 |
| CT-05 | Imagens antigas | Nenhuma referência a `EU-PNG.png`/`avatar.JPG`/PNGs de projetos antes da limpeza (D7) | ✋ grep |

## 3. Fora do escopo automatizado (checklist manual por fase)

- [ ] Comparação visual 1280/1440 × protótipo (`docs/redesign/prototype`), com o Revisor
- [ ] 375/768 revisados com o designer (D1)
- [ ] Safari macOS e iOS (backdrop-filter, `background-clip: text`, canvas, cursor)
- [ ] Firefox (mask, `conic-gradient`, scroll-snap)
- [ ] VoiceOver: ordem de leitura da Home, toast, contadores, carrossel
- [ ] Toque: arrastar a esfera e o carrossel sem prender o scroll vertical
- [ ] Hover/tilt/foil/lente da foto: "sensação" conforme o HANDOFF §4

## 4. Critério de saída

Todos os casos `@dod` verdes no build de preview da branch `redesign`, Lighthouse ≥ 90 (Perf e A11y) nas 3 rotas em mobile e desktop, casos `@redesign` verdes ou com exceção aceita pelo Tech Lead, e checklist manual da §3 assinado por QA, designer e Revisor.
