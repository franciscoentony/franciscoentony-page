# IMPECCABLE: critique antes e depois (projeto e post)

**Ferramenta:** `.github/skills/impeccable` v4.8.0 (o comando `critique`).

**Método:** dual-agent, como manda o `critique.md`.
- **A** (revisão de design, heurísticas de Nielsen 0–4) e **B** (detector CLI + `detect.js` injetado no navegador) rodaram em sub-agentes isolados.
- A v3 teve **um lote de correções** e depois uma **rodada de verificação** pela mesma revisora A.
- Snapshots em `franciscoentony-page/.impeccable/critique/`. Os slugs `post-html` e `projeto-html` guardam a progressão.

**Contexto do impeccable:**
- Não há PRODUCT.md nem DESIGN.md. O `impeccable context` autorizou seguir com a implementação atual (a Home aprovada) como autoridade visual, já que esta é uma *extensão* de um mundo estabelecido.
- Não rodei o `init`, porque as perguntas viriam ao Entony pelo GP e o brief já era preciso.
- O post é avaliado no modo **Read**; o projeto, no modo **Experience** (heurísticas 7 e 10 = n/a).

## Placar

| Página | v1 | v2 | v3 (antes das correções) | **v3 final** |
|---|---|---|---|---|
| Post | 26/40 (65%), Acceptable | 31/40 (78%), Good | 27/36 (75%) | **29/36 (81%), Good** |
| Projeto | 19/32 (59%), Needs work | 26/32 (81%), Good | 22/32 (69%) | **24/32 (75%), Good** |

**Leitura honesta:**
- O **post v3** é a melhor nota das três versões (81%).
- O **projeto v3** ficou um pouco abaixo da v2. A diferença vem da heurística 2 (o selo "Missão secundária" no projeto principal, regra D2) e de manter a estrutura de capítulos e resultados da v1, que o Entony pediu. A revisora marcou esses dois pontos como "decisão do dono", não como defeito de acabamento.

## Detector (B)

| Alvo | v1 (navegador) | v2 (navegador) | **v3 (navegador)** |
|---|---|---|---|
| Post | 5 | 1 | **1** |
| Projeto | 16 | 2 | **1** |

**v1, os achados do navegador:**
- `hero-eyebrow-chip`;
- `undersized-ui-text` ×8 (labels em caps de 10.5px);
- `gradient-text` ×3;
- `tiny-text` / `wide-tracking`;
- `skipped-heading`;
- `em-dash-overuse`.

**v3:** sobrou só `overused-font` (Geist), que é a fonte aprovada da Home e aparece em qualquer página do site.

**Falsos positivos do CLI (os mesmos em todas as versões):**
- `broken-image`: as imagens são preguiçosas, com `data-src`;
- `marquee`: é a varredura do skeleton, que só roda enquanto a imagem carrega;
- `dark-glow`: é o ponto dourado do logo, herdado da Home.

## Especificidade (A), v3 final

**Post: específico.** O que é deste site:
- local nav: a seção é o voltar, o título vira cabeçalho corrente e o filete mede a leitura;
- a capa que nasce em ASCII e vira foto (vale também no toque);
- a lente ASCII na foto do próximo post;
- a assinatura em glifos;
- o "Link copiado" que se decodifica.

**Projeto: específico no hero e no fim.** O que é deste site:
- o emblema ASCII sangrando até a borda;
- a ficha técnica com pontos-guia (a revisora a apontou como "o melhor componente das duas páginas");
- a linha `git clone`;
- a manchete em dois tons com o emblema do próximo projeto.

## Achados e o que aconteceu com cada um

| Achado (A, v3) | Status |
|---|---|
| O mundo não estava no quadro; a lente só funcionava com mouse | **Resolvido**: a revelação ASCII → foto da capa funciona em qualquer aparelho |
| A assinatura parecia uma bio de autor | Parcial → **ajustado**: o retrato saiu do quadrado e ganhou borda esfumada |
| A falha de copiar mostrava sucesso; sem aria-live | **Resolvido**: "Não deu para copiar" + aria-live + aria-label estável |
| O estado de erro das imagens não tinha estilo | **Resolvido**: tile parado + alt sobre um gradiente escuro |
| Menu do celular (36px, sem estado de fechar, sem item atual) | **Resolvido**: 44px, ícone X, "Fechar menu", item atual em dourado |
| As telas apareciam só depois de 2400px | **Resolvido**: logo abaixo do hero |
| Linha de três números (template de métricas) | **Resolvido no estilo**: virou uma frase com os números em Doto. O conteúdo dos números é do Entony |
| Destaque dos capítulos não exclusivo | **Resolvido**: só o capítulo mais perto do centro acende |
| ★ ◇ em Unicode | **Resolvido**: SVG |
| Quebra "/-page" do nome; tracking −0.045em | **Resolvido**: quebra depois do hífen; −0.04em |
| O emblema do próximo projeto flutuava | **Resolvido**: lado a lado com a manchete (1.25fr / .75fr) |
| Frase de resultados recuada; legenda esmagada no 375; o título do próximo em 3 linhas; Doto pequeno | **Resolvido** (medido: x = 180 / 24, legenda com 327px, 2 linhas, 1.25em) |
| "Missão secundária" no projeto principal | **Aberto**: regra D2 (o índice decide). Sugestão: rever a D2 |
| "Topo ↑" e o brilho do logo | **Aceito**: herdados da Home aprovada |

## O que não foi feito

- O `finish-reviewer` e o `documenter` do impeccable não rodaram como agentes próprios: este harness não tem esses tipos de agente. A rodada de verificação da revisora A ocupou o papel do *verdict pass*. Não escrevi DESIGN.md, porque é uma extensão e não uma mudança de sistema. O adendo v3 documenta as decisões.
- O `init` (PRODUCT.md) fica como sugestão para o Entony, se ele quiser usar o impeccable no resto do site.
