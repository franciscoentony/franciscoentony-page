import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder } from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { projects } from "../data/projects";

export default function Projects() {
  return (
    <section id="projetos" className="mx-auto max-w-220 px-7 py-24">
      <div className="mb-12 text-center">
        <span className="mb-4 block text-[13px] uppercase tracking-[0.08em] text-muted">
          Projetos
        </span>
        <h2 className="text-3xl font-bold">O que eu construí.</h2>
      </div>

      <div className="flex flex-col gap-3.5 text-left">
        {projects.map((p) => (
          <div
            key={p.name}
            className="rounded-md border border-line bg-raised px-6 py-5 transition-colors hover:border-line-strong"
          >
            <div className="mb-2 flex items-center gap-2.5">
              <FontAwesomeIcon icon={faFolder} className="h-4 w-4 text-muted" />
              <span className="font-mono text-[15px] font-medium text-accent">
                {p.name}
              </span>
            </div>
            <p className="mb-4 max-w-150 text-sm text-secondary">
              {p.description}
            </p>
            <div className="flex flex-wrap items-center gap-5">
              <div className="flex items-center gap-1.5 text-[13px] text-secondary">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: p.languageColor }}
                />
                {p.language}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {p.topics.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs text-accent"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <a
                href={p.url}
                target="_blank"
                rel="noreferrer"
                className="ml-auto flex items-center gap-1.5 text-[13px] text-secondary hover:text-paper"
              >
                <FontAwesomeIcon icon={faGithub} className="h-3.5 w-3.5" />
                View on GitHub
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
