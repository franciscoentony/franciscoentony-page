# Adendo v3 ao HANDOFF: página do projeto e página do post

**Substitui** os adendos v1 e v2.
- **v3 = estrutura da v1 + acabamento novo.** O problema da v1 era a estilização dos componentes (feedback do Entony, 05/11).
- **Referência:** a Apple. Hierarquia por tipografia, escala, imagem e espaço; links são texto; a imagem sangra.
- **Linguagem:** a do universo ASCII da Home, só onde tem função.
- **Ferramenta:** IMPECCABLE (`.github/skills/impeccable`). O relatório está em `IMPECCABLE-CRITIQUE-V3.md`.

**Protótipos** (servir por http: `cd ~/Documents/franciscoentony-v3 && python3 -m http.server`):
- `paginas-v3/post.html`
- `paginas-v3/projeto.html?p=<name>`. O padrão é `franciscoentony-page`, que tem prints reais.

**Parâmetros:**
- `quality=alto|medio|baixo`.
- O botão no canto, "Marcar conteúdo de exemplo", contorna em dourado o que é conteúdo de exemplo (campos que o Entony ainda vai escrever). Ele existe só no protótipo.

**Banido nestas páginas** (prints do Entony + `craft-floor` do impeccable):
- caixa escura com borda de 1px e raio grande;
- rótulo mono em caixa-alta espaçada;
- chevron em link (› ‹);
- [colchetes];
- pills (com ou sem bolinha);
- card-convite tracejado;
- contador 01 / 04;
- autor com avatar e cargo;
- eyebrow acima de título;
- texto em gradiente;
- texto abaixo de 12px.

## Componentes redesenhados (a ideia de cada um em uma linha)

| Componente | Solução v3 | A ideia |
|---|---|---|
| **Voltar** | *Local nav* (52px, fixa abaixo da nav global): o nome da seção, "Blog" / "Projetos" (19px/600), é o link de volta | Como na Apple, você sabe onde está porque o nome da seção está sempre ali, e não porque há uma seta pedindo para voltar |
| **Barra de leitura** | O filete inferior da local nav (1px) se enche de gold → lavanda conforme a leitura | O progresso mora num traço que já existia, em vez de ser uma peça a mais com brilho |
| **Título na local nav** | Depois que o h1 sai da tela, o título do post/projeto aparece ao lado de "Blog" / "Projetos" (15px `secondary`, com fade de 400ms) | Contexto sem cabeçalho repetido; é o "running head" de um livro |
| **Meta do post** | Uma linha em sans 15px `secondary`: "Sábado, 6 de junho de 2026 · 3 minutos de leitura". **Sem hash e sem mono** | É uma dataline de jornal, por extenso, com o dia da semana: lida como gente, não como log |
| **Tags** | Saem do topo e viram uma frase na assinatura: "Arquivado em Palestras, Google I/O e IFRN." | Tag é arquivamento, não decoração; no fim ela vira frase |
| **Autor** | **Assinatura ASCII** no fim do texto: o retrato da ficha da Home em glifos (64px, desenhado uma vez) + "Francisco Entony" | O autor assina embaixo, e a assinatura é o mesmo retrato da ficha do Player 1, em miniatura |
| **Capa** | Sangra de ponta a ponta (100vw, 21:9, máx. 78svh; 16:10 em 768; 4:3 em 375), sem raio; legenda alinhada à coluna | A foto real abre o post como numa página de produto, sem moldura |
| **Legenda** | Geist 14px `secondary`, máx. 60ch, na voz dele. Sem mono e sem colchete | Legenda de revista: quem fala é a foto |
| **Fotos no corpo** | Pares com alturas iguais na trilha de 880 (verticais) ou na coluna (horizontais); raio 14, sem borda | Tamanho pela importância, não por moldura |
| **Compartilhar** | Uma linha de texto sob a assinatura: "Copiar link · LinkedIn ↗ · WhatsApp ↗". O mesmo "Copiar link" fica na local nav | Sem trilho e sem pills; o ↗ (SVG desenhado, não glifo) só nos externos |
| **Feedback de copiar** | O rótulo **se decodifica** em glifos da rampa ASCII até virar "Link copiado" (520ms) e volta | É a micro-interação do universo ASCII; não precisa de toast |
| **Próximo post** | Manchete em dois tons, "Próximo post. Visita ao Ministério Público…" (30–56px; a primeira parte em `secondary`), + a foto do próximo post em 16:7 com a **lente ASCII** | O fim do texto é a porta para o próximo destino, em escala de manchete. Sob o cursor, a foto vira ASCII como a ficha da Home |
| **Post anterior** | Uma linha em dois tons, 21px, só se existir um post mais novo | Sem card-convite: o que não existe não aparece |
| **Nome do projeto** | h1 em escala de produto, `clamp(44px, 5.6vw, 80px)`, -0.045em | O nome é a manchete, como "iPhone" numa página de produto |
| **Selo de missão** | "★ Missão principal" / "◇ Missão secundária" em **Doto** 18px, abaixo do nome, em caixa normal | O único aceno ao jogo, na fonte de pontos da própria Home, e não em caps mono |
| **Emblema** | O desenho ASCII SDF do card, sem moldura, **sangrando até a borda direita** da janela; a luz segue o ponteiro | O artefato lidera e a interface recua; sem card e sem contador |
| **Ficha (período, papel, status)** | O valor em 19px branco com o rótulo em 14px `secondary` **abaixo**, em 3 colunas | Ficha técnica da Apple: o dado manda, o rótulo explica |
| **Links GitHub/demo** | No hero: pill branca "Ver no ar" (o botão da Home) + "GitHub ↗" em texto. Na local nav, os mesmos dois | Um botão por página; o resto é texto |
| **Resultados** | Números em Doto 900 (52–88px) que **se decodificam da rampa ASCII** ao entrar na tela; rótulo em sans 15px `secondary` | O número chega como o planeta: dos glifos para a forma. Sem gradiente |
| **Capítulos** | Título do capítulo (26–34px) sticky à esquerda; ele **acende** (`secondary` → branco) enquanto o texto ao lado é lido. Sem números 01–04 | O título acompanha a leitura, como as palavras que acendem na Home |
| **Stack** | "Ficha técnica": linhas com **pontos-guia** (rótulo ······ valor), sem caixas e sem pills | Sumário impresso e ASCII ao mesmo tempo: a linha pontilhada é o glifo "." da rampa |
| **Telas** | A 1ª em largura total; as seguintes em par com alturas iguais; legenda sans | A mesma regra das fotos do post: um sistema só |
| **Código-fonte** | A linha `$ git clone <url>.git` (mono 14px, o `$` em gold) + "Copiar", que decodifica para "Copiado" | O que um dev realmente faz com um repositório. Aqui o mono é código, não fantasia |
| **Próximo projeto** | Manchete em dois tons, "Próximo projeto. connect-responsibly.", + o emblema dele em ASCII, estático, com a luz seguindo o ponteiro | O mesmo fim de página do post: o próximo destino em escala de manchete |
| **Menu no celular** | O botão abre o overlay de tela cheia da Home (D20), com links grandes | O mesmo menu do site inteiro |

## Medidas

| | 1440 / 1280 | 768 | 375 |
|---|---|---|---|
| Nav global + local nav | 48 + 52, fixas; ao descer, a global sobe e a local fica no topo | ← | ← (o título da local nav some abaixo de 640) |
| Cabeçalho do post | máx. 880, 88px abaixo da local nav | ← | 56px |
| h1 do post | `clamp(34px, 4.4vw, 56px)`, lh 1.06, -0.038em | ← | ← |
| Abertura (lead) | `clamp(19px, 1.9vw, 24px)` `secondary`, máx. 34em | ← | ← |
| Coluna / trilha média | 640 / 880 | 640 / 640 | 100% − 48 |
| Texto | 19px / 1.7 `prose` | ← | 18px |
| Imagem → texto | 64 | ← | ← |
| Assinatura | 80 acima; retrato de 64px, raio 12 | ← | ← |
| Próximo post | 160 acima; manchete máx. 20ch; foto 16:7, 40 abaixo | ← | ← |
| Hero do projeto | grid 1.1fr / .9fr, `min-height: min(100svh − 100px, 820px)`; emblema até a borda | 1 coluna; emblema antes do texto, 300px | ← |
| Resultados | 3 colunas, gap 40, 96 acima | 1 coluna, gap 32 | ← |
| Capítulos | 2 colunas .8 / 1.2, gap 64; título sticky em nav + 92 | 1 coluna; título sempre branco | ← |
| Ritmo entre seções do projeto | 120 | ← | ← |

## Estados

- **Imagens:** skeleton C (loading → loaded; **error = tile parado, sem varredura**).
- **Lente:** só com mouse (`hover` + `pointer: fine`), e não no Baixo nem em RM. O ASCII da foto é desenhado **uma vez** no primeiro hover; depois é só máscara CSS (custo zero por quadro).
- **Copiar:** decodificação de 520ms; em RM e no Baixo, troca o texto direto. Se o clipboard falhar, mostra o mesmo texto (o rótulo nunca mostra erro técnico).
- **Capítulo ativo:** IntersectionObserver com `rootMargin -40% 0 -40% 0`.
- **Foco:** outline lavanda de 2px com offset de 4px. **Seleção:** violeta.

## Níveis (PERF-TIERS)

| | Alto | Médio | Baixo / RM |
|---|---|---|---|
| Emblema do hero | 30 fps, só visível | 20 fps, célula 1.3 | 1 quadro |
| Emblema do próximo projeto | estático; redesenha só no movimento do ponteiro | ← | estático, sem luz |
| Lente das fotos | sim | sim | não |
| Decodificação (números, copiar) | sim | sim | texto final direto |
| Skeleton | varredura | varredura | parado |

## Campos de conteúdo (os mesmos da v1, todos opcionais, cada um some se vazio)

- **Projetos (`projects.ts`):**
  - `tagline`
  - `period`, `role`, `status`
  - `demoUrl`
  - `results [{ value, label }]` (até 3)
  - `chapters [{ title, text }]` (títulos livres; o protótipo usa O problema / A solução / O que eu fiz / O que aprendi como exemplo)
  - `specs [{ label, value }]` (sem ele: Linguagem + Ferramentas, que já existem)
  - `screens [{ src, alt, width, height, caption? }]`
- **Posts:** legenda pelo `title` da imagem no Markdown; `coverCaption` opcional. **Nenhum outro campo novo.** A data por extenso e o dia da semana saem de `date`.

## Copy de interface nova (para aprovação, D3)

| Chave sugerida | Texto |
|---|---|
| `blog.post.copyLink` / `.linkCopied` | Copiar link / Link copiado |
| `blog.post.filedUnder` | Arquivado em {tags}. |
| `blog.post.readTime` | {n} minutos de leitura *(substitui "3 min de leitura")* |
| `blog.post.next` / `.prev` | Próximo post. / Post anterior. |
| `projectPage.next` | Próximo projeto. |
| `projectPage.demo` | Ver no ar |
| `projectPage.facts` | Período / Papel / Status |
| `projectPage.specsTitle` | Ficha técnica |
| `projectPage.screensTitle` | Telas |
| `projectPage.copy` / `.copied` | Copiar / Copiado |
| `projectPage.rank` | ★ Missão principal / ◇ Missão secundária *(as de hoje, em caixa normal)* |

**Reaproveitadas:** Blog, Projetos, GitHub, os itens do menu.
**Saem:** "‹ Voltar pro blog", "Todas as missões", "PRÓXIMA MISSÃO ›", "‹ VOLTAR", "Continue explorando", "Continue no diário", "Diário da missão", "Inventário", "Stack da missão.", "Por dentro do sistema.", "Código-fonte", "Versão no ar" e o toast "inventário".
