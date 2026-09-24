import type { ReactNode } from "react";
import type { NoRota } from "../types";

export type SceneMapProps = {
  shoppingId?: number;
  floorId: number;
  routeNodes: NoRota[];
  originNodeId?: number;
  destinationNodeId?: number;
  onPoiPress: (id: number) => void;
  width: number;
  height: number;
  onLocate: () => void;
  locateRequest: number;
  hasOrigin: boolean;
  fallback: ReactNode;
};
