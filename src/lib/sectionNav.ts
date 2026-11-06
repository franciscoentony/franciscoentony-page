/*
 * Navegação para as seções da Home sem # na URL (pedido do Entony).
 *
 * Os links continuam com href="/#projetos" (abrir em nova aba e sem JS
 * funcionam), mas o clique normal é interceptado: rola até a seção e a URL
 * fica em "/". Uma URL com hash digitada ou compartilhada também funciona:
 * o ScrollToHash rola até a seção e depois limpa o hash.
 */

/** id da seção de um href da Home ("/#projetos" ou "#top" → "projetos"/"top"). */
export function sectionIdFromHref(href: string): string | null {
  const match = /^\/?#([\w-]+)$/.exec(href);
  return match ? match[1] : null;
}

/**
 * Rola até a seção e leva o foco para ela (sem rolar de novo), para o
 * leitor de tela e o teclado continuarem dali. O offset da nav vem do
 * scroll-padding-top do <html>. Com reduced motion, o pulo é instantâneo.
 */
export function scrollToSection(
  id: string,
  { smooth = true }: { smooth?: boolean } = {},
): boolean {
  const target = document.getElementById(id);
  if (!target) return false;
  target.scrollIntoView({
    behavior: smooth ? "smooth" : "instant",
    block: "start",
  });
  // Seções não recebem foco por padrão: tabIndex -1 deixa focar só via código
  if (!target.hasAttribute("tabindex")) target.tabIndex = -1;
  target.focus({ preventScroll: true });
  return true;
}

/** Tira o #hash da barra de endereço, mantendo o estado do React Router. */
export function cleanHashFromUrl() {
  const { pathname, search, hash } = window.location;
  if (!hash) return;
  window.history.replaceState(window.history.state, "", pathname + search);
}
