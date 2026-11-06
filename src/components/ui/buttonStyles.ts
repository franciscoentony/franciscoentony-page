/*
 * Classes do botão do site (usadas pelo Button e por quem precisa do mesmo
 * visual num <button> próprio, como o "copiar e-mail" do Contato).
 */
export const buttonBase =
  "inline-flex items-center gap-1.5 rounded-full font-medium transition-[color,background-color,box-shadow,scale] duration-300";

export const buttonVariants = {
  primary:
    "bg-paper text-ink hover:scale-[1.03] hover:shadow-ring-soft cursor-pointer",
  // Links de texto: brancos, sublinham no hover (adendo v4, item 10)
  link: "text-paper hover:underline underline-offset-4 decoration-accent-soft/60 cursor-pointer",
};

export const buttonSizes = {
  md: "text-sm py-2.5",
  sm: "text-xs py-[5px]",
};

/** Padding horizontal do botão primário (o "link" usa sempre px-1.5). */
export const primaryPadding = {
  md: "px-5",
  sm: "px-[13px]",
};
