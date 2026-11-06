# Revisão de design: "cara de IA" nas páginas de Projeto e Post

Revisor, 05/11/2026. Pedido do Entony via Gerente de Projetos.
Material: `~/Documents/franciscoentony-v3/paginas/projeto.html?p=petca`, `paginas/post.html` e `HANDOFF-ADENDO-PROJETO-POST.md`, vistos a 1440px. Para comparar: a Home da branch `redesign`, que já está aprovada.

## Diagnóstico em uma frase

A Home funciona porque concentra a personalidade numa ideia só, o universo ASCII com o planeta, e deixa o resto respirar. As páginas novas pegam essa linguagem e a espalham por todos os rótulos, cards e seções, em cima de um esqueleto de *case study* e de *blog de template*. O resultado parece gerado, porque é a soma das escolhas mais prováveis. E as partes que soam humanas (as fotos e o texto do post) ficam soterradas por moldura.

## Top 10, em ordem de peso

| # | Tela | Elemento | Por que denuncia | O que fazer no lugar |
|---|---|---|---|---|
| 1 | Projeto | **Esqueleto "01 O problema / 02 A solução / 03 O que eu fiz / 04 O que aprendi"** em 2 colunas e numerado (adendo A1 §3) | É o formato de case study de bootcamp e de prompt de IA. O texto passa a responder a um formulário em vez de contar uma história, e os quatro blocos ficam com a mesma altura e o mesmo peso | **Um texto corrido** na coluna de leitura do post (cerca de 640px), escrito pelo Entony, com intertítulos opcionais **nas palavras dele** ("Por que fiz isso", "O bug que quase me fez desistir"). Sem numeração. O designer projeta para texto livre, e não para 4 campos |
| 2 | Projeto | **Seção "Resultados" com `[00]` em Doto e gradiente** (A1 §2) | Os "números grandes de resultado" são o clichê nº 1 de landing page gerada. Num projeto de estudante, ou inventam métricas ou o espaço fica vazio, e o placeholder `[00]` já mostra isso | **Remover a seção.** Se existir um número real ("12 ONGs usam"), ele vai dentro do texto, como frase |
| 3 | Ambas | **Fôrma eyebrow + H2 com ponto final** repetida em toda seção: "Diário da missão / Do problema ao código.", "Inventário / Stack da missão.", "Telas / Por dentro do sistema.", "Continue explorando", "Continue no diário" | A mesma fórmula três ou quatro vezes por página dá um ritmo de slide deck, e o título com ponto final de efeito ("X do Y.") é um tique típico de IA | Tirar os H2 decorativos. As seções curtas não precisam de título. Quando precisar, um rótulo simples e funcional ("Stack", "Telas") em texto normal, sem eyebrow nem ponto final |
| 4 | Ambas | **Metáfora de jogo em todo rótulo**: "Todas as missões", "★ MISSÃO PRINCIPAL", "Diário da missão", "Stack da missão", "Inventário", "PRÓXIMA MISSÃO", "Continue no diário", "PRÓXIMO REGISTRO", "REGISTRO ANTERIOR", "Mais registros no diário" | Na Home, a metáfora é um tempero e está aprovada. Repetida 10 vezes, vira fantasia, e o visitante perde o "Projetos" e o "Post" que ele procura | Fora da Home, linguagem comum: "‹ Projetos", "Próximo projeto", "Próximo post", "Todos os posts". No máximo **um** acento lúdico por página (o selo ★ no topo do projeto, por exemplo) |
| 5 | Post | **Recursos que ninguém pediu**: barra de leitura com gradiente e glow, trilho lateral de share **mais** rodapé de share (duplicado), índice com scroll-spy, `#7be21f0` (hash de commit falso), separador `· · · ·`, capa ASCII gerada pelo hash | São os recursos padrão do Medium e do Ghost, para um blog com 2 posts de 3 a 5 minutos. O hash de commit como ID do post é *cosplay* de dev. Cada um isolado é inofensivo; juntos, formam o kit de template | Cortar a barra, o trilho, o índice, o hash e a capa ASCII gerada. Fica **um** "Copiar link" discreto no fim, se tanto. Post sem foto não tem capa (o título segura a página) |
| 6 | Ambas | **Excesso de cards**: stack em 3 cards de 1 ou 2 pills (um card inteiro para `[docker]`), cards "Código-fonte / Versão no ar" que repetem os botões do hero, card "Próxima missão" mais card "Voltar", card-convite tracejado quando falta post | Moldura em volta de tudo é o *default* de gerador de UI. O card vazio ou quase vazio mostra que o layout veio antes do conteúdo | Stack em **uma linha de texto** mono ("react-native · django rest · pytest · docker"). Apagar os cards de link, porque o hero já tem os botões. Navegação final com **um** link de texto ("Próximo projeto: connect-responsibly →"). Quando falta o post anterior, não mostrar nada |
| 7 | Projeto | **Hero simétrico com ficha técnica**: texto à esquerda, card ASCII à direita com "01 / 04" (contador de carrossel sem carrossel) e grade PERÍODO / PAPEL / STATUS em caps mono | É o layout de 50/50 mais previsível que existe. O "01 / 04" foi copiado da Home sem função, e a ficha em caps lembra um formulário do LinkedIn | Trocar a ficha por **uma frase**: "Fiz sozinho entre março e junho de 2025. Está no ar." Remover o contador. Tirar a moldura do ASCII e deixá-lo sangrar no fundo, ou substituir por um print real da tela principal |
| 8 | Ambas | **Chevrons ›/‹ e caps mono em tudo**: "‹ Todas as missões", "GitHub ›", "Ver demo ›", "PRÓXIMA MISSÃO ›", "‹ VOLTAR", "Ver tudo no GitHub ›", "‹ Voltar pro blog" (2×), "COMPARTILHAR", "[FRONT-END]", legendas em mono | Quando todo link tem a mesma seta e todo rótulo o mesmo caps tracking, nada se destaca. Fica com cara de *design system* aplicado no automático | Chevron só no link de voltar (um por página) e `↗` só em links externos. O mono fica restrito a código e dados (stack, datas). Rótulos e legendas em Geist normal, em caixa baixa |
| 9 | Ambas | **Ritmo monótono**: toda seção com a mesma largura de 1080, o mesmo respiro de ~160px e o mesmo H2 à esquerda; o grid 1.6fr/1fr se repete no rodapé das duas páginas | A página se lê como uma pilha de blocos iguais, e é a regularidade que denuncia o gerador | Coluna de leitura estreita como base (a do post já funciona). Variar de propósito: uma imagem que sangra para 1080, uma legenda ao lado, espaços menores entre coisas relacionadas e maiores só nas viradas de assunto |
| 10 | Ambas | **Falta de autoria**: no projeto não há uma foto, uma frase na voz do Entony, nem um detalhe específico (data, nome, erro). O bloco de autor do post ("Francisco Entony / Desenvolvedor Full-Stack" com avatar) é redundante num site pessoal | O que torna uma página humana é o específico e o imperfeito, e é isso que falta. O bloco de autor é o template do Medium. As **fotos do post** são o trecho mais humano das duas telas, e estão espremidas entre molduras | Dar às fotos reais o espaço principal (maiores, layout menos rígido, legendas na voz dele). No projeto, prints reais ou foto do uso, mais uma anedota. Trocar o bloco de autor por uma linha no fim ("Escrito em Natal, três dias depois do evento"), que é conteúdo e precisa de aprovação |

### Menores (resolvidos junto com o top 10)

- Placeholders de tela em ASCII ocupando ~1200px: enquanto não houver print real, a seção não deve existir. Não desenhar o vazio.
- Card "‹ REGISTRO ANTERIOR / Mais registros no diário": é quase todo espaço vazio ao lado do card cheio.
- "‹ Voltar pro blog" aparece no topo **e** no fim do post: basta um.
- O raio de 22 em todas as molduras, somado à borda e ao fundo `bg-2`, deixa tudo com a mesma textura de "componente".

## O que manter

- O fundo de estrelas e a tipografia (Geist + Doto) da Home: são a identidade aprovada.
- A coluna de texto do post (largura, entrelinha, tamanho), que está boa.
- O selo ★ / ◇ no topo do projeto, como **único** aceno ao jogo.
- As fotos do evento, que são o melhor conteúdo das duas páginas.

## 5 princípios para a v2

1. **Uma assinatura por site, não por rótulo.** O universo e a metáfora de jogo moram na Home. As páginas internas são silenciosas, com texto, imagens e links. Cada página tem no máximo um acento lúdico.
2. **Desenhar para o conteúdo que existe.** Nenhuma seção, campo ou placeholder sem conteúdo real do Entony (nada de `[00]`, de esqueleto de case study ou de tela fictícia). Quando um campo não existe, a página fica mais curta, não ganha um card-convite.
3. **Linguagem comum e frases inteiras.** Rótulos dizem o que são ("Projetos", "Próximo post"), sem título de efeito com ponto final e sem caps mono decorativa. Texto de interface soa como o Entony falando, não como um slogan.
4. **Menos contêineres.** Card só para o que é clicável como unidade. Stack, metadados e links em texto. Um tipo de card por página, no máximo. Chevron no "voltar" e ↗ no externo, só isso.
5. **Ritmo irregular e detalhe específico.** Coluna de leitura como base, variada de propósito (imagem que sangra, legenda lateral, espaçamentos diferentes). Priorizar o específico e o real (datas, nomes, fotos, um erro que deu) em vez de recursos genéricos como share, índice, barra de leitura e "resultados".
