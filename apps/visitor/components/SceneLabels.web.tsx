import { useMemo } from "react";
import type { Scene, SceneFloor } from "../types/scene";
import type { CameraView } from "./SceneControls.web";
import type { PositionEstimate } from "../positioning/types";
import { sceneTransform } from "./sceneTransform";

export function SceneLabels({ scene, floor, origin, destination, simulated, position, view, width, height, onPoiPress }: {
  scene: Scene; floor: SceneFloor; origin?: number; destination?: number; simulated?: boolean; position?: PositionEstimate | null; view: CameraView; width: number; height: number; onPoiPress: (id: number) => void;
}) {
  const compact = view.zoom < 1.5;
  const mobile = width < 600;
  const focus = position?.floorId === floor.piso_id ? sceneTransform(floor, position.x, position.y) : view.target;
  const nearbyStoreIds = new Set(scene.anchors.filter((anchor) => anchor.piso_id === floor.piso_id && scene.pois.some((poi) => poi.anchor_node_id === anchor.node_id))
    .sort((a, b) => {
      const pointA = sceneTransform(floor, a.coord_x, a.coord_y), pointB = sceneTransform(floor, b.coord_x, b.coord_y);
      return Math.hypot(pointA[0] - (focus[0] ?? 0), pointA[2] - (focus[2] ?? 0)) - Math.hypot(pointB[0] - (focus[0] ?? 0), pointB[2] - (focus[2] ?? 0));
    }).slice(0, simulated ? 2 : 3).map((anchor) => anchor.node_id));
  const labels = useMemo(() => scene.anchors.filter((a) => a.piso_id === floor.piso_id).flatMap((anchor) => {
    const poi = scene.pois.find((p) => p.anchor_node_id === anchor.node_id);
    const primary = anchor.node_id === origin || anchor.node_id === destination;
    const transition = ["elevador", "escada", "escada_rolante"].includes(anchor.type);
    if (!poi && !primary && !transition) return [];
    if (mobile && poi && !primary && !nearbyStoreIds.has(anchor.node_id)) return [];
    if (simulated && (anchor.node_id === origin || (!primary && mobile))) return [];
    const text = anchor.node_id === origin ? "Você está aqui" : anchor.node_id === destination ? anchor.name : anchor.type === "elevador" ? "↕ Elevador" : transition ? "↕ Escada" : anchor.type === "banheiro" ? "WC" : compact ? poi!.codigo : anchor.name;
    const color = anchor.node_id === origin ? "#166534" : anchor.node_id === destination ? "#be123c" : transition ? "#6d28d9" : "#334155";
    return [{ anchor, poi, text, color, primary, rank: primary ? 0 : anchor.type === "elevador" ? 1 : transition ? 2 : 3 }];
  }).sort((a, b) => a.rank - b.rank), [scene, floor, origin, destination, simulated, compact, mobile, position?.x, position?.y, view.target[0], view.target[2]]);
  const occupied: { x: number; y: number; w: number }[] = [];
  return <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>{labels.map((label) => {
    const point = view.labels[label.anchor.node_id];
    if (!point) return null;
    const [x, pointY, depth] = point, y = pointY - 20;
    const w = Math.min(mobile ? label.primary ? 132 : 102 : 190, label.text.length * (mobile ? 5.7 : 6.3) + 18);
    if (depth < -1 || depth > 1 || x < w / 2 || x > width - w / 2 || y < 22 || y > height - (mobile ? 78 : 22) || occupied.some((r) => Math.abs(r.y - y) < (mobile ? 37 : 45) && Math.abs(r.x - x) < (r.w + w) / 2 + 5)) return null;
    occupied.push({ x, y, w });
    return <button key={label.anchor.node_id}
    data-poi-code={label.poi?.codigo} aria-label={label.poi ? `${label.anchor.name}, ver detalhes` : label.anchor.name}
    onClick={() => { if (label.poi) onPoiPress(label.poi.loja_id); }} tabIndex={label.poi ? 0 : -1}
    style={{ position: "absolute", top: 0, left: 0, transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`, pointerEvents: label.poi ? "auto" : "none", whiteSpace: "nowrap", maxWidth: mobile ? 132 : 190,
      minHeight: label.poi ? 44 : 28, minWidth: 44, padding: mobile ? "7px 2px" : "4px 8px", border: 0, background: "transparent", color: label.color,
      font: "600 12px/18px system-ui, sans-serif", cursor: label.poi ? "pointer" : "default" }}>
      <span style={{ display: "inline-block", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", verticalAlign: "middle", borderRadius: 8,
        border: `1px solid ${label.primary ? "#fff" : "#cbd5e1"}`, background: label.primary ? label.color : "#fffffff2", color: label.primary ? "#fff" : label.color,
        padding: mobile ? "3px 7px" : "4px 8px", font: mobile ? "700 11px/16px system-ui, sans-serif" : "600 12px/18px system-ui, sans-serif", boxShadow: "0 2px 5px #10243a15" }}>{label.text}</span>
    </button>;
  })}</div>;
}
