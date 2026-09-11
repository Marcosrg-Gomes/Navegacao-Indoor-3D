import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api, assetUrl } from "../services/api";
import { useToast } from "../toast";
import type { No, Piso } from "../types";
import { TIPO_NO_COR, TIPO_NO_LABEL, TIPOS_NO, TipoNo } from "../types";
import { Modal } from "../components/Modal";
import { FormField } from "../components/FormField";

export default function Nodes() {
  const toast = useToast();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [pisos, setPisos] = useState<Piso[]>([]);
  const [pisoId, setPisoId] = useState<number | "">("");
  const [nos, setNos] = useState<No[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNo, setSelectedNo] = useState<No | null>(null);
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState("");

  // Modais
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Formulário de nó
  const [form, setForm] = useState({
    id: 0,
    nome: "",
    tipo: "corredor" as TipoNo,
    coord_x: 0.5,
    coord_y: 0.5,
    ativo: true,
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{ id: number; moved: boolean; x: number; y: number } | null>(null);
  const dragAbort = useRef<AbortController | null>(null);
  useEffect(() => () => dragAbort.current?.abort(), []);
  const nosRef = useRef<No[]>([]);
  nosRef.current = nos;

  const piso = pisos.find((p) => p.id === pisoId);

  // Carrega lista de pisos
  useEffect(() => {
    api<Piso[]>("/admin/floors")
      .then((lista) => {
        setPisos(lista);
        const fromQuery = Number(params.get("piso"));
        const initial = lista.find((p) => p.id === fromQuery)?.id ?? lista[0]?.id ?? "";
        setPisoId(initial);
      })
      .catch((e) => toast(e.message, "erro"));
  }, []);

  // Carrega nós do piso selecionado
  async function loadNodes(id: number) {
    setLoading(true);
    try {
      const data = await api<No[]>(`/admin/nodes?piso_id=${id}`);
      setNos(data);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao carregar nós", "erro");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (typeof pisoId !== "number") return;
    setParams({ piso: String(pisoId) }, { replace: true });
    setSelectedNo(null);
    loadNodes(pisoId);
  }, [pisoId]);

  // Nós filtrados
  const filteredNos = useMemo(() => {
    return nos.filter((n) => {
      const matchTipo = filterTipo === "todos" || n.tipo === filterTipo;
      const matchSearch =
        !searchQuery.trim() ||
        (n.nome && n.nome.toLowerCase().includes(searchQuery.toLowerCase())) ||
        String(n.id).includes(searchQuery);
      return matchTipo && matchSearch;
    });
  }, [nos, filterTipo, searchQuery]);

  // Clique na planta para posicionar novo nó
  function handleCanvasClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!canvasRef.current || !pisoId) return;

    // Se acabou de arrastar, não abre criação
    if (draggingRef.current?.moved) {
      draggingRef.current = null;
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const rawX = (e.clientX - rect.left) / rect.width;
    const rawY = (e.clientY - rect.top) / rect.height;

    const normX = Number(Math.max(0, Math.min(1, rawX)).toFixed(4));
    const normY = Number(Math.max(0, Math.min(1, rawY)).toFixed(4));

    setIsEditing(false);
    setForm({
      id: 0,
      nome: "",
      tipo: "corredor",
      coord_x: normX,
      coord_y: normY,
      ativo: true,
    });
    setModalOpen(true);
  }

  // Iniciar edição de nó existente
  function startEdit(node: No) {
    setIsEditing(true);
    setForm({
      id: node.id,
      nome: node.nome || "",
      tipo: (node.tipo as TipoNo) || "corredor",
      coord_x: node.coord_x,
      coord_y: node.coord_y,
      ativo: node.ativo,
    });
    setModalOpen(true);
  }

  // Salvar nó (criação ou atualização)
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pisoId) return;
    setSaving(true);
    try {
      if (isEditing) {
        const updated = await api<No>(`/admin/nodes/${form.id}`, {
          method: "PUT",
          body: JSON.stringify({
            nome: form.nome.trim() || null,
            tipo: form.tipo,
            coord_x: form.coord_x,
            coord_y: form.coord_y,
            ativo: form.ativo,
          }),
        });
        setNos((prev) => prev.map((n) => (n.id === form.id ? updated : n)));
        setSelectedNo(updated);
        toast("Nó atualizado com sucesso", "ok");
      } else {
        const created = await api<No>("/admin/nodes", {
          method: "POST",
          body: JSON.stringify({
            piso_id: pisoId,
            nome: form.nome.trim() || null,
            tipo: form.tipo,
            coord_x: form.coord_x,
            coord_y: form.coord_y,
            ativo: form.ativo,
          }),
        });
        setNos((prev) => [...prev, created]);
        setSelectedNo(created);
        toast("Nó criado com sucesso", "ok");
      }
      setModalOpen(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao salvar nó", "erro");
    } finally {
      setSaving(false);
    }
  }

  // Excluir nó
  async function handleDelete(node: No) {
    if (!window.confirm(`Deseja excluir o nó #${node.id} (${node.nome || node.tipo})?`)) return;
    try {
      await api(`/admin/nodes/${node.id}`, { method: "DELETE" });
      setNos((prev) => prev.filter((n) => n.id !== node.id));
      if (selectedNo?.id === node.id) setSelectedNo(null);
      toast("Nó excluído", "ok");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Falha ao excluir nó", "erro");
    }
  }

  // Drag & Drop no canvas para mover nó
  function handleNodeMouseDown(e: React.PointerEvent, node: No) {
    e.stopPropagation();
    setSelectedNo(node);
    draggingRef.current = { id: node.id, moved: false, x: node.coord_x, y: node.coord_y };
    dragAbort.current?.abort();
    const controller = new AbortController();
    dragAbort.current = controller;

    function onMouseMove(moveEvent: PointerEvent) {
      if (!canvasRef.current || !draggingRef.current) return;
      draggingRef.current.moved = true;
      const rect = canvasRef.current.getBoundingClientRect();
      const rawX = (moveEvent.clientX - rect.left) / rect.width;
      const rawY = (moveEvent.clientY - rect.top) / rect.height;
      const normX = Number(Math.max(0, Math.min(1, rawX)).toFixed(4));
      const normY = Number(Math.max(0, Math.min(1, rawY)).toFixed(4));
      draggingRef.current.x = normX;
      draggingRef.current.y = normY;

      setNos((prev) =>
        prev.map((n) => (n.id === node.id ? { ...n, coord_x: normX, coord_y: normY } : n))
      );
    }

    async function onMouseUp() {
      controller.abort();

      if (draggingRef.current?.moved) {
        const movedId = draggingRef.current.id;
        const current = { coord_x: draggingRef.current.x, coord_y: draggingRef.current.y };
        if (current) {
          try {
            const updated = await api<No>(`/admin/nodes/${movedId}`, {
              method: "PUT",
              body: JSON.stringify({ coord_x: current.coord_x, coord_y: current.coord_y }),
            });
            setSelectedNo(updated);
            setNos((prev) => prev.map((n) => n.id === movedId ? updated : n));
            toast(`Posição do nó #${movedId} salva`, "ok");
          } catch (err) {
            setNos((prev) => prev.map((n) => n.id === movedId ? node : n));
            toast(err instanceof Error ? err.message : "Erro ao mover nó", "erro");
          }
        }
      }
      setTimeout(() => {
        draggingRef.current = null;
      }, 50);
    }

    window.addEventListener("pointermove", onMouseMove, { signal: controller.signal });
    window.addEventListener("pointerup", onMouseUp, { signal: controller.signal });
    window.addEventListener("pointercancel", onMouseUp, { signal: controller.signal });
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Editor Visual de Nós</h1>
          <p>Clique em qualquer ponto da planta para criar um nó (coordenadas normalizadas 0.0 a 1.0) ou arraste para reposicionar.</p>
        </div>
        <div className="row-actions">
          {pisoId && (
            <button onClick={() => nav(`/arestas?piso=${pisoId}`)}>
              Ver Arestas do Piso →
            </button>
          )}
          <button
            className="primary"
            onClick={() => {
              setIsEditing(false);
              setForm({ id: 0, nome: "", tipo: "corredor", coord_x: 0.5, coord_y: 0.5, ativo: true });
              setModalOpen(true);
            }}
          >
            + Novo Nó Manual
          </button>
        </div>
      </div>

      {/* Toolbar: seleção de piso e filtros */}
      <div className="toolbar" style={{ flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontWeight: 600 }}>Piso:</label>
          <select
            value={pisoId}
            onChange={(e) => setPisoId(Number(e.target.value) || "")}
            style={{ minWidth: 220 }}
          >
            {pisos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} (nível {p.nivel})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontWeight: 600 }}>Tipo:</label>
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            style={{ minWidth: 140 }}
          >
            <option value="todos">Todos os tipos</option>
            {TIPOS_NO.map((t) => (
              <option key={t} value={t}>
                {TIPO_NO_LABEL[t] || t}
              </option>
            ))}
          </select>
        </div>

        <input
          type="text"
          placeholder="Buscar nó por nome ou ID…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: 220 }}
        />

        <span className="muted" style={{ marginLeft: "auto", fontSize: "0.85rem" }}>
          {filteredNos.length} nós exibidos
        </span>
      </div>

      {/* Editor visual (Canvas interativo) */}
      <div className="card" style={{ padding: 0, overflow: "hidden", position: "relative" }}>
        <div
          ref={canvasRef}
          onClick={handleCanvasClick}
          className="floor-canvas"
          style={{
            position: "relative",
            width: "100%",
            height: 520,
            backgroundColor: "#f1f5f9",
            cursor: "crosshair",
            overflow: "hidden",
            userSelect: "none",
          }}
        >
          {/* Imagem da planta baixa ou grid visual padrão */}
          {piso?.imagem_planta_url ? (
            <img
              src={assetUrl(piso.imagem_planta_url)}
              alt={piso.nome}
              style={{
                width: "100%",
                height: "100%",
                // O mapa e os nós usam o mesmo retângulo normalizado 0..1;
                // "contain" criaria faixas vazias e deslocaria os marcadores.
                objectFit: "fill",
                pointerEvents: "none",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundImage:
                  "radial-gradient(#cbd5e1 1.5px, transparent 1.5px), radial-gradient(#cbd5e1 1.5px, #f8fafc 1.5px)",
                backgroundSize: "30px 30px",
                backgroundPosition: "0 0, 15px 15px",
                color: "#64748b",
              }}
            >
              <span style={{ fontSize: 40, marginBottom: 8 }}>📐</span>
              <strong>Planta baixa não configurada para este piso.</strong>
              <p className="muted" style={{ margin: "4px 0 12px" }}>
                Você ainda pode posicionar nós sobre a malha de referência.
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  nav("/pisos");
                }}
              >
                Configurar imagem do piso →
              </button>
            </div>
          )}

          {/* Nós sobrepostos com coordenadas normalizadas */}
          {filteredNos.map((node) => {
            const isSelected = selectedNo?.id === node.id;
            const cor = TIPO_NO_COR[node.tipo] || "#64748b";

            return (
              <div
                key={node.id}
                onPointerDown={(e) => handleNodeMouseDown(e, node)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNo(node);
                }}
                style={{
                  position: "absolute",
                  left: `${node.coord_x * 100}%`,
                  top: `${node.coord_y * 100}%`,
                  transform: "translate(-50%, -50%)",
                  cursor: "grab",
                  touchAction: "none",
                  zIndex: isSelected ? 30 : 10,
                }}
                title={`#${node.id} ${node.nome || node.tipo} (${node.coord_x}, ${node.coord_y})`}
              >
                <div
                  style={{
                    width: isSelected ? 22 : 16,
                    height: isSelected ? 22 : 16,
                    borderRadius: "50%",
                    backgroundColor: cor,
                    border: isSelected ? "3px solid #0f172a" : "2px solid #ffffff",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                    transition: "width 0.15s, height 0.15s",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontSize: 10,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    backgroundColor: "rgba(15, 23, 42, 0.8)",
                    color: "#ffffff",
                    padding: "1px 5px",
                    borderRadius: 4,
                    marginTop: 2,
                    pointerEvents: "none",
                  }}
                >
                  {node.nome || `#${node.id}`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Barra de detalhes do nó selecionado */}
        {selectedNo && (
          <div
            style={{
              padding: "12px 16px",
              backgroundColor: "#f8fafc",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div>
              <strong>Nó #{selectedNo.id}:</strong> {selectedNo.nome || "Sem nome"} (
              <span style={{ color: TIPO_NO_COR[selectedNo.tipo] || "#64748b", fontWeight: 600 }}>
                {TIPO_NO_LABEL[selectedNo.tipo] || selectedNo.tipo}
              </span>
              ) · Coordenadas: X={selectedNo.coord_x}, Y={selectedNo.coord_y} ·{" "}
              <span style={{ color: selectedNo.ativo ? "#16a34a" : "#dc2626" }}>
                {selectedNo.ativo ? "Ativo" : "Inativo"}
              </span>
            </div>
            <div className="row-actions">
              <button onClick={() => startEdit(selectedNo)}>Editar</button>
              <button className="danger" onClick={() => handleDelete(selectedNo)}>
                Excluir
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabela de listagem detalhada de nós */}
      <div className="card" style={{ marginTop: 24 }}>
        <h3>Lista de Nós do Piso</h3>
        {loading ? (
          <p className="muted">Carregando nós…</p>
        ) : filteredNos.length === 0 ? (
          <p className="muted">Nenhum nó encontrado para este filtro.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Coord X</th>
                <th>Coord Y</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredNos.map((node) => (
                <tr
                  key={node.id}
                  style={selectedNo?.id === node.id ? { backgroundColor: "#f1f5f9" } : undefined}
                >
                  <td>#{node.id}</td>
                  <td><strong>{node.nome || "—"}</strong></td>
                  <td>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 6,
                        backgroundColor: (TIPO_NO_COR[node.tipo] || "#64748b") + "25",
                        color: "#0f172a",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                      }}
                    >
                      {TIPO_NO_LABEL[node.tipo] || node.tipo}
                    </span>
                  </td>
                  <td><code>{node.coord_x}</code></td>
                  <td><code>{node.coord_y}</code></td>
                  <td>
                    <span style={{ color: node.ativo ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                      {node.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="row-actions">
                    <button
                      onClick={() => {
                        setSelectedNo(node);
                        canvasRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                    >
                      Localizar
                    </button>
                    <button onClick={() => startEdit(node)}>Editar</button>
                    <button className="danger" onClick={() => handleDelete(node)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Criação / Edição de Nó */}
      {modalOpen && (
        <Modal
          title={isEditing ? `Editar Nó #${form.id}` : "Novo Nó de Navegação"}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <FormField label="Nome / Identificação do Local" className="full">
                <input
                  type="text"
                  placeholder="Ex.: Entrada Principal, Corredor A, Praça de Alimentação"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                />
              </FormField>

              <FormField label="Tipo de Nó" required>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoNo })}
                  required
                >
                  {TIPOS_NO.map((t) => (
                    <option key={t} value={t}>
                      {TIPO_NO_LABEL[t] || t}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Status">
                <select
                  value={form.ativo ? "true" : "false"}
                  onChange={(e) => setForm({ ...form, ativo: e.target.value === "true" })}
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </FormField>

              <FormField label="Coordenada X (normalizada 0.0 - 1.0)" required>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  max="1"
                  value={form.coord_x}
                  onChange={(e) => setForm({ ...form, coord_x: Number(e.target.value) })}
                  required
                />
              </FormField>

              <FormField label="Coordenada Y (normalizada 0.0 - 1.0)" required>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  max="1"
                  value={form.coord_y}
                  onChange={(e) => setForm({ ...form, coord_y: Number(e.target.value) })}
                  required
                />
              </FormField>
            </div>

            <div className="form-actions" style={{ marginTop: 20 }}>
              <button type="button" onClick={() => setModalOpen(false)} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" className="primary" disabled={saving}>
                {saving ? "Salvando…" : isEditing ? "Salvar Alterações" : "Criar Nó"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
