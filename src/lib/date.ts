import { blog } from "../content/ui";

/**
 * Formata uma data "AAAA-MM-DD" (front matter do Hugo) como "06 jun 2026".
 * Lemos os números direto do texto para não sofrer com fuso horário
 * (new Date("2026-06-06") é meia-noite UTC, que no Brasil ainda é dia 5).
 */
export function formatShortDate(iso: string): string {
  const [year, month, day] = iso.slice(0, 10).split("-");
  const monthIndex = Number(month) - 1;
  if (!year || !day || !blog.monthsShort[monthIndex]) return iso;
  return `${day} ${blog.monthsShort[monthIndex]} ${year}`;
}

/**
 * Data por extenso com o dia da semana, como numa dataline de jornal:
 * "2026-06-06" → "Sábado, 6 de junho de 2026" (adendo v3).
 * Formata em UTC para o dia não voltar um (mesmo motivo de formatShortDate).
 */
export function formatLongDate(iso: string): string {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  const text = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Minutos de leitura a partir do texto do Hugo ("3 min de leitura" → 3). */
export function readMinutes(readTime: string): number | null {
  const minutes = Number(/\d+/.exec(readTime)?.[0]);
  return minutes > 0 ? minutes : null;
}

/** Data por extenso sem o dia da semana: "2026-06-06" → "6 de junho de 2026". */
export function formatMediumDate(iso: string): string {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
