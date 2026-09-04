import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../toast";
import type { Piso, Shopping } from "../types";
import { Field, FormActions, Modal, confirmDelete, useBusySubmit } from "../ui";

const empty = {
  shopping_id: "",
  nome: "",
  nivel: "0",
  imagem_planta_url: "",
  largura_metros: "100",
  altura_metros: "60",
};

export default function Floors() {
  const toast = useToast();
  const nav = useNavigate();
  const { busy, run } = useBusySubmit();
  const [pisos, setPisos] = useState<Piso[]>([]);
  const [shoppings, setShoppings] = useState<Shopping[]>([]);
  const [edit, setEdit] = useState<Piso | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  async function load() {
    const [p, s] = await Promise.all([api<Piso[]>("/admin/floors"), api<Shopping[]>("/admin/shoppings")]);
    setPisos(p);
    setShoppings(s);
  }

  useEffect(() => {
    load().catch((e) => toast(e.message, "erro"));
  }, []);

  function startCreate() {
    setEdit(null);
    setForm({ ...empty, shopping_id: shoppings[0]?.id.toString() || "" });
    setOpen(true);
  }

  function startEdit(item: Piso) {
    setEdit(item);
    setForm({
      shopping_id: String(item.shopping_id),
      nome: item.nome,
      nivel: String(item.nivel),
      imagem_planta_url: item.imagem_planta_url || "",
      largura_metros: item.largura_metros?.toString() ?? "",
      altura_metros: item.altura_metros?.toString() ?? "",
    });
    setOpen(true);
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Pisos</h1>
          <p>Planta baixa, nível e dimensões em metros (usadas no cálculo de distância).</p>
        </div>
        <button className="primary" onClick={startCreate}>
          Novo piso
        </button>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Nível</th>
              <th>Shopping</th>
              <th>Planta</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pisos.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.nome}</td>
                <td>{item.nivel}</td>
                <td>{shoppings.find((s) => s.id === item.shopping_id)?.nome || item.shopping_id}</td>
                <td>{item.imagem_planta_url ? "Sim" : "—"}</td>
                <td className="row-actions">
                  <button onClick={() => nav(`/editor?piso=${item.id}`)}>Editor</button>
                  <button onClick={() => startEdit(item)}>Editar</button>
                  <button
                    className="danger"
                    onClick={async () => {
                      if (!confirmDelete(item.nome)) return;
                      try {
                        await api(`/admin/floors/${item.id}`, { method: "DELETE" });
                        toast("Piso excluído", "ok");
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
        <Modal title={edit ? "Editar piso" : "Novo piso"} onClose={() => setOpen(false)}>
          <form
            onSubmit={(e) =>
              run(e, async () => {
                const payload = {
                  shopping_id: Number(form.shopping_id),
                  nome: form.nome,
                  nivel: Number(form.nivel),
                  imagem_planta_url: form.imagem_planta_url || null,
                  largura_metros: form.largura_metros ? Number(form.largura_metros) : null,
                  altura_metros: form.altura_metros ? Number(form.altura_metros) : null,
                };
                try {
                  if (edit) await api(`/admin/floors/${edit.id}`, { method: "PUT", body: JSON.stringify(payload) });
                  else await api("/admin/floors", { method: "POST", body: JSON.stringify(payload) });
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
              <Field label="Shopping" className="full">
                <select value={form.shopping_id} onChange={(e) => setForm({ ...form, shopping_id: e.target.value })} required>
                  {shoppings.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Nome">
                <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
              </Field>
              <Field label="Nível">
                <input type="number" value={form.nivel} onChange={(e) => setForm({ ...form, nivel: e.target.value })} required />
              </Field>
              <Field label="Largura (m)">
                <input value={form.largura_metros} onChange={(e) => setForm({ ...form, largura_metros: e.target.value })} />
              </Field>
              <Field label="Altura (m)">
                <input value={form.altura_metros} onChange={(e) => setForm({ ...form, altura_metros: e.target.value })} />
              </Field>
              <Field label="URL da planta baixa" className="full">
                <input
                  value={form.imagem_planta_url}
                  onChange={(e) => setForm({ ...form, imagem_planta_url: e.target.value })}
                  placeholder="https://… ou /planta.svg"
                />
              </Field>
            </div>
            <FormActions onCancel={() => setOpen(false)} busy={busy} />
          </form>
        </Modal>
      )}
    </div>
  );
}
