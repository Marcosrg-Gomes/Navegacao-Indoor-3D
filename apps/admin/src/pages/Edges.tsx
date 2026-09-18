import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useToast } from "../toast";
import type { Aresta, No, Piso } from "../types";
import { Modal } from "../components/Modal";
import { FormField } from "../components/FormField";

export default function Edges() {
  const toast = useToast();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const [pisos, setPisos] = useState<Piso[]>([]);
  const [pisoId, setPisoId] = useState<number | "">("");
  const [nos, setNos] = useState<No[]>([]);
  const [arestas, setArestas] = useState<Aresta[]>([]);
  const [loading, setLoading] = useState(false);

  // Modais
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Formulário
  const [form, setForm] = useState({
    id: 0,
    no_origem_id: "",
    no_destino_id: "",
    distancia: "",
    bidirecional: true,
    acessivel: true,
    ativa: true,
  });

  const piso = pisos.find((p) => p.id === pisoId);
  const noById = useMemo(() => new Map(nos.map((n) => [n.id, n])), [nos]);
  const pisoById = useMemo(() => new Map(pisos.map((item) => [item.id, item])), [pisos]);
  const nosDoPiso = useMemo(
    () => nos.filter((node) => node.piso_id === pisoId),
    [nos, pisoId]
  );

  // Carrega pisos
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

  // Carrega os nós do mesmo shopping. Assim, escadas/elevadores podem ligar
  // pisos distintos sem permitir conexões acidentais entre shoppings.
  async function loadData(id: number) {
    setLoading(true);
    try {
      const pisoAtual = pisos.find((item) => item.id === id);
      if (!pisoAtual) return;

      const [todosNos, todasArestas] = await Promise.all([
        api<No[]>("/admin/nodes"),
        api<Aresta[]>("/admin/edges"),
      ]);
      const idsPisosMesmoShopping = new Set(
        pisos
          .filter((item) => item.shopping_id === pisoAtual.shopping_id)
          .map((item) => item.id)
      );
      const nosMesmoShopping = todosNos.filter((node) => idsPisosMesmoShopping.has(node.piso_id));
      const noPorId = new Map(todosNos.map((node) => [node.id, node]));

      setNos(nosMesmoShopping);
      // A tela do piso mostra as conexões que entram ou saem dele, inclusive
      // as interpisos — essenciais para rotas por escada/elevador.
      setArestas(
        todasArestas.filter((edge) => {
          const origem = noPorId.get(edge.no_origem_id);
          const destino = noPorId.get(edge.no_destino_id);
          return origem?.piso_id === id || destino?.piso_id === id;
        })
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao carregar arestas", "erro");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (typeof pisoId !== "number") return;
    setParams({ piso: String(pisoId) }, { replace: true });
    loadData(pisoId);
  }, [pisoId]);

  // Cálculo automático de distância entre dois nós
  function calcularDistancia(origemId: number, destinoId: number): number | null {
    const orig = noById.get(origemId);
    const dest = noById.get(destinoId);
    if (!orig || !dest || !piso) return null;
    // A distância vertical de uma ligação entre pisos deve ser cadastrada
    // explicitamente; coordenadas 2D de pisos diferentes não são comparáveis.
    if (orig.piso_id !== dest.piso_id) return null;

    const largura = piso.largura_metros || 100;
    const altura = piso.altura_metros || 60;
    const dx = (dest.coord_x - orig.coord_x) * largura;
    const dy = (dest.coord_y - orig.coord_y) * altura;
    return Number(Math.sqrt(dx * dx + dy * dy).toFixed(2));
  }

  function handleOriginChange(origemStr: string) {
    const origId = Number(origemStr);
    const destId = Number(form.no_destino_id);
    let dist = form.distancia;
    if (origId && destId && origId !== destId) {
      const calc = calcularDistancia(origId, destId);
      if (calc !== null) dist = String(calc);
    }
    setForm({ ...form, no_origem_id: origemStr, distancia: dist });
  }

  function handleDestChange(destStr: string) {
    const origId = Number(form.no_origem_id);
    const destId = Number(destStr);
    let dist = form.distancia;
    if (origId && destId && origId !== destId) {
      const calc = calcularDistancia(origId, destId);
      if (calc !== null) dist = String(calc);
    }
    setForm({ ...form, no_destino_id: destStr, distancia: dist });
  }

  function startCreate() {
    setIsEditing(false);
    const primeiroNoOutroPiso = nos.find((node) => node.piso_id !== pisoId);
    setForm({
      id: 0,
      no_origem_id: nosDoPiso[0]?.id.toString() || "",
      no_destino_id: (nosDoPiso[1] || primeiroNoOutroPiso)?.id.toString() || "",
      distancia: "",
      bidirecional: true,
      acessivel: true,
      ativa: true,
    });
    setModalOpen(true);
  }

  function startEdit(edge: Aresta) {
    setIsEditing(true);
    setForm({
      id: edge.id,
      no_origem_id: String(edge.no_origem_id),
      no_destino_id: String(edge.no_destino_id),
      distancia: edge.distancia !== null && edge.distancia !== undefined ? String(edge.distancia) : "",
      bidirecional: edge.bidirecional,
      acessivel: edge.acessivel,
      ativa: edge.ativa,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.no_origem_id || !form.no_destino_id) return;
    if (form.no_origem_id === form.no_destino_id) {
      toast("Origem e destino não podem ser o mesmo nó", "erro");
      return;
    }
    const origem = noById.get(Number(form.no_origem_id));
    const destino = noById.get(Number(form.no_destino_id));
    if (!origem || !destino || (origem.piso_id !== pisoId && destino.piso_id !== pisoId)) {
      toast("Ao menos uma extremidade da aresta deve pertencer ao piso selecionado.", "erro");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        no_origem_id: Number(form.no_origem_id),
        no_destino_id: Number(form.no_destino_id),
        distancia: form.distancia.trim() ? Number(form.distancia) : null,
        bidirecional: form.bidirecional,
        acessivel: form.acessivel,
        ativa: form.ativa,
      };

      if (isEditing) {
        const updated = await api<Aresta>(`/admin/edges/${form.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setArestas((prev) => prev.map((a) => (a.id === form.id ? updated : a)));
        toast("Aresta atualizada", "ok");
      } else {
        const created = await api<Aresta>("/admin/edges", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setArestas((prev) => [...prev, created]);
        toast("Aresta criada", "ok");
      }
      setModalOpen(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao salvar aresta", "erro");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(edge: Aresta) {
    if (!window.confirm(`Deseja excluir a aresta #${edge.id}?`)) return;
    try {
      await api(`/admin/edges/${edge.id}`, { method: "DELETE" });
      setArestas((prev) => prev.filter((a) => a.id !== edge.id));
      toast("Aresta excluída", "ok");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao excluir", "erro");
    }
  }

  async function handleTemporaryAvailability(edge: Aresta) {
    const nextAtiva = !edge.ativa;
    try {
      const updated = await api<Aresta>(`/admin/edges/${edge.id}`, {
        method: "PUT",
        body: JSON.stringify({ ativa: nextAtiva }),
      });
      setArestas((prev) => prev.map((item) => (item.id === edge.id ? updated : item)));
      toast(
        nextAtiva
          ? "Aresta reativada e já disponível para novas rotas"
          : "Aresta bloqueada temporariamente e removida das novas rotas",
        "ok"
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erro ao alterar disponibilidade", "erro");
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Arestas (Caminhos de Navegação)</h1>
          <p>Conexões direcionadas ou bidirecionais, inclusive entre pisos do mesmo shopping, para cálculo de rota via Dijkstra.</p>
        </div>
        <div className="row-actions">
          {pisoId && (
            <button onClick={() => nav(`/nos?piso=${pisoId}`)}>
              ← Editor de Nós
            </button>
          )}
          <button className="primary" onClick={startCreate} disabled={nosDoPiso.length === 0 || nos.length < 2}>
            + Nova Aresta
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
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
        <span className="muted" style={{ marginLeft: "auto", fontSize: "0.85rem" }}>
          {arestas.length} conexões deste piso · destinos do mesmo shopping disponíveis
        </span>
      </div>

      {/* Tabela de Arestas */}
      <div className="card">
        {loading ? (
          <p className="muted">Carregando arestas…</p>
        ) : arestas.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 16px" }}>
            <span style={{ fontSize: 32 }}>🔗</span>
            <p className="muted" style={{ marginTop: 8 }}>
              Nenhuma aresta cadastrada para este piso.
            </p>
            {nosDoPiso.length > 0 && nos.length >= 2 ? (
              <button className="primary" onClick={startCreate} style={{ marginTop: 12 }}>
                Criar primeira aresta
              </button>
            ) : (
              <p className="muted" style={{ fontSize: "0.85rem" }}>
                Cadastre um nó neste piso e outro nó do mesmo shopping antes de criar uma conexão.
              </p>
            )}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Origem</th>
                <th>Destino</th>
                <th>Distância (m)</th>
                <th>Sentido</th>
                <th>Acessível</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {arestas.map((edge) => {
                const orig = noById.get(edge.no_origem_id);
                const dest = noById.get(edge.no_destino_id);

                return (
                  <tr key={edge.id}>
                    <td>#{edge.id}</td>
                    <td>
                      <strong>#{edge.no_origem_id}</strong> {orig?.nome || orig?.tipo || "—"}
                      {orig && orig.piso_id !== pisoId && ` · ${pisoById.get(orig.piso_id)?.nome || `Piso #${orig.piso_id}`}`}
                    </td>
                    <td>
                      <strong>#{edge.no_destino_id}</strong> {dest?.nome || dest?.tipo || "—"}
                      {dest && dest.piso_id !== pisoId && ` · ${pisoById.get(dest.piso_id)?.nome || `Piso #${dest.piso_id}`}`}
                    </td>
                    <td>
                      <code>{edge.distancia !== null ? `${edge.distancia} m` : "Auto"}</code>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 6,
                          backgroundColor: edge.bidirecional ? "#e0f2fe" : "#fef3c7",
                          color: edge.bidirecional ? "#0369a1" : "#b45309",
                          fontWeight: 600,
                          fontSize: "0.85rem",
                        }}
                      >
                        {edge.bidirecional ? "↔ Bidirecional" : "→ Unidirecional"}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: 6,
                          backgroundColor: edge.acessivel ? "#dcfce7" : "#fee2e2",
                          color: edge.acessivel ? "#15803d" : "#b91c1c",
                          fontWeight: 600,
                          fontSize: "0.85rem",
                        }}
                      >
                        {edge.acessivel ? "♿ Sim" : "⛔ Não"}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: edge.ativa ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                        {edge.ativa ? "Disponível" : "Bloqueada temporariamente"}
                      </span>
                    </td>
                    <td className="row-actions">
                      <button onClick={() => handleTemporaryAvailability(edge)}>
                        {edge.ativa ? "Bloquear" : "Reativar"}
                      </button>
                      <button onClick={() => startEdit(edge)}>Editar</button>
                      <button className="danger" onClick={() => handleDelete(edge)}>
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

      {/* Modal de Nova / Editar Aresta */}
      {modalOpen && (
        <Modal
          title={isEditing ? `Editar Aresta #${form.id}` : "Nova Conexão (Aresta)"}
          onClose={() => setModalOpen(false)}
        >
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <FormField label="Nó de Origem" required>
                <select
                  value={form.no_origem_id}
                  onChange={(e) => handleOriginChange(e.target.value)}
                  required
                >
                  <option value="">Selecione o nó de origem…</option>
                  {nos.map((n) => (
                    <option key={n.id} value={n.id}>
                      #{n.id} {n.nome ? `(${n.nome})` : ""} - {n.tipo} · {pisoById.get(n.piso_id)?.nome || `Piso #${n.piso_id}`}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Nó de Destino" required>
                <select
                  value={form.no_destino_id}
                  onChange={(e) => handleDestChange(e.target.value)}
                  required
                >
                  <option value="">Selecione o nó de destino…</option>
                  {nos.map((n) => (
                    <option key={n.id} value={n.id}>
                      #{n.id} {n.nome ? `(${n.nome})` : ""} - {n.tipo} · {pisoById.get(n.piso_id)?.nome || `Piso #${n.piso_id}`}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Distância em metros (deixe vazio para auto-cálculo)"
                hint="Baseado nas dimensões do piso para nós no mesmo andar. Em conexões entre pisos, informe a distância vertical real."
                className="full"
              >
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex.: 14.50"
                    value={form.distancia}
                    onChange={(e) => setForm({ ...form, distancia: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const orig = Number(form.no_origem_id);
                      const dest = Number(form.no_destino_id);
                      if (orig && dest) {
                        const d = calcularDistancia(orig, dest);
                        if (d !== null) setForm({ ...form, distancia: String(d) });
                      }
                    }}
                  >
                    Recalcular
                  </button>
                </div>
              </FormField>

              <FormField label="Sentido">
                <select
                  value={form.bidirecional ? "true" : "false"}
                  onChange={(e) => setForm({ ...form, bidirecional: e.target.value === "true" })}
                >
                  <option value="true">↔ Bidirecional (ida e volta)</option>
                  <option value="false">→ Unidirecional (apenas origem → destino)</option>
                </select>
              </FormField>

              <FormField label="Acessibilidade (♿)">
                <select
                  value={form.acessivel ? "true" : "false"}
                  onChange={(e) => setForm({ ...form, acessivel: e.target.value === "true" })}
                >
                  <option value="true">Sim (sem degraus/obstáculos)</option>
                  <option value="false">Não (possui escadas/obstáculos)</option>
                </select>
              </FormField>

              <FormField
                label="Disponibilidade temporária"
                hint="Bloqueios temporários são ignorados imediatamente pelo cálculo de rota; excluir remove o cadastro em definitivo."
                className="full"
              >
                <select
                  value={form.ativa ? "true" : "false"}
                  onChange={(e) => setForm({ ...form, ativa: e.target.value === "true" })}
                >
                  <option value="true">Disponível para rotas</option>
                  <option value="false">Bloqueada temporariamente</option>
                </select>
              </FormField>
            </div>

            <div className="form-actions" style={{ marginTop: 20 }}>
              <button type="button" onClick={() => setModalOpen(false)} disabled={saving}>
                Cancelar
              </button>
              <button type="submit" className="primary" disabled={saving}>
                {saving ? "Salvando…" : isEditing ? "Salvar Alterações" : "Criar Aresta"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
