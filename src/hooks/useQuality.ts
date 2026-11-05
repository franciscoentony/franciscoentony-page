import { createContext, useContext } from "react";
import {
  QUALITY_SETTINGS,
  type Motion,
  type Quality,
  type QualitySettings,
} from "../lib/quality";

export interface QualityState {
  quality: Quality;
  motion: Motion;
  /** Parâmetros do nível atual (QUALITY_SETTINGS[quality]). */
  settings: QualitySettings;
}

/** Valor padrão (sem provider): nível Alto, movimento completo. */
export const QualityContext = createContext<QualityState>({
  quality: "alto",
  motion: "full",
  settings: QUALITY_SETTINGS.alto,
});

/**
 * Nível de qualidade e preferência de movimento atuais.
 *
 * Exemplo:
 *   const { quality, motion, settings } = useQuality();
 *   if (quality === "baixo") ... // desenha um quadro parado
 *   if (motion === "reduced") ... // sem animação nenhuma
 */
export function useQuality() {
  return useContext(QualityContext);
}
