import { useEffect, useState } from "react";
import { api } from "../api";
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
      .then(setPisos)
      .catch((e) => toast(e.message, "erro"));
  }, []);

  async function validar() {
    setBusy(true);
    try {
      const q = pisoId ? `?piso_id=${pisoId}` : "";
      setResult(await api<ValidacaoGrafo>(`/admin/graph/validate${q}`));
    } catch (e) {
      toast(e instanceof Error ? e.message : "Erro", "erro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Validação do grafo</h1>
          <p>Detecta nós isolados, arestas inválidas, QR Codes e lojas sem nó válido.</p>
        </div>
      </div>
      <div className="toolbar">
        <select value={pisoId} onChange={(e) => setPisoId(e.target.value)} style={{ maxWidth: 280 }}>
          <option value="">Todos os pisos</option>
          {pisos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome} (nível {p.nivel})
            </option>
          ))}
        </select>
        <button className="primary" onClick={validar} disabled={busy}>
          {busy ? "Validando…" : "Validar"}
        </button>
      </div>
      {result && (
        <div className="card">
          {result.valido ? (
            <p>Grafo íntegro — nenhum problema encontrado.</p>
          ) : (
            result.problemas.map((p) => (
              <div className="problema" key={p.tipo}>
                <strong>{p.tipo}</strong>
                <p className="muted">{p.descricao}</p>
                <p>IDs: {p.ids.length ? p.ids.join(", ") : "—"}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
