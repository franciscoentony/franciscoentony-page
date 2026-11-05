import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * O React Router não rola a página sozinho. Este componente resolve:
 * - URL com âncora (ex.: "/#projetos") → rola até a seção com esse id;
 * - URL sem âncora (ex.: "/blog") → volta para o topo;
 * - botão Voltar/Avançar (navegação "POP") sem âncora → não mexe,
 *   para o navegador manter a posição onde a pessoa estava.
 * Não renderiza nada na tela.
 */
export default function ScrollToHash() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === "POP" && !location.hash) return;

    let frameId = 0;
    let attempts = 0;

    // Espera a página nova estar montada. Algumas seções da Home chegam um
    // pouco depois (React.lazy), então tentamos achar a âncora por até ~2s.
    function scrollToTarget() {
      if (!location.hash) {
        // "instant": sem herdar o scroll-behavior: smooth do <html> (QA I3)
        window.scrollTo({ top: 0, behavior: "instant" });
        return;
      }
      const id = decodeURIComponent(location.hash.slice(1));
      const target = document.getElementById(id);
      // Espera também as seções lazy chegarem (senão a página "cresce" depois
      // do scroll e a âncora sai do lugar)
      const stillLoading = document.querySelector("[data-placeholder]");
      if (target && !stillLoading) {
        target.scrollIntoView();
      } else if (attempts < 120) {
        attempts++;
        frameId = requestAnimationFrame(scrollToTarget);
      }
    }

    frameId = requestAnimationFrame(scrollToTarget);
    return () => cancelAnimationFrame(frameId);
  }, [location.pathname, location.hash, location.key, navigationType]);

  return null;
}
