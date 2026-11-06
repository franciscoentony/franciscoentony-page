import type { MouseEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { scrollToSection, sectionIdFromHref } from "../lib/sectionNav";
import { useQuality } from "./useQuality";

/** Estado do router que pede para a Home rolar até uma seção ao abrir. */
export interface SectionState {
  section: string;
}

/**
 * Clique num link de seção da Home ("/#projetos") sem # na URL:
 * - na Home (ou num link da própria página, "#top"): rola até a seção
 *   (suave; instantâneo com reduced motion);
 * - em outra página: vai para "/" com a seção no state do router, e o
 *   ScrollToHash rola até ela quando as seções lazy montarem.
 * Cliques com Ctrl/⌘/Shift/Alt ou com o botão do meio seguem o href
 * normal (abrir em nova aba etc.).
 *
 * Uso: onClick={(event) => sectionClick(event, "/#projetos")}
 */
export function useSectionClick() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const smooth = useQuality().motion !== "reduced";

  return (event: MouseEvent, href: string) => {
    const id = sectionIdFromHref(href);
    if (!id || event.defaultPrevented) return;
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();

    // "#top" é da página atual (o "Topo" do rodapé); "/#..." é da Home
    const samePage = href.startsWith("#") || pathname === "/";
    if (samePage) {
      // Dois quadros: se o clique veio do menu do celular, ele fecha
      // primeiro (destrava o scroll da página e tira o inert do <main>)
      requestAnimationFrame(() =>
        requestAnimationFrame(() => scrollToSection(id, { smooth })),
      );
    } else {
      const state: SectionState = { section: id };
      navigate("/", { state });
    }
  };
}
