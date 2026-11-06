import { useQuality } from "../../hooks/useQuality";
import { resolveAssetPath } from "../../utils/resolvePath";

// Textura de ruído em PNG (128px, ~8 KB), repetida pela tela.
// Antes era um SVG com filtro feTurbulence, que o navegador recalculava ao
// animar. Com um PNG e animação só de transform, o compositor da GPU move
// a camada sem repintar a página (PERF-PLAN A5).
const grainUrl = `url("${resolveAssetPath("/textures/grain.png")}")`;

/** Camada de grão a 5% de opacidade, animada em 4 passos (HANDOFF §2). */
export default function Grain() {
  // Parado nos níveis Médio e Baixo
  const { settings } = useQuality();

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed -inset-1/2 z-40 opacity-5 ${
        settings.grainAnimated ? "animate-grain" : ""
      }`}
      style={{ backgroundImage: grainUrl }}
    />
  );
}
