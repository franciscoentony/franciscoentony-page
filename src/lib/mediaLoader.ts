/*
 * Liga o skeleton ASCII das imagens (docs/redesign/SPEC-SKELETON-IMAGENS.md).
 *
 * Para cada moldura (.media-frame com uma <img> dentro):
 * - imagem já carregada (cache) → data-state="loaded" + data-instant (sem
 *   transição: nada pisca);
 * - ao entrar na tela (200px antes), se ainda não carregou → "loading"
 *   (a varredura do skeleton só roda aqui);
 * - load → "loaded" (depois do decode(), quando existir); error → "error".
 * Um único IntersectionObserver para todas as molduras.
 */

type FrameState = "loading" | "loaded" | "error";

/** O que fazer quando cada moldura entra na tela. */
const onVisible = new Map<Element, () => void>();

const observer =
  typeof IntersectionObserver !== "undefined"
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            observer?.unobserve(entry.target);
            onVisible.get(entry.target)?.();
            onVisible.delete(entry.target);
          });
        },
        { rootMargin: "200px" },
      )
    : null;

function setState(frame: HTMLElement, state: FrameState) {
  frame.dataset.state = state;
}

/** Imagem pronta para aparecer (decodificada quando o navegador permite). */
function whenDecoded(img: HTMLImageElement): Promise<void> {
  return img.decode ? img.decode().catch(() => undefined) : Promise.resolve();
}

/**
 * Começa a acompanhar uma moldura. Devolve a função que para (ao desmontar).
 */
export function watchMediaFrame(frame: HTMLElement): () => void {
  const img = frame.querySelector("img");
  if (!img) return () => {};

  let stopped = false;

  // Já está em cache: aparece direto, sem skeleton nem transição
  if (img.complete && img.naturalWidth > 0) {
    frame.dataset.instant = "";
    setState(frame, "loaded");
    return () => {};
  }

  function handleLoad() {
    whenDecoded(img!).then(() => {
      if (!stopped) setState(frame, "loaded");
    });
  }

  function handleError() {
    if (stopped) return;
    // O alt aparece sobre o tile parado (estado de erro do adendo v3)
    if (img!.alt) frame.dataset.alt = img!.alt;
    setState(frame, "error");
  }

  img.addEventListener("load", handleLoad, { once: true });
  img.addEventListener("error", handleError, { once: true });

  // Só marca "loading" (com varredura) quando a moldura chega perto da tela
  onVisible.set(frame, () => {
    if (stopped) return;
    if (img.complete && img.naturalWidth > 0) {
      frame.dataset.instant = "";
      setState(frame, "loaded");
    } else if (frame.dataset.state !== "loaded") {
      setState(frame, "loading");
    }
  });
  observer?.observe(frame);

  return () => {
    stopped = true;
    img.removeEventListener("load", handleLoad);
    img.removeEventListener("error", handleError);
    observer?.unobserve(frame);
    onVisible.delete(frame);
  };
}
