# Plano de desempenho: o site rodando liso até em aparelho fraco

**Autor:** Tech Lead. **Data:** 04/11/2026. **Status:** proposta, aguardando o OK do Entony.

## 1. Diagnóstico (medido pelo Revisor e pelo designer em f28ce72)

| Sintoma | Medição | Causa no código |
|---|---|---|
| Main thread ocupada com a página **parada** | até ~40% num Mac (Contato: 223ms de script/s); com CPU 4× o topo cai para 47fps e aparecem long tasks de 97ms | ASCII desenhado com `fillText` caractere por caractere, montando uma string `hsla()` nova a cada um (`Portrait`, `ProjectThumb`, `ContactField`; o `planet.ts` já quantiza) |
| Travada no carregamento | TBT ~313ms, com uma tarefa de 363ms em ~2,4s (protótipo: ~159ms) | Todos os canvases iniciam juntos no `document.fonts.ready` (`useCanvasAnimation.ts`) |
| Esfera pesada | 391ms de tarefas/s na seção Habilidades | 60fps escrevendo `transform`, `opacity`, `zIndex` e `color` em 22 spans (`SkillsSphere.tsx:63-66`) |
| Custo fixo em qualquer ponto da página | — | Starfield em tela cheia redesenhado a 30fps; **Grain** com filtro SVG `feTurbulence` animado (repinta a tela inteira); **navbar com `backdrop-blur`** sobre um canvas animado (o blur é recalculado a cada quadro) |
| Overhead de agendamento | ~10 loops rAF | Cada canvas, a esfera, os contadores e o cursor têm o próprio `requestAnimationFrame`. Fora da tela, o loop **continua agendando** e só pula o desenho |
| Re-render a cada scroll | — | `Experience.tsx` faz `setState` a cada frame de scroll em qualquer posição da página |

**Confirmado pelo QA (Lighthouse mobile, f28ce72):** Performance da Home **85** (meta ≥ 90), **TBT 550ms** (produção v2: 30ms) e long tasks de até 406ms entre 2,0s e 2,9s, logo depois do LCP. Uma causa adicional: `useCanvasAnimation` começa com `isVisible = true`, então os 8 canvases desenham no 1º quadro, inclusive os que estão fora da tela. O lado bom: o peso da Home caiu de 4.768 KiB para 298 KiB, o LCP caiu de 2,3s para 1,6s no celular, e o desktop está em 99. O problema é **só CPU**, não rede.

O "aparelho fraco" é o caso que mais pesa. Em Android de entrada (4 núcleos lentos, GPU fraca, 2–3 GB de RAM), os mesmos números ficam 4–6× piores.

## 2. Metas (viram critério de aceite e teste automatizado)

Perfil de referência: **Lighthouse mobile** (Moto G Power simulado) e **Chrome com CPU 6× mais lenta** em 412px.

| Métrica | Meta |
|---|---|
| Lighthouse mobile, Performance | ≥ 90 nas 3 rotas |
| TBT (carregamento) | < 200ms |
| Long tasks depois do carregamento | nenhuma > 50ms |
| Main thread com a página parada | < 10% em qualquer seção |
| FPS no scroll com CPU 6× | ≥ 30 estável, sem quadro > 50ms |
| INP | < 200ms |
| Aparelho real | Android de entrada (ex.: Galaxy A0x/A1x) rolando a Home inteira sem travar |

## 3. Estratégia: duas frentes

**A. Deixar tudo mais barato** (beneficia todo mundo) e **B. Adaptar ao aparelho** (garante o piso nos fracos). Só A não basta para um Android de entrada, e só B esconde código ineficiente. Por isso as duas.

### Frente A: otimizações (sem mudar o visual)

**A1. Atlas de glifos para o ASCII.** É o maior ganho.
- Pré-renderizar uma vez os caracteres da rampa (`" .,:;-=+*#%@"`) em um canvas fora da tela, em ~8 níveis de brilho × poucas faixas de cor.
- Cada célula passa a ser um `drawImage` do atlas, em vez de `fillStyle` + `fillText`.
- Esperado: de 5× a 10× mais rápido por quadro.
- Implementar num helper único `drawAsciiGrid` (resolve o S-1 da R2), usado pelo planeta, pelo retrato, pelos thumbs e pelo campo do contato.

**A2. Ticker único.**
- Um só `requestAnimationFrame` global (`src/lib/ticker.ts`) chama os assinantes visíveis.
- Fora da tela, o canvas **cancela a inscrição**, sem continuar agendando quadros.
- Com a aba oculta, para tudo.
- O cursor e os contadores entram no mesmo ticker.

**A3. Inicialização escalonada** (DS-1).
- Estrelas e planeta começam depois das fontes.
- Retrato, thumbs, esfera e campo do contato só iniciam quando chegam a ~1 tela de distância (IntersectionObserver) **e** em `requestIdleCallback`.
- Divisão de código: `React.lazy` para Skills, Projects e Contact. Diminui o JS inicial.

**A4. Esfera.**
- 30fps no ticker.
- `zIndex` e `color` só mudam quando o item troca de faixa.
- Só `transform` e `opacity` a cada quadro.

**A5. Camadas fixas.**
- **Grain:** trocar o SVG animado por um PNG de ruído pequeno (128px, cerca de 5 KB) com animação **só de `transform`**, que roda no compositor sem repintar.
- **Navbar:** blur só quando ela está sobre conteúdo. No topo, sobre o Universe, ela é quase transparente e o blur não é necessário.
- **Cursor:** remover o `backdrop-blur` do anel.

**A6. Scroll sem re-render.** Um único listener passivo de scroll, que escreve via `ref.style` e CSS variables. Fim do `setState` por frame na Experience (S-3) e na WordReveal.

**A7. Seções fora da tela.** `content-visibility: auto` com `contain-intrinsic-size` nas seções abaixo da dobra.

**A8. Planeta e estrelas fora da main thread (opcional, depois de A1–A7).**
- `OffscreenCanvas` + Web Worker, com fallback automático na main thread.
- Só vale se as medições depois de A1–A7 ainda não baterem as metas.

### Frente B: qualidade adaptativa

**B1. Três níveis de qualidade**, decididos no carregamento e expostos num `QualityProvider`:

| Nível | Quando | O que muda |
|---|---|---|
| **Alto** | Desktop e celulares bons | Experiência completa (com A1–A7) |
| **Médio** | `hardwareConcurrency ≤ 4`, `deviceMemory ≤ 4`, tela de toque pequena ou queda de FPS | ASCII a 20fps com células maiores (menos caracteres); cerca de 50% menos estrelas, sem halo e sem cruz; grain parado; navbar sem blur (fundo sólido a 92%); sem warp |
| **Baixo** | `deviceMemory ≤ 2`, `saveData` ligado, ou FPS ruim no nível Médio | **Igual ao reduced motion que já existe**: quadros estáticos, Universe sem pin, sem cursor custom. Não exige design novo e já foi revisado e aprovado |

**B2. Governador de FPS em tempo real.**
- O ticker mede a duração dos quadros.
- Se a média dos últimos 2s passar de 40ms, desce um nível e não sobe de novo na mesma visita.
- Protege aparelhos que a detecção inicial classificou errado.

**B3. Reduced motion continua mandando.** Se o usuário pediu menos movimento, é nível Baixo sempre.

## 4. Execução

O plano começa **depois** da rodada final de correções em andamento. Os itens I-5 (R2) e DS-1 (designer) **saem daquela rodada e passam para este plano**, que é mais amplo.

| Etapa | Responsável | Entrega | Paralelo? |
|---|---|---|---|
| P0. Medição e testes de orçamento | QA | Testes em `qa/` com CPU 6×: long tasks, FPS no scroll, % da main thread parada por seção, TBT. Baseline do `ed18c27`. As metas da §2 viram falha de teste | Pode começar **já** |
| P1. Níveis visuais | Designer | Validar o nível Médio (célula maior, menos estrelas, navbar sem blur) e confirmar que o nível Baixo = reduced motion | Pode começar **já** |
| P2. Frente A (A1→A7) | Front-End | Um commit por item, cada um com o antes/depois do teste P0 | Depois da rodada final |
| P3. Frente B (B1–B3) | Front-End | `QualityProvider` + governador | Depois de P2 |
| P4. Medição final | QA | Suíte completa + Lighthouse mobile + teste em aparelho real | — |
| P5. Revisão | Revisor + Designer | Código (vazamentos, ticker, fallback do worker) e visual dos 3 níveis | — |
| (A8) | Front-End | Só se P4 não bater as metas | Condicional |

**Ordem dentro de P2, por ganho:** A1 (atlas) → A3 (inicialização) → A2 (ticker) → A5 (camadas fixas) → A4 (esfera) → A6 → A7.

**Riscos e cuidados**
- O atlas de glifos pode mudar levemente a aparência do ASCII (antialiasing). O designer compara com o protótipo em P5.
- `deviceMemory` e `hardwareConcurrency` não existem no Safari. Lá vale o governador de FPS (B2) mais o tamanho de tela.
- Nada disso altera o conteúdo nem o design aprovado no nível Alto.

## 5. Decisões pedidas ao Entony

1. Aprovar o plano e a regra de que **performance é critério de merge**: o redesign só vai para a `main` quando as metas da §2 passarem.
2. Botão manual de "modo leve" (por exemplo, no footer)? **Recomendação: não.** A detecção automática + o reduced motion do sistema cobrem os casos, e o botão é mais copy e UI para manter.
3. Há um Android de entrada disponível para o teste real (P4)? Se não houver, ficamos com a emulação e o Lighthouse.
