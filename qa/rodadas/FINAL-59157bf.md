# Rodada final: 59157bf (origin/redesign)

Build numa worktree destacada, preview 127.0.0.1:4190, suíte padrão completa (4 larguras): **155 passed, 105 skipped (por desenho), 16 failed**. Todas as 16 falhas são a mesma violação axe (abaixo).

## Resultado por spec

| Spec | Resultado |
|---|---|
| routes (RT-01..07 nas 7 rotas: `/`, `/blog`, post, 4× `/projetos/<slug>` abertos direto; RT-04b slug de projeto inexistente; 404.html) | ✓ |
| Console limpo e sem scroll horizontal nas rotas novas (RT, 4 larguras) | ✓ |
| keyboard | ✓ |
| motion: RM-01..05 nas 7 rotas; RM-06 (objetos do hero: sem áreas de arrasto, `html.grabbing` não liga ao arrastar); PF-01..03 | ✓ |
| navigation: RT-08, KB-04 (D20), KB-05 (H4), NAV-URL (cliques no header mantêm `/`), NAV-HASH (`/#contato` digitado rola e limpa o `#`; hash digitado já na Home também) | ✓ |
| a11y A11Y-02/03 | ✓ |
| **a11y A11Y-01 (axe WCAG 2.1 AA)** | ❌ 16 casos |

## Bloqueadores

1. **A11Y-01 `label-content-name-mismatch` [serious]: logo do header** (`<a aria-label="Francisco Entony, ir para o início">` com texto visível "F.Entony"). O nome acessível não contém o texto visível (WCAG 2.5.3). Aparece em 375 e 768 (home, blog, post, 4 projetos) e em 1280/1440 no blog. Correção sugerida: `aria-label` começando pelo texto visível, ex. "F.Entony, ir para o início", ou remover o `aria-label` (o texto já nomeia o link). `src/content/ui.ts: navbar.logoLabel` (copy: precisa de OK do Entony) e `Navbar.tsx:~296`.
   Repro: `cd qa && QA_PORT=4190 bunx playwright test tests/a11y.spec.ts -g A11Y-01 --project=w375`.
2. **A11Y-01 `scrollable-region-focusable` [serious] em `/projetos/<slug>` a 375px:** o `<code>` de `ProjectSections.tsx:423` (`overflow-x-auto`) rola e não é focável por teclado. Correção: `tabIndex={0}` (com `role="region"` + `aria-label`) ou quebrar linha. Repro: o mesmo comando em `-g "A11Y-01.*projeto"`.

## Observações (não bloqueiam)

- Sob reduced motion, o container do hero (`#top [data-cursor=drag]`, a div do palco) mantém `cursor-grab`/`data-cursor="drag"` embora nada seja arrastável; só cosmético (o cursor custom já está desligado).
- Lighthouse e perf não foram reexecutados nesta rodada (fora do escopo pedido).

## Ajustes nos testes desta rodada

- `helpers.routes()`: + 4 rotas `/projetos/<slug>` (entram em routes, a11y, keyboard, motion).
- KB-05: reescrito para o H4 (desktop: `html[data-header=compact]` e trilha ≤12px ao descer, volta cheio com foco de teclado e com hover; celular: header fixo, mesma altura). Não some mais.
- NAV-URL, NAV-HASH, RT-04b, RM-06: novos.
- RM-02: ignora elementos não renderizados (menu mobile fechado dava falso positivo).
- PF-01: a sanidade "canvas visível anima" ignora canvases de Worker e o canvas fixo do cursor (só desenha com o mouse em movimento).
