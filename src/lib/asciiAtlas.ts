/*
 * Atlas de glifos ASCII (PERF-PLAN A1 + PERF-TIERS §3).
 *
 * Antes: cada caractere era desenhado com fillStyle + fillText, montando uma
 * string "hsla(...)" nova por célula. Isso é lento.
 * Agora: desenhamos UMA vez todos os glifos da rampa, em todas as cores
 * usadas, num canvas escondido (o "atlas"). Depois, cada célula é só um
 * drawImage copiando um pedacinho do atlas (bem mais rápido).
 *
 * Quantização aprovada pelo designer:
 * - brilho: 12 níveis, um por glifo da rampa " .,:;-=+*#%@" (o glifo e a
 *   luminosidade andam juntos);
 * - matiz: 6 faixas no nível Alto (4 no Médio), de 230° a 370°;
 * - saturação: poucas faixas (o planeta usa 2: miolo e borda);
 * - alpha: NÃO entra no atlas, vai por globalAlpha em cada célula.
 */
import { ASCII_RAMP, MAX_DPR, clamp } from "./motion";

/** Contexto 2D de um canvas normal ou de um OffscreenCanvas (dentro do worker, A8). */
export type Canvas2D =
  CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/**
 * Cria um canvas escondido. Na página usa <canvas>; dentro de um Web Worker
 * (onde não existe document) usa OffscreenCanvas.
 */
function createHiddenCanvas(width: number, height: number) {
  if (typeof document === "undefined")
    return new OffscreenCanvas(width, height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/** Quantos níveis de brilho existem (= número de glifos da rampa). */
export const ASCII_LEVELS = ASCII_RAMP.length; // 12

/** Faixa de matizes coberta pelo atlas (igual ao protótipo de níveis). */
const HUE_MIN = 230;
const HUE_MAX = 370;

export interface AtlasOptions {
  /** Fonte CSS do canvas, ex.: '500 10px "Geist Mono", monospace'. */
  font: string;
  /** Tamanho da fonte em px (para calcular a altura do tile). */
  fontSize: number;
  /** Quantas faixas de matiz (6 no Alto, 4 no Médio). */
  hueBands: number;
  /** Saturações disponíveis, em % (ex.: [75, 100] ou só [90]). */
  saturations: number[];
  /** Luminosidade (%) de cada nível de brilho: recebe 0..1, devolve 0..100. */
  lightness: (bright: number) => number;
  /** Densidade de pixels (no worker não existe window: quem chama informa). */
  dpr?: number;
  /**
   * Faixa de matizes [mín, máx] em graus. Padrão: 230° a 370° (violeta →
   * rosa). Os objetos do hero usam um atlas dourado à parte (ex.: [36, 54]).
   */
  hueRange?: [number, number];
}

export interface AsciiAtlas {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  /** Tamanho de um tile em pixels CSS (é o tamanho com que ele é desenhado). */
  tileWidth: number;
  tileHeight: number;
  /** Tamanho de um tile em pixels reais do atlas (já com o DPR). */
  sourceWidth: number;
  sourceHeight: number;
  hueBands: number;
  saturations: number[];
  hueRange: [number, number];
}

// Atlases já criados, reaproveitados entre quadros e entre componentes
const cache = new Map<string, AsciiAtlas>();

/** Índice da faixa de matiz (0..hueBands-1) para um matiz em graus. */
export function getHueBand(
  hue: number,
  hueBands: number,
  [hueMin, hueMax]: [number, number] = [HUE_MIN, HUE_MAX],
): number {
  const bandWidth = (hueMax - hueMin) / hueBands;
  const band = Math.floor((hue - hueMin) / bandWidth);
  return Math.max(0, Math.min(hueBands - 1, band));
}

/** Nível de brilho (0..11) para um brilho de 0 a 1. É também o índice do glifo. */
export function getLevel(bright: number): number {
  return Math.round(clamp(bright) * (ASCII_LEVELS - 1));
}

/**
 * Cria (ou pega do cache) o atlas para estas opções.
 * Precisa ser chamado depois das fontes carregadas (o useCanvasAnimation já
 * garante isso).
 */
export function getAsciiAtlas(options: AtlasOptions): AsciiAtlas {
  const dpr =
    options.dpr ?? Math.min(globalThis.devicePixelRatio || 1, MAX_DPR);
  const hueRange = options.hueRange ?? [HUE_MIN, HUE_MAX];
  const key = [
    options.font,
    hueRange.join("-"),
    options.hueBands,
    options.saturations.join("/"),
    // a função de luminosidade entra na chave pelos valores que ela gera
    Array.from({ length: ASCII_LEVELS }, (_, level) =>
      options.lightness(level / (ASCII_LEVELS - 1)).toFixed(1),
    ).join("/"),
    dpr,
  ].join("|");

  const cached = cache.get(key);
  if (cached) return cached;

  // Mede o glifo para saber o tamanho do tile (com folga para não cortar)
  const measure = createHiddenCanvas(1, 1).getContext("2d") as Canvas2D;
  measure.font = options.font;
  const tileWidth = Math.ceil(measure.measureText("M").width) + 2;
  const tileHeight = Math.ceil(options.fontSize * 1.4);
  const sourceWidth = Math.ceil(tileWidth * dpr);
  const sourceHeight = Math.ceil(tileHeight * dpr);

  // Layout do atlas: colunas = níveis de brilho; linhas = matiz × saturação
  const rows = options.hueBands * options.saturations.length;
  const canvas = createHiddenCanvas(
    sourceWidth * ASCII_LEVELS,
    sourceHeight * rows,
  );
  const ctx = canvas.getContext("2d") as Canvas2D;
  ctx.scale(dpr, dpr);
  ctx.font = options.font;
  ctx.textBaseline = "top";

  const bandWidth = (hueRange[1] - hueRange[0]) / options.hueBands;

  for (let band = 0; band < options.hueBands; band++) {
    // Cor do centro da faixa (igual ao protótipo de níveis do designer)
    const hue = hueRange[0] + (band + 0.5) * bandWidth;

    options.saturations.forEach((saturation, satIndex) => {
      const row = band * options.saturations.length + satIndex;

      for (let level = 1; level < ASCII_LEVELS; level++) {
        const bright = level / (ASCII_LEVELS - 1);
        ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${options.lightness(bright)}%)`;
        ctx.fillText(
          ASCII_RAMP[level],
          (level * sourceWidth) / dpr + 1,
          (row * sourceHeight) / dpr,
        );
      }
    });
  }

  const atlas: AsciiAtlas = {
    canvas,
    tileWidth,
    tileHeight,
    sourceWidth,
    sourceHeight,
    hueBands: options.hueBands,
    hueRange,
    saturations: options.saturations,
  };
  cache.set(key, atlas);
  return atlas;
}

/** O que uma célula da grade deve desenhar. Preenchido pela função `cell`. */
export interface AsciiCell {
  /** Brilho de 0 a 1 (vira o glifo e a luminosidade). */
  bright: number;
  /** Matiz em graus. */
  hue: number;
  /** Índice em atlas.saturations (0 se só houver uma). */
  saturation: number;
  /** Opacidade de 0 a 1 (globalAlpha). */
  alpha: number;
  /** Deslocamento extra em px (usado na dissolução do planeta). */
  offsetX: number;
  offsetY: number;
  /** Nível mínimo do glifo (o anel do planeta nunca usa o espaço). */
  minLevel: number;
}

interface GridOptions {
  cols: number;
  rows: number;
  /**
   * Opcional: só percorre este retângulo de células (ex.: em volta do
   * planeta). Fora dele nada é desenhado. Padrão: a grade inteira.
   */
  fromCol?: number;
  toCol?: number;
  fromRow?: number;
  toRow?: number;
  cellWidth: number;
  cellHeight: number;
  /**
   * Chamada para cada célula. Preencha `out` e devolva true para desenhar,
   * ou false para deixar a célula vazia. O objeto `out` é reaproveitado
   * (não guarde referência a ele).
   */
  cell: (col: number, row: number, out: AsciiCell) => boolean;
}

// Objeto reaproveitado em todas as células (evita criar milhares de objetos por quadro)
const sharedCell: AsciiCell = {
  bright: 0,
  hue: 0,
  saturation: 0,
  alpha: 1,
  offsetX: 0,
  offsetY: 0,
  minLevel: 0,
};

/**
 * Desenha uma grade de caracteres ASCII usando o atlas (resolve o S-1 da R2).
 * Usado pelo planeta, retrato, thumbs dos projetos e campo do contato.
 */
export function drawAsciiGrid(
  ctx: Canvas2D,
  atlas: AsciiAtlas,
  {
    cols,
    rows,
    fromCol = 0,
    toCol = cols,
    fromRow = 0,
    toRow = rows,
    cellWidth,
    cellHeight,
    cell,
  }: GridOptions,
) {
  const satCount = atlas.saturations.length;
  const lastCol = Math.min(cols, toCol);
  const lastRow = Math.min(rows, toRow);

  for (let row = Math.max(0, fromRow); row < lastRow; row++) {
    for (let col = Math.max(0, fromCol); col < lastCol; col++) {
      sharedCell.saturation = 0;
      sharedCell.alpha = 1;
      sharedCell.offsetX = 0;
      sharedCell.offsetY = 0;
      sharedCell.minLevel = 0;
      if (!cell(col, row, sharedCell)) continue;

      const level = Math.max(sharedCell.minLevel, getLevel(sharedCell.bright));
      if (level === 0 || sharedCell.alpha <= 0) continue; // espaço: nada a desenhar

      const band = getHueBand(sharedCell.hue, atlas.hueBands, atlas.hueRange);
      const atlasRow = band * satCount + sharedCell.saturation;

      ctx.globalAlpha = Math.min(1, sharedCell.alpha);
      ctx.drawImage(
        atlas.canvas,
        level * atlas.sourceWidth,
        atlasRow * atlas.sourceHeight,
        atlas.sourceWidth,
        atlas.sourceHeight,
        col * cellWidth + sharedCell.offsetX - 1,
        row * cellHeight + sharedCell.offsetY,
        atlas.tileWidth,
        atlas.tileHeight,
      );
    }
  }

  ctx.globalAlpha = 1;
}

/**
 * Desenha UM glifo do atlas em (x, y), o canto da célula. Para quem escolhe
 * o atlas célula a célula (os objetos do hero misturam o atlas do planeta
 * com o dourado). `level` é o índice na rampa (1..11).
 */
export function drawGlyph(
  ctx: Canvas2D,
  atlas: AsciiAtlas,
  level: number,
  hue: number,
  saturation: number,
  x: number,
  y: number,
  alpha: number,
) {
  if (level <= 0 || alpha <= 0) return;
  const band = getHueBand(hue, atlas.hueBands, atlas.hueRange);
  const atlasRow = band * atlas.saturations.length + saturation;
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.drawImage(
    atlas.canvas,
    level * atlas.sourceWidth,
    atlasRow * atlas.sourceHeight,
    atlas.sourceWidth,
    atlas.sourceHeight,
    x - 1,
    y,
    atlas.tileWidth,
    atlas.tileHeight,
  );
}
