import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useToast } from "../toast";
import type { Piso, ValidacaoGrafo } from "../types";

export default function Validation() {
  const toast = useToast();
  const [pisos, setPisos] = useState<Piso[]>([]);
  const [pisoId, setPisoId] = useState("");
  const [result, setResult] = useState<ValidacaoGrafo | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Piso[]>("/admin/floors")
      .then((lista) => {
        setPisos(lista);
      })
      .catch((e) => toast(e.message, "erro"));
  }, []);

  async function validar() {
    setBusy(true);
    try {
      const q = pisoId ? `?piso_id=${pisoId}` : "";
      const data = await api<ValidacaoGrafo>(`/admin/graph/validate${q}`);
      setResult(data);
      if (data.valido) {
        toast("Grafo validado: 100% íntegro!", "ok");
      } else {
        toast(`Encontrados ${data.problemas.length} problemas de consistência`, "erro");
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro ao validar grafo", "erro");
    } finally {
      setBusy(false);
    }
  }

  // Auto-valida ao mudar de piso ou carregar
  useEffect(() => {
    validar();
  }, [pisoId]);

  function getFixRoute(tipo: string, id: number): string {
    const pParam = pisoId ? `piso=${pisoId}&` : "";
    switch (tipo) {
      case "Nós Isolados":
      case "Componentes Desconectados":
        return `/nos?${pParam}id=${id}`;
      case "Arestas Inválidas":
        return `/arestas?${pParam}id=${id}`;
      case "QR Codes Órfãos":
        return `/qr?id=${id}`;
      case "Lojas Órfãs":
        return `/lojas?id=${id}`;
      default:
        return `/nos?${pParam}id=${id}`;
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Validação de Integridade do Grafo</h1>
          <p>
            Análise automática de nós isolados, arestas inválidas, componentes desconectados e referências órfãs com links para correção.
          </p>
        </div>
        <button className="primary" onClick={validar} disabled={busy}>
          {busy ? "Validando…" : "↻ Revalidar Agora"}
        </button>
      </div>

      <div className="toolbar" style={{ gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontWeight: 600 }}>Escopo:</label>
          <select
            value={pisoId}
            onChange={(e) => setPisoId(e.target.value)}
            style={{ minWidth: 260 }}
          >
            <option value="">Todo o Shopping (Todos os Pisos)</option>
            {pisos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} (Nível {p.nivel})
              </option>
            ))}
          </select>
        </div>
      </div>

      {result && (
        <div style={{ marginTop: 20 }}>
          {result.valido ? (
            <div
              className="card"
              style={{
                backgroundColor: "var(--success-soft)",
                border: "1px solid var(--success)",
                color: "var(--success)",
                padding: "24px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 32 }}>✅</span>
                <div>
                  <h3 style={{ margin: 0, color: "var(--success)" }}>Grafo 100% Íntegro e Conexo</h3>
                  <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                    Não foram detectados nós isolados, arestas órfãs ou componentes desconectados no escopo selecionado.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                className="card"
                style={{
                  backgroundColor: "var(--danger-soft)",
                  border: "1px solid var(--danger)",
                  padding: "18px 24px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 32 }}>⚠️</span>
                  <div>
                    <h3 style={{ margin: 0, color: "var(--danger)" }}>
                      Atenção: {result.problemas.length} Tipo(s) de Inconsistência Detectado(s)
                    </h3>
                    <p style={{ margin: "4px 0 0", color: "var(--muted)" }}>
                      Clique nos links dos elementos abaixo para navegar diretamente à tela de correção.
                    </p>
                  </div>
                </div>
              </div>

              {result.problemas.map((prob) => (
                <div className="card" key={prob.tipo}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                    <h3 style={{ margin: 0, color: "var(--text)" }}>{prob.tipo}</h3>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 12,
                        backgroundColor: "var(--danger-soft)",
                        color: "var(--danger)",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                      }}
                    >
                      {prob.ids.length} afetado(s)
                    </span>
                  </div>
                  <p className="muted" style={{ margin: "8px 0 16px" }}>
                    {prob.descricao}
                  </p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {prob.ids.length === 0 ? (
                      <span className="muted">—</span>
                    ) : (
                      prob.ids.map((id) => (
                        <Link
                          key={id}
                          to={getFixRoute(prob.tipo, id)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "6px 12px",
                            backgroundColor: "var(--panel)",
                            border: "1px solid var(--line)",
                            borderRadius: 6,
                            textDecoration: "none",
                            color: "var(--primary)",
                            fontWeight: 600,
                            fontSize: "0.9rem",
                          }}
                        >
                          #{id} ↗ Corrigir
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
