import { useEffect, useState } from "react";
import { api } from "../api";
import { useToast } from "../toast";
import type { No, QRCode } from "../types";
import { Field, FormActions, Modal, confirmDelete, useBusySubmit } from "../ui";

function qrImage(token: string) {
  const base = import.meta.env.VITE_PUBLIC_APP_URL || "http://localhost:5174";
  const payload = `${base}/?qr=${encodeURIComponent(token)}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(payload)}`;
}

export default function QRCodes() {
  const toast = useToast();
  const { busy, run } = useBusySubmit();
  const [itens, setItens] = useState<QRCode[]>([]);
  const [nos, setNos] = useState<No[]>([]);
  const [open, setOpen] = useState(false);
  const [noId, setNoId] = useState("");
  const [token, setToken] = useState("");

  async function load() {
    const [q, n] = await Promise.all([api<QRCode[]>("/admin/qr-codes"), api<No[]>("/admin/nodes")]);
    setItens(q);
    setNos(n);
  }

  useEffect(() => {
    load().catch((e) => toast(e.message, "erro"));
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>QR Codes</h1>
          <p>Cada código aponta para um nó de origem. Use Imprimir para gerar a folha de testes.</p>
        </div>
        <div className="row-actions">
          <button onClick={() => window.print()}>Imprimir</button>
          <button
            className="primary"
            onClick={() => {
              setNoId(nos[0]?.id.toString() || "");
              setToken("");
              setOpen(true);
            }}
          >
            Gerar QR Code
          </button>
        </div>
      </div>
      <div className="qr-grid">
        {itens.map((item) => (
          <div className="qr-card" key={item.id}>
            <img src={qrImage(item.token)} alt={item.token} />
            <p>
              <code>{item.token}</code>
            </p>
            <p className="muted">Nó #{item.no_id} · {nos.find((n) => n.id === item.no_id)?.nome || "sem nome"}</p>
            <div className="row-actions no-print" style={{ justifyContent: "center" }}>
              <button
                className="danger"
                onClick={async () => {
                  if (!confirmDelete(item.token)) return;
                  try {
                    await api(`/admin/qr-codes/${item.id}`, { method: "DELETE" });
                    toast("QR excluído", "ok");
                    await load();
                  } catch (e) {
                    toast(e instanceof Error ? e.message : "Erro", "erro");
                  }
                }}
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
      {open && (
        <Modal title="Novo QR Code" onClose={() => setOpen(false)}>
          <form
            onSubmit={(e) =>
              run(e, async () => {
                const payload: { no_id: number; token?: string } = { no_id: Number(noId) };
                if (token.trim()) payload.token = token.trim();
                try {
                  await api("/admin/qr-codes", { method: "POST", body: JSON.stringify(payload) });
                  toast("QR gerado", "ok");
                  setOpen(false);
                  await load();
                } catch (err) {
                  toast(err instanceof Error ? err.message : "Erro", "erro");
                }
              })
            }
          >
            <div className="form-grid">
              <Field label="Nó" className="full">
                <select value={noId} onChange={(e) => setNoId(e.target.value)} required>
                  {nos.map((n) => (
                    <option key={n.id} value={n.id}>
                      #{n.id} {n.nome || n.tipo}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Token (opcional — UUID se vazio)" className="full">
                <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="ENTRADA-PRINCIPAL" />
              </Field>
            </div>
            <FormActions onCancel={() => setOpen(false)} busy={busy} saveLabel="Gerar" />
          </form>
        </Modal>
      )}
    </div>
  );
}
