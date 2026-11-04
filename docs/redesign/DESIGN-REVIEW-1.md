# Revisão de design 1: Home v3 (f28ce72)

**Veredito do designer:** fidelidade alta em desktop, nenhum bloqueador. Tipografia idêntica ao protótipo, alturas das seções com até 42px de diferença (por causa dos textos completos de `src/data`) e console limpo. O relatório completo está em `~/Documents/franciscoentony-v3/REVISAO-f28ce72.md`.

## Decisões do designer (valem como spec)

- **D18. Quebra de títulos:** usar `text-balance` em **todos** os h1 e h2. O título do teaser do blog fica com `max-w-[22ch] text-balance`, sem `<br>`. Em 1280px, a quebra precisa cair depois da vírgula; se não cair, usar 21ch.
- **D19. "Arraste para girar."** some em reduced motion, sem texto substituto. Já aplicado em 5255740.
- **D20. Menu mobile:** overlay de altura total (`100svh`), fundo `ink` a 92% com blur de 20px e saturate de 180%, e scroll do body travado.
  - Links em Geist 600, 28px a 32px, tracking -0.03em, alinhados à esquerda e com os divisores mantidos.
  - Entrada em escada de 40ms por item (400ms, `--ease-smooth`) e saída com fade de 200ms. Sem animação em reduced motion.
  - Com o menu cobrindo a tela inteira, ele passa a ser **modal**: foco preso dentro dele e Esc fecha devolvendo o foco. Isso substitui o "fecha no focusout" da R1#3. O clique fora não se aplica mais, já que não há "fora".

## Itens para a rodada final de correções

| # | Prioridade | Item |
|---|---|---|
| DS-1 | Média | Inicialização escalonada dos canvases (TBT de 313ms contra 159ms no protótipo, com uma tarefa de 363ms em ~2,4s): estrelas e planeta logo após as fontes; retrato, thumbs e campo do contato via IntersectionObserver e `requestIdleCallback`. Junta com o I-5 da R2 |
| DS-4 | Média | Hero em 375px: abaixo de 860px, tirar o `max-width: 14ch` do h1 e usar `text-balance`, para quebrar em 3 linhas. Se ainda forem 4, mínimo de 36px no clamp abaixo de 400px |
| DS-5 | Baixa | Capítulos C1 e C2 no desktop: h2 com `max-w-[16ch]` e subtítulo com `max-w-[36ch]`, ambos com `text-balance` |
| DS-7 | Baixa | Reduced motion: espaço de cerca de 120px entre os capítulos, com C1 alinhado à esquerda e C2 à direita |
| DS-14 | Média | Teaser com menos de 3 posts: um card-convite tracejado na 3ª posição ("Mais registros no diário" + "Todos os posts ›"). A copy vai para `ui.ts` |
| DS-15 | Média | Grade de posts com 2 colunas de 640px a 859px (vale também para `/blog`) |
| DS-19 | Baixa/média | Contato abaixo de 860px: botão de e-mail numa linha e "GitHub ›" e "LinkedIn ›" centralizados juntos na linha seguinte, com gap de 20px |
| DS-21 | Média | Menu mobile conforme a D20 |

## Confirmado como correto

- Âncora para 48px abaixo da nav, o que é proposital.
- Brilho do checkpoint, Player 1, Habilidades, Projetos, Experiência e Contato no desktop.
- Os links "Ver tudo no GitHub ›" e "Todos os posts ›" abaixo do título no mobile ficaram **melhores** que o protótipo.
