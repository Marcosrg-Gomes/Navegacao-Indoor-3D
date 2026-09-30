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
      <form className="login-card" onSubmit={submit}>
        <small style={{ color: "var(--gold)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Painel administrativo
        </small>
        <h1>Navegação Indoor</h1>
        <p>Informe sua credencial administrativa. As alterações serão registradas com a identificação vinculada a ela.</p>
        <label htmlFor="admin-key">API key</label>
        <input
          id="admin-key"
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          autoFocus
          required
        />
        <button className="primary" disabled={busy}>
          {busy ? "Verificando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
