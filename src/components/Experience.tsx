import { experience } from "../data/experience";

export default function Experience() {
  return (
    <section id="experiencia" className="mx-auto max-w-220 px-7 py-24">
      <div className="mb-12 text-center">
        <span className="mb-4 block text-[13px] uppercase tracking-[0.08em] text-muted">
          Experiência
        </span>
        <h2 className="text-3xl font-bold">Onde já botei a mão no código.</h2>
      </div>

      <div className="border-l border-line-strong text-left">
        {experience.map((item, i) => (
          <div key={i} className="relative pb-10 pl-7 last:pb-0">
            <span className="absolute -left-1.25 top-1 h-2.25 w-2.25 rounded-full border-2 border-accent bg-ink" />
            <div className="mb-1.5 font-mono text-xs text-muted">
              {item.dates}
            </div>
            <h3 className="mb-1 text-base font-semibold">{item.role}</h3>
            <div className="mb-2.5 text-[13px] text-accent">{item.org}</div>
            <p className="max-w-140 text-sm text-secondary">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
