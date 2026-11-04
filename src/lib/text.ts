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
