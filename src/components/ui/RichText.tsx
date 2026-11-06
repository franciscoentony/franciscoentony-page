import type { GradientTitle, TextPart } from "../../content/ui";

/** Mostra uma lista de pedaços de texto; os com bold: true ficam em destaque. */
export function RichText({ parts }: { parts: TextPart[] }) {
  return (
    <>
      {parts.map((part, index) =>
        part.bold ? (
          <b key={index} className="font-medium text-paper">
            {part.text}
          </b>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
}

/** Mostra um título com o final em gradiente (classe text-gradient). */
export function GradientText({ title }: { title: GradientTitle }) {
  return (
    <>
      {title.start}
      <span className="text-gradient">{title.gradient}</span>
    </>
  );
}

/**
 * A palavra do jogo como 1º tom da manchete (adendo v4, item 1): o antigo
 * eyebrow ("Player 1") entra no começo do h2, num cinza mais escuro.
 * Mesmo texto; ganha ponto final se não tiver pontuação ("Player 1.").
 * `breakAfter` quebra a linha depois dele (ex.: "Continue?").
 */
export function Kicker({
  text,
  breakAfter = false,
}: {
  text: string;
  breakAfter?: boolean;
}) {
  const withPunctuation = /[.?!]$/.test(text) ? text : `${text}.`;
  return (
    <>
      <span className="text-kicker">{withPunctuation}</span>
      {breakAfter ? <br /> : " "}
    </>
  );
}

/** Título que antes tinha o final em gradiente, agora num tom só (item 3). */
export function PlainTitle({ title }: { title: GradientTitle }) {
  return (
    <>
      {title.start}
      {title.gradient}
    </>
  );
}
