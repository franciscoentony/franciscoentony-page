import { player, sectionIds } from "../content/ui";
import CharacterCard from "./about/CharacterCard";
import Counter from "./ui/Counter";
import Reveal from "./ui/Reveal";
import { Kicker, PlainTitle } from "./ui/RichText";
import Section from "./ui/Section";
import WordReveal from "./ui/WordReveal";

/** Seção "Player 1" (Sobre): texto + stats à esquerda, ficha holográfica à direita. */
export default function About() {
  return (
    <Section
      id={sectionIds.about}
      containerClassName="grid items-center gap-12 tab:grid-cols-[1.05fr_.95fr] tab:gap-16"
    >
      <div>
        <Reveal>
          <h2 className="mb-gutter text-h2">
            <Kicker text={player.eyebrow} />
            <PlainTitle title={player.title} />
          </h2>
        </Reveal>
        <Reveal delay={2}>
          <WordReveal text={player.lead} className="text-lead" />
        </Reveal>

        <div className="mt-12 grid grid-cols-3 gap-4 border-t border-line pt-7 tab:gap-7">
          {player.stats.map((stat, index) => (
            <Reveal key={stat.label} delay={(index + 1) as 1 | 2 | 3}>
              <Counter
                value={stat.value}
                suffix={stat.suffix}
                className="block font-dot text-stat text-paper"
              />
              <p className="mt-2.5 text-small text-secondary">{stat.label}</p>
            </Reveal>
          ))}
        </div>
      </div>

      <Reveal delay={2}>
        <CharacterCard />
      </Reveal>
    </Section>
  );
}
