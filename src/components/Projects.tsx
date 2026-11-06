import { useRef, useState, type KeyboardEvent } from "react";
import { links, projects as projectsCopy, sectionIds } from "../content/ui";
import { projects } from "../data/projects";
import { useQuality } from "../hooks/useQuality";
import ProjectCard from "./projects/ProjectCard";
import Button from "./ui/Button";
import Container from "./ui/Container";
import Reveal from "./ui/Reveal";
import { Kicker } from "./ui/RichText";

/**
 * Seção "Missões" (Projetos): carrossel horizontal com scroll-snap e dots.
 * Teclado: o carrossel recebe foco (Tab) e as setas ← → trocam de card.
 */
export default function Projects() {
  const trackRef = useRef<HTMLUListElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const reducedMotion = useQuality().motion === "reduced";

  /** Rola o carrossel até o card de número `index`. */
  function goTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    const safeIndex = Math.max(0, Math.min(projects.length - 1, index));
    const card = track.children[safeIndex] as HTMLElement;
    const paddingLeft = parseFloat(getComputedStyle(track).paddingLeft);

    track.scrollTo({
      left: card.offsetLeft - paddingLeft,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }

  /** Descobre qual card está mais perto do começo do carrossel. */
  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    const paddingLeft = parseFloat(getComputedStyle(track).paddingLeft);

    let closest = 0;
    let closestDistance = Infinity;
    Array.from(track.children).forEach((child, index) => {
      const card = child as HTMLElement;
      const distance = Math.abs(
        card.offsetLeft - paddingLeft - track.scrollLeft,
      );
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = index;
      }
    });
    // No fim da rolagem o último card pode não chegar ao começo (telas largas):
    // nesse caso, o último dot é o ativo (R2 S-2).
    const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
    setActiveIndex(atEnd ? track.children.length - 1 : closest);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goTo(activeIndex + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goTo(activeIndex - 1);
    }
  }

  return (
    <section id={sectionIds.projects} className="py-section">
      <Container className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <Reveal>
            <h2 className="text-h2">
              <Kicker text={projectsCopy.eyebrow} />
              {projectsCopy.title}
            </h2>
          </Reveal>
        </div>
        <Reveal delay={2}>
          <Button variant="link" href={links.github} external>
            {projectsCopy.githubLink}
            <span className="sr-only">{links.newTabLabel}</span>
          </Button>
        </Reveal>
      </Container>

      {/*
        O trilho rola na horizontal (overflow-x-auto), e isso também corta
        na vertical. O brilho do card no hover (shadow-card-active) desce
        ~130px e sobe ~50px, então o trilho tem padding vertical grande
        (pt-15/pb-35) compensado por margens negativas (-mt-10/-mb-[90px]):
        o layout (título e dots) fica no mesmo lugar.
      */}
      <ul
        ref={trackRef}
        tabIndex={0}
        aria-label={projectsCopy.carouselLabel}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        className="scrollbar-hidden relative flex snap-x snap-mandatory scroll-px-[max(24px,calc((100vw-1080px)/2))] gap-gutter overflow-x-auto px-[max(24px,calc((100vw-1080px)/2))] -mt-10 -mb-[90px] pt-15 pb-35"
      >
        {projects.map((project, index) => (
          <li
            key={project.name}
            className="flex-[0_0_min(360px,82vw)] snap-start"
          >
            <ProjectCard project={project} index={index} />
          </li>
        ))}
      </ul>

      {/* Segmentos de um filete (item 9): atalho visual para o mouse (no
          teclado, use as setas). O ativo se enche de gold → lavanda. */}
      <div aria-hidden="true" className="relative flex justify-center gap-2">
        {projects.map((project, index) => (
          <button
            key={project.name}
            type="button"
            tabIndex={-1}
            onClick={() => goTo(index)}
            className={`relative h-[13px] w-8 cursor-pointer after:absolute after:inset-x-0 after:top-1.5 after:h-px after:transition-[background-color,box-shadow] after:duration-400 after:content-[''] ${
              index === activeIndex
                ? "after:bg-linear-to-r after:from-gold after:to-accent-soft after:shadow-glow-gold"
                : "after:bg-line-strong"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
