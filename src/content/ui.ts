/*
 * Copy de interface do redesign v3 (decisão D3).
 *
 * Tudo que é texto NOVO de componente (headline, capítulos, títulos de seção,
 * rótulos, toast...) fica aqui, num lugar só, para o Entony aprovar.
 * O conteúdo "de verdade" (experiências, projetos, skills, posts) continua
 * em src/data/ e NÃO deve ser copiado para cá.
 *
 * Status: AGUARDANDO APROVAÇÃO DO ENTONY (o merge na main depende disso).
 */

/** Um pedaço de texto. Com bold: true aparece em destaque (cor paper, peso 500). */
export interface TextPart {
  text: string;
  bold?: boolean;
}

/** Título com o final em gradiente (ex.: "Construo sistemas que resolvem" + "problemas reais."). */
export interface GradientTitle {
  start: string;
  gradient: string;
}

// ---------- Links e ids ----------

export const links = {
  email: "franciscoentonydev@gmail.com",
  github: "https://github.com/franciscoentony",
  linkedin: "https://www.linkedin.com/in/franciscoentony", // confirmado pelo Entony (D11)
};

/** Ids das seções da Home (usados pela navbar e pelos links "#..."). */
export const sectionIds = {
  top: "top",
  about: "sobre",
  skills: "habilidades",
  projects: "projetos",
  experience: "experiencia",
  blog: "blog",
  contact: "contato",
};

// ---------- Navbar ----------

export const navbar = {
  logo: "entony",
  logoLabel: "Francisco Entony, ir para o início",
  links: [
    { label: "Sobre", to: `/#${sectionIds.about}` },
    { label: "Habilidades", to: `/#${sectionIds.skills}` },
    { label: "Projetos", to: `/#${sectionIds.projects}` },
    { label: "Experiência", to: `/#${sectionIds.experience}` },
    { label: "Blog", to: "/blog" },
  ],
  cta: { label: "Contato", to: `/#${sectionIds.contact}` },
  menuOpenLabel: "Abrir menu",
  menuCloseLabel: "Fechar menu",
};

// ---------- Hero / Universe ----------

export const hero = {
  eyebrow: "Francisco Entony · Desenvolvedor Full-Stack",
  title: {
    start: "Construo sistemas que resolvem ",
    gradient: "problemas reais.",
  } as GradientTitle,
  primaryCta: "Ver projetos",
  secondaryCta: "Fale comigo ›",
  scrollHint: "Role para explorar",
};

export const chapters: {
  number: string;
  title: string;
  lead: TextPart[];
}[] = [
  {
    number: "01 — ORIGEM",
    title: "Tudo começou aos 8 anos.",
    lead: [
      { text: "Uma fantasia de criança que virou " },
      { text: "propósito de vida.", bold: true },
    ],
  },
  {
    number: "02 — CURIOSIDADE",
    title: "Biologia, física e astronomia.",
    lead: [
      { text: "A vontade de entender o universo " },
      { text: "virou código.", bold: true },
    ],
  },
  {
    number: "03 — AGORA",
    title: "Hoje, aos 19, eu construo. E ensino.",
    lead: [
      { text: "Full-stack no " },
      { text: "Grupo Strategi", bold: true },
      { text: " e no " },
      { text: "NIC · IFRN", bold: true },
      { text: ", orientando quem está começando." },
    ],
  },
];

// ---------- Player 1 (Sobre) ----------

export const player = {
  eyebrow: "Player 1",
  title: {
    start: "Um dev que trata cada sistema como ",
    gradient: "uma nova fase.",
  } as GradientTitle,
  lead: "Sou o Entony. Ajudo a conectar pessoas e organizações através de software bem construído, do front ao back-end. Curso Análise e Desenvolvimento de Sistemas no IFRN e ministro minicursos para jovens que querem entrar na área.",
  stats: [
    { value: 19, suffix: "", label: "anos de idade, 11 deles programando no imaginário" },
    { value: 30, suffix: "+", label: "alunos orientados em Java e Python" },
    { value: 4, suffix: "", label: "missões publicadas no GitHub" },
  ],
  card: {
    header: "FICHA · LV.",
    level: "19",
    name: "Francisco Entony",
    className: "Classe: Dev Full-Stack · Canguaretama, RN",
    photoAlt: "Foto de Francisco Entony",
    // Valores aprovados pelo Entony (D11).
    attributes: [
      { value: 92, label: "FRONT" },
      { value: 88, label: "BACK" },
      { value: 74, label: "DADOS" },
      { value: 99, label: "CURIO" },
    ],
  },
};

// ---------- Habilidades ----------

export const skills = {
  eyebrow: "Inventário",
  title: { start: "O que eu trago ", gradient: "pra mesa." } as GradientTitle,
  lead: [
    { text: "As ferramentas do dia a dia, independente do tamanho do projeto. " },
    { text: "Arraste para girar.", bold: true },
  ] as TextPart[],
  /** Tags da esfera 3D (derivadas das descrições de src/data/skills.ts). */
  sphereTags: [
    "React",
    "TypeScript",
    "Next.js",
    "Vite",
    "Tailwind",
    "Node.js",
    "Express",
    "Python",
    "Django REST",
    "Java",
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "SQL Server",
    "SQLite",
    "Git",
    "GitHub",
    "Docker",
    "MVC",
    "REST APIs",
    "React Native",
    "pytest",
  ],
};

// ---------- Projetos ----------

export const projects = {
  eyebrow: "Missões",
  title: "O que eu construí.",
  githubLink: "Ver tudo no GitHub ›",
  cardGithubLink: "GitHub ›",
  /** D2: os 2 primeiros projetos de projects.ts são principais, o resto secundários. */
  mainMissionCount: 2,
  rarityMain: "★ MISSÃO PRINCIPAL",
  raritySide: "◇ MISSÃO SECUNDÁRIA",
  carouselLabel: "Projetos (use as setas para navegar)",
  dotLabel: "Ir para o projeto",
};

// ---------- Experiência / Campanha ----------

export const experience = {
  eyebrow: "Campanha",
  title: { start: "Onde já botei a mão ", gradient: "no código." } as GradientTitle,
  lead: [
    { text: "Cada fase desbloqueou uma habilidade nova. " },
    { text: "A próxima pode ser com você.", bold: true },
  ] as TextPart[],
  nextPhase: {
    when: "PRÓXIMA FASE",
    title: "Bloqueada",
    action: "Press start ›",
  },
};

// ---------- Blog ----------

export const blog = {
  eyebrow: "Diário de bordo",
  title: "Anotações sobre código, dados e aprendizado.",
  allPostsLink: "Todos os posts ›",
  backLink: "‹ Voltar pro blog",
  loading: "Carregando posts...",
  error: "Não foi possível carregar os posts agora.",
  empty: "Nenhum post publicado ainda.",
  /** Meses abreviados para as datas dos cards (ex.: "06 jun 2026"). */
  monthsShort: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],
};

// ---------- Contato ----------

export const contact = {
  eyebrow: "Continue?",
  title: { start: "Bora trocar ", gradient: "uma ideia?" } as GradientTitle,
  lead: "Seja pra falar de projetos, oportunidades ou só sobre tecnologia.",
  githubLink: "GitHub ›",
  linkedinLink: "LinkedIn ›",
  copyEmailLabel: "Copiar e-mail",
};

// ---------- Cursor custom ----------

export const cursor = {
  holo: "INSPECIONAR",
  drag: "ARRASTE",
};

// ---------- Toast ----------

export const toast = {
  emailCopied: { badge: "+1", text: "E-mail copiado para o inventário" },
};

// ---------- Footer ----------

export const footer = {
  copyright: "© 2026 Francisco Entony",
  github: "GitHub",
  linkedin: "LinkedIn",
  blog: "Blog",
  backToTop: "Topo ↑",
};
