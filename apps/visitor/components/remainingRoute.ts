import type { NoRota } from "../types";
import type { PositionEstimate } from "../positioning/types";

export type VisibleRouteEdge = {
  from: { coord_x: number; coord_y: number };
  to: NoRota;
  floorId: number;
};

/** During a simulation, draw only the portion the marker has not traversed. */
export function remainingRouteEdges(nodes: NoRota[], position?: PositionEstimate | null): VisibleRouteEdge[] {
  const moving = position?.source === "simulation";
  const currentEdge = moving ? nodes.findIndex((node, index) => node.id === position.fromNodeId && nodes[index + 1]?.id === position.toNodeId) : -1;
  const currentNode = moving && currentEdge < 0 ? nodes.findIndex((node) => node.id === position.fromNodeId) : -1;
  const firstVisible = currentEdge >= 0 ? currentEdge : currentNode >= 0 ? currentNode : 0;
  const edges: VisibleRouteEdge[] = [];
  for (let index = firstVisible; index < nodes.length - 1; index++) {
    const from = nodes[index], to = nodes[index + 1];
    if (from.piso_id !== to.piso_id) continue;
    const start = index === currentEdge && position && position.floorId === from.piso_id
      ? { coord_x: position.x, coord_y: position.y } : from;
    if (Math.hypot(start.coord_x - to.coord_x, start.coord_y - to.coord_y) < 1e-7) continue;
    edges.push({ from: start, to, floorId: from.piso_id });
  }
  return edges;
}
