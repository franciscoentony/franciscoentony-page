import { useEffect, useRef, useState } from "react";
import { player } from "../../content/ui";
import { useCanvasAnimation, type CanvasFrame } from "../../hooks/useCanvasAnimation";
import { useInView } from "../../hooks/useInView";
import { usePointer } from "../../hooks/usePointer";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { ASCII_FRAME_INTERVAL, ASCII_RAMP, PORTRAIT, clamp } from "../../lib/motion";
import { resolveAssetPath } from "../../utils/resolvePath";

const PHOTO_JPG = resolveAssetPath("/home/foto-entony.jpg");
const PHOTO_WEBP = resolveAssetPath("/home/foto-entony.webp");

/** Pixels da foto reduzida, usados para escolher o caractere ASCII de cada célula. */
interface PhotoSample {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  /** Proporção da moldura no momento da amostra (largura / altura). */
  ratio: number;
}

/**
 * Reduz a foto para ~120 colunas, recortando como object-fit: cover
 * com object-position: center 25% (o mesmo enquadramento da <img>).
 */
function samplePhoto(image: HTMLImageElement, ratio: number): PhotoSample | null {
  const width = 120;
  const height = Math.max(40, Math.round(width / ratio));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const imageRatio = image.width / image.height;
  let sourceX = 0;
  let sourceY = 0;
  let sourceW = image.width;
  let sourceH = image.height;

  if (imageRatio > ratio) {
    sourceW = image.height * ratio;
    sourceX = (image.width - sourceW) / 2;
  } else {
    sourceH = image.width / ratio;
    sourceY = (image.height - sourceH) * 0.25;
  }

  ctx.drawImage(image, sourceX, sourceY, sourceW, sourceH, 0, 0, width, height);
  return { data: ctx.getImageData(0, 0, width, height).data, width, height, ratio };
}

interface PortraitProps {
  /** true quando o mouse está sobre o card (liga a lente). */
  cardActive: boolean;
}

/**
 * Moldura da ficha: o ASCII da foto fica por baixo e a foto real entra por
 * cima depois de 1100ms (HANDOFF §4, "Foto na ficha"). Com o mouse em cima,
 * a "lente" abre um furo na foto e mostra o ASCII.
 */
export default function Portrait({ cardActive }: PortraitProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const pointer = usePointer();
  const reducedMotion = usePrefersReducedMotion();
  const inView = useInView(boxRef, { threshold: PORTRAIT.revealThreshold, once: true });
  const [revealed, setRevealed] = useState(false);

  const image = useRef<HTMLImageElement | null>(null);
  const sample = useRef<PhotoSample | null>(null);

  // Carrega a foto para fazer o ASCII
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      image.current = img;
    };
    img.src = PHOTO_WEBP;
  }, []);

  // Foto real entra 1100ms depois da moldura ficar 55% visível
  useEffect(() => {
    if (!inView) return;
    const timeoutId = window.setTimeout(() => setRevealed(true), PORTRAIT.revealDelay);
    return () => window.clearTimeout(timeoutId);
  }, [inView]);

  function draw({ ctx, width, height, time, isStatic }: CanvasFrame) {
    ctx.clearRect(0, 0, width, height);
    if (!image.current || width === 0 || height === 0) return;

    // Refaz a amostra se a moldura mudou de proporção
    const ratio = width / height;
    if (!sample.current || Math.abs(sample.current.ratio - ratio) > 0.01) {
      sample.current = samplePhoto(image.current, ratio);
    }
    const photo = sample.current;
    if (!photo) return;

    // Posição do mouse dentro da moldura (0 a 1), usada também pela lente
    const rect = ctx.canvas.getBoundingClientRect();
    const mouseX = (pointer.current.x - rect.left) / rect.width;
    const mouseY = (pointer.current.y - rect.top) / rect.height;
    boxRef.current?.style.setProperty("--px", `${mouseX * 100}%`);
    boxRef.current?.style.setProperty("--py", `${mouseY * 100}%`);

    ctx.font = '600 8px "Geist Mono", monospace';
    ctx.textBaseline = "top";
    const cellWidth = 5.2;
    const cellHeight = 8;
    const cols = Math.ceil(width / cellWidth);
    const rows = Math.ceil(height / cellHeight);
    const wave = isStatic ? 0 : time;

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const u = i / cols;
        const v = j / rows;
        const px = Math.min(photo.width - 1, Math.floor(u * photo.width));
        const py = Math.min(photo.height - 1, Math.floor(v * photo.height));
        const o = (py * photo.width + px) * 4;
        const luminance = (photo.data[o] * 0.3 + photo.data[o + 1] * 0.59 + photo.data[o + 2] * 0.11) / 255;
        let bright = Math.pow(luminance, 0.85) * 1.1;

        // Fica mais claro perto do mouse
        const distance = Math.hypot(u - mouseX, v - mouseY);
        if (bright > 0.05) bright += Math.max(0, 0.25 - distance) * 1.2;
        bright = clamp(bright);
        if (!isStatic) bright *= 0.85 + Math.sin(wave * 0.004 + j * 0.5) * 0.08;
        if (bright < 0.06) continue;

        const hue = 250 + u * 40 + Math.sin(wave * 0.001) * 20;
        ctx.fillStyle = `hsla(${hue},90%,${55 + bright * 35}%,${0.4 + bright * 0.6})`;
        ctx.fillText(ASCII_RAMP[Math.round(bright * (ASCII_RAMP.length - 1))], i * cellWidth, j * cellHeight);
      }
    }
  }

  const canvasRef = useCanvasAnimation(draw, { frameInterval: ASCII_FRAME_INTERVAL });
  const showPhoto = revealed || reducedMotion;

  return (
    <div
      ref={boxRef}
      className="relative my-4 flex-1 overflow-hidden rounded-portrait border border-line bg-void"
    >
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 size-full" />

      <picture>
        <source srcSet={PHOTO_WEBP} type="image/webp" />
        <img
          src={PHOTO_JPG}
          alt={player.card.photoAlt}
          width={760}
          height={1351}
          className={`absolute inset-0 size-full object-cover object-[center_25%] brightness-96 contrast-104 saturate-92 [transition:opacity_1.4s_var(--ease-smooth),scale_1.6s_var(--ease-smooth)] ${
            showPhoto ? "scale-100 opacity-100" : "scale-104 opacity-0"
          } ${showPhoto && cardActive ? "portrait-lens" : ""}`}
        />
      </picture>

      {/* Escurece um pouco a parte de baixo da foto */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent from-55% to-void/55"
      />
    </div>
  );
}
