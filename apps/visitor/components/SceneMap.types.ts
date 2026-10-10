import type { ReactNode } from "react";
import type { EtapaRota, NoRota } from "../types";
import type { PositionEstimate } from "../positioning/types";

export type SceneMapProps = {
  initialMode?: "auto" | "3d" | "2d";
  previewStep?: EtapaRota | null;
  shoppingId?: number;
  navigationRevision?: string | null;
  floorId: number;
  routeNodes: NoRota[];
  position?: PositionEstimate | null;
  following?: boolean;
  onExplore?: () => void;
  compact?: boolean;
  controlsTop?: number;
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
