import { createContext, useContext } from "react";

export interface ToastMessage {
  /** Texto curto em destaque, em dourado (ex.: "+1"). */
  badge?: string;
  text: string;
}

/** Guarda a função que mostra o toast. Quem fornece é o <ToastProvider>. */
export const ToastContext = createContext<(message: ToastMessage) => void>(
  () => {},
);

/**
 * Mostra um toast de qualquer componente (precisa estar dentro do <ToastProvider>).
 *
 * Exemplo:
 *   const showToast = useToast();
 *   showToast({ badge: "+1", text: "E-mail copiado para o inventário" });
 */
export function useToast() {
  return useContext(ToastContext);
}
