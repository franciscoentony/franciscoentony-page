import { contact, links, sectionIds, toast } from "../content/ui";
import { useToast } from "../hooks/useToast";
import { afterNextPaint } from "../lib/motion";
import ContactField from "./contact/ContactField";
import Button from "./ui/Button";
import Container from "./ui/Container";
import Reveal from "./ui/Reveal";
import { GradientText } from "./ui/RichText";

/** Seção "Continue?" (Contato): campo ASCII + botão que copia o e-mail. */
export default function Contact() {
  const showToast = useToast();

  function copyEmail() {
    // A cópia começa na hora (o Safari exige que seja dentro do clique), mas
    // o toast só aparece depois do paint: o botão responde primeiro (A10, INP)
    const copying = navigator.clipboard
      ? navigator.clipboard.writeText(links.email)
      : Promise.reject(new Error("sem área de transferência"));

    afterNextPaint(async () => {
      try {
        await copying;
        showToast(toast.emailCopied);
      } catch {
        // Sem acesso à área de transferência: abre o app de e-mail
        window.location.href = `mailto:${links.email}`;
      }
    });
  }

  return (
    <section
      id={sectionIds.contact}
      className="relative grid min-h-svh place-items-center overflow-hidden text-center"
    >
      <ContactField />

      <Container className="relative">
        <Reveal>
          <p className="text-eyebrow text-secondary">{contact.eyebrow}</p>
        </Reveal>
        <Reveal delay={1}>
          <h2 className="mx-auto mt-3.5 mb-5 max-w-[12ch] text-h1">
            <GradientText title={contact.title} />
          </h2>
        </Reveal>
        <Reveal delay={2}>
          <p className="text-lead text-secondary">{contact.lead}</p>
        </Reveal>
        <Reveal delay={3}>
          {/* Abaixo de 860px: e-mail numa linha, GitHub e LinkedIn juntos na seguinte (DS-19) */}
          <div className="mt-7.5 flex flex-col items-center justify-center gap-3.5 tab:flex-row">
            <Button
              onClick={copyEmail}
              ariaLabel={`${contact.copyEmailLabel}: ${links.email}`}
            >
              {links.email}
            </Button>
            <div className="flex items-center gap-5 tab:gap-3.5">
              <Button variant="link" href={links.github} external>
                {contact.githubLink}
                <span className="sr-only">{links.newTabLabel}</span>
              </Button>
              <Button variant="link" href={links.linkedin} external>
                {contact.linkedinLink}
                <span className="sr-only">{links.newTabLabel}</span>
              </Button>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
