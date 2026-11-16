import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import type { Aresta, Categoria, Loja, No, Piso, QRCode, Shopping, ValidacaoGrafo } from "../types";
import { Icon, type IconName } from "../components/Icon";

export default function Dashboard() {
  const [stats, setStats] = useState({
    shoppings: 0,
    pisos: 0,
    nos: 0,
    arestas: 0,
    lojas: 0,
    categorias: 0,
    qrs: 0,
  });
  const [validacao, setValidacao] = useState<ValidacaoGrafo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api<Shopping[]>("/admin/shoppings"),
      api<Piso[]>("/admin/floors"),
      api<No[]>("/admin/nodes"),
      api<Aresta[]>("/admin/edges"),
      api<Loja[]>("/admin/stores"),
      api<Categoria[]>("/admin/categories"),
      api<QRCode[]>("/admin/qr-codes"),
      api<ValidacaoGrafo>("/admin/graph/validate"),
    ])
      .then(([shoppings, pisos, nos, arestas, lojas, categorias, qrs, validacao]) => {
        setStats({
          shoppings: shoppings.length,
          pisos: pisos.length,
          nos: nos.length,
          arestas: arestas.length,
          lojas: lojas.length,
          categorias: categorias.length,
          qrs: qrs.length,
        });
        setValidacao(validacao);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Falha ao carregar o painel"));
  }, []);

  const cards = [
    ["Shoppings", stats.shoppings, "mall", "/shoppings"],
    ["Pisos", stats.pisos, "floors", "/pisos"],
    ["Nós no mapa", stats.nos, "node", "/nos"],
    ["Arestas", stats.arestas, "edge", "/arestas"],
    ["Lojas / POIs", stats.lojas, "store", "/lojas"],
    ["Categorias", stats.categorias, "tag", "/categorias"],
    ["QR Codes", stats.qrs, "qr", "/qr"],
  ] as const satisfies readonly (readonly [string, number, IconName, string])[];

  return (
    <div>
      {error && <p role="alert" className="toast erro">{error} · <button className="ghost" onClick={() => window.location.reload()}>Tentar novamente</button></p>}
      <div className="page-head">
        <div>
          <h1>Dashboard Administrativo</h1>
          <p>Visão geral da infraestrutura cadastrada e da integridade da malha de navegação indoor.</p>
        </div>
        <div className="row-actions">
          <Link to="/nos" className="btn primary"><Icon name="node" /> Editor visual de nós</Link>
          <Link to="/validacao" className="btn accent"><Icon name="check" /> Validar grafo</Link>
        </div>
      </div>

      <div className="grid-cards">
        {cards.map(([label, value, icon, to]) => (
          <Link to={to} key={label} className="stat stat-link" aria-label={`${label}: ${value}`}>
            <span className="stat-icon"><Icon name={icon} size={20} /></span>
            <span className="stat-label">{label}</span>
            <strong>{value}</strong>
          </Link>
        ))}
      </div>

      <div className="card">
        <div className="card-head">
          <h2>Integridade da malha de navegação</h2>
          {validacao && (
            <span className={`badge ${validacao.valido ? "on" : "off"}`}>
              {validacao.valido ? "Grafo conexo e íntegro" : "Inconsistências detectadas"}
            </span>
          )}
        </div>

        {!validacao ? (
          <p className="muted" style={{ marginTop: 12 }}>Carregando validação do grafo…</p>
        ) : validacao.valido ? (
          <p className="status-line ok">
            <Icon name="check" /> Todos os nós ativos estão conectados e nenhuma referência órfã foi identificada.
          </p>
        ) : (
          <div style={{ marginTop: 12 }}>
            <p className="status-line err">
              <Icon name="alert" /> Foram detectados <strong>{validacao.problemas.length}</strong> tipo(s) de inconsistência no grafo de navegação.
            </p>
            <div style={{ marginTop: 12 }}>
              <Link to="/validacao" style={{ fontWeight: 700, color: "var(--primary)", textDecoration: "underline" }}>
                Ver relatório detalhado com links de correção →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
