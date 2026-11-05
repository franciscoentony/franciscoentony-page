import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { useQuality } from "../../hooks/useQuality";
import { HOLO } from "../../lib/motion";

interface HoloCardProps {
  children: ReactNode;
  /** Classes do elemento de fora (tamanho, proporção...). */
  className?: string;
  /** Classes do "corpo" do card (padding, flex...). */
  innerClassName?: string;
  /** Avisa quando o mouse entra (true) ou sai (false) do card. */
  onActiveChange?: (active: boolean) => void;
}

/**
 * Card holográfico (HANDOFF §4): inclina em 3D seguindo o mouse, com
 * camadas de foil iridescente, scanlines e brilho.
 *
 * Como funciona: no pointermove calculamos a posição do mouse dentro do card
 * (x e y de 0 a 1) e gravamos em variáveis CSS (--mx, --my, --rx, --ry, --o).
 * As classes holo-tilt, holo-foil, holo-lines e holo-glare (index.css) usam
 * essas variáveis. Assim não há re-render a cada movimento do mouse.
 */
export default function HoloCard({
  children,
  className = "",
  innerClassName = "",
  onActiveChange,
}: HoloCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const { quality, settings } = useQuality();
  // Nível Baixo (e reduced motion): sem tilt; o hover é só borda e sombra
  const noTilt = quality === "baixo";

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    // Só com mouse: no toque o card fica parado
    if (event.pointerType !== "mouse" || !cardRef.current) return;
    // Com reduced motion o card fica parado (R2 I-4)
    if (noTilt) return;

    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const distanceFromCenter = Math.hypot(x - 0.5, y - 0.5);

    card.style.setProperty("--mx", `${x * 100}%`);
    card.style.setProperty("--my", `${y * 100}%`);
    card.style.setProperty("--rx", `${(0.5 - y) * HOLO.tiltX}deg`);
    card.style.setProperty("--ry", `${(x - 0.5) * HOLO.tiltY}deg`);
    card.style.setProperty(
      "--o",
      `${Math.min(1, distanceFromCenter * 1.6 + 0.3)}`,
    );

    if (!active) {
      setActive(true);
      onActiveChange?.(true);
    }
  }

  function handlePointerLeave() {
    const card = cardRef.current;
    if (!card) return;

    card.style.setProperty("--mx", "50%");
    card.style.setProperty("--my", "50%");
    card.style.setProperty("--rx", "0deg");
    card.style.setProperty("--ry", "0deg");
    card.style.setProperty("--o", "0");

    setActive(false);
    onActiveChange?.(false);
  }

  return (
    <div
      ref={cardRef}
      data-cursor="holo"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`perspective-[900px] ${className}`}
    >
      <div
        className={`holo-tilt relative h-full overflow-hidden rounded-lg border border-line-holo bg-linear-160 from-holo-from to-holo-to to-60% ${
          active
            ? "shadow-card-active [transition:transform_80ms_linear,box-shadow_400ms]"
            : `shadow-card [transition:transform_600ms_var(--ease-smooth),box-shadow_600ms_var(--ease-smooth),border-color_300ms] ${
                noTilt
                  ? "hover:border-line-strong hover:shadow-card-active"
                  : ""
              }`
        } ${innerClassName}`}
      >
        {children}

        {/* Camadas de efeito (decorativas) */}
        <div
          aria-hidden="true"
          // Médio: foil sem mix-blend-mode (camada simples, mais barata)
          className={`${settings.foilBlend ? "holo-foil" : "holo-foil-flat"} pointer-events-none absolute inset-0`}
        />
        <div
          aria-hidden="true"
          className="holo-lines pointer-events-none absolute inset-0"
        />
        <div
          aria-hidden="true"
          className="holo-glare pointer-events-none absolute inset-0"
        />
      </div>
    </div>
  );
}
