import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, assetUrl, uploadFile } from "../services/api";
import { useToast } from "../toast";
import type { Piso, Shopping } from "../types";
import { Modal } from "../components/Modal";
import { FormField } from "../components/FormField";

const emptyForm = {
  shopping_id: "",
  nome: "",
  nivel: "0",
  imagem_planta_url: "",
  largura_metros: "100",
  altura_metros: "60",
  ativo: true,
};

export default function Floors() {
  const toast = useToast();
  const nav = useNavigate();
  const [pisos, setPisos] = useState<Piso[]>([]);
  const [shoppings, setShoppings] = useState<Shopping[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal de edição / criação
  const [modalOpen, setModalOpen] = useState(false);
  const [editPiso, setEditPiso] = useState<Piso | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Upload de arquivo
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>();
  useEffect(() => {
    if (!selectedFile) { setPreviewUrl(undefined); return; }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedFile]);

  async function loadData() {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([
        api<Piso[]>("/admin/floors"),
        api<Shopping[]>("/admin/shoppings"),
      ]);
      setPisos(p);
      setShoppings(s);
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
    setEditPiso(null);
    setForm({
      ...emptyForm,
      shopping_id: shoppings[0]?.id.toString() || "",
    });
    setSelectedFile(null);
    setModalOpen(true);
  }

  function startEdit(item: Piso) {
    setEditPiso(item);
    setForm({
      shopping_id: String(item.shopping_id),
      nome: item.nome,
      nivel: String(item.nivel),
      imagem_planta_url: item.imagem_planta_url || "",
      largura_metros: item.largura_metros?.toString() ?? "100",
      altura_metros: item.altura_metros?.toString() ?? "60",
      ativo: item.ativo,
    });
    setSelectedFile(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.shopping_id || !form.nome.trim()) {
      toast("Preencha todos os campos obrigatórios", "erro");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        shopping_id: Number(form.shopping_id),
        nome: form.nome.trim(),
        nivel: Number(form.nivel),
        imagem_planta_url: form.imagem_planta_url.trim() || null,
        largura_metros: form.largura_metros ? Number(form.largura_metros) : null,
        altura_metros: form.altura_metros ? Number(form.altura_metros) : null,
        ativo: form.ativo,
      };

      let savedPiso: Piso;

      if (editPiso) {
        savedPiso = await api<Piso>(`/admin/floors/${editPiso.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        savedPiso = await api<Piso>("/admin/floors", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      // Se houver arquivo selecionado, faz o upload para o piso salvo
      if (selectedFile) {
        setEditPiso(savedPiso);
        setUploading(true);
        try {
          savedPiso = await uploadFile<Piso>(
            `/admin/floors/${savedPiso.id}/upload-planta`,
            selectedFile
          );
          toast("Imagem da planta enviada com sucesso!", "ok");
        } catch (uploadErr) {
          toast(
            uploadErr instanceof Error
              ? uploadErr.message
              : "Erro ao fazer upload da imagem",
            "erro"
          );
          await loadData();
          return;
        } finally {
          setUploading(false);
        }
      }

      toast(editPiso ? "Piso atualizado" : "Piso criado com sucesso", "ok");
      setModalOpen(false);
      await loadData();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao salvar piso", "erro");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: Piso) {
    if (!window.confirm(`Tem certeza que deseja excluir o piso "${item.nome}"?`)) return;
    try {
      await api(`/admin/floors/${item.id}`, { method: "DELETE" });
      toast("Piso excluído", "ok");
      await loadData();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao excluir piso", "erro");
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Pisos do Shopping</h1>
          <p>Gerencie os andares, dimensões métricas e plantas baixas da estrutura indoor.</p>
        </div>
        <button className="primary" onClick={startCreate}>
          + Novo Piso
        </button>
      </div>

      <div className="card">
        {loading ? (
          <p className="muted">Carregando pisos…</p>
        ) : pisos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 16px" }}>
            <span style={{ fontSize: 32 }}>🏢</span>
            <p className="muted" style={{ marginTop: 8 }}>
              Nenhum piso cadastrado ainda.
            </p>
            <button className="primary" onClick={startCreate} style={{ marginTop: 12 }}>
              Criar primeiro piso
            </button>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome do Piso</th>
                <th>Nível</th>
                <th>Shopping</th>
                <th>Dimensões (L × A)</th>
                <th>Planta Baixa</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pisos.map((item) => {
                const shoppingNome =
                  shoppings.find((s) => s.id === item.shopping_id)?.nome ||
                  `#${item.shopping_id}`;

                return (
                  <tr key={item.id}>
                    <td>#{item.id}</td>
                    <td>
                      <strong>{item.nome}</strong>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 6,
                          backgroundColor: "#f1f5f9",
                          fontWeight: 600,
                        }}
                      >
                        Nível {item.nivel}
                      </span>
                    </td>
                    <td>{shoppingNome}</td>
                    <td>
                      <code>
                        {item.largura_metros || 100}m × {item.altura_metros || 60}m
                      </code>
                    </td>
                    <td>
                      {item.imagem_planta_url ? (
                        <a
                          href={assetUrl(item.imagem_planta_url)}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            color: "#2563eb",
                            fontWeight: 500,
                          }}
                        >
                          🖼️ Visualizar
                        </a>
                      ) : (
                        <span className="muted">Sem imagem</span>
                      )}
                    </td>
                    <td className="row-actions">
                      <button
                        title="Abrir editor de nós deste piso"
                        onClick={() => nav(`/nos?piso=${item.id}`)}
                      >
                        Editor de Nós
                      </button>
                      <button
                        title="Ver arestas deste piso"
                        onClick={() => nav(`/arestas?piso=${item.id}`)}
                      >
                        Arestas
                      </button>
                      <button onClick={() => startEdit(item)}>Editar</button>
                      <button className="danger" onClick={() => handleDelete(item)}>
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Criação / Edição */}
      {modalOpen && (
        <Modal
          title={editPiso ? `Editar Piso: ${editPiso.nome}` : "Novo Piso"}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <FormField label="Shopping Associado" required className="full">
                <select
                  value={form.shopping_id}
                  onChange={(e) => setForm({ ...form, shopping_id: e.target.value })}
                  required
                >
                  <option value="">Selecione um shopping…</option>
                  {shoppings.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Nome do Piso" required>
                <input
                  type="text"
                  placeholder="Ex.: Térreo, 1º Andar, Subsolo G1"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  required
                />
              </FormField>
              <FormField label="Cadastro ativo">
                <select value={String(form.ativo)} onChange={(e) => setForm({ ...form, ativo: e.target.value === "true" })}>
                  <option value="true">Ativo</option><option value="false">Inativo</option>
                </select>
              </FormField>

              <FormField label="Nível Numérico" hint="Ex.: 0 para térreo, 1 para 1º andar, -1 para subsolo" required>
                <input
                  type="number"
                  value={form.nivel}
                  onChange={(e) => setForm({ ...form, nivel: e.target.value })}
                  required
                />
              </FormField>

              <FormField label="Largura Real (metros)" hint="Usada no cálculo de rotas (Dijkstra)">
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={form.largura_metros}
                  onChange={(e) => setForm({ ...form, largura_metros: e.target.value })}
                />
              </FormField>

              <FormField label="Altura Real (metros)" hint="Usada no cálculo de rotas (Dijkstra)">
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={form.altura_metros}
                  onChange={(e) => setForm({ ...form, altura_metros: e.target.value })}
                />
              </FormField>

              <FormField
                label="URL da Imagem da Planta Baixa"
                hint="Ou faça o upload de um arquivo local abaixo"
                className="full"
              >
                <input
                  type="text"
                  placeholder="https://exemplo.com/planta.png ou /static/plantas/..."
                  value={form.imagem_planta_url}
                  onChange={(e) => setForm({ ...form, imagem_planta_url: e.target.value })}
                />
              </FormField>

              <FormField
                label="Upload de Arquivo da Planta (PNG, JPG, SVG, WebP)"
                hint="O arquivo será enviado e salvo automaticamente no backend"
                className="full"
              >
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/svg+xml, image/webp"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </FormField>

              {(form.imagem_planta_url || selectedFile) && (
                <div className="full" style={{ marginTop: 8 }}>
                  <span className="field-label" style={{ display: "block", marginBottom: 6 }}>
                    Prévia da Planta:
                  </span>
                  <div
                    style={{
                      maxHeight: 180,
                      border: "1px solid #cbd5e1",
                      borderRadius: 8,
                      overflow: "hidden",
                      backgroundColor: "#f8fafc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <img
                      src={
                        selectedFile
                          ? previewUrl
                          : assetUrl(form.imagem_planta_url)
                      }
                      alt="Prévia da planta"
                      style={{ maxHeight: 180, maxWidth: "100%", objectFit: "contain" }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions" style={{ marginTop: 24 }}>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={saving || uploading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="primary"
                disabled={saving || uploading}
              >
                {uploading
                  ? "Enviando arquivo…"
                  : saving
                  ? "Salvando…"
                  : editPiso
                  ? "Salvar Alterações"
                  : "Criar Piso"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
