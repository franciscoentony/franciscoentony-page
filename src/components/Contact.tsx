import { contact, links, sectionIds } from "../content/ui";
import ContactField from "./contact/ContactField";
import Button from "./ui/Button";
import {
  buttonBase,
  buttonSizes,
  buttonVariants,
  primaryPadding,
} from "./ui/buttonStyles";
import Container from "./ui/Container";
import CopyButton from "./ui/CopyButton";
import Reveal from "./ui/Reveal";
import { Kicker, PlainTitle } from "./ui/RichText";

/**
 * Seção "Continue?" (Contato): campo ASCII + botão que copia o e-mail.
 * O botão se decodifica até "E-mail copiado" (item 13, sem toast); a
 * largura mínima evita que ele mude de tamanho durante a troca.
 */
export default function Contact() {
  return (
    <section
      id={sectionIds.contact}
      className="relative grid min-h-svh place-items-center overflow-hidden text-center"
    >
      <ContactField />

      <Container className="relative">
        <Reveal>
          <h2 className="mx-auto mb-5 max-w-[12ch] text-h1">
            <Kicker text={contact.eyebrow} breakAfter />
            <PlainTitle title={contact.title} />
          </h2>
        </Reveal>
        <Reveal delay={2}>
          <p className="text-lead text-secondary">{contact.lead}</p>
        </Reveal>
        <Reveal delay={3}>
          {/* Abaixo de 860px: e-mail numa linha, GitHub e LinkedIn juntos na seguinte (DS-19) */}
          <div className="mt-7.5 flex flex-col items-center justify-center gap-3.5 tab:flex-row">
            <CopyButton
              value={links.email}
              idle={links.email}
              label={`${contact.copyEmailLabel}: ${links.email}`}
              done={contact.emailCopied}
              failed={contact.copyFailed}
              className={`${buttonBase} ${buttonVariants.primary} ${buttonSizes.md} ${primaryPadding.md} min-w-[250px] justify-center`}
            />
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
