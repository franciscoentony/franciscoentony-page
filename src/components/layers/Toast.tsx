import { useEffect, useRef, useState, type ReactNode } from "react";
import { ToastContext, type ToastMessage } from "../../hooks/useToast";
import { TOAST } from "../../lib/motion";

/** Envolve o app e desenha o toast fixo na parte de baixo da tela. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<ToastMessage | null>(null);
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(0);

  function showToast(newMessage: ToastMessage) {
    setMessage(newMessage);
    setVisible(true);
    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setVisible(false), TOAST.duration);
  }

  // Limpa o timer se o componente sair da tela
  useEffect(() => {
    return () => window.clearTimeout(timeoutRef.current);
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}

      {/* role="status" faz o leitor de tela anunciar a mensagem */}
      <div
        role="status"
        aria-live="polite"
        className={`fixed bottom-8 left-1/2 z-60 -translate-x-1/2 rounded-full border border-line bg-toast px-4.5 py-2.5 text-[13px] transition duration-500 ${
          visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-5 opacity-0"
        }`}
      >
        {message && (
          <>
            {message.badge && (
              <b className="mr-1.5 font-dot font-black text-gold">{message.badge}</b>
            )}
            {message.text}
          </>
        )}
      </div>
    </ToastContext.Provider>
  );
}
