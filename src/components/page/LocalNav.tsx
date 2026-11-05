import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { Link } from "react-router-dom";
import { useHideOnScroll } from "../../hooks/useHideOnScroll";
import { useQuality } from "../../hooks/useQuality";
import { clamp } from "../../lib/motion";

interface LocalNavProps {
  /** Nome da seção ("Blog" / "Projetos"). É o link de volta. */
  section: string;
  /** Para onde o nome da seção leva. */
  sectionTo: string;
  /** Título que aparece ao lado da seção depois que o h1 sai da tela. */
  title?: string;
  /** O h1 da página (para saber quando ele saiu da tela). */
  titleRef?: RefObject<HTMLElement | null>;
  /** O trecho cuja leitura enche o filete de baixo (o <article> do post). */
  readRef?: RefObject<HTMLElement | null>;
  /** Ações à direita (Copiar link; GitHub e Ver no ar). */
  children?: ReactNode;
}

/** A partir de onde o h1 conta como "fora da tela" (px do topo). */
const TITLE_GONE_AT = 100;

/**
 * Local nav das páginas de post e projeto (adendo v3), como na Apple:
 * - fixa abaixo da navbar; quando a navbar some ao descer, ela sobe para o topo;
 * - o nome da seção é o "voltar";
 * - depois que o h1 sai da tela, o título aparece ao lado (cabeçalho corrente);
 * - o filete de baixo (1px) se enche de dourado → lavanda conforme a leitura.
 */
export default function LocalNav({
  section,
  sectionTo,
  title,
  titleRef,
  readRef,
  children,
}: LocalNavProps) {
  const navHidden = useHideOnScroll();
  const { settings } = useQuality();
  const [pastTitle, setPastTitle] = useState(false);
  const barRef = useRef<HTMLSpanElement>(null);

  // Um listener de scroll (passivo) cuida do título e do filete.
  // O filete é escrito direto no estilo (só transform, sem re-render).
  useEffect(() => {
    function update() {
      const heading = titleRef?.current;
      if (heading) {
        setPastTitle(heading.getBoundingClientRect().bottom < TITLE_GONE_AT);
      }
      const read = readRef?.current;
      if (read && barRef.current) {
        const rect = read.getBoundingClientRect();
        const progress = clamp(
          -rect.top / Math.max(1, rect.height - window.innerHeight),
        );
        barRef.current.style.transform = `scaleX(${progress})`;
      }
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [titleRef, readRef]);

  return (
    <div
      data-local-nav
      // z-30: acima da página e abaixo do menu do celular (z-40) e da navbar (z-50)
      className={`fixed inset-x-0 top-nav z-30 h-lnav transition-transform duration-500 ease-page ${
        settings.navbarBlur
          ? "bg-ink/72 backdrop-blur-[20px] backdrop-saturate-180"
          : "bg-ink/92"
      } ${navHidden ? "-translate-y-nav" : "translate-y-0"}`}
    >
      <nav
        aria-label={section}
        className="mx-auto flex h-full w-[min(1080px,calc(100%-48px))] items-center justify-between gap-4"
      >
        <Link
          to={sectionTo}
          className="inline-flex min-w-0 items-baseline gap-2.5 text-local-nav text-paper"
        >
          {section}
          {title && (
            <span
              aria-hidden="true"
              className={`hidden max-w-[46ch] truncate text-body-sm font-normal tracking-[-0.01em] text-secondary transition-[opacity,translate] duration-400 ease-page sm:inline ${
                pastTitle
                  ? "translate-y-0 opacity-100"
                  : "translate-y-1 opacity-0"
              }`}
            >
              {title}
            </span>
          )}
        </Link>
        <div className="flex shrink-0 items-center gap-4 text-small text-prose sm:gap-5.5">
          {children}
        </div>
      </nav>

      {/* Filete de 1px: a linha da borda e, por cima, o progresso da leitura */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px bg-line"
      >
        {readRef && (
          <span
            ref={barRef}
            className="absolute inset-0 origin-left scale-x-0 bg-linear-to-r from-gold to-accent-soft"
          />
        )}
      </span>
    </div>
  );
}
