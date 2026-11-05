import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { navbar } from "../content/ui";
import { useHideOnScroll } from "../hooks/useHideOnScroll";
import { useIsOverUniverse } from "../hooks/useIsOverUniverse";
import { useQuality } from "../hooks/useQuality";
import Button from "./ui/Button";
import Container from "./ui/Container";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const scrolledDown = useHideOnScroll();
  // Sobre o Universe (só céu escuro atrás) a navbar dispensa o blur (A5)
  const overUniverse = useIsOverUniverse();
  const { settings } = useQuality();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLElement>(null);

  // Com o menu mobile aberto a navbar nunca some.
  const hidden = scrolledDown && !menuOpen;

  function closeMenu() {
    setMenuOpen(false);
  }

  // Menu aberto = modal (D20): trava o scroll da página, Esc fecha e o Tab
  // fica preso entre o botão X e os links do menu.
  useEffect(() => {
    if (!menuOpen) return;

    document.body.style.overflow = "hidden";

    // O resto da página fica inerte enquanto o menu cobre a tela (P5 S-D):
    // nem foco nem leitor de tela chegam lá
    const outside = [
      document.querySelector("main"),
      document.querySelector("footer"),
    ];
    outside.forEach((element) => {
      if (element) element.inert = true;
    });

    // Leva o foco para o primeiro link do menu. Espera um quadro: no
    // instante em que a classe muda, a transição de visibility ainda está
    // em "hidden" e o navegador recusa o foco (QA KB-04).
    const focusFrame = requestAnimationFrame(() => {
      overlayRef.current?.querySelector("a")?.focus();
    });

    /** O modal: o botão X (fechar) + os links do menu. O Tab fica entre eles. */
    function getFocusables(): HTMLElement[] {
      const links = overlayRef.current?.querySelectorAll("a") ?? [];
      const closeButton = menuButtonRef.current;
      return [...(closeButton ? [closeButton] : []), ...links];
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      if (event.key === "Tab") {
        const focusables = getFocusables();
        const current = focusables.indexOf(
          document.activeElement as HTMLElement,
        );
        const step = event.shiftKey ? -1 : 1;
        // Dá a volta: do último vai para o primeiro (e vice-versa)
        const next = (current + step + focusables.length) % focusables.length;
        event.preventDefault();
        focusables[next]?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.body.style.overflow = "";
      outside.forEach((element) => {
        if (element) element.inert = false;
      });
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  // Fecha o menu quando a tela passa a ter 860px ou mais (o menu mobile some).
  useEffect(() => {
    const media = window.matchMedia("(min-width: 860px)");

    function handleChange() {
      if (media.matches) setMenuOpen(false);
    }

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  return (
    <>
      <header
        ref={headerRef}
        // Com foco de TECLADO (:focus-visible) dentro, a navbar volta a aparecer (WCAG 2.4.11).
        // Foco de clique de mouse não conta, senão ela nunca mais sumiria (R2 I-1).
        className={`fixed inset-x-0 top-0 z-50 h-nav border-b border-line transition-transform duration-500 ${
          // Médio/Baixo: sem blur, fundo ink a 92%. Alto: blur só fora do Universe
          !settings.navbarBlur
            ? "bg-ink/92"
            : overUniverse
              ? "bg-ink/55"
              : "bg-ink/55 backdrop-blur-[20px] backdrop-saturate-180"
        } ${
          hidden
            ? "-translate-y-full has-[:focus-visible]:translate-y-0"
            : "translate-y-0"
        }`}
      >
        <Container className="flex h-full items-center justify-between">
          {/* Logo: quadrado dourado + "entony" */}
          <Link
            to="/#top"
            onClick={closeMenu}
            aria-label={navbar.logoLabel}
            className="flex items-center gap-2 font-mono text-small font-medium tracking-mono"
          >
            <span
              aria-hidden="true"
              className="size-2 bg-gold shadow-glow-gold"
            />
            {navbar.logo}
          </Link>

          {/* Links (desktop, a partir de 860px) */}
          <nav aria-label="Principal" className="hidden tab:block">
            <ul className="flex gap-8 text-menu text-nav">
              {navbar.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="opacity-80 transition-opacity duration-200 hover:opacity-100"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <Button size="sm" to={navbar.cta.to} onClick={closeMenu}>
              {navbar.cta.label}
            </Button>

            {/* Botão do menu (mobile, abaixo de 860px) */}
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-controls="menu-mobile"
              aria-label={
                menuOpen ? navbar.menuCloseLabel : navbar.menuOpenLabel
              }
              className="-mr-2 flex size-9 items-center justify-center rounded-full text-nav tab:hidden"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </Container>
      </header>

      {/* Menu mobile (D20): overlay de tela cheia, abaixo da barra.
          Fica sempre montado; "invisible" tira os links do Tab quando fechado. */}
      <nav
        ref={overlayRef}
        id="menu-mobile"
        aria-label="Principal"
        aria-hidden={!menuOpen}
        className={`fixed inset-0 z-40 h-svh bg-ink/92 pt-nav backdrop-blur-[20px] backdrop-saturate-180 tab:hidden ${
          // Abrir: visibility muda na hora (o 1º link precisa poder receber
          // foco já). Fechar: some só depois do fade de 200ms (QA KB-04).
          menuOpen
            ? "visible opacity-100 [transition:opacity_200ms]"
            : "invisible opacity-0 [transition:opacity_200ms,visibility_0s_linear_200ms]"
        }`}
      >
        <Container>
          <ul className="flex flex-col pt-4">
            {navbar.links.map((link, index) => (
              <li
                key={link.label}
                // Entrada em escada: cada item 40ms depois do anterior
                style={{
                  transitionDelay: menuOpen ? `${index * 40}ms` : "0ms",
                }}
                className={`border-b border-line transition-[opacity,translate] duration-400 ${
                  menuOpen
                    ? "translate-y-0 opacity-100"
                    : "translate-y-3 opacity-0"
                }`}
              >
                <Link
                  to={link.to}
                  onClick={closeMenu}
                  className="block py-4 text-menu-overlay text-paper"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </nav>
    </>
  );
}
