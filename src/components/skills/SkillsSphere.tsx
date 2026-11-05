import { useEffect, useRef, type PointerEvent } from "react";
import { skills } from "../../content/ui";
import { usePointer } from "../../hooks/usePointer";
import { useQuality } from "../../hooks/useQuality";
import { ASCII_FRAME_INTERVAL, SPHERE, lerp } from "../../lib/motion";
import { subscribe } from "../../lib/ticker";

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
  const isLowQuality = useQuality().quality === "baixo";

  // Estado da rotação (fica em refs porque muda a cada frame)
  const rotation = useRef({ x: 0.3, y: 0 });
  const velocity = useRef({ x: SPHERE.baseVelX, y: SPHERE.baseVelY });
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Função para sair do ticker (null = não inscrito)
    let unsubscribe: (() => void) | null = null;
    let lastFrameTime = -Infinity;

    // Último zIndex e cor escritos em cada tag: só reescrevemos quando
    // mudam de faixa (A4). Mudar cor/zIndex a cada quadro custava estilo e
    // layout em todas as tags.
    const lastZIndex: string[] = [];
    const lastColor: string[] = [];

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

        // Profundidade em 10 faixas (suficiente para a ordem de sobreposição)
        const zIndex = `${Math.round((z + 1) * 5)}`;
        if (zIndex !== lastZIndex[index]) {
          element.style.zIndex = zIndex;
          lastZIndex[index] = zIndex;
        }

        // Cor em faixas: matiz em passos de 10° e luminosidade em passos de 3%
        const color =
          z > 0.55
            ? "var(--color-paper)"
            : `hsl(${Math.round((255 + x * 30) / 10) * 10}, 70%, ${Math.round((60 + z * 15) / 3) * 3}%)`;
        if (color !== lastColor[index]) {
          element.style.color = color;
          lastColor[index] = color;
        }
      });
    }

    function tick(time: number) {
      // 30 quadros por segundo bastam para a rotação lenta (A4)
      if (time - lastFrameTime < ASCII_FRAME_INTERVAL) return;
      // Tempo desde o último quadro (no 1º quadro, ~33ms; no máximo 100ms)
      const elapsed =
        lastFrameTime === -Infinity ? 33 : Math.min(time - lastFrameTime, 100);
      lastFrameTime = time;

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
      // passado, para a esfera girar na mesma velocidade a 30fps
      const steps = elapsed / 16;
      rotation.current.x += velocity.current.x * 16 * steps;
      rotation.current.y += velocity.current.y * 16 * steps;
      placeTags();
    }

    // Nível Baixo (e reduced motion): posiciona uma vez e pronto
    if (isLowQuality) {
      placeTags();
      window.addEventListener("resize", placeTags);
      return () => window.removeEventListener("resize", placeTags);
    }

    // Só gira (inscrita no ticker único, A2) enquanto estiver na tela
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !unsubscribe) {
        unsubscribe = subscribe(tick);
      } else if (!entry.isIntersecting && unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    });
    observer.observe(container);
    placeTags();

    return () => {
      unsubscribe?.();
      observer.disconnect();
    };
  }, [isLowQuality, pointer]);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (isLowQuality) return;
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
