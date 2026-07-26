const sparks = [
  { top: "8%", left: "12%", color: "#4F8CFF", rotate: "30deg" },
  { top: "18%", left: "82%", color: "#3ECF6E", rotate: "-20deg" },
  { top: "38%", left: "6%", color: "#E5484D", rotate: "60deg" },
  { top: "60%", left: "90%", color: "#F2C94C", rotate: "10deg" },
  { top: "78%", left: "14%", color: "#8B8B93", rotate: "-40deg" },
  { top: "85%", left: "78%", color: "#4F8CFF", rotate: "15deg" },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-7 pt-44 pb-24 text-center flex items-center flex-col">
      {sparks.map((s, i) => (
        <span
          key={i}
          className="absolute h-0.5 w-4 rounded-full opacity-55"
          style={{
            top: s.top,
            left: s.left,
            background: s.color,
            transform: `rotate(${s.rotate})`,
          }}
        />
      ))}

      <div className="absolute w-100 h-150 top-0 -z-10">
        <img src="/EU-PNG.png" alt="avatar" />
      </div>
      {/* <div className="mx-auto mb-5 flex h-19 w-19 items-center justify-center rounded-full border border-line-strong bg-raised">
        <FontAwesomeIcon icon={faUser} className="h-8 w-8 text-muted" />
      </div> */}

      <div className="mt-50 mb-9 inline-flex items-center gap-2 rounded-full border border-line-strong bg-raised px-4 py-2 text-sm font-medium">
        <span className="h-1.75 w-1.75 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(62,207,110,0.18)]" />
        Disponível para novos projetos
      </div>

      <h1 className="mx-auto mb-6 max-w-180 text-4xl font-bold leading-[1.08] sm:text-5xl">
        Eu programo e construo sistemas que resolvem problemas reais.
      </h1>
      <p className="mx-auto mb-10 max-w-115 text-[17px] text-secondary">
        Sou o Entony, Desenvolvedor Full-Stack. Ajudo a conectar pessoas e
        organizações através de software bem construído — do front ao back-end.
      </p>

      <div className="relative z-10 flex items-center justify-center gap-3">
        <a
          href="#projetos"
          className="rounded-full bg-paper px-6 py-3 text-sm font-semibold text-black"
        >
          Ver projetos
        </a>
        <a
          href="#contato"
          className="rounded-full border border-line-strong px-6 py-3 text-sm font-semibold hover:bg-raised"
        >
          Contato
        </a>
      </div>
    </section>
  );
}
