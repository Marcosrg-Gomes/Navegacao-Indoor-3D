export type MapView = { zoom: number; x: number; y: number };
export type MapBounds = { width: number; height: number; mapWidth: number; mapHeight: number };
export const INITIAL_VIEW: MapView = { zoom: 1, x: 0, y: 0 };

export function clampView(view: MapView, bounds: MapBounds): MapView {
  const zoom = Math.max(1, Math.min(8, view.zoom));
  // Keep a useful portion of the plan in view, while allowing pan even at 1×.
  const limitX = (bounds.mapWidth * zoom + bounds.width) / 2 - Math.min(80, bounds.mapWidth / 2);
  const limitY = (bounds.mapHeight * zoom + bounds.height) / 2 - Math.min(80, bounds.mapHeight / 2);
  return { zoom, x: Math.max(-limitX, Math.min(limitX, view.x)), y: Math.max(-limitY, Math.min(limitY, view.y)) };
}

/** Keep the point beneath the cursor/fingers stationary when zooming. */
export function zoomAt(view: MapView, zoom: number, bounds: MapBounds, point = { x: bounds.width / 2, y: bounds.height / 2 }): MapView {
  const next = Math.max(1, Math.min(8, zoom));
  const ratio = next / view.zoom;
  const x = point.x - bounds.width / 2, y = point.y - bounds.height / 2;
  return clampView({ zoom: next, x: x - (x - view.x) * ratio, y: y - (y - view.y) * ratio }, bounds);
}

export function framePoints(points: { coord_x: number; coord_y: number }[], bounds: MapBounds): MapView {
  if (!points.length) return INITIAL_VIEW;
  const xs = points.map((p) => p.coord_x), ys = points.map((p) => p.coord_y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const zoom = Math.min(5, (bounds.width - 100) / Math.max((maxX - minX) * bounds.mapWidth, 40), (bounds.height - 100) / Math.max((maxY - minY) * bounds.mapHeight, 40));
  const scale = Math.max(1, zoom);
  return clampView({ zoom: scale, x: (.5 - (minX + maxX) / 2) * bounds.mapWidth * scale, y: (.5 - (minY + maxY) / 2) * bounds.mapHeight * scale }, bounds);
}
