import { useEffect, useRef } from "react";
import type { PointerEvent } from "react";
import type { MapGestureProps } from "./MapGestureSurface.types";
import { clampView, zoomAt } from "./mapViewport";

export function MapGestureSurface(props: MapGestureProps) {
  const element = useRef<HTMLDivElement>(null);
  const live = useRef(props); live.current = props;
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ x: number; y: number; distance: number; view: typeof props.view } | null>(null);
  const metrics = () => {
    const points = [...pointers.current.values()];
    return { x: points.reduce((n, p) => n + p.x, 0) / points.length, y: points.reduce((n, p) => n + p.y, 0) / points.length,
      distance: points.length > 1 ? Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) : 0 };
  };
  function point(event: PointerEvent) {
    const rect = element.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }
  function end(event: PointerEvent) {
    pointers.current.delete(event.pointerId);
    gesture.current = pointers.current.size ? { ...metrics(), view: live.current.view } : null;
  }
  useEffect(() => {
    const surface = element.current!;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const { view, bounds, onChange } = live.current;
      const rect = surface.getBoundingClientRect();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? bounds.height : 1);
      onChange(zoomAt(view, view.zoom * Math.exp(-delta * .002), bounds, { x: event.clientX - rect.left, y: event.clientY - rect.top }));
    };
    surface.addEventListener("wheel", wheel, { passive: false });
    return () => surface.removeEventListener("wheel", wheel);
  }, []);
  return <div ref={element} tabIndex={0} aria-label="Explorar mapa 2D: arraste para mover, use a roda ou os botões para aproximar"
    data-testid="map-2d-viewport" data-zoom={props.view.zoom.toFixed(3)} data-pan-x={props.view.x.toFixed(2)} data-pan-y={props.view.y.toFixed(2)}
    style={{ width: props.bounds.width, height: props.bounds.height, overflow: "hidden", position: "relative", touchAction: "none", cursor: pointers.current.size ? "grabbing" : "grab", outlineOffset: -3 }}
    onPointerDown={(event) => {
      if (event.button !== 0) return;
      event.currentTarget.focus({ preventScroll: true });
      pointers.current.set(event.pointerId, point(event));
      gesture.current = { ...metrics(), view: live.current.view };
    }}
    onPointerMove={(event) => {
      if (!pointers.current.has(event.pointerId) || !gesture.current) return;
      pointers.current.set(event.pointerId, point(event));
      const start = gesture.current, current = metrics();
      const dx = current.x - start.x, dy = current.y - start.y;
      if (Math.abs(dx) + Math.abs(dy) < 4 && !current.distance) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      live.current.onDrag();
      const view = start.distance && current.distance ? zoomAt(start.view, start.view.zoom * current.distance / start.distance, live.current.bounds, start) : start.view;
      live.current.onChange(clampView({ ...view, x: view.x + dx, y: view.y + dy }, live.current.bounds));
    }}
    onPointerUp={end} onPointerCancel={end}
    onLostPointerCapture={(event) => {
      // Touch starts with implicit capture on the SVG child. Transferring it to
      // this surface must not terminate the drag when the child's loss bubbles.
      if (event.target === event.currentTarget) end(event);
    }}
    onDoubleClick={(event) => { props.onChange(zoomAt(props.view, props.view.zoom * 1.5, props.bounds, point(event as unknown as PointerEvent))); }}
    onKeyDown={(event) => {
      const moves: Record<string, [number, number]> = { ArrowLeft: [60, 0], ArrowRight: [-60, 0], ArrowUp: [0, 60], ArrowDown: [0, -60] };
      const move = moves[event.key];
      if (move) { event.preventDefault(); props.onChange(clampView({ ...props.view, x: props.view.x + move[0], y: props.view.y + move[1] }, props.bounds)); }
      if (["+", "=", "-"].includes(event.key)) { event.preventDefault(); props.onChange(zoomAt(props.view, props.view.zoom * (event.key === "-" ? 1 / 1.5 : 1.5), props.bounds)); }
    }}>{props.children}</div>;
}
