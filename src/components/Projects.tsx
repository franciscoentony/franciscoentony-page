import { useRef, useState, type KeyboardEvent } from "react";
import { links, projects as projectsCopy, sectionIds } from "../content/ui";
import { projects } from "../data/projects";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import ProjectCard from "./projects/ProjectCard";
import Button from "./ui/Button";
import Container from "./ui/Container";
import Reveal from "./ui/Reveal";

/**
 * Seção "Missões" (Projetos): carrossel horizontal com scroll-snap e dots.
 * Teclado: o carrossel recebe foco (Tab) e as setas ← → trocam de card.
 */
export default function Projects() {
  const trackRef = useRef<HTMLUListElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

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
            <p className="text-eyebrow text-secondary">
              {projectsCopy.eyebrow}
            </p>
          </Reveal>
          <Reveal delay={1}>
            <h2 className="mt-3 text-h2">{projectsCopy.title}</h2>
          </Reveal>
        </div>
        <Reveal delay={2}>
          <Button variant="link" href={links.github} external>
            {projectsCopy.githubLink}
            <span className="sr-only">{links.newTabLabel}</span>
          </Button>
        </Reveal>
      </Container>

      <ul
        ref={trackRef}
        tabIndex={0}
        aria-label={projectsCopy.carouselLabel}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        className="scrollbar-hidden relative flex snap-x snap-mandatory scroll-px-[max(24px,calc((100vw-1080px)/2))] gap-gutter overflow-x-auto px-[max(24px,calc((100vw-1080px)/2))] pt-5 pb-12.5"
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

      {/* Dots: atalho visual para o mouse (no teclado, use as setas) */}
      <div aria-hidden="true" className="flex justify-center gap-2">
        {projects.map((project, index) => (
          <button
            key={project.name}
            type="button"
            tabIndex={-1}
            onClick={() => goTo(index)}
            className={`h-2 rounded-full transition-all duration-400 ${
              index === activeIndex ? "w-6 bg-paper" : "w-2 bg-muted"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
