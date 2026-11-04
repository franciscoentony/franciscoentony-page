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

    // Espera um frame para a página nova estar montada.
    const frameId = requestAnimationFrame(() => {
      if (location.hash) {
        const id = decodeURIComponent(location.hash.slice(1));
        document.getElementById(id)?.scrollIntoView();
      } else {
        window.scrollTo(0, 0);
      }
    });

    return () => cancelAnimationFrame(frameId);
  }, [location.pathname, location.hash, location.key, navigationType]);

  return null;
}
