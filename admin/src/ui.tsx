import { FormEvent, ReactNode, useState } from "react";

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label>{label}</label>
      {children}
    </div>
  );
}

export function confirmDelete(nome: string) {
  return window.confirm(`Excluir ${nome}? Esta ação não pode ser desfeita.`);
}

export function FormActions({
  onCancel,
  busy,
  saveLabel = "Salvar",
}: {
  onCancel: () => void;
  busy?: boolean;
  saveLabel?: string;
}) {
  return (
    <div className="modal-actions">
      <button type="button" onClick={onCancel}>
        Cancelar
      </button>
      <button className="primary" disabled={busy}>
        {busy ? "Salvando…" : saveLabel}
      </button>
    </div>
  );
}

export function useBusySubmit() {
  const [busy, setBusy] = useState(false);
  async function run(e: FormEvent, fn: () => Promise<void>) {
    e.preventDefault();
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }
  return { busy, run };
}
