# Revisão final P5 (5b53f28)

- **Revisor:** aprovado com ressalvas, sem bloqueadores. R2 resolvida, exceto I-5d.
- **Designer:** **aprovado para lançar.** Revisões anteriores aplicadas, níveis conforme a PERF-TIERS e esfera em canvas fiel.

## Rodada P5 de correções (Front-End)

| # | Origem | Prioridade | Item |
|---|---|---|---|
| I-A | Revisor | Importante | O governador só desce para Baixo quando o Universe está **abaixo** da viewport (rect.top >= innerHeight). Acima dela, aplica Baixo aos canvases mas mantém o layout (pin) até a próxima navegação, para evitar o pulo de conteúdo no Safari |
| I-B | Revisor | Importante | Cursor ocioso (speed < 0,1, anel convergido e sem partículas): não desenha nem escreve no DOM (cancela a inscrição no ticker e reinscreve no pointermove) |
| I-C | Revisor | Importante | `site.Data` → `hugo.Data` no render-image.html **e** versões fixadas no `deploy.yml` (Hugo e Bun, as mesmas usadas localmente), no lugar de `latest` |
| DS-P5a | Designer | Média | Esfera: 60fps (ticker) no Alto, 30 no Médio, parada no Baixo |
| DS-P5b | Designer | Média | Campo ASCII do contato a **15fps no Médio** (só ele; planeta, retrato e thumbs continuam a 20) |
| DS-P5c | Designer | Baixa | Card do `/blog` sem capa: sem altura mínima, com a data logo abaixo das tags |
| S-A | Revisor | Sugestão | Contrapressão no postMessage do worker (só envia depois do 'drawn' ou descarta o pendente), e o planeta para de enviar com progress >= 1 depois do clear |
| S-B | Revisor | Sugestão | Documentar ou proteger no hook a exigência de remontar por key quando usa o worker |
| S-C | Revisor | Sugestão | Esfera: rect em cache (ResizeObserver + scroll), sem getBoundingClientRect por quadro |
| S-D | Revisor | Sugestão | `inert` em main e footer com o menu modal aberto |
| S-E | Revisor | Sugestão | `.PlainText` no alt do render hook |
