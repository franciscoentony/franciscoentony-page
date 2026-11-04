/*
 * Formas dos thumbnails ASCII dos projetos (porte de "shapes" do protótipo).
 * Cada forma é uma função de distância (SDF): recebe um ponto (x, y) e
 * devolve um número negativo dentro da forma e positivo fora dela.
 */

export type ShapeName = "paw" | "gift" | "planet" | "film";

function circle(x: number, y: number, cx: number, cy: number, r: number) {
  return Math.hypot(x - cx, y - cy) - r;
}

export const shapes: Record<ShapeName, (x: number, y: number) => number> = {
  // Pata (petca)
  paw: (x, y) =>
    Math.min(
      circle(x, y, 0, 0.18, 0.28),
      circle(x, y, -0.42, -0.2, 0.13),
      circle(x, y, -0.15, -0.42, 0.13),
      circle(x, y, 0.15, -0.42, 0.13),
      circle(x, y, 0.42, -0.2, 0.13),
    ),

  // Presente (connect-responsibly)
  gift: (x, y) => {
    const box = Math.max(Math.abs(x) - 0.42, Math.abs(y - 0.12) - 0.34);
    const lid = Math.max(Math.abs(x) - 0.5, Math.abs(y + 0.3) - 0.1);
    const bow = Math.min(
      circle(x, y, -0.15, -0.5, 0.13),
      circle(x, y, 0.15, -0.5, 0.13),
    );
    return Math.min(box, lid, bow);
  },

  // Planeta com anel (franciscoentony-page)
  planet: (x, y) => {
    const sphere = Math.hypot(x, y) - 0.38;
    const ringY = (y + x * 0.25) / 0.28;
    const ring = Math.abs(Math.hypot(x, ringY) - 0.68) - 0.06;
    const ringBehind = -(sphere - 0.06) * (ringY < 0 ? 1 : -1e3);
    return Math.min(sphere, Math.max(ring, ringBehind));
  },

  // Rolo de filme (fullstack-filmes)
  film: (x, y) => {
    const outer = Math.hypot(x, y) - 0.5;
    let holes = 1;
    for (let k = 0; k < 5; k++) {
      const angle = (k / 5) * Math.PI * 2;
      holes = Math.min(
        holes,
        circle(x, y, Math.cos(angle) * 0.27, Math.sin(angle) * 0.27, 0.1),
      );
    }
    return Math.max(outer, -holes, -(Math.hypot(x, y) - 0.05));
  },
};

/** Ícone de cada projeto, pelo nome do repositório. Projetos novos usam "planet". */
const projectShapes: Record<string, ShapeName> = {
  petca: "paw",
  "connect-responsibly": "gift",
  "franciscoentony-page": "planet",
  "fullstack-filmes": "film",
};

export function getProjectShape(projectName: string): ShapeName {
  return projectShapes[projectName] ?? "planet";
}
