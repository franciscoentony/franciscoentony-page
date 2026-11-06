# Hero: meteoro, astronauta e satélite (Designer)

**Protótipo (rebaseado):** `~/Documents/franciscoentony-v3/hero-objetos/`. É o **build atual do site** (redesign 7df4f38) + a camada da home-v4 + `v4/v4-objetos.js`.
- Servir a pasta **como raiz**: `cd hero-objetos && python3 -m http.server`.
- O nível vem do próprio site (`html[data-quality]`, `html[data-motion]`).

**Integração no site atual (verificada no protótipo):**
- O canvas dos objetos fica **logo depois do canvas do planeta**, dentro do palco fixo do `#universe`.
- A geometria do planeta vem de `UNIVERSE.path` (`src/lib/motion.ts`), com o mesmo raio no celular (×1.25). A grade vem da fonte de `planet.ts` (10/8px × `cellScale` do nível). A luz usa a mesma fórmula do `planet.ts`.
- O **cursor foguete real** entra em `drag` ("Arraste") sobre as áreas `.grab` (`data-cursor="drag"`).
- O texto do hero (o h1 e os CTAs) fica acima das áreas de pegar. A "caixa do texto" é o h1 + os CTAs + a assinatura (o eyebrow do Entony, que a home-v4 coloca abaixo dos CTAs).
- **Conferido em 1440/1280/768/375:** os CTAs continuam clicáveis (`elementFromPoint`), não há seleção de texto ao arremessar, o objeto volta ao repouso, e não há erros de console.
- No produto, o desenho e a física vão para o worker (seção 6). A camada do protótipo roda na thread principal só para demonstrar.
- Servir por http na pasta v3.
- Aceita `?quality=alto|medio|baixo`.
- O código fica no bloco `HERO: meteoro, astronauta e satélite`.

**Modo:** Experience (impeccable). O critério é **arte, não clip-art**. Os três objetos não são ícones nem sprites: são **formas desenhadas pelo mesmo motor do planeta**.
- **Mesma grade de células** (`FS` 10/8px, `cw`, `ch`): os glifos caem nas mesmas colunas e linhas do planeta.
- **Mesma rampa** `" .,:;-=+*#%@"`, sem glifo novo.
- **Mesma luz:** o `lightCur` que segue o ponteiro, normalizado com z = 0.75.
- **Mesma fórmula de brilho:** difusa + borda iridescente (fresnel `(1-nz)^2.5`, matiz `+110` na borda).
- **Mesma paleta** (violeta → lavanda, ouro só onde é "metal" ou "luz") e a mesma quantização de cor (matiz /6, sat /10, L /5, alpha /10) do atlas.

**Sem dependência nova. Sem copy nova.** Os objetos são `aria-hidden`.

## 1. Os objetos

Cada um é uma cena de SDFs 2D (círculo, caixa arredondada, cápsula, elipse) com material por região. A normal sai do gradiente do SDF (diferença finita `e = 0.02`) e a profundidade de um bisel de 0.07: as bordas recebem a borda iridescente, as faces recebem a luz.

| Objeto | Forma | Materiais | Animação em repouso |
|---|---|---|---|
| **Astronauta** | capacete (círculo .32), tronco (caixa .3×.33, raio .12), mochila, 2 braços e 2 pernas (cápsulas de raio .1–.12); um braço acena | casca (violeta), **visor dourado** (matiz 42, brilho especular `diff^6`), painel do peito que **pisca** | flutua (±6px em x, ±8px em y, senos lentos) e **balança** ±0.35 rad; **gira de verdade só quando arremessado** (o giro amortece e ele volta ao balanço) |
| **Satélite** | corpo (caixa .22×.42), **2 painéis solares** (.46×.26) em hastes de .045, pescoço (cápsula r .06) ligando o **prato** (crescente r .2) ao corpo, antena (r .035) | casca; **painel em células grandes** (xadrez 4×3 de brilho .85/1.1 + linhas finas, matiz −15); **luz da antena que pisca** em ouro | **inclinação de repouso de 0.35 rad** ± 0.12; o pisca usa um seno com limiar (aceso ~30% do tempo) |
| **Meteoro** | rocha irregular (raio .5 deformado por ruído no ângulo) | rocha com **crateras** (o `noise3` do planeta escurece o brilho) | **orbita o planeta** numa elipse (2.4R de largura; 1.25R na metade de trás, 0.45R na da frente; y ≤ altura − 70px; 0.00022 rad/ms): a metade de trás **arqueia no céu acima do planeta** e some atrás do disco. **Rastro** de 26 posições (Alto) / 14 (Médio), **amostradas por distância percorrida** (a cada 0.35·s px, para a cauda se estender mesmo devagar), de ouro (cabeça) a lavanda (cauda); **nunca desenhado sobre o planeta nem sobre a própria rocha** (sem dois glifos na mesma célula) |

## 2. Tamanhos e posições (repouso)

`s` = a escala do objeto em px. O raio de colisão e de pegar é `r = s × alcance` (satélite 1.25, astronauta .95, meteoro .7). Escala por largura: ≥1280 = 1; 860–1279 = .92; 640–859 = .8; <640 = .55.

| Largura | Satélite | Astronauta | Meteoro |
|---|---|---|---|
| **1440** | s = 95 (≈ 250×190px, ≥ 10 linhas); **centro da margem esquerda livre** do texto, y = 30% | s = 90 (≈ 100×160px, 14 linhas); **centro da margem direita**, y = 40% | s = 46 + rastro de ~300px; órbita |
| **1280** | s = 87; centro da margem esquerda, y = 30% | s = 83; centro da margem direita, y = 40% | s = 42; órbita |
| **768** | s = 76; (17%, 56%): entre os CTAs e o planeta | s = 72; (83%, 52%) | s = 37; órbita |
| **375** | **não aparece** (3 linhas viravam borrão: um objeto legível vale mais que três manchas) | **s = 68** (escala .75); (78%, 64%) | s = 25; órbita |

- **Regra de não cobrir o texto:** a "caixa do texto" é a união dos retângulos do **conteúdo** do h1, dos CTAs e da assinatura (não do `.hero-copy`, que tem a largura toda), com 24px de folga lateral e 16px vertical.
  - No desktop, a posição de repouso é o centro da margem livre de cada lado.
  - Se a margem for menor que o diâmetro do objeto, vale a posição em fração (a de 768).
- **Se um objeto arremessado passa sobre o texto:**
  1. fica a **35% de alpha** e **perde a área de pegar** (não rouba o clique dos CTAs);
  2. a caixa do texto funciona como **parede macia**: empurra para fora com 0.9px/quadro² **durante o voo** (0.35 depois) e amortece o y em 0.9;
  3. nunca descansa ali.
- **Camadas:**
  - o canvas dos objetos fica acima do planeta e abaixo do texto;
  - o `.hero-copy` tem `pointer-events: none`;
  - só o h1 e os itens dos CTAs recebem o ponteiro.

## 3. Física

Passos normalizados a 16.7ms, com `k = dt/16.7`, limitado a 3.

| Fase | Regra |
|---|---|
| **Segurando** | o objeto segue o ponteiro (lerp de .5) com o deslocamento do ponto onde foi pego; a velocidade do ponteiro é medida com EMA de .5 |
| **Soltou** | `v` = a velocidade do ponteiro, limitada a **30px/quadro**; o giro ganha `vx × 0.002` |
| **Voo livre** (1.4s) | atrito de vácuo: `v *= 0.997^k` |
| **Volta** (depois de 1.4s, ou se \|v\| < .4) | mola até a posição de repouso: `v += (home − x) × 0.0016k`, amortecida em `0.95^k`. O meteoro volta para a órbita |
| **Bordas** | o retângulo do hero (abaixo da nav, 44px): quica com 72% da energia |
| **Entre eles** | círculos elásticos (restituição .8, massa ∝ s²); quem está sendo segurado tem massa infinita; o choque transfere giro (`rv × 0.003`) |
| **Planeta** | corpo rígido (disco de raio 1.02R); reflete com restituição .75 e ganha giro. O meteoro **em órbita** não colide (passa por trás); arremessado, colide |
| **Giro** | `va *= 0.985^k`. O satélite volta ao ângulo de repouso pelo caminho mais curto quando \|va\| < .01 |
| **Saída do hero** | ao rolar para a história, o alpha dos objetos acompanha `1 − smooth(prog/0.12)`; abaixo de .01 a física para e as áreas de pegar somem |

## 4. Cursor, mouse e toque

- **Áreas de pegar:** 3 divs `.grab` (`aria-hidden`), círculos de raio `r` que seguem cada objeto por `transform`, com `data-cursor="drag"`. O **cursor foguete** entra no estado **drag** (anel iridescente de 96px + "Arraste"). Enquanto segura, `html.grabbing` (o cursor do sistema, quando ativo, vira `grabbing`).
- **Mouse e caneta:** pega no `pointerdown` (com `preventDefault` + `setPointerCapture`, sem seleção de texto).
- **Toque:** **long-press de 380ms** sem mover mais de 8px; aí pega, com `navigator.vibrate(8)` se existir.
  - `.grab` tem `touch-action: pan-y`: um toque normal **rola a página**.
  - O `touchmove` só faz `preventDefault` **depois** de pegar.
  - Mover antes dos 380ms cancela o long-press e deixa o scroll seguir.
  - **Dica sem copy:** em telas de toque, 3.2s depois de carregar, o astronauta leva um empurrãozinho único (giro + subida curta), mostrando que é um objeto físico.
- **Teclado:** os objetos são decorativos (`aria-hidden`) e não entram no foco. Nenhuma informação depende deles.

## 5. Níveis (PERF-TIERS) e reduced motion

| | Alto | Médio | Baixo | Reduced motion |
|---|---|---|---|---|
| Desenho | 30 fps (o mesmo passo do planeta) | 20 fps | **1 quadro estático** na posição de repouso (o meteoro num ponto fixo do céu, acima e à esquerda do planeta) | 1 quadro estático |
| Física | por quadro (barata: 3 corpos) | por quadro | **não** | **não** |
| Arrastar | sim | sim | **não** (sem áreas de pegar) | **não** |
| Rastro do meteoro | 26 posições | 14 | sem rastro | sem rastro |
| Luzes que piscam | sim | sim | acesas, paradas | acesas, paradas |

## 6. Implementação (Front-End)

- **No worker existente** (A8: planeta + estrelas em OffscreenCanvas). Os objetos são desenhados **no mesmo canvas, logo depois do planeta**, reaproveitando o atlas de glifos (as mesmas 12 × matizes × saturações; o ouro do visor e da luz já está no atlas da Home por causa dos checkpoints; se não estiver, entra como uma faixa de matiz a mais).
- **A física também roda no worker** (fonte única da verdade):
  - a thread principal manda `{type:'grab'|'move'|'release', id, x, y, t}` dos eventos de ponteiro das `.grab`;
  - o worker manda de volta, a cada quadro desenhado, as posições e o raio `[x, y, r, overText]` dos 3 objetos, para a thread principal posicionar as `.grab`. São 12 números por quadro.
- **A caixa do texto** é medida na thread principal (no resize, e quando o `ResizeObserver` do hero dispara) e enviada ao worker.
- **Custo:** cada objeto avalia o SDF ~3 vezes por célula (valor + 2 gradientes) numa área de ~(2.5r)². No desktop são ~2.000 células no total por quadro (o planeta tem ~15.000), então cabe no orçamento atual.
- **Sem dependência nova.** Tudo em Canvas 2D, como o planeta.

## 7. Critérios de aceite (QA)

1. Em 1440, 1280, 768 e 375, nenhum objeto em repouso sobrepõe a caixa do texto (medir com `elementFromPoint` nos CTAs: o alvo tem que ser o link ou o botão).
2. Arremessar o astronauta contra o satélite: os dois reagem, e em ≤ 5s os dois estão de volta perto do repouso (≤ 20px).
3. No toque (375), um swipe vertical sobre um objeto rola a página; long-press + arrastar move o objeto e não rola.
4. No Baixo e em RM: quadro estático, sem `.grab` interativa, sem rastro.
5. Os quadros longos no topo da Home não aumentam mais de 10% em relação à home-v4 (Alto e Médio).
6. Os glifos dos objetos ficam alinhados à grade do planeta (mesmas colunas).
