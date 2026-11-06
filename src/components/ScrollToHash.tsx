import { useEffect, useLayoutEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import type { SectionState } from "../hooks/useSectionClick";
import { cleanHashFromUrl, scrollToSection } from "../lib/sectionNav";

/** Posição de scroll salva para cada entrada do histórico (location.key). */
const savedPositions = new Map<string, number>();

/**
 * O React Router não rola a página sozinho. Este componente resolve:
 * - link de seção vindo de outra página (state { section }, sem # na URL,
 *   veja useSectionClick) → rola até a seção;
 * - URL com âncora digitada ou compartilhada (ex.: "/#projetos") → rola até
 *   a seção e depois tira o # da URL (o Entony quer a URL limpa);
 * - URL sem âncora (ex.: "/blog") → volta para o topo;
 * - botão Voltar/Avançar (navegação "POP") → volta para a posição em que a
 *   pessoa estava naquela página.
 *
 * A restauração do Voltar é manual (history.scrollRestoration = "manual"):
 * o navegador tentava restaurar antes de as seções carregadas sob demanda
 * (React.lazy) terem a altura final, e a página ficava ~400px acima no
 * celular (RT-08). Aqui esperamos essas seções montarem e só então rolamos.
 * Não renderiza nada na tela.
 */
export default function ScrollToHash() {
  const location = useLocation();
  const navigationType = useNavigationType();

  // Guarda a posição de scroll ao SAIR de cada página. O cleanup do layout
  // effect roda antes de o React trocar o DOM pela página nova, então o
  // scrollY ainda é o da página que está saindo.
  useLayoutEffect(() => {
    window.history.scrollRestoration = "manual";
    const key = location.key;
    return () => {
      savedPositions.set(key, window.scrollY);
    };
  }, [location.key]);

  useEffect(() => {
    let frameId = 0;
    let attempts = 0;
    // Voltar/Avançar: a posição salva. Um hash na URL vence: como o hash é
    // sempre limpo depois de usado, um POP com hash é um #secao recém
    // digitado (inclusive estando já na Home, sem recarregar a página)
    const savedY =
      navigationType === "POP" && !location.hash
        ? savedPositions.get(location.key)
        : undefined;
    // Seção pedida por um link de outra página (só na ida, não no Voltar)
    const stateSection =
      navigationType === "POP"
        ? undefined
        : (location.state as SectionState | null)?.section;

    // Espera a página nova estar montada, incluindo as seções da Home que
    // chegam um pouco depois (React.lazy): tenta por até ~2s.
    function scrollToTarget() {
      const stillLoading = document.querySelector("[data-placeholder]");
      if (stillLoading && attempts < 120) {
        attempts++;
        frameId = requestAnimationFrame(scrollToTarget);
        return;
      }

      // Voltar/Avançar: posição em que a pessoa estava
      if (savedY !== undefined) {
        // Mais um quadro para o layout assentar depois do último lazy
        frameId = requestAnimationFrame(() =>
          window.scrollTo({ top: savedY, behavior: "instant" }),
        );
        return;
      }

      const sectionId =
        stateSection ??
        (location.hash ? decodeURIComponent(location.hash.slice(1)) : null);
      if (sectionId) {
        // A página acabou de abrir: pulo direto, sem animar várias telas
        if (scrollToSection(sectionId, { smooth: false })) {
          cleanHashFromUrl();
        } else if (attempts < 120) {
          attempts++;
          frameId = requestAnimationFrame(scrollToTarget);
        }
        return;
      }

      // POP sem posição salva (ex.: recarregou a página): não mexe
      if (navigationType === "POP") return;

      // "instant": sem herdar o scroll-behavior: smooth do <html> (QA I3)
      window.scrollTo({ top: 0, behavior: "instant" });
    }

    frameId = requestAnimationFrame(scrollToTarget);
    return () => cancelAnimationFrame(frameId);
  }, [
    location.pathname,
    location.hash,
    location.key,
    location.state,
    navigationType,
  ]);

  return null;
}
