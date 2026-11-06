import { useEffect, useRef, type RefObject } from "react";
import type { HeroObjectsLink } from "../../lib/heroObjectsLink";

/** Toque: segurar 380ms sem mover mais de 8px pega o objeto. */
const LONG_PRESS_MS = 380;
const LONG_PRESS_SLOP = 8;
/** Dica no toque: um empurrãozinho no astronauta 3.2s depois de carregar. */
const NUDGE_DELAY_MS = 3200;
/** Folga da caixa do texto: 24px dos lados, 16px em cima e embaixo. */
const TEXT_PAD_X = 24;
const TEXT_PAD_Y = 16;

/**
 * Mede a caixa do texto do hero (h1 + CTAs + assinatura) nas coordenadas
 * do palco. Usa o retângulo do CONTEÚDO de cada linha (Range), não o do
 * bloco, que ocupa a largura toda.
 */
function measureTextBox(stage: HTMLElement, hero: HTMLElement) {
  const origin = stage.getBoundingClientRect();
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  const add = (rect: DOMRect) => {
    if (!rect.width) return;
    x0 = Math.min(x0, rect.left);
    x1 = Math.max(x1, rect.right);
    y0 = Math.min(y0, rect.top);
    y1 = Math.max(y1, rect.bottom);
  };
  hero.querySelectorAll("[data-hero-text]").forEach((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    Array.from(range.getClientRects()).forEach(add);
  });
  hero
    .querySelectorAll("[data-hero-cta] > *")
    .forEach((element) => add(element.getBoundingClientRect()));
  if (!Number.isFinite(x0)) return null;
  return {
    x0: x0 - origin.left - TEXT_PAD_X,
    x1: x1 - origin.left + TEXT_PAD_X,
    y0: y0 - origin.top - TEXT_PAD_Y,
    y1: y1 - origin.top + TEXT_PAD_Y,
  };
}

interface HeroObjectsProps {
  link: HeroObjectsLink;
  /** O bloco do texto do hero (h1, CTAs e assinatura). */
  heroRef: RefObject<HTMLElement | null>;
  /** Baixo e reduced motion: só o quadro parado, sem áreas de pegar. */
  isStatic: boolean;
}

/**
 * Áreas de pegar dos objetos do hero (SPEC-HERO-OBJETOS §4). O desenho e a
 * física estão no worker do planeta; aqui ficam só:
 * - 3 círculos invisíveis (aria-hidden) que seguem os objetos, com
 *   data-cursor="drag" (o cursor foguete mostra "Arraste");
 * - mouse e caneta pegam na hora; no toque, só depois de um long-press
 *   (um toque normal continua rolando a página);
 * - a medida da caixa do texto, que vai para a simulação.
 */
export default function HeroObjects({
  link,
  heroRef,
  isStatic,
}: HeroObjectsProps) {
  const grabRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);

  // Caixa do texto: ao montar, com as fontes prontas e quando o palco muda
  useEffect(() => {
    const stage = stageRef.current?.parentElement;
    const hero = heroRef.current;
    if (!stage || !hero) return;
    const update = () => link.setTextBox(measureTextBox(stage, hero));
    update();
    document.fonts.ready.then(update);
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    observer.observe(hero);
    return () => observer.disconnect();
  }, [link, heroRef]);

  // As áreas acompanham os objetos (escrito direto no estilo, sem re-render)
  useEffect(() => {
    if (isStatic) return;
    link.setPositionsListener((positions) => {
      grabRefs.current.forEach((grab, index) => {
        if (!grab) return;
        const x = positions[index * 4];
        const y = positions[index * 4 + 1];
        const r = positions[index * 4 + 2];
        const canGrab = positions[index * 4 + 3] === 1;
        grab.style.transform = `translate(${x - r}px, ${y - r}px)`;
        grab.style.width = grab.style.height = `${r * 2}px`;
        grab.style.pointerEvents = canGrab ? "auto" : "none";
      });
    });
    return () => link.setPositionsListener(null);
  }, [link, isStatic]);

  // Ponteiro: pegar, mover e soltar
  useEffect(() => {
    if (isStatic) return;
    const stage = stageRef.current?.parentElement;
    if (!stage) return;
    const root = document.documentElement;
    let holding = false;
    let longPress: {
      timer: number;
      index: number;
      startX: number;
      startY: number;
      x: number;
      y: number;
    } | null = null;

    /** Coordenadas do evento no palco (= no canvas). */
    function toStage(event: PointerEvent) {
      const rect = stage!.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    }

    function grab(index: number, x: number, y: number) {
      holding = true;
      root.classList.add("grabbing");
      link.send({ op: "grab", index, x, y, t: performance.now() });
    }

    function handleDown(event: PointerEvent) {
      const index = grabRefs.current.indexOf(
        event.currentTarget as HTMLDivElement,
      );
      if (index === -1) return;
      const point = toStage(event);
      if (event.pointerType === "touch") {
        // Toque: só pega depois do long-press; antes disso, a página rola
        longPress = {
          index,
          startX: event.clientX,
          startY: event.clientY,
          ...point,
          timer: window.setTimeout(() => {
            if (!longPress) return;
            grab(longPress.index, longPress.x, longPress.y);
            navigator.vibrate?.(8);
            longPress = null;
          }, LONG_PRESS_MS),
        };
        return;
      }
      // Mouse e caneta: pega na hora, sem selecionar texto
      event.preventDefault();
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      grab(index, point.x, point.y);
    }

    function handleMove(event: PointerEvent) {
      if (longPress) {
        const moved = Math.hypot(
          event.clientX - longPress.startX,
          event.clientY - longPress.startY,
        );
        if (moved > LONG_PRESS_SLOP) {
          window.clearTimeout(longPress.timer);
          longPress = null;
        } else {
          Object.assign(longPress, toStage(event));
        }
        return;
      }
      if (!holding) return;
      const point = toStage(event);
      link.send({ op: "move", x: point.x, y: point.y, t: performance.now() });
    }

    function handleUp() {
      if (longPress) {
        window.clearTimeout(longPress.timer);
        longPress = null;
      }
      if (!holding) return;
      holding = false;
      root.classList.remove("grabbing");
      link.send({ op: "release" });
    }

    // Depois de pegar no toque, o dedo arrasta o objeto e não rola a página
    function handleTouchMove(event: TouchEvent) {
      if (holding) event.preventDefault();
    }

    const grabs = grabRefs.current.filter(Boolean) as HTMLDivElement[];
    grabs.forEach((element) =>
      element.addEventListener("pointerdown", handleDown),
    );
    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    document.addEventListener("touchmove", handleTouchMove, { passive: false });

    // Dica sem texto: no toque, o astronauta leva um empurrãozinho
    const nudgeTimer = window.matchMedia("(pointer: coarse)").matches
      ? window.setTimeout(() => link.send({ op: "nudge" }), NUDGE_DELAY_MS)
      : 0;

    return () => {
      grabs.forEach((element) =>
        element.removeEventListener("pointerdown", handleDown),
      );
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
      document.removeEventListener("touchmove", handleTouchMove);
      window.clearTimeout(nudgeTimer);
      if (longPress) window.clearTimeout(longPress.timer);
      root.classList.remove("grabbing");
    };
  }, [link, isStatic]);

  return (
    <div ref={stageRef} aria-hidden="true" className="contents">
      {!isStatic &&
        [0, 1, 2].map((index) => (
          <div
            key={index}
            ref={(element) => {
              grabRefs.current[index] = element;
            }}
            data-cursor="drag"
            // Começa sem tamanho e sem ponteiro até a 1ª posição chegar
            className="pointer-events-none absolute top-0 left-0 z-2 size-0 cursor-grab touch-pan-y rounded-full select-none"
          />
        ))}
    </div>
  );
}
