import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Material, Mesh, Object3D, Shape } from "three";
import { TouchableOpacity, View } from "react-native";
import { Text } from "@/components/AppText";
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
import { sceneHeadingDirection, sceneTransform, sceneYawForDirection } from "./sceneTransform";
import { bearingBetween, snapOrientation, headingToNextRouteNode, routeOrientationFor, type MapOrientation } from "./navigationOrientation";
import { colors } from "@/constants/colors";
import { FollowRouteButton, MapControls } from "./MapControls";

type Props = SceneMapProps & { scene: Scene; onReady: () => void; onProgress: (value: number) => void; onError: (message: string) => void };

const navigationArrow = new Shape();
navigationArrow.moveTo(0, 1.05);
navigationArrow.lineTo(.62, -.62);
navigationArrow.lineTo(0, -.3);
navigationArrow.lineTo(-.62, -.62);
navigationArrow.closePath();

/** O mapa 3D segue a mesma regra do 2D: fica sempre de baixo para cima, rotacionando 180° quando o percurso aponta para baixo (padrão Waze). */
const NORTH_UP: MapOrientation = 0;


function dispose(model: Object3D) {
  model.traverse((object) => { if (object instanceof Mesh) { object.geometry.dispose(); (Array.isArray(object.material) ? object.material : [object.material]).forEach((m: Material) => m.dispose()); } });
}

function Viewport({ model, props, orientation, command, onView, previewNext }: { model: Object3D; props: Props; orientation: MapOrientation; command: CameraCommand | null; onView: (view: CameraView) => void; previewNext: boolean }) {
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
  // A câmera segue a orientação 0°/180° da rota (o percurso sempre vem de baixo
  // para cima). A seta acompanha o rumo do deslocamento e, numa posição
  // confirmada, aponta para o próximo nó da rota.
  const heading = props.position?.heading ?? headingToNextRouteNode(props.position, props.routeNodes) ?? 0;
  const markerYaw = sceneYawForDirection(sceneHeadingDirection(floor, heading));
  return <>
    <color attach="background" args={[colors.bg]} />
    <ambientLight intensity={1.7} /><directionalLight position={[15, 45, 20]} intensity={2.2} />
    <ScenePois model={model} scene={props.scene} floor={floor} origin={props.originNodeId} destination={props.destinationNodeId} highlight={props.previewStep?.referencia_no_id ?? undefined} onPoiPress={props.onPoiPress} />
    <SceneRoute nodes={props.routeNodes} floor={floor} position={props.position} />
    {props.position?.floorId === floor.piso_id && <group name="NAV_POSITION" position={sceneTransform(floor, props.position.x, props.position.y)}
      rotation={[0, markerYaw, 0]}>
      <mesh position={[0, .11, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={18}>
        <circleGeometry args={[1.6, 40]} /><meshBasicMaterial color={colors.primary} transparent opacity={.16} depthTest={false} />
      </mesh>
      <mesh position={[0, .2, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={19}>
        <circleGeometry args={[1.05, 40]} /><meshBasicMaterial color={colors.surface} depthTest={false} />
      </mesh>
      <mesh position={[0, .26, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[.9, .9, 1]} renderOrder={20}>
        <shapeGeometry args={[navigationArrow]} /><meshBasicMaterial color={colors.surface} depthTest={false} />
      </mesh>
      <mesh position={[0, .28, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[.78, .78, 1]} renderOrder={21}>
        <shapeGeometry args={[navigationArrow]} /><meshBasicMaterial color={colors.primary} depthTest={false} />
      </mesh>
    </group>}
    {props.previewStep ? <WalkCamera floor={floor} scene={props.scene} step={props.previewStep} nodes={props.routeNodes} next={previewNext} orientation={orientation} onView={onView} /> : <SceneControls floor={floor} scene={props.scene} props={props} orientation={orientation} command={command} onView={onView} />}
  </>;
}

export default function SceneCanvas(props: Props) {
  const [model, setModel] = useState<Object3D | null>(null);
  // O mapa 3D rotaciona 0° ou 180° para que a navegação sempre venha de baixo para cima (padrão Waze).
  const orientation: MapOrientation = useMemo(() => {
    return routeOrientationFor(props.floorId, props.position, props.routeNodes, NORTH_UP);
  }, [props.floorId, props.position, props.routeNodes]);
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
  return <View style={props.compact ? { overflow: "hidden", width: props.width, maxWidth: "100%" } : { borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surface, width: props.width + 2, maxWidth: "100%", shadowColor: "#0b1f1b", shadowOpacity: .08, shadowRadius: 18, shadowOffset: { width: 0, height: 6 } }}>
    {props.previewStep && <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 12 }}>{[false, true].map((next) => <TouchableOpacity key={String(next)} accessibilityRole="button" accessibilityState={{ selected: previewNext === next }} style={{ padding: 12, minHeight: 44, borderBottomWidth: previewNext === next ? 3 : 1 }} onPress={() => setPreviewNext(next)}><Text>{next ? "Próxima referência" : "Vista atual do trecho"}</Text></TouchableOpacity>)}</View>}
    {model && !props.previewStep && !props.compact && <MapToolbar zoom={view.zoom} onZoom={(factor) => send(factor > 1 ? "in" : "out")}
      onReset={() => { send("reset"); setTopView(false); }} onLocate={props.hasOrigin ? props.onLocate : undefined} onRoute={() => send("route")}>
      <TouchableOpacity accessibilityRole="button" onPress={() => { send(topView ? "angle" : "top"); setTopView(!topView); }} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surface }}><Text style={{ color: colors.primaryDark, fontSize: 13 }}>{topView ? "Vista inclinada" : "Vista superior"}</Text></TouchableOpacity>
    </MapToolbar>}
    <div data-testid="scene-map" data-preview={props.previewStep ? "walk" : "map"} data-floor-id={props.floorId} data-destination-code={selectedPoi?.codigo || ""}
      data-route-node-ids={props.routeNodes.filter((n) => n.piso_id === props.floorId).map((n) => n.id).join(",")}
      data-zoom={view.zoom.toFixed(3)} data-orientation={orientation} data-camera-target={view.target.map((n) => n.toFixed(3)).join(",")} data-camera-position={view.position.map((n) => n.toFixed(3)).join(",")}
      aria-label="Mapa 3D do shopping" style={{ position: "relative", width: props.width, height: props.height, maxWidth: "100%", overflow: "hidden", cursor: "grab" }}>
      {model && <Canvas key={props.previewStep ? "walk" : "map"} orthographic={!props.previewStep} frameloop="demand" dpr={[1, 1.5]} camera={{ near: .1, far: 400, fov: 65 }} gl={{ antialias: true }}>
        <Viewport model={model} props={props} orientation={orientation} command={command} onView={setView} previewNext={previewNext} />
      </Canvas>}
      {model && floor && <SceneLabels scene={props.scene} floor={floor} origin={props.originNodeId} destination={props.destinationNodeId} simulated={props.position?.source === "simulation"} position={props.position} view={view} width={props.width} height={props.height} onPoiPress={props.onPoiPress} />}
      {props.compact && !props.previewStep && <MapControls onOverview={() => { props.onExplore?.(); send("reset"); }}
        onZoomIn={() => { props.onExplore?.(); send("in"); }} onZoomOut={() => { props.onExplore?.(); send("out"); }} onLocate={props.onLocate} />}

      {props.compact && !props.previewStep && !!props.position && !props.following && props.routeNodes.length > 0 && <FollowRouteButton onPress={props.onLocate} />}
    </div>
    {!props.compact && <Text style={{ backgroundColor: colors.surface, color: colors.textMuted, paddingHorizontal: 12, paddingTop: 10, fontSize: 12 }}>{props.previewStep ? "Simulação orientada pelo trecho. Alterne entre a vista atual e a próxima referência." : "Arraste para explorar · roda ou pinça para aproximar"}</Text>}
    {!props.compact && <MapLegend simulated={props.position?.source === "simulation"} />}
  </View>;
}
