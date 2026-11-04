import { useEffect } from "react";

/**
 * Atualiza o título da aba e a meta description da página atual.
 *
 * Exemplo:
 *   usePageMeta("Blog · Francisco Entony", "Anotações sobre código...");
 */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title;

    if (description) {
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute("content", description);
    }
  }, [title, description]);
}
