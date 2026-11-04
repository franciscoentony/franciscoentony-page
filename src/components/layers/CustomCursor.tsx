import { useEffect, useRef, useState } from "react";
import { cursor as cursorCopy } from "../../content/ui";
import {
  useCanvasAnimation,
  type CanvasFrame,
} from "../../hooks/useCanvasAnimation";
import { usePointer } from "../../hooks/usePointer";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { CURSOR, lerp } from "../../lib/motion";

const FINE_POINTER = "(hover: hover) and (pointer: fine)";

/**
 * Cursor custom (HANDOFF §4): só aparece com mouse (hover + pointer fino)
 * e fica desligado com reduced motion. Nos outros casos, cursor do sistema.
 */
export default function CustomCursor() {
  const reducedMotion = usePrefersReducedMotion();
  const [hasFinePointer, setHasFinePointer] = useState(
    () => window.matchMedia(FINE_POINTER).matches,
  );

  // Acompanha a troca de dispositivo (ex.: tablet com teclado/mouse) (R2 S-7)
  useEffect(() => {
    const media = window.matchMedia(FINE_POINTER);

    function handleChange() {
      setHasFinePointer(media.matches);
    }

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  if (!hasFinePointer || reducedMotion) return null;
  return <CursorLayer />;
}

type Mode = "" | "link" | "holo" | "drag";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 1 = acabou de nascer, 0 = some
  char: string;
  hue: number;
  size: number;
}

// Tamanho e estilo do anel em cada modo
const ringStyles: Record<Mode, string> = {
  "": "size-9 border-white/45",
  link: "size-[58px] border-white/70 bg-white/7",
  holo: "size-24 border-transparent bg-cursor-fill backdrop-blur-[2px] cursor-ring-iridescent",
  drag: "size-24 border-transparent bg-cursor-fill backdrop-blur-[2px] cursor-ring-iridescent",
};

function CursorLayer() {
  const pointer = usePointer();
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<Mode>("");

  // Valores que mudam a cada frame ficam em refs (sem re-render)
  const ring = useRef({ x: 0, y: 0 });
  const previous = useRef({ x: 0, y: 0 });
  const angle = useRef(0);
  const pressed = useRef(false);
  const particles = useRef<Particle[]>([]);

  useEffect(() => {
    const html = document.documentElement;

    function handleMove(event: PointerEvent) {
      if (event.pointerType !== "mouse") return;
      html.classList.add("has-custom-cursor");
      setVisible(true);
    }

    function handleLeave() {
      html.classList.remove("has-custom-cursor");
      setVisible(false);
    }

    // Descobre o modo pelo elemento embaixo do mouse
    function handleOver(event: PointerEvent) {
      const target = event.target as Element;
      if (target.closest('[data-cursor="drag"]')) setMode("drag");
      else if (target.closest('[data-cursor="holo"]')) setMode("holo");
      else if (target.closest("a, button")) setMode("link");
      else setMode("");
    }

    // Clique: encolhe o anel e solta uma explosão de partículas
    function handleDown(event: PointerEvent) {
      pressed.current = true;
      for (let i = 0; i < CURSOR.clickParticles; i++) {
        const direction = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 3.5;
        particles.current.push({
          x: event.clientX,
          y: event.clientY,
          vx: Math.cos(direction) * speed,
          vy: Math.sin(direction) * speed,
          life: 1,
          char: "✦*+"[i % 3],
          hue: Math.random() * 360,
          size: 12,
        });
      }
    }

    function handleUp() {
      pressed.current = false;
    }

    window.addEventListener("pointermove", handleMove, { passive: true });
    document.addEventListener("pointerover", handleOver);
    document.documentElement.addEventListener("mouseleave", handleLeave);
    window.addEventListener("pointerdown", handleDown);
    window.addEventListener("pointerup", handleUp);

    return () => {
      html.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerover", handleOver);
      document.documentElement.removeEventListener("mouseleave", handleLeave);
      window.removeEventListener("pointerdown", handleDown);
      window.removeEventListener("pointerup", handleUp);
    };
  }, []);

  function draw({ ctx, width, height, time }: CanvasFrame) {
    const { x, y } = pointer.current;
    const dx = x - previous.current.x;
    const dy = y - previous.current.y;
    const speed = Math.hypot(dx, dy);

    // Ponto: gira um pouco na direção do movimento e estica com a velocidade
    if (speed > 0.5) angle.current = Math.atan2(dy, dx);
    const rotation = 45 + angle.current * 57.3 * 0.15;
    const stretch = 1 + Math.min(speed, 40) / 80;
    if (dotRef.current) {
      dotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${rotation}deg) scale(${stretch})`;
    }

    // Anel: segue o ponto com atraso
    ring.current.x = lerp(ring.current.x, x, CURSOR.ringFollow);
    ring.current.y = lerp(ring.current.y, y, CURSOR.ringFollow);
    if (ringRef.current) {
      const scale = pressed.current ? 0.82 : 1;
      ringRef.current.style.transform = `translate3d(${ring.current.x}px, ${ring.current.y}px, 0) translate(-50%, -50%) scale(${scale})`;
    }

    // Rastro de "poeira" ASCII: até 4 partículas por frame, conforme a velocidade
    const count = Math.min(4, Math.floor(speed / 7));
    for (let i = 0; i < count; i++) {
      const k = i / count;
      particles.current.push({
        x: previous.current.x + dx * k + (Math.random() - 0.5) * 6,
        y: previous.current.y + dy * k + (Math.random() - 0.5) * 6,
        vx: (Math.random() - 0.5) * 0.6 - dx * 0.02,
        vy: (Math.random() - 0.5) * 0.6 - dy * 0.02 + 0.15,
        life: 1,
        char: CURSOR.trailChars[
          Math.floor(Math.random() * CURSOR.trailChars.length)
        ],
        hue: 250 + Math.sin(time * 0.002) * 50 + Math.random() * 40,
        size: 9 + Math.random() * 5,
      });
    }
    previous.current = { x, y };

    // Atualiza e desenha as partículas
    ctx.clearRect(0, 0, width, height);
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    const list = particles.current;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= 0.022;
      if (p.life <= 0) {
        list.splice(i, 1);
        continue;
      }
      ctx.font = `500 ${p.size}px "Geist Mono", monospace`;
      ctx.fillStyle = `hsla(${p.hue},95%,${70 + p.life * 20}%,${p.life})`;
      const char = p.life > 0.65 ? p.char : p.life > 0.3 ? "+" : "·";
      ctx.fillText(char, p.x, p.y);
    }
    if (list.length > CURSOR.maxParticles) {
      list.splice(0, list.length - CURSOR.maxParticles);
    }
  }

  // Exceção à regra dos 30fps: o cursor acompanha o mouse a cada frame,
  // senão ele "atrasa" visivelmente.
  const canvasRef = useCanvasAnimation(draw);
  const label =
    mode === "holo" ? cursorCopy.holo : mode === "drag" ? cursorCopy.drag : "";
  const opacity = visible ? "opacity-100" : "opacity-0";

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-98 size-full"
      />
      <div
        ref={dotRef}
        aria-hidden="true"
        className={`pointer-events-none fixed top-0 left-0 z-100 size-2 bg-gold shadow-cursor-dot transition-opacity duration-300 ${opacity}`}
      />
      <div
        ref={ringRef}
        aria-hidden="true"
        className={`pointer-events-none fixed top-0 left-0 z-100 grid place-items-center rounded-full border transition-[width,height,background-color,border-color,opacity] duration-450 ${ringStyles[mode]} ${opacity}`}
      >
        <span
          className={`font-mono text-label-2xs tracking-label-widest whitespace-nowrap text-white transition-all duration-350 ${
            label ? "scale-100 opacity-100" : "scale-80 opacity-0"
          }`}
        >
          {label}
        </span>
      </div>
    </>
  );
}
