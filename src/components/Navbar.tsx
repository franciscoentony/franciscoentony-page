import { useEffect, useRef, useState, type FocusEvent } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { navbar } from "../content/ui";
import { useHideOnScroll } from "../hooks/useHideOnScroll";
import Button from "./ui/Button";
import Container from "./ui/Container";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const scrolledDown = useHideOnScroll();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Com o menu mobile aberto a navbar nunca some.
  const hidden = scrolledDown && !menuOpen;

  function closeMenu() {
    setMenuOpen(false);
  }

  // Fecha o menu com a tecla Esc e devolve o foco para o botão.
  useEffect(() => {
    if (!menuOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  // Fecha o menu ao clicar fora da navbar.
  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!headerRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
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

  // Fecha o menu quando o foco do teclado sai da navbar (Tab para fora).
  function handleBlur(event: FocusEvent<HTMLElement>) {
    const nextFocused = event.relatedTarget as Node | null;
    if (menuOpen && !event.currentTarget.contains(nextFocused)) {
      setMenuOpen(false);
    }
  }

  return (
    <header
      ref={headerRef}
      onBlur={handleBlur}
      // focus-within: com foco do teclado dentro, a navbar volta a aparecer (WCAG 2.4.11)
      className={`fixed inset-x-0 top-0 z-50 h-nav border-b border-line bg-ink/55 backdrop-blur-[20px] backdrop-saturate-180 transition-transform duration-500 ${
        hidden
          ? "-translate-y-full focus-within:translate-y-0"
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
            aria-label={menuOpen ? navbar.menuCloseLabel : navbar.menuOpenLabel}
            className="-mr-2 flex size-9 items-center justify-center rounded-full text-nav tab:hidden"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </Container>

      {/* Menu mobile: lista simples logo abaixo da barra */}
      {menuOpen && (
        <nav
          id="menu-mobile"
          aria-label="Principal"
          className="absolute inset-x-0 top-full border-b border-line bg-ink tab:hidden"
        >
          <Container>
            <ul className="flex flex-col py-3">
              {navbar.links.map((link) => (
                <li
                  key={link.label}
                  className="border-b border-line last:border-b-0"
                >
                  <Link
                    to={link.to}
                    onClick={closeMenu}
                    className="block py-3.5 text-lg text-paper"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </nav>
      )}
    </header>
  );
}
