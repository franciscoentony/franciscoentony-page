import { faCode, faServer, faDatabase, faCodeBranch } from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export interface SkillCategory {
  icon: IconDefinition;
  color: string; // tailwind text-color class for the icon
  title: string;
  description: string;
}

export const skills: SkillCategory[] = [
  {
    icon: faCode,
    color: "text-accent",
    title: "Front-end",
    description:
      "React, TypeScript, Next.js, Vite e TailwindCSS para interfaces rápidas e bem estruturadas.",
  },
  {
    icon: faServer,
    color: "text-emerald-400",
    title: "Back-end",
    description:
      "Node.js, Express, Python e Django REST Framework para APIs sólidas e escaláveis.",
  },
  {
    icon: faDatabase,
    color: "text-amber-400",
    title: "Dados",
    description:
      "MySQL, PostgreSQL, MongoDB e SQLite — modelagem relacional e não-relacional.",
  },
  {
    icon: faCodeBranch,
    color: "text-rose-400",
    title: "Ferramentas",
    description:
      "Git, GitHub, Docker e arquitetura MVC no fluxo diário de desenvolvimento.",
  },
];
