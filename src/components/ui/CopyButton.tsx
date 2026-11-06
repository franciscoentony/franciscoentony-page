import { useEffect, useRef } from "react";
import { useQuality } from "../../hooks/useQuality";
import { decodeText } from "../../lib/decodeText";

interface CopyButtonProps {
  /** O que vai para a área de transferência (função: lido na hora do clique). */
  value: string | (() => string);
  /** Rótulo parado ("Copiar link"). Também é o nome acessível do botão. */
  idle: string;
  /** Nome acessível, quando o rótulo não diz a ação (ex.: o próprio e-mail). */
  label?: string;
  /** Rótulo depois de copiar ("Link copiado"). */
  done: string;
  /** Rótulo se a cópia falhar ("Não deu para copiar"). */
  failed: string;
  /** Classes do botão. Padrão: texto que clareia no hover. */
  className?: string;
}

/** Quanto tempo o rótulo "Link copiado" fica antes de voltar (ms). */
const HOLD_MS = 2200;

/**
 * Botão de texto que copia algo (adendo v3, "Feedback de copiar").
 * O rótulo se decodifica em glifos ASCII até virar "Link copiado" e depois
 * volta. Sem toast. No nível Baixo e com reduced motion, o texto troca direto.
 * O leitor de tela ouve a versão limpa por uma região aria-live.
 */
export default function CopyButton({
  value,
  idle,
  label,
  done,
  failed,
  className = "transition-colors duration-300 hover:text-paper",
}: CopyButtonProps) {
  const labelRef = useRef<HTMLSpanElement>(null);
  const liveRef = useRef<HTMLSpanElement>(null);
  const isStatic = useQuality().quality === "baixo";
  const timers = useRef<{ hold?: number; stopDecode?: () => void }>({});

  // Ao desmontar, para a animação e o timer
  useEffect(() => {
    const current = timers.current;
    return () => {
      window.clearTimeout(current.hold);
      current.stopDecode?.();
    };
  }, []);

  function showLabel(text: string) {
    const label = labelRef.current;
    if (!label) return;
    timers.current.stopDecode?.();
    if (isStatic) {
      label.textContent = text;
    } else {
      timers.current.stopDecode = decodeText(label, text);
    }
  }

  function handleClick() {
    const text = typeof value === "function" ? value() : value;
    const copying = navigator.clipboard
      ? navigator.clipboard.writeText(text)
      : Promise.reject(new Error("sem área de transferência"));

    copying
      .then(
        () => done,
        () => failed,
      )
      .then((message) => {
        showLabel(message);
        if (liveRef.current) liveRef.current.textContent = message;
        window.clearTimeout(timers.current.hold);
        timers.current.hold = window.setTimeout(() => showLabel(idle), HOLD_MS);
      });
  }

  return (
    <>
      <button
        type="button"
        aria-label={label ?? idle}
        onClick={handleClick}
        className={className}
      >
        {/* tabular-nums não ajuda aqui; o rótulo muda de largura e tudo bem */}
        <span ref={labelRef}>{idle}</span>
      </button>
      <span ref={liveRef} aria-live="polite" className="sr-only" />
    </>
  );
}
