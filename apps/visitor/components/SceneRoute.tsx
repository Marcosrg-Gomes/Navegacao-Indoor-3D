import { useMemo } from "react";
import { Vector3 } from "three";
import type { NoRota } from "../types";
import type { SceneFloor } from "../types/scene";
import type { PositionEstimate } from "../positioning/types";
import { sceneTransform } from "./sceneTransform";
import { remainingRouteEdges } from "./remainingRoute";

export function SceneRoute({ nodes, floor, position }: { nodes: NoRota[]; floor: SceneFloor; position?: PositionEstimate | null }) {
  const segments = useMemo(() => remainingRouteEdges(nodes, position).filter((edge) => edge.floorId === floor.piso_id).map((edge) => {
    const a = new Vector3(...sceneTransform(floor, edge.from.coord_x, edge.from.coord_y));
    const b = new Vector3(...sceneTransform(floor, edge.to.coord_x, edge.to.coord_y));
    a.y += .08; b.y += .08;
    return { center: a.clone().add(b).multiplyScalar(.5), length: a.distanceTo(b), angle: Math.atan2(b.x - a.x, b.z - a.z) };
  }), [nodes, floor, position?.source, position?.fromNodeId, position?.toNodeId, position?.x, position?.y, position?.floorId]);
  return <group name="NAV_ROUTE">{segments.map((segment, i) => <mesh key={i} position={segment.center} rotation={[0, segment.angle, 0]} renderOrder={10}>
    <boxGeometry args={[.18, .015, segment.length]} /><meshBasicMaterial color="#6842d8" depthTest={false} />
  </mesh>)}</group>;
}
