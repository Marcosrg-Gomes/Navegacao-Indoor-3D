import { useEffect, useState } from "react";
import { api } from "../api";
import { useToast } from "../toast";
import {
  STATUS_OPERACIONAL_LABEL,
  type Categoria,
  type Loja,
  type No,
  type StatusOperacional,
} from "../types";
import { Field, FormActions, Modal, confirmDelete, useBusySubmit } from "../ui";

const empty = {
  no_id: "",
  nome: "",
  descricao: "",
  categoria_id: "",
  horario_funcionamento: "10:00 - 22:00",
  telefone: "",
  logo_url: "",
  status_operacional: "aberto" as StatusOperacional,
  ativo: true,
};

export default function Stores() {
  const toast = useToast();
  const { busy, run } = useBusySubmit();
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [cats, setCats] = useState<Categoria[]>([]);
  const [nos, setNos] = useState<No[]>([]);
  const [filtro, setFiltro] = useState("");
  const [edit, setEdit] = useState<Loja | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  async function load() {
    const [l, c, n] = await Promise.all([
      api<Loja[]>("/admin/stores"),
      api<Categoria[]>("/admin/categories"),
      api<No[]>("/admin/nodes"),
    ]);
    setLojas(l);
    setCats(c);
    setNos(n);
  }

  useEffect(() => {
    load().catch((e) => toast(e.message, "erro"));
  }, []);

  const visiveis = lojas.filter((l) => !filtro || String(l.categoria_id) === filtro);

  function startCreate() {
    setEdit(null);
    setForm({
      ...empty,
      no_id: nos[0]?.id.toString() || "",
      categoria_id: cats[0]?.id.toString() || "",
    });
    setOpen(true);
  }

  function startEdit(item: Loja) {
    setEdit(item);
    setForm({
      no_id: String(item.no_id),
      nome: item.nome,
      descricao: item.descricao || "",
      categoria_id: item.categoria_id?.toString() ?? "",
      horario_funcionamento: item.horario_funcionamento || "",
      telefone: item.telefone || "",
      logo_url: item.logo_url || "",
      status_operacional: item.status_operacional,
      ativo: item.ativo,
    });
    setOpen(true);
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Lojas / POIs</h1>
          <p>Cada loja fica vinculada a um nó do grafo.</p>
        </div>
        <button className="primary" onClick={startCreate}>
          Nova loja
        </button>
      </div>
      <div className="toolbar">
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)} style={{ maxWidth: 240 }}>
          <option value="">Todas as categorias</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Categoria</th>
              <th>Nó</th>
              <th>Horário</th>
              <th>Status operacional</th>
              <th>Cadastro</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((item) => (
              <tr key={item.id}>
                <td>{item.nome}</td>
                <td>{cats.find((c) => c.id === item.categoria_id)?.nome || item.categoria_nome || "—"}</td>
                <td>
                  {nos.find((n) => n.id === item.no_id)?.nome || `#${item.no_id}`}
                </td>
                <td>{item.horario_funcionamento || "—"}</td>
                <td>
                  <span className={`badge ${item.status_operacional === "aberto" ? "on" : "off"}`}>
                    {STATUS_OPERACIONAL_LABEL[item.status_operacional]}
                  </span>
                </td>
                <td>
                  <span className={`badge ${item.ativo ? "on" : "off"}`}>{item.ativo ? "Ativa" : "Inativa"}</span>
                </td>
                <td className="row-actions">
                  <button onClick={() => startEdit(item)}>Editar</button>
                  <button
                    className="danger"
                    onClick={async () => {
                      if (!confirmDelete(item.nome)) return;
                      try {
                        await api(`/admin/stores/${item.id}`, { method: "DELETE" });
                        toast("Loja excluída", "ok");
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
        <Modal title={edit ? "Editar loja" : "Nova loja"} onClose={() => setOpen(false)}>
          <form
            onSubmit={(e) =>
              run(e, async () => {
                if (!form.no_id || !form.nome.trim() || !form.categoria_id) {
                  toast("Nome, nó associado e categoria são obrigatórios para um ponto de interesse.", "erro");
                  return;
                }
                const payload = {
                  no_id: Number(form.no_id),
                  nome: form.nome.trim(),
                  descricao: form.descricao || null,
                  categoria_id: Number(form.categoria_id),
                  horario_funcionamento: form.horario_funcionamento || null,
                  telefone: form.telefone || null,
                  logo_url: form.logo_url || null,
                  status_operacional: form.status_operacional,
                  ativo: form.ativo,
                };
                try {
                  if (edit) await api(`/admin/stores/${edit.id}`, { method: "PUT", body: JSON.stringify(payload) });
                  else await api("/admin/stores", { method: "POST", body: JSON.stringify(payload) });
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
              <Field label="Nome *" className="full">
                <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
              </Field>
              <Field label="Nó associado *">
                <select value={form.no_id} onChange={(e) => setForm({ ...form, no_id: e.target.value })} required>
                  <option value="">Selecione o nó…</option>
                  {nos.map((n) => (
                    <option key={n.id} value={n.id}>
                      #{n.id} {n.nome || n.tipo}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Categoria *">
                <select value={form.categoria_id} onChange={(e) => setForm({ ...form, categoria_id: e.target.value })} required>
                  <option value="">Selecione a categoria…</option>
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Horário">
                <input
                  value={form.horario_funcionamento}
                  onChange={(e) => setForm({ ...form, horario_funcionamento: e.target.value })}
                />
              </Field>
              <Field label="Telefone">
                <input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
              </Field>
              <Field label="Status operacional *">
                <select
                  value={form.status_operacional}
                  onChange={(e) =>
                    setForm({ ...form, status_operacional: e.target.value as StatusOperacional })
                  }
                  required
                >
                  {(Object.keys(STATUS_OPERACIONAL_LABEL) as StatusOperacional[]).map((status) => (
                    <option key={status} value={status}>
                      {STATUS_OPERACIONAL_LABEL[status]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Cadastro ativo">
                <select
                  value={form.ativo ? "true" : "false"}
                  onChange={(e) => setForm({ ...form, ativo: e.target.value === "true" })}
                >
                  <option value="true">Ativo (pode ser exibido)</option>
                  <option value="false">Inativo (oculto do visitante)</option>
                </select>
              </Field>
              <Field label="URL do logotipo" className="full">
                <input
                  type="url"
                  value={form.logo_url}
                  onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  placeholder="https://exemplo.com/logo.png"
                />
              </Field>
              <Field label="Descrição" className="full">
                <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
              </Field>
            </div>
            <FormActions onCancel={() => setOpen(false)} busy={busy} />
          </form>
        </Modal>
      )}
    </div>
  );
}
