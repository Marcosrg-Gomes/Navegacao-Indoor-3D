import { useEffect, useState } from "react";
import { api } from "../api";
import { useToast } from "../toast";
import type { Shopping } from "../types";
import { Field, FormActions, Modal, confirmDelete, useBusySubmit } from "../ui";

const empty = { codigo: "", nome: "", endereco: "", latitude: "", longitude: "", ativo: true };

export default function Shoppings() {
  const toast = useToast();
  const { busy, run } = useBusySubmit();
  const [itens, setItens] = useState<Shopping[]>([]);
  const [edit, setEdit] = useState<Shopping | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  async function load() {
    setItens(await api<Shopping[]>("/admin/shoppings"));
  }

  useEffect(() => {
    load().catch((e) => toast(e.message, "erro"));
  }, []);

  function startCreate() {
    setEdit(null);
    setForm(empty);
    setOpen(true);
  }

  function startEdit(item: Shopping) {
    setEdit(item);
    setForm({
      codigo: item.codigo, nome: item.nome,
      endereco: item.endereco || "",
      latitude: item.latitude?.toString() ?? "",
      longitude: item.longitude?.toString() ?? "",
      ativo: item.ativo,
    });
    setOpen(true);
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Shoppings</h1>
          <p>Cadastro dos centros comerciais.</p>
        </div>
        <button className="primary" onClick={startCreate}>
          Novo shopping
        </button>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Endereço</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.nome}</td>
                <td>{item.endereco || "—"}</td>
                <td>
                  <span className={`badge ${item.ativo ? "on" : "off"}`}>{item.ativo ? "Ativo" : "Inativo"}</span>
                </td>
                <td className="row-actions">
                  <button onClick={() => startEdit(item)}>Editar</button>
                  <button
                    className="danger"
                    onClick={async () => {
                      if (!confirmDelete(item.nome)) return;
                      try {
                        await api(`/admin/shoppings/${item.id}`, { method: "DELETE" });
                        toast("Shopping inativado", "ok");
                        await load();
                      } catch (e) {
                        toast(e instanceof Error ? e.message : "Erro", "erro");
                      }
                    }}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && (
        <Modal title={edit ? "Editar shopping" : "Novo shopping"} onClose={() => setOpen(false)}>
          <form
            onSubmit={(e) =>
              run(e, async () => {
                const payload = {
                  codigo: form.codigo.trim() || undefined, nome: form.nome,
                  endereco: form.endereco || null,
                  latitude: form.latitude ? Number(form.latitude) : null,
                  longitude: form.longitude ? Number(form.longitude) : null,
                  ativo: form.ativo,
                };
                try {
                  if (edit) await api(`/admin/shoppings/${edit.id}`, { method: "PUT", body: JSON.stringify(payload) });
                  else await api("/admin/shoppings", { method: "POST", body: JSON.stringify(payload) });
                  toast("Salvo", "ok");
                  setOpen(false);
                  await load();
                } catch (err) {
                  toast(err instanceof Error ? err.message : "Erro", "erro");
                }
              })
            }
          >
            <div className="form-grid">
              <Field label="Código estável (gerado se vazio)">
                <input value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })} pattern="[A-Z][A-Z0-9_]*" maxLength={80} />
              </Field>
              <Field label="Nome" className="full">
                <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
              </Field>
              <Field label="Endereço" className="full">
                <input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
              </Field>
              <Field label="Cadastro ativo">
                <select value={String(form.ativo)} onChange={(e) => setForm({ ...form, ativo: e.target.value === "true" })}>
                  <option value="true">Ativo</option><option value="false">Inativo</option>
                </select>
              </Field>
              <Field label="Latitude">
                <input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
              </Field>
              <Field label="Longitude">
                <input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
              </Field>
            </div>
            <FormActions onCancel={() => setOpen(false)} busy={busy} />
          </form>
        </Modal>
      )}
    </div>
  );
}
