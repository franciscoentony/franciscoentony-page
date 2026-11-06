import { useEffect, useRef, useState } from "react";
import { cursor as cursorCopy } from "../../content/ui";
import {
  useCanvasAnimation,
  type CanvasFrame,
} from "../../hooks/useCanvasAnimation";
import { usePointer } from "../../hooks/usePointer";
import { useQuality } from "../../hooks/useQuality";
import { CURSOR, afterNextPaint } from "../../lib/motion";

const FINE_POINTER = "(hover: hover) and (pointer: fine)";

/**
 * Cursor custom (HANDOFF §4): só aparece com mouse (hover + pointer fino)
 * e fica desligado com reduced motion. Nos outros casos, cursor do sistema.
 */
export default function CustomCursor() {
  // Nível Baixo (e reduced motion): cursor do sistema
  const isLowQuality = useQuality().quality === "baixo";
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

  if (!hasFinePointer || isLowQuality) return null;
  return <CursorLayer />;
}

type Mode = "" | "link" | "holo" | "drag";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 1 = acabou de nascer, 0 = some
  /** Qual dos 2 glifos de cada faixa de vida (0 ou 1). */
  variant: number;
  /** Glifo fixo (rajada do clique). Sem ele, o glifo segue a vida. */
  glyph?: string;
  /** Matiz "frio" (lavanda) para depois que a partícula esfria. */
  coolHue: number;
  size: number;
}

// Glifos da exaustão por vida: quente → morno → frio
const FLAME_GLYPHS = [
  ["✦", "*"], // vida > 0.7
  ["+", ":"], // vida > 0.4
  ["·", "."], // fim
];
const BOOST_GLYPHS = "✦*+";

// Órbita (anel) em cada modo. No padrão ela não existe.
const ringStyles: Record<Mode, string> = {
  "": "size-0 border-transparent",
  link: "size-10 border-paper/40",
  holo: "size-24 border-transparent bg-cursor-fill cursor-ring-iridescent",
  drag: "size-24 border-transparent bg-cursor-fill cursor-ring-iridescent",
};

/** Fator de aproximação por quadro corrigido pelo tempo: 1 - base^(dt/16). */
function frameFactor(base: number, dt: number) {
  return 1 - Math.pow(base, dt / 16);
}

/** Diferença entre dois ângulos pelo caminho mais curto (-180..180). */
function angleDiff(target: number, current: number) {
  return ((((target - current) % 360) + 540) % 360) - 180;
}

/**
 * Cursor foguete (docs/redesign/SPEC-CURSOR-FOGUETE.md).
 * - O nariz é o hotspot: fica exatamente sobre o ponteiro em qualquer
 *   rotação (transform-origin no nariz + translate de -nariz).
 * - Gira na direção do movimento (sem tremer em movimentos pequenos) e,
 *   parado, volta à pose de -45°.
 * - A exaustão (partículas ASCII douradas que esfriam em lavanda) sai do
 *   bocal; o clique solta uma rajada (boost).
 * - Ocioso, o draw devolve false e sai do ticker (P5 I-B).
 */
function CursorLayer() {
  // Médio: menos partículas (limites em quality.ts)
  const { settings } = useQuality();
  const pointer = usePointer();
  const rocketRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<Mode>("");
  const modeRef = useRef<Mode>("");

  // Valores que mudam a cada quadro ficam em refs (sem re-render)
  const ring = useRef({ x: 0, y: 0 });
  const previous = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 }); // px por quadro de 16ms (suavizada)
  const angle = useRef<number>(CURSOR.restAngle); // graus; 0 = nariz para cima
  const lastTurnTime = useRef(0);
  const lastTime = useRef(0);
  const scale = useRef(1);
  const pressed = useRef(false);
  const previousTail = useRef<{ x: number; y: number } | null>(null);
  const particles = useRef<Particle[]>([]);

  /** Posição do bocal (cauda) para o nariz em (x, y) e o ângulo atual. */
  function tailPosition(x: number, y: number) {
    const radians = (angle.current * Math.PI) / 180;
    return {
      x: x - Math.sin(radians) * CURSOR.tailDistance,
      y: y + Math.cos(radians) * CURSOR.tailDistance,
    };
  }

  /** Cria uma partícula saindo da cauda, na direção oposta ao nariz. */
  function emit(
    x: number,
    y: number,
    spreadDegrees: number,
    speed: number,
    time: number,
    glyph?: string,
  ) {
    const exhaust =
      angle.current + 180 + (Math.random() - 0.5) * 2 * spreadDegrees;
    const radians = (exhaust * Math.PI) / 180;
    particles.current.push({
      x: x + (Math.random() - 0.5) * 2 * CURSOR.flameJitter,
      y: y + (Math.random() - 0.5) * 2 * CURSOR.flameJitter,
      // 0° = para cima: x = sen, y = -cos
      vx: Math.sin(radians) * speed,
      vy: -Math.cos(radians) * speed,
      life: 1,
      variant: Math.random() < 0.5 ? 0 : 1,
      coolHue: 250 + (Math.sin(time * 0.002) * 0.5 + 0.5) * 50,
      size: 8 + Math.random() * 4,
      glyph,
    });
  }

  // Partículas da rajada do clique (Médio: menos). Em ref para o listener
  // de clique sempre ler o valor do nível atual.
  const boostCount = useRef(settings.cursorBoostParticles);
  useEffect(() => {
    boostCount.current = settings.cursorBoostParticles;
  });

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
      let next: Mode = "";
      if (target.closest('[data-cursor="drag"]')) next = "drag";
      else if (target.closest('[data-cursor="holo"]')) next = "holo";
      else if (target.closest("a, button")) next = "link";
      modeRef.current = next;
      setMode(next);
    }

    // Clique = boost: o foguete encolhe e solta uma rajada pela cauda
    function handleDown() {
      pressed.current = true;
      // Partículas depois do paint do clique (A10, INP)
      afterNextPaint(() => {
        const tail = tailPosition(pointer.current.x, pointer.current.y);
        const now = performance.now();
        for (let i = 0; i < boostCount.current; i++) {
          const speed = 2 + Math.random() * 3;
          emit(
            tail.x,
            tail.y,
            CURSOR.boostCone / 2,
            speed,
            now,
            BOOST_GLYPHS[i % 3],
          );
        }
      });
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
    // tailPosition e emit só leem refs (nada que precise reiniciar o efeito)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function draw({ ctx, width, height, time }: CanvasFrame) {
    // Tempo desde o último quadro (no 1º, 16ms; no máximo 100ms)
    const dt =
      lastTime.current === 0
        ? 16
        : Math.min(Math.max(time - lastTime.current, 1), 100);
    lastTime.current = time;

    const { x, y } = pointer.current;

    // Velocidade suavizada (EMA), em px por quadro de 16ms
    const dx = ((x - previous.current.x) * 16) / dt;
    const dy = ((y - previous.current.y) * 16) / dt;
    const smoothing = frameFactor(1 - CURSOR.velocitySmoothing, dt);
    velocity.current.x += (dx - velocity.current.x) * smoothing;
    velocity.current.y += (dy - velocity.current.y) * smoothing;
    const speed = Math.hypot(velocity.current.x, velocity.current.y);
    previous.current = { x, y };

    // Escala alvo: maior sobre links; menor enquanto pressiona
    const isLink = modeRef.current === "link";
    const targetScale = pressed.current
      ? isLink
        ? CURSOR.pressedLinkScale
        : CURSOR.pressedScale
      : isLink
        ? CURSOR.linkScale
        : 1;

    // Ocioso: parado, na pose, órbita no lugar, escala certa e sem chama.
    // Não desenha nem mexe no DOM; o hook tira o cursor do ticker (P5 I-B).
    const ringSettled =
      Math.abs(ring.current.x - x) < 0.1 && Math.abs(ring.current.y - y) < 0.1;
    const atRest = Math.abs(angleDiff(CURSOR.restAngle, angle.current)) < 0.5;
    const scaleSettled = Math.abs(scale.current - targetScale) < 0.001;
    if (
      speed < 0.1 &&
      atRest &&
      ringSettled &&
      scaleSettled &&
      particles.current.length === 0
    ) {
      previousTail.current = null;
      return false;
    }

    // Rotação: segue o rumo só com movimento de verdade (> 2 px/quadro),
    // pelo caminho mais curto; parado por 250ms, volta à pose de -45°
    if (speed > CURSOR.turnMinSpeed) {
      const heading =
        (Math.atan2(velocity.current.y, velocity.current.x) * 180) / Math.PI +
        90;
      angle.current +=
        angleDiff(heading, angle.current) * frameFactor(CURSOR.turnFactor, dt);
      lastTurnTime.current = time;
    } else if (time - lastTurnTime.current > CURSOR.restDelay) {
      angle.current +=
        angleDiff(CURSOR.restAngle, angle.current) *
        frameFactor(CURSOR.restFactor, dt);
    }

    // Mantém o ângulo entre -180 e 180 (só para os valores não crescerem)
    angle.current = angleDiff(angle.current, 0);

    // Escala aproxima o alvo (pressionar é imediato; soltar leva ~200ms)
    scale.current = pressed.current
      ? targetScale
      : scale.current +
        (targetScale - scale.current) * (1 - Math.exp(-dt / CURSOR.scaleTau));

    // Foguete: o nariz (transform-origin) fica exatamente sobre o ponteiro
    if (rocketRef.current) {
      rocketRef.current.style.transform = `translate3d(${x - CURSOR.noseX}px, ${y - CURSOR.noseY}px, 0) rotate(${angle.current}deg) scale(${scale.current})`;
    }

    // Órbita: segue o nariz com atraso
    const follow = frameFactor(1 - CURSOR.ringFollow, dt);
    ring.current.x += (x - ring.current.x) * follow;
    ring.current.y += (y - ring.current.y) * follow;
    if (ringRef.current) {
      const ringScale = pressed.current ? CURSOR.pressedRingScale : 1;
      ringRef.current.style.transform = `translate3d(${ring.current.x}px, ${ring.current.y}px, 0) translate(-50%, -50%) scale(${ringScale})`;
    }

    // Exaustão: da cauda anterior até a atual (sem buracos em movimentos
    // rápidos). Abaixo de 6 px/quadro, nenhuma chama.
    const tail = tailPosition(x, y);
    const fromTail = previousTail.current ?? tail;
    const count = Math.min(
      settings.cursorParticlesPerFrame,
      Math.floor(speed / CURSOR.flameMinSpeed),
    );
    for (let i = 0; i < count; i++) {
      const k = count === 1 ? 1 : i / (count - 1);
      emit(
        fromTail.x + (tail.x - fromTail.x) * k,
        fromTail.y + (tail.y - fromTail.y) * k,
        CURSOR.flameSpread,
        0.8 + speed * 0.06,
        time,
      );
    }
    previousTail.current = tail;

    // Atualiza e desenha as partículas (tudo corrigido pelo tempo do quadro)
    ctx.clearRect(0, 0, width, height);
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    const steps = dt / 16;
    const damping = Math.pow(0.96, steps);
    const list = particles.current;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.x += p.vx * steps;
      p.y += p.vy * steps;
      p.vx *= damping;
      p.vy *= damping;
      p.life -= CURSOR.particleDecay * steps;
      if (p.life <= 0) {
        list.splice(i, 1);
        continue;
      }
      // Dourada saindo do bocal (1º quarto da vida), depois esfria em lavanda
      const hue = p.life > 0.75 ? 45 : p.coolHue;
      const glyphs =
        p.life > 0.7
          ? FLAME_GLYPHS[0]
          : p.life > 0.4
            ? FLAME_GLYPHS[1]
            : FLAME_GLYPHS[2];
      ctx.font = `500 ${p.size}px "Geist Mono", monospace`;
      ctx.fillStyle = `hsla(${hue},95%,${70 + p.life * 20}%,${p.life})`;
      ctx.fillText(p.glyph ?? glyphs[p.variant], p.x, p.y);
    }
    if (list.length > settings.cursorMaxParticles) {
      list.splice(0, list.length - settings.cursorMaxParticles);
    }
  }

  // Exceção à regra dos 30fps: o cursor acompanha o mouse a cada quadro,
  // senão ele "atrasa" visivelmente.
  const canvasRef = useCanvasAnimation(draw, { sleepUntilPointer: true });
  const label =
    mode === "holo" ? cursorCopy.holo : mode === "drag" ? cursorCopy.drag : "";
  const opacity = visible ? "opacity-100" : "opacity-0";
  // A órbita não existe no modo padrão
  const ringOpacity = visible && mode !== "" ? "opacity-100" : "opacity-0";

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-98 size-full"
      />

      {/* Foguete (SVG 24×24, nariz em 12,1.5 = hotspot) */}
      <div
        ref={rocketRef}
        aria-hidden="true"
        className={`pointer-events-none fixed top-0 left-0 z-100 size-6 origin-[12px_1.5px] drop-shadow-rocket transition-opacity duration-300 ${opacity}`}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="1.25"
          strokeLinejoin="round"
          strokeLinecap="round"
          className="stroke-paper"
        >
          {/* corpo (nariz em 12,1.5) */}
          <path
            d="M12 1.5C15.2 4.5 16 8.5 16 12.5V17H8V12.5C8 8.5 8.8 4.5 12 1.5Z"
            className="fill-ink"
          />
          {/* aletas */}
          <path d="M8 13.5L5 17V19.5L8 17.5" className="stroke-accent-soft" />
          <path
            d="M16 13.5L19 17V19.5L16 17.5"
            className="stroke-accent-soft"
          />
          {/* bocal */}
          <path d="M10 17L10.6 19H13.4L14 17" />
          {/* escotilha: o ponto dourado de antes; brilha sobre links */}
          <circle
            cx="12"
            cy="9.5"
            r="1.9"
            className={`fill-gold stroke-none transition-[filter] duration-300 ${
              mode === "link" ? "drop-shadow-glow-gold" : ""
            }`}
          />
        </svg>
      </div>

      {/* Órbita: só em links (40px) e nos modos holo/arrastar (96px) */}
      <div
        ref={ringRef}
        aria-hidden="true"
        className={`pointer-events-none fixed top-0 left-0 z-100 grid place-items-center rounded-full border transition-[width,height,background-color,border-color,opacity] duration-450 ${ringStyles[mode]} ${ringOpacity}`}
      >
        <span
          className={`text-xs whitespace-nowrap text-white transition-all duration-350 ${
            label ? "scale-100 opacity-100" : "scale-80 opacity-0"
          }`}
        >
          {label}
        </span>
      </div>
    </>
  );
}
