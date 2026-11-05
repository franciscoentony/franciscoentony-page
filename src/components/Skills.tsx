import { sectionIds, skills as skillsCopy } from "../content/ui";
import { skills } from "../data/skills";
import { useQuality } from "../hooks/useQuality";
import SkillsSphere from "./skills/SkillsSphere";
import Reveal from "./ui/Reveal";
import { GradientText } from "./ui/RichText";
import Section from "./ui/Section";

/** Seção "Inventário" (Habilidades): esfera 3D de tags + 4 colunas de skills.ts. */
export default function Skills() {
  const isLowQuality = useQuality().quality === "baixo";

  return (
    <Section id={sectionIds.skills}>
      <div className="mx-auto max-w-[720px] text-center">
        <Reveal>
          <p className="text-eyebrow text-secondary">{skillsCopy.eyebrow}</p>
        </Reveal>
        <Reveal delay={1}>
          <h2 className="mt-3 mb-4.5 text-h2">
            <GradientText title={skillsCopy.title} />
          </h2>
        </Reveal>
        <Reveal delay={2}>
          <p className="text-lead text-secondary">
            {skillsCopy.lead}
            {/* No nível Baixo (e com reduced motion) a esfera não gira: a dica sai */}
            {!isLowQuality && (
              <b className="font-medium text-paper"> {skillsCopy.dragHint}</b>
            )}
          </p>
        </Reveal>
      </div>

      <Reveal delay={2}>
        <SkillsSphere />
      </Reveal>

      <div className="mt-14 grid grid-cols-2 gap-8 tab:grid-cols-4">
        {skills.map((skill, index) => (
          <Reveal key={skill.title} delay={(index + 1) as 1 | 2 | 3 | 4}>
            <h3 className="mb-2 text-title-xs">{skill.title}</h3>
            <p className="text-sm leading-normal text-secondary">
              {skill.description}
            </p>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
