# Revisão final antes do PR para a main (589a1dd..59157bf)

Revisor, 06/11/2026. Só código. Feita em worktree destacada em 59157bf.

## Veredito: APROVADO COM RESSALVAS

Não há bloqueador. Os 7 itens importantes abaixo devem entrar numa rodada curta de correção antes do PR. Todos são pontuais, com correção local.

## O que foi verificado

- `bun run lint` e `bun run build` passaram. As rotas estáticas foram geradas em `dist/blog/*` e `dist/projetos/{connect,petca,franciscoentony-page,fullstack-filmes}`, mais o `sitemap.xml`.
- **Dados:** os ajustes do Entony (21c877b) estão preservados: idade automática, Natal RN, eyebrow "Engenheiro de Software", raridade e o projeto connect. No `projects.ts` (d28ff82) não há nada inventado. Os períodos batem com as datas de criação e do último push no GitHub (connect: ago–out 2026; petca: jun–jul 2026; fullstack-filmes: mar 2026; page: dez 2025). A tagline e o "Sobre o projeto" do connect são literais do README. A ficha técnica do connect e do fullstack-filmes bate com o README, e o `demoUrl` do connect é o homepage do repositório.
- **Navegação sem hash** (Playwright, 1280 e 375):
  - O link antigo `/#projetos` funciona e não apaga o key/idx do React Router.
  - Os links de seção vindos de outra página funcionam, inclusive com o Universe de 520vh.
  - Voltar e Avançar com posição salva funcionam, e o reduced motion faz o pulo instantâneo.
  - O foco vai para a seção, e há um único h1 por página.
  - Menu mobile: o foco fica preso, Esc fecha e devolve o foco, e o `inert` e o `overflow` são restaurados.
- **Vazamentos ao trocar de rota:** nenhum. O worker é terminado, os observers são desconectados e o ticker para. O `heroObjectsLink` é por instância, o `warpState` volta a 0 e o `smoothing.dispose()` é chamado.
- **PERF-TIERS e reduced motion:** no Baixo e em RM o quadro fica estático, sem áreas de pegar e sem cursor. Em telas de toque o cursor também não existe. O rastro tem 26 posições no Alto e 14 no Médio, como pede a SPEC. O fallback sem worker roda a mesma classe `HeroObjects` na página.
- **"Cara de IA":** as páginas de Projeto e Post seguem a D25 (sem cards de borda, rótulos em texto comum, foto como protagonista). Na Home, todos os títulos de seção seguem a fórmula "X. Y." em dois tons ("Player 1.", "Inventário.", "Campanha.", "Diário de bordo.", "Continue?"). É copy aprovada, então não bloqueia, mas fica a nota para o Entony decidir.

## Bloqueadores

Nenhum.

## Importantes

| # | Onde | Problema | Correção |
|---|---|---|---|
| I-1 | `src/components/ScrollToHash.tsx:84-85` (com 44-52) | Num Voltar (POP) sem posição salva, o `state.section` é ignorado. Sem o hash na URL (59157bf), isso virou regressão. Cenário reproduzido: na local nav, "Projetos" leva a `/` com o state; abrir um projeto, recarregar a página e clicar em Voltar faz a Home abrir em y=1661, com o scroll que sobrou do projeto, nem na seção nem no topo | Num POP sem `savedY`, usar `location.state?.section` como fallback e, sem ele, ir ao topo. O "não mexe" só deve valer para o carregamento inicial (`location.key === "default"`) |
| I-2 | `src/components/Navbar.tsx:383-420` | A folha do menu tem `role="dialog" aria-modal="true"`, mas o botão de fechar fica fora dela, no `<header>`. Com VoiceOver no iOS ou TalkBack, que restringem a navegação ao diálogo, não há como fechar o menu sem escolher um link. Pelo teclado está ok | Pôr um botão "Fechar menu" dentro do diálogo, ou tirar o `aria-modal` e confiar no `inert`, que já é aplicado em main, footer e local nav. Não testado com leitor de tela real |
| I-3 | `src/workers/canvasWorker.ts:110-115` e `src/hooks/useCanvasAnimation.ts:202-220, 318-320` | O `drawn` só é enviado se `drawFrame` terminar sem erro. Uma exceção no worker (o `onmessage` é async e o erro vira rejeição não tratada, sem `onerror`) deixa o `workerBusy` em `true` para sempre: o planeta e os objetos do hero congelam e as áreas de pegar param | `try { objects = drawFrame(...) } finally { postMessage({ type: "drawn", objects }) }`. Opcionalmente, um timeout na página que libere o `workerBusy` |
| I-4 | `src/lib/mediaLoader.ts:52-84` | Uma imagem que já falhou antes de o efeito rodar (`complete && naturalWidth === 0`, como um 404 em cache ou HTML injetado no post) não dispara mais `load` nem `error`. O skeleton fica em `loading`, com a varredura `infinite` e a imagem em `opacity: 0`, para sempre (viola o estado `error` da SPEC-SKELETON) | Depois do teste de cache, se `img.complete && img.naturalWidth === 0 && img.getAttribute("src")`, chamar `handleError()`. Repetir a mesma checagem no `onVisible` |
| I-5 | `scripts/static-routes.mjs:152` | **Warning no console** em todo `/blog/:slug` (o DoD exige zero): "preload … not used because the request credentials mode does not match". O tile é usado como `mask` no CSS, e máscaras CSS são buscadas em modo CORS | Usar `<link rel="preload" as="image" href="/ui/skeleton-ascii.webp" crossorigin="anonymous" />`. Se o segundo warning ("not used within a few seconds") continuar quando as fotos já estão em cache, tirar o preload |
| I-6 | `src/lib/heroObjects.ts:363-398, 456` e `src/components/universe/HeroObjects.tsx:214` | O objeto é arremessado mesmo depois de o ponteiro parar. O `pointerVelocity` só é atualizado no `move`, e o `release` não leva tempo. Cenário: arrasto rápido, seguro parado por cerca de 1 s e solto; o objeto sai voando a até 30 px por quadro. O objeto segurado também colide como se ainda estivesse em movimento | Mandar `t: performance.now()` no `release` e zerar a velocidade quando `t - lastPointer.t` passar de cerca de 60 ms, no `release` e no `step` do objeto segurado |
| I-7 | `src/components/layers/CustomCursor.tsx:203-205, 254-269` | O cursor foguete dorme no estado "pressionado". Se a pessoa clicar e segurar mais de cerca de 0,5 s, o cursor entra em ociosidade com a escala de pressionado, e nada o acorda no `pointerup`. O mesmo acontece quando o modo muda por `pointerover` sem mexer o mouse | Chamar o `wake` no `handleUp` e no `handleOver`, ou incluir `pressed.current` na condição de ociosidade |

## Notas (não bloqueiam)

- `src/content/ui.ts:68`: `age = getFullYear() - 2006` fica 1 ano acima do certo entre 1º de janeiro e o aniversário. Corrigir exige a data de nascimento, que é dado do Entony.
- Os títulos "X. Y." da Home ficam para decisão do Entony (ver acima).
