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

/**
 * Calcula a direção (em graus, 0° = norte) de um ponto para outro no mapa.
 * 
 * No sistema de coordenadas do mapa, coord_x cresce para a direita e coord_y
 * cresce para baixo. Usamos Math.atan2(dx, -dy) para obter o ângulo correto:
 * 0° = norte (cima), 90° = leste (direita), 180° = sul (baixo), 270° = oeste (esquerda).
 */
export function directionFromTo(fromX: number, fromY: number, toX: number, toY: number): number {
  const dx = toX - fromX;
  const dy = toY - fromY;
  let angle = Math.atan2(dx, -dy) * 180 / Math.PI;
  angle = (angle % 360 + 360) % 360;
  return angle;
}

/**
 * Calcula a diferença angular mínima entre dois headings (em graus).
 * Retorna um valor entre -180 e 180.
 */
function angleDiff(a: number, b: number): number {
  let diff = ((a - b) % 360 + 360) % 360;
  if (diff > 180) diff -= 360;
  return diff;
}

/**
 * Calcula a rotação do mapa (0° ou 180°) com base na direção do próximo trecho
 * da rota em relação ao heading do usuário.
 * 
 * O mapa só inverte 180° quando o próximo trecho da rota está "atrás" do
 * usuário (ou seja, o usuário está caminhando na direção oposta ao trajeto).
 * Curvas à direita ou esquerda não provocam inversão - apenas o próximo
 * trecho reto determina a orientação.
 * 
 * @param heading - Rumo atual do usuário em graus (0° = norte).
 * @param nextDirection - Rumo do próximo trecho da rota em graus (0° = norte).
 * @returns 0° se o trajeto está à frente, 180° se está atrás.
 */
export function mapRotationForHeading(heading?: number, nextDirection?: number): number {
  if (heading === undefined || nextDirection === undefined) return 0;
  const h = ((heading % 360) + 360) % 360;
  const d = ((nextDirection % 360) + 360) % 360;
  // Se o próximo trecho está "atrás" do usuário (diferença > 90°), inverte o mapa
  // para que o trajeto fique à frente da seta.
  const diff = angleDiff(d, h);
  return Math.abs(diff) > 90 ? 180 : 0;
}

/** Mantém a próxima curva e a posição no campo útil, mesmo com o mapa baixo.
 * A planta só gira 180° quando o próximo trecho da rota está atrás do
 * usuário, para que o trajeto fique sempre à frente da seta. */
export function followPosition(view: MapView, position: { x: number; y: number; heading?: number }, bounds: MapBounds, nextTurn?: { x: number; y: number }): MapView {
  const turnAtOne = nextTurn ? rotate((nextTurn.x - position.x) * bounds.mapWidth,
    (nextTurn.y - position.y) * bounds.mapHeight, 0) : { x: 0, y: 0 };
  const zoom = nextTurn ? Math.max(1, Math.min(view.zoom,
    (bounds.width * .72) / Math.max(1, Math.abs(turnAtOne.x)),
    (bounds.height * .64) / Math.max(1, Math.abs(turnAtOne.y)))) : view.zoom;
  // Calcular a direção do próximo trecho da rota em relação à posição do usuário.
  let nextDirection: number | undefined;
  if (nextTurn) {
    nextDirection = directionFromTo(position.x, position.y, nextTurn.x, nextTurn.y);
  }
  const rotation = mapRotationForHeading(position.heading, nextDirection);
  const centered = centerOnPosition({ ...view, zoom, rotation }, position, bounds);
  const upcoming = { x: turnAtOne.x * zoom, y: turnAtOne.y * zoom };
  const offsetX = Math.max(-bounds.width * .12, Math.min(bounds.width * .12, -upcoming.x * .22));
  const offsetY = Math.max(-bounds.height * .12, Math.min(bounds.height * .15,
    nextTurn ? -upcoming.y * .22 : bounds.height * .1));
  return clampView({ ...centered, x: centered.x + offsetX, y: centered.y + offsetY }, bounds);
}
