import { useEffect, useRef, useState, type RefObject } from "react";
import { chapters, hero, sectionIds } from "../../content/ui";
import { useQuality } from "../../hooks/useQuality";
import { useScrollWhileVisible } from "../../hooks/useScrollWhileVisible";
import { createSmoothedValue, type SmoothedValue } from "../../lib/smoothing";
import {
  UNIVERSE,
  clamp,
  getScrollProgress,
  getWarp,
  warpState,
} from "../../lib/motion";
import Button from "../ui/Button";
import Container from "../ui/Container";
import { GradientText, RichText } from "../ui/RichText";
import PlanetCanvas from "./PlanetCanvas";

/**
 * Seção Universe (substitui o Hero). HANDOFF §3 e §4.
 * - Normal: seção de 520vh com um "palco" sticky de 100vh. Conforme o scroll,
 *   o planeta anda, a headline some, os 3 capítulos aparecem e, no fim,
 *   o planeta se dissolve e as estrelas fazem o efeito "velocidade da luz".
 * - Nível Baixo (e reduced motion): sem pin. Hero e capítulos viram blocos
 *   empilhados.
 *
 * O layout (com ou sem pin) é decidido quando a seção monta. Se o governador
 * de FPS baixar o nível no meio da visita, os canvases ficam estáticos, mas
 * o pin continua até a próxima navegação: trocar o layout com a pessoa na
 * página faria o conteúdo pular (P5 I-A). Reduced motion troca na hora.
 */
export default function Universe() {
  const { quality, motion } = useQuality();
  const [startedLowQuality] = useState(quality === "baixo");
  const isStaticLayout = motion === "reduced" || startedLowQuality;
  return isStaticLayout ? <UniverseStatic /> : <UniverseAnimated />;
}

// ---------- Partes reutilizadas nas duas versões ----------

/**
 * Eyebrow, h1 e CTAs do hero.
 * ctaRef: na versão animada, o scroll marca os CTAs como "inert" quando o
 * hero some (não recebem foco nem clique). O h1 continua acessível.
 */
function HeroCopy({ ctaRef }: { ctaRef?: RefObject<HTMLDivElement | null> }) {
  return (
    <>
      <p className="mb-3.5 text-eyebrow text-secondary">{hero.eyebrow}</p>
      <h1 className="mx-auto text-h1 max-[400px]:text-h1-compact tab:max-w-[14ch]">
        <GradientText title={hero.title} />
      </h1>
      <div
        ref={ctaRef}
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

/**
 * Número, título e subtítulo de um capítulo.
 * align: "side" = alinhado à esquerda a partir de 860px (C1 e C2 na versão
 * animada); "left"/"right" = blocos da versão reduced motion; "center" = C3.
 */
function ChapterCopy({
  index,
  align,
}: {
  index: number;
  align: "side" | "left" | "right" | "center";
}) {
  const chapter = chapters[index];

  // Margens para posicionar o título e o subtítulo (que têm largura máxima)
  const margins = {
    side: "mx-auto tab:mx-0",
    left: "mx-auto tab:mr-auto tab:ml-0",
    right: "mx-auto tab:mr-0 tab:ml-auto",
    center: "mx-auto",
  };
  const margin = margins[align];

  return (
    <>
      <p className="mb-4.5 font-dot text-chapter text-accent-soft">
        {chapter.number}
      </p>
      <h2 className={`max-w-[16ch] text-h2 ${margin}`}>{chapter.title}</h2>
      <p
        className={`mt-4.5 max-w-[36ch] text-lead text-balance text-secondary ${margin}`}
      >
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
  const heroRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Progresso suavizado (0 a 1), lido também pelo canvas do planeta
  const progressRef = useRef(0);
  const smoothRef = useRef<SmoothedValue | null>(null);

  // O progresso cru da rolagem vira um alvo; o valor exibido o persegue com
  // amortecimento (lib/smoothing.ts) e continua andando depois que a rolagem
  // para. Tudo é escrito direto nos elementos via ref (sem re-render).
  useEffect(() => {
    function apply(progress: number) {
      progressRef.current = progress;

      // Passa o warp para o fundo de estrelas
      warpState.value = getWarp(progress);

      // Headline + CTAs: só opacity (sem visibility: hidden), para o h1
      // continuar existindo para leitores de tela (QA I1)
      const heroFade = clamp(progress / UNIVERSE.heroFadeEnd);
      const hero = heroRef.current;
      if (hero) {
        hero.style.opacity = `${1 - heroFade}`;
        hero.style.transform = `translateY(${-heroFade * UNIVERSE.heroShift}px) scale(${1 - heroFade * 0.04})`;
        hero.style.pointerEvents = heroFade >= 1 ? "none" : "auto";
      }
      // CTAs invisíveis não recebem foco nem clique
      if (ctaRef.current) ctaRef.current.inert = heroFade >= 1;

      if (hintRef.current) {
        hintRef.current.style.opacity = `${1 - clamp(progress / UNIVERSE.hintFadeEnd)}`;
      }

      chapterRefs.current.forEach((chapter, index) => {
        if (!chapter) return;
        const [start, end] = UNIVERSE.chapterWindows[index];
        const opacity = getChapterOpacity(progress, start, end);
        chapter.style.opacity = `${opacity}`;
        chapter.style.transform = `translateY(${(1 - opacity) * UNIVERSE.chapterShift}px)`;
      });
    }

    const smooth = createSmoothedValue(apply);
    smoothRef.current = smooth;
    return () => {
      smooth.dispose();
      // Ao sair da Home, desliga o warp
      warpState.value = 0;
    };
  }, []);

  // Só escuta o scroll com a seção na tela; cada scroll vira um novo alvo
  useScrollWhileVisible(sectionRef, () => {
    const section = sectionRef.current;
    if (section) smoothRef.current?.setTarget(getScrollProgress(section));
  });

  return (
    <section ref={sectionRef} id="universe" className="relative h-[520vh]">
      <div className="sticky top-0 h-svh overflow-hidden">
        <PlanetCanvas progressRef={progressRef} />

        {/* Headline + CTAs (estilos de scroll aplicados via ref) */}
        <div
          ref={heroRef}
          className="absolute inset-x-0 top-hero-top px-6 text-center"
        >
          <HeroCopy ctaRef={ctaRef} />
        </div>

        {/* Dica "Role para explorar" (sombra preta para ler sobre o planeta no mobile, QA S1) */}
        <div
          ref={hintRef}
          aria-hidden="true"
          className="absolute bottom-7 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2.5 font-mono text-label tracking-label-wide text-secondary uppercase text-shadow-chapter"
        >
          {hero.scrollHint}
          <span className="h-9 w-px animate-drip bg-linear-to-b from-secondary to-transparent" />
        </div>

        {/* Capítulos: começam invisíveis; o scroll controla a opacidade */}
        {chapters.map((chapter, index) => (
          <div
            key={chapter.number}
            ref={(element) => {
              chapterRefs.current[index] = element;
            }}
            className={`pointer-events-none absolute text-shadow-chapter ${chapterPositions[index]}`}
            style={{
              opacity: 0,
              transform: `translateY(${UNIVERSE.chapterShift}px)`,
            }}
          >
            <ChapterCopy index={index} align={index < 2 ? "side" : "center"} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------- Versão com reduced motion ----------

function UniverseStatic() {
  return (
    <section id="universe">
      {/* Hero com o planeta parado atrás */}
      <div className="relative flex min-h-svh items-start overflow-hidden pt-hero-top text-center">
        <PlanetCanvas />
        <Container className="relative">
          <HeroCopy />
        </Container>
      </div>

      {/* Os 3 capítulos como blocos normais */}
      {/* DS-7: blocos com ~120px entre si; C1 à esquerda, C2 à direita, C3 no centro */}
      <Container className="flex flex-col gap-30 pb-section">
        {chapters.map((chapter, index) => {
          const align = (["left", "right", "center"] as const)[index];
          const textAlign = {
            left: "text-center tab:text-left",
            right: "text-center tab:text-right",
            center: "text-center",
          }[align];
          return (
            <div key={chapter.number} className={textAlign}>
              <ChapterCopy index={index} align={align} />
            </div>
          );
        })}
      </Container>
    </section>
  );
}
