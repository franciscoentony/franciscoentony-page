import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { contact, links, navbar, sectionIds } from "../content/ui";
import { useIsOverUniverse } from "../hooks/useIsOverUniverse";
import { useQuality } from "../hooks/useQuality";
import { NAVBAR, clamp } from "../lib/motion";
import CopyButton from "./ui/CopyButton";
import ExternalArrow from "./ui/ExternalArrow";

/**
 * Os 6 checkpoints do mapa de missão (adendo Home + Header, H1 e H5):
 * as 5 seções do menu + "Contato" (o fim da campanha).
 */
const CHECKPOINTS = [
  ...navbar.links.map((link) => ({ label: link.label, to: link.to })),
  { label: navbar.cta.label, to: navbar.cta.to },
];

/** id da seção da Home de cada checkpoint ("/#sobre" → "sobre", "/blog" → "blog"). */
const SECTION_IDS = CHECKPOINTS.map((checkpoint) =>
  checkpoint.to === "/blog"
    ? sectionIds.blog
    : checkpoint.to.slice(checkpoint.to.indexOf("#") + 1),
);

/** A seção atual é a última cujo topo passou desta fração da tela. */
const PROBE = 0.45;

/** Checkpoint atual fora da Home: o blog marca "Blog"; um projeto marca "Projetos". */
function checkpointForPage(pathname: string) {
  if (pathname.startsWith("/blog")) return SECTION_IDS.indexOf(sectionIds.blog);
  if (pathname.startsWith("/projetos"))
    return SECTION_IDS.indexOf(sectionIds.projects);
  return -1;
}

/** Quadrado do checkpoint: futuro vazado, feito em gold, atual em gold com brilho. */
function nodeClass(state: "done" | "current" | "future", size: string) {
  const base = `${size} shrink-0 border transition-[background-color,border-color,box-shadow] duration-500`;
  if (state === "current")
    return `${base} border-gold bg-gold shadow-glow-gold`;
  if (state === "done") return `${base} border-gold bg-gold`;
  return `${base} border-muted bg-checkpoint`;
}

/**
 * Header "mapa de missão" (adendo Home + Header, H1–H9).
 *
 * - Desktop: logo + 6 checkpoints ligados por trilhas. A trilha entre o
 *   checkpoint atual e o próximo se enche (gold → lavanda) conforme a
 *   leitura avança na seção.
 * - Estados: no topo, transparente; rolando, vidro; descendo (fora do
 *   hero), encolhe para 10px e fica só a trilha (o progresso não some);
 *   subindo, com hover ou com foco, volta cheio.
 * - Celular: logo + mini-mapa + botão de 2 linhas que viram X. O menu é uma
 *   folha modal com a trilha vertical da timeline e, no pé, e-mail, GitHub
 *   e LinkedIn.
 *
 * Desempenho: um listener de scroll passivo (agrupado por rAF) que só mexe
 * em transform das trilhas; o checkpoint atual e os estados são state (mudam
 * raramente).
 */
export default function Navbar() {
  const { pathname } = useLocation();
  const isHome = pathname === "/";
  const { settings } = useQuality();
  // Sobre o Universe (só céu escuro atrás) o vidro dispensa o blur (A5)
  const overUniverse = useIsOverUniverse();

  const [current, setCurrent] = useState(() => checkpointForPage(pathname));
  const [glass, setGlass] = useState(false);
  const [compact, setCompact] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // A folha entra com fade depois de aparecer (display) no quadro anterior
  const [sheetIn, setSheetIn] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const trailRefs = useRef<(HTMLElement | null)[]>([]);
  const sheetItemRefs = useRef<(HTMLLIElement | null)[]>([]);

  // ---------- Progresso e estados pelo scroll ----------
  useEffect(() => {
    let lastY = window.scrollY;
    let frame = 0;

    function update() {
      frame = 0;
      const y = window.scrollY;
      const probe = window.innerHeight * PROBE;
      let cur = checkpointForPage(pathname);
      let tops: number[] = [];

      if (isHome) {
        // Topo de cada seção na página (Infinity enquanto ela não existe)
        tops = SECTION_IDS.map((id) => {
          const section = document.getElementById(id);
          return section ? section.getBoundingClientRect().top + y : Infinity;
        });
        cur = -1;
        tops.forEach((top, index) => {
          if (top - probe <= y) cur = index;
        });
        // No fim da página, o atual é Contato
        const atEnd =
          window.innerHeight + y >= document.documentElement.scrollHeight - 4;
        if (atEnd) cur = CHECKPOINTS.length - 1;
      }

      // Trilhas: cheias antes do atual; a do atual vai de 0 a 1 até a próxima seção
      trailRefs.current.forEach((trail, index) => {
        if (!trail) return;
        let fill = index < cur ? 1 : 0;
        if (isHome && index === cur) {
          const span = (tops[index + 1] ?? Infinity) - tops[index];
          fill = Number.isFinite(span)
            ? clamp((y + probe - tops[index]) / span)
            : 0;
        }
        // A propriedade `scale` (não transform): a classe scale-x-0 do Tailwind v4
        // usa `scale`, que se multiplicaria com um transform e zeraria a trilha
        trail.style.scale = `${fill} 1`;
      });

      setCurrent(cur);
      setGlass(y > 8);

      // Compacto: só depois do hero (fora da Home: depois de 200px) e descendo
      const pastHero = isHome ? cur >= 0 : y > NAVBAR.hideAfter;
      if (!pastHero || y < lastY - 2) setCompact(false);
      else if (y > lastY + 2) setCompact(true);
      lastY = y;
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [pathname, isHome]);

  // Com o menu aberto, ou com hover/foco de teclado no header, ele nunca
  // fica compacto. Foco de clique não conta (senão ele não encolheria mais
  // depois de clicar num checkpoint, R2 I-1).
  const [hovering, setHovering] = useState(false);
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const isCompact = compact && !menuOpen && !hovering && !keyboardFocus;

  // A local nav das páginas v3 acompanha o header compacto (só CSS)
  useEffect(() => {
    const root = document.documentElement;
    if (isCompact) root.dataset.header = "compact";
    else delete root.dataset.header;
    return () => {
      delete root.dataset.header;
    };
  }, [isCompact]);

  // ---------- Menu do celular (folha modal, H8 e H9) ----------
  /** Abre/fecha. Ao fechar, a folha volta ao estado de antes do fade. */
  function toggleMenu(open: boolean) {
    setMenuOpen(open);
    if (!open) setSheetIn(false);
  }

  function closeMenu() {
    toggleMenu(false);
  }

  useEffect(() => {
    if (!menuOpen) return;

    document.body.style.overflow = "hidden";

    // O resto da página fica inerte enquanto a folha cobre a tela (P5 S-D)
    const outside = [
      document.querySelector("main"),
      document.querySelector("footer"),
      document.querySelector<HTMLElement>("[data-local-nav]"),
    ];
    outside.forEach((element) => {
      if (element) element.inert = true;
    });

    // Entra com fade e leva o foco ao 1º item da trilha
    const frame = requestAnimationFrame(() => {
      setSheetIn(true);
      sheetRef.current?.querySelector("a")?.focus();
    });

    /** O modal: o botão (fechar) + os itens da folha. O Tab fica entre eles. */
    function getFocusables(): HTMLElement[] {
      const items =
        sheetRef.current?.querySelectorAll<HTMLElement>("a, button") ?? [];
      const closeButton = menuButtonRef.current;
      return [...(closeButton ? [closeButton] : []), ...items];
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        toggleMenu(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (event.key === "Tab") {
        const focusables = getFocusables();
        const index = focusables.indexOf(document.activeElement as HTMLElement);
        const step = event.shiftKey ? -1 : 1;
        event.preventDefault();
        focusables[
          (index + step + focusables.length) % focusables.length
        ]?.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = "";
      outside.forEach((element) => {
        if (element) element.inert = false;
      });
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  // Fecha o menu quando a tela passa a ter 860px ou mais
  useEffect(() => {
    const media = window.matchMedia("(min-width: 860px)");
    function handleChange() {
      if (media.matches) toggleMenu(false);
    }
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  // Trilho cheio da folha: até o quadrado do item atual
  const sheetFillRef = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const item = current >= 0 ? sheetItemRefs.current[current] : null;
    if (sheetFillRef.current) {
      sheetFillRef.current.style.height = `${item ? item.offsetTop + 8 : 0}px`;
    }
  }, [current, menuOpen]);

  // Vidro: Baixo/Médio sem blur; Alto com blur só fora do Universe (A5)
  const glassClass = !settings.navbarBlur
    ? "bg-ink/92"
    : overUniverse
      ? "bg-ink/72"
      : "bg-ink/72 backdrop-blur-[20px] backdrop-saturate-180";
  const showGlass = glass || menuOpen;

  return (
    <>
      <header
        ref={headerRef}
        onPointerEnter={() => setHovering(true)}
        onPointerLeave={() => setHovering(false)}
        onFocus={(event) =>
          setKeyboardFocus(event.target.matches(":focus-visible"))
        }
        onBlur={() => setKeyboardFocus(false)}
        className={`fixed inset-x-0 top-0 z-50 h-nav border-b transition-[height,background-color,border-color] duration-500 ease-page ${
          showGlass ? `border-line ${glassClass}` : "border-transparent"
        } ${
          isCompact
            ? "tab:h-nav-compact tab:border-transparent tab:bg-transparent tab:backdrop-blur-none"
            : ""
        }`}
        data-compact={isCompact || undefined}
      >
        <div
          className={`mx-auto grid h-nav w-[min(1080px,calc(100%-48px))] grid-cols-[auto_1fr_auto] items-center gap-6 transition-transform duration-500 ease-page ${
            isCompact ? "tab:-translate-y-[25px]" : ""
          }`}
        >
          {/* Logo do Entony: "F." em accent com um leve brilho */}
          <Link
            to="/#top"
            onClick={closeMenu}
            aria-label={navbar.logoLabel}
            className={`flex items-center gap-1 text-lg font-bold tracking-[-0.025em] transition-opacity duration-300 ${
              isCompact ? "tab:pointer-events-none tab:opacity-0" : ""
            }`}
          >
            <span className="text-accent text-shadow-glow-accent">F.</span>
            Entony
          </Link>

          {/* Mapa de missão (a partir de 860px) */}
          <nav
            aria-label="Principal"
            className="hidden justify-self-center tab:block"
          >
            <ol className="flex items-center">
              {CHECKPOINTS.map((checkpoint, index) => {
                const state =
                  index === current
                    ? "current"
                    : index < current
                      ? "done"
                      : "future";
                return (
                  <li key={checkpoint.label} className="flex items-center">
                    <Link
                      to={checkpoint.to}
                      aria-current={
                        state === "current" ? "location" : undefined
                      }
                      className={`relative flex items-center gap-2.5 px-0.5 text-small tracking-[-0.005em] text-nav opacity-70 transition-opacity duration-300 hover:opacity-100 aria-[current]:text-white aria-[current]:opacity-100 ${
                        isCompact ? "py-2.5" : "py-3.5"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={nodeClass(state, "size-2")}
                      />
                      <span
                        className={`transition-opacity duration-300 ${
                          isCompact ? "opacity-0" : ""
                        }`}
                      >
                        {checkpoint.label}
                      </span>
                    </Link>

                    {/* Trilha até o próximo checkpoint */}
                    {index < CHECKPOINTS.length - 1 && (
                      <span
                        aria-hidden="true"
                        className={`relative mx-3 h-px w-[clamp(18px,3.2vw,48px)] overflow-hidden ${
                          isCompact ? "bg-trail-strong" : "bg-trail"
                        }`}
                      >
                        <span
                          ref={(element) => {
                            trailRefs.current[index] = element;
                          }}
                          className="absolute inset-0 origin-left scale-x-0 bg-linear-to-r from-gold to-accent-soft"
                        />
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

          {/* Celular: mini-mapa + botão do menu */}
          <div className="flex items-center gap-2 justify-self-end tab:hidden">
            <span aria-hidden="true" className="flex items-center gap-[3px]">
              {CHECKPOINTS.map((checkpoint, index) => (
                <span
                  key={checkpoint.label}
                  className={nodeClass(
                    index === current
                      ? "current"
                      : index < current
                        ? "done"
                        : "future",
                    "size-[5px]",
                  )}
                />
              ))}
            </span>

            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => toggleMenu(!menuOpen)}
              aria-expanded={menuOpen}
              aria-controls="menu-mobile"
              aria-label={
                menuOpen ? navbar.menuCloseLabel : navbar.menuOpenLabel
              }
              className="relative -mr-3 size-11 text-white"
            >
              {/* Duas linhas que viram X */}
              <span
                aria-hidden="true"
                className={`absolute top-[18px] left-3.5 h-[1.5px] w-4 rounded-[1px] bg-current transition-transform duration-450 ease-page ${
                  menuOpen ? "translate-y-[3px] rotate-45" : ""
                }`}
              />
              <span
                aria-hidden="true"
                className={`absolute top-6 left-3.5 h-[1.5px] w-4 rounded-[1px] bg-current transition-transform duration-450 ease-page ${
                  menuOpen ? "-translate-y-[3px] -rotate-45" : ""
                }`}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Menu do celular: folha modal com a trilha vertical da timeline */}
      <div
        ref={sheetRef}
        id="menu-mobile"
        role="dialog"
        aria-modal="true"
        aria-label={navbar.menuLabel}
        hidden={!menuOpen}
        className={`fixed inset-x-0 top-nav bottom-0 z-49 flex flex-col justify-between bg-ink/94 px-6 pt-7 pb-8 backdrop-blur-[20px] backdrop-saturate-180 transition-opacity duration-200 tab:hidden ${
          sheetIn ? "opacity-100" : "opacity-0"
        }`}
      >
        <nav aria-label="Principal">
          <ol className="relative pl-7.5">
            {/* Trilho de 1px e a parte cheia até o item atual */}
            <span
              aria-hidden="true"
              className="absolute top-3.5 bottom-3.5 left-[5px] w-px bg-trail"
            />
            <span
              ref={sheetFillRef}
              aria-hidden="true"
              className="absolute top-3.5 left-[5px] w-px bg-linear-to-b from-gold to-accent shadow-glow-gold"
            />
            {CHECKPOINTS.map((checkpoint, index) => (
              <li
                key={checkpoint.label}
                ref={(element) => {
                  sheetItemRefs.current[index] = element;
                }}
                className="relative"
              >
                <span
                  aria-hidden="true"
                  className={`absolute top-[19px] -left-7.5 ${nodeClass(
                    index === current
                      ? "current"
                      : index < current
                        ? "done"
                        : "future",
                    "size-[11px]",
                  )} ${index === current ? "shadow-glow-gold-lg" : ""}`}
                />
                <Link
                  to={checkpoint.to}
                  onClick={closeMenu}
                  aria-current={index === current ? "location" : undefined}
                  // Entrada em escada: cada item 40ms depois do anterior
                  style={{
                    transitionDelay: sheetIn ? `${index * 40}ms` : "0ms",
                  }}
                  className={`block py-1.5 text-menu-overlay text-white transition-[opacity,translate] duration-400 ease-page ${
                    sheetIn
                      ? "translate-y-0 opacity-100"
                      : "-translate-y-2 opacity-0"
                  }`}
                >
                  {checkpoint.label}
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        {/* Pé: e-mail (copia e decodifica), GitHub e LinkedIn */}
        <div className="flex flex-col items-start gap-3.5 text-body text-nav">
          <CopyButton
            value={links.email}
            idle={links.email}
            label={contact.copyEmailLabel}
            done={contact.emailCopied}
            failed={contact.copyFailed}
            className="text-white"
          />
          {[
            { label: contact.githubLink, href: links.github },
            { label: contact.linkedinLink, href: links.linkedin },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-300 hover:text-paper"
            >
              {link.label}
              <ExternalArrow />
              <span className="sr-only"> {links.newTabLabel}</span>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
