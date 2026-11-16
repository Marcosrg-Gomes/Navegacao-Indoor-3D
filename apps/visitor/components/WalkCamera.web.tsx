import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import type { Scene, SceneFloor } from "@/types/scene";
import type { EtapaRota, NoRota } from "@/types";
import { sceneHeadingDirection, sceneTransform } from "./sceneTransform";
import type { MapOrientation } from "./navigationOrientation";
import type { CameraView } from "./SceneControls.web";

/**
 * Vista do trecho em perspectiva. O azimute segue a orientação 0°/180° do
 * mapa (nunca o rumo do trecho), para que a pré-visualização não gire nas curvas.
 */
export function WalkCamera({ floor, scene, step, nodes, next, orientation, onView }: { floor: SceneFloor; scene: Scene; step: EtapaRota; nodes: NoRota[]; next: boolean; orientation: MapOrientation; onView: (view: CameraView) => void }) {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    const from = nodes.find((node) => node.id === step.no_origem_id), to = nodes.find((node) => node.id === step.no_destino_id);
    if (!from || !to) return;
    const start = new Vector3(...sceneTransform(floor, from.coord_x, from.coord_y));
    const end = new Vector3(...sceneTransform(floor, to.coord_x, to.coord_y));
    const focus = next && from.piso_id === to.piso_id ? end : start;
    const forward = new Vector3(...sceneHeadingDirection(floor, orientation));
    camera.position.copy(focus).addScaledVector(forward, -9); camera.position.y = floor.origin[1] + 7;
    const target = focus.clone().addScaledVector(forward, 3); target.y = floor.origin[1];
    camera.up.set(0, 1, 0);
    camera.lookAt(target); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
    const labels: CameraView["labels"] = {};
    for (const anchor of scene.anchors.filter((item) => item.piso_id === floor.piso_id)) {
      const world = new Vector3(...sceneTransform(floor, anchor.coord_x, anchor.coord_y)); world.y += 1.5;
      if (world.clone().sub(camera.position).dot(target.clone().sub(camera.position)) <= 0) continue;
      world.project(camera); labels[anchor.node_id] = [(world.x + 1) * size.width / 2, (1 - world.y) * size.height / 2, world.z];
    }
    onView({ zoom: 2, northAngle: orientation, target: target.toArray(), position: camera.position.toArray(), labels }); invalidate();
  }, [camera, size.width, size.height, step, next, floor, scene, nodes, orientation]);
  return null;
}
