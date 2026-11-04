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
