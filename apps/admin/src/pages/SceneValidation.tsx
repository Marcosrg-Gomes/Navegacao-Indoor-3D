import { useEffect, useState } from "react";
import { api } from "../services/api";
import type { Shopping } from "../types";

type Report = {
  valid: boolean; scene_version: string; release: number; published_at?: string;
  model_url: string; counts: Record<string, { expected: number; found: number }>;
  missing_in_database: Record<string, string[]>; missing_in_catalog: Record<string, string[]>;
  invalid_nodes: string[]; unreachable_pois: string[]; inaccessible_pois: string[]; errors: string[];
  floors: { id: number; nome: string }[];
};
const labels: Record<string, string> = { floors: "Pisos", anchors: "Âncoras", pois: "Destinos", loja: "Lojas", banheiro: "Banheiros", entrada: "Entradas" };

export default function SceneValidation() {
  const [shoppings, setShoppings] = useState<Shopping[]>([]);
  const [selected, setSelected] = useState("");
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    api<Shopping[]>("/admin/shoppings").then((items) => { if (active) { setShoppings(items); setSelected(String(items.find((s) => s.codigo === "MINI_SHOPPING")?.id || items[0]?.id || "")); } }).catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!selected) return;
    let active = true;
    setLoading(true); setError(""); setReport(null);
    api<Report>(`/admin/shoppings/${selected}/scene/validation`).then((data) => { if (active) setReport(data); })
      .catch((e) => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selected, refresh]);
  return <div>
    <div className="page-head"><div><h1>Cena 3D</h1><p>Valide a correspondência entre catálogo, banco e rotas. A geometria e as âncoras são editadas no Blender.</p></div></div>
    <div className="card">
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <label style={{ fontWeight: 600, minWidth: 70 }}>Shopping</label>
        <select value={selected} onChange={(e) => setSelected(e.target.value)} style={{ minWidth: 260 }}>
          {shoppings.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
        </select>
        <button onClick={() => setRefresh((n) => n + 1)} disabled={loading} className="accent">
          Validar novamente
        </button>
      </div>
      {loading && <p role="status" className="muted" style={{ marginTop: 8 }}>Validando catálogo e acessibilidade…</p>}
      {error && <p role="alert" className="text-danger">{error}</p>}
      {report && (
        <div className="validation-report">
          <h2 className={report.valid ? "text-success" : "text-danger"}>{report.valid ? "✅ Catálogo consistente" : "⚠️ Inconsistências encontradas"}</h2>
          <p className="text-muted">Contrato {report.scene_version} · GLB v{report.release} · Publicado em {report.published_at ? new Date(report.published_at).toLocaleString("pt-BR") : "—"}</p>
          <table>
            <thead>
              <tr><th>Entidade</th><th>Esperado</th><th>Ativo no banco</th></tr>
            </thead>
            <tbody>
              {Object.entries(report.counts).map(([kind, value]) => <tr key={kind}><td>{labels[kind] || kind}</td><td>{value.expected}</td><td>{value.found}</td></tr>)}
            </tbody>
          </table>
          {report.errors.length > 0 && (
            <div className="mt-16">
              <h3 className="text-danger">Erros</h3>
              {report.errors.map((message) => <p role="alert" key={message} className="text-danger">{message}</p>)}
            </div>
          )}
          <h3 className="text-heading">Códigos ausentes</h3>
          {Object.keys(report.missing_in_database).map((kind) => (
            <p key={kind} className="text-muted">
              {labels[kind]} — banco: {report.missing_in_database[kind].join(", ") || "nenhum"}; catálogo: {report.missing_in_catalog[kind].join(", ") || "nenhum"}
            </p>
          ))}
          <p className="text-muted">
            Nós fora dos limites: {report.invalid_nodes.join(", ") || "nenhum"}
          </p>
          <p className={report.unreachable_pois.length ? "text-danger" : "text-muted"}>
            Destinos sem rota: {report.unreachable_pois.join(", ") || "nenhum"}
          </p>
          <p className={report.inaccessible_pois.length ? "text-danger" : "text-muted"}>
            Destinos sem rota acessível: {report.inaccessible_pois.join(", ") || "nenhum"}
          </p>
          <h3 className="text-heading">Abrir visualizador</h3>
          {report.floors.map((floor) => (
            <p key={floor.id}>
              <a href={`/?shopping=${selected}&floor=${floor.id}`} target="_blank" rel="noreferrer" className="link-primary">{floor.nome}</a>
            </p>
          ))}
        </div>
      )}
    </div>
  </div>;
}
