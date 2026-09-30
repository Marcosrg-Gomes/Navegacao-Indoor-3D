import { useEffect, useState } from "react";
import { api } from "../api";

type Entry = { id: number; usuario: string; motivo: string; entidade: string; registro_id: number; acao: string; criado_em: string; antes: Record<string, unknown> | null; depois: Record<string, unknown> | null };
type Failure = { tipo: string; codigo: string; ocorrencias: number; atualizado_em: string };

export default function Audit() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [failures, setFailures] = useState<Failure[]>([]);
  const [identity, setIdentity] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [more, setMore] = useState(false);
  const [message, setMessage] = useState("");
  async function load(before?: number) {
    setBusy(true); setError("");
    try {
      const [rows, diagnostics, session] = await Promise.all([
        api<Entry[]>(`/admin/audit?limit=50${before ? `&before_id=${before}` : ""}`),
        api<Failure[]>("/admin/diagnostics"),
        api<{ usuario: string; credencial_compartilhada: boolean }>("/admin/session"),
      ]);
      setEntries((previous) => before ? [...previous, ...rows] : rows);
      setMore(rows.length === 50); setFailures(diagnostics);
      setIdentity(session.credencial_compartilhada ? "Credencial compartilhada: não identifica uma pessoa individualmente." : `Administrador: ${session.usuario}`);
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível carregar o histórico."); }
    finally { setBusy(false); }
  }
  useEffect(() => { void load(); }, []);
  async function restore(entry: Entry) {
    setBusy(true); setError(""); setMessage("");
    try {
      await api(`/admin/audit/${entry.id}/restore`, { method: "POST" });
      setMessage(`Registro ${entry.registro_id} restaurado. A restauração também consta no histórico.`);
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível restaurar."); }
    finally { setBusy(false); }
  }
  return <div>
    <div className="page-head"><div><h1>Histórico e falhas</h1><p>{identity}</p></div><button disabled={busy} onClick={() => void load()}>Atualizar histórico</button></div>
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    <section className="card"><h2>Falhas de navegação</h2><p>Contagens agregadas, sem identificação de visitantes, trajetos ou tokens de QR. Falhas de rede são enviadas quando a conexão retorna, enquanto a sessão permanece aberta.</p>
      {failures.length ? <ul>{failures.map((failure) => <li key={`${failure.tipo}:${failure.codigo}`}>
        {failure.tipo} · {failure.codigo}: <strong>{failure.ocorrencias}</strong> — última ocorrência {new Date(failure.atualizado_em).toLocaleString("pt-BR")}
      </li>)}</ul> : <p>Nenhuma falha registrada.</p>}
    </section>
    <h2>Alterações administrativas</h2><p>Restaurações passam pelas mesmas validações do cadastro. Se o registro mudou depois desta alteração, a restauração é recusada. Tokens não são exibidos nem restaurados; exclusões exigem recriação pelo cadastro.</p>
    {!entries.length && <p>{busy ? "Carregando…" : "Nenhuma alteração registrada."}</p>}
    {entries.map((entry) => <article className="card" key={entry.id} style={{ marginBottom: 16 }}>
      <h3>#{entry.id} · {entry.entidade} {entry.registro_id} · {entry.acao}</h3>
      <p><strong>{entry.usuario}</strong> · <time dateTime={entry.criado_em}>{new Date(entry.criado_em).toLocaleString("pt-BR")}</time></p>
      <p>Motivo: {entry.motivo}</p>
      <details><summary>Ver alterações</summary><dl>{Array.from(new Set([...Object.keys(entry.antes || {}), ...Object.keys(entry.depois || {})])).filter((key) => JSON.stringify(entry.antes?.[key]) !== JSON.stringify(entry.depois?.[key])).map((key) => <div key={key}><dt><strong>{key}</strong></dt><dd style={{ overflowWrap: "anywhere" }}>{JSON.stringify(entry.antes?.[key] ?? null)} → {JSON.stringify(entry.depois?.[key] ?? null)}</dd></div>)}</dl></details>
      {["editar", "restaurar"].includes(entry.acao) && <button disabled={busy} onClick={() => void restore(entry)}>Restaurar estado anterior à alteração #{entry.id}</button>}
    </article>)}
    {more && <button disabled={busy} onClick={() => void load(entries[entries.length - 1]?.id)}>Carregar alterações anteriores</button>}
  </div>;
}
