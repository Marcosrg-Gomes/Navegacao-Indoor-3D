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
import SceneValidation from "./pages/SceneValidation";
import Audit from "./pages/Audit";
import { Icon, type IconName } from "./components/Icon";

const links: readonly (readonly [string, string, IconName])[] = [
  ["/", "Dashboard", "dashboard"],
  ["/shoppings", "Shoppings", "mall"],
  ["/pisos", "Pisos", "floors"],
  ["/nos", "Editor de Nós", "node"],
  ["/arestas", "Arestas", "edge"],
  ["/lojas", "Lojas", "store"],
  ["/categorias", "Categorias", "tag"],
  ["/qr", "QR Codes", "qr"],
  ["/validacao", "Validação", "check"],
  ["/cena-3d", "Cena 3D", "cube"],
  ["/auditoria", "Histórico e falhas", "history"],
];

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
            <span className="brand-mark" aria-hidden="true" />
            <div>
              <small>Navegação Indoor</small>
              <strong>Painel Admin</strong>
            </div>
          </div>
          <nav className="nav" aria-label="Seções do painel">
            {links.map(([to, label, icon]) => (
              <NavLink key={to} to={to} end={to === "/"}>
                <Icon name={icon} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="sidebar-foot">
            <button
              className="logout"
              onClick={() => {
                clearApiKey();
                setAuthed(false);
              }}
            >
              <Icon name="logout" /> Sair
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
            <Route path="/cena-3d" element={<SceneValidation />} />
            <Route path="/auditoria" element={<Audit />} />
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
      <div className="toasts no-print" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`} role={t.kind === "erro" ? "alert" : undefined}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
