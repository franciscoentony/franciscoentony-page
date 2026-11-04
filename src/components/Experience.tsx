import { useEffect, useRef, useState } from "react";
import { experience as experienceCopy, sectionIds } from "../content/ui";
import { experience } from "../data/experience";
import { TIMELINE, clamp } from "../lib/motion";
import Reveal from "./ui/Reveal";
import { GradientText, RichText } from "./ui/RichText";
import Section from "./ui/Section";

/** Quadradinho da timeline. Acende (dourado) quando a fase passa da linha de 60% da tela. */
function Checkpoint({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute top-1.5 -left-9 size-[11px] border transition-all duration-500 ${
        on
          ? "border-gold bg-gold shadow-glow-gold-lg"
          : "border-muted bg-checkpoint"
      }`}
    />
  );
}

/**
 * Seção "Campanha" (Experiência): título sticky à esquerda e timeline à
 * direita. A linha dourada se preenche com o scroll e cada checkpoint acende
 * quando a fase passa de 60% da tela. A 4ª fase ("Próxima fase") é fixa.
 */
export default function Experience() {
  const timelineRef = useRef<HTMLOListElement>(null);
  const stepRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [fillHeight, setFillHeight] = useState(0);
  const [activeSteps, setActiveSteps] = useState(0);

  useEffect(() => {
    let frameId = 0;

    function update() {
      frameId = 0;
      const timeline = timelineRef.current;
      if (!timeline) return;

      const line = window.innerHeight * TIMELINE.activeLine;
      const rect = timeline.getBoundingClientRect();
      const progress = clamp((line - rect.top) / rect.height);
      setFillHeight(progress * (rect.height - 12));

      // Conta quantas fases já passaram da linha
      let count = 0;
      stepRefs.current.forEach((step) => {
        if (step && step.getBoundingClientRect().top < line) count++;
      });
      setActiveSteps(count);
    }

    function handleScroll() {
      if (frameId === 0) frameId = requestAnimationFrame(update);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <Section
      id={sectionIds.experience}
      containerClassName="grid gap-12 tab:grid-cols-[.9fr_1.1fr] tab:gap-16"
    >
      {/* Título (sticky só a partir de 860px) */}
      <div className="self-start tab:sticky tab:top-30">
        <Reveal>
          <p className="text-eyebrow text-secondary">
            {experienceCopy.eyebrow}
          </p>
        </Reveal>
        <Reveal delay={1}>
          <h2 className="mt-3 mb-4.5 text-h2">
            <GradientText title={experienceCopy.title} />
          </h2>
        </Reveal>
        <Reveal delay={2}>
          <p className="text-lead text-secondary">
            <RichText parts={experienceCopy.lead} />
          </p>
        </Reveal>
      </div>

      {/* Timeline */}
      <ol ref={timelineRef} className="relative pl-9">
        <span
          aria-hidden="true"
          className="absolute top-1.5 bottom-1.5 left-[5px] w-px bg-line"
        />
        <span
          aria-hidden="true"
          className="absolute top-1.5 left-[5px] w-px bg-linear-to-b from-gold to-accent shadow-glow-gold"
          style={{ height: fillHeight }}
        />

        {experience.map((item, index) => (
          <li
            key={item.role}
            ref={(element) => {
              stepRefs.current[index] = element;
            }}
            className="relative pb-16"
          >
            <Checkpoint on={index < activeSteps} />
            <p className="font-mono text-label-lg tracking-label text-secondary uppercase">
              {item.dates}
            </p>
            <h3 className="mt-1.5 mb-0.5 text-title-lg">{item.role}</h3>
            <p className="text-sm text-accent-soft">{item.org}</p>
            <p className="mt-3 max-w-[46ch] text-body-sm text-secondary">
              {item.description}
            </p>
          </li>
        ))}

        {/* 4ª fase: bloqueada (nunca acende) */}
        <li className="relative">
          <Checkpoint on={false} />
          <p className="font-mono text-label-lg tracking-label text-secondary uppercase">
            {experienceCopy.nextPhase.when}
          </p>
          <h3 className="mt-1.5 mb-0.5 text-title-lg text-secondary">
            {experienceCopy.nextPhase.title}
          </h3>
          <p className="text-sm text-secondary">
            {experienceCopy.nextPhase.action}
          </p>
        </li>
      </ol>
    </Section>
  );
}
