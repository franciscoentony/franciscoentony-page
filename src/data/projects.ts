export interface Project {
  name: string; // repo-style name, e.g. "connect-responsibly"
  description: string;
  language: string;
  languageColor: string; // hex, matches GitHub's real language colors
  topics: string[];
  url: string;

  // ---- Campos opcionais da página do projeto (/projetos/:slug, adendo v3) ----
  // Todos opcionais e, por enquanto, sem valor: campo vazio = a parte some.
  tagline?: string; // até 180 caracteres; sem ela, a página usa description
  period?: string; // ex.: "mar 2025 — jun 2025"
  role?: string; // ex.: "Full-stack, solo"
  status?: string; // ex.: "Em produção"
  demoUrl?: string; // vira o botão "Ver no ar"
  results?: { value: string; label: string }[]; // até 3, viram uma frase
  /** Capítulos com títulos livres (ex.: "O problema"). Parágrafos separados por linha em branco. */
  chapters?: { title: string; text: string }[];
  /** Ficha técnica. Sem ela: Linguagem (language) + Ferramentas (topics). */
  specs?: { label: string; value: string }[];
  screens?: {
    src: string;
    alt: string;
    width: number;
    height: number;
    caption?: string;
  }[]; // até 5
}

/** Slug da URL do projeto, a partir do name (ex.: "connect-responsibly"). */
export function projectSlug(project: Project): string {
  return project.name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const projects: Project[] = [
  {
    name: "connect",
    description:
      "Conecta doadores a donatários, facilitando a chegada de doações à pessoa certa.",
    language: "Javascript",
    languageColor: "#F1E05A",
    topics: ["React.JS", "Next.JS", "Docker", "PostgreSQL"],
    url: "https://github.com/franciscoentony/connect",
  },
  {
    name: "petca",
    description:
      "Conecta cidadãos que avistam animais em situação de rua a ONGs de resgate.",
    language: "JavaScript",
    languageColor: "#F1E05A",
    topics: ["react-native", "drf", "pytest"],
    url: "https://github.com/franciscoentony/petca",
  },
  {
    name: "franciscoentony-page",
    description:
      "Página pessoal com projetos, palestras e aulas ministradas, com blog próprio.",
    language: "TypeScript",
    languageColor: "#3178C6",
    topics: ["vite", "go", "hugo"],
    url: "https://github.com/franciscoentony/franciscoentony-page",
  },
  {
    name: "fullstack-filmes",
    description:
      "Autenticação, CRUD, permissões e rotas privadas em uma aplicação completa.",
    language: "JavaScript",
    languageColor: "#F1E05A",
    topics: ["node", "mongodb", "jwt"],
    url: "https://github.com/franciscoentony/fullstack-filmes",
  },
];
