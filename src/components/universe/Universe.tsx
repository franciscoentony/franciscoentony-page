import { useEffect, useRef } from "react";
import { chapters, hero, sectionIds } from "../../content/ui";
import { usePrefersReducedMotion } from "../../hooks/usePrefersReducedMotion";
import { useScrollProgress } from "../../hooks/useScrollProgress";
import { UNIVERSE, clamp, getWarp, warpState } from "../../lib/motion";
import Button from "../ui/Button";
import Container from "../ui/Container";
import { GradientText, RichText } from "../ui/RichText";
import PlanetCanvas from "./PlanetCanvas";

/**
 * Seção Universe (substitui o Hero). HANDOFF §3 e §4.
 * - Normal: seção de 520vh com um "palco" sticky de 100vh. Conforme o scroll,
 *   o planeta anda, a headline some, os 3 capítulos aparecem e, no fim,
 *   o planeta se dissolve e as estrelas fazem o efeito "velocidade da luz".
 * - Reduced motion: sem pin. Hero e capítulos viram blocos empilhados.
 */
export default function Universe() {
  const reducedMotion = usePrefersReducedMotion();
  return reducedMotion ? <UniverseStatic /> : <UniverseAnimated />;
}

// ---------- Partes reutilizadas nas duas versões ----------

/**
 * Eyebrow, h1 e CTAs do hero.
 * ctaHidden: quando o hero já sumiu no scroll, os CTAs ficam "inert" (não
 * recebem foco nem clique). O h1 continua na árvore de acessibilidade.
 */
function HeroCopy({ ctaHidden = false }: { ctaHidden?: boolean }) {
  return (
    <>
      <p className="mb-3.5 text-eyebrow text-secondary">{hero.eyebrow}</p>
      <h1 className="mx-auto max-w-[14ch] text-h1">
        <GradientText title={hero.title} />
      </h1>
      <div
        inert={ctaHidden}
        className="mt-6.5 flex items-center justify-center gap-3.5"
      >
        <Button to={`/#${sectionIds.projects}`}>{hero.primaryCta}</Button>
        <Button variant="link" to={`/#${sectionIds.contact}`}>
          {hero.secondaryCta}
        </Button>
      </div>
    </>
  );
}

function ChapterCopy({
  index,
  alignSide,
}: {
  index: number;
  alignSide: boolean;
}) {
  const chapter = chapters[index];
  // Capítulos 1 e 2 ficam alinhados à esquerda no desktop (alignSide)
  const margin = alignSide ? "mx-auto tab:mx-0" : "mx-auto";

  return (
    <>
      <p className="mb-4.5 font-dot text-chapter text-accent-soft">
        {chapter.number}
      </p>
      <h2 className={`max-w-[16ch] text-h2 ${margin}`}>{chapter.title}</h2>
      <p className={`mt-4.5 max-w-[36ch] text-lead text-secondary ${margin}`}>
        <RichText parts={chapter.lead} />
      </p>
    </>
  );
}

// ---------- Versão animada ----------

/** Opacidade de um capítulo: entra com fade, fica visível e sai com fade. */
function getChapterOpacity(
  progress: number,
  start: number,
  end: number,
): number {
  const fade = UNIVERSE.chapterFade;
  const fadeIn = clamp((progress - start) / fade);
  const fadeOut = 1 - clamp((progress - (end - fade)) / fade);
  return fadeIn * fadeOut;
}

// Posição de cada capítulo no palco.
// Abaixo de 860px todos ficam centralizados embaixo.
const chapterPositions = [
  // 1: à esquerda (o planeta vai para a direita)
  "max-tab:inset-x-0 max-tab:bottom-[10vh] max-tab:px-6 max-tab:text-center tab:top-1/2 tab:-mt-30 tab:left-[max(24px,calc((100vw-1080px)/2))] tab:w-[min(440px,40vw)] tab:text-left",
  // 2: à direita (o planeta vai para a esquerda)
  "max-tab:inset-x-0 max-tab:bottom-[10vh] max-tab:px-6 max-tab:text-center tab:top-1/2 tab:-mt-30 tab:right-[max(24px,calc((100vw-1080px)/2))] tab:w-[min(440px,40vw)] tab:text-left",
  // 3: centralizado embaixo
  "inset-x-0 bottom-[9vh] px-6 text-center",
];

function UniverseAnimated() {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useScrollProgress(sectionRef);

  // Passa o warp para o fundo de estrelas
  useEffect(() => {
    warpState.value = getWarp(progress);
  }, [progress]);

  // Ao sair da Home, desliga o warp
  useEffect(() => {
    return () => {
      warpState.value = 0;
    };
  }, []);

  const heroFade = clamp(progress / UNIVERSE.heroFadeEnd);
  const hintOpacity = 1 - clamp(progress / UNIVERSE.hintFadeEnd);

  return (
    <section ref={sectionRef} id="universe" className="relative h-[520vh]">
      <div className="sticky top-0 h-svh overflow-hidden">
        <PlanetCanvas sectionRef={sectionRef} />

        {/* Headline + CTAs */}
        <div
          className="absolute inset-x-0 top-[clamp(90px,15vh,150px)] px-6 text-center"
          style={{
            opacity: 1 - heroFade,
            transform: `translateY(${-heroFade * UNIVERSE.heroShift}px) scale(${1 - heroFade * 0.04})`,
            // Só opacity (sem visibility: hidden), para o h1 continuar
            // existindo para leitores de tela (QA I1)
            pointerEvents: heroFade >= 1 ? "none" : "auto",
          }}
        >
          <HeroCopy ctaHidden={heroFade >= 1} />
        </div>

        {/* Dica "Role para explorar" */}
        <div
          aria-hidden="true"
          className="absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2.5 font-mono text-label tracking-label-wide text-secondary uppercase"
          style={{ opacity: hintOpacity }}
        >
          {hero.scrollHint}
          <span className="h-9 w-px animate-drip bg-linear-to-b from-secondary to-transparent" />
        </div>

        {/* Capítulos */}
        {chapters.map((chapter, index) => {
          const [start, end] = UNIVERSE.chapterWindows[index];
          const opacity = getChapterOpacity(progress, start, end);

          return (
            <div
              key={chapter.number}
              className={`pointer-events-none absolute text-shadow-chapter ${chapterPositions[index]}`}
              style={{
                opacity,
                transform: `translateY(${(1 - opacity) * UNIVERSE.chapterShift}px)`,
              }}
            >
              <ChapterCopy index={index} alignSide={index < 2} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------- Versão com reduced motion ----------

function UniverseStatic() {
  return (
    <section id="universe">
      {/* Hero com o planeta parado atrás */}
      <div className="relative flex min-h-svh items-start overflow-hidden pt-[clamp(90px,15vh,150px)] text-center">
        <PlanetCanvas />
        <Container className="relative">
          <HeroCopy />
        </Container>
      </div>

      {/* Os 3 capítulos como blocos normais */}
      {chapters.map((chapter, index) => (
        <div key={chapter.number} className="py-section text-center">
          <Container>
            <ChapterCopy index={index} alignSide={false} />
          </Container>
        </div>
      ))}
    </section>
  );
}
