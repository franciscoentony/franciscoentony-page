# C. Skeleton ASCII das imagens (Designer)

**Vale para:** as capas dos cards do `/blog` e do teaser da Home (quando a capa existir, DF-11) e as imagens do corpo dos posts.
**Referência:** o retrato da ficha (`Portrait.tsx`), com o ASCII lavanda sobre `void` e a foto entrando por cima com fade + leve zoom.
**Demo:** `~/Documents/franciscoentony-v3/skeleton/demo.html`. Abra por http (`python3 -m http.server` na pasta), porque o mask-image não carrega em file://.
Sem copy nova e sem dependências novas.

## 1. Visual

**O retrato desenha o ASCII da própria foto, mas o skeleton não pode:** a foto ainda não chegou. Por isso ele usa um **tile ASCII pré-renderizado**, igual para todas as imagens.
- **Sem canvas por imagem:** é só CSS, então o custo de JS e de quadro é zero.

**Asset:** `skeleton-ascii.webp` (na pasta `skeleton/`).
- Copiar para `public/ui/skeleton-ascii.webp`.
- 8,9 KB, 640 × 384 px @2x (320 × 192 CSS px), sem emenda visível ao repetir.
- Glifos brancos da rampa `" .,:;-=+*#%@"` em Geist Mono 600 8px, com célula de 5 × 8 (a mesma densidade do retrato, que usa 5.2 × 8).
- Alpha em 8 níveis. A cor vem do CSS.

**Camadas** (de baixo para cima):

| Camada | Estilo |
|---|---|
| Moldura `.media` | `bg-void`, `border border-line`, raio de 16 px (`rounded-portrait` ou o raio do card) e `overflow-hidden` |
| ASCII `.media-skel` | fundo `radial-gradient(120% 90% at 50% 45%, accent-soft, accent 55%, rgb(139 108 255 / .4))` com **máscara** = tile (`mask: url(/ui/skeleton-ascii.webp) 0 0 / 320px 192px repeat`) e `opacity: .7`. O resultado são glifos lavanda, mais claros no centro (o "volume" do retrato) |
| Varredura `.media-skel::after` | faixa de 60% da largura com `linear-gradient(90deg, transparent, rgb(245 245 247 / .9), transparent)`, `translateX(-100% → 270%)`, 1.8 s, `--ease-smooth`, infinita. Fica **dentro** da máscara, então só os glifos acendem. Só `transform` |
| `<img>` | `absolute inset-0 size-full object-cover`, com `opacity: 0` e `scale: 1.02` enquanto carrega |

## 2. Estados e transição

`data-state` fica na moldura e é o JS que define:

| Estado | Quando | Visual |
|---|---|---|
| *(sem atributo)* | SSR, sem JS ou fora da tela | tile **parado**, sem varredura. A `<img>` fica visível normalmente: se o JS falhar, a imagem aparece por cima do tile |
| `loading` | a moldura entrou na tela (IntersectionObserver, `rootMargin: 200px`) **e** `!img.complete` | tile + varredura; `<img>` em `opacity 0` |
| `loaded` | `load` da imagem (depois de `img.decode()`, quando existir) | `<img>`: `opacity 0→1` em **600 ms** e `scale 1.02→1` em 800 ms (`--ease-smooth`). `.media-skel`: `opacity → 0` em 600 ms e depois `visibility: hidden` (`transition: visibility 0s 600ms`), para a camada mascarada sair da composição |
| `loaded` instantâneo | `img.complete && naturalWidth > 0` já na checagem (cache) | sem transição (`data-instant`): nada de piscar o skeleton em imagem que já está em cache |
| `error` | `error` da imagem | tile **parado**, sem varredura; `<img>` escondida. Sem texto novo |

- **Sem tempo mínimo artificial:** a imagem entra assim que estiver pronta.
- **Por que 600 ms e não os 1.4 s do retrato:** o retrato é uma revelação encenada, e aqui a imagem está no meio da leitura.

## 3. Níveis e reduced motion (PERF-TIERS)

| | Alto | Médio | Baixo | Reduced motion |
|---|---|---|---|---|
| Tile ASCII | sim | sim | sim | sim |
| Varredura | sim | sim (só `transform`) | **não** (é animação infinita) | **não** |
| Fade da imagem | 600 ms + zoom | 600 ms + zoom | 600 ms, **sem zoom** | **nenhum**: a imagem aparece direto |
| Fade do skeleton | 600 ms | 600 ms | 600 ms | nenhum |

Use `html[data-quality="baixo"]` e `@media (prefers-reduced-motion: reduce)`.

## 4. Proporção reservada (CLS = 0)

**Cards (`/blog` e teaser):**
- Moldura com `aspect-ratio: 16 / 9` fixo, sempre (com ou sem imagem).
- `<img width height>` com as dimensões reais e `object-cover`.

**Corpo dos posts:** o render hook do Hugo já tem `width` e `height` (`data/post-images.json`). Ele passa a **envolver** a imagem:

```html
<span class="media" style="--ratio: {{ W }}/{{ H }}">
  <span class="media-skel" aria-hidden="true"></span>
  <img … width height loading decoding srcset sizes>
</span>
```

- Use `span` (`display: block`), porque o Markdown coloca a imagem dentro de `<p>`.
- `.media { aspect-ratio: var(--ratio); width: 100%; margin-inline: auto }`.
- **Verticais** (`post-image-portrait`, DF-7): `width: min(100%, calc(min(80svh, 720px) * var(--ratio)))`. Assim a moldura já nasce com a altura limitada e centralizada, sem depender da imagem.
- Imagem **sem** entrada no JSON: sai sem wrapper, como hoje (e o script precisa ser rodado de novo).
- A 1ª imagem (LCP, `fetchpriority=high`) também ganha o wrapper. Na prática ela costuma chegar em `loaded` instantâneo.

**Ligação no React:**
- Cards: um componente `MediaFrame` (`ratio`, `src`, `alt`, `sizes`…).
- Posts: um efeito em `BlogPost.tsx` que percorre `.media img` depois de injetar o HTML e liga o IO + `load`/`error`.
- Tudo com um único IntersectionObserver compartilhado.

## 5. Aceite (QA)

1. CLS = 0 ao carregar um post com 5 imagens em 4G lento.
2. Com cache, nenhuma imagem pisca o skeleton.
3. Fora da tela não há animação de varredura rodando (DevTools › Animations).
4. Baixo e RM: nenhuma animação infinita.
5. Sem JS (ou com o JS quebrado): as imagens continuam aparecendo.
6. A camada do skeleton some da composição depois do `loaded` (Layers).
