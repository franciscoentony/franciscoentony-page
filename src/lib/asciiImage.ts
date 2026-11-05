/*
 * Desenha uma FOTO em ASCII num canvas, uma vez só (adendo v3).
 *
 * Usado na revelação da capa do post (o ASCII aparece primeiro e a foto
 * entra por cima), na lente do "Próximo post." e na assinatura (o retrato
 * da ficha em glifos). Não é animação: depois de desenhado, o canvas fica
 * parado e quem mostra/esconde é o CSS (opacity ou máscara).
 *
 * Usa o atlas de glifos (um drawImage por célula), como o planeta e a ficha.
 */
import { drawAsciiGrid, getAsciiAtlas } from "./asciiAtlas";
import { MAX_DPR, clamp } from "./motion";

interface AsciiImageOptions {
  /** Tamanho da fonte da célula em px (7 na capa, 6 na assinatura). */
  cell?: number;
  /** > 1 clareia a imagem (o retrato pequeno precisa de mais luz). */
  lift?: number;
  /** Faixas de matiz do atlas (settings.hueBands do nível). */
  hueBands?: number;
}

/**
 * Ajusta o canvas ao tamanho na tela e desenha a imagem em glifos,
 * recortada como object-fit: cover. A imagem precisa já estar carregada.
 */
export function drawAsciiImage(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  { cell = 7, lift = 1, hueBands = 6 }: AsciiImageOptions = {},
) {
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  if (width < 1 || height < 1 || !image.naturalWidth) return;

  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Grade de células (a proporção de um glifo mono é ~0.62 × 1.12)
  const cellWidth = cell * 0.62;
  const cellHeight = cell * 1.12;
  const cols = Math.ceil(width / cellWidth);
  const rows = Math.ceil(height / cellHeight);

  // Reduz a foto para 1 pixel por célula, recortando como "cover"
  const sample = document.createElement("canvas");
  sample.width = cols;
  sample.height = rows;
  const sampleCtx = sample.getContext("2d", { willReadFrequently: true });
  if (!sampleCtx) return;
  const imageRatio = image.naturalWidth / image.naturalHeight;
  const boxRatio = width / height;
  let sx = 0;
  let sy = 0;
  let sw = image.naturalWidth;
  let sh = image.naturalHeight;
  if (imageRatio > boxRatio) {
    sw = sh * boxRatio;
    sx = (image.naturalWidth - sw) / 2;
  } else {
    sh = sw / boxRatio;
    sy = (image.naturalHeight - sh) / 2;
  }
  sampleCtx.drawImage(image, sx, sy, sw, sh, 0, 0, cols, rows);
  const pixels = sampleCtx.getImageData(0, 0, cols, rows).data;

  const atlas = getAsciiAtlas({
    font: `600 ${cell}px "Geist Mono", monospace`,
    fontSize: cell,
    hueBands,
    saturations: [90],
    lightness: (bright) => 55 + bright * 35,
  });

  ctx.clearRect(0, 0, width, height);
  drawAsciiGrid(ctx, atlas, {
    cols,
    rows,
    cellWidth,
    cellHeight,
    cell: (col, row, out) => {
      const i = (row * cols + col) * 4;
      // Luminância da célula, com uma curva para os médios aparecerem
      const luminance =
        (pixels[i] * 0.3 + pixels[i + 1] * 0.59 + pixels[i + 2] * 0.11) / 255;
      const bright = clamp(Math.pow(luminance, 0.85 / lift) * 1.1 * lift);
      if (bright < 0.06) return false;
      out.bright = bright;
      out.hue = 250 + (col / cols) * 40; // violeta → lavanda, da esquerda para a direita
      out.alpha = 0.4 + bright * 0.6;
      return true;
    },
  });
}
