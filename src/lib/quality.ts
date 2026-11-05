/*
 * Níveis de qualidade (PERF-PLAN Frente B + PERF-TIERS, spec do designer).
 *
 * Dois sinais separados:
 * - quality: "alto" | "medio" | "baixo" → quanto custa desenhar
 *   (canvases, estrelas, blur, grain...);
 * - motion: "full" | "reduced" → se o usuário pediu menos movimento
 *   (transições CSS, revelações, contadores...).
 * Reduced motion força quality = "baixo" E motion = "reduced".
 * O nível Baixo sozinho mantém as transições CSS baratas.
 */

export type Quality = "alto" | "medio" | "baixo";
export type Motion = "full" | "reduced";

export interface QualitySettings {
  /** Intervalo entre quadros dos canvases ASCII (ms). */
  asciiInterval: number;
  /** Intervalo entre quadros do campo ASCII do contato (ms, DS-P5b). */
  fieldInterval: number;
  /** Intervalo entre quadros da esfera de skills (ms; 0 = todo quadro, DS-P5a). */
  sphereInterval: number;
  /** Fator do tamanho das células ASCII (planeta, retrato, thumbs). */
  cellScale: number;
  /** Fator das células do campo do contato (1.2 no Médio: 1.3 engrossava demais). */
  fieldCellScale: number;
  /** Faixas de matiz do atlas de glifos. */
  hueBands: number;
  /** 1 estrela a cada N px² de tela. */
  areaPerStar: number;
  /** Halo e cruz nas estrelas. */
  starDetails: boolean;
  /** Efeito "velocidade da luz" no fim do Universe. */
  warp: boolean;
  /** Grain animado. */
  grainAnimated: boolean;
  /** Blur + saturate na navbar (fora do Universe). */
  navbarBlur: boolean;
  /** Foil holográfico com mix-blend-mode (no Médio: camada simples a 0.18). */
  foilBlend: boolean;
  /** Rastro do cursor: máximo de partículas e quantas nascem por quadro. */
  cursorMaxParticles: number;
  cursorParticlesPerFrame: number;
}

/** Parâmetros de cada nível (tabela da PERF-TIERS §1). */
export const QUALITY_SETTINGS: Record<Quality, QualitySettings> = {
  alto: {
    asciiInterval: 33, // 30fps
    fieldInterval: 33,
    sphereInterval: 0, // 60fps (ticker)
    cellScale: 1,
    fieldCellScale: 1,
    hueBands: 6,
    areaPerStar: 4200,
    starDetails: true,
    warp: true,
    grainAnimated: true,
    navbarBlur: true,
    foilBlend: true,
    cursorMaxParticles: 260,
    cursorParticlesPerFrame: 4,
  },
  medio: {
    asciiInterval: 50, // 20fps
    fieldInterval: 66, // 15fps: só o campo do contato
    sphereInterval: 33, // 30fps
    cellScale: 1.3,
    fieldCellScale: 1.2,
    hueBands: 4,
    areaPerStar: 8400, // -50%
    starDetails: false,
    warp: false,
    grainAnimated: false,
    navbarBlur: false,
    foilBlend: false,
    cursorMaxParticles: 120,
    cursorParticlesPerFrame: 2,
  },
  // Baixo = Médio, mas com os canvases em quadro estático (isso é decidido
  // por quem usa: useCanvasAnimation, Universe, esfera, cursor...)
  baixo: {
    asciiInterval: 50,
    fieldInterval: 66,
    sphereInterval: 33, // (no Baixo a esfera fica parada)
    cellScale: 1.3,
    fieldCellScale: 1.2,
    hueBands: 4,
    areaPerStar: 8400,
    starDetails: false,
    warp: false,
    grainAnimated: false,
    navbarBlur: false,
    foilBlend: false,
    cursorMaxParticles: 0,
    cursorParticlesPerFrame: 0,
  },
};

/** Ordem dos níveis, do melhor para o mais leve. */
const LEVELS: Quality[] = ["alto", "medio", "baixo"];

/** Um nível abaixo (ou o mesmo, se já for o mais leve). */
export function lowerQuality(quality: Quality): Quality {
  return LEVELS[Math.min(LEVELS.indexOf(quality) + 1, LEVELS.length - 1)];
}

/**
 * Nível inicial, decidido no carregamento (PERF-PLAN B1):
 * - Baixo: pouca memória (≤ 2 GB) ou economia de dados ligada;
 * - Médio: ≤ 4 núcleos, ≤ 4 GB ou tela de toque pequena;
 * - Alto: o resto (desktop e celulares bons).
 * deviceMemory e hardwareConcurrency não existem no Safari: lá vale o
 * tamanho da tela e o governador de FPS.
 *
 * Para testes (QA e designer): ?quality=alto|medio|baixo na URL força o nível.
 */
export function detectInitialQuality(): Quality {
  const forced = new URLSearchParams(window.location.search).get("quality");
  if (forced === "alto" || forced === "medio" || forced === "baixo") {
    return forced;
  }

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  const memory = nav.deviceMemory;
  const cores = nav.hardwareConcurrency;

  if (nav.connection?.saveData || (memory !== undefined && memory <= 2)) {
    return "baixo";
  }

  const smallTouchScreen =
    window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 860;
  if (
    (cores !== undefined && cores <= 4) ||
    (memory !== undefined && memory <= 4) ||
    smallTouchScreen
  ) {
    return "medio";
  }

  return "alto";
}

// ---------- Governador de FPS (PERF-PLAN B2) ----------

export const GOVERNOR = {
  windowMs: 2000, // janela de medição
  maxAverageFrameMs: 40, // média acima disso (< 25fps) → desce um nível
};
