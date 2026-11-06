/**
 * Seta ↗ desenhada (SVG), só em links que saem do site (adendo v3).
 * Decorativa: o "(abre em nova aba)" vai em texto para leitor de tela.
 */
export default function ExternalArrow() {
  return (
    <svg
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
      className="ml-[0.22em] inline-block size-[0.62em] align-[0.04em]"
    >
      <path d="M2.5 7.5 7.5 2.5M3.5 2.5h4v4" />
    </svg>
  );
}
