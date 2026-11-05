import { useRef, type PointerEvent } from "react";
import { skills } from "../../content/ui";
import {
  useCanvasAnimation,
  type CanvasFrame,
} from "../../hooks/useCanvasAnimation";
import { usePointer } from "../../hooks/usePointer";
import { ASCII_FRAME_INTERVAL, SPHERE, lerp } from "../../lib/motion";

/** Posição de cada tag na superfície de uma esfera de raio 1 (distribuição de Fibonacci). */
const tagPositions = skills.sphereTags.map((_, index) => {
  const total = skills.sphereTags.length;
  const phi = Math.acos(1 - (2 * (index + 0.5)) / total);
  const theta = Math.PI * (1 + Math.sqrt(5)) * index;
  return {
    x: Math.sin(phi) * Math.cos(theta),
    y: Math.cos(phi),
    z: Math.sin(phi) * Math.sin(theta),
  };
});

/** Tamanho base da fonte das tags (era o token text-tag, 15px). */
const TAG_FONT_SIZE = 15;

/** Uma tag já girada e projetada na tela (refeita a cada quadro). */
interface ProjectedTag {
  label: string;
  /** Posição no canvas (px) e posição horizontal na esfera (-1 a 1). */
  x: number;
  y: number;
  sphereX: number;
  z: number;
  scale: number;
  /** Metade da largura e da altura do texto (para saber se o mouse está em cima). */
  halfWidth: number;
  halfHeight: number;
}

/** Lê uma cor dos tokens do CSS (ex.: --color-paper), para usar no canvas. */
function readColorToken(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
}

/**
 * Esfera 3D de tags que gira sozinha e pode ser arrastada (HANDOFF §3 e §4).
 *
 * Desenhada num canvas: antes eram 22 <span> com transform/opacity/cor a
 * cada quadro, o que custava estilo + pintura de texto. É decorativa
 * (aria-hidden): a mesma informação está nas 4 colunas abaixo.
 * No nível Baixo (e com reduced motion) fica parada, como antes.
 */
export default function SkillsSphere() {
  const pointer = usePointer();

  // Estado da rotação (fica em refs porque muda a cada quadro)
  const rotation = useRef({ x: 0.3, y: 0 });
  const velocity = useRef({ x: SPHERE.baseVelX, y: SPHERE.baseVelY });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const lastFrameTime = useRef(-Infinity);
  const colors = useRef<{ paper: string; gold: string } | null>(null);

  function rotate(time: number) {
    // Tempo desde o último quadro (no 1º quadro, ~33ms; no máximo 100ms)
    const elapsed =
      lastFrameTime.current === -Infinity
        ? 33
        : Math.min(time - lastFrameTime.current, 100);
    lastFrameTime.current = time;

    // Sem arrastar, a velocidade volta aos poucos para a base (e o mouse influencia)
    if (!drag.current) {
      velocity.current.x = lerp(
        velocity.current.x,
        SPHERE.baseVelX - pointer.current.ny * 0.002,
        0.02,
      );
      velocity.current.y = lerp(
        velocity.current.y,
        SPHERE.baseVelY + pointer.current.nx * 0.004,
        0.02,
      );
    }

    // A velocidade foi pensada por quadro de 16ms: escala pelo tempo real
    const steps = elapsed / 16;
    rotation.current.x += velocity.current.x * 16 * steps;
    rotation.current.y += velocity.current.y * 16 * steps;
  }

  function draw({ ctx, width, height, time, isStatic }: CanvasFrame) {
    // No nível Baixo a esfera fica parada no quadro inicial
    if (!isStatic) rotate(time);

    colors.current ??= {
      paper: readColorToken("--color-paper"),
      gold: readColorToken("--color-gold"),
    };

    ctx.clearRect(0, 0, width, height);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.letterSpacing = "0.02em"; // igual ao token tracking-mono

    const radius = Math.min(width, height) * SPHERE.radius;
    const cosX = Math.cos(rotation.current.x);
    const sinX = Math.sin(rotation.current.x);
    const cosY = Math.cos(rotation.current.y);
    const sinY = Math.sin(rotation.current.y);

    // Projeta as tags
    const projected: ProjectedTag[] = tagPositions.map((tag, index) => {
      // Gira no eixo Y e depois no eixo X
      const x = tag.x * cosY + tag.z * sinY;
      let z = -tag.x * sinY + tag.z * cosY;
      const y = tag.y * cosX - z * sinX;
      z = tag.y * sinX + z * cosX;

      // Mais perto (z maior) = maior
      const scale = 0.7 + (z + 1) * 0.3;
      const label = skills.sphereTags[index];
      ctx.font = `500 ${TAG_FONT_SIZE * scale}px "Geist Mono", monospace`;

      return {
        label,
        x: width / 2 + x * radius,
        y: height / 2 + y * radius * 0.92,
        sphereX: x,
        z,
        scale,
        halfWidth: ctx.measureText(label).width / 2,
        halfHeight: (TAG_FONT_SIZE * scale) / 2,
      };
    });

    // Desenha de trás para a frente (as da frente ficam por cima)
    projected.sort((a, b) => a.z - b.z);

    // Tag sob o mouse (a mais da frente) fica dourada com brilho
    let hovered: ProjectedTag | null = null;
    if (!isStatic) {
      const rect = ctx.canvas.getBoundingClientRect();
      const mouseX = pointer.current.x - rect.left;
      const mouseY = pointer.current.y - rect.top;
      for (const tag of projected) {
        const inside =
          Math.abs(mouseX - tag.x) <= tag.halfWidth &&
          Math.abs(mouseY - tag.y) <= tag.halfHeight;
        if (inside) hovered = tag; // a lista vai de trás para frente
      }
    }

    for (const tag of projected) {
      ctx.font = `500 ${TAG_FONT_SIZE * tag.scale}px "Geist Mono", monospace`;
      ctx.globalAlpha = 0.32 + (tag.z + 1) * 0.34;

      if (tag === hovered) {
        ctx.fillStyle = colors.current.gold;
        ctx.shadowColor = "rgba(255, 210, 94, 0.6)"; // = token text-shadow-glow-gold
        ctx.shadowBlur = 18;
      } else {
        // Mesmas cores de antes: as da frente em paper; as outras em
        // violeta, mais claras quanto mais perto
        ctx.fillStyle =
          tag.z > 0.55
            ? colors.current.paper
            : `hsl(${255 + tag.sphereX * 30}, 70%, ${60 + tag.z * 15}%)`;
        ctx.shadowBlur = 0;
      }

      ctx.fillText(tag.label, tag.x, tag.y);
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  // 30 quadros por segundo bastam para a rotação lenta (A4)
  const canvasRef = useCanvasAnimation(draw, {
    frameInterval: ASCII_FRAME_INTERVAL,
  });

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    drag.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    velocity.current.y = (event.clientX - drag.current.x) * SPHERE.dragSpeed;
    velocity.current.x = (event.clientY - drag.current.y) * -SPHERE.dragSpeed;
    drag.current = { x: event.clientX, y: event.clientY };
  }

  function handlePointerUp() {
    drag.current = null;
  }

  return (
    <div
      aria-hidden="true"
      data-cursor="drag"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative mt-10 h-[min(560px,70vw)] cursor-grab touch-pan-y select-none active:cursor-grabbing"
    >
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
    </div>
  );
}
