export interface Project {
  name: string; // repo-style name, e.g. "connect-responsibly"
  description: string;
  language: string;
  languageColor: string; // hex, matches GitHub's real language colors
  topics: string[];
  url: string;
}

export const projects: Project[] = [
  {
    name: "connect-responsibly",
    description:
      "Conecta doadores a donatários, facilitando a chegada de doações à pessoa certa.",
    language: "Python",
    languageColor: "#3572A5",
    topics: ["django", "mysql"],
    url: "https://github.com/franciscoentony/connect-responsibily",
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
