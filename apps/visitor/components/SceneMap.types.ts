import type { ReactNode } from "react";
import type { EtapaRota, NoRota } from "../types";

export type SceneMapProps = {
  initialMode?: "auto" | "3d" | "2d";
  previewStep?: EtapaRota | null;
  shoppingId?: number;
  navigationRevision?: string | null;
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
