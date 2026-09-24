import { useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Material, Mesh, Object3D } from "three";
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

type Props = SceneMapProps & { scene: Scene; onReady: () => void; onProgress: (value: number) => void; onError: (message: string) => void };

function dispose(model: Object3D) {
  model.traverse((object) => { if (object instanceof Mesh) { object.geometry.dispose(); (Array.isArray(object.material) ? object.material : [object.material]).forEach((m: Material) => m.dispose()); } });
}

function Viewport({ model, props, command, onView }: { model: Object3D; props: Props; command: CameraCommand | null; onView: (view: CameraView) => void }) {
  const { gl } = useThree();
  const floor = props.scene.floors.find((item) => item.piso_id === props.floorId);
  const callbacks = useRef(props); callbacks.current = props;
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); callbacks.current.onError("A conexão com a GPU foi perdida."); };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, [gl]);
  useEffect(() => { if (floor) callbacks.current.onReady(); else callbacks.current.onError("Piso ausente no catálogo 3D."); }, [floor, model]);
  if (!floor) return null;
  return <>
    <color attach="background" args={["#e9eef2"]} />
    <ambientLight intensity={1.7} /><directionalLight position={[15, 45, 20]} intensity={2.2} />
    <ScenePois model={model} scene={props.scene} floor={floor} origin={props.originNodeId} destination={props.destinationNodeId} onPoiPress={props.onPoiPress} />
    <SceneRoute nodes={props.routeNodes} floor={floor} />
    <SceneControls floor={floor} scene={props.scene} props={props} command={command} onView={onView} />
  </>;
}

export default function SceneCanvas(props: Props) {
  const [model, setModel] = useState<Object3D | null>(null);
  const [view, setView] = useState<CameraView>({ zoom: 1, northAngle: 0, target: [], position: [], labels: {} });
  const [command, setCommand] = useState<CameraCommand | null>(null);
  const [topView, setTopView] = useState(false);
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
  return <View style={{ borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#dbe3ed", width: props.width + 2, maxWidth: "100%" }}>
    {model && <MapToolbar zoom={view.zoom} onZoom={(factor) => send(factor > 1 ? "in" : "out")}
      onReset={() => { send("reset"); setTopView(false); }} onLocate={props.hasOrigin ? props.onLocate : undefined} onRoute={() => send("route")}>
      <TouchableOpacity accessibilityRole="button" onPress={() => { send(topView ? "angle" : "top"); setTopView(!topView); }} style={{ padding: 12, borderRadius: 8, backgroundColor: "#eef2ff" }}><Text style={{ color: "#3730a3", fontSize: 13 }}>{topView ? "Vista inclinada" : "Vista superior"}</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Girar mapa para a esquerda" onPress={() => send("left")} style={{ padding: 12 }}><Text>↶ 45°</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Girar mapa para a direita" onPress={() => send("right")} style={{ padding: 12 }}><Text>↷ 45°</Text></TouchableOpacity>
    </MapToolbar>}
    <div data-testid="scene-map" data-floor-id={props.floorId} data-destination-code={selectedPoi?.codigo || ""}
      data-route-node-ids={props.routeNodes.filter((n) => n.piso_id === props.floorId).map((n) => n.id).join(",")}
      data-zoom={view.zoom.toFixed(3)} data-camera-target={view.target.map((n) => n.toFixed(3)).join(",")} data-camera-position={view.position.map((n) => n.toFixed(3)).join(",")}
      aria-label="Mapa 3D do shopping" style={{ position: "relative", width: props.width, height: props.height, maxWidth: "100%", overflow: "hidden", cursor: "grab" }}>
      {model && <Canvas orthographic frameloop="demand" dpr={[1, 1.5]} camera={{ near: .1, far: 400 }} gl={{ antialias: true }}>
        <Viewport model={model} props={props} command={command} onView={setView} />
      </Canvas>}
      {model && floor && <SceneLabels scene={props.scene} floor={floor} origin={props.originNodeId} destination={props.destinationNodeId} view={view} width={props.width} height={props.height} onPoiPress={props.onPoiPress} />}
      <div aria-label="Norte do mapa" style={{ position: "absolute", top: 12, right: 12, pointerEvents: "none", background: "#ffffffed", borderRadius: 10, padding: 10, color: "#334155", textAlign: "center", font: "700 12px system-ui" }}>N<div style={{ fontSize: 22, transform: `rotate(${view.northAngle}deg)` }}>↑</div></div>
    </div>
    <Text style={{ backgroundColor: "#fff", color: "#64748b", paddingHorizontal: 12, paddingTop: 10, fontSize: 12 }}>Arraste para explorar · roda ou pinça para aproximar · botão direito para girar</Text>
    <MapLegend />
  </View>;
}
