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
    // Dados abaixo extraídos do README e do repositório público (nov/2026).
    tagline:
      "Um sistema de gerenciamento de doações que conecta doadores a campanhas de arrecadação, com ONGs servindo como ponte.",
    period: "ago 2026 — out 2026",
    status: "No ar",
    demoUrl: "https://connect-ecru-one.vercel.app",
    chapters: [
      {
        title: "Sobre o projeto",
        text: "Com o objetivo de eliminar o receio de pessoas para doar itens aos necessitados, o Connect é destinado a doadores, ou possíveis doadores, que querem tornar a vida de pessoas carentes melhor.",
      },
    ],
    specs: [
      { label: "Front-end", value: "Next.js, React, Tailwind CSS, HeroUI" },
      { label: "Back-end", value: "Node.js, Express, JWT" },
      { label: "Banco de dados", value: "PostgreSQL" },
      { label: "Infraestrutura", value: "Docker, Cloudflare, Vercel" },
    ],
  },
  {
    name: "petca",
    description:
      "Conecta cidadãos que avistam animais em situação de rua a ONGs de resgate.",
    language: "JavaScript",
    languageColor: "#F1E05A",
    topics: ["react-native", "drf", "pytest"],
    url: "https://github.com/franciscoentony/petca",
    period: "jun 2026 — jul 2026",
  },
  {
    name: "franciscoentony-page",
    description:
      "Página pessoal com projetos, palestras e aulas ministradas, com blog próprio.",
    language: "TypeScript",
    languageColor: "#3178C6",
    topics: ["vite", "go", "hugo"],
    url: "https://github.com/franciscoentony/franciscoentony-page",
    // Textos da frame "Versão que eu queria dos projetos" (Figma 108:5),
    // aprovados pelo Entony em 06/11/2026.
    tagline:
      "O site que você está lendo: um universo ASCII com um planeta no meio.",
    period: "dez 2025 — atual",
    role: "Design e código",
    status: "No ar",
    demoUrl: "https://franciscoentony.com",
    results: [
      { value: "2", label: "posts publicados no blog" },
      { value: "3", label: "níveis de qualidade de animação" },
      { value: "0", label: "dependências de animação" },
    ],
    chapters: [
      {
        title: "O problema",
        text: "O portfólio antigo era uma lista de cards. Dizia o que eu fiz, não quem eu sou.",
      },
      {
        title: "A solução",
        text: "Um universo jogável: um planeta em ASCII, uma ficha de personagem e missões no lugar de projetos.",
      },
      {
        title: "O que eu fiz",
        text: "React 19, Vite e Tailwind na interface; Hugo gerando o blog em JSON; tudo publicado no GitHub Pages.",
      },
      {
        title: "O que aprendi",
        text: "A deixar o efeito em um lugar só. O resto da página precisa respirar.",
      },
    ],
    screens: [
      {
        src: "/projetos/franciscoentony-page/home.jpg",
        alt: "A Home do site, com o título “Construo sistemas que resolvem problemas reais” e o planeta ASCII.",
        width: 1440,
        height: 900,
        caption: "A Home, com o planeta ASCII no centro.",
      },
      {
        src: "/projetos/franciscoentony-page/blog.jpg",
        alt: "A página do blog, com a lista de posts.",
        width: 1440,
        height: 900,
        caption: "O blog lê o JSON do Hugo.",
      },
      {
        src: "/projetos/franciscoentony-page/mobile.jpg",
        alt: "A Home no celular, com o astronauta e o planeta ASCII.",
        width: 780,
        height: 1688,
        caption: "No celular o planeta fica menor e mais lento, de propósito.",
      },
    ],
    specs: [
      { label: "Front-end", value: "React 19, TypeScript, Tailwind CSS v4" },
      { label: "Build", value: "Vite, Bun" },
      { label: "Blog", value: "Hugo (Markdown → JSON)" },
      { label: "Deploy", value: "GitHub Pages, GitHub Actions" },
    ],
  },
  {
    name: "fullstack-filmes",
    description:
      "Autenticação, CRUD, permissões e rotas privadas em uma aplicação completa.",
    language: "JavaScript",
    languageColor: "#F1E05A",
    topics: ["node", "mongodb", "jwt"],
    url: "https://github.com/franciscoentony/fullstack-filmes",
    period: "mar 2026",
    specs: [
      { label: "Front-end", value: "React (Vite)" },
      { label: "Back-end", value: "Node.js, Express" },
      { label: "Banco de dados", value: "MongoDB" },
      { label: "Autenticação", value: "JWT" },
    ],
  },
];
