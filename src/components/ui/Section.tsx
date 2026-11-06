import type { ReactNode } from "react";
import Container from "./Container";

interface SectionProps {
  id?: string;
  children: ReactNode;
  /** Classes extras para a <section>. */
  className?: string;
  /** Classes extras para o Container de dentro. */
  containerClassName?: string;
}

/** Seção da Home com o espaçamento vertical padrão (py-section) e Container. */
export default function Section({
  id,
  children,
  className = "",
  containerClassName = "",
}: SectionProps) {
  return (
    <section id={id} className={`py-section ${className}`}>
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}
