import { FormEvent, ReactNode, useState, useId, cloneElement, isValidElement } from "react";

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
  const fieldId = useId();
  const input = isValidElement(children as any)
    ? cloneElement(children as any, { id: fieldId })
    : children;
  return (
    <label className={className} htmlFor={fieldId}>
      <span className="field-label">{label}</span>
      {input}
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
