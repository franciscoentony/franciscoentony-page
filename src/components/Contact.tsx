import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";

export default function Contact() {
  return (
    <section id="contato" className="mx-auto max-w-220 px-7 py-24">
      <div className="mb-12 text-center">
        <span className="mb-4 block text-[13px] uppercase tracking-[0.08em] text-muted">
          Contato
        </span>
        <h2 className="mb-3 text-3xl font-bold">Bora trocar uma ideia?</h2>
        <p className="mx-auto max-w-110 text-[15px] text-secondary">
          Seja pra falar de projetos, oportunidades ou só trocar uma ideia sobre
          tecnologia.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 text-left sm:grid-cols-2">
        <div className="rounded-md border border-line bg-raised px-6 py-5">
          <span className="mb-2 block text-xs text-muted">Email</span>
          <div className="text-[17px] font-semibold">
            franciscoentonydev<span className="text-accent">@</span>gmail.com
          </div>
        </div>
        <div className="rounded-md border border-line bg-raised px-6 py-5">
          <span className="mb-2 block text-xs text-muted">Instagram</span>
          <div className="text-[17px] font-semibold">
            instagram.com/franciscoentony
          </div>
        </div>
        <div className="rounded-md border border-line bg-raised px-6 py-5">
          <span className="mb-2 block text-xs text-muted">GitHub</span>
          <div className="text-[17px] font-semibold">
            github.com/franciscoentony
          </div>
        </div>
        <div className="rounded-md border border-line bg-raised px-6 py-5">
          <span className="mb-2 block text-xs text-muted">LinkedIn</span>
          <div className="text-[17px] font-semibold">in/franciscoentony</div>
        </div>
        <a
          href="mailto:franciscoentonydev@gmail.com"
          className="flex items-center justify-between rounded-md border border-line bg-raised px-6 py-5 sm:col-span-2"
        >
          <span className="text-lg font-semibold">Enviar mensagem direta</span>
          <span className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-full bg-accent">
            <FontAwesomeIcon
              icon={faArrowUpRightFromSquare}
              className="h-4 w-4 text-white"
            />
          </span>
        </a>
      </div>
    </section>
  );
}
