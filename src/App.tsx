import { useMemo, useState } from "react";
import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { clearApiKey, getApiKey } from "./services/api";
import { ToastContext, ToastFn, ToastKind } from "./toast";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Shoppings from "./pages/Shoppings";
import Floors from "./pages/Floors";
import Nodes from "./pages/Nodes";
import Edges from "./pages/Edges";
import Stores from "./pages/Stores";
import Categories from "./pages/Categories";
import QRCodes from "./pages/QRCodes";
import Validation from "./pages/Validation";

const links = [
  ["/", "Dashboard"],
  ["/shoppings", "Shoppings"],
  ["/pisos", "Pisos"],
  ["/nos", "Editor de Nós"],
  ["/arestas", "Arestas"],
  ["/lojas", "Lojas"],
  ["/categorias", "Categorias"],
  ["/qr", "QR Codes"],
  ["/validacao", "Validação"],
] as const;

export default function App() {
  const [authed, setAuthed] = useState(() => Boolean(getApiKey()));
  const [toasts, setToasts] = useState<{ id: number; msg: string; kind: ToastKind }[]>([]);

  const toast: ToastFn = (msg, kind = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };

  const shell = useMemo(
    () => (
      <div className="app">
        <aside className="sidebar no-print">
          <div className="brand">
            <small>Indoor Nav</small>
            <strong>Painel Admin</strong>
          </div>
          <nav className="nav">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === "/"}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-foot">
            <button
              onClick={() => {
                clearApiKey();
                setAuthed(false);
              }}
            >
              Sair
            </button>
          </div>
        </aside>
        <main className="main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/shoppings" element={<Shoppings />} />
            <Route path="/pisos" element={<Floors />} />
            <Route path="/nos" element={<Nodes />} />
            <Route path="/editor" element={<Navigate to="/nos" replace />} />
            <Route path="/arestas" element={<Edges />} />
            <Route path="/lojas" element={<Stores />} />
            <Route path="/categorias" element={<Categories />} />
            <Route path="/qr" element={<QRCodes />} />
            <Route path="/validacao" element={<Validation />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    ),
    []
  );

  return (
    <ToastContext.Provider value={toast}>
      {authed ? shell : <Login onOk={() => setAuthed(true)} />}
      <div className="toasts no-print">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
