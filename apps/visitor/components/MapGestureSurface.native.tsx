import { useRef, useState } from "react";
import { PanResponder, View } from "react-native";
import type { GestureResponderEvent } from "react-native";
import type { MapGestureProps } from "./MapGestureSurface.types";
import { clampView, zoomAt } from "./mapViewport";

export function MapGestureSurface(props: MapGestureProps) {
  const live = useRef(props); live.current = props;
  const surface = useRef<View>(null);
  const offset = useRef({ x: 0, y: 0 });
  const start = useRef<{ x: number; y: number; distance: number; count: number; view: typeof props.view } | null>(null);
  const metrics = (event: GestureResponderEvent) => {
    const touches = event.nativeEvent.touches;
    return { count: touches.length, x: touches.reduce((v, t) => v + t.pageX, 0) / touches.length - offset.current.x,
      y: touches.reduce((v, t) => v + t.pageY, 0) / touches.length - offset.current.y,
      distance: touches.length > 1 ? Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY) : 0 };
  };
  const [responder] = useState(() => PanResponder.create({
    onMoveShouldSetPanResponder: (event, g) => event.nativeEvent.touches.length > 1 || Math.abs(g.dx) + Math.abs(g.dy) > 4,
    onMoveShouldSetPanResponderCapture: (event, g) => event.nativeEvent.touches.length > 1 || Math.abs(g.dx) + Math.abs(g.dy) > 4,
    onPanResponderGrant: (event) => { start.current = { ...metrics(event), view: live.current.view }; },
    onPanResponderMove: (event) => {
      const current = metrics(event);
      if (!start.current || current.count !== start.current.count) { start.current = { ...current, view: live.current.view }; return; }
      const from = start.current, { bounds, onChange, onDrag } = live.current;
      const view = current.distance && from.distance ? zoomAt(from.view, from.view.zoom * current.distance / from.distance, bounds, from) : from.view;
      onDrag();
      onChange(clampView({ ...view, x: view.x + current.x - from.x, y: view.y + current.y - from.y }, bounds));
    },
    onPanResponderTerminationRequest: () => false,
    onPanResponderRelease: () => { start.current = null; },
    onPanResponderTerminate: () => { start.current = null; },
  }));
  return <View ref={surface} testID="map-2d-viewport" style={{ width: props.bounds.width, height: props.bounds.height, overflow: "hidden" }}
    onTouchStart={() => surface.current?.measureInWindow((x, y) => { offset.current = { x, y }; })} {...responder.panHandlers}>{props.children}</View>;
}
