import { useRef } from "react";
import { Link } from "react-router-dom";
import { links, projects as projectsCopy } from "../../content/ui";
import { projectSlug, type Project } from "../../data/projects";
import { getProjectShape } from "../../lib/asciiShapes";
import ExternalArrow from "../ui/ExternalArrow";
import HoloCard from "../ui/HoloCard";
import ProjectThumb from "./ProjectThumb";

interface ProjectCardProps {
  project: Project;
  /** Posição em projects.ts: os 2 primeiros são "missão principal" (D2). */
  index: number;
}

export default function ProjectCard({ project, index }: ProjectCardProps) {
  const activeRef = useRef(false);
  const isMain = index < projectsCopy.mainMissionCount;

  return (
    <HoloCard
      // Abaixo de 860px a altura vem do conteúdo (texto não é cortado, R2 I-3);
      // a partir de 860px o card é 4:5 como no protótipo.
      className="w-full max-tab:h-full tab:aspect-4/5"
      innerClassName="flex flex-col"
      onActiveChange={(active) => {
        activeRef.current = active;
      }}
    >
      <ProjectThumb
        shape={getProjectShape(project.name)}
        activeRef={activeRef}
      />

      <div className="flex flex-1 flex-col gap-2 px-gutter py-5">
        <span
          className={`font-dot text-chapter tracking-label ${
            isMain ? "text-gold" : "text-accent-soft"
          }`}
        >
          {isMain ? projectsCopy.rarityMain : projectsCopy.raritySide}
        </span>
        {/* O card inteiro leva à página do projeto: o ::after do link
            cobre o card (o HoloCard por dentro é relative) */}
        <h3 className="text-title">
          <Link
            to={`/projetos/${projectSlug(project)}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {project.name}
          </Link>
        </h3>
        <p className="text-sm leading-[1.45] text-secondary">
          {project.description}
        </p>

        {/* Tecnologias em sans (item 8); "GitHub ↗" em texto */}
        <div className="mt-auto flex justify-between gap-3 text-small text-secondary">
          <span>{project.topics.join(" · ")}</span>
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            // relative z-10: fica acima do link do card (o GitHub é externo)
            className="relative z-10 shrink-0 text-paper hover:underline"
          >
            {projectsCopy.cardGithubLink}
            <ExternalArrow />
            <span className="sr-only">
              {" "}
              {project.name} {links.newTabLabel}
            </span>
          </a>
        </div>
      </div>
    </HoloCard>
  );
}
