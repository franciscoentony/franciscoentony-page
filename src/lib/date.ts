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
