import { useEffect, useState } from "react";
import { api } from "../api";
import { useToast } from "../toast";
import type { Categoria } from "../types";
import { Field, FormActions, Modal, confirmDelete, useBusySubmit } from "../ui";

export default function Categories() {
  const toast = useToast();
  const { busy, run } = useBusySubmit();
  const [itens, setItens] = useState<Categoria[]>([]);
  const [edit, setEdit] = useState<Categoria | null>(null);
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [icone, setIcone] = useState("");

  async function load() {
    setItens(await api<Categoria[]>("/admin/categories"));
  }

  useEffect(() => {
    load().catch((e) => toast(e.message, "erro"));
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Categorias</h1>
          <p>Alimentação, moda, serviços e demais agrupamentos de lojas.</p>
        </div>
        <button
          className="primary"
          onClick={() => {
            setEdit(null);
            setNome("");
            setIcone("");
            setOpen(true);
          }}
        >
          Nova categoria
        </button>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Ícone</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.nome}</td>
                <td>{item.icone || "—"}</td>
                <td className="row-actions">
                  <button
                    onClick={() => {
                      setEdit(item);
                      setNome(item.nome);
                      setIcone(item.icone || "");
                      setOpen(true);
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="danger"
                    onClick={async () => {
                      if (!confirmDelete(item.nome)) return;
                      try {
                        await api(`/admin/categories/${item.id}`, { method: "DELETE" });
                        toast("Categoria excluída", "ok");
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
        <Modal title={edit ? "Editar categoria" : "Nova categoria"} onClose={() => setOpen(false)}>
          <form
            onSubmit={(e) =>
              run(e, async () => {
                const payload = { nome, icone: icone || null };
                try {
                  if (edit) await api(`/admin/categories/${edit.id}`, { method: "PUT", body: JSON.stringify(payload) });
                  else await api("/admin/categories", { method: "POST", body: JSON.stringify(payload) });
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
              <Field label="Nome">
                <input value={nome} onChange={(e) => setNome(e.target.value)} required />
              </Field>
              <Field label="Ícone (slug)">
                <input value={icone} onChange={(e) => setIcone(e.target.value)} placeholder="restaurant" />
              </Field>
            </div>
            <FormActions onCancel={() => setOpen(false)} busy={busy} />
          </form>
        </Modal>
      )}
    </div>
  );
}
