# Adendo ao HANDOFF: página do projeto (A) e detalhe do post (B)

**Protótipos** (abrir por http, por causa do mask-image do skeleton):
- `~/Documents/franciscoentony-v3/paginas/projeto.html?p=<slug>`. Use `&ph` para marcar os placeholders e `&quality=alto|medio|baixo` para testar os níveis.
- `~/Documents/franciscoentony-v3/paginas/post.html`, com o post real da palestra. Também aceita `&quality=`.
- Para servir: `cd ~/Documents/franciscoentony-v3 && python3 -m http.server`. Copiar a pasta `paginas/` para `docs/redesign/prototype/` junto com o v3.

**Regras gerais:**
- Tokens, tipografia, nav, footer, estrelas, holo e skeleton são os mesmos do v3 e da spec C (`SPEC-SKELETON-IMAGENS.md`). **Nenhum token novo de cor.**
- Sem dependências novas.
- Copy nova: só a da seção 4, com aprovação do Entony (D3).

---

## A. Página do projeto: `/projetos/:slug`

`slug` = `name` do repositório (ex.: `/projetos/petca`). Um slug desconhecido leva ao 404 do site. Entra no `static-routes` (pré-render + sitemap), como os posts.

### A1. Estrutura (de cima para baixo)

| # | Bloco | Conteúdo | Some quando |
|---|---|---|---|
| 1 | **Hero** | Esquerda: "‹ Todas as missões", raridade (`rarityMain`/`raritySide`), h1 = `name`, `tagline`, ficha (Período · Papel · Status) e CTAs ("GitHub ›" primário, "Ver demo ›" link). Direita: **emblema**, um cartão holo 4:5 com o ASCII SDF do projeto (o mesmo `shape` do card da Home, maior) e o rodapé com a bolinha da linguagem, `language` e "02 / 04" | ficha: cada item some sozinho; demo: sem `demoUrl` |
| 2 | **Resultados** | 3 números em Doto 900 com `.grad` + rótulo | sem `results` (a seção inteira) |
| 3 | **Diário da missão** | eyebrow + h2. Capítulos 01–04: Doto 800 lavanda (número) + h3 28px + texto 19/1.7 `prose`, em 2 colunas (.9fr / 1.1fr) e divisor `line` | cada capítulo sem texto some; sem nenhum, a seção some |
| 4 | **Stack** | eyebrow "Inventário" + h2 e grupos em cards `bg-2` com raio 22, pills mono 12 (a linguagem leva a bolinha `languageColor`) | sem `stack`: **1 grupo sem título** com `language` + `topics` (o que existe hoje) |
| 5 | **Telas** | eyebrow + h2. A 1ª imagem ocupa a largura toda (16:9), as outras ficam em 2 colunas. Cada uma é uma moldura `.media` com o skeleton C, raio 22 e legenda mono 12 | sem `screens` |
| 6 | **Links** | 2 cards: "GitHub ›" com o código-fonte e a URL; "Ver demo ›" com a versão no ar e a URL | o de demo some sem `demoUrl` (e o do GitHub ocupa a linha) |
| 7 | **Continue explorando** | card "PRÓXIMA MISSÃO ›", com miniatura ASCII 200px à esquerda, nome, descrição e `language · topics`, + card tracejado "‹ VOLTAR / Todas as missões / Ver tudo no GitHub ›" | nunca (a próxima é circular, na ordem de `projects.ts`) |

### A2. Medidas

| | 1440 / 1280 | 768 | 375 |
|---|---|---|---|
| Container | `.wrap` 1080 | 100% − 48 | 100% − 48 |
| Hero | grid 1.05fr / .95fr, gap 64, `min-height: min(100svh, 920px)`, topo nav + 64 | 1 coluna, gap 40, topo nav + 32; emblema **antes** do texto, 16:10 | igual ao 768, com emblema 1:1 |
| h1 | `clamp(40px, 5.4vw, 72px)`, lh 1.02, -0.045em, 600, `overflow-wrap: anywhere` | ← | ← (quebra no hífen de `connect-responsibly`) |
| Tagline | `text-lead` (17–21) `secondary`, máx. 34em | ← | ← |
| Ficha | 3 colunas, borda superior `line`, rótulo mono 10.5 +0.12em caixa-alta | 2 colunas | 2 colunas |
| Resultados | 3 colunas, gap 28 | 3 colunas, gap 16, rótulo 12 | ← |
| Capítulos | 2 colunas .9/1.1, gap 64, padding 40 | 1 coluna, gap 16, padding 32, texto 18 | ← |
| Stack | 3 colunas | 2 colunas | 1 coluna |
| Telas | 1ª com largura toda + 2 colunas, gap 20 | 2 colunas | 1 coluna |
| Próxima missão | 1.6fr / 1fr; miniatura 200px | 1 coluna; miniatura 120px | ← |
| Ritmo entre seções | `clamp(80px, 12vh, 140px)` | ← | ← |

### A3. Estados e interação

- **Emblema:** com o hover/ponteiro, o tilt + foil + glare do holo (como os cards da Home) e o "heat" do ASCII (a ondulação aumenta). É `aria-hidden`.
- **Cards** (links e próxima missão): hover com `translateY(-6px)` e borda `line-strong` em 500 ms. O foco usa o anel padrão.
- **Placeholder vazio:** nunca mostrar `[ ]` em produção. Regra: **o campo vazio some** (tabela A1).

### A4. Os cards da Home levam até a página

- O **card inteiro vira link** para `/projetos/<slug>`: um `<a>` no h3 com `::after` em `inset-0` (stretched link), sem `<a>` dentro de `<a>`.
- O "GitHub ›" do rodapé do card continua sendo um link externo, com `position: relative` e `z-index` acima do stretched link.
- O tilt continua. O cursor (foguete) entra no estado **link**, e não em `holo`, porque o card agora é clicável. Por isso troque `data-cursor="holo"` por nada nos cards de projeto.
- Na **ida** (só no Alto, com o navegador suportando): `document.startViewTransition` com `view-transition-name: emblem-<slug>` no canvas do card e no emblema, para o ASCII "crescer" até o hero. Médio, Baixo e RM: navegação normal. Não há dependência nova.
- **"‹ Todas as missões"** volta para `/#projetos`, com a âncora 48px abaixo da nav (como hoje).

### A5. Níveis (PERF-TIERS)

| | Alto | Médio | Baixo / RM |
|---|---|---|---|
| Emblema e miniatura ASCII | 30 fps, célula 1×, só quando visível | 20 fps, célula 1.3× | 1 quadro estático |
| Holo do emblema | tilt + foil (blend) + glare | tilt + glare; foil sem blend (0.18) | sem tilt; foil escondido |
| Skeleton das telas | varredura | varredura | parado |
| View transition | sim | não | não |

---

## B. Detalhe do post: `/blog/:slug` (redesign)

Substitui a tela do HANDOFF §7. Valem: D21 (título), D22 (`prose` #D2D2D7), DF-6 (coluna de 640 / 19px), DF-7 (verticais limitadas) e a spec C.

### B1. Estrutura

| # | Bloco | Detalhe |
|---|---|---|
| 1 | **Barra de leitura** | 2px fixa em `top: 48px`, `linear-gradient(90deg, gold, lavanda, violeta)` + `glow-gold`, `transform: scaleX(progresso do <article>)`. Acompanha a nav quando ela some. `aria-hidden` |
| 2 | **Cabeçalho** (máx. 880, centrado, texto à esquerda) | "‹ Voltar pro blog" → meta mono 12 (`#hash` em gold · data · tempo de leitura) → h1 (D21) → lead (`summary`, regra DF-5) → linha com o **autor** (avatar 36 redondo + "Francisco Entony" 14/500 + "Desenvolvedor Full-Stack" mono 11) e as **tags** à direita (pills, todas no detalhe) |
| 3 | **Capa** (`.wrap` 1080) | Moldura `.media` com raio 22 e proporção **21:9** (1440/1280), **16:10** (768) e **4:3** (375); legenda mono 12 opcional. Ordem: o campo `cover` (já existe) → se o corpo **começar** com uma imagem, ela sobe para a capa (e sai do corpo) → senão, **capa ASCII** gerada pelo `hash` (ver B3) |
| 4 | **Corpo** | Grade com 3 trilhas: `content` = 640, `wide` = 880. Parágrafo 19/1.7 (18 abaixo de 860), espaço de 28 entre parágrafos, h2 28px com margem 64 e `scroll-margin 96`, citação 21px com filete lavanda de 2px, links lavanda sublinhados (`text-underline-offset` 3) |
| 5 | **Imagens** | Horizontal sozinha: `wide` (880). Vertical sozinha: coluna, limitada (DF-7) e centrada. **2 imagens seguidas viram um par lado a lado** em `wide`, com alturas iguais (`flex: var(--r) 1 0`, onde `--r` = largura/altura). Um par com alguma horizontal empilha abaixo de 640; um par de verticais fica lado a lado sempre. Legenda = o `title` da imagem no Markdown (`![alt](src "legenda")`), em mono 12 `secondary`; numa vertical, centrada |
| 6 | **Marca de fim** | `· · ■ · ·` centrado, quadrado gold 8px com glow (é o logo). Sem texto |
| 7 | **Compartilhar** | Rodapé do artigo, com borda superior: rótulo mono 11 caixa-alta + botões ghost (pill de 1px `line`, 13px): "Copiar link", "LinkedIn", "WhatsApp". Com toque e `navigator.share`, os três viram **um** botão "Compartilhar" (share nativo). O copiar mostra o toast padrão |
| 8 | **Trilho lateral** (≥ 1280) | Coluna de 40px, a 72px à esquerda da trilha `wide`, `sticky` em top 120: rótulo + 3 ícones redondos de 36 (link, LinkedIn, WhatsApp). Some abaixo de 1280 (o bloco 7 já cobre) |
| 9 | **Índice** | **Só** quando o post tiver ≥ 3 h2 **e** ≥ 900 palavras: no trilho, acima do compartilhar, com a lista de h2 em 13px e o ativo em `text` + traço gold (scroll-spy por IO). Abaixo de 1280: um `<details>` "Neste registro" depois do cabeçalho. Os 2 posts de hoje não têm h2, então não aparece |
| 10 | **Continue no diário** (DF-9) | Grade 1.6fr / 1fr. **"PRÓXIMO REGISTRO ›"** = o post seguinte na ordem do `/blog` (mais recente primeiro, ou seja, o mais antigo seguinte), num card com capa 16:7 (imagem ou capa ASCII), hash, título, resumo e data · leitura. **"‹ REGISTRO ANTERIOR"** = o mais novo, num card menor. Se faltar um dos dois, o lugar vira o **card-convite tracejado** (DS-14: "Mais registros no diário" + "Todos os posts ›") |
| 11 | Voltar | "‹ Voltar pro blog" centrado, depois o footer |

### B2. Medidas por largura

| | 1440 / 1280 | 768 | 375 |
|---|---|---|---|
| Topo do cabeçalho | nav + 72 | nav + 40 | nav + 40 |
| Meta → h1 → lead → autor | 16 / 20 / 28 | ← | ← |
| Capa → corpo | 48 / 72 | 48 / 48 | 48 / 48 |
| Coluna / wide | 640 / 880 | 640 / 640 (wide = coluna) | 100% − 48 |
| Imagem → texto | 48 | 48 | 48 |
| Fim → compartilhar | 72 / 56 | ← | ← |
| Continue no diário | 120 do artigo; 2 colunas | 1 coluna | 1 coluna |

### B3. Capa ASCII pelo hash

- Canvas desenhado **uma vez** (sem animação em nenhum nível), depois de `document.fonts.ready` e de novo no resize.
- Semente = o `hash` do post: um campo de senos com fases do hash, a rampa de 12 glifos, Geist Mono 600 9px, célula 6×10, matiz 250→300 da esquerda para a direita e brilho atenuado nas bordas de cima e de baixo.
- Usos:
  1. Capa do post sem imagem.
  2. Miniatura do "Próximo registro".
  3. **Capa dos cards do `/blog` sem imagem (DF-11).** Resolve o vazio de 70px apontado na P5.

### B4. Estados

- Imagens: skeleton C (loading → loaded / instantâneo / error).
- Copiar link: toast padrão (+1). Falhou o clipboard: o mesmo toast não aparece e o botão continua lá (sem erro na tela).
- Post sem `summary`: o cabeçalho pula o lead. Sem tags: o autor ocupa a linha.

### B5. Níveis

| | Alto | Médio | Baixo | RM |
|---|---|---|---|---|
| Barra de leitura | sim | sim | sim (é posição, não animação) | sim |
| Capa ASCII | estática | estática (célula 1.3) | estática | estática |
| Skeleton | varredura | varredura | parado | parado, sem fade |
| Hovers dos cards | sim | sim | sim (CSS barato) | não |

### B6. Implementação (notas para o Front-End)

- O agrupamento de imagens seguidas em pares acontece em `resolveContentHtml`, **antes** de injetar o HTML: um `<p>` com só uma `.media`, seguido de outro igual, vira `<figure class="fig wide"><div class="row2">…`. O CLS segue zero.
- O render hook emite `--ratio: W/H` **e** `--r: <W/H decimal>`, e `class="portrait"` na vertical.
- Copiar a imagem de abertura para a capa: no `resolveContentHtml`, se o 1º nó do corpo for uma imagem e `cover` estiver vazio.
- Links de compartilhamento: `https://www.linkedin.com/sharing/share-offsite/?url=` e `https://wa.me/?text=<título> <url>`, em nova aba.

---

## 3. Campos de conteúdo novos (são do Entony; precisam de aprovação)

### Projetos (`src/data/projects.ts`)

| Campo | Tipo | Obrigatório | Uso | Placeholder no protótipo |
|---|---|---|---|---|
| `slug` | string | derivado de `name` | rota | — |
| `tagline` | string ≤ 180 | não (fallback: `description`) | lead do hero | [tagline] |
| `period` | string (ex.: "mar 2025 — jun 2025") | não | ficha | [mar 2025 — jun 2025] |
| `role` | string curta (ex.: "Full-stack, solo") | não | ficha | [Full-stack, solo] |
| `status` | `"Em produção"`, `"Em desenvolvimento"` ou `"Arquivado"` | não | ficha | [Em produção] |
| `demoUrl` | url | não | CTA + card | [demoUrl] |
| `results` | `{ value: string; label: string }[]` (até 3) | não | resultados | [00] / [resultado] |
| `problem` | markdown curto (1–2 parágrafos) | não | capítulo 01 | [problem] |
| `solution` | idem | não | capítulo 02 | [solution] |
| `contribution` | idem | não | capítulo 03 | [role] |
| `learnings` | idem | não | capítulo 04 | [learnings] |
| `stack` | `{ group: string; items: string[] }[]` | não (fallback: `language` + `topics`) | stack | [Front-end] [Back-end] [Infra] |
| `screens` | `{ src; alt; width; height; caption? }[]` (até 5) | não | telas | screen 1–3 |
| `shape` | `"paw"`, `"gift"`, `"planet"` ou `"film"` (já existe no código dos cards) | sim, quando houver projeto novo | emblema | — |

### Posts (front matter do Hugo)

| Campo | Status | Uso |
|---|---|---|
| `cover` | já existe, mas sem uso nos posts | capa do post, card do `/blog` e OG |
| `coverCaption` | **novo**, opcional | legenda da capa |
| `"legenda"` no Markdown da imagem (`![alt](src "legenda")`) | **convenção nova**, opcional | legenda das imagens |

## 4. Copy de interface nova (vai para `ui.ts`; precisa de aprovação, D3)

| Chave sugerida | Texto | Onde |
|---|---|---|
| `projectPage.backLink` | ‹ Todas as missões | hero |
| `projectPage.facts.period` / `.role` / `.status` | Período / Papel / Status | ficha |
| `projectPage.demoLink` | Ver demo › | CTA + card |
| `projectPage.historyEyebrow` / `.historyTitle` | Diário da missão / Do problema ao código. | seção 3 |
| `projectPage.chapters` | O problema / A solução / O que eu fiz / O que aprendi | capítulos |
| `projectPage.stackEyebrow` / `.stackTitle` | Inventário / Stack da missão. | seção 4 |
| `projectPage.screensEyebrow` / `.screensTitle` | Telas / Por dentro do sistema. | seção 5 |
| `projectPage.sourceTitle` / `.demoTitle` | Código-fonte / Versão no ar | links |
| `projectPage.nextEyebrow` / `.nextLabel` | Continue explorando / PRÓXIMA MISSÃO › | rodapé |
| `projectPage.allLabel` / `.allTitle` | ‹ VOLTAR / Todas as missões | rodapé |
| `blog.post.shareLabel` | Compartilhar | rodapé + trilho |
| `blog.post.copyLink` / `.shareLinkedIn` / `.shareWhatsApp` | Copiar link / LinkedIn / WhatsApp | botões (os aria-labels: "Copiar link", "Compartilhar no LinkedIn", "Compartilhar no WhatsApp") |
| `toast.linkCopied` | +1 · Link copiado para o inventário | toast |
| `blog.post.tocLabel` | Neste registro | índice (só quando houver) |
| `blog.post.continueEyebrow` | Continue no diário | rodapé |
| `blog.post.nextLabel` / `.prevLabel` | PRÓXIMO REGISTRO › / ‹ REGISTRO ANTERIOR | cards |
| `blog.post.authorRole` | Desenvolvedor Full-Stack (**reuso** do eyebrow do hero) | autor |

**Reaproveitadas, sem aprovação:** "‹ Voltar pro blog", "Todos os posts ›", "Mais registros no diário", "GitHub ›", "Ver tudo no GitHub ›", "★ MISSÃO PRINCIPAL", "◇ MISSÃO SECUNDÁRIA", "Tags".
