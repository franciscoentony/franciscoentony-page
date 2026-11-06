# P0: baseline de desempenho em 2dc6ce8

**Data:** 05/11/2026 · **QA** · **Alvo:** `2dc6ce8`, HEAD do `origin/redesign`. O código é idêntico ao `6368b6b` (rodada final completa + D7); o 2dc6ce8 só muda o `PERF-PLAN.md`. Já inclui o BL1-min (8332dea) e as fotos comprimidas (4b4af83).
**Como:** build numa worktree destacada fora do repo (removida no fim) e `vite preview --host 127.0.0.1 --port 4190`. Comando: `cd qa && QA_PERF=1 QA_BASE_URL=http://127.0.0.1:4190 bun run test:perf`, depois `bun run perf-report`.
**Perfis:** `perf-mobile` = 412×915, DPR 2.75, toque, **CPU 6×** (CDP `Emulation.setCPUThrottlingRate`) · `perf-desktop` = 1440×900, sem throttling.

> **Confiabilidade.** A máquina estava compartilhada com outras sessões (carga de 5 a 13 em 8 núcleos). Cada medição grava a carga e uma **calibração**: um loop fixo de JS medido no Chrome antes do throttling. O run mobile oficial é o 2º, com calibração de 84 ms (desktop: 82 ms), ou seja, máquina livre. O 1º run mobile (calibração 105 ms, carga 13) aparece só para mostrar a variância. Os números de página parada se repetem bem entre os runs; FPS e quadros longos no scroll variam mais (§3).

## 1. Resumo contra as metas (PERF-PLAN §2)

| Meta | perf-mobile (CPU 6×) | perf-desktop | Lighthouse mobile |
|---|---|---|---|
| Lighthouse Perf ≥ 90 nas 3 rotas | — | — | Home **100** · Blog **100** · Post **67** ❌ |
| TBT < 200 ms | ✅ 13 ms | ✅ 0 ms | ✅ 0 ms (as 3 rotas) |
| Nenhuma long task > 50 ms depois do carregamento | ✅ | ✅ | — |
| Main thread parada < 10% em toda seção | ❌ **7 de 7** (19–91%) | ❌ 6 de 7 (6–25%) | — |
| Scroll ≥ 30 fps sem quadro > 50 ms | ❌ 24 fps, 32 quadros > 50 ms (maior 917 ms) | ❌ 47 fps, 15 quadros > 50 ms (maior 117 ms) | — |
| INP < 200 ms | ❌ e-mail 264 ms · ✅ menu 128 ms | ❌ e-mail 200 ms (no limite) | — |
| DF-15 (revelação do teaser) | ✅ 98–177 ms | ✅ 52–53 ms | — |

**Leitura:** o carregamento está resolvido (o BL1-min funcionou: TBT de 550 para 0–13 ms, e Lighthouse mobile da Home de 85 para 100). O problema agora é **todo de regime**: com a página parada, a main thread fica ocupada de 19% a 91% no mobile 6×, e o scroll trava. Isso confirma o diagnóstico do PERF-PLAN §1. O Lighthouse não pega esse problema, porque mede só o carregamento. Por isso os testes P0 existem.

## 2. Página parada: % da main thread por seção (3 s parada em cada)

| Seção | Mobile 6×: main thread | Mobile: script | Mobile: estilo+layout | Desktop: main thread | Desktop: script | Causa provável (PERF-PLAN) |
|---|---|---|---|---|---|---|
| top (Universe) | **56%** | 272 ms/s | 23 ms/s | 15.9% | 91 ms/s | planeta ASCII + estrelas (A1, A2) |
| sobre | **91%** | 547 ms/s | 23 ms/s | 23.2% | 119 ms/s | retrato ASCII com `fillText` por caractere (A1) |
| habilidades | **86%** | 130 ms/s | **342 ms/s** | 19.6% | 31 ms/s (75 de layout) | esfera: 22 spans com `transform`/`opacity`/`zIndex`/`color` a 60fps (A4) |
| projetos | **48%** | 250 ms/s | 25 ms/s | 24.8% | 141 ms/s | 4 thumbs ASCII (A1) |
| experiência | 19% | 25 ms/s | 35 ms/s | 6.4% ✅ | 19 ms/s | só o custo fixo |
| blog | 20% | 30 ms/s | 39 ms/s | 22% | 110 ms/s | custo fixo; no desktop provavelmente o campo do Contato logo abaixo, dentro da margem do IO |
| contato | **65%** | 363 ms/s | 29 ms/s | 22.2% | 120 ms/s | campo ASCII (A1) |

- **Custo fixo:** Experiência e Blog, sem canvas próprio, ainda ficam em ~20% no mobile. Esse é o piso das camadas fixas: Starfield a 30fps, Grain animado, navbar com blur e os loops rAF que continuam agendando quadros (A2, A5). Mesmo com A1 e A4 feitos, a meta de < 10% exige A5.
- **Variância** (1º run mobile, máquina carregada): 55 / 95 / 97 / 65 / 15 / 17 / 67%. Mesma ordem de grandeza e mesmo ranking.

## 3. Scroll contínuo da Home inteira (gesto real do Chrome, 1.500 px/s)

| Perfil | FPS médio | Quadros > 50 ms | Maior quadro | p95 | Long tasks |
|---|---|---|---|---|---|
| Mobile 6× (oficial) | **24** ❌ | 32 de 214 | **917 ms** | 83 ms | 5 (maior 132 ms) |
| Mobile 6× (1º run, carga 13) | 34 | 32 de 289 | 250 ms | 67 ms | — |
| Desktop | 47 | 15 de 326 | 117 ms | 50 ms | 1 |

Hipótese, ainda sem trace: o quadro de 917 ms seria a inicialização de um canvas (retrato, thumbs, campo) disparada pelo IO/`requestIdleCallback` no meio do scroll. Confirmar com um trace na P2 (A3).

## 4. Carregamento e INP

| | Mobile 6× | Desktop |
|---|---|---|
| FCP | 920 ms | 380 ms |
| TBT aprox. (FCP → load+7s) | 13 ms | 0 ms |
| Long tasks no carregamento | 4 (92, 103, 64 e 63 ms; todas antes de 1,2 s) | 0 |
| Long tasks > 50 ms depois de load+3s | nenhuma ✅ | nenhuma ✅ |
| INP: botão de e-mail | **264 ms** ❌ | **200 ms** ❌ (meta é < 200) |
| INP: abrir menu mobile | 128 ms ✅ | — |

Não perfilei o handler. O clique no e-mail dispara `navigator.clipboard.writeText` + toast (e, no desktop, a explosão de partículas do cursor), e acontece com o campo ASCII do Contato animando ao lado (65% da main thread no mobile). O provável é que o atraso venha da disputa com os loops de canvas, e não do handler; o ticker único (A2) e o atlas (A1) devem resolver. Reavaliar depois deles.

## 5. Lighthouse mobile (mediana de 3)

| Rota | Perf | A11y | BP | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|
| Home | **100** | 100 | 100 | 100 | 0.8 s | 0 | 0 ms |
| Blog | **100** | 100 | 100 | 100 | 0.8 s | 0 | 0 ms |
| Post | **67** ❌ | 100 | 100 | 100 | **15.5 s** | **0.184** | 0 ms |

- **Post:** o LCP é o `drone.jpg`, com **1,4 MB** mesmo comprimido (página com 3,8 MB, contra 19,5 MB antes). O CLS de 0,184 vem da imagem sem dimensões, que empurra o footer: é o **A9** do plano.
- Sugestão para o Post: `width`/`height` (ou `aspect-ratio`) nas imagens do corpo; a capa/1ª imagem com `fetchpriority="high"` e ≤ 200 KB em 412px (srcset); as demais com `loading="lazy"`.
- Comparação com a rodada R1 (f28ce72): Home mobile 85 → **100**, TBT 550 → **0 ms**; Post 79 → 67, LCP 2,9 → 15,5 s. Na R1, o elemento de LCP era o resumo em texto (`<p>`); agora é a foto `drone.jpg`. O layout do post da Fase 4 (DF-4/5/6/7) trouxe a imagem para dentro da primeira tela, então o LCP passou a depender dela.

## 6. DF-15: revelação do teaser ao pular para #blog

| Perfil / cenário | Seção chegou | Revelação começou | Completa (na tela) | Atraso após chegar |
|---|---|---|---|---|
| Mobile 6×: pulo na página (topo → #blog) | 56 ms | 233 ms | 1.115 ms | **177 ms** |
| Mobile 6×: carga direta de /#blog | 2.241 ms | 2.339 ms | 3.257 ms | **98 ms** |
| Desktop: pulo na página | 20 ms | 73 ms | 1.075 ms | **53 ms** |
| Desktop: carga direta | 1.095 ms | 1.147 ms | 2.243 ms | **52 ms** |

**Veredito: DF-15 não se reproduz no HEAD.** A revelação começa entre 52 e 177 ms depois de a seção chegar (meta do teste: ≤ 250 ms), e o tempo até completar (~1 s) é a própria transição de 1 s + 80 ms por item do HANDOFF. Na carga direta de `/#blog` com CPU 6×, a seção só chega em ~2,2 s por causa do carregamento da página, e não por atraso da revelação. Era o mesmo caso do BL1, corrigido pelo 8332dea. Recomendo fechar; o teste fica como guarda.

## 7. O que foi criado e alterado em `qa/` (para o seu commit)

| Arquivo | O quê |
|---|---|
| `tests/perf.spec.ts` (novo) | PERF-01 carregamento (TBT, long tasks pós-load) · PERF-02 página parada por seção (CDP `Performance.getMetrics` TaskDuration/ScriptDuration + long tasks) · PERF-03 scroll da Home inteira com `Input.synthesizeScrollGesture` (touch no mobile) · PERF-04 INP via Event Timing (e-mail e menu mobile) · DF-15. Grava JSON por teste em `<QA_OUT>/perf/<projeto>/` com carga e calibração |
| `playwright.config.ts` | Projetos `perf-mobile` e `perf-desktop`, ativados só com `QA_PERF=1`; os projetos `w*` ignoram `perf.spec.ts` |
| `scripts/perf-report.mjs` (novo) | Tabela markdown por seção. `QA_PERF_BASE=<pasta>` acrescenta a coluna "antes" para comparar cada otimização da P2 |
| `scripts/lighthouse.mjs` | `QA_LH_PRESETS=mobile` para rodar só o perfil mobile |
| `qa.config.mjs` | **Correção do bug relatado pelo Front-End:** o preview local sobe com `--host 127.0.0.1` e `LOCAL_URL` = `http://127.0.0.1:<porta>`. Antes, o vite escutava em `[::1]` ou `127.0.0.1` conforme a resolução de `localhost`, e a espera travava. Validado: com `--host 127.0.0.1`, o `lsof` mostra IPv4 |
| `package.json` | `test:perf` e `perf-report` |

Saídas locais (D16): `qa/reports/perf-2dc6ce8/` (1º run + Lighthouse), `qa/reports/perf-2dc6ce8-m2/` (2º run mobile) e `qa/reports/perf-2dc6ce8-final/perf/PERF-REPORT.md` (tabela consolidada).
