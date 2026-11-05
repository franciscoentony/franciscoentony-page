import { useEffect, useState, type ReactNode } from "react";
import { QualityContext } from "../hooks/useQuality";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import {
  GOVERNOR,
  QUALITY_SETTINGS,
  detectInitialQuality,
  lowerQuality,
  type Quality,
} from "../lib/quality";
import { onFrameDuration } from "../lib/ticker";

/** true se a seção Universe (com o pin) está aparecendo na tela. */
function isUniverseOnScreen(): boolean {
  const universe = document.getElementById("universe");
  if (!universe) return false;
  const rect = universe.getBoundingClientRect();
  return rect.bottom > 0 && rect.top < window.innerHeight;
}

/**
 * Decide e distribui o nível de qualidade (PERF-PLAN B1–B3).
 * - Nível inicial pela detecção do aparelho.
 * - Governador: se a média dos quadros passar de 40ms por 2s, desce um
 *   nível e não sobe mais nesta visita. Para Baixo só desce FORA do
 *   Universe (desligar o pin com a pessoa dentro dele causaria um pulo).
 * - Reduced motion: sempre Baixo + motion "reduced".
 * Também marca <html data-quality data-motion> (útil para o QA e para CSS).
 */
export function QualityProvider({ children }: { children: ReactNode }) {
  const reducedMotion = usePrefersReducedMotion();
  const [detected, setDetected] = useState<Quality>(detectInitialQuality);

  const quality: Quality = reducedMotion ? "baixo" : detected;
  const motion = reducedMotion ? "reduced" : "full";

  // Governador de FPS (só faz sentido enquanto ainda dá para descer)
  useEffect(() => {
    if (reducedMotion || detected === "baixo") return;

    let totalMs = 0;
    let frames = 0;

    return onFrameDuration((frameMs) => {
      // Pausas longas (aba trocada, debugger) não contam
      if (frameMs > 1000) return;
      totalMs += frameMs;
      frames++;
      if (totalMs < GOVERNOR.windowMs) return;

      const average = totalMs / frames;
      totalMs = 0;
      frames = 0;
      if (average <= GOVERNOR.maxAverageFrameMs) return;

      const next = lowerQuality(detected);
      // Para Baixo, espera a pessoa sair do Universe
      if (next === "baixo" && isUniverseOnScreen()) return;
      setDetected(next);
    });
  }, [detected, reducedMotion]);

  // Atributos no <html>
  useEffect(() => {
    document.documentElement.dataset.quality = quality;
    document.documentElement.dataset.motion = motion;
  }, [quality, motion]);

  return (
    <QualityContext.Provider
      value={{ quality, motion, settings: QUALITY_SETTINGS[quality] }}
    >
      {children}
    </QualityContext.Provider>
  );
}
