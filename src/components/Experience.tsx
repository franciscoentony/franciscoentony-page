import { useEffect, useRef, useState } from "react";
import { createSmoothedValue, type SmoothedValue } from "../lib/smoothing";
import { useScrollWhileVisible } from "../hooks/useScrollWhileVisible";
import { experience as experienceCopy, sectionIds } from "../content/ui";
import { experience } from "../data/experience";
import { TIMELINE, clamp } from "../lib/motion";
import Reveal from "./ui/Reveal";
import LockedText from "./ui/LockedText";
import { Kicker, PlainTitle, RichText } from "./ui/RichText";
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
  const fillRef = useRef<HTMLSpanElement>(null);
  const [activeSteps, setActiveSteps] = useState(0);

  // Só escuta o scroll com a timeline na tela; a altura da linha é escrita
  // direto no estilo (sem setState a cada quadro, A6 / S-3)
  // A linha dourada acompanha o scroll com amortecimento (continua
  // completando o movimento depois que a rolagem para) e só usa transform
  const fillSmooth = useRef<SmoothedValue | null>(null);
  useEffect(() => {
    const smooth = createSmoothedValue((progress) => {
      if (fillRef.current) {
        fillRef.current.style.transform = `scaleY(${progress})`;
      }
    });
    fillSmooth.current = smooth;
    return smooth.dispose;
  }, []);

  useScrollWhileVisible(timelineRef, () => {
    const timeline = timelineRef.current;
    if (!timeline) return;

    const line = window.innerHeight * TIMELINE.activeLine;
    const rect = timeline.getBoundingClientRect();
    fillSmooth.current?.setTarget(clamp((line - rect.top) / rect.height));

    // Conta quantas fases já passaram da linha (o React só re-renderiza
    // quando o número muda)
    let count = 0;
    stepRefs.current.forEach((step) => {
      if (step && step.getBoundingClientRect().top < line) count++;
    });
    setActiveSteps(count);
  });

  return (
    <Section
      id={sectionIds.experience}
      containerClassName="grid gap-12 tab:grid-cols-[.9fr_1.1fr] tab:gap-16"
    >
      {/* Título (sticky só a partir de 860px) */}
      <div className="self-start tab:sticky tab:top-30">
        <Reveal>
          <h2 className="mb-4.5 text-h2">
            <Kicker text={experienceCopy.eyebrow} />
            <PlainTitle title={experienceCopy.title} />
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
          className="absolute top-1.5 bottom-1.5 left-[5px] w-px origin-top bg-linear-to-b from-gold to-accent shadow-glow-gold"
          ref={fillRef}
          style={{ transform: "scaleY(0)" }}
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
            <p className="font-mono text-label-lg text-secondary">
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
          <p className="font-mono text-label-lg text-secondary">
            {experienceCopy.nextPhase.when}
          </p>
          <h3 className="mt-1.5 mb-0.5 text-title-lg text-secondary">
            {/* Ainda não desbloqueada = ainda não decodificada (item 11) */}
            <LockedText text={experienceCopy.nextPhase.title} />
          </h3>
          <p className="text-sm text-secondary">
            {experienceCopy.nextPhase.action}
          </p>
        </li>
      </ol>
    </Section>
  );
}
