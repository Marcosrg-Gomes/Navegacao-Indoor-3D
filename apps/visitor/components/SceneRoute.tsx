import { useMemo } from "react";
import { Vector3 } from "three";
import type { NoRota } from "../types";
import type { SceneFloor } from "../types/scene";
import { routeSegments, sceneTransform } from "./sceneTransform";

export function SceneRoute({ nodes, floor }: { nodes: NoRota[]; floor: SceneFloor }) {
  const segments = useMemo(() => routeSegments(nodes, floor.piso_id).flatMap((part) => part.slice(1).map((node, i) => {
    const a = new Vector3(...sceneTransform(floor, part[i].coord_x, part[i].coord_y));
    const b = new Vector3(...sceneTransform(floor, node.coord_x, node.coord_y));
    a.y += .08; b.y += .08;
    return { center: a.clone().add(b).multiplyScalar(.5), length: a.distanceTo(b), angle: Math.atan2(b.x - a.x, b.z - a.z) };
  })), [nodes, floor]);
  return <group name="NAV_ROUTE">{segments.map((segment, i) => <mesh key={i} position={segment.center} rotation={[0, segment.angle, 0]} renderOrder={10}>
    <boxGeometry args={[.18, .015, segment.length]} /><meshBasicMaterial color="#2563eb" depthTest={false} />
  </mesh>)}</group>;
}
