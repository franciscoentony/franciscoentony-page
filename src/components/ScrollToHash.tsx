import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * O React Router não rola a página sozinho. Este componente resolve:
 * - URL com âncora (ex.: "/#projetos") → rola até a seção com esse id;
 * - URL sem âncora (ex.: "/blog") → volta para o topo.
 * Não renderiza nada na tela.
 */
export default function ScrollToHash() {
  const location = useLocation();

  useEffect(() => {
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
  }, [location.pathname, location.hash, location.key]);

  return null;
}
