# Cursor foguete (Designer)

**Alvo:** `src/components/layers/CustomCursor.tsx` (branch `redesign`).
O foguete substitui o **ponto dourado**, o **anel padrão** passa a não existir, e o rastro vira a **exaustão**.
Sem copy nova e sem dependências novas.

## 1. Forma, tamanho e hotspot

O foguete é um **SVG de traço fino, com 24 × 24 px**. O ASCII fica na exaustão: um foguete feito de glifos ficaria ilegível a 24 px e brigaria com o rastro.

```html
<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none"
     stroke="var(--color-paper)" stroke-width="1.25" stroke-linejoin="round" stroke-linecap="round">
  <!-- corpo (nariz em 12,1.5) -->
  <path d="M12 1.5C15.2 4.5 16 8.5 16 12.5V17H8V12.5C8 8.5 8.8 4.5 12 1.5Z" fill="var(--color-ink)"/>
  <!-- aletas -->
  <path d="M8 13.5L5 17V19.5L8 17.5" stroke="var(--color-accent-soft)"/>
  <path d="M16 13.5L19 17V19.5L16 17.5" stroke="var(--color-accent-soft)"/>
  <!-- bocal -->
  <path d="M10 17L10.6 19H13.4L14 17"/>
  <!-- escotilha: é o ponto dourado de hoje -->
  <circle cx="12" cy="9.5" r="1.9" fill="var(--color-gold)" stroke="none"/>
</svg>
```

**Cores e acabamento:**
- Corpo em `paper`, preenchido com `ink` (as estrelas não aparecem através dele).
- Aletas em `accent-soft` (lavanda).
- Escotilha em `gold`: é o ponto dourado de hoje, o que mantém a continuidade da marca.
- Brilho: `filter: drop-shadow(0 0 6px rgba(201,188,255,.45))` no wrapper. É estático; por quadro só muda o `transform`.

**Hotspot:**
- O hotspot é o **nariz, em (12, 1.5)** do viewBox.
- Use `transform-origin: 12px 1.5px` e `translate3d(x - 12px, y - 1.5px, 0) rotate(θ)`. Assim o nariz fica **sempre** exatamente sobre o ponteiro, em qualquer rotação.
- No SVG, o nariz aponta para cima, então θ = 0° significa "para cima".

## 2. Rotação

**Pose padrão: −45°** (nariz para cima e para a esquerda, corpo para baixo e para a direita).
- É a mesma geometria da seta do sistema: o corpo fica fora do caminho de onde se mira, e a mão já espera isso.
- Para cima e para a direita (a pose do emoji 🚀), o corpo cobriria o texto à esquerda do ponteiro.

**Direção do movimento:**
- Velocidade suavizada por EMA: `v = lerp(v, delta, 0.25)`, com o fator corrigido pelo tempo do quadro.
- Rumo alvo: `atan2(v.y, v.x) · 57.3 + 90`.
- Só atualiza o rumo quando `|v| > 2 px/quadro` (normalizado a 16 ms). Movimentos pequenos **não** giram o foguete, então ele não treme.
- Aproximação: `θ += diff(alvo, θ) · k` pelo **caminho mais curto** (diferença em −180..180).
  - `k = 1 − 0.82^(dt/16)`, ou seja, 0.18 por quadro de 16 ms.
  - Fica idêntico a 60 e a 30 fps.
- Sem esticar o foguete (o `scale` por velocidade de hoje sai): um foguete não se deforma.

**Parado:** depois de **250 ms** abaixo do limiar, θ volta para −45° com `k = 1 − 0.94^(dt/16)` (cerca de 0,8 s, sem mola nem overshoot).

## 3. Propulsão (exaustão)

- **Origem:** a cauda, a 18 px do nariz no eixo do foguete (bocal em 12, 19.5), já rotacionada.
- **Interpolação:** interpole entre a cauda anterior e a atual, como o rastro faz hoje, para não abrir buracos em movimentos rápidos.
- **Quantidade por quadro:** `min(settings.cursorParticlesPerFrame, floor(|v| / 6))`. Abaixo de 6 px/quadro, nenhuma partícula, **sem chama**.
- **Velocidade de cada partícula:** oposta ao rumo, com `0.8 + |v| · 0.06`, espalhamento de ±18° e jitter de ±1.5 px na origem.
- **Vida:** cai 0.035 por quadro de 16 ms (cerca de 0,5 s). A exaustão é curta; o rastro de hoje dura cerca de 0,75 s.
- **Glifos por vida:** `✦` e `*` (> 0.7), depois `+` e `:` (> 0.4), depois `·` e `.`.
- **Cor: dourada saindo do bocal e esfriando em lavanda.**
  - Matiz de 45 (gold) nos primeiros 25% da vida, depois de 250 a 300 (oscilando com `time`, como hoje).
  - Saturação de 95% e alpha igual à vida.
- **Tamanho:** de 8 a 12 px em Geist Mono 500 (um pouco menor que os 9 a 14 de hoje, porque a chama sai de um ponto).
- **Limites por nível:** os de hoje. Alto: 260 partículas, 4 por quadro. Médio: 120 partículas, 2 por quadro.

```
        ▲  ← nariz = hotspot
       ( )
      /|o|\      o = escotilha dourada
       ‾‾‾
       ✦*        ← dourado (quente)
      +:+
     · . ·       ← lavanda (frio), apagando
```

**Dormir (P5 I-B):** o `draw` retorna `false` quando tudo isto vale ao mesmo tempo:
- `|v| < 0.1`;
- a pose está assentada: `|θ − (−45)| < 0.5°`;
- a órbita está assentada;
- não sobra nenhuma partícula.

Depois de parar, o ticker roda no máximo cerca de 1,3 s (250 ms de espera + o retorno à pose + o fim da chama) e dorme.

## 4. Estados

| Estado | Foguete | Anel ("órbita") |
|---|---|---|
| Padrão | pose e rumo normais | **some** (`size-0`, `opacity-0`) |
| Link e botão | `scale(1.1)`; a escotilha ganha o brilho `shadow-glow-gold` (por classe, não por quadro) | **órbita de 40 px**, borda de 1 px em `paper/40`, sem fundo, centrada no **nariz** e seguindo com o `lerp` de 0.16 de hoje. Ela marca o alvo do clique |
| `holo` | igual ao padrão | **igual ao de hoje**: 96 px iridescente com "INSPECIONAR", centrado no nariz |
| `drag` | igual ao padrão | **igual ao de hoje**: 96 px iridescente com "ARRASTE" |

Transição entre os estados: a de hoje (450 ms em `width`, `height`, `background` e `border`). O anel nasce e morre no nariz.

**Clique = boost**, no lugar da explosão de 360°:
- No `pointerdown`, o foguete faz `scale(0.9)` (no estado link, 0.99) e a órbita faz `scale(0.82)`, como hoje.
- **Rajada de 12 partículas** saindo da cauda num **cone de 70°** oposto ao rumo, com velocidade de 2 a 5, dourado → lavanda e glifos `✦*+`. No Médio, 8 partículas.
- Continua emitindo depois do paint (`afterNextPaint`, A10).
- No `pointerup`, o foguete volta à escala normal em 200 ms (`--ease-smooth`).

## 5. Sem mudança

- Só aparece com `(hover: hover) and (pointer: fine)` e `pointerType === "mouse"`.
- Cursor do sistema no nível **Baixo** e em **reduced motion**.
- O Médio usa os limites menores da `quality.ts`.
- A classe `has-custom-cursor`, o fade de entrada e saída da janela, os z-index (canvas 98, foguete e anel 100), o `aria-hidden` e o `sleepUntilPointer`.
- O `CURSOR.trailChars` pode sair do `motion.ts`, porque os glifos agora vêm da regra por vida acima.

## Aceite (o QA mede)

1. O nariz fica sobre o ponteiro em 0°, 90°, 180° e −45°, com no máximo 1 px de erro.
2. Movimentos de 1 a 2 px não giram o foguete.
3. Parado: volta a −45° e o ticker dorme em ≤ 1,5 s.
4. Não há chama abaixo de 6 px por quadro.
5. Médio: no máximo 120 partículas.
6. A rotação fica igual a 30 e a 60 fps (o fator é corrigido pelo tempo do quadro).
