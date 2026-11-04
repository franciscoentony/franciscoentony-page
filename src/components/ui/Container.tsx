import type { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

/** Largura padrão do conteúdo: até 1080px, com 24px de respiro de cada lado. */
export default function Container({ children, className = "" }: ContainerProps) {
  return (
    <div className={`mx-auto w-[min(1080px,calc(100%-48px))] ${className}`}>
      {children}
    </div>
  );
}
