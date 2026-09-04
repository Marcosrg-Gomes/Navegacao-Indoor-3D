import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
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
    ]).then(([shoppings, pisos, nos, arestas, lojas, categorias, qrs, validacao]) => {
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
    }).catch(() => undefined);
  }, []);

  const cards = [
    ["Shoppings", stats.shoppings],
    ["Pisos", stats.pisos],
    ["Nós", stats.nos],
    ["Arestas", stats.arestas],
    ["Lojas", stats.lojas],
    ["Categorias", stats.categorias],
    ["QR Codes", stats.qrs],
  ] as const;

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Resumo do cadastro e da saúde do grafo de navegação.</p>
        </div>
        <Link to="/editor">
          <button className="primary">Abrir editor visual</button>
        </Link>
      </div>
      <div className="grid-cards">
        {cards.map(([label, value]) => (
          <div className="stat" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Validação do grafo</h3>
        {!validacao && <p className="muted">Carregando…</p>}
        {validacao?.valido && <p>Nenhum problema encontrado.</p>}
        {validacao && !validacao.valido && (
          <div>
            <p>Encontrados {validacao.problemas.length} tipo(s) de problema.</p>
            <Link to="/validacao">Ver relatório completo</Link>
          </div>
        )}
      </div>
    </div>
  );
}
