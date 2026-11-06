/*
 * Desenho do planeta ASCII da seção Universe (porte de drawPlanet do protótipo).
 * Função "pura": recebe tudo que precisa por parâmetro e desenha no canvas.
 */
import { UNIVERSE, clamp, lerp, smoothstep } from "./motion";
import {
  drawAsciiGrid,
  getAsciiAtlas,
  getLevel,
  type Canvas2D,
} from "./asciiAtlas";
import type { PointerPosition } from "../hooks/usePointer";

/** Números aleatórios fixos usados para espalhar os caracteres na dissolução. */
const SEEDS = new Float32Array(40000).map(() => Math.random() * 2 - 1);

/** Ajustes por nível de qualidade (PERF-TIERS). */
export interface PlanetOptions {
  /** Densidade de pixels (obrigatório dentro do worker, A8). */
  dpr?: number;
  /** Faixas de matiz do atlas: 6 no Alto, 4 no Médio. */
  hueBands?: number;
  /** Fator do tamanho da célula: 1 no Alto, 1.3 no Médio. */
  cellScale?: number;
}

/**
 * O que o planeta desenhou neste quadro (centro, raio, grade de células e
 * luz). Os objetos do hero usam estes valores para cair na MESMA grade e
 * receber a MESMA luz (SPEC-HERO-OBJETOS).
 */
export interface PlanetScene {
  cx: number;
  cy: number;
  /** Raio do planeta, sem o crescimento da dissolução. */
  radius: number;
  font: string;
  fontSize: number;
  cellWidth: number;
  cellHeight: number;
  /** Luz normalizada (z = 0.75 antes de normalizar). */
  light: { x: number; y: number; z: number };
  hueBase: number;
}

/** Posição atual da luz (segue o mouse devagar). Guardada entre os quadros. */
export interface PlanetLight {
  x: number;
  y: number;
}

/** Ruído simples feito de senos, usado para desenhar "continentes". */
function noise3(x: number, y: number, z: number): number {
  return (
    Math.sin(x * 1.7 + Math.sin(y * 2.3 + z)) * 0.5 +
    Math.sin(y * 3.1 + Math.cos(z * 1.3 + x * 0.7)) * 0.3 +
    Math.sin(z * 4.7 + x * 2.1) * 0.2
  );
}

/** Onde o planeta está (centro e raio) para um certo progresso de scroll. */
function getPlanetPosition(progress: number, width: number, height: number) {
  const path = UNIVERSE.path;
  const isMobile = width < 860;

  // Acha o trecho da trajetória em que estamos
  let from = path[0];
  let to = path[path.length - 1];
  for (let i = 0; i < path.length - 1; i++) {
    if (progress >= path[i][0] && progress <= path[i + 1][0]) {
      from = path[i];
      to = path[i + 1];
      break;
    }
  }

  const t = smoothstep(clamp((progress - from[0]) / (to[0] - from[0] || 1)));
  const x = isMobile ? 0.5 : lerp(from[1], to[1], t);
  const y = lerp(from[2], to[2], t);
  const radius =
    Math.min(width, height) *
    lerp(from[3], to[3], t) *
    (isMobile ? UNIVERSE.mobileRadiusScale : 1);

  return { cx: width * x, cy: height * y, radius };
}

export function drawPlanet(
  ctx: Canvas2D,
  width: number,
  height: number,
  time: number,
  progress: number,
  pointer: PointerPosition,
  light: PlanetLight,
  { hueBands = 6, cellScale = 1, dpr }: PlanetOptions = {},
): PlanetScene {
  ctx.clearRect(0, 0, width, height);

  // Células maiores no nível Médio (fator 1.3: 13px, ou 10px abaixo de 700px)
  const fontSize = Math.round((width < 700 ? 8 : 10) * cellScale);
  const font = `500 ${fontSize}px "Geist Mono", monospace`;
  ctx.font = font;
  const cellWidth = ctx.measureText("M").width;
  const cellHeight = fontSize * 1.18;
  const cols = Math.ceil(width / cellWidth);
  const rows = Math.ceil(height / cellHeight);

  // Dissolução no fim da seção
  const dissolve = smoothstep(
    clamp((progress - UNIVERSE.dissolveStart) / (1 - UNIVERSE.dissolveStart)),
  );

  const position = getPlanetPosition(progress, width, height);
  const R = position.radius * (1 + dissolve * 0.5);
  const { cx, cy } = position;

  // Rotação e inclinação do anel (mouse muda um pouco)
  const yaw = time * 0.00022 + progress * 5 + pointer.nx * 0.4;
  const elevation = 0.3 + pointer.ny * 0.08;
  const roll = -0.22 + pointer.nx * 0.05;
  const sinElev = Math.sin(elevation);
  const cosElev = Math.cos(elevation);
  const cosRoll = Math.cos(roll);
  const sinRoll = Math.sin(roll);
  const cosYaw = Math.cos(yaw);
  const sinYaw = Math.sin(yaw);

  // A luz segue o mouse com atraso (lerp 0.06)
  light.x = lerp(light.x, pointer.nx * 1.2 - 0.55, 0.06);
  light.y = lerp(light.y, pointer.ny * 1.2 - 0.45, 0.06);
  const lightLength = Math.hypot(light.x, light.y, 0.75);
  const Lx = light.x / lightLength;
  const Ly = light.y / lightLength;
  const Lz = 0.75 / lightLength;

  const hueBase = 250 + Math.sin(time * 0.0004) * 8;

  // Atlas do planeta: luminosidade 50% a 90%, saturação em 2 faixas
  // (miolo ~75%, borda iridescente 100%)
  const atlas = getAsciiAtlas({
    font,
    fontSize,
    hueBands,
    saturations: [75, 100],
    lightness: (bright) => 50 + bright * 40,
    dpr,
  });

  // Só as células em volta do planeta + anel (o anel vai até 2.05 × R):
  // o resto da tela é vazio e não precisa ser calculado (A1b)
  const extent = R * 2.1;

  drawAsciiGrid(ctx, atlas, {
    cols,
    rows,
    fromCol: Math.floor((cx - extent) / cellWidth),
    toCol: Math.ceil((cx + extent) / cellWidth) + 1,
    fromRow: Math.floor((cy - extent) / cellHeight),
    toRow: Math.ceil((cy + extent) / cellHeight) + 1,
    cellWidth,
    cellHeight,
    cell: (i, j, out) => {
      const px = (i * cellWidth + cellWidth / 2 - cx) / R;
      const py = (j * cellHeight + cellHeight / 2 - cy) / R;
      const d2 = px * px + py * py;

      let hasChar = false;
      let bright = 0;
      let hue = hueBase;
      let depth = -9;
      let sat = 80;
      let minLevel = 0;

      // Esfera
      if (d2 < 1) {
        const pz = Math.sqrt(1 - d2);
        const lx = px * cosYaw - pz * sinYaw;
        const lz = px * sinYaw + pz * cosYaw;
        const n = noise3(lx * 2.4, py * 2.4, lz * 2.4);
        const land = smoothstep(clamp((n - 0.05) * 4));
        const diffuse = Math.max(0, px * Lx + py * Ly + pz * Lz);
        const rim = Math.pow(1 - pz, 2.5); // borda iridescente (fresnel)

        bright = clamp(
          diffuse * 0.85 +
            0.08 +
            land * 0.14 * diffuse +
            rim * 0.5 * (0.6 + diffuse * 0.4),
        );
        hue = hueBase + rim * 110 - land * 25 + px * 20;
        sat = 70 + rim * 30;
        hasChar = getLevel(bright) > 0;
        depth = pz;
      }

      // Anel
      const ux = px * cosRoll + py * sinRoll;
      const uy = -px * sinRoll + py * cosRoll;
      const w = uy / sinElev;
      const ringRadius = Math.hypot(ux, w);
      const ringDepth = w * cosElev;
      const ringInFront = !hasChar || ringDepth > depth;

      if (ringRadius > 1.45 && ringRadius < 2.05 && ringInFront) {
        const band = Math.sin(ringRadius * 30) * 0.5 + 0.5;
        const isGap = ringRadius > 1.74 && ringRadius < 1.8;

        if (band > 0.2 && !isGap) {
          const shadow = ringDepth < 0 && Math.abs(ux) < 1 ? 0.35 : 1;
          bright = clamp(
            (0.28 + band * 0.4) *
              shadow *
              (0.6 + 0.4 * Math.max(0, ux * Lx + 0.5)),
          );
          hue = hueBase + 20 + (ringRadius - 1.45) * 60;
          sat = 75;
          minLevel = 1; // o anel nunca vira espaço
          hasChar = true;
        }
      }

      if (!hasChar) return false;

      out.bright = bright;
      out.hue = hue;
      out.saturation = sat >= 85 ? 1 : 0;
      out.minLevel = minLevel;
      out.alpha = 0.25 + bright * 0.75;

      // Cada caractere se espalha e some na dissolução
      if (dissolve > 0) {
        const index = j * cols + i;
        out.offsetX = SEEDS[index % 40000] * dissolve * width * 0.7;
        out.offsetY =
          SEEDS[(index * 7) % 40000] * dissolve * height * 0.7 - dissolve * 60;
        out.alpha *= (1 - dissolve) * (1 - dissolve);
      }
      return true;
    },
  });

  // Brilho suave em volta
  const glow = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 2.2);
  glow.addColorStop(0, `rgba(139,108,255,${0.16 * (1 - dissolve)})`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "source-over";

  return {
    cx,
    cy,
    radius: position.radius,
    font,
    fontSize,
    cellWidth,
    cellHeight,
    light: { x: Lx, y: Ly, z: Lz },
    hueBase,
  };
}
