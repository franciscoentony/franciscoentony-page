# Adendo: Home + Header (v4.1, rebaseado no site atual)

**Base:** o build do site atual, branch `redesign` **7df4f38** (`bun run build` → `dist/`). Não é mais o protótipo v3 antigo (D26).

**Como o protótipo foi feito:** cópia do `dist/` + **uma camada minha** em `v4/`:
- `v4.css` + `v4.js` (Home e Header);
- `v4-objetos.css` + `v4-objetos.js` (objetos do hero).

Assim, tudo o que não é do meu escopo (o cursor foguete, a correção do brilho dos cards, os dados do Entony, o worker do planeta) **roda do próprio build, sem nenhuma alteração**.

O Front-End implementa nos componentes: a camada só mostra o resultado e o que muda.

**Protótipos** (servir **a pasta como raiz**, porque o build usa caminhos absolutos):
- Home + Header: `cd ~/Documents/franciscoentony-v3/home-v4 && python3 -m http.server`
- Home + Header + objetos do hero: `cd ~/Documents/franciscoentony-v3/hero-objetos && python3 -m http.server`
- Header antes × depois, lado a lado: `~/Documents/franciscoentony-v3/header-antes-depois/index.html` (imagens dos mesmos estados no build atual e na v4)
- Os protótipos anteriores, feitos sobre o v3 antigo, foram para `_descartados/` e **não valem**.

## 1. Checklist: preservado do site atual × alterado por mim

### Preservado (vem do build 7df4f38, sem nenhuma alteração; conferido no protótipo)

- [x] **Cursor foguete** (9448816, SPEC-CURSOR-FOGUETE): o mesmo componente. Sobre os objetos do hero ele entra no estado `drag` ("Arraste").
- [x] **Brilho dos cards de Missões sem corte** (bfb05d7): o trilho com `pt-15 pb-35 -mt-10 -mb-[90px]` está intacto. Eu não toco no trilho.
- [x] **Dados do Entony** (21c877b):
  - logo **"F. Entony"** (o "F." em accent, Geist bold, o espaço de 4px do `gap-1`);
  - eyebrow **"Francisco Entony · Engenheiro de Software"** (mesmo texto);
  - **aos 20**;
  - **LV. 20**;
  - **© do ano atual**;
  - **Natal, RN**;
  - **"problemas reais"** e **"Tudo começou aos 8 anos"** sem ponto final;
  - **raridade em Doto** (mesma fonte e mesmo texto, "★ Missão Principal");
  - projeto **connect** (`/projetos/connect`).
- [x] **Cards levam à página do projeto** (`/projetos/:slug`, stretched link), as **páginas v3** de projeto e post, o **worker** do planeta e das estrelas, os **níveis** (`data-quality`) e o reduced motion (`data-motion`).
- [x] **Conteúdo e estrutura** de todas as seções: textos, timeline, esfera, carrossel (os mesmos botões, acessíveis), ficha holográfica com o retrato ASCII, campo do contato.
- [x] **Copiar e-mail:** o mesmo botão e o mesmo `aria-label`. Só o feedback visual muda (ver abaixo).

### Alterado por mim (escopo: acabamento da Home + Header)

| # | Onde (componente) | Antes | Depois | Ideia |
|---|---|---|---|---|
| H1 | **Header** (`Navbar.tsx`) | Barra de vidro com 5 links e a pill "Contato" | **Mapa de missão:** "F. Entony" + **6 checkpoints** (Sobre → Contato) ligados por trilhas | O header vira a campanha da Home: você vê onde está e quanto falta |
| H2 | Checkpoints | — | Quadrados de 8px, como os da timeline de Experiência: futuro vazado (`#48484d`), feito em gold, **atual em gold com brilho**; rótulo de 13px (atual branco, os outros a 70%) | O quadrado dourado já era o "você está aqui" do site (logo, timeline) |
| H3 | Trilhas | — | Linha de 1px entre checkpoints que **se enche de gold → lavanda** conforme a leitura avança dentro da seção | A mesma linha que se enche na timeline, agora no site inteiro |
| H4 | Estados | Some ao descer e volta ao subir | **Topo:** transparente sobre o universo. **Rolando:** vidro (72% + blur 20). **Descendo:** encolhe para **10px**: só a trilha com os checkpoints, **sempre visível** (o progresso não some). **Subindo, hover ou foco:** volta cheio | Em vez de sumir, o header vira uma régua de progresso |
| H5 | "Contato" | Pill branca à direita | **6º checkpoint** do mapa (o fim da campanha) | Um destino, não um botão de SaaS |
| H6 | Logo | "F. Entony" | **Mesma marca e mesmo espaço**; acabamento: −0.025em e um leve brilho no "F." (`text-shadow` accent 55%) | A marca é do Entony; só o polimento |
| H7 | Celular, barra | Logo + pill "Contato" + 3 linhas | Logo + **mini-mapa** (6 quadrados de 5px: feito / atual / futuro) + botão de **2 linhas que viram X** | O progresso cabe até no celular |
| H8 | Celular, menu | Lista de 5 links com divisores; metade vazia | Folha modal com a **trilha vertical da timeline**: rail de 1px que se enche até a seção atual, quadrados de 11px, links de 28–34px em escada, **Contato na lista**, e no pé o e-mail (copia + decodifica), GitHub ↗ e LinkedIn ↗ | O menu é a timeline do site |
| H9 | A11y do header | Modal, foco preso, Esc | **Mantido:** `role=dialog` + `aria-modal`, `main` inert, foco preso entre o botão e os itens, Esc fecha e devolve o foco, "Abrir/Fechar menu", `aria-current` no checkpoint atual, foco no header o expande do modo compacto | |
| 1 | Eyebrows das seções (`About`, `Skills`, `Projects`, `Experience`, `BlogTeaser`, `Contact`) | Rótulo acima do h2 | **1º tom da manchete**, com o mesmo texto: "**Player 1.** Um dev que…" (o tom em `#6e6e73`) | Sem eyebrow (ban do craft-floor); a palavra do jogo continua lá |
| 2 | Eyebrow do hero | Acima do h1 | **Mesmo texto do Entony**, como assinatura **abaixo dos CTAs** (14px `secondary`) | O h1 fala primeiro |
| 3 | Gradiente | Em 5 títulos | **Só no h1 do hero** | A assinatura uma vez |
| 4 | Capítulos (`Universe`) | "01 — ORIGEM" (Doto, caps) | "Origem" em sans 15 `secondary` | Numeração que não informa nada sai |
| 5 | Dica de scroll | "ROLE PARA EXPLORAR" mono caps | "Role para explorar" em sans 12, com sombra para ler sobre o planeta | |
| 6 | Ficha (`CharacterCard`) | "FICHA · LV." e "FRONT/BACK/DADOS/CURIO" mono caps | "Ficha · lv." e "Front/Back/Dados/Curio" em sans (o **20** e os números continuam em Doto gold) | |
| 7 | `HoloCard` e retrato | Borda de 1px | **Sem borda** (o foil, a sombra e o brilho fazem a borda; o trilho do brilho não muda) | |
| 8 | Card de projeto | Tecnologias em mono; "GitHub ›" | Tecnologias em sans 13; "GitHub ↗" (SVG) em texto. **A raridade em Doto fica como está** | |
| 9 | Carrossel | Pills (a ativa alongada) | Os **mesmos botões**, desenhados como segmentos de um filete (a ativa em gold → lavanda); alvo de 32×13px | |
| 10 | Links com › | "Fale comigo ›", "Ver tudo no GitHub ›", "Press start ›", "GitHub ›", "LinkedIn ›", "Todos os posts ›" | **Sem ›**; os externos ganham ↗ desenhado | Chevron fora |
| 11 | Timeline | Datas `uppercase` + tracking; "PRÓXIMA FASE" | Datas em caixa normal; "Próxima fase"; **"Bloqueada" em ASCII que nunca termina de decodificar** (`aria-label="Bloqueada"`) | Ainda não desbloqueado = ainda não decodificado |
| 12 | Diário (`BlogTeaser`/`PostCard`) | Caixas com hash e data mono; "Todos os posts ›" no cabeçalho | **Foto do post** (a mesma `cover`/1ª imagem que a página do post usa) + título + "6 de junho de 2026 · 3 minutos de leitura"; no fim, "**Mais registros no diário.** Todos os posts" | Como as páginas v3: a foto e o título fazem o card |
| 13 | Toast do e-mail | Pill "+1 E-mail copiado para o inventário" | O botão **se decodifica** até "E-mail copiado" (aria-live), com `min-width` para não pular | O feedback da v3 |
| 14 | Campo do contato | Passa por trás do título | Máscara radial: 18% atrás do texto | Legibilidade |
| 15 | Rodapé | "Topo ↑" (glifo) | "Topo" + seta em SVG | |
| 16 | Rótulo do anel do cursor | "INSPECIONAR / ARRASTE" mono caps | Sans 12, "Inspecionar / Arraste" (**só o rótulo**; o foguete não muda) | |

## 2. Copy (D3)

- **Mesmo texto, outro formato:**
  - os eyebrows passam a ser o 1º tom da manchete;
  - caps viram caixa normal;
  - os › saem;
  - o eyebrow do hero desce para baixo dos CTAs.
- **Nova:** "E-mail copiado". Já aprovadas: "Não deu para copiar", "Abrir menu" / "Fechar menu".
- **"Contato"** sai da pill e entra no mapa (o mesmo texto).

## 3. Notas para o Front-End

- **Header:**
  - O progresso usa o topo de cada seção. A seção atual é a última cujo topo passou de 45% da altura da tela; no fim da página, é Contato.
  - Cada trilha vai de 0 a 1 entre o topo da seção atual e o da próxima.
  - Desempenho: escuta de `scroll` passiva; só `transform: scaleX` nas trilhas e troca de classe nos nós.
- **Modo compacto:** só fora do hero e ao descer; volta ao subir, no hover ou com foco dentro do header.
- **Nível Baixo:** o vidro vira `ink` a 92% sem blur (PERF-TIERS); o mapa e o modo compacto ficam iguais (CSS barato). Em RM, sem transições.
