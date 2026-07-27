export interface Post {
  hash: string; // short faux commit-hash, purely stylistic
  slug: string;
  title: string;
  summary: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  cover: string;
  content: string;
}

// export const posts: Post[] = [
//   {
//     hash: "a3f9c1d",
//     slug: "conectando-react-native-a-django-rest",
//     title: "Conectando um app React Native a uma API Django REST",
//     excerpt:
//       "Como estruturei a comunicação entre o app do PetCa e a API, incluindo autenticação e tratamento de erros de rede.",
//     date: "12 jul 2026",
//     readTime: "5 min de leitura",
//     tags: ["react-native", "django-rest"],
//   },
//   {
//     hash: "e02b7f4",
//     slug: "o-que-aprendi-orientando-30-alunos",
//     title:
//       "O que aprendi orientando 30 alunos em Programação Orientada a Objetos",
//     excerpt:
//       "Reflexões da tutoria no IFRN: os erros mais comuns de quem está começando em POO e como expliquei cada um.",
//     date: "02 abr 2026",
//     readTime: "6 min de leitura",
//     tags: ["ensino", "java", "poo"],
//   },
//   {
//     hash: "9c4d21a",
//     slug: "bastidores-do-evinst",
//     title:
//       "Bastidores do EVINST: construindo um sistema para toda a rede do IFRN",
//     excerpt:
//       "Decisões de arquitetura, desafios de escala e o que mudou do primeiro protótipo até a versão em produção.",
//     date: "18 fev 2026",
//     readTime: "8 min de leitura",
//     tags: ["arquitetura", "django", "mysql"],
//   },
//   {
//     hash: "5f1e88c",
//     slug: "por-que-mvc-ainda-importa",
//     title: "Por que arquitetura MVC ainda importa em 2026",
//     excerpt:
//       "Um pouco sobre por que ainda organizo meus projetos em MVC mesmo com tantos frameworks novos por aí.",
//     date: "30 jan 2026",
//     readTime: "4 min de leitura",
//     tags: ["arquitetura", "boas-praticas"],
//   },
// ];
