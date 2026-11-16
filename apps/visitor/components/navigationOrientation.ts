/**
 * Regras únicas de orientação dos mapas 2D e 3D.
 *
 * Convenções (iguais às de `PositionEstimate.heading`):
 * - coord_x cresce para a direita e coord_y cresce para baixo na planta;
 * - rumo (bearing) em graus: 0° = topo da planta, 90° = direita, 180° = base.
 *
 * Regras do produto:
 * - a planta/câmera só assume 0° ou 180°; nenhum ângulo intermediário;
 * - curvas laterais nunca giram o mapa; só uma inversão clara do sentido
 *   vertical do percurso à frente troca 0° ↔ 180°;
 * - a seta de navegação aponta sempre para cima na tela.
 */
import type { NoRota } from "../types";

export type MapOrientation = 0 | 180;
export type PlanPoint = { x: number; y: number };
export type OrientationPosition = PlanPoint & { floorId: number; fromNodeId?: number; toNodeId?: number; source?: string };

export const ALLOWED_ORIENTATIONS: readonly MapOrientation[] = [0, 180];
/** Trecho do percurso (em coordenadas normalizadas) usado para decidir o sentido. */
export const ORIENTATION_LOOKAHEAD = .25;
/** Componente vertical mínima para inverter uma orientação já adotada (histerese). */
export const ORIENTATION_FLIP_THRESHOLD = .5;
/** Componente vertical mínima para escolher 180° ao abrir uma rota. */
export const ORIENTATION_INITIAL_THRESHOLD = .2;

export function normalizeDegrees(degrees: number): number {
  if (!Number.isFinite(degrees)) return 0;
  const value = ((degrees % 360) + 360) % 360;
  return Object.is(value, -0) || value >= 360 ? 0 : value;
}

/** Rumo de `from` para `to` na planta (0° = para cima). */
export function bearingBetween(from: PlanPoint, to: PlanPoint): number {
  const dx = to.x - from.x, dy = to.y - from.y;
  if (Math.hypot(dx, dy) < 1e-9) return 0;
  return normalizeDegrees(Math.atan2(dx, -dy) * 180 / Math.PI);
}

export function isAllowedOrientation(value: number): value is MapOrientation {
  return value === 0 || value === 180;
}

/** Converte qualquer ângulo para a orientação permitida mais próxima (empate → 0°). */
export function snapOrientation(degrees: number): MapOrientation {
  const value = normalizeDegrees(degrees);
  return value > 90 && value < 270 ? 180 : 0;
}

/**
 * Decide a orientação a partir do vetor do percurso à frente.
 * Deslocamentos laterais (curvas) mantêm a orientação anterior.
 */
export function orientationForVector(dx: number, dy: number, previous: MapOrientation | null): MapOrientation {
  const length = Math.hypot(dx, dy);
  if (!Number.isFinite(length) || length < 1e-9) return previous ?? 0;
  const upward = -dy / length; // 1 = para cima na planta, -1 = para baixo
  if (previous === null) return upward < -ORIENTATION_INITIAL_THRESHOLD ? 180 : 0;
  if (previous === 0 && upward < -ORIENTATION_FLIP_THRESHOLD) return 180;
  if (previous === 180 && upward > ORIENTATION_FLIP_THRESHOLD) return 0;
  return previous;
}

/** Ponto a `distance` do início seguindo o percurso no mesmo piso. */
export function lookaheadPoint(points: PlanPoint[], distance = ORIENTATION_LOOKAHEAD): PlanPoint | null {
  if (points.length < 2) return null;
  let left = distance;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (length >= left && length > 0) return { x: a.x + (b.x - a.x) * left / length, y: a.y + (b.y - a.y) * left / length };
    left -= length;
  }
  return points[points.length - 1];
}

/** Percurso restante no piso atual, a partir da posição (ou do início da rota). */
export function upcomingFloorPath(routeNodes: NoRota[], floorId: number, position?: OrientationPosition | null): PlanPoint[] {
  const onFloor = position && position.floorId === floorId ? position : null;
  let start = 0;
  if (onFloor) {
    const edge = routeNodes.findIndex((node, i) => node.id === onFloor.fromNodeId && routeNodes[i + 1]?.id === onFloor.toNodeId);
    const node = edge >= 0 ? edge : routeNodes.findIndex((item) => item.id === onFloor.fromNodeId && item.piso_id === floorId);
    start = edge >= 0 ? edge + 1 : node >= 0 ? node + 1 : routeNodes.findIndex((item) => item.piso_id === floorId);
  } else {
    start = routeNodes.findIndex((item) => item.piso_id === floorId);
  }
  if (start < 0) return [];
  const path: PlanPoint[] = onFloor ? [{ x: onFloor.x, y: onFloor.y }] : [];
  for (let i = start; i < routeNodes.length && routeNodes[i].piso_id === floorId; i++) {
    path.push({ x: routeNodes[i].coord_x, y: routeNodes[i].coord_y });
  }
  return path;
}

/** Orientação 0°/180° para o percurso à frente; sem rota mantém a anterior. */
export function resolveMapOrientation(routeNodes: NoRota[], floorId: number, position: OrientationPosition | null | undefined, previous: MapOrientation | null): MapOrientation {
  const path = upcomingFloorPath(routeNodes, floorId, position);
  const ahead = lookaheadPoint(path);
  if (!ahead) return previous ?? 0;
  return orientationForVector(ahead.x - path[0].x, ahead.y - path[0].y, previous);
}

/**
 * Rotação do desenho da seta no referencial da planta para que, depois de a
 * planta girar `orientation`, a seta continue apontando para cima na tela.
 */
export function markerPlanRotation(orientation: MapOrientation): MapOrientation {
  return orientation;
}

/** Rotação final da seta na tela (desenho + planta): sempre 0°, isto é, para cima. */
export function markerScreenRotation(orientation: MapOrientation): number {
  return normalizeDegrees(markerPlanRotation(orientation) + orientation);
}

/** Rotação visual de um ponto da planta (em graus, sentido horário na tela). */
export function rotatePlanVector(x: number, y: number, degrees: MapOrientation): PlanPoint {
  return degrees === 180 ? { x: -x, y: -y } : { x, y };
}

/** Direção de curva relativa ao sentido atual, para instruções e indicadores. */
export type TurnDirection = "straight" | "left" | "right" | "back";
export function turnDirection(currentBearing: number, nextBearing: number): TurnDirection {
  const diff = normalizeDegrees(nextBearing - currentBearing);
  if (diff <= 30 || diff >= 330) return "straight";
  if (diff > 150 && diff < 210) return "back";
  return diff < 180 ? "right" : "left";
}
