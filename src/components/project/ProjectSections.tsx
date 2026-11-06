import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { links, projectPage } from "../../content/ui";
import { projectSlug, type Project } from "../../data/projects";
import { useQuality } from "../../hooks/useQuality";
import { getProjectShape } from "../../lib/asciiShapes";
import { decodeText } from "../../lib/decodeText";
import { watchMediaFrame } from "../../lib/mediaLoader";
import { ASCII_RAMP } from "../../lib/motion";
import { resolveAssetPath } from "../../utils/resolvePath";
import CopyButton from "../ui/CopyButton";
import ExternalArrow from "../ui/ExternalArrow";
import { LiveEmblem, StillEmblem } from "./ProjectEmblem";

/** Largura do conteúdo: 1080px, com 24px de respiro no celular. */
const wrap = "mx-auto w-[min(1080px,calc(100%-48px))]";

/** Pill branca (o botão da Home), usada no "Ver no ar". */
const pill =
  "inline-flex rounded-full bg-paper font-medium text-ink transition-transform duration-400 ease-page hover:scale-[1.03]";

/** Link de texto com o sublinhado lavanda no hover. */
const textLink =
  "decoration-accent-soft/60 underline-offset-[0.22em] hover:underline";

/** Nome do repositório com quebra permitida depois do 1º hífen ("franciscoentony-/page"). */
function BreakableName({ name }: { name: string }) {
  const cut = name.indexOf("-");
  if (cut === -1) return <>{name}</>;
  return (
    <>
      {name.slice(0, cut + 1)}
      <wbr />
      {name.slice(cut + 1)}
    </>
  );
}

/** Estrela (missão principal) e losango (secundária), em SVG. */
function RankIcon({ main }: { main: boolean }) {
  return (
    <svg viewBox="0 0 14 14" aria-hidden="true" className="size-3.5">
      {main ? (
        <path
          fill="currentColor"
          d="M7 .8l1.8 4 4.4.4-3.3 2.9 1 4.3L7 10.1l-3.9 2.3 1-4.3L.8 5.2l4.4-.4z"
        />
      ) : (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          d="M7 1.5 12.5 7 7 12.5 1.5 7z"
        />
      )}
    </svg>
  );
}

/** "GitHub ↗" (externo, abre em nova aba). */
export function GitHubLink({
  project,
  className = "",
}: {
  project: Project;
  className?: string;
}) {
  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {projectPage.github}
      <ExternalArrow />
      <span className="sr-only"> {links.newTabLabel}</span>
    </a>
  );
}

/** "Ver no ar" (pill branca). Some sem demoUrl. */
export function DemoPill({
  project,
  className = "",
}: {
  project: Project;
  className?: string;
}) {
  if (!project.demoUrl) return null;
  return (
    <a
      href={project.demoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`${pill} ${className}`}
    >
      {projectPage.demo}
      <span className="sr-only"> {links.newTabLabel}</span>
    </a>
  );
}

// ---------------------------------------------------------------------------

/**
 * Hero: o nome em escala de produto, o selo de missão (D2), a tagline, a
 * ficha (período, papel, status) e os links. O emblema ASCII, sem moldura,
 * sangra até a borda direita da janela (a partir de 860px).
 */
export function ProjectHero({
  project,
  isMain,
  titleRef,
}: {
  project: Project;
  isMain: boolean;
  titleRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const facts = [
    { label: projectPage.facts.period, value: project.period },
    { label: projectPage.facts.role, value: project.role },
    { label: projectPage.facts.status, value: project.status },
  ].filter((fact) => fact.value);

  return (
    <section
      className={`${wrap} grid items-center gap-12 pt-6 pb-12 tab:min-h-[min(calc(100svh-100px),820px)] tab:grid-cols-[1.1fr_0.9fr] tab:py-12`}
    >
      <div>
        <h1 ref={titleRef} className="text-project-title">
          <BreakableName name={project.name} />
        </h1>
        <p
          className={`mt-4 flex items-center gap-2.5 font-dot text-lg font-extrabold ${
            isMain ? "text-gold" : "text-accent-soft"
          }`}
        >
          <RankIcon main={isMain} />
          {isMain ? projectPage.rankMain : projectPage.rankSide}
        </p>
        <p className="mt-6 max-w-[26em] text-intro text-pretty text-secondary">
          {project.tagline || project.description}
        </p>

        {/* Ficha: o dado manda (19px) e o rótulo explica embaixo (14px) */}
        {facts.length > 0 && (
          <dl className="mt-10 grid grid-cols-2 justify-start gap-x-8 gap-y-4 tab:grid-cols-[repeat(3,auto)] tab:gap-x-12 tab:gap-y-3">
            {facts.map((fact) => (
              <div key={fact.label} className="flex flex-col-reverse">
                <dt className="mt-0.5 text-caption text-secondary">
                  {fact.label}
                </dt>
                <dd className="text-fact text-paper">{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-7 text-body">
          <DemoPill project={project} className="px-5.5 py-2.75" />
          <GitHubLink project={project} className={textLink} />
        </div>
      </div>

      {/* O emblema vem antes do texto no celular; no desktop sangra à direita */}
      <div className="-order-1 tab:order-none tab:-mr-[calc((100vw-min(1080px,100vw-48px))/2)]">
        <LiveEmblem
          shape={getProjectShape(project.name)}
          className="h-[300px] tab:h-[clamp(320px,44vw,560px)]"
        />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

/** Uma tela (print) com skeleton e legenda. */
function Screen({
  screen,
}: {
  screen: NonNullable<Project["screens"]>[number];
}) {
  const frameRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!frameRef.current) return;
    return watchMediaFrame(frameRef.current);
  }, [screen.src]);

  return (
    <figure
      className="min-w-0"
      style={{ flex: `${screen.width / screen.height} 1 0` }}
    >
      <span
        ref={frameRef}
        className="media-frame photo"
        style={{ aspectRatio: `${screen.width} / ${screen.height}` }}
      >
        <span className="media-skel" aria-hidden="true" />
        <img
          src={resolveAssetPath(screen.src)}
          alt={screen.alt}
          width={screen.width}
          height={screen.height}
          loading="lazy"
          decoding="async"
        />
      </span>
      {screen.caption && (
        <figcaption className="fig-caption">{screen.caption}</figcaption>
      )}
    </figure>
  );
}

/** Telas: a 1ª em largura total; as seguintes em par, com alturas iguais. */
export function ProjectScreens({ project }: { project: Project }) {
  const screens = project.screens ?? [];
  if (screens.length === 0) return null;
  const [first, ...rest] = screens;

  return (
    <section aria-labelledby="telas" className={`${wrap} mt-10`}>
      <h2 id="telas" className="text-section-title">
        {projectPage.screensTitle}
      </h2>
      <div className="mt-7">
        <Screen screen={first} />
      </div>
      {rest.length > 0 && (
        <div className="mt-7 flex flex-col gap-7 sm:flex-row sm:gap-3">
          {rest.map((screen) => (
            <Screen key={screen.src} screen={screen} />
          ))}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------

/** Glifos aleatórios do tamanho do texto (estado antes de decodificar). */
function glyphsLike(text: string) {
  return Array.from(text, (char) =>
    char === " "
      ? " "
      : ASCII_RAMP[1 + Math.floor(Math.random() * (ASCII_RAMP.length - 1))],
  ).join("");
}

/**
 * Número dos resultados em Doto 900: chega dos glifos ASCII para a forma
 * quando entra na tela (uma vez). No Baixo/RM, o número aparece direto.
 */
function DecodingNumber({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isStatic = useQuality().quality === "baixo";

  // Antes do primeiro paint: glifos no lugar do número (se for animar)
  useLayoutEffect(() => {
    if (!isStatic && ref.current) ref.current.textContent = glyphsLike(value);
  }, [value, isStatic]);

  useEffect(() => {
    const element = ref.current;
    if (!element || isStatic) return;
    let stop = () => {};
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        stop = decodeText(element, value, 900);
      },
      { threshold: 0.6 },
    );
    observer.observe(element);
    return () => {
      observer.disconnect();
      stop();
      element.textContent = value;
    };
  }, [value, isStatic]);

  return (
    <b className="font-dot text-[1.25em] leading-none font-black tracking-normal text-paper">
      {/* O leitor de tela lê o número limpo; os glifos são só visuais */}
      <span className="sr-only">{value}</span>
      <span ref={ref} aria-hidden="true">
        {value}
      </span>
    </b>
  );
}

/**
 * Resultados: uma frase em escala de manchete, com os números em Doto
 * ("3 ONGs testando..., 120 animais... e 1 semana de piloto.").
 */
export function ProjectResults({ project }: { project: Project }) {
  const results = project.results ?? [];
  if (results.length === 0) return null;

  return (
    <p className={`${wrap} mt-30 text-results text-balance text-secondary`}>
      <span className="block max-w-[24ch]">
        {results.map((result, index) => (
          <span key={result.label}>
            {index > 0 && (index === results.length - 1 ? " e " : ", ")}
            <DecodingNumber value={result.value} /> {result.label}
          </span>
        ))}
        .
      </span>
    </p>
  );
}

// ---------------------------------------------------------------------------

/**
 * Capítulos: título à esquerda (sticky) e texto à direita. O título do
 * capítulo que está no meio da tela acende (secondary → branco), só um por
 * vez. Abaixo de 860px, e no Baixo/RM, os títulos ficam sempre brancos.
 */
export function ProjectChapters({ project }: { project: Project }) {
  const chapters = project.chapters ?? [];
  const isStatic = useQuality().quality === "baixo";
  const listRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list || isStatic) return;
    const items = Array.from(list.children);
    const inside = new Set<number>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = items.indexOf(entry.target);
          if (entry.isIntersecting) inside.add(index);
          else inside.delete(index);
        });
        // Só um acende: o mais abaixo entre os que estão na faixa do meio
        setActive(inside.size ? Math.max(...inside) : null);
      },
      { rootMargin: "-40% 0px -40% 0px" },
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, [chapters.length, isStatic]);

  if (chapters.length === 0) return null;

  return (
    <section ref={listRef} className={`${wrap} mt-30`}>
      {chapters.map((chapter, index) => (
        <div
          key={chapter.title}
          className="grid grid-cols-1 gap-4 py-8 tab:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] tab:gap-16 tab:py-14"
        >
          <h2
            className={`text-section-title text-paper transition-colors duration-600 ease-page tab:sticky tab:top-[calc(var(--spacing-nav)+var(--spacing-lnav)+40px)] tab:self-start ${
              isStatic || active === index ? "" : "tab:text-secondary"
            }`}
          >
            {chapter.title}
          </h2>
          <div className="space-y-[1.1em] text-reading-sm text-pretty text-prose tab:text-reading">
            {chapter.text.split(/\n\s*\n/).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

// ---------------------------------------------------------------------------

/**
 * Ficha técnica: linhas com pontos-guia (rótulo ······ valor), como um
 * sumário impresso. Sem `specs`: Linguagem + Ferramentas.
 */
export function ProjectSpecs({ project }: { project: Project }) {
  const specs = project.specs?.length
    ? project.specs
    : [
        { label: projectPage.specsLanguage, value: project.language },
        { label: projectPage.specsTools, value: project.topics.join(", ") },
      ];

  return (
    <section aria-labelledby="ficha" className={`${wrap} mt-30`}>
      <h2 id="ficha" className="text-section-title">
        {projectPage.specsTitle}
      </h2>
      <dl className="mt-7 max-w-[720px]">
        {specs.map((spec) => (
          <div
            key={spec.label}
            className="flex items-baseline gap-3 py-3 text-body after:order-2 after:h-px after:min-w-6 after:flex-1 after:-translate-y-1 after:border-b-2 after:border-dotted after:border-white/22 after:content-['']"
          >
            <dt className="whitespace-nowrap text-paper">{spec.label}</dt>
            <dd className="order-3 text-right text-prose">{spec.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// ---------------------------------------------------------------------------

/** Código-fonte: a linha que um dev realmente usa + "Copiar". */
export function CloneLine({ project }: { project: Project }) {
  const command = `git clone ${project.url}.git`;
  return (
    <div className={`${wrap} mt-30 flex flex-wrap items-center gap-4`}>
      {/* Quebra a linha em vez de rolar: uma área rolável precisaria de foco
          de teclado (axe scrollable-region-focusable, a 375px) */}
      <code className="max-w-full rounded-sm bg-code px-4.5 py-3.5 font-mono text-caption break-all whitespace-pre-wrap text-prose">
        <span aria-hidden="true" className="text-gold">
          ${" "}
        </span>
        {command}
      </code>
      <CopyButton
        value={command}
        idle={projectPage.copy}
        done={projectPage.copied}
        failed={projectPage.copyFailed}
        className="text-body-sm text-prose transition-colors duration-300 hover:text-paper"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

/**
 * "Próximo projeto. connect-responsibly." em manchete de dois tons, lado a
 * lado com o emblema dele (parado; a luz segue o ponteiro).
 */
export function ProjectOnward({ next }: { next: Project }) {
  return (
    <div className={wrap}>
      <Link
        to={`/projetos/${projectSlug(next)}`}
        aria-label={`${projectPage.next.replace(/\.$/, "")}: ${next.name}`}
        className="group mt-40 block tab:grid tab:grid-cols-[1.25fr_0.75fr] tab:items-center tab:gap-8"
      >
        <p aria-hidden="true" className="max-w-[20ch] text-onward text-balance">
          <span className="text-secondary">{projectPage.next}</span>{" "}
          <span className="decoration-accent-soft/60 decoration-2 group-hover:underline">
            <BreakableName name={next.name} />.
          </span>
        </p>
        <StillEmblem
          shape={getProjectShape(next.name)}
          className="mt-10 h-[clamp(260px,32vw,420px)] tab:mt-0"
        />
      </Link>
    </div>
  );
}
