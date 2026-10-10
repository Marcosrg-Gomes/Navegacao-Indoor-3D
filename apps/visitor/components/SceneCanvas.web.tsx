import { useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Material, Mesh, Object3D, Shape } from "three";
import { Text, TouchableOpacity, View } from "react-native";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { getAssetUrl } from "../services/api";
import type { Scene } from "../types/scene";
import type { SceneMapProps } from "./SceneMap.types";
import { SceneRoute } from "./SceneRoute";
import { ScenePois } from "./ScenePois";
import { SceneControls, type CameraCommand, type CameraView } from "./SceneControls.web";
import { SceneLabels } from "./SceneLabels.web";
import { MapLegend, MapToolbar } from "./MapToolbar";
import { WalkCamera } from "./WalkCamera.web";
import { sceneHeadingDirection, sceneTransform } from "./sceneTransform";

type Props = SceneMapProps & { scene: Scene; onReady: () => void; onProgress: (value: number) => void; onError: (message: string) => void };

const navigationArrow = new Shape();
navigationArrow.moveTo(0, 1.05);
navigationArrow.lineTo(.62, -.62);
navigationArrow.lineTo(0, -.3);
navigationArrow.lineTo(-.62, -.62);
navigationArrow.closePath();

function dispose(model: Object3D) {
  model.traverse((object) => { if (object instanceof Mesh) { object.geometry.dispose(); (Array.isArray(object.material) ? object.material : [object.material]).forEach((m: Material) => m.dispose()); } });
}

function Viewport({ model, props, command, onView, previewNext }: { model: Object3D; props: Props; command: CameraCommand | null; onView: (view: CameraView) => void; previewNext: boolean }) {
  const { gl, invalidate } = useThree();
  const floor = props.scene.floors.find((item) => item.piso_id === props.floorId);
  const callbacks = useRef(props); callbacks.current = props;
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); callbacks.current.onError("A conexão com a GPU foi perdida."); };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, [gl]);
  useEffect(() => { if (floor) callbacks.current.onReady(); else callbacks.current.onError("Piso ausente no catálogo 3D."); }, [floor, model]);
  useEffect(() => { invalidate(); }, [props.position?.x, props.position?.y, props.position?.floorId, invalidate]);
  if (!floor) return null;
  const [headingX, , headingZ] = sceneHeadingDirection(floor, props.position?.heading ?? 0);
  const markerYaw = Math.atan2(-headingX, -headingZ);
  return <>
    <color attach="background" args={["#e9eef2"]} />
    <ambientLight intensity={1.7} /><directionalLight position={[15, 45, 20]} intensity={2.2} />
    <ScenePois model={model} scene={props.scene} floor={floor} origin={props.originNodeId} destination={props.destinationNodeId} highlight={props.previewStep?.referencia_no_id ?? undefined} onPoiPress={props.onPoiPress} />
    <SceneRoute nodes={props.routeNodes} floor={floor} position={props.position} />
    {props.position?.floorId === floor.piso_id && <group name="NAV_POSITION" position={sceneTransform(floor, props.position.x, props.position.y)}
      rotation={[0, markerYaw, 0]}>
      <mesh position={[0, .11, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={19}>
        <circleGeometry args={[1.25, 32]} /><meshBasicMaterial color="#168bd6" transparent opacity={.2} depthTest={false} />
      </mesh>
      <mesh position={[0, .26, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.12, 1.12, 1]} renderOrder={20}>
        <shapeGeometry args={[navigationArrow]} /><meshBasicMaterial color="#fff" depthTest={false} />
      </mesh>
      <mesh position={[0, .28, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={21}>
        <shapeGeometry args={[navigationArrow]} /><meshBasicMaterial color="#168bd6" depthTest={false} />
      </mesh>
    </group>}
    {props.previewStep ? <WalkCamera floor={floor} scene={props.scene} step={props.previewStep} nodes={props.routeNodes} next={previewNext} onView={onView} /> : <SceneControls floor={floor} scene={props.scene} props={props} command={command} onView={onView} />}
  </>;
}

export default function SceneCanvas(props: Props) {
  const compactButton = { width: 44, height: 44, border: 0, borderRadius: 12, background: "#fff", color: "#17473f", fontWeight: 800, fontSize: 22 } as const;
  const [model, setModel] = useState<Object3D | null>(null);
  const [view, setView] = useState<CameraView>({ zoom: 1, northAngle: 0, target: [], position: [], labels: {} });
  const [command, setCommand] = useState<CameraCommand | null>(null);
  const [topView, setTopView] = useState(false);
  const [previewNext, setPreviewNext] = useState(false);
  useEffect(() => setPreviewNext(false), [props.previewStep]);
  function send(action: CameraCommand["action"]) { setCommand((current) => ({ id: (current?.id || 0) + 1, action })); }
  const callbacks = useRef(props); callbacks.current = props;
  useEffect(() => {
    const controller = new AbortController();
    const draco = new DRACOLoader().setDecoderPath(getAssetUrl("/static/models/draco/")!);
    const loader = new GLTFLoader().setDRACOLoader(draco);
    let loaded: Object3D | null = null;
    setModel(null);
    async function load() {
      const response = await fetch(getAssetUrl(props.scene.model_url)!, { signal: controller.signal });
      if (!response.ok || !response.body) throw new Error("Modelo 3D indisponível.");
      const total = Number(response.headers.get("Content-Length")) || 0;
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = []; let received = 0;
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        received += value.length;
        if (received > 25 * 1024 * 1024) { await reader.cancel(); throw new Error("Modelo excedeu o limite de tamanho."); }
        chunks.push(value); callbacks.current.onProgress(total ? Math.min(95, Math.round(received / total * 95)) : 0);
      }
      const buffer = new Uint8Array(received); let offset = 0;
      for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.length; }
      const gltf = await loader.parseAsync(buffer.buffer, "");
      loaded = gltf.scene;
      // Shared Blender materials must not make a POI highlight affect other stores.
      loaded.traverse((obj) => { if (obj instanceof Mesh) obj.material = Array.isArray(obj.material) ? obj.material.map((m) => m.clone()) : obj.material.clone(); });
      if (controller.signal.aborted) { dispose(loaded); return; }
      setModel(loaded); callbacks.current.onProgress(100);
    }
    void load().catch((error) => { if (!controller.signal.aborted) callbacks.current.onError(error.message || "Erro ao carregar o GLB."); });
    return () => { controller.abort(); draco.dispose(); if (loaded) dispose(loaded); };
  }, [props.scene.model_url]);
  const selectedPoi = props.scene.pois.find((p) => p.anchor_node_id === props.destinationNodeId);
  const floor = props.scene.floors.find((f) => f.piso_id === props.floorId);
  useEffect(() => { setTopView(false); }, [props.floorId]);
  return <View style={{ borderRadius: 2, overflow: "hidden", borderWidth: 1, borderColor: "#dbe3ed", width: props.width + 2, maxWidth: "100%" }}>
    {props.previewStep && <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 12 }}>{[false, true].map((next) => <TouchableOpacity key={String(next)} accessibilityRole="button" accessibilityState={{ selected: previewNext === next }} style={{ padding: 12, minHeight: 44, borderBottomWidth: previewNext === next ? 3 : 1 }} onPress={() => setPreviewNext(next)}><Text>{next ? "Próxima referência" : "Vista atual do trecho"}</Text></TouchableOpacity>)}</View>}
    {model && !props.previewStep && !props.compact && <MapToolbar zoom={view.zoom} onZoom={(factor) => send(factor > 1 ? "in" : "out")}
      onReset={() => { send("reset"); setTopView(false); }} onLocate={props.hasOrigin ? props.onLocate : undefined} onRoute={() => send("route")}>
      <TouchableOpacity accessibilityRole="button" onPress={() => { send(topView ? "angle" : "top"); setTopView(!topView); }} style={{ minHeight: 44, justifyContent: "center", padding: 12, borderRadius: 8, backgroundColor: "#eef2ff" }}><Text style={{ color: "#3730a3", fontSize: 13 }}>{topView ? "Vista inclinada" : "Vista superior"}</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Girar mapa para a esquerda" onPress={() => send("left")} style={{ minHeight: 44, minWidth: 44, justifyContent: "center", padding: 12 }}><Text>↶ 45°</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Girar mapa para a direita" onPress={() => send("right")} style={{ minHeight: 44, minWidth: 44, justifyContent: "center", padding: 12 }}><Text>↷ 45°</Text></TouchableOpacity>
    </MapToolbar>}
    <div data-testid="scene-map" data-preview={props.previewStep ? "walk" : "map"} data-floor-id={props.floorId} data-destination-code={selectedPoi?.codigo || ""}
      data-route-node-ids={props.routeNodes.filter((n) => n.piso_id === props.floorId).map((n) => n.id).join(",")}
      data-zoom={view.zoom.toFixed(3)} data-camera-target={view.target.map((n) => n.toFixed(3)).join(",")} data-camera-position={view.position.map((n) => n.toFixed(3)).join(",")}
      aria-label="Mapa 3D do shopping" style={{ position: "relative", width: props.width, height: props.height, maxWidth: "100%", overflow: "hidden", cursor: "grab" }}>
      {model && <Canvas key={props.previewStep ? "walk" : "map"} orthographic={!props.previewStep} frameloop="demand" dpr={[1, 1.5]} camera={{ near: .1, far: 400, fov: 65 }} gl={{ antialias: true }}>
        <Viewport model={model} props={props} command={command} onView={setView} previewNext={previewNext} />
      </Canvas>}
      {model && floor && <SceneLabels scene={props.scene} floor={floor} origin={props.originNodeId} destination={props.destinationNodeId} simulated={props.position?.source === "simulation"} position={props.position} view={view} width={props.width} height={props.height} onPoiPress={props.onPoiPress} />}
      {props.compact && !props.previewStep && <button aria-label="Ver piso inteiro" title="Ver piso inteiro" onClick={() => { props.onExplore?.(); send("reset"); }} style={{ ...compactButton, position: "absolute", bottom: 10, left: 10, width: 104, fontSize: 12 }}>Piso inteiro</button>}
      {props.compact && !props.previewStep && <div style={{ position: "absolute", bottom: 10, right: 10, display: "flex", gap: 5 }}>
        <button aria-label="Diminuir zoom" title="Diminuir zoom" onClick={() => { props.onExplore?.(); send("out"); }} style={compactButton}>−</button>
        <button aria-label="Aumentar zoom" title="Aumentar zoom" onClick={() => { props.onExplore?.(); send("in"); }} style={compactButton}>+</button>
        <button aria-label="Minha posição" title="Voltar a acompanhar o percurso" onClick={props.onLocate} style={{ ...compactButton, background: "#f5cc54" }}>◎</button>
      </div>}
      {!props.previewStep && <button aria-label="Orientar mapa para norte" title="Orientar mapa para norte" onClick={() => { props.onExplore?.(); send("north"); }} style={{ position: "absolute", top: props.controlsTop ?? 12, right: 12, width: 44, height: 44, border: 0, borderRadius: 22, background: "#ffffffed", color: "#334155", textAlign: "center", font: "700 11px system-ui", cursor: "pointer" }}>N<div style={{ fontSize: 18, lineHeight: "18px", transform: `rotate(${view.northAngle}deg)` }}>↑</div></button>}
      {props.compact && props.position?.source === "simulation" && !props.following && <View pointerEvents="none" style={{ position: "absolute", bottom: 65, alignSelf: "center", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: "#14212de8" }}><Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>Mapa livre · toque em ◎ para acompanhar</Text></View>}
    </div>
    {!props.compact && <Text style={{ backgroundColor: "#fff", color: "#64748b", paddingHorizontal: 12, paddingTop: 10, fontSize: 12 }}>{props.previewStep ? "Simulação orientada pelo trecho. Alterne entre a vista atual e a próxima referência." : "Arraste para explorar · roda ou pinça para aproximar · botão direito para girar"}</Text>}
    {!props.compact && <MapLegend simulated={props.position?.source === "simulation"} />}
  </View>;
}
