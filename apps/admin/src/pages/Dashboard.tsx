import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import type { Aresta, Categoria, Loja, No, Piso, QRCode, Shopping, ValidacaoGrafo } from "../types";

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
    ["Shoppings", stats.shoppings, "🏬", "/shoppings"],
    ["Pisos", stats.pisos, "🏢", "/pisos"],
    ["Nós no Mapa", stats.nos, "📍", "/nos"],
    ["Arestas", stats.arestas, "🔗", "/arestas"],
    ["Lojas / POIs", stats.lojas, "🛍️", "/lojas"],
    ["Categorias", stats.categorias, "🏷️", "/categorias"],
    ["QR Codes", stats.qrs, "📷", "/qr"],
  ] as const;

  return (
    <div>
      {error && <p role="alert" className="toast erro">{error} · <button className="ghost" onClick={() => window.location.reload()}>Tentar novamente</button></p>}
      <div className="page-head">
        <div>
          <h1>Dashboard Administrativo</h1>
          <p>Visão geral da infraestrutura cadastrada e da integridade da malha de navegação indoor.</p>
        </div>
        <div className="row-actions">
          <Link to="/nos">
            <button className="primary">📐 Editor Visual de Nós</button>
          </Link>
          <Link to="/validacao">
            <button className="accent">🩺 Validar Grafo</button>
          </Link>
        </div>
      </div>

      <div className="grid-cards">
        {cards.map(([label, value, icon, to]) => (
          <Link to={to} key={label} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="stat" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <span>{label}</span>
              </div>
              <strong style={{ fontSize: 32 }}>{value}</strong>
            </div>
          </Link>
        ))}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, color: "var(--primary)" }}>Integridade da Malha de Navegação</h3>
          {validacao && (
            <span
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: "0.85rem",
                fontWeight: 700,
                backgroundColor: validacao.valido ? "var(--success-soft)" : "var(--danger-soft)",
                color: validacao.valido ? "var(--success)" : "var(--danger)",
                border: `1px solid ${validacao.valido ? "var(--success)" : "var(--danger)"}`,
              }}
            >
              {validacao.valido ? "Grafo Conexo e Íntegro" : "Inconsistências Detectadas"}
            </span>
          )}
        </div>

        {!validacao ? (
          <p className="muted" style={{ marginTop: 12 }}>Carregando validação do grafo…</p>
        ) : validacao.valido ? (
          <p style={{ marginTop: 12, color: "var(--success)", fontWeight: 600 }}>
            ✅ Todos os nós ativos estão conectados e nenhuma referência órfã foi identificada.
          </p>
        ) : (
          <div style={{ marginTop: 12 }}>
            <p style={{ color: "var(--danger)", fontWeight: 600 }}>
              ⚠️ Foram detectados <strong>{validacao.problemas.length}</strong> tipo(s) de inconsistência no grafo de navegação.
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
