import { bearingBetween, orientationForVector, rotatePlanVector } from "./navigationOrientation.mjs";
export const INITIAL_VIEW = { zoom: 1, x: 0, y: 0, rotation: 0 };
export function rotate(x, y, degrees) {
    return rotatePlanVector(x, y, degrees);
}
export function clampView(view, bounds) {
    const zoom = Math.max(1, Math.min(8, view.zoom));
    const rotatedWidth = bounds.mapWidth * zoom;
    const rotatedHeight = bounds.mapHeight * zoom;
    const limitX = (rotatedWidth + bounds.width) / 2 - Math.min(80, bounds.mapWidth / 2);
    const limitY = (rotatedHeight + bounds.height) / 2 - Math.min(80, bounds.mapHeight / 2);
    return { zoom, x: Math.max(-limitX, Math.min(limitX, view.x)), y: Math.max(-limitY, Math.min(limitY, view.y)), rotation: view.rotation };
}
export function zoomAt(view, zoom, bounds, point = { x: bounds.width / 2, y: bounds.height / 2 }) {
    const next = Math.max(1, Math.min(8, zoom));
    const ratio = next / view.zoom;
    const x = point.x - bounds.width / 2;
    const y = point.y - bounds.height / 2;
    return clampView({ zoom: next, x: x - (x - view.x) * ratio, y: y - (y - view.y) * ratio, rotation: view.rotation }, bounds);
}
export function framePoints(points, bounds, rotation = 0) {
    if (!points.length)
        return { ...INITIAL_VIEW, rotation };
    const xs = points.map((p) => p.coord_x);
    const ys = points.map((p) => p.coord_y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const horizontalRoom = bounds.width - Math.min(100, bounds.width * .2);
    const verticalRoom = bounds.height - Math.min(100, bounds.height * .25);
    const zoom = Math.min(5, horizontalRoom / Math.max((maxX - minX) * bounds.mapWidth, 40), verticalRoom / Math.max((maxY - minY) * bounds.mapHeight, 40));
    const scale = Math.max(1, zoom);
    const offset = rotate((.5 - (minX + maxX) / 2) * bounds.mapWidth * scale, (.5 - (minY + maxY) / 2) * bounds.mapHeight * scale, rotation);
    return clampView({ zoom: scale, x: offset.x, y: offset.y, rotation }, bounds);
}
export function nearbyView(bounds, position, rotation = 0) {
    const zoom = Math.max(1, Math.min(3.5, (bounds.width - 36) / bounds.mapWidth));
    const base = { ...INITIAL_VIEW, zoom, rotation };
    if (!position)
        return base;
    const centered = centerOnPosition(base, position, bounds);
    return clampView({ ...centered, y: centered.y - bounds.height * .14 }, bounds);
}
export function centerOnPosition(view, position, bounds) {
    const displacement = rotate((position.x - .5) * bounds.mapWidth * view.zoom, (position.y - .5) * bounds.mapHeight * view.zoom, view.rotation);
    return clampView({ ...view, x: -displacement.x, y: -displacement.y }, bounds);
}
export function directionFromTo(fromX, fromY, toX, toY) {
    return bearingBetween({ x: fromX, y: fromY }, { x: toX, y: toY });
}
export function mapRotationForHeading(heading, previous = null) {
    if (heading === undefined || !Number.isFinite(heading))
        return previous ?? 0;
    const angle = heading * Math.PI / 180;
    return orientationForVector(Math.sin(angle), -Math.cos(angle), previous);
}
export function followPosition(view, position, bounds, nextTurn) {
    const rotation = view.rotation;
    const turnAtOne = nextTurn ? rotate((nextTurn.x - position.x) * bounds.mapWidth, (nextTurn.y - position.y) * bounds.mapHeight, rotation) : { x: 0, y: 0 };
    const zoom = nextTurn ? Math.max(1, Math.min(view.zoom, (bounds.width * .72) / Math.max(1, Math.abs(turnAtOne.x)), (bounds.height * .64) / Math.max(1, Math.abs(turnAtOne.y)))) : view.zoom;
    const centered = centerOnPosition({ ...view, zoom, rotation }, position, bounds);
    const upcoming = { x: turnAtOne.x * zoom, y: turnAtOne.y * zoom };
    const offsetX = Math.max(-bounds.width * .12, Math.min(bounds.width * .12, -upcoming.x * .22));
    const offsetY = Math.max(-bounds.height * .12, Math.min(bounds.height * .15, nextTurn ? -upcoming.y * .22 : bounds.height * .1));
    return clampView({ ...centered, x: centered.x + offsetX, y: centered.y + offsetY, rotation }, bounds);
}

