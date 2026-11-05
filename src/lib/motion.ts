/*
 * Constantes e funções de animação do redesign v3.
 * Os números vêm do HANDOFF (seção 4). Se o designer mudar algum valor,
 * altere aqui e todos os componentes acompanham.
 */

// ---------- Funções matemáticas pequenas ----------

/** Limita um número entre min e max (por padrão, entre 0 e 1). */
export function clamp(value: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, value));
}

/** Interpolação linear: vai de "a" até "b" conforme t (0 a 1). */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Suaviza o início e o fim de uma transição (t de 0 a 1). */
export function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/**
 * Progresso de rolagem de um elemento alto com conteúdo "sticky".
 * 0 = topo do elemento chegou no topo da tela; 1 = fim do elemento.
 * Fórmula do HANDOFF: p = clamp(-rect.top / (rect.height - vh))
 */
export function getScrollProgress(element: HTMLElement): number {
  const rect = element.getBoundingClientRect();
  const scrollableHeight = rect.height - window.innerHeight;
  if (scrollableHeight <= 0) return 0;
  return clamp(-rect.top / scrollableHeight);
}

// ---------- Geral ----------

/** Easing padrão, igual ao token --ease-smooth do CSS. */
export const EASE = "cubic-bezier(0.2, 0.7, 0.2, 1)";

/** Densidade de pixels máxima dos canvases (D9). */
export const MAX_DPR = 2;

/** Canvases ASCII redesenham a cerca de 30fps (1000ms / 30 ≈ 33ms). */
export const ASCII_FRAME_INTERVAL = 33;

/** Rampa de caracteres do mais escuro para o mais claro. */
export const ASCII_RAMP = " .,:;-=+*#%@";

// ---------- Revelação ao entrar (.rv) ----------

export const REVEAL = {
  threshold: 0.15,
  stepDelay: 80, // ms entre .d1, .d2, .d3, .d4
};

// ---------- Navbar ----------

export const NAVBAR = {
  hideAfter: 200, // px rolados antes de esconder ao descer
};

// ---------- Toast ----------

export const TOAST = {
  duration: 2200, // ms visível
};

// ---------- Contadores ----------

export const COUNTER = {
  duration: 1400,
  threshold: 0.6,
};

// ---------- Fundo de estrelas ----------

export const STARS = {
  areaPerStar: 4200, // 1 estrela a cada 4200px² de tela
  wrapScreens: 3, // as estrelas ocupam 3 alturas de tela
  parallax: 0.35, // quanto a rolagem move cada camada
  mouseShift: -12, // deslocamento em x pelo mouse (px)
  sizeBase: 0.7,
  sizeDepth: 1.9,
  haloDepth: 0.6, // estrelas mais próximas que isso ganham halo
  sparkChance: 0.02, // 2% das estrelas têm uma cruz
  color: "235, 230, 255", // r, g, b
  haloColor: "200, 185, 255",
  nearColor: "240, 236, 255",
  sparkColor: "220, 210, 255",
};

// ---------- Universe (planeta + capítulos), HANDOFF §4 ----------

export const UNIVERSE = {
  heroFadeEnd: 0.12, // headline e CTAs somem entre p 0 e 0.12
  heroShift: 60, // px que a headline sobe enquanto some
  hintFadeEnd: 0.04, // "Role para explorar" some até p 0.04
  chapterFade: 0.05, // duração do fade de entrada/saída de cada capítulo
  chapterShift: 30, // px de translateY dos capítulos
  /** Janelas [entrada, saída] de cada capítulo, em progresso. */
  chapterWindows: [
    [0.24, 0.44],
    [0.52, 0.7],
    [0.76, 0.92],
  ],
  /**
   * Trajetória do planeta: [progresso, x, y, raio].
   * x e y são relativos à tela; raio é relativo ao menor lado da tela.
   */
  path: [
    [0, 0.5, 0.9, 0.24],
    [0.18, 0.5, 0.52, 0.25],
    [0.3, 0.7, 0.5, 0.24],
    [0.44, 0.7, 0.5, 0.24],
    [0.56, 0.3, 0.5, 0.24],
    [0.68, 0.3, 0.5, 0.24],
    [0.8, 0.5, 0.42, 0.34],
    [1, 0.5, 0.42, 0.4],
  ],
  mobileRadiusScale: 1.25,
  dissolveStart: 0.88, // a partir daqui o planeta se desfaz
  warpStart: 0.9, // a partir daqui as estrelas viram "velocidade da luz"
  warpEnd: 0.995, // warp zera aqui
  warpStrength: 0.5,
};

/**
 * Intensidade do efeito "velocidade da luz" (0 a 1), compartilhada entre
 * a seção Universe (que calcula) e o fundo de estrelas (que desenha).
 * É um objeto simples para não causar re-render a cada scroll.
 */
export const warpState = { value: 0 };

/** Calcula o warp a partir do progresso da seção Universe. */
export function getWarp(progress: number): number {
  if (progress >= UNIVERSE.warpEnd) return 0;
  const t = clamp((progress - UNIVERSE.warpStart) / (1 - UNIVERSE.warpStart));
  return smoothstep(t) * UNIVERSE.warpStrength;
}

// ---------- Card holográfico ----------

export const HOLO = {
  tiltX: 14, // graus máximos de rotação no eixo X
  tiltY: 18, // graus máximos de rotação no eixo Y
};

// ---------- Player 1 ----------

export const PORTRAIT = {
  revealThreshold: 0.55, // moldura 55% visível
  revealDelay: 1100, // ms de espera antes da foto aparecer
};

export const WORDS = {
  startAt: 0.85, // a revelação começa quando o topo do texto passa de 85% da tela
  extra: 0.35, // altura extra (em telas) para terminar a revelação
};

// ---------- Timeline da experiência ----------

export const TIMELINE = {
  activeLine: 0.6, // checkpoint acende quando passa de 60% da tela
};

// ---------- Esfera de skills ----------

export const SPHERE = {
  radius: 0.42, // relativo ao menor lado do container
  baseVelX: 0.0012,
  baseVelY: 0.0035,
  dragSpeed: 0.0009,
};

// ---------- Campo ASCII do contato ----------

export const FIELD = {
  cellWidth: 11,
  cellHeight: 16,
  cursorRadius: 340,
};

// ---------- Cursor custom ----------

export const CURSOR = {
  ringFollow: 0.16, // lerp do anel seguindo o ponto
  clickParticles: 18,
  maxParticles: 260,
  trailChars: "·.:+*✦",
};

/**
 * Roda `callback` logo depois do próximo paint (PERF-PLAN A10).
 * Útil em cliques: o navegador mostra a resposta visual primeiro (INP menor)
 * e o trabalho extra (toast, partículas, área de transferência) vem depois.
 */
export function afterNextPaint(callback: () => void) {
  requestAnimationFrame(() => setTimeout(callback, 0));
}
