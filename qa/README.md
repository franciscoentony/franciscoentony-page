# QA: franciscoentony.com

Testes automatizados do redesign v3: rotas, responsividade, console, acessibilidade (axe-core), teclado, `prefers-reduced-motion`, performance dos canvases e Lighthouse.

- **Plano de testes (casos e critérios):** [`PLANO-DE-TESTES.md`](PLANO-DE-TESTES.md)
- **Baseline de produção (o "antes"):** [`baseline/RELATORIO.md`](baseline/RELATORIO.md)

Esta pasta é isolada: tem `package.json` próprio e **não altera** o `package.json` da raiz nem `src/`. As dependências de teste (Playwright, axe-core, Lighthouse) ficam só aqui e não entram no bundle do site (D4 não se aplica).

## Pré-requisitos

- Bun e Node ≥ 20
- Google Chrome instalado (os testes usam `channel: "chrome"`). Sem Chrome: `bunx playwright install chromium` e rode com `QA_BROWSER=chromium`.
- Para o modo local: `hugo` no PATH (o `bun run build` da raiz roda o Hugo)

```bash
cd qa
bun install
```

## Rodando

| Comando | O que faz |
|---|---|
| `bun run test` | Suíte completa contra o **build local**: executa `bun run build && bun run preview` na raiz e testa `http://localhost:4173` |
| `QA_SKIP_BUILD=1 bun run test` | Igual, mas só serve o `dist/` que já existe (mais rápido, não roda o Hugo) |
| `QA_BASE_URL=https://... bun run test` | Contra qualquer URL (preview, staging, produção) |
| `bun run test:prod` | Atalho para produção |
| `bun run test:dod` | Só os critérios do DoD (`@dod`) |
| `bun run test:redesign` | Só os comportamentos específicos do HANDOFF (`@redesign`) |
| `bun run lighthouse` | Lighthouse (mobile + desktop) nas 3 rotas. Sai com código 1 se Performance ou A11y < 90 |
| `bun run summary` | Gera `reports/playwright-summary.md` a partir do último run |
| `bun run report` | Abre o relatório HTML do Playwright |
| `bun run baseline` | Refaz o baseline de produção em `baseline/` (Playwright + resumo + Lighthouse) |

Filtros úteis do Playwright:

```bash
bunx playwright test --project=w375            # só uma largura (w375, w768, w1280, w1440)
bunx playwright test tests/a11y.spec.ts        # só um arquivo
bunx playwright test -g "RM-03"                # só um caso
```

### Variáveis de ambiente

| Variável | Padrão | Uso |
|---|---|---|
| `QA_BASE_URL` | *(vazio = local)* | URL alvo, sem barra final |
| `QA_PORT` | `4173` | Porta do `vite preview` local |
| `QA_SKIP_BUILD` | — | `1` pula o build no modo local |
| `QA_OUT` | `reports` | Pasta de saída (o baseline usa `baseline`) |
| `QA_BROWSER` | `chrome` | `chromium` para o navegador do Playwright |
| `QA_SLUG` | *(post mais recente)* | Slug usado na rota `/blog/:slug` |
| `QA_LH_MIN` | `90` | Nota mínima no Lighthouse |
| `QA_LH_RUNS` | `1` | Execuções por página (usa a mediana; use 3 para decidir aprovação) |

## Saídas

```
reports/                     (ignorado no git)
  html/                      relatório do Playwright (traces das falhas)
  results.json               resultado bruto
  playwright-summary.md      resumo legível das falhas
  screenshots/w<largura>/    <rota>-viewport.png e <rota>-full.png
  lighthouse/                <rota>-<perfil>.html/.json + summary.md/json
baseline/                    mesma estrutura, contra produção (versionado)
```

## O que cada arquivo testa

| Arquivo | Casos |
|---|---|
| `tests/routes.spec.ts` | RT-01..07: acesso direto, 404 de slug, `404.html`, navegação, links, imagens/alt, overflow horizontal, console/rede, screenshots |
| `tests/a11y.spec.ts` | A11Y-01 axe-core WCAG 2.1 AA · A11Y-02 texto final em muted `#48484D` · A11Y-03 semântica |
| `tests/keyboard.spec.ts` | KB-01 ordem de Tab e foco visível (+ padrão D8 lavanda) · KB-02 âncoras · KB-03 carrossel |
| `tests/motion.spec.ts` | RM-01..05 reduced-motion · PF-01 canvas pausado fora da viewport · PF-02 DPR ≤ 2 · PF-03 FPS no scroll |
| `scripts/lighthouse.mjs` | PF-LH: Performance, Acessibilidade, Best Practices e SEO |

As verificações usam `expect.soft`: um caso mostra **todas** as falhas de uma vez, e não só a primeira.

## Como ler os resultados

- **Pulado (skipped):** o caso não se aplica àquela largura, ou o recurso ainda não existe (ex.: canvas e carrossel no site atual). Não é falha.
- **Canvases (RM-03/PF-01):** a suíte conta as chamadas de desenho por canvas (instrumentando `CanvasRenderingContext2D`). Se o contador cresce, o canvas está animando.
- **PF-03 (FPS):** headless sem GPU é pessimista. Use os números para comparar runs; confirme em máquina real antes de reprovar.
- **Rede:** o Lighthouse checa a URL antes de começar e sai com código 2 se ela estiver inacessível. No Playwright, uma queda de rede aparece como dezenas de falhas `ERR_NAME_NOT_RESOLVED`/`ENOTFOUND`: nesse caso, descarte o run e rode de novo.
- **RM-01:** registra `animationstart`/`transitionrun` desde o primeiro frame, então pega animações curtas que já terminaram antes da asserção.
- **Status 404 em produção:** o GitHub Pages serve rotas SPA pelo `404.html` com status HTTP 404. O teste registra esse status como anotação e não reprova a rota por isso. O Lighthouse, porém, **não audita** páginas com status 404 (ver achado B1 em `baseline/RELATORIO.md`).
