const facts = [
  {
    k: "Experiência",
    v: "Mais de 1 ano contribuindo para projetos reais da rede do IFRN",
  },
  {
    k: "Formação",
    v: "Tecnólogo em Sistemas para Internet (IFRN)",
  },
  {
    k: "Base técnica",
    v: "Técnico em Informática para Internet (IMD/UFRN)",
  },
];

export default function About() {
  return (
    <section id="sobre" className="mx-auto max-w-220 px-7 py-24">
      <span className="mb-4 block text-center text-[13px] uppercase tracking-[0.08em] text-muted">
        Sobre
      </span>
      <div className="grid gap-14 text-left sm:grid-cols-[1.3fr_1fr]">
        <div className="space-y-4">
          <p className="text-[15px] text-secondary">
            Apaixonado por tecnologia desde os 8 anos, o que começou como
            fantasia de criança se transformou no meu propósito de vida.
            Inspirado pela biologia, física e astronomia, transformei essa
            curiosidade em uma jornada acadêmica e profissional.
          </p>
          <p className="text-[15px] text-secondary">
            Hoje, aos 19 anos, curso Tecnologia em Sistemas para Internet no
            IFRN e oriento futuros cientistas da computação — ministro
            minicursos para jovens que desejam ingressar na área.
          </p>
        </div>
        <div className="flex flex-col">
          {facts.map((f, i) => (
            <div
              key={f.k}
              className={`py-4 ${i !== facts.length - 1 ? "border-b border-line" : ""} ${
                i === 0 ? "pt-0" : ""
              }`}
            >
              <span className="mb-1 block text-xs text-muted">{f.k}</span>
              <span className="text-sm text-paper">{f.v}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
