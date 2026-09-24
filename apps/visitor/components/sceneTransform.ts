import type { SceneFloor } from "../types/scene";
import type { NoRota } from "../types";

/** API → glTF: origin + coord_x * axis_x + coord_y * axis_y. */
export function sceneTransform(floor: SceneFloor, x: number, y: number): [number, number, number] {
  return floor.origin.map((value, i) => value + x * floor.axis_x[i] + y * floor.axis_y[i]) as [number, number, number];
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
