import { useMemo } from "react";
import type { Scene, SceneFloor } from "../types/scene";
import type { CameraView } from "./SceneControls.web";

export function SceneLabels({ scene, floor, origin, destination, view, width, height, onPoiPress }: {
  scene: Scene; floor: SceneFloor; origin?: number; destination?: number; view: CameraView; width: number; height: number; onPoiPress: (id: number) => void;
}) {
  const compact = view.zoom < 1.5;
  const labels = useMemo(() => scene.anchors.filter((a) => a.piso_id === floor.piso_id).flatMap((anchor) => {
    const poi = scene.pois.find((p) => p.anchor_node_id === anchor.node_id);
    const primary = anchor.node_id === origin || anchor.node_id === destination;
    const transition = ["elevador", "escada", "escada_rolante"].includes(anchor.type);
    if (!poi && !primary && !transition) return [];
    const text = anchor.node_id === origin ? "Você está aqui" : anchor.node_id === destination ? "Destino · " + anchor.name : anchor.type === "elevador" ? "↕ Elevador" : transition ? "↕ Escada" : anchor.type === "banheiro" ? "WC" : compact ? poi!.codigo : anchor.name;
    const color = anchor.node_id === origin ? "#166534" : anchor.node_id === destination ? "#be123c" : transition ? "#6d28d9" : "#334155";
    return [{ anchor, poi, text, color, primary, rank: primary ? 0 : anchor.type === "elevador" ? 1 : transition ? 2 : 3 }];
  }).sort((a, b) => a.rank - b.rank), [scene, floor, origin, destination, compact]);
  const occupied: { x: number; y: number; w: number }[] = [];
  return <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>{labels.map((label) => {
    const point = view.labels[label.anchor.node_id];
    if (!point) return null;
    const [x, pointY, depth] = point, y = pointY - 20;
    const w = Math.min(190, label.text.length * 6.3 + 18);
    if (depth < -1 || depth > 1 || x < w / 2 || x > width - w / 2 || y < 12 || y > height - 18 || occupied.some((r) => Math.abs(r.y - y) < 29 && Math.abs(r.x - x) < (r.w + w) / 2 + 5)) return null;
    occupied.push({ x, y, w });
    return <button key={label.anchor.node_id}
    data-poi-code={label.poi?.codigo} aria-label={label.poi ? `${label.anchor.name}, ver detalhes` : label.anchor.name}
    onClick={() => { if (label.poi) onPoiPress(label.poi.loja_id); }} tabIndex={label.poi ? 0 : -1}
    style={{ position: "absolute", top: 0, left: 0, transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`, pointerEvents: label.poi ? "auto" : "none", whiteSpace: "nowrap", maxWidth: 190, overflow: "hidden", textOverflow: "ellipsis", borderRadius: 7,
      border: `1px solid ${label.primary ? "#fff" : "#cbd5e1"}`, background: label.primary ? label.color : "#fffffff2", color: label.primary ? "#fff" : label.color,
      padding: "4px 8px", font: "600 11px/17px system-ui, sans-serif", cursor: label.poi ? "pointer" : "default", boxShadow: "0 2px 5px #10243a15" }}>{label.text}</button>;
  })}</div>;
}
