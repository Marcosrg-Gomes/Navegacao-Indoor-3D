import type { SceneFloor } from "../types/scene";
import type { NoRota } from "../types";

/**
 * Espelho de apresentação em X.
 *
 * O catálogo do Blender leva coord_y a -Z (norte do Blender), enquanto a planta
 * 2D e as instruções da API tratam coord_y crescendo para baixo. Visto de cima,
 * isso inverte esquerda/direita entre o 3D e o 2D ("vire à esquerda" aparecia
 * como curva à direita). Refletir X na apresentação (modelo, rota, marcadores e
 * câmera) torna o 3D congruente com a planta e com a API, sem alterar o catálogo
 * nem o GLB publicados. O three.js corrige a ordem dos vértices de objetos com
 * escala negativa, então a malha continua renderizada corretamente.
 */
export const SCENE_MIRROR: [number, number, number] = [-1, 1, 1];

/** API → cena: (origin + coord_x * axis_x + coord_y * axis_y), refletido por SCENE_MIRROR. */
export function sceneTransform(floor: SceneFloor, x: number, y: number): [number, number, number] {
  return floor.origin.map((value, i) => (value + x * floor.axis_x[i] + y * floor.axis_y[i]) * SCENE_MIRROR[i]) as [number, number, number];
}

/** Rumo do mapa (0° para cima) convertido ao plano horizontal da cena. */
export function sceneHeadingDirection(floor: SceneFloor, heading: number): [number, number, number] {
  const angle = heading * Math.PI / 180;
  const x = (floor.axis_x[0] * Math.sin(angle) - floor.axis_y[0] * Math.cos(angle)) * SCENE_MIRROR[0];
  const z = (floor.axis_x[2] * Math.sin(angle) - floor.axis_y[2] * Math.cos(angle)) * SCENE_MIRROR[2];
  const length = Math.hypot(x, z) || 1;
  return [x / length, 0, z / length];
}

/**
 * Rotação em Y que faz a seta (desenhada no plano XY apontando para +Y e
 * deitada com rotation.x = -90°, isto é, apontando para -Z) apontar para `direction`.
 * Uma rotação θ em Y leva (0, 0, -1) a (-sin θ, 0, -cos θ).
 */
export function sceneYawForDirection(direction: [number, number, number]): number {
  return Math.atan2(-direction[0], -direction[2]);
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
