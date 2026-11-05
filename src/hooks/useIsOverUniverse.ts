import { useEffect, useState } from "react";

/**
 * true enquanto a navbar está sobre a seção Universe (topo da Home).
 * Ali o fundo é só céu escuro, então a navbar não precisa do backdrop-blur,
 * que é caro sobre canvases animados (PERF-PLAN A5).
 */
export function useIsOverUniverse(): boolean {
  const [overUniverse, setOverUniverse] = useState(false);

  useEffect(() => {
    function update() {
      const universe = document.getElementById("universe");
      if (!universe) {
        setOverUniverse(false);
        return;
      }
      const universeEnd = universe.offsetTop + universe.offsetHeight;
      // 48px = altura da navbar
      setOverUniverse(window.scrollY + 48 < universeEnd);
    }

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return overUniverse;
}
