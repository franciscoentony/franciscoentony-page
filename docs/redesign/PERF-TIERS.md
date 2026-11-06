# P1: níveis de qualidade (Designer)

**Base:** protótipo de teste `~/Documents/franciscoentony-v3/prototype-tiers.html`.
- Parâmetros pela URL: `?tier=alto|medio|baixo`, `&cell=`, `&ascii_ms=`, `&lv=` (níveis de brilho), `&hues=` (faixas de matiz).
- Capturas em `~/Documents/franciscoentony-v3/tiers/`.
- Comparei em 390×844 e 1440×900.
- O repo não foi tocado.

## 1. Tabela por nível

| Parâmetro | Alto | Médio | Baixo |
|---|---|---|---|
| Quadros/s do ASCII (planeta, retrato, thumbs, contato) | 30 fps (33 ms) | **20 fps (50 ms)** | 1 quadro estático por canvas, desenhado ao ficar visível e de novo no resize |
| Célula do planeta | fonte 10 px (8 px abaixo de 700 px) | **13 px (10 px abaixo de 700 px)**, fator 1.3 | = Médio |
| Célula do retrato | 5.2 × 8 px | **6.8 × 10.4 px** (1.3) | = Médio |
| Célula dos thumbs | 6 × 10 px | **7.8 × 13 px** (1.3) | = Médio |
| Célula do campo do contato | 11 × 16 px | **13 × 19 px (fator 1.2)**. Com 1.3 os glifos ficaram grossos demais perto do texto. | = Médio, com a onda centrada (não no último ponteiro) |
| Densidade de estrelas | área ÷ 4200 | **área ÷ 8400 (-50%)** | ÷ 8400, estáticas e sem cintilação |
| Halo e cruz das estrelas | sim | **não** | não |
| Parallax das estrelas no scroll e no mouse | sim | **sim** (é barato e dá profundidade) | não |
| Warp (velocidade da luz) | sim | **não** | não |
| Grain | animado (só transform) | **parado** | parado |
| Navbar | blur 20 px + saturate, fundo a 55% | **sem blur, fundo `ink` a 92%** | = Médio |
| Planeta: trajetória, pin, capítulos, dissolução | completo | **completo**, com a dissolução a 20 fps | sem pin (como no reduced motion) |
| Planeta: luz seguindo o ponteiro | sim | **sim** (custo zero) | não |
| Retrato ASCII | anima até a foto aparecer; depois só redesenha durante a lente | **para de desenhar quando a foto aparece**. No toque não há lente, então o canvas pode até ser descartado. | quadro estático por baixo; a foto aparece com fade simples |
| Cards holo (tilt + foil + glare) | completo | **tilt + glare; foil sem `mix-blend-mode`** (camada com opacidade fixa de 0.18) | sem tilt; hover de borda e sombra |
| Esfera | 60 fps ou ticker | **30 fps** | parada; a dica "Arraste" some (D19) |
| Cursor custom | completo (rastro com até 260 partículas, 4 por quadro) | **rastro com até 120 partículas, 2 por quadro**. Em dispositivos de toque já não existe. | nativo |
| Contadores, revelações `.rv`, WordReveal, linha da timeline | sim | **sim** | ver item 2 |

## 2. Nível Baixo × reduced motion

**Confirmo:** o Baixo reusa os **quadros estáticos de JS** do reduced motion (canvases parados, sem pin, sem warp, sem cursor custom). Mas, como o usuário **não** pediu menos movimento, o **CSS barato continua no Baixo**:
- hovers e transições de botões, links, cards e dots (`transform`, `opacity`, `color`);
- revelação `.rv` (fade + 32px);
- contadores e linha da timeline;
- fade da foto;
- toast;
- abrir e fechar do menu mobile.

**O que separa os dois:**

| | Baixo | Reduced motion |
|---|---|---|
| Canvas | estático | estático |
| Pin do Universe | não | não |
| Transições CSS (≤ 600 ms, só transform/opacity/color) | **sim** | não |
| Tilt holo | não | não |
| Grain e navbar | parado, sem blur | parado, sem blur |

**Implementação:** separar os dois sinais. Algo como `quality: 'alto' | 'medio' | 'baixo'` e `motion: 'full' | 'reduced'`. Hoje tudo depende de `isStatic`. Reduced motion força `quality = baixo` **e** `motion = reduced`.

## 3. Atlas de glifos: quantização aceitável

Testei o planeta estático (mesmo quadro) e o campo do contato. Medi a diferença média por pixel em relação ao contínuo (0–255) e comparei visualmente com zoom de 2×.

| Variante | Diferença média | Leitura visual |
|---|---|---|
| 12 níveis de brilho | 0.14 | idêntico |
| **8 níveis de brilho** | **1.92** | **degraus perceptíveis**: perde 4 dos 12 glifos da rampa, e o terminador vira faixas chapadas de `---` e `***` |
| 6 / 4 níveis de brilho | 2.5 / 3.6 | claramente pior; perde o volume da esfera |
| 8 faixas de matiz | 0.15 | idêntico |
| **6 faixas de matiz** | 0.19 | idêntico |
| 4 faixas de matiz | 0.22 | aceitável, mas a borda iridescente fica mais rosa/lilás chapada |
| 3 faixas de matiz | 0.23 | perde a iridescência; não usar |

**Conclusão:** quem cria os degraus é o brilho, não o matiz.
- **Brilho: 12 níveis, um por glifo da rampa `" .,:;-=+*#%@"`.** O glifo e a luminosidade andam juntos, então isso não custa nada a mais: o atlas já precisa dos 12 glifos. **8 não é aceitável.**
- **Matiz: 6 faixas no Alto e 4 no Médio.** Mínimo absoluto: 4.
- **Saturação:** 2 faixas (miolo ~70–80%, borda 100%).
- **Alpha: não quantizar no atlas.** Usar `globalAlpha` por célula. É barato e evita mais degraus na dissolução e nas bordas.
- **Atlas:** 12 glifos × 6 matizes × 2 saturações = **144 tiles** no Alto (Médio: 12 × 4 × 2 = 96). A 2×DPR com célula de 10 px, cabe numa textura menor que 512 × 512.

## 4. O que NÃO pode cair em nenhum nível

1. O **planeta ASCII** no hero (no Baixo, como quadro estático). É a assinatura do site.
2. **Fundo preto com estrelas** (mesmo com menos estrelas).
3. Os **3 capítulos** de texto, com o mesmo conteúdo (no Baixo, empilhados).
4. **Fotografia real** na ficha, com nome e atributos.
5. A **rampa ASCII completa** (os 12 glifos) e as **cores** (violeta, lavanda, dourado). Quantizar abaixo do item 3 apaga a identidade.
6. Tipografia, gradiente do texto, CTAs e toda a hierarquia: idênticos nos 3 níveis.
7. Foco visível, contraste e conteúdo. Desempenho nunca justifica perda de acessibilidade.

## 5. Notas para o Front-End

- **Dica para o governador:** se cair para Baixo no meio da visita (B2), trocar sem salto de layout. Desligar o pin do Universe com o usuário dentro da seção causa um pulo. Proposta: **cair para Baixo só fora do Universe**; dentro dele, ficar no Médio até o usuário sair.
