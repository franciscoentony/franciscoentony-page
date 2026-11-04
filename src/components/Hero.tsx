import { hero, sectionIds } from "../content/ui";
import Button from "./ui/Button";
import Container from "./ui/Container";
import Reveal from "./ui/Reveal";

/**
 * Hero PROVISÓRIO (fase 2), já em Tailwind e com os tokens novos.
 * Na fase 3 ele será substituído pela seção Universe (planeta ASCII + capítulos).
 */
export default function Hero() {
  return (
    <section className="flex min-h-svh items-center pt-nav text-center">
      <Container>
        <Reveal>
          <p className="mb-3.5 text-eyebrow text-secondary">{hero.eyebrow}</p>
        </Reveal>

        <Reveal delay={1}>
          <h1 className="mx-auto max-w-[14ch] text-h1">
            {hero.title.start}
            <span className="text-gradient">{hero.title.gradient}</span>
          </h1>
        </Reveal>

        <Reveal delay={2}>
          <div className="mt-6.5 flex items-center justify-center gap-3.5">
            <Button to={`/#${sectionIds.projects}`}>{hero.primaryCta}</Button>
            <Button variant="link" to={`/#${sectionIds.contact}`}>
              {hero.secondaryCta}
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
