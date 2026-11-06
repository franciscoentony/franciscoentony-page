# Rodada final: 99ace75 (origin/redesign, correções I-1 a I-7)

Build novo do 99ace75 (testes de 5c6b88a), preview 127.0.0.1:4190, suíte padrão completa: **155 passed, 105 skipped (por desenho), 16 failed**. Mesmo resultado da rodada em 59157bf ([FINAL-59157bf.md](FINAL-59157bf.md)): as correções I-1..I-7 não regrediram nada.

| Spec | Resultado |
|---|---|
| routes (7 rotas, `/projetos/<slug>` direto, slug inexistente, 404.html), console limpo, sem scroll horizontal | ✓ |
| keyboard | ✓ |
| motion (RM-01..06, PF-01..03) | ✓ |
| navigation (RT-08, KB-04, KB-05, NAV-URL, NAV-HASH) | ✓ |
| a11y A11Y-02/03 | ✓ |
| **a11y A11Y-01 (axe)** | ❌ 16 casos, 2 violações (abaixo) |

## Bloqueadores (ainda abertos)

1. `label-content-name-mismatch` [serious]: logo do header, `aria-label` "Francisco Entony, ir para o início" não contém o texto visível "F.Entony" (WCAG 2.5.3). 375/768 em todas as rotas; 1280/1440 no blog. Copy de `ui.ts` (`navbar.logoLabel`): precisa do OK do Entony.
2. `scrollable-region-focusable` [serious]: `<code>` de `ProjectSections.tsx:423` (`overflow-x-auto`) em `/projetos/<slug>` a 375px, sem foco por teclado. `tabIndex={0}` + `role="region"` + `aria-label`, ou quebra de linha.

Repro: `cd qa && bunx playwright test tests/a11y.spec.ts -g A11Y-01 --project=w375` (e `--project=w768`).

Lighthouse e perf não foram reexecutados.
