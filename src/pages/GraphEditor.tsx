import { PointerEvent, useEffect, useMemo, useRef, useState, WheelEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useToast } from "../toast";
import {
  Aresta,
  No,
  Piso,
  TIPO_NO_COR,
  TIPO_NO_LABEL,
  TIPOS_NO,
  TipoNo,
} from "../types";

type Mode = "selecionar" | "criar-no" | "ligar";
type SaveState = "ok" | "busy" | "err";

export default function GraphEditor() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [pisos, setPisos] = useState<Piso[]>([]);
  const [pisoId, setPisoId] = useState<number | "">("");
  const [nos, setNos] = useState<No[]>([]);
  const [arestas, setArestas] = useState<Aresta[]>([]);
  const [mode, setMode] = useState<Mode>("selecionar");
  const [tipoNovo, setTipoNovo] = useState<TipoNo>("corredor");
  const [selectedNo, setSelectedNo] = useState<number | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<number | null>(null);
  const [linkFrom, setLinkFrom] = useState<number | null>(null);
  const [save, setSave] = useState<SaveState>("ok");
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const drag = useRef<{ id: number; moved: boolean } | null>(null);
  const pan = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const nosRef = useRef<No[]>([]);
  nosRef.current = nos;

  const piso = pisos.find((p) => p.id === pisoId);

  async function loadGraph(id: number) {
    const [n, e] = await Promise.all([
      api<No[]>(`/admin/nodes?piso_id=${id}`),
      api<Aresta[]>(`/admin/edges?piso_id=${id}`),
    ]);
    setNos(n);
    setArestas(e);
  }

  useEffect(() => {
    api<Piso[]>("/admin/floors")
      .then((lista) => {
        setPisos(lista);
        const fromQuery = Number(params.get("piso"));
        const initial = lista.find((p) => p.id === fromQuery)?.id ?? lista[0]?.id ?? "";
        setPisoId(initial);
      })
      .catch((e) => toast(e.message, "erro"));
  }, []);

  useEffect(() => {
    if (typeof pisoId !== "number") return;
    setParams({ piso: String(pisoId) }, { replace: true });
    loadGraph(pisoId).catch((e) => toast(e.message, "erro"));
    setSelectedNo(null);
    setSelectedEdge(null);
    setLinkFrom(null);
  }, [pisoId]);

  const noById = useMemo(() => new Map(nos.map((n) => [n.id, n])), [nos]);

  function edgeInvalid(a: Aresta) {
    const o = noById.get(a.no_origem_id);
    const d = noById.get(a.no_destino_id);
    return !o || !d || !o.ativo || !d.ativo || !a.ativa;
  }

  async function persistNo(id: number, patch: Partial<No>) {
    setSave("busy");
    try {
      const updated = await api<No>(`/admin/nodes/${id}`, { method: "PUT", body: JSON.stringify(patch) });
      setNos((prev) => prev.map((n) => (n.id === id ? updated : n)));
      setSave("ok");
    } catch (e) {
      setSave("err");
      toast(e instanceof Error ? e.message : "Falha ao salvar nó", "erro");
    }
  }

  async function persistEdge(id: number, patch: Partial<Aresta>) {
    setSave("busy");
    try {
      const updated = await api<Aresta>(`/admin/edges/${id}`, { method: "PUT", body: JSON.stringify(patch) });
      setArestas((prev) => prev.map((a) => (a.id === id ? updated : a)));
      setSave("ok");
    } catch (e) {
      setSave("err");
      toast(e instanceof Error ? e.message : "Falha ao salvar aresta", "erro");
    }
  }

  function svgPoint(ev: PointerEvent<SVGSVGElement | SVGCircleElement | SVGLineElement>) {
    const svg = boxRef.current?.querySelector("svg");
    if (!svg) return { x: 0, y: 0 };
    const r = svg.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (ev.clientY - r.top) / r.height)),
    };
  }

  async function onSvgClick(ev: PointerEvent<SVGSVGElement>) {
    if (drag.current?.moved) return;
    if (mode !== "criar-no" || typeof pisoId !== "number") return;
    const { x, y } = svgPoint(ev);
    setSave("busy");
    try {
      const created = await api<No>("/admin/nodes", {
        method: "POST",
        body: JSON.stringify({
          piso_id: pisoId,
          coord_x: Number(x.toFixed(4)),
          coord_y: Number(y.toFixed(4)),
          tipo: tipoNovo,
          nome: `${TIPO_NO_LABEL[tipoNovo]} ${nos.length + 1}`,
        }),
      });
      setNos((prev) => [...prev, created]);
      setSelectedNo(created.id);
      setSave("ok");
    } catch (e) {
      setSave("err");
      toast(e instanceof Error ? e.message : "Não foi possível criar o nó", "erro");
    }
  }

  function onWheel(ev: WheelEvent<HTMLDivElement>) {
    ev.preventDefault();
    const factor = ev.deltaY < 0 ? 1.1 : 0.9;
    setView((v) => {
      const scale = Math.min(4, Math.max(0.4, v.scale * factor));
      return { ...v, scale };
    });
  }

  function onBoxPointerDown(ev: PointerEvent<HTMLDivElement>) {
    if ((ev.target as HTMLElement).tagName === "circle") return;
    pan.current = { x: ev.clientX, y: ev.clientY, vx: view.x, vy: view.y };
  }

  function onBoxPointerMove(ev: PointerEvent<HTMLDivElement>) {
    if (drag.current) {
      const { x, y } = svgPoint(ev as unknown as PointerEvent<SVGSVGElement>);
      drag.current.moved = true;
      const id = drag.current.id;
      setNos((prev) => prev.map((n) => (n.id === id ? { ...n, coord_x: x, coord_y: y } : n)));
      return;
    }
    if (pan.current && mode !== "criar-no") {
      setView({
        ...view,
        x: pan.current.vx + (ev.clientX - pan.current.x),
        y: pan.current.vy + (ev.clientY - pan.current.y),
      });
    }
  }

  async function onBoxPointerUp() {
    if (drag.current) {
      const id = drag.current.id;
      const node = nosRef.current.find((n) => n.id === id);
      if (drag.current.moved && node) {
        await persistNo(id, { coord_x: Number(node.coord_x.toFixed(4)), coord_y: Number(node.coord_y.toFixed(4)) });
      }
    }
    drag.current = null;
    pan.current = null;
  }

  async function onNodeClick(no: No, ev: PointerEvent<SVGCircleElement>) {
    ev.stopPropagation();
    if (drag.current?.moved) return;
    if (mode === "ligar") {
      if (linkFrom == null) {
        setLinkFrom(no.id);
        setSelectedNo(no.id);
        return;
      }
      if (linkFrom === no.id) return;
      setSave("busy");
      try {
        const created = await api<Aresta>("/admin/edges", {
          method: "POST",
          body: JSON.stringify({ no_origem_id: linkFrom, no_destino_id: no.id }),
        });
        setArestas((prev) => [...prev, created]);
        setLinkFrom(null);
        setSelectedEdge(created.id);
        setSave("ok");
      } catch (e) {
        setSave("err");
        toast(e instanceof Error ? e.message : "Não foi possível criar a aresta", "erro");
      }
      return;
    }
    setSelectedNo(no.id);
    setSelectedEdge(null);
  }

  const selectedNode = nos.find((n) => n.id === selectedNo);
  const selectedAresta = arestas.find((a) => a.id === selectedEdge);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Editor visual</h1>
          <p>Arraste nós, ligue arestas com dois cliques e as alterações são gravadas na API.</p>
        </div>
        <div>
          <span className={`save-dot ${save === "busy" ? "busy" : save === "err" ? "err" : ""}`} />
          {save === "busy" ? "Salvando…" : save === "err" ? "Erro ao salvar" : "Salvo"}
        </div>
      </div>
      <div className="toolbar">
        <select
          value={pisoId}
          onChange={(e) => setPisoId(e.target.value ? Number(e.target.value) : "")}
          style={{ maxWidth: 260 }}
        >
          {pisos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome} · nível {p.nivel}
            </option>
          ))}
        </select>
        <button className={mode === "selecionar" ? "primary" : ""} onClick={() => setMode("selecionar")}>
          Selecionar / arrastar
        </button>
        <button className={mode === "criar-no" ? "primary" : ""} onClick={() => setMode("criar-no")}>
          Criar nó
        </button>
        <button
          className={mode === "ligar" ? "primary" : ""}
          onClick={() => {
            setMode("ligar");
            setLinkFrom(null);
          }}
        >
          Ligar aresta
        </button>
        <select value={tipoNovo} onChange={(e) => setTipoNovo(e.target.value as TipoNo)} style={{ maxWidth: 180 }}>
          {TIPOS_NO.map((t) => (
            <option key={t} value={t}>
              {TIPO_NO_LABEL[t]}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setView({ x: 0, y: 0, scale: 1 });
          }}
        >
          Resetar vista
        </button>
      </div>
      <div className="editor-layout">
        <div
          ref={boxRef}
          className={`editor-map ${mode === "criar-no" ? "creating" : ""}`}
          onWheel={onWheel}
          onPointerDown={onBoxPointerDown}
          onPointerMove={onBoxPointerMove}
          onPointerUp={onBoxPointerUp}
          onPointerLeave={onBoxPointerUp}
        >
          <div className="editor-stage" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
            {piso?.imagem_planta_url ? (
              <img src={piso.imagem_planta_url} alt="Planta baixa" />
            ) : (
              <div className="fallback-planta" />
            )}
            <svg viewBox="0 0 1 1" preserveAspectRatio="none" onPointerDown={onSvgClick}>
              {arestas.map((a) => {
                const o = noById.get(a.no_origem_id);
                const d = noById.get(a.no_destino_id);
                if (!o || !d) return null;
                const invalid = edgeInvalid(a);
                return (
                  <line
                    key={a.id}
                    x1={o.coord_x}
                    y1={o.coord_y}
                    x2={d.coord_x}
                    y2={d.coord_y}
                    stroke={invalid ? "#e26d6d" : a.acessivel ? "#7dd3c7" : "#e8a54b"}
                    strokeWidth={selectedEdge === a.id ? 0.012 : 0.006}
                    strokeDasharray={a.acessivel ? undefined : "0.02 0.01"}
                    onPointerDown={(ev) => {
                      ev.stopPropagation();
                      setSelectedEdge(a.id);
                      setSelectedNo(null);
                    }}
                  />
                );
              })}
              {nos.map((n) => (
                <circle
                  key={n.id}
                  cx={n.coord_x}
                  cy={n.coord_y}
                  r={selectedNo === n.id || linkFrom === n.id ? 0.022 : 0.016}
                  fill={TIPO_NO_COR[n.tipo] || "#fff"}
                  stroke={n.ativo ? "#0c1016" : "#e26d6d"}
                  strokeWidth={0.004}
                  onPointerDown={(ev) => {
                    ev.stopPropagation();
                    drag.current = { id: n.id, moved: false };
                    setSelectedNo(n.id);
                  }}
                  onPointerUp={(ev) => onNodeClick(n, ev)}
                />
              ))}
            </svg>
          </div>
        </div>
        <aside className="editor-side">
          <p className="muted">
            {nos.length} nós · {arestas.length} arestas
            {linkFrom ? " · clique no segundo nó" : ""}
          </p>
          <div className="legend">
            {TIPOS_NO.map((t) => (
              <span key={t}>
                <i style={{ background: TIPO_NO_COR[t] }} />
                {TIPO_NO_LABEL[t]}
              </span>
            ))}
          </div>
          {selectedNode && (
            <div>
              <h3>Nó #{selectedNode.id}</h3>
              <label>Nome</label>
              <input
                value={selectedNode.nome || ""}
                onChange={(e) =>
                  setNos((prev) => prev.map((n) => (n.id === selectedNode.id ? { ...n, nome: e.target.value } : n)))
                }
                onBlur={() => persistNo(selectedNode.id, { nome: selectedNode.nome })}
              />
              <label style={{ marginTop: 10 }}>Tipo</label>
              <select
                value={selectedNode.tipo}
                onChange={(e) => persistNo(selectedNode.id, { tipo: e.target.value })}
              >
                {TIPOS_NO.map((t) => (
                  <option key={t} value={t}>
                    {TIPO_NO_LABEL[t]}
                  </option>
                ))}
              </select>
              <p className="muted">
                x {Number(selectedNode.coord_x).toFixed(3)} · y {Number(selectedNode.coord_y).toFixed(3)}
              </p>
              <button
                className="danger"
                onClick={async () => {
                  if (!window.confirm("Excluir este nó?")) return;
                  try {
                    await api(`/admin/nodes/${selectedNode.id}`, { method: "DELETE" });
                    setNos((prev) => prev.filter((n) => n.id !== selectedNode.id));
                    setSelectedNo(null);
                    toast("Nó excluído", "ok");
                  } catch (e) {
                    toast(e instanceof Error ? e.message : "Erro", "erro");
                  }
                }}
              >
                Excluir nó
              </button>
            </div>
          )}
          {selectedAresta && (
            <div>
              <h3>Aresta #{selectedAresta.id}</h3>
              <p className="muted">
                {selectedAresta.no_origem_id} → {selectedAresta.no_destino_id}
                {selectedAresta.distancia != null ? ` · ${Number(selectedAresta.distancia).toFixed(1)} m` : ""}
              </p>
              <label>
                <input
                  type="checkbox"
                  checked={selectedAresta.ativa}
                  onChange={(e) => persistEdge(selectedAresta.id, { ativa: e.target.checked })}
                />{" "}
                Ativa
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={selectedAresta.acessivel}
                  onChange={(e) => persistEdge(selectedAresta.id, { acessivel: e.target.checked })}
                />{" "}
                Acessível
              </label>
              <button
                className="danger"
                style={{ marginTop: 12 }}
                onClick={async () => {
                  if (!window.confirm("Excluir esta aresta?")) return;
                  try {
                    await api(`/admin/edges/${selectedAresta.id}`, { method: "DELETE" });
                    setArestas((prev) => prev.filter((a) => a.id !== selectedAresta.id));
                    setSelectedEdge(null);
                    toast("Aresta excluída", "ok");
                  } catch (e) {
                    toast(e instanceof Error ? e.message : "Erro", "erro");
                  }
                }}
              >
                Excluir aresta
              </button>
            </div>
          )}
          {!selectedNode && !selectedAresta && (
            <p className="muted">
              Clique em um nó ou aresta para editar. Arestas vermelhas estão inativas ou ligam nós inválidos.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
