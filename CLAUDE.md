# CLAUDE.md

Guia para agentes (Claude Code e afins) que trabalham neste repositório.

## Projeto

Site pessoal, portfólio e blog de Francisco Entony, publicado em **https://franciscoentony.com**.

**Projeto em andamento: redesign do layout (v3).** O designer entregou o novo layout no Figma, e a implementação acontece na branch `redesign`. O objetivo é trocar a camada visual sem perder conteúdo, rotas nem o pipeline de deploy.

### Fontes da verdade do design

1. **`docs/redesign/HANDOFF.md`**: tokens, seções, estados, especificação das animações e diretrizes para Blog e Post. **Leia inteiro antes de começar.**
2. **`docs/redesign/prototype/index.html`**: protótipo v3 aprovado, em HTML, CSS e JS vanilla. Os valores do handoff saíram dele.
   - Para rodar: `cd docs/redesign/prototype && cp ~/Documents/franciscoentony-v3/foto.jpg . && python3 -m http.server 8765`
   - Não faça commit dessa `foto.jpg`.
3. **Figma** `IVBfkehugwHDKOfGi92OJa`: página v3 `18:868` e Code Layer final `29:3`. As páginas v1 e v2 estão **superadas, não usar**.

Em caso de conflito: o `src/data/` manda no conteúdo, e o HANDOFF manda no visual. Se o HANDOFF e o protótipo divergirem, vale o HANDOFF (por exemplo, em reduced-motion e foco).

## Stack

- React 19, TypeScript e Vite 8
- Tailwind CSS v4, com tokens definidos em `src/index.css` dentro de `@theme`
- React Router 7
- Hugo para o blog: os posts em Markdown são compilados para JSON
- Bun como gerenciador de pacotes e runner (existe `package-lock.json`, mas o CI usa `bun install`)
- Ícones: `lucide-react` e Font Awesome

## Comandos

```bash
bun install
bun run dev:react   # servidor Vite
bun run dev:hugo    # recompila o blog (watch) para public/blog-data
bun run build       # Hugo + Vite; copia index.html para 404.html
bun run lint        # ESLint
bun run lint:check  # Prettier
bun run preview
```

Antes de considerar uma tarefa pronta, `bun run lint` e `bun run build` precisam passar.

## Estrutura

```
src/
  pages/        Home, Blog, BlogPost (rotas: /, /blog, /blog/:slug)
  components/   Navbar, Hero, About, Experience, Projects, Skills, Contact, Footer, BlogPostCard
  data/         Conteúdo do site (experience, projects, skills, posts): fonte da verdade do texto
  lib/blog.ts   Busca /blog-data/index.json e reescreve caminhos de imagens
  types/        Tipos compartilhados
  index.css     Fontes, tokens do @theme e estilos globais
blog-cms/       Projeto Hugo (content/posts, layouts/index.json)
public/blog-data/  Saída do Hugo (versionada; consumida em runtime)
.github/workflows/deploy.yml  Deploy no GitHub Pages
```

## Regras importantes

- **Todo push na `main` vai direto para produção** (GitHub Pages). Nunca faça commit ou push direto na `main`. Trabalhe em branch e abra PR. Os PRs são abertos pelo dono do repositório.
- **Separe visual de conteúdo.** No redesign, mexa nos componentes e estilos. Não altere textos em `src/data/` nem posts em `blog-cms/content/` sem pedido explícito.
- **Use só Tailwind.** O projeto está sendo padronizado em Tailwind v4. Não introduza `styled-components` (o único uso que resta, em `Hero.tsx`, deve ser migrado) nem CSS-in-JS.
- **Use tokens, não valores soltos.** Cores, fontes e raios vêm do `@theme` em `src/index.css` (`bg-ink`, `text-paper`, `text-accent`, `font-display`, `rounded-md`, etc.). Tokens novos do Figma entram ali.
- **SPA no GitHub Pages:** o deploy depende de `dist/404.html` (uma cópia do `index.html`) para que a abertura direta de `/blog/:slug` funcione. Não quebre isso.
- **`public/blog/` está no `.gitignore` de propósito**, porque conflita com a rota `/blog`. Os dados do blog ficam em `public/blog-data/`.
- Caminhos de assets devem respeitar `import.meta.env.BASE_URL` (veja `src/lib/blog.ts`).
- Formatação: 2 espaços (`.editorconfig`) e Prettier.
- Idioma: interface e conteúdo em pt-BR.

## Fluxo do redesign (time de agentes)

| Papel | Responsabilidade |
|---|---|
| Gerente de Projetos / Tech Lead | Planejamento, critérios de aceite, branch e release |
| Designer | Layout no Figma; tira dúvidas de spacing, estados e responsividade |
| Desenvolvedor Front-End | Implementação fiel ao Figma |
| QA | Testes funcionais, responsivos, de acessibilidade e performance |
| Revisor | Comparação Figma × implementação e revisão crítica do código |

Ordem de implementação: **tokens → componentes base (Navbar, Footer, botões, cards) → seções da Home → Blog e BlogPost.**

### Decisões técnicas (Tech Lead, 04/11/2026)

- **D1. Breakpoints:** a fidelidade estrita vale em 1280 e 1440px. Em 375 e 768px não há frame: o Front-End adapta a partir do breakpoint de 860px do protótipo e das diretrizes do HANDOFF, e a validação é do QA mais o designer, sobre o preview. Crie o token `--breakpoint-tab: 860px`.
- **D2. Raridade dos projetos:** derivada pelo índice (os 2 primeiros de `projects.ts` são "★ MISSÃO PRINCIPAL", os demais "◇ MISSÃO SECUNDÁRIA"). Não crie campo novo em `src/data`. Siga a ordem de `projects.ts`.
- **D3. Copy nova de interface** (headline, capítulos, títulos de seção, atributos 92/88/74/99, toast, "Próxima fase"): fica centralizada em **`src/content/ui.ts`**, para facilitar a aprovação do Entony. O merge na `main` depende desse OK.
- **D4. Sem novas dependências** de animação (framer-motion, GSAP, three.js etc.). Porte o protótipo para hooks próprios (`useScrollProgress`, `useAsciiCanvas`, `useInView`), com as constantes em `src/lib/motion.ts`. Qualquer outra dependência precisa de aprovação do Tech Lead.
- **D5. Remover `styled-components`** do código e do `package.json`, junto com o Font Awesome se ficar sem uso.
- **D6. Foto:** use a versão otimizada (`~/Documents/franciscoentony-v3/foto.jpg`) em `public/home/foto-entony.jpg`, mais uma versão WebP de cerca de 760px. **Nunca** faça commit do original `~/Downloads/foto_site.JPG` (4.9 MB, com EXIF).
- **D7. Imagens antigas** (`public/home/*.png`, `avatar.JPG`, `EU-PNG.png`): ficam até a revisão final e saem num commit de limpeza separado, depois de conferir que nada as referencia.
- **D8. Reduced motion e foco:** siga o HANDOFF, não o protótipo. Os canvases ficam estáticos e o `:focus-visible` usa outline lavanda de 2px com offset de 3px.
- **D9. Performance:** canvases pausados fora da viewport (IntersectionObserver), DPR limitado a 2, inicialização depois do primeiro paint e preload das fontes.
- **D10. Commits:** pequenos e por etapa, na branch `redesign`, no padrão `tipo(escopo): descrição` em pt-BR.

- **D11. Decisões confirmadas pelo Entony em 04/11/2026:** o LinkedIn é `https://www.linkedin.com/in/franciscoentony` (usado no Footer e no Contato) e os atributos da ficha ficam como no protótipo (92/88/74/99).

- **D12. Pasta `qa/`:** tem toolchain própria (o `package.json` dela) e fica fora do ESLint da raiz (`globalIgnores` em `eslint.config.js`). O lint dela é responsabilidade do QA.
- **D13. Ícones em `src/data/skills.ts`:** os campos `icon` e `color` são apresentação, não conteúdo. Na fase 3 o Front-End pode removê-los, junto com o tipo e os imports do Font Awesome, e depois tirar `@fortawesome/*` do `package.json` (D5). Os textos (`title` e descrições) **não** mudam.
- **D14. `src/lib/blog.ts`:** o estilo inline das imagens dos posts (`#1E1E22`, `0.75rem`) é substituído na fase 4 (Blog e Post) pelos tokens do HANDOFF §7.

**Pendência com o Entony:** aprovar o restante da copy nova (D3).

### Critérios de aceite (Definition of Done)

- Fidelidade ao design em 1280 e 1440px; em 375 e 768px, layout aprovado pelo QA e pelo designer (D1)
- Lighthouse com Performance e Acessibilidade ≥ 90
- Nenhum erro ou warning no console
- `bun run lint` e `bun run build` sem erros
- Rotas `/`, `/blog` e `/blog/:slug` funcionando, inclusive ao abrir a URL diretamente
- Navegação por teclado, foco visível, `alt` nas imagens e contraste AA
- Conteúdo de `src/data/` preservado
