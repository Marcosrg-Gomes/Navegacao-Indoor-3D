import React, { useEffect, useId, useRef } from "react";

type ModalProps = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number | string;
};

export function Modal({ title, onClose, children, width }: ModalProps) {
  const titleId = useId();
  const dialog = useRef<HTMLDivElement>(null);
  const previousRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    // Captura o elemento que teve foco/clique antes de abrir este modal
    const handleFocus = (e: FocusEvent) => {
      if (!dialog.current || !dialog.current.contains(e.target as Node)) {
        previousRef.current = e.target as HTMLElement;
      }
    };
    const handleMouseDown = (e: MouseEvent) => {
      if (!dialog.current || !dialog.current.contains(e.target as Node)) {
        previousRef.current = e.target as HTMLElement;
      }
    };
    document.addEventListener("focus", handleFocus, true);
    document.addEventListener("mousedown", handleMouseDown, true);
    previousRef.current = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        // Restaura o foco ao elemento anterior ANTES de fechar o modal
        previousRef.current?.focus();
        onClose();
      }
      if (e.key === "Tab") {
        const elements = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select, textarea, [tabindex="0"]') || []);
        const first = elements[0], last = elements[elements.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("focus", handleFocus, true);
      document.removeEventListener("mousedown", handleMouseDown, true);
      window.removeEventListener("keydown", handleKeyDown);
      // WebKit pode precisar de múltiplas tentativas para restaurar o foco após o modal fechar
      const restore = () => previousRef.current?.focus();
      restore();
      setTimeout(restore, 50);
      setTimeout(restore, 150);
      setTimeout(restore, 300);
    };
  }, [title]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="modal"
        style={width ? { maxWidth: width } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3 id={titleId}>{title}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
