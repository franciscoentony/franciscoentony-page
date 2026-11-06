# Baseline de produção: o "antes" do redesign

**Alvo:** https://franciscoentony.com (layout v2, em produção desde 08/09/2026)
**Data:** 04/11/2026 · **QA** · Chrome estável headless · Lighthouse 13.6 (mediana de 3 execuções)
**Arquivos:** `screenshots/w{375,768,1280,1440}/` · `playwright-summary.md` · `results.json` · `lighthouse/` (HTML e JSON por rota e perfil, mais `summary.md`)

> O primeiro run do baseline foi descartado: a internet caiu no meio (59 falhas por `ENOTFOUND` e Lighthouse sem relatório). Os números abaixo vêm do run refeito com a rede estável, sem nenhum erro de rede.

## 1. Resumo

| Área (DoD) | Resultado em produção |
|---|---|
| Rotas `/`, `/blog`, `/blog/:slug` por URL direta | ✅ Renderizam nas 4 larguras. ⚠️ `/blog` e `/blog/:slug` respondem **HTTP 404** (fallback do `404.html`) |
| Console limpo | ✅ Zero erros/warnings e nenhuma request falhando nas 3 rotas × 4 larguras |
| Responsividade | ✅ Sem scroll horizontal nas 3 rotas × 4 larguras |
| Imagens com `alt` / carregadas | ✅ Todas com `alt` e carregadas (⚠️ alts genéricos nos posts, ver §3) |
| Links | ✅ Internos e GitHub ok, `_blank` com `rel` |
| Contraste AA | ❌ 17 nós na Home, 9 no Blog e 5 no Post abaixo de 4.5:1 |
| Landmarks/semântica | ❌ Sem `<main>`; salto h1 → h3 no Blog |
| Teclado | ✅ Ordem lógica, sem armadilha, foco sempre visível (outline padrão do Chrome). ❌ fora do padrão D8 (esperado no "antes") |
| prefers-reduced-motion | ❌ Hero anima (4 animações de até 2.5s) e o texto aparece com opacidade 0.1–0.2; `animate-pulse` no loading do post |
| Lighthouse ≥ 90 | ❌ Home desktop com Perf **78**. Blog e Post **não puderam ser auditados** (HTTP 404) |
| FPS no scroll | ✅ 60 fps, p95 de 17ms, zero long tasks (375 e 1440) |

Playwright: **41 ✅ · 27 ❌ · 64 ⏭**. Os pulados são casos `@redesign` sem o recurso no site atual (canvas, carrossel, cursor) ou fora da largura alvo.

## 2. Lighthouse

| Rota | Perfil | Perf | A11y | BP | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| home | mobile | 94 | 92 | 100 | 91 | 2.3 s | 0 | 30 ms |
| home | desktop | **78** | 92 | 100 | 91 | **4.5 s** | 0 | 0 ms |
| blog | mobile/desktop | — | — | — | — | — | — | — |
| post | mobile/desktop | — | — | — | — | — | — | — |

- **Blog e Post:** o Lighthouse recusa a página ("Status code: 404"). Hoje é impossível provar o DoD "Lighthouse ≥ 90" nessas rotas em produção. No build local (`vite preview`) elas respondem 200 e são auditáveis.
- **LCP da Home no desktop = `EU-PNG.png`:** **4.6 MB, 2268×4032px**, sem `fetchpriority`, carregada por um componente styled-components (não fica visível no HTML inicial), com fade de 2.5s que atrasa o render. Total da página: 4.768 KiB. O redesign troca essa imagem (D6 e D7), mas o mesmo cuidado vale para `foto-entony`: WebP ~760px, `width`/`height` e `fetchpriority="high"` se for LCP.
- **Reprovações em comum:** `color-contrast` e `landmark-one-main` (A11y); `meta-description` ausente (SEO).

## 3. Achados (com severidade para o redesign)

| # | Sev. | Achado | Evidência | Recomendação para a branch `redesign` |
|---|---|---|---|---|
| B1 | **Bloqueante (DoD)** | Rotas SPA respondem **HTTP 404** no GitHub Pages. Funcionam no navegador, mas o Lighthouse não audita, e crawlers e previews de link (WhatsApp/LinkedIn) podem tratar como página inexistente | `http-status: 404` em RT para blog/post; Lighthouse "Status code: 404" | **Decisão do Tech Lead:** no build, gerar `dist/blog/index.html` e `dist/blog/<slug>/index.html` (cópias do `index.html`) para todo post do `index.json`, mantendo o `404.html` para o resto. Não conflita com `public/blog/`, porque é só no `dist/` |
| B2 | **Bloqueante (DoD)** | Contraste: o muted atual `#55555C` sobre preto (≈ 2.8:1) é usado em eyebrows, labels do "Sobre", datas/hash/tempo de leitura dos cards e do post, e no footer | axe `color-contrast` ×17/×9/×5 | No v3 o muted fica **ainda mais escuro** (`#48484D`, ≈ 2.3:1). Datas, hash, labels e footer têm de usar `secondary #86868B` (≈ 5.8:1). O A11Y-02 já falha se sobrar texto final em `#48484D` |
| B3 | **Bloqueante (DoD)** | Sem landmark `<main>`; conteúdo fora de landmarks | axe `landmark-one-main`, `region` | Envolver as seções em `<main>` nas 3 páginas, com Navbar e Footer fora |
| B4 | Alta | Reduced-motion ignorado: o Hero anima `fadeIn`/`fadeInTexts` (até 2.5s); h1 e lead aparecem com opacidade 0.20 e 0.11 | RM-01 e RM-02 | Já previsto no HANDOFF §4; os mesmos testes valem como régua para `.rv`, canvases e Universe |
| B5 | Alta | Performance desktop 78 por causa da imagem de 4.6 MB (ver §2) | Lighthouse home/desktop | D6: foto otimizada, dimensões explícitas e prioridade de LCP; canvases só depois do LCP (D9) |
| B6 | Média | Salto de heading h1 → h3 nos cards do Blog | axe `heading-order`, A11Y-03 | Título do card como h2 (ou h2 oculto "Posts" antes da grade) |
| B7 | Média | Navbar marca **"Início" e "Contato" como ativos ao mesmo tempo** na Home (`NavLink` para `/#contato` ignora o hash) | `screenshots/w1440/home-viewport.png` | A nav nova tem âncoras; o estado ativo deve vir do scroll ou usar `<a>`, não `NavLink` com hash |
| B8 | Média | `BlogPostCard` usa `<a href>` puro: cada clique em post recarrega a SPA inteira | `src/components/BlogPostCard.tsx:8` | Usar `<Link>` do React Router |
| B9 | Média | `alt` genéricos nas imagens dos posts ("Imagem-palestra", "Imagem-MPRN") | anexo `imagens` do RT-03 | É conteúdo (`blog-cms/content`): só com OK do Entony. Registrado para depois |
| B10 | Baixa | Links "View on GitHub" ×4 (em inglês, com texto idêntico) | RT-07 `links-home` | No v3 o texto vira "GitHub ›"; adicionar `aria-label="GitHub do projeto <nome>"` |
| B11 | Baixa | Favicon declarado como `type="image/svg+xml"`, mas é PNG | `index.html:5` | `type="image/png"` |
| B12 | Baixa | Sem `<meta name="description">` | Lighthouse SEO 91 | Adicionar no `index.html` (pode entrar na copy D3) |
| B13 | Info | Lixo versionado em `public/blog-data/` (`WhatsApp Image ….jpeg`, `ganhando livro.jpeg` com espaço, `posts/visita-mprn-venx.mp`, imagens de `meu-segundo-post`) | `git ls-files public/blog-data` | Entrar no commit de limpeza do D7 |
| B14 | Info | Na `main` do início da sessão, `bun run lint` **falhava** (`react-hooks/set-state-in-effect` em `BlogPost.tsx:21`) e o Prettier reprovava 3 arquivos (`skills.ts`, `index.css`, `main.tsx`) | `eslint .` / `prettier --check src` | DoD exige lint limpo: conferir na branch `redesign` no fechamento de cada fase |

## 4. O que ficou bom e deve ser preservado

- Console e rede 100% limpos nas 12 combinações de rota × largura.
- Nenhum overflow horizontal, inclusive em 375.
- Ordem de Tab lógica e foco sempre visível.
- CLS = 0 e scroll a 60 fps (o redesign adiciona canvases, então o PF-03 vira régua importante).
- Estado de 404 de post amigável, com link de volta (RT-04).

## 5. Como reproduzir

```bash
cd qa && bun install
bun run baseline            # Playwright + resumo + Lighthouse contra produção → qa/baseline/
```
