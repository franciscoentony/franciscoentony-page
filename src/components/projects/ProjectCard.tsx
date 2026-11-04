import { useRef } from "react";
import { links, projects as projectsCopy } from "../../content/ui";
import type { Project } from "../../data/projects";
import { getProjectShape } from "../../lib/asciiShapes";
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
      className="aspect-4/5 w-full"
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
          className={`font-mono text-label-sm tracking-label-wider ${
            isMain ? "text-gold" : "text-accent-soft"
          }`}
        >
          {isMain ? projectsCopy.rarityMain : projectsCopy.raritySide}
        </span>
        <h3 className="text-title">{project.name}</h3>
        <p className="text-sm leading-[1.45] text-secondary">
          {project.description}
        </p>

        <div className="mt-auto flex justify-between gap-3 font-mono text-label text-secondary">
          <span>{project.topics.join(" · ")}</span>
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-paper hover:underline"
          >
            {projectsCopy.cardGithubLink}
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
