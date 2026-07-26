import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { skills } from "../data/skills";

export default function Skills() {
  return (
    <section
      id="habilidades"
      className="mx-auto max-w-220 px-7 py-24 text-center"
    >
      <span className="mb-4 block text-[13px] uppercase tracking-[0.08em] text-muted">
        Skills
      </span>
      <h2 className="mb-3 text-3xl font-bold">O que eu trago pra mesa.</h2>
      <p className="mx-auto mb-12 max-w-115 text-[15px] text-secondary">
        Um resumo das tecnologias que uso no dia a dia, independente do tamanho
        do projeto.
      </p>

      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2">
        {skills.map(({ icon, color, title, description }) => (
          <div key={title} className="bg-ink p-8 text-left">
            <FontAwesomeIcon
              icon={icon}
              className={`mb-5 h-5.5 w-5.5 ${color}`}
            />
            <h3 className="mb-2 text-[17px] font-semibold">{title}</h3>
            <p className="text-sm text-secondary">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
