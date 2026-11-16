import { FormEvent, useState } from "react";
import { api, setApiKey, clearApiKey } from "../api";
import { useToast } from "../toast";

export default function Login({ onOk }: { onOk: () => void }) {
  const toast = useToast();
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setApiKey(key.trim());
    try {
      await api("/admin/session");
      toast("Acesso liberado", "ok");
      onOk();
    } catch (err) {
      clearApiKey();
      toast(err instanceof Error ? err.message : "Chave inválida", "erro");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <aside className="login-brand" aria-hidden="true">
        <div className="login-brand-top">
          <span className="brand-mark" />
          <strong>Navegação Indoor</strong>
        </div>
        <div className="login-brand-copy">
          <p className="login-brand-title">Mapas, rotas e acessos do shopping em um só lugar.</p>
          <p className="login-brand-text">Cadastre pisos, lojas e conexões; valide a malha e publique a cena 3D que o visitante usa para chegar ao destino.</p>
        </div>
        <svg className="login-brand-route" viewBox="0 0 320 200" fill="none">
          <path d="M20 180V120a20 20 0 0 1 20-20h120a20 20 0 0 0 20-20V20" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeDasharray="1 14" />
          <circle cx="20" cy="180" r="9" fill="currentColor" />
          <path d="M180 8l12 22-12-6-12 6z" fill="currentColor" />
        </svg>
      </aside>
      <main className="login-main">
        <form className="login-card" onSubmit={submit}>
          <h1>Entrar no painel</h1>
          <p>Informe sua credencial administrativa. As alterações serão registradas com a identificação vinculada a ela.</p>
          <label htmlFor="admin-key">Chave de acesso</label>
          <input
            id="admin-key"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoFocus
            required
            placeholder="••••••••"
          />
          <button className="primary" disabled={busy}>
            {busy ? "Verificando…" : "Entrar no painel"}
          </button>
        </form>
      </main>
    </div>
  );
}
