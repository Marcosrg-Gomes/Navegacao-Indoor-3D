export type MapView = { zoom: number; x: number; y: number; rotation: number };
export type MapBounds = { width: number; height: number; mapWidth: number; mapHeight: number };
export const INITIAL_VIEW: MapView = { zoom: 1, x: 0, y: 0, rotation: 0 };

function rotate(x: number, y: number, degrees: number) {
  const angle = degrees * Math.PI / 180;
  return { x: x * Math.cos(angle) - y * Math.sin(angle), y: x * Math.sin(angle) + y * Math.cos(angle) };
}

export function clampView(view: MapView, bounds: MapBounds): MapView {
  const zoom = Math.max(1, Math.min(8, view.zoom));
  // Keep a useful portion of the plan in view, while allowing pan even at 1×.
  const angle = view.rotation * Math.PI / 180;
  const rotatedWidth = (Math.abs(Math.cos(angle)) * bounds.mapWidth + Math.abs(Math.sin(angle)) * bounds.mapHeight) * zoom;
  const rotatedHeight = (Math.abs(Math.sin(angle)) * bounds.mapWidth + Math.abs(Math.cos(angle)) * bounds.mapHeight) * zoom;
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

export function framePoints(points: { coord_x: number; coord_y: number }[], bounds: MapBounds): MapView {
  if (!points.length) return INITIAL_VIEW;
  const xs = points.map((p) => p.coord_x), ys = points.map((p) => p.coord_y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const horizontalRoom = bounds.width - Math.min(100, bounds.width * .2);
  const verticalRoom = bounds.height - Math.min(100, bounds.height * .25);
  const zoom = Math.min(5, horizontalRoom / Math.max((maxX - minX) * bounds.mapWidth, 40), verticalRoom / Math.max((maxY - minY) * bounds.mapHeight, 40));
  const scale = Math.max(1, zoom);
  return clampView({ zoom: scale, x: (.5 - (minX + maxX) / 2) * bounds.mapWidth * scale, y: (.5 - (minY + maxY) / 2) * bounds.mapHeight * scale, rotation: 0 }, bounds);
}

/** Abre o corredor em tamanho legível sem perder a opção de ver o piso inteiro. */
export function nearbyView(bounds: MapBounds, position?: { x: number; y: number }): MapView {
  const zoom = Math.max(1, Math.min(3.5, (bounds.width - 36) / bounds.mapWidth));
  const base = { ...INITIAL_VIEW, zoom };
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

/** Mantém a próxima curva e a posição no campo útil, mesmo com o mapa baixo. */
export function followPosition(view: MapView, position: { x: number; y: number; heading?: number }, bounds: MapBounds, nextTurn?: { x: number; y: number }): MapView {
  // A planta é comprida. Virá-la 90° em uma área baixa deixa o shopping de lado;
  // nesse caso o norte permanece em cima e a seta indica o rumo.
  const roomForHeadingUp = bounds.height >= bounds.width * .82;
  const rotation = roomForHeadingUp && position.heading !== undefined && Number.isFinite(position.heading)
    ? -position.heading : 0;
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
  return clampView({ ...centered, x: centered.x + offsetX, y: centered.y + offsetY }, bounds);
}
