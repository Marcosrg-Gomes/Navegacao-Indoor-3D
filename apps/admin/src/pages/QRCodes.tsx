import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useToast } from "../toast";
import type { No, QRCode as QRCodeType } from "../types";
import { Modal } from "../components/Modal";
import { FormField } from "../components/FormField";
import { QrCodeViewer } from "../components/QrCodeViewer";

export default function QRCodes() {
  const toast = useToast();
  const [itens, setItens] = useState<QRCodeType[]>([]);
  const [nos, setNos] = useState<No[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<QRCodeType | null>(null);

  const [form, setForm] = useState({
    no_id: "",
    token: "",
    ativo: true,
  });

  async function loadData() {
    setLoading(true);
    try {
      const [q, n] = await Promise.all([
        api<QRCodeType[]>("/admin/qr-codes"),
        api<No[]>("/admin/nodes"),
      ]);
      setItens(q);
      setNos(n);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao carregar dados", "erro");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function startCreate() {
    setEditing(null);
    setForm({
      no_id: nos[0]?.id.toString() || "",
      token: "",
      ativo: true,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.no_id) {
      toast("Selecione um nó associado", "erro");
      return;
    }

    setSaving(true);
    try {
      const payload: { no_id: number; token?: string; ativo: boolean } = {
        no_id: Number(form.no_id),
        ativo: form.ativo,
      };
      if (form.token.trim()) {
        payload.token = form.token.trim();
      }

      await api(editing ? `/admin/qr-codes/${editing.id}` : "/admin/qr-codes", {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      toast(editing ? "QR Code atualizado!" : "QR Code gerado com sucesso!", "ok");
      setModalOpen(false);
      await loadData();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao criar QR Code", "erro");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: QRCodeType) {
    if (!window.confirm(`Excluir o QR Code com token "${item.token}"?`)) return;
    try {
      await api(`/admin/qr-codes/${item.id}`, { method: "DELETE" });
      toast("QR Code excluído", "ok");
      await loadData();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao excluir", "erro");
    }
  }

  return (
    <div>
      <div className="page-head no-print">
        <div>
          <h1>QR Codes de Localização</h1>
          <p>
            Geração visual offline de QR Codes vinculados a nós do mapa para totens, entradas e placas de teste.
          </p>
        </div>
        <div className="row-actions">
          <button onClick={() => window.print()} title="Imprimir todos os QR Codes em formato de etiquetas/folha">
            🖨️ Imprimir Folha
          </button>
          <button className="primary" onClick={startCreate} disabled={nos.length === 0}>
            + Gerar QR Code
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card">
          <p className="muted">Carregando QR Codes…</p>
        </div>
      ) : itens.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "40px 16px" }}>
          <span style={{ fontSize: 40 }}>📷</span>
          <p className="muted" style={{ marginTop: 12 }}>
            Nenhum QR Code cadastrado ainda.
          </p>
          <button className="primary" onClick={startCreate} style={{ marginTop: 12 }}>
            Gerar primeiro QR Code
          </button>
        </div>
      ) : (
        <div className="qr-grid">
          {itens.map((item) => {
            const no = nos.find((n) => n.id === item.no_id);
            const nodeName = no?.nome || `Nó #${item.no_id} (${no?.tipo || "corredor"})`;

            return (
              <div className="qr-card" key={item.id}>
                <QrCodeViewer
                  token={item.token}
                  nodeName={nodeName}
                  subLabel={`ID do Nó: #${item.no_id} · ${item.ativo ? "Ativo" : "Inativo"}`}
                />
                <div className="row-actions no-print" style={{ justifyContent: "center", marginTop: 12 }}>
                  <button onClick={() => {
                    setEditing(item);
                    setForm({ no_id: String(item.no_id), token: item.token, ativo: item.ativo });
                    setModalOpen(true);
                  }}>Editar</button>
                  <button className="danger" onClick={() => handleDelete(item)}>
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação */}
      {modalOpen && (
        <Modal title={editing ? "Editar QR Code" : "Gerar Novo QR Code"} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <FormField label="Nó de Origem Vinculado" required className="full">
                <select
                  value={form.no_id}
                  onChange={(e) => setForm({ ...form, no_id: e.target.value })}
                  required
                >
                  <option value="">Selecione o nó…</option>
                  {nos.map((n) => (
                    <option key={n.id} value={n.id}>
                      #{n.id} {n.nome ? `(${n.nome})` : ""} - {n.tipo} (Piso #{n.piso_id})
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Disponibilidade" className="full">
                <select value={String(form.ativo)} onChange={(e) => setForm({ ...form, ativo: e.target.value === "true" })}>
                  <option value="true">Ativo</option><option value="false">Inativo</option>
                </select>
              </FormField>

              <FormField
                label="Token Personalizado (Opcional)"
                hint="Deixe em branco para gerar um UUID automático, ou defina um token legível como 'ENTRADA-SUL'."
                className="full"
              >
                <input
                  type="text"
                  placeholder="Ex.: ENTRADA-PRINCIPAL, TOTEM-PISO-1"
                  value={form.token}
                  onChange={(e) => setForm({ ...form, token: e.target.value })}
                />
              </FormField>
            </div>

            <div className="form-actions" style={{ marginTop: 24 }}>
              <button type="button" onClick={() => setModalOpen(false)} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" className="primary" disabled={saving}>
                {saving ? "Salvando…" : editing ? "Salvar QR Code" : "Gerar QR Code"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
