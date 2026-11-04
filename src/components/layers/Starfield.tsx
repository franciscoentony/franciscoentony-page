import { useRef } from "react";
import { useCanvasAnimation, type CanvasFrame } from "../../hooks/useCanvasAnimation";
import { usePointer } from "../../hooks/usePointer";
import { STARS, warpState } from "../../lib/motion";

interface Star {
  x: number;
  y: number;
  /** Profundidade: 0.1 (longe) a 1 (perto). */
  z: number;
  /** Fase da cintilação, para cada estrela piscar num tempo diferente. */
  phase: number;
  /** 2% das estrelas têm uma cruz de brilho. */
  hasSpark: boolean;
}

function createStars(width: number, height: number): Star[] {
  const count = Math.round((width * height) / STARS.areaPerStar);
  const stars: Star[] = [];

  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height * STARS.wrapScreens,
      z: Math.random() ** 2 * 0.9 + 0.1,
      phase: Math.random() * 6,
      hasSpark: Math.random() < STARS.sparkChance,
    });
  }

  return stars;
}

/**
 * Fundo de estrelas com parallax (HANDOFF §4, "Fundo de estrelas").
 * Canvas fixo atrás de todo o conteúdo. No fim da seção Universe as estrelas
 * viram linhas saindo do centro (efeito "velocidade da luz", warpState).
 */
export default function Starfield() {
  const pointer = usePointer();
  const stars = useRef<Star[]>([]);
  const lastSize = useRef({ width: 0, height: 0 });

  function draw({ ctx, width, height, time, isStatic }: CanvasFrame) {
    // Recria as estrelas quando o tamanho da tela muda
    if (width !== lastSize.current.width || height !== lastSize.current.height) {
      stars.current = createStars(width, height);
      lastSize.current = { width, height };
    }

    ctx.clearRect(0, 0, width, height);

    const totalHeight = height * STARS.wrapScreens;
    const scrollY = window.scrollY;
    const warp = isStatic ? 0 : warpState.value;

    for (const star of stars.current) {
      // Parallax vertical com "volta" (wrap) a cada 3 alturas de tela
      const shiftedY = star.y - scrollY * star.z * STARS.parallax;
      const y = (((shiftedY % totalHeight) + totalHeight) % totalHeight) - height;
      if (y < -10 || y > height + 10) continue;

      const x = star.x + pointer.current.nx * STARS.mouseShift * star.z;

      // Cintilação (desligada com reduced motion)
      const twinkle = isStatic ? 1 : 0.7 + 0.3 * Math.sin(time * 0.002 + star.phase);
      const alpha = (0.35 + 0.6 * star.z) * twinkle;
      const size = STARS.sizeBase + star.z * STARS.sizeDepth;

      // Velocidade da luz: cada estrela vira uma linha saindo do centro da tela
      if (warp > 0.01) {
        const length = warp * star.z * 0.6;
        ctx.strokeStyle = `rgba(${STARS.color}, ${alpha})`;
        ctx.lineWidth = 0.6 + star.z * 1.8;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (x - width / 2) * length, y + (y - height / 2) * length);
        ctx.stroke();
        continue;
      }

      // Halo lavanda nas estrelas mais próximas
      if (star.z > STARS.haloDepth) {
        ctx.fillStyle = `rgba(${STARS.haloColor}, ${0.12 * twinkle})`;
        ctx.fillRect(x - size, y - size, size * 3, size * 3);
        ctx.fillStyle = `rgba(${STARS.nearColor}, ${alpha})`;
      } else {
        ctx.fillStyle = `rgba(${STARS.color}, ${alpha})`;
      }
      ctx.fillRect(x, y, size, size);

      // Cruz de brilho
      if (star.hasSpark) {
        const length = 3 + 4 * twinkle;
        ctx.fillStyle = `rgba(${STARS.sparkColor}, ${0.55 * twinkle})`;
        ctx.fillRect(x + size / 2 - 0.5, y - length, 1, length * 2 + size);
        ctx.fillRect(x - length, y + size / 2 - 0.5, length * 2 + size, 1);
      }
    }
  }

  const canvasRef = useCanvasAnimation(draw);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 size-full"
    />
  );
}
