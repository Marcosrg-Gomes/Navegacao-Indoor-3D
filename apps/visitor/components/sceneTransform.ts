import type { SceneFloor } from "../types/scene";
import type { NoRota } from "../types";

/** API → glTF: origin + coord_x * axis_x + coord_y * axis_y. */
export function sceneTransform(floor: SceneFloor, x: number, y: number): [number, number, number] {
  return floor.origin.map((value, i) => value + x * floor.axis_x[i] + y * floor.axis_y[i]) as [number, number, number];
}

/** Rumo do mapa (0° para cima) convertido ao plano horizontal do modelo 3D. */
export function sceneHeadingDirection(floor: SceneFloor, heading: number): [number, number, number] {
  const angle = heading * Math.PI / 180;
  const x = floor.axis_x[0] * Math.sin(angle) - floor.axis_y[0] * Math.cos(angle);
  const z = floor.axis_x[2] * Math.sin(angle) - floor.axis_y[2] * Math.cos(angle);
  const length = Math.hypot(x, z) || 1;
  return [x / length, 0, z / length];
}

/** Split at every floor change, including paths which re-enter the same floor. */
export function routeSegments(nodes: NoRota[], floorId: number): NoRota[][] {
  const segments: NoRota[][] = [];
  let current: NoRota[] = [];
  for (const node of nodes) {
    if (node.piso_id === floorId) current.push(node);
    else if (current.length) { segments.push(current); current = []; }
  }
  if (current.length) segments.push(current);
  return segments;
}
