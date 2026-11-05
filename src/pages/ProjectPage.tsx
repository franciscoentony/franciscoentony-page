import { useRef } from "react";
import { useParams } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import LocalNav from "../components/page/LocalNav";
import {
  CloneLine,
  DemoPill,
  GitHubLink,
  ProjectChapters,
  ProjectHero,
  ProjectOnward,
  ProjectResults,
  ProjectScreens,
  ProjectSpecs,
} from "../components/project/ProjectSections";
import {
  projectPage,
  projects as projectsCopy,
  sectionIds,
  seo,
} from "../content/ui";
import { projects, projectSlug } from "../data/projects";
import { usePageMeta } from "../hooks/usePageMeta";
import { toMetaDescription } from "../lib/text";

/**
 * Página de um projeto: /projetos/:slug (adendo v3,
 * docs/redesign/HANDOFF-ADENDO-V3-PROJETO-POST.md).
 *
 * De cima para baixo: local nav ("Projetos" é o voltar) → hero com o
 * emblema → telas → resultados → capítulos → ficha técnica → git clone →
 * "Próximo projeto.". Cada parte some quando o campo está vazio.
 */
export default function ProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const index = projects.findIndex((project) => projectSlug(project) === slug);
  const project = index === -1 ? null : projects[index];
  // O próximo é o seguinte em projects.ts; depois do último, volta ao 1º
  const next = project ? projects[(index + 1) % projects.length] : null;
  // D2: os 2 primeiros de projects.ts são missão principal
  const isMain = index !== -1 && index < projectsCopy.mainMissionCount;
  const titleRef = useRef<HTMLHeadingElement>(null);

  usePageMeta(
    project
      ? project.name + seo.titleSuffix
      : projectPage.notFoundTitle + seo.titleSuffix,
    project
      ? toMetaDescription(project.tagline || project.description)
      : undefined,
  );

  return (
    <div id="top">
      <Navbar />
      <LocalNav
        section={projectPage.section}
        sectionTo={`/#${sectionIds.projects}`}
        title={project?.name}
        titleRef={titleRef}
      >
        {project && (
          <>
            <GitHubLink
              project={project}
              className="transition-colors duration-300 hover:text-paper"
            />
            <DemoPill project={project} className="px-3.5 py-1.25" />
          </>
        )}
      </LocalNav>

      {/* overflow-x-clip: o emblema sangra até a borda sem criar scroll lateral */}
      <main className="min-h-svh overflow-x-clip pt-[calc(var(--spacing-nav)+var(--spacing-lnav))]">
        {!project && (
          <div className="mx-auto w-[min(880px,calc(100%-48px))] pt-14 tab:pt-22">
            <h1 className="text-page-title text-balance">
              {projectPage.notFoundTitle}
            </h1>
            <p className="mt-6 max-w-[34em] text-intro text-secondary">
              {projectPage.notFoundText}
            </p>
          </div>
        )}

        {project && next && (
          <>
            <ProjectHero
              project={project}
              isMain={isMain}
              titleRef={titleRef}
            />
            <ProjectScreens project={project} />
            <ProjectResults project={project} />
            <ProjectChapters project={project} />
            <ProjectSpecs project={project} />
            <CloneLine project={project} />
            {next !== project && <ProjectOnward next={next} />}
          </>
        )}
      </main>

      <div className="mt-30">
        <Footer />
      </div>
    </div>
  );
}
