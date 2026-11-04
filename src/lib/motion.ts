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
