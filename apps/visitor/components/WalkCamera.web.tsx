import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import type { Scene, SceneFloor } from "@/types/scene";
import type { EtapaRota, NoRota } from "@/types";
import { sceneTransform } from "./sceneTransform";
import type { CameraView } from "./SceneControls.web";

export function WalkCamera({ floor, scene, step, nodes, next, onView }: { floor: SceneFloor; scene: Scene; step: EtapaRota; nodes: NoRota[]; next: boolean; onView: (view: CameraView) => void }) {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    const from = nodes.find((node) => node.id === step.no_origem_id), to = nodes.find((node) => node.id === step.no_destino_id);
    if (!from || !to) return;
    const start = new Vector3(...sceneTransform(floor, from.coord_x, from.coord_y));
    const end = new Vector3(...sceneTransform(floor, to.coord_x, to.coord_y));
    const direction = end.clone().sub(start); direction.y = 0;
    if (direction.lengthSq() < .01) {
      const index = nodes.findIndex((node) => node.id === from.id), previous = nodes[index - 1];
      if (previous?.piso_id === from.piso_id) direction.copy(start).sub(new Vector3(...sceneTransform(floor, previous.coord_x, previous.coord_y)));
      if (direction.lengthSq() < .01) direction.set(0, 0, -1);
    }
    direction.normalize();
    camera.position.copy(next && from.piso_id === to.piso_id ? end : start); camera.position.y = floor.origin[1] + 1.65;
    const target = camera.position.clone().add(direction.multiplyScalar(4));
    camera.lookAt(target); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
    const labels: CameraView["labels"] = {};
    for (const anchor of scene.anchors.filter((item) => item.piso_id === floor.piso_id)) {
      const world = new Vector3(...sceneTransform(floor, anchor.coord_x, anchor.coord_y)); world.y += 1.5;
      if (world.clone().sub(camera.position).dot(target.clone().sub(camera.position)) <= 0) continue;
      world.project(camera); labels[anchor.node_id] = [(world.x + 1) * size.width / 2, (1 - world.y) * size.height / 2, world.z];
    }
    onView({ zoom: 2, northAngle: 0, target: target.toArray(), position: camera.position.toArray(), labels }); invalidate();
  }, [camera, size.width, size.height, step, next, floor, scene, nodes]);
  return null;
}
