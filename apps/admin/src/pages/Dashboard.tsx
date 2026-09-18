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
      {error && <p role="alert" className="toast erro">{error} · <button onClick={() => window.location.reload()}>Tentar novamente</button></p>}
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
            <button>🩺 Validar Grafo</button>
          </Link>
        </div>
      </div>

      {/* Grid de Cards de Estatísticas */}
      <div className="grid-cards">
        {cards.map(([label, value, icon, to]) => (
          <Link to={to} key={label} style={{ textDecoration: "none", color: "inherit" }}>
            <div className="stat" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
              <span style={{ fontSize: 26, opacity: 0.8 }}>{icon}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Card de Saúde do Grafo */}
      <div className="card" style={{ marginTop: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Integridade da Malha de Navegação</h3>
          {validacao && (
            <span
              style={{
                padding: "4px 12px",
                borderRadius: 16,
                fontSize: "0.85rem",
                fontWeight: 700,
                backgroundColor: validacao.valido ? "#dcfce7" : "#fee2e2",
                color: validacao.valido ? "#15803d" : "#b91c1c",
              }}
            >
              {validacao.valido ? "Grafo Conexo e Íntegro" : "Inconsistências Detectadas"}
            </span>
          )}
        </div>

        {!validacao ? (
          <p className="muted" style={{ marginTop: 12 }}>Carregando validação do grafo…</p>
        ) : validacao.valido ? (
          <p style={{ marginTop: 12, color: "#166534" }}>
            ✅ Todos os nós ativos estão conectados e nenhuma referência órfã foi identificada.
          </p>
        ) : (
          <div style={{ marginTop: 12 }}>
            <p style={{ color: "#991b1b" }}>
              ⚠️ Foram detectados <strong>{validacao.problemas.length}</strong> tipo(s) de inconsistência no grafo de navegação (ex.: nós isolados ou arestas inválidas).
            </p>
            <div style={{ marginTop: 12 }}>
              <Link to="/validacao" style={{ fontWeight: 600, color: "#2563eb" }}>
                Ver relatório detalhado com links de correção →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
