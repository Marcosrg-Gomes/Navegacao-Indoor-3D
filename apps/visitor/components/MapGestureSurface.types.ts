import type { ReactNode } from "react";
import type { MapBounds, MapView } from "./mapViewport";

export type MapGestureProps = {
  bounds: MapBounds; view: MapView; children: ReactNode;
  onChange: (view: MapView) => void;
  onDrag: () => void;
};
