export interface ExperienceItem {
  dates: string;
  role: string;
  org: string;
  description: string;
}

export const experience: ExperienceItem[] = [
  {
    dates: "ago 2025 — atual",
    role: "Engenheiro de Software",
    org: "Núcleo de Inovação em Computação (NIC) · IFRN Campus Canguaretama",
    description:
      "Desenvolvimento de sistemas em colaboração com professores, alunos e servidores — incluindo A Praça da Paz e o EVINST. Suporte à equipe na adoção de tecnologias modernas.",
  },
  {
    dates: "jan 2026 — abr 2026",
    role: "Tutor de Aprendizagem em Laboratório",
    org: "IFRN",
    description:
      "Orientação de cerca de 30 alunos em Programação Orientada a Objetos (Java) e Programação Estruturada (Python).",
  },
];
