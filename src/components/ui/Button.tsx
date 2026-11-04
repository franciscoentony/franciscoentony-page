import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface ButtonProps {
  children: ReactNode;
  /** "primary" = pill branca; "link" = texto lavanda com underline no hover. */
  variant?: "primary" | "link";
  /** "sm" = versão pequena (ex.: CTA da navbar). */
  size?: "md" | "sm";
  /** Rota interna do React Router (ex.: "/blog" ou "/#contato"). */
  to?: string;
  /** Link externo ou âncora comum (ex.: "https://github.com/..."). */
  href?: string;
  /** Abre o href em nova aba. */
  external?: boolean;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}

const base =
  "inline-flex items-center gap-1.5 rounded-full font-medium transition duration-300";

const variants = {
  primary:
    "bg-paper text-ink hover:scale-[1.03] hover:shadow-ring-soft cursor-pointer",
  link: "text-accent-soft hover:underline underline-offset-4 cursor-pointer",
};

const sizes = {
  md: "text-sm py-2.5",
  sm: "text-xs py-[5px]",
};

// Padding horizontal do botão primário (o "link" usa sempre px-1.5).
const primaryPadding = {
  md: "px-5",
  sm: "px-[13px]",
};

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
  const padding = variant === "primary" ? primaryPadding[size] : "px-1.5";
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${padding} ${className}`;

  if (to) {
    return (
      <Link to={to} onClick={onClick} className={classes} aria-label={ariaLabel}>
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
