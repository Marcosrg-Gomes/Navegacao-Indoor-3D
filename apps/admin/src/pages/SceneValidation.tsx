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
      <label>Shopping <select value={selected} onChange={(e) => setSelected(e.target.value)}>{shoppings.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}</select></label>
      <button onClick={() => setRefresh((n) => n + 1)} disabled={loading}>Validar novamente</button>
      {loading && <p role="status">Validando catálogo e acessibilidade…</p>}
      {error && <p role="alert">{error}</p>}
      {report && <>
        <h2>{report.valid ? "Catálogo consistente" : "Inconsistências encontradas"}</h2>
        <p>Contrato {report.scene_version} · GLB v{report.release} · Publicado em {report.published_at ? new Date(report.published_at).toLocaleString("pt-BR") : "—"}</p>
        <table><thead><tr><th>Entidade</th><th>Esperado</th><th>Ativo no banco</th></tr></thead><tbody>
          {Object.entries(report.counts).map(([kind, value]) => <tr key={kind}><td>{labels[kind] || kind}</td><td>{value.expected}</td><td>{value.found}</td></tr>)}
        </tbody></table>
        {report.errors.map((message) => <p role="alert" key={message}>{message}</p>)}
        <h3>Códigos ausentes</h3>
        {Object.keys(report.missing_in_database).map((kind) => <p key={kind}>{labels[kind]} — banco: {report.missing_in_database[kind].join(", ") || "nenhum"}; catálogo: {report.missing_in_catalog[kind].join(", ") || "nenhum"}</p>)}
        <p>Nós fora dos limites: {report.invalid_nodes.join(", ") || "nenhum"}</p>
        <p role={report.unreachable_pois.length ? "alert" : undefined}>Destinos sem rota: {report.unreachable_pois.join(", ") || "nenhum"}</p>
        <p role={report.inaccessible_pois.length ? "alert" : undefined}>Destinos sem rota acessível: {report.inaccessible_pois.join(", ") || "nenhum"}</p>
        <h3>Abrir visualizador</h3>
        {report.floors.map((floor) => <p key={floor.id}><a href={`/?shopping=${selected}&floor=${floor.id}`} target="_blank" rel="noreferrer">{floor.nome}</a></p>)}
      </>}
    </div>
  </div>;
}
