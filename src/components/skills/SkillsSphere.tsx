import { useEffect, useRef, type PointerEvent } from "react";
import { skills } from "../../content/ui";
import { usePointer } from "../../hooks/usePointer";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { SPHERE, lerp } from "../../lib/motion";

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

/**
 * Esfera 3D de tags que gira sozinha e pode ser arrastada (HANDOFF §3 e §4).
 * É decorativa (aria-hidden): a mesma informação está nas 4 colunas abaixo.
 * Cada frame só muda o style das tags (sem re-render do React).
 */
export default function SkillsSphere() {
  const containerRef = useRef<HTMLDivElement>(null);
  const tagRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const pointer = usePointer();
  const reducedMotion = usePrefersReducedMotion();

  // Estado da rotação (fica em refs porque muda a cada frame)
  const rotation = useRef({ x: 0.3, y: 0 });
  const velocity = useRef({ x: SPHERE.baseVelX, y: SPHERE.baseVelY });
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isVisible = false;
    let frameId = 0;

    function placeTags() {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const radius = Math.min(rect.width, rect.height) * SPHERE.radius;
      const cosX = Math.cos(rotation.current.x);
      const sinX = Math.sin(rotation.current.x);
      const cosY = Math.cos(rotation.current.y);
      const sinY = Math.sin(rotation.current.y);

      tagPositions.forEach((tag, index) => {
        const element = tagRefs.current[index];
        if (!element) return;

        // Gira no eixo Y e depois no eixo X
        const x = tag.x * cosY + tag.z * sinY;
        let z = -tag.x * sinY + tag.z * cosY;
        const y = tag.y * cosX - z * sinX;
        z = tag.y * sinX + z * cosX;

        // Mais perto (z maior) = maior, mais opaco e por cima
        const scale = 0.7 + (z + 1) * 0.3;
        element.style.transform = `translate(-50%, -50%) translate3d(${x * radius}px, ${y * radius * 0.92}px, 0) scale(${scale})`;
        element.style.opacity = `${0.32 + (z + 1) * 0.34}`;
        element.style.zIndex = `${Math.round((z + 1) * 100)}`;
        element.style.color =
          z > 0.55
            ? "var(--color-paper)"
            : `hsl(${255 + x * 30}, 70%, ${60 + z * 15}%)`;
      });
    }

    function tick() {
      frameId = requestAnimationFrame(tick);
      if (!isVisible) return;

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
      rotation.current.x += velocity.current.x * 16;
      rotation.current.y += velocity.current.y * 16;
      placeTags();
    }

    // Reduced motion: posiciona uma vez e pronto
    if (reducedMotion) {
      placeTags();
      window.addEventListener("resize", placeTags);
      return () => window.removeEventListener("resize", placeTags);
    }

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    observer.observe(container);
    placeTags();
    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
  }, [reducedMotion, pointer]);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (reducedMotion) return;
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
      ref={containerRef}
      aria-hidden="true"
      data-cursor="drag"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative mt-10 h-[min(560px,70vw)] cursor-grab touch-pan-y select-none active:cursor-grabbing"
    >
      {skills.sphereTags.map((tag, index) => (
        <span
          key={tag}
          ref={(element) => {
            tagRefs.current[index] = element;
          }}
          className="absolute top-1/2 left-1/2 font-mono text-tag font-medium tracking-mono whitespace-nowrap transition-[color,text-shadow] duration-200 will-change-transform hover:text-gold! hover:text-shadow-glow-gold"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}
