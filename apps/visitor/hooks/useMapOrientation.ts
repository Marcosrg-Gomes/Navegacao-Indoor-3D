import { useMemo, useRef } from "react";
import type { NoRota } from "../types";
import { resolveMapOrientation, type MapOrientation, type OrientationPosition } from "../components/navigationOrientation";

/**
 * Orientação compartilhada pelos mapas 2D e 3D. Guarda a última decisão para
 * aplicar histerese: curvas laterais não alternam 0°/180°.
 */
export function useMapOrientation(routeNodes: NoRota[], floorId: number, position?: OrientationPosition | null): MapOrientation {
  const memory = useRef<{ key: string; value: MapOrientation | null }>({ key: "", value: null });
  const key = `${floorId}:${routeNodes.map((node) => node.id).join(",")}`;
  if (memory.current.key !== key) memory.current = { key, value: null };
  const onFloor = position?.floorId === floorId ? position : null;
  return useMemo(() => {
    const value = resolveMapOrientation(routeNodes, floorId, onFloor, memory.current.value);
    memory.current.value = routeNodes.length ? value : null;
    return value;
  }, [key, onFloor?.x, onFloor?.y, onFloor?.fromNodeId, onFloor?.toNodeId]);
}
