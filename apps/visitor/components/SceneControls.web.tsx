import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Box3, OrthographicCamera, TOUCH, Vector3 } from "three";
import { MapControls } from "three/examples/jsm/controls/MapControls.js";
import type { SceneMapProps } from "./SceneMap.types";
import type { Scene, SceneFloor } from "../types/scene";
import { sceneHeadingDirection, sceneTransform } from "./sceneTransform";

export type CameraCommand = { id: number; action: "in" | "out" | "reset" | "route" | "top" | "angle" | "left" | "right" | "north" };
export type CameraView = { zoom: number; northAngle: number; target: number[]; position: number[]; labels: Record<number, [number, number, number]> };

export function SceneControls({ floor, scene, props, command, onView }: {
  floor: SceneFloor; scene: Scene; props: SceneMapProps; command: CameraCommand | null; onView: (view: CameraView) => void;
}) {
  const { camera, gl, size, invalidate } = useThree();
  const controls = useRef<MapControls | null>(null);
  const baseZoom = useRef(1);
  const lastFloor = useRef<number>();
  const lastLocate = useRef(0);
  const latest = useRef({ floor, scene, props, onView, size }); latest.current = { floor, scene, props, onView, size };
  const report = () => {
    const control = controls.current;
    if (!control || !(camera instanceof OrthographicCamera)) return;
    camera.updateMatrixWorld();
    const center = control.target.clone().project(camera);
    const north = control.target.clone().add(new Vector3(0, 0, -1)).project(camera).sub(center);
    const labels: CameraView["labels"] = {};
    for (const anchor of latest.current.scene.anchors.filter((a) => a.piso_id === latest.current.floor.piso_id)) {
      const point = new Vector3(...sceneTransform(latest.current.floor, anchor.coord_x, anchor.coord_y));
      point.y += .5; point.project(camera);
      labels[anchor.node_id] = [(point.x + 1) * latest.current.size.width / 2, (1 - point.y) * latest.current.size.height / 2, point.z];
    }
    latest.current.onView({ zoom: camera.zoom / baseZoom.current, northAngle: Math.atan2(north.x * latest.current.size.width, north.y * latest.current.size.height) * 180 / Math.PI,
      target: control.target.toArray(), position: camera.position.toArray(), labels });
    invalidate();
  };
  function corners() {
    return [[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => new Vector3(...sceneTransform(latest.current.floor, x, y)));
  }
  function fitZoom(points: Vector3[]) {
    camera.updateMatrixWorld();
    const extent = new Box3().setFromPoints(points.map((p) => p.clone().applyMatrix4(camera.matrixWorldInverse))).getSize(new Vector3());
    return Math.min(latest.current.size.width / (extent.x + 8), latest.current.size.height / (extent.y + 8));
  }
  function centerOn(points: Vector3[], zoom?: number) {
    const control = controls.current;
    if (!control || !(camera instanceof OrthographicCamera)) return;
    const center = new Box3().setFromPoints(points).getCenter(new Vector3());
    camera.position.add(center.clone().sub(control.target));
    control.target.copy(center);
    camera.zoom = Math.max(control.minZoom, Math.min(control.maxZoom, zoom ?? fitZoom(points)));
    camera.updateProjectionMatrix(); control.update(); report();
  }
  function followRouteOverview(x: number, y: number, heading: number) {
    const control = controls.current;
    if (!control || !(camera instanceof OrthographicCamera)) return;
    const direction = new Vector3(...sceneHeadingDirection(floor, heading));
    const position = new Vector3(...sceneTransform(floor, x, y));
    const route = latest.current.props.routeNodes;
    const nextIndex = route.findIndex((node) => node.id === latest.current.props.position?.toNodeId && node.piso_id === floor.piso_id);
    const upcoming = route[nextIndex + 1]?.piso_id === floor.piso_id ? route[nextIndex + 1] : route[nextIndex];
    const target = position.clone().addScaledVector(direction, 3);
    if (upcoming) {
      const towardTurn = new Vector3(...sceneTransform(floor, upcoming.coord_x, upcoming.coord_y)).sub(position);
      target.add(towardTurn.clampLength(0, 10).multiplyScalar(.45));
    }
    control.target.copy(target); control.cursor.copy(target);
    camera.up.set(0, 1, 0);
    // A câmera acompanha por trás do deslocamento: o próximo trecho aparece
    // acima da seta, independentemente do lado do shopping para onde se anda.
    camera.position.copy(target).addScaledVector(direction, -42).add(new Vector3(0, 64, 0));
    camera.lookAt(target); control.update(); report();
  }
  useEffect(() => {
    if (!(camera instanceof OrthographicCamera)) return;
    const control = new MapControls(camera, gl.domElement);
    controls.current = control;
    control.enableDamping = false;
    control.screenSpacePanning = false;
    control.zoomToCursor = true;
    control.maxPolarAngle = Math.PI / 2.4;
    control.touches.TWO = TOUCH.DOLLY_PAN;
    control.addEventListener("change", report);
    control.addEventListener("start", () => latest.current.props.onExplore?.());
    const canvas = gl.domElement;
    canvas.tabIndex = 0;
    canvas.setAttribute("aria-label", "Explorar mapa 3D: arraste para mover, use a roda para aproximar");
    const focus = () => canvas.focus({ preventScroll: true });
    canvas.addEventListener("pointerdown", focus);
    control.listenToKeyEvents(canvas);
    return () => { canvas.removeEventListener("pointerdown", focus); control.removeEventListener("change", report); control.dispose(); controls.current = null; };
  }, [camera, gl]);
  useEffect(() => {
    const control = controls.current;
    if (!control || !(camera instanceof OrthographicCamera) || !size.width || !size.height) return;
    const newFloor = lastFloor.current !== floor.piso_id;
    const ratio = newFloor ? 1 : camera.zoom / baseZoom.current;
    if (newFloor) {
      const current = props.position?.floorId === floor.piso_id ? { x: props.position.x, y: props.position.y }
        : props.routeNodes.find((node) => node.piso_id === floor.piso_id);
      const entry = scene.anchors.find((anchor) => anchor.piso_id === floor.piso_id && anchor.type === "entrada");
      const center = new Vector3(...sceneTransform(floor,
        current ? "coord_x" in current ? current.coord_x : current.x : entry?.coord_x ?? .5,
        current ? "coord_y" in current ? current.coord_y : current.y : entry?.coord_y ?? .5));
      control.target.copy(center); control.cursor.copy(center);
      camera.position.copy(center).add(new Vector3(0, 60, -45));
      camera.lookAt(center); control.update();
      lastFloor.current = floor.piso_id;
    }
    baseZoom.current = fitZoom(corners());
    control.minZoom = baseZoom.current * .75; control.maxZoom = baseZoom.current * 8;
    control.maxTargetRadius = Math.max(floor.axis_x[0], -floor.axis_y[2]);
    camera.zoom = Math.max(control.minZoom, Math.min(control.maxZoom, baseZoom.current * (newFloor && props.compact ? 1.75 : ratio)));
    camera.updateProjectionMatrix(); control.update(); report();
  }, [floor.piso_id, size.width, size.height]);
  useEffect(() => {
    if (!props.locateRequest || lastLocate.current === props.locateRequest) return;
    const position = props.position?.floorId === floor.piso_id ? props.position :
      scene.anchors.find((a) => a.node_id === props.originNodeId && a.piso_id === floor.piso_id);
    if (!position) return;
    const x = "coord_x" in position ? position.coord_x : position.x;
    const y = "coord_y" in position ? position.coord_y : position.y;
    const zoom = props.position?.source === "simulation" && camera instanceof OrthographicCamera
      ? camera.zoom : baseZoom.current * 3;
    if (props.position?.source === "simulation" && props.position.heading !== undefined) followRouteOverview(x, y, props.position.heading);
    else centerOn([new Vector3(...sceneTransform(floor, x, y))], zoom);
    lastLocate.current = props.locateRequest;
  }, [props.locateRequest, floor.piso_id, props.originNodeId]);
  useEffect(() => {
    if (props.following && props.position?.floorId === floor.piso_id && camera instanceof OrthographicCamera) {
      if (props.position.heading !== undefined) followRouteOverview(props.position.x, props.position.y, props.position.heading);
      else centerOn([new Vector3(...sceneTransform(floor, props.position.x, props.position.y))], camera.zoom);
    }
  }, [props.following, props.position?.floorId, props.position?.x, props.position?.y, props.position?.heading, floor.piso_id]);
  useEffect(() => {
    const control = controls.current;
    if (!command || !control || !(camera instanceof OrthographicCamera)) return;
    const action = command.action;
    if (action === "in" || action === "out") {
      camera.zoom = Math.max(control.minZoom, Math.min(control.maxZoom, camera.zoom * (action === "in" ? 1.5 : 1 / 1.5)));
    } else if (action === "reset") {
      camera.position.copy(control.target).add(new Vector3(0, 60, -45)); camera.lookAt(control.target); control.update();
      baseZoom.current = fitZoom(corners()); control.minZoom = baseZoom.current * .75; control.maxZoom = baseZoom.current * 8;
      centerOn(corners(), baseZoom.current);
    } else if (action === "route") {
      const route = latest.current.props.routeNodes.filter((n) => n.piso_id === floor.piso_id);
      centerOn(route.length ? route.map((n) => new Vector3(...sceneTransform(floor, n.coord_x, n.coord_y))) : corners());
    } else {
      const offset = camera.position.clone().sub(control.target);
      if (action === "top") offset.set(0, offset.length(), -.001);
      if (action === "angle" || action === "north") offset.copy(new Vector3(0, 60, -45).normalize().multiplyScalar(offset.length()));
      if (action === "left" || action === "right") offset.applyAxisAngle(new Vector3(0, 1, 0), (action === "left" ? -1 : 1) * Math.PI / 4);
      camera.position.copy(control.target).add(offset); camera.lookAt(control.target);
    }
    camera.updateProjectionMatrix(); control.update(); report();
  }, [command]);
  return null;
}
