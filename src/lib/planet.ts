/*
 * Desenho do planeta ASCII da seção Universe (porte de drawPlanet do protótipo).
 * Função "pura": recebe tudo que precisa por parâmetro e desenha no canvas.
 */
import { ASCII_RAMP, UNIVERSE, clamp, lerp, smoothstep } from "./motion";
import type { PointerPosition } from "../hooks/usePointer";

/** Números aleatórios fixos usados para espalhar os caracteres na dissolução. */
const SEEDS = new Float32Array(40000).map(() => Math.random() * 2 - 1);

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
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  progress: number,
  pointer: PointerPosition,
  light: PlanetLight,
) {
  ctx.clearRect(0, 0, width, height);

  const fontSize = width < 700 ? 8 : 10;
  ctx.font = `500 ${fontSize}px "Geist Mono", monospace`;
  ctx.textBaseline = "top";
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
  let index = 0;
  let lastStyle = "";

  for (let j = 0; j < rows; j++) {
    const py = (j * cellHeight + cellHeight / 2 - cy) / R;

    for (let i = 0; i < cols; i++, index++) {
      const px = (i * cellWidth + cellWidth / 2 - cx) / R;
      const d2 = px * px + py * py;

      let char: string | null = null;
      let bright = 0;
      let hue = hueBase;
      let depth = -9;
      let sat = 80;

      // Esfera
      if (d2 < 1) {
        const pz = Math.sqrt(1 - d2);
        const lx = px * cosYaw - pz * sinYaw;
        const lz = px * sinYaw + pz * cosYaw;
        const n = noise3(lx * 2.4, py * 2.4, lz * 2.4);
        const land = smoothstep(clamp((n - 0.05) * 4));
        const diffuse = Math.max(0, px * Lx + py * Ly + pz * Lz);
        const rim = Math.pow(1 - pz, 2.5); // borda iridescente (fresnel)

        bright = clamp(diffuse * 0.85 + 0.08 + land * 0.14 * diffuse + rim * 0.5 * (0.6 + diffuse * 0.4));
        hue = hueBase + rim * 110 - land * 25 + px * 20;
        sat = 70 + rim * 30;
        char = ASCII_RAMP[Math.round(bright * (ASCII_RAMP.length - 1))];
        depth = pz;
      }

      // Anel
      const ux = px * cosRoll + py * sinRoll;
      const uy = -px * sinRoll + py * cosRoll;
      const w = uy / sinElev;
      const ringRadius = Math.hypot(ux, w);
      const ringDepth = w * cosElev;
      const ringInFront = char === null || char === " " || ringDepth > depth;

      if (ringRadius > 1.45 && ringRadius < 2.05 && ringInFront) {
        const band = Math.sin(ringRadius * 30) * 0.5 + 0.5;
        const isGap = ringRadius > 1.74 && ringRadius < 1.8;

        if (band > 0.2 && !isGap) {
          const shadow = ringDepth < 0 && Math.abs(ux) < 1 ? 0.35 : 1;
          const lit = clamp((0.28 + band * 0.4) * shadow * (0.6 + 0.4 * Math.max(0, ux * Lx + 0.5)));
          char = ASCII_RAMP[Math.max(1, Math.round(lit * (ASCII_RAMP.length - 1)))];
          bright = lit;
          hue = hueBase + 20 + (ringRadius - 1.45) * 60;
          sat = 75;
        }
      }

      if (!char || char === " ") continue;

      let x = i * cellWidth;
      let y = j * cellHeight;
      let alpha = 0.25 + bright * 0.75;

      // Cada caractere se espalha e some na dissolução
      if (dissolve > 0) {
        x += SEEDS[index % 40000] * dissolve * width * 0.7;
        y += SEEDS[(index * 7) % 40000] * dissolve * height * 0.7 - dissolve * 60;
        alpha *= (1 - dissolve) * (1 - dissolve);
      }

      // Arredonda as cores para trocar fillStyle menos vezes (mais rápido)
      const lightness = Math.round(50 + bright * 40);
      const style = `hsla(${Math.round(hue / 6) * 6},${Math.round(sat / 10) * 10}%,${lightness - (lightness % 5)}%,${Math.round(alpha * 10) / 10})`;
      if (style !== lastStyle) {
        ctx.fillStyle = style;
        lastStyle = style;
      }
      ctx.fillText(char, x, y);
    }
  }

  // Brilho suave em volta
  const glow = ctx.createRadialGradient(cx, cy, R * 0.2, cx, cy, R * 2.2);
  glow.addColorStop(0, `rgba(139,108,255,${0.16 * (1 - dissolve)})`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "source-over";
}
