/**
 * Converte entidades HTML em caracteres normais
 * (ex.: "&ldquo;Olá&rdquo;" → "“Olá”").
 * O Hugo gera alguns textos (como o summary) já com entidades, e o React
 * mostraria o "&ldquo;" literal se não fizéssemos isso.
 */
export function decodeHtmlEntities(text: string): string {
  if (!text.includes("&")) return text;
  const textarea = document.createElement("textarea");
  textarea.innerHTML = text;
  return textarea.value;
}

/**
 * Prepara um texto para a meta description: troca entidades, junta
 * espaços/quebras de linha e corta em ~160 caracteres sem partir palavra.
 */
export function toMetaDescription(text: string, max = 160): string {
  const clean = decodeHtmlEntities(text).replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, clean.lastIndexOf(" ", max)) + "…";
}
