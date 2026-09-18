import { FormEvent, ReactNode, useState } from "react";

export { Modal } from "./components/Modal";

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
    <label className={className}>
      <span className="field-label">{label}</span>
      {children}
    </label>
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
