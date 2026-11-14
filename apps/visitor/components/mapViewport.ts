import { bearingBetween, orientationForVector, rotatePlanVector, type MapOrientation } from "./navigationOrientation";

/** `rotation` só assume 0° ou 180° (ver navigationOrientation.ts). */
export type MapView = { zoom: number; x: number; y: number; rotation: MapOrientation };
export type MapBounds = { width: number; height: number; mapWidth: number; mapHeight: number };
export const INITIAL_VIEW: MapView = { zoom: 1, x: 0, y: 0, rotation: 0 };

/** Rotação de tela permitida (0°/180°), sem resíduo de ponto flutuante. */
function rotate(x: number, y: number, degrees: MapOrientation) {
  return rotatePlanVector(x, y, degrees);
}

export function clampView(view: MapView, bounds: MapBounds): MapView {
  const zoom = Math.max(1, Math.min(8, view.zoom));
  // Keep a useful portion of the plan in view, while allowing pan even at 1×.
  // 0° e 180° preservam largura e altura da planta.
  const rotatedWidth = bounds.mapWidth * zoom;
  const rotatedHeight = bounds.mapHeight * zoom;
  const limitX = (rotatedWidth + bounds.width) / 2 - Math.min(80, bounds.mapWidth / 2);
  const limitY = (rotatedHeight + bounds.height) / 2 - Math.min(80, bounds.mapHeight / 2);
  return { zoom, x: Math.max(-limitX, Math.min(limitX, view.x)), y: Math.max(-limitY, Math.min(limitY, view.y)), rotation: view.rotation };
}

/** Keep the point beneath the cursor/fingers stationary when zooming. */
export function zoomAt(view: MapView, zoom: number, bounds: MapBounds, point = { x: bounds.width / 2, y: bounds.height / 2 }): MapView {
  const next = Math.max(1, Math.min(8, zoom));
  const ratio = next / view.zoom;
  const x = point.x - bounds.width / 2, y = point.y - bounds.height / 2;
  return clampView({ zoom: next, x: x - (x - view.x) * ratio, y: y - (y - view.y) * ratio, rotation: view.rotation }, bounds);
}

export function framePoints(points: { coord_x: number; coord_y: number }[], bounds: MapBounds, rotation: MapOrientation = 0): MapView {
  if (!points.length) return { ...INITIAL_VIEW, rotation };
  const xs = points.map((p) => p.coord_x), ys = points.map((p) => p.coord_y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const horizontalRoom = bounds.width - Math.min(100, bounds.width * .2);
  const verticalRoom = bounds.height - Math.min(100, bounds.height * .25);
  const zoom = Math.min(5, horizontalRoom / Math.max((maxX - minX) * bounds.mapWidth, 40), verticalRoom / Math.max((maxY - minY) * bounds.mapHeight, 40));
  const scale = Math.max(1, zoom);
  const offset = rotate((.5 - (minX + maxX) / 2) * bounds.mapWidth * scale, (.5 - (minY + maxY) / 2) * bounds.mapHeight * scale, rotation);
  return clampView({ zoom: scale, x: offset.x, y: offset.y, rotation }, bounds);
}

/** Abre o corredor em tamanho legível sem perder a opção de ver o piso inteiro. */
export function nearbyView(bounds: MapBounds, position?: { x: number; y: number }, rotation: MapOrientation = 0): MapView {
  const zoom = Math.max(1, Math.min(3.5, (bounds.width - 36) / bounds.mapWidth));
  const base = { ...INITIAL_VIEW, zoom, rotation };
  if (!position) return base;
  const centered = centerOnPosition(base, position, bounds);
  return clampView({ ...centered, y: centered.y - bounds.height * .14 }, bounds);
}

/** Centraliza sem alterar o zoom escolhido pela pessoa. */
export function centerOnPosition(view: MapView, position: { x: number; y: number }, bounds: MapBounds): MapView {
  const displacement = rotate((position.x - .5) * bounds.mapWidth * view.zoom,
    (position.y - .5) * bounds.mapHeight * view.zoom, view.rotation);
  return clampView({ ...view, x: -displacement.x, y: -displacement.y }, bounds);
}

/** Rumo de um ponto a outro (0° = topo da planta). Ver `bearingBetween`. */
export function directionFromTo(fromX: number, fromY: number, toX: number, toY: number): number {
  return bearingBetween({ x: fromX, y: fromY }, { x: toX, y: toY });
}

/**
 * Orientação da planta para um rumo: somente 0° ou 180°. Rumos laterais
 * (curvas) mantêm `previous`; nunca há rotação intermediária.
 */
export function mapRotationForHeading(heading?: number, previous: MapOrientation | null = null): MapOrientation {
  if (heading === undefined || !Number.isFinite(heading)) return previous ?? 0;
  const angle = heading * Math.PI / 180;
  return orientationForVector(Math.sin(angle), -Math.cos(angle), previous);
}

/** Mantém a próxima curva e a posição no campo útil, mesmo com o mapa baixo.
 * Preserva a orientação 0°/180° da vista; nunca gira para acompanhar curvas.
 * A posição fica abaixo do centro para mostrar mais percurso à frente (acima). */
export function followPosition(view: MapView, position: { x: number; y: number; heading?: number }, bounds: MapBounds, nextTurn?: { x: number; y: number }): MapView {
  const rotation = view.rotation;
  const turnAtOne = nextTurn ? rotate((nextTurn.x - position.x) * bounds.mapWidth,
    (nextTurn.y - position.y) * bounds.mapHeight, rotation) : { x: 0, y: 0 };
  const zoom = nextTurn ? Math.max(1, Math.min(view.zoom,
    (bounds.width * .72) / Math.max(1, Math.abs(turnAtOne.x)),
    (bounds.height * .64) / Math.max(1, Math.abs(turnAtOne.y)))) : view.zoom;
  const centered = centerOnPosition({ ...view, zoom, rotation }, position, bounds);
  const upcoming = { x: turnAtOne.x * zoom, y: turnAtOne.y * zoom };
  const offsetX = Math.max(-bounds.width * .12, Math.min(bounds.width * .12, -upcoming.x * .22));
  const offsetY = Math.max(-bounds.height * .12, Math.min(bounds.height * .15,
    nextTurn ? -upcoming.y * .22 : bounds.height * .1));
  return clampView({ ...centered, x: centered.x + offsetX, y: centered.y + offsetY, rotation }, bounds);
}
