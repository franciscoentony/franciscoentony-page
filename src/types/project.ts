export interface Technology {
  name: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  technologies: Technology[];
  github: string;
  demo: string;
}
