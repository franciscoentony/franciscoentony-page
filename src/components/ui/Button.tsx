import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useSectionClick } from "../../hooks/useSectionClick";
import ExternalArrow from "./ExternalArrow";
import {
  buttonBase as base,
  buttonSizes as sizes,
  buttonVariants as variants,
  primaryPadding,
} from "./buttonStyles";

interface ButtonProps {
  children: ReactNode;
  /** "primary" = pill branca; "link" = texto branco com underline no hover. */
  variant?: "primary" | "link";
  /** "sm" = versão pequena (ex.: CTA da navbar). */
  size?: "md" | "sm";
  /** Rota interna do React Router (ex.: "/blog" ou "/#contato"). */
  to?: string;
  /** Link externo ou âncora comum (ex.: "https://github.com/..."). */
  href?: string;
  /** Abre o href em nova aba (o link de texto ganha a seta ↗ desenhada). */
  external?: boolean;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}

/**
 * Botão do site. Vira <Link>, <a> ou <button> dependendo das props:
 * - com `to`   → <Link> do React Router
 * - com `href` → <a>
 * - sem os dois → <button>
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  to,
  href,
  external = false,
  onClick,
  className = "",
  ariaLabel,
}: ButtonProps) {
  // Links de seção da Home ("/#contato") rolam sem # na URL
  const sectionClick = useSectionClick();
  const padding = variant === "primary" ? primaryPadding[size] : "px-1.5";
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${padding} ${className}`;

  if (to) {
    return (
      <Link
        to={to}
        onClick={(event) => {
          onClick?.();
          sectionClick(event, to);
        }}
        className={classes}
        aria-label={ariaLabel}
      >
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        onClick={onClick}
        className={classes}
        aria-label={ariaLabel}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {children}
        {external && variant === "link" && <ExternalArrow />}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={classes}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
