export interface SkillCategory {
  title: string;
  description: string;
}

export const skills: SkillCategory[] = [
  {
    title: "Front-end",
    description:
      "React, TypeScript, Next.js, Vite e TailwindCSS para interfaces rápidas e bem estruturadas.",
  },
  {
    title: "Back-end",
    description:
      "Node.js, Express, Python e Django REST Framework para APIs sólidas e escaláveis.",
  },
  {
    title: "Dados",
    description:
      "MySQL, PostgreSQL, MongoDB e SQLite — modelagem relacional e não-relacional.",
  },
  {
    title: "Ferramentas",
    description:
      "Git, GitHub, Docker e arquitetura MVC no fluxo diário de desenvolvimento.",
  },
];
