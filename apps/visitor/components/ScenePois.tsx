import { useEffect } from "react";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { Mesh, MeshStandardMaterial, Object3D } from "three";
import type { Scene, SceneFloor } from "../types/scene";
import { sceneTransform } from "./sceneTransform";

export function ScenePois({ model, scene, floor, origin, destination, onPoiPress }: {
  model: Object3D; scene: Scene; floor: SceneFloor; origin?: number; destination?: number; onPoiPress: (id: number) => void;
}) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    model.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const otherFloor = object.userData.floor_code !== floor.codigo;
      object.visible = !object.userData.cutaway && !(floor.codigo === "TERREO" && otherFloor);
      const poi = scene.pois.find((item) => object.name.startsWith(item.object_prefix));
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (!(material instanceof MeshStandardMaterial)) continue;
        if (!material.userData.original) material.userData.original = { opacity: material.opacity, transparent: material.transparent, emissive: material.emissive.clone() };
        const original = material.userData.original;
        material.opacity = otherFloor ? .12 : original.opacity;
        material.transparent = otherFloor || original.transparent;
        material.depthWrite = !otherFloor;
        material.emissive.copy(original.emissive);
        if (poi && destination !== undefined && poi.anchor_node_id === destination) { material.emissive.set("#f43f5e"); material.emissiveIntensity = .65; }
        else material.emissiveIntensity = 1;
      }
    });
    invalidate();
  }, [model, scene, floor.codigo, destination, invalidate]);
  function select(event: ThreeEvent<MouseEvent>) {
    if (event.delta > 4) return;
    // Raycasting can intersect meshes hidden for the other floor/cutaway.
    if (!event.object.visible || event.object.userData.floor_code !== floor.codigo) return;
    const poi = scene.pois.find((item) => event.object.name.startsWith(item.object_prefix));
    if (poi) { event.stopPropagation(); onPoiPress(poi.loja_id); }
  }
  return <group>
    <primitive object={model} onClick={select} />
    {scene.anchors.filter((a) => a.piso_id === floor.piso_id && (a.node_id === origin || a.node_id === destination || a.type === "elevador" || a.type === "escada_rolante")).map((anchor) => {
      const position = sceneTransform(floor, anchor.coord_x, anchor.coord_y); position[1] += .3;
      return <mesh key={anchor.node_id} position={position} renderOrder={11} name={anchor.codigo}>
        {anchor.type === "elevador" ? <boxGeometry args={[.5, .45, .5]} /> : <sphereGeometry args={[.25, 12, 8]} />}
        <meshBasicMaterial depthTest={false} color={anchor.node_id === origin ? "#16a34a" : anchor.node_id === destination ? "#e11d48" : "#7c3aed"} />
      </mesh>;
    })}
  </group>;
}
