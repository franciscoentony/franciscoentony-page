import { useEffect, useRef, useState } from "react";
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

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 h-nav border-b border-line bg-ink/55 backdrop-blur-[20px] backdrop-saturate-180 transition-transform duration-500 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <Container className="flex h-full items-center justify-between">
        {/* Logo: quadrado dourado + "entony" */}
        <Link
          to="/#top"
          onClick={closeMenu}
          aria-label={navbar.logoLabel}
          className="flex items-center gap-2 font-mono text-[13px] font-medium tracking-[0.02em]"
        >
          <span aria-hidden="true" className="size-2 bg-gold shadow-glow-gold" />
          {navbar.logo}
        </Link>

        {/* Links (desktop, a partir de 860px) */}
        <nav aria-label="Principal" className="hidden tab:block">
          <ul className="flex gap-8 text-[12.5px] text-nav">
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
          className="absolute inset-x-0 top-full border-b border-line bg-ink/90 backdrop-blur-[20px] tab:hidden"
        >
          <Container>
            <ul className="flex flex-col py-3">
              {navbar.links.map((link) => (
                <li key={link.label} className="border-b border-line last:border-b-0">
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
