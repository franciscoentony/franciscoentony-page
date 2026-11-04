# Handoff de design — redesign franciscoentony.com (v3)

Do Designer para o Gerente de Projetos / Tech Lead, com Front-End, QA e Revisor.
Data: 04/11/2026.

## 0. Leia antes de começar (3 avisos importantes)

1. **A fonte da verdade é o protótipo em código, não frames estáticos.** A v3 foi aprovada pelo Entony como protótipo HTML/JS interativo, importado no Figma como Code Layer. Os valores deste documento foram extraídos desse código. As páginas v1 e v2 do Figma estão superadas e têm tokens diferentes, então **não usar**.
2. **Só existe design da Home em desktop (1440px).** Não há frames de Home mobile, Blog (`/blog`) nem Post (`/blog/:slug`). O protótipo tem um único breakpoint (860px), que nunca foi testado em 375 nem em 768. Na seção 7 deixo diretrizes para Blog e Post, mas elas são diretrizes, não frames. **Isso conflita com o DoD (fidelidade em 375, 768, 1280 e 1440).** Proposta: o DoD de fidelidade vale para 1280 e 1440, e 375 e 768 passam por revisão do designer. Ou o designer entrega frames mobile antes do QA. Decisão do Tech Lead.
3. **Textos do protótipo × `src/data/`.** Em alguns pontos o protótipo encurta textos (descrição do Grupo Strategi, "NIC · IFRN Campus Canguaretama") e muda a ordem dos projetos (petca primeiro). **Seguindo o CLAUDE.md, o `src/data/` manda**: use os textos e a ordem de lá. Os textos novos de interface (headline do hero, capítulos, títulos de seção, rótulos) são copy de componente, mas precisam do OK do Entony antes do merge. A lista está na seção 3.

## 1. Figma: arquivo e nodes

- **Arquivo:** https://www.figma.com/design/IVBfkehugwHDKOfGi92OJa
- **Página v3 (usar):** `18:868`, "✨ Home v3 — interativo (protótipo)"
  - **FINAL, Code Layer da Home desktop:** node `29:3`, https://www.figma.com/design/IVBfkehugwHDKOfGi92OJa?node-id=29-3&autoplay-code-preview=29-3
  - `22:3` e `19:3`: versões anteriores, marcadas como [superada].
  - A importação foi aceita, mas a pré-visualização dentro do Figma **não foi verificada**. Se não abrir, use o protótipo local (seção 5).
- **Página v2 (superada, não usar):** `10:1438`. Wrapper `10:1655`, guia de estilo `12:868` e spec de animações `12:932`, todos com tokens antigos.
- **Página v1 (descartada):** `0:1`.
- **Inexistentes:** Home mobile, Blog e Post.

## 2. Tokens (substituem o `@theme` atual de `src/index.css`)

### Cores

| Token sugerido (Tailwind v4) | Hex | Uso | Hoje no `@theme` |
|---|---|---|---|
| `--color-ink` | `#000000` | fundo da página | igual |
| `--color-raised` | `#0A0A0C` | fundo alternativo (cards de post) | era `#0C0C0E` |
| `--color-card` | `#111114` | superfície (novo) | — |
| `--color-line` | `rgba(255,255,255,0.08)` | bordas de 1px e divisores | era `#1E1E22` (sólido) |
| `--color-paper` | `#F5F5F7` | texto principal | igual |
| `--color-secondary` | `#86868B` | texto secundário, lead, legendas | era `#8B8B93` |
| `--color-muted` | `#48484D` | texto apagado (palavras não lidas, fase bloqueada) | era `#55555C` |
| `--color-accent` | `#8B6CFF` | violeta: acento, glow, fim de gradiente | **era azul `#4F8CFF`** |
| `--color-accent-soft` | `#C9BCFF` | lavanda: links, eyebrow dos capítulos | novo |
| `--color-gold` | `#FFD25E` | dourado: logo, checkpoints, raridade, cursor | novo |

- **Gradiente de texto** (`.grad`, nas palavras finais dos títulos): `linear-gradient(100deg, #FFFFFF 0%, #C9BCFF 45%, #8B6CFF 100%)` com `background-clip: text`.
- **Foil holográfico:** `repeating-linear-gradient(115deg, #FF7AD9 0%, #FFD25E 6%, #7DFFCF 12%, #6EC3FF 18%, #B38BFF 24%, #FF7AD9 30%)`, `background-size: 300% 300%`, `mix-blend-mode: color-dodge`.
- **Anel do cursor:** `conic-gradient` com as mesmas 5 cores do foil.

### Tipografia (Google Fonts)

- **Famílias:** `Geist` 300/400/500/600/700 (display + texto), `Geist Mono` 400/500/700 (ASCII, datas, tags, labels) e `Doto` 500/800/900 (só números e o "LV. 19").
  - Substituem Space Grotesk, Inter e JetBrains Mono.
  - Tokens: `--font-display` e `--font-sans` passam a ser Geist, `--font-mono` passa a ser Geist Mono, e entra `--font-dot` com Doto.
- **Tracking global do body:** `-0.011em`. `-webkit-font-smoothing: antialiased`.

| Estilo | Família / peso | Tamanho | Line-height | Tracking |
|---|---|---|---|---|
| h1 (hero, contato) | Geist 600 | `clamp(40px, 6vw, 80px)` | 1.02 | -0.045em |
| h2 (títulos de seção e capítulos) | Geist 600 | `clamp(34px, 4.6vw, 60px)` | 1.05 | -0.04em |
| Lead | Geist 400 (`<b>` em 500, cor paper) | `clamp(17px, 1.6vw, 21px)` | 1.45 | -0.015em |
| Body | Geist 400 | 17px | 1.47 | -0.011em |
| h3 de fase (experiência) | Geist 600 | 24px | — | -0.03em |
| h3 de card de projeto | Geist 600 | 22px | — | -0.03em |
| h3 de card de post | Geist 600 | 20px | 1.2 | -0.025em |
| h4 de colunas (skills) | Geist 600 | 17px | — | -0.02em |
| Eyebrow | Geist 500, cor secondary | 14px | — | -0.01em |
| Texto pequeno | Geist 400 | 14–15px | 1.5 | — |
| Nav (links) | Geist 400, `#D2D2D7` a 80% de opacidade | 12.5px | — | — |
| Botão | Geist 500 | 14px (sm: 12px) | — | — |
| Labels mono (datas, tags, raridade) | Geist Mono 400–500 | 10.5–12px | — | +0.04 a +0.12em |
| Números de stat | Doto 900 + gradiente | `clamp(40px, 4.4vw, 56px)` | 1 | -0.02em |
| Número do capítulo | Doto 800, cor accent-soft | 15px | — | +0.2em |

### Espaçamentos

- **Container:** `width: min(1080px, 100% - 48px)`, centralizado.
- **Seções:** `padding-block: clamp(110px, 16vh, 180px)`.
- **Nav:** 48px de altura.
- **Gaps:**
  - Player: 2 colunas (1.05fr / .95fr), gap 64.
  - Stats: 3 colunas, gap 28, `margin-top` 48, `padding-top` 28, borda superior line.
  - Skills (colunas): 4, gap 32, `margin-top` 56.
  - Carrossel: gap 22.
  - Posts: 3 colunas, gap 20.
  - Experiência: 2 colunas (.9fr / 1.1fr), gap 64; `padding-bottom` de cada fase 64.
  - Cabeçalho de linha (título + link à direita): `margin-bottom` 40.
- **Botões:** padding 10×20 (sm: 5×13).

### Raios

| Elemento | Raio | Token |
|---|---|---|
| Cards (ficha, projeto, post) | 22px | `rounded-lg` (já existe) |
| Moldura da foto | 14px | novo `--radius-portrait`, ou usar `md` 16 se o Revisor aceitar |
| Botões, pills, toast | 980px | `rounded-full` |
| Checkpoints da timeline | 0 (quadrado pixel) | — |

### Sombras e efeitos

- **Card holo em repouso:** `0 30px 80px -30px rgba(0,0,0,.8)`.
- **Card holo ativo:** `0 40px 120px -30px rgba(139,108,255,.45)`.
- **Botão primário no hover:** `0 0 0 6px rgba(255,255,255,.08)`.
- **Glow dourado** (logo, checkpoint ativo, linha da timeline): `0 0 12–16px #FFD25E`.
- **Nav:** `background: rgba(0,0,0,.55)` e `backdrop-filter: saturate(180%) blur(20px)`.
- **Grain:** SVG `feTurbulence` a 5% de opacidade, animado em `steps(4)` a 1.2s.

### Breakpoints

- **Protótipo:** um único breakpoint, `max-width: 860px`. Abaixo dele:
  - links da nav somem (falta definir o menu mobile);
  - Player e Experiência viram 1 coluna e o título da experiência deixa de ser sticky;
  - Skills ficam em 2 colunas e Posts em 1 coluna;
  - capítulos centralizados embaixo;
  - planeta 25% maior.
- **Sugestão:** token `--breakpoint-tab: 860px` mais o `sm`/`md` padrão do Tailwind, para os ajustes que o QA encontrar em 375 e 768.

## 3. Seções da Home (ordem nova × componentes atuais)

A ordem atual é Navbar → Hero → About → Skills → Projects → Experience → Contact → Footer.

1. **Navbar** (`Navbar.tsx`). **Muda:** fixa, translúcida com blur, 48px; some ao rolar para baixo (depois de 200px) e volta ao subir. Logo é um quadrado dourado com glow + "entony" em mono. Links: Sobre · Habilidades · Projetos · Experiência · Blog. CTA "Contato" em pill branca pequena.
2. **Universe** (substitui `Hero.tsx`; aproveite para migrar o styled-components, como pede o CLAUDE.md). Seção de 520vh com palco sticky de 100vh: planeta ASCII em canvas + headline + 3 capítulos (spec na seção 4).
   - Copy nova para aprovar: "Construo sistemas que resolvem problemas reais."; os capítulos "Tudo começou aos 8 anos." / "Biologia, física e astronomia." / "Hoje, aos 19, eu construo. E ensino.", com subtítulos; CTAs "Ver projetos" e "Fale comigo ›".
3. **Player 1** (`About.tsx`). **Muda:** 2 colunas. À esquerda: eyebrow "Player 1", h2 "Um dev que trata cada sistema como uma nova fase.", parágrafo com revelação palavra a palavra e 3 stats que contam (19 / 30+ / 4). À direita: ficha holográfica com foto, nome, classe e 4 atributos (92/88/74/99, valores criativos para aprovar).
4. **Habilidades** (`Skills.tsx`). **Muda:** esfera 3D de tags que pode ser arrastada, mais 4 colunas de texto. As colunas usam `skills.ts` como está (os ícones Font Awesome saem do layout). As tags da esfera são uma constante de UI derivada das descrições de `skills.ts`: React, TypeScript, Next.js, Vite, Tailwind, Node.js, Express, Python, Django REST, Java, PostgreSQL, MySQL, MongoDB, SQL Server, SQLite, Git, GitHub, Docker, MVC, REST APIs, React Native, pytest.
5. **Projetos** (`Projects.tsx`). **Muda:** carrossel horizontal com scroll-snap e dots, com cards holográficos 4:5 (360px). Os 58% de cima são um canvas ASCII com ícone por projeto (paw, gift, planet, film); embaixo ficam raridade, nome, descrição, tópicos e "GitHub ›".
   - A raridade ("★ MISSÃO PRINCIPAL" / "◇ MISSÃO SECUNDÁRIA") não existe em `projects.ts`. Ou se deriva pelo índice (2 primeiros = principal), ou se adiciona um campo (precisa do OK do Entony).
   - O dado `language` e `languageColor` sai do visual.
   - Seguir a ordem de `projects.ts`.
6. **Experiência / Campanha** (`Experience.tsx`). **Muda:** 2 colunas, com o título sticky à esquerda e a timeline à direita (linha de 1px que se preenche com o scroll e checkpoints quadrados que acendem). Entra uma 4ª fase fixa, "Próxima fase · Bloqueada · Press start ›", como copy de UI. Textos de `experience.ts`, com as datas em caixa alta via CSS.
7. **Blog teaser** (NOVO na Home): eyebrow "Diário de bordo", h2 e "Todos os posts ›" para `/blog`, mais os **3 posts mais recentes** de `/blog-data/index.json` (via `src/lib/blog.ts`). Os títulos do protótipo são fictícios.
8. **Contato** (`Contact.tsx`). **Muda:** 100vh com campo ASCII em canvas que reage ao cursor, eyebrow "Continue?", h1 "Bora trocar uma ideia?", botão primário com o e-mail (copia para a área de transferência e mostra o toast "+1 E-mail copiado para o inventário") e "GitHub ›".
9. **Footer** (`Footer.tsx`). **Muda:** minimalista, com borda superior: "© 2026 Francisco Entony" à esquerda; GitHub · LinkedIn · Blog · Topo ↑ à direita. **O link do LinkedIn ainda não foi informado.**

Globais da Home: canvas de estrelas fixo atrás de tudo, grain, cursor custom e toast.

## 4. Estados interativos e animações

**Easing padrão:** `cubic-bezier(.2,.7,.2,1)` (token `--ease`).

### Estados

| Elemento | Hover | Foco | Ativo/pressionado |
|---|---|---|---|
| Botão primário (branco) | `scale(1.03)` + anel de 6px a 8%; .3s | **não especificado no protótipo** → usar `outline: 2px solid #C9BCFF; outline-offset: 3px` | cursor encolhe (ver abaixo) |
| Link (lavanda) | underline | mesmo outline | — |
| Links da nav | opacidade .8 → 1, .2s | mesmo outline | — |
| Card holo (ficha e projetos) | tilt 3D + foil + glare seguindo o mouse (detalhes abaixo) | mesmo outline no card, sem tilt | — |
| Card de post | `translateY(-6px)`; borda passa a `rgba(255,255,255,.18)`; .5s | outline | — |
| Tag da esfera | cor gold + `text-shadow` `0 0 18px rgba(255,210,94,.6)` | (decorativa) | arrastar gira a esfera |
| Dots do carrossel | o ativo vira pílula de 24px, branco; .4s | — | — |
| Fase da timeline | — | — | `.on`: checkpoint gold com glow, quando o topo passa de 60% da viewport |

**O protótipo não tem estilos de `:focus-visible`.** O Front-End precisa implementar o outline acima, que é requisito do DoD.

### Card holográfico

- `perspective: 900px`.
- Rotação: `rotateX((0.5 - y) * 14deg)` e `rotateY((x - 0.5) * 18deg)`, com x e y de 0 a 1 dentro do card.
- Com o mouse em cima: transição de .08s linear. Ao sair, volta a 0 em .6s com `--ease`.
- Variáveis CSS:
  - `--mx` / `--my` (%): posição do foil e do glare;
  - `--o` = `min(1, distância-do-centro * 1.6 + .3)`.
- Camadas:
  - foil com opacidade `.12 + o*.5` e `mask` radial;
  - scanlines com opacidade `.05 + o*.18`;
  - glare radial branco a 55% em `overlay`.

### Foto na ficha

- Quando a moldura fica 55% visível, espera 1100ms e então a foto real entra: `opacity` 0 → 1 em 1.4s e `scale` 1.04 → 1 em 1.6s, por cima do ASCII da própria foto.
- Com o mouse em cima, uma `mask` radial de 74px na posição do cursor abre uma lente que mostra o ASCII por baixo.
- `object-position: center 25%`.

### Revelações e contadores

- **Revelação ao entrar** (`.rv`): `opacity` 0 → 1 em 1s e `translateY(32px)` → 0 em 1.1s, com IntersectionObserver em threshold .15, uma vez só. Atrasos escalonados de 80ms (`.d1`–`.d4`).
- **Palavra a palavra** (lead do Player 1): ligado ao scroll, `progress = clamp((0.85·vh − top) / (altura + 0.35·vh))`. As palavras vão de muted para paper, com transição de cor de .4s.
- **Contadores:** 1400ms com easing smoothstep, disparados em threshold .6.
- **Nav:** some com `translateY(-100%)` em .5s.

### Fundo de estrelas (canvas fixo)

- **Quantidade:** área ÷ 4200 (cerca de 300 em 1440×900).
- **Profundidade:** `z = rand² · 0.9 + 0.1`.
- **Parallax:** `y − scrollY · z · 0.35` (com wrap em 3 alturas de tela). O mouse desloca em x `-12 · z` px.
- **Tamanho:** `0.7 + z · 1.9` px.
- **Alpha:** `(0.35 + 0.6z) · cintilação`, com cintilação = `0.7 + 0.3 · sin(t · 0.002 + fase)`.
- **Halo:** estrelas com z > 0.6 ganham um halo lavanda de 3× o tamanho a 12%.
- **Cruz:** 2% das estrelas têm uma cruz de 1px, com comprimento `3 + 4·cintilação`.

### Efeito velocidade da luz

- Só no fim da seção Universe: `warp = smoothstep((p − 0.9) / 0.1)`, zerado em p ≥ 0.995, multiplicado por 0.5.
- Cada estrela vira uma linha radial a partir do centro da tela, com comprimento `distância · warp · z · 0.6` e espessura `0.6 + 1.8z`.

### História do planeta (seção Universe, 520vh)

- **Progresso:** `p = clamp(−rect.top / (rect.height − vh))`.
- **Render:** planeta ASCII em canvas, com rampa `" .,:;-=+*#%@"`, Geist Mono 10px (8px abaixo de 700px de largura) e redesenho a cerca de 30fps.
  - Rotação: `yaw = t · 0.00022 + p · 5 + mouse.x · 0.4`.
  - A luz segue o mouse com lerp de 0.06.
  - Borda iridescente (fresnel).
  - Anel com elevação de `0.3 + mouse.y · 0.08` rad.
- **Trajetória** (p → centro x, centro y, raio, todos relativos à viewport), interpolada com smoothstep:

| p | x | y | raio (× menor lado) | Momento |
|---|---|---|---|---|
| 0 | .5 | .9 | .24 | nasce por baixo do título |
| .18 | .5 | .52 | .25 | centro |
| .30–.44 | .70 | .5 | .24 | à direita (capítulo 1 à esquerda) |
| .56–.68 | .30 | .5 | .24 | à esquerda (capítulo 2 à direita) |
| .80 | .5 | .42 | .34 | centro, maior |
| 1 | .5 | .42 | .40 | — |

No mobile, x fica sempre em .5 e o raio é 1.25× maior.

- **Textos:**
  - Headline e CTAs: `opacity` 1 → 0 e `translateY` 0 → −60px entre p 0 e .12; "Role para explorar" some até p .04.
  - Capítulos (janelas): C1 de .24 a .44, C2 de .52 a .70, C3 de .76 a .92. Cada um entra e sai com fade de .05 de progresso e `translateY` de 30px.
- **Dissolução:** de p .88 a 1, cada caractere se espalha até 70% da viewport e o alpha cai com `(1 − d)²`.

### Campo ASCII do contato

- Grade de 11×16px em Geist Mono 12px.
- Brilho = padrão base (senoides lentas) a 30% com vinheta, mais uma onda `sin(distância · 0.035 − t · 0.004)` num raio de 340px ao redor do cursor.

### Cursor custom (só com `hover: hover` e `pointer: fine`)

- **Ponto:** losango dourado de 8px com glow. Gira de leve na direção do movimento e estica até 1.5× com a velocidade.
- **Anel:** 36px, borda branca a 45%, segue o ponto com lerp de 0.16.
- **Estados:**
  - link ou botão: anel de 58px com fundo a 7%;
  - card holo: 96px com borda conic iridescente girando em 3s e o texto "INSPECIONAR";
  - esfera: mesmo estilo, com o texto "ARRASTE";
  - clique: `scale(.82)` e explosão de 18 partículas.
- **Rastro:** caracteres `· . : + * ✦`, até 4 por frame conforme a velocidade, vida de cerca de 45 frames, máximo de 260 ao mesmo tempo.

### prefers-reduced-motion

**Comportamento esperado** (implementar assim):
- Todas as transições e animações CSS desligadas e `.rv` já visível.
- Sem warp.
- Cursor nativo, sem cursor custom.
- Planeta, esfera e campos ASCII como **um quadro estático**, sem rotação nem dissolução.
- Seção Universe sem pin: hero e os 3 capítulos empilhados como blocos normais.
- Estrelas estáticas, sem cintilação.
- Foto entra sem efeito.

**Lacuna do protótipo:** hoje o protótipo desliga CSS, warp e cursor, mas **os canvases ASCII continuam animando**. Não copiar esse comportamento.

### Notas para o QA (riscos já conhecidos)

- **Contraste:** `--color-muted #48484D` sobre preto fica em cerca de 2.3:1. Só pode aparecer como estado transitório (palavras ainda não lidas) ou em texto decorativo. O estado final do texto tem que ser paper ou secondary (`#86868B` sobre preto ≈ 5.8:1, passa AA).
- **Performance:** o planeta desenha cerca de 6 mil caracteres por frame. Para atingir Lighthouse ≥ 90:
  - pausar canvases fora da viewport (o protótipo já faz isso com IntersectionObserver);
  - limitar o DPR a 2;
  - adiar a inicialização para depois do LCP;
  - fazer preload das fontes.
- **Acessibilidade:** os canvases são `aria-hidden`. A esfera não é acessível por teclado, mas a mesma informação está nas 4 colunas. O carrossel precisa funcionar com Tab/setas.

## 5. Protótipo em código

- `~/Documents/franciscoentony-v3/index.html`: tudo inline (CSS + JS vanilla, sem dependências).
  - Funções de referência: `drawPlanet`, `drawStars`, `story`, `drawSphere`, `drawField`, `drawCursor`, `drawPortrait`, `drawThumb`, mais o handler `[data-tilt]`.
- Para rodar com a foto em ASCII, use servidor local, porque o Chrome bloqueia a leitura de pixels em `file://`: `cd ~/Documents/franciscoentony-v3 && python3 -m http.server 8765` e abra http://127.0.0.1:8765.
- Sugestão de portabilidade: um hook por canvas (`useAsciiCanvas`) e o progresso de scroll num hook único (`useScrollProgress(ref)`). As constantes desta spec vão para `src/lib/motion.ts`.

## 6. Assets

- **Foto do Entony:** `~/Documents/franciscoentony-v3/foto.jpg`, 1200×2133, JPEG q86, cerca de 440 KB, **sem EXIF** (localização removida). O original está em `~/Downloads/foto_site.JPG` e **não deve ir para o repositório**, porque tem 4.9 MB e metadados.
  - Sugestão: copiar para `public/home/foto-entony.jpg` e gerar uma versão AVIF/WebP de cerca de 760px para a moldura, que é de aproximadamente 334×290 (668 de largura em 2×).
  - `alt="Foto de Francisco Entony"`.
  - O `public/home/avatar.JPG` atual fica sem uso.
- **Não há outros assets exportados.** Planeta, ícones dos projetos, estrelas, campo do contato e cursor são gerados por código. Os PNGs atuais de `public/home/` (petca.png, connect-responsibly.png etc.) **não aparecem no novo layout**. O Tech Lead decide se remove ou mantém.
- **Fontes:** Google Fonts (Geist, Geist Mono, Doto).

## 7. Diretrizes para Blog e Post (sem frame, aplicar os tokens)

- **`/blog`:**
  - Navbar e footer iguais aos da Home e fundo de estrelas sem warp.
  - Cabeçalho: eyebrow "Diário de bordo", h2 "Anotações sobre código, dados e aprendizado." e o lead atual do blog.
  - Grade de cards de post: 3 colunas no desktop e 1 abaixo de 860px. Cada card tem `#hash` em mono gold, título, data e tempo de leitura em mono secondary, e as tags.
- **`/blog/:slug`:**
  - Coluna de leitura de 680px, com "‹ Voltar pro blog" em link lavanda.
  - Meta em mono, h1 com o mesmo clamp de h1, resumo como lead, tags como pills de borda line e capa com raio 22.
  - Corpo em Geist 18/1.7. h2 e h3 em Geist 600, tracking -0.03em. Links lavanda com underline.
  - Código inline e em bloco em Geist Mono, sobre raised, com raio 16 e borda line.
  - Imagens com raio 16 e borda line (substitui o estilo inline atual de `mf()`/`blog.ts`, que usa `#1E1E22` e 0.75rem).
- O designer fica à disposição para revisar Blog e Post e os breakpoints de 375 e 768 assim que houver build de preview.
