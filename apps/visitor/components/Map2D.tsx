import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, TouchableOpacity, View } from "react-native";
import { Text } from "@/components/AppText";
import type { GraphResponse, No, NoRota, Piso } from "../types";
import type { PositionEstimate } from "../positioning/types";
import { FloorMap } from "./FloorMap";
import { MapGestureSurface } from "./MapGestureSurface";
import { MapLegend, MapToolbar } from "./MapToolbar";
import { centerOnPosition, clampView, followPosition, framePoints, INITIAL_VIEW, nearbyView, zoomAt } from "./mapViewport";
import { colors } from "@/constants/colors";
import { FollowRouteButton, MapControls } from "./MapControls";
import type { MapOrientation } from "./navigationOrientation";
import { bearingBetween, snapOrientation } from "./navigationOrientation";

/**
 * Decide a rotação do mapa (0° ou 180°) para que a navegação sempre venha de
 * baixo para cima (padrão Waze). Usa o trecho à frente da posição; quando ainda
 * não há posição, usa o primeiro segmento da rota no piso.
 */
function routeOrientationFor(floorId: number, position: PositionEstimate | null | undefined, routeNodes: NoRota[], previous: MapOrientation): MapOrientation {
  const path = routeNodes.filter((node) => node.piso_id === floorId);
  if (path.length < 2) return previous;
  const onFloor = position?.floorId === floorId ? position : undefined;
  let index = onFloor ? path.findIndex((node) => node.id === onFloor.fromNodeId) : -1;
  if (index < 0 && onFloor) index = path.findIndex((node) => node.id === onFloor.toNodeId);
  const next = index >= 0 ? path[index + 1] : path[1];
  if (!next) return previous;
  const start = onFloor ? { x: onFloor.x, y: onFloor.y } : { x: path[0].coord_x, y: path[0].coord_y };
  return snapOrientation(bearingBetween(start, { x: next.coord_x, y: next.coord_y }));
}

const NORTH_UP: MapOrientation = 0;

export function Map2D({ width, height, floor, graph, routeNodes, origin, position, following, onExplore, compact, controlsTop, destination, highlight, pins, onNodePress, onLocate, locateRequest }: {
  width: number; height: number; floor: Piso; graph: GraphResponse; routeNodes: NoRota[];
  origin: No | null; destination?: number; onNodePress: (node: No) => void; onLocate: () => void; locateRequest: number;
  highlight?: number; pins?: number[];
  position?: PositionEstimate | null; following?: boolean; onExplore?: () => void; compact?: boolean; controlsTop?: number;
}) {
  const bounds = useMemo(() => {
    const ratio = (floor.altura_metros || 60) / (floor.largura_metros || 100);
    const mapWidth = Math.min(width - 48, (height - 60) / ratio);
    return { width, height, mapWidth, mapHeight: mapWidth * ratio };
  }, [width, height, floor.largura_metros, floor.altura_metros]);
  const anchor = position?.floorId === floor.id ? { x: position.x, y: position.y }
    : origin?.piso_id === floor.id ? { x: origin.coord_x, y: origin.coord_y }
    : (() => { const entry = graph.nos.find((node) => node.tipo === "entrada"); return entry ? { x: entry.coord_x, y: entry.coord_y } : undefined; })();
  // A planta 2D gira 0° ou 180° para que a navegação sempre venha de baixo para cima (padrão Waze).
  // Quando o próximo ponto do percurso está "abaixo" na planta, o mapa rotaciona 180°.
  const overview = { ...INITIAL_VIEW, rotation: NORTH_UP };
  const [view, setView] = useState(() => compact ? nearbyView(bounds, anchor, NORTH_UP) : overview);
  const explored = useRef(false);
  const viewedFloor = useRef(floor.id);
  const followedSimulation = useRef(false);
  const [localFollowing, setLocalFollowing] = useState(false);
  const isFollowing = following ?? localFollowing;
  // Orientação derivada da rota (0°/180°), independente de estar acompanhando.
  const routeOrientation = useMemo(
    () => routeOrientationFor(floor.id, position, routeNodes, NORTH_UP),
    [floor.id, position, routeNodes],
  );
  const nextTurn = position?.source === "simulation" ? (() => {
    const index = routeNodes.findIndex((node) => node.id === position.toNodeId && node.piso_id === floor.id);
    const next = routeNodes[index + 1]?.piso_id === floor.id ? routeNodes[index + 1] : routeNodes[index];
    return next ? { x: next.coord_x, y: next.coord_y } : undefined;
  })() : undefined;
  const explore = () => { explored.current = true; if (following === undefined) setLocalFollowing(false); onExplore?.(); };
  const ignoreClickUntil = useRef(0);
  useEffect(() => { setView((v) => clampView(v, bounds)); }, [bounds]);
  // Garante que a planta esteja invertida sempre que a rota apontar para baixo,
  // mesmo antes de iniciar o acompanhamento (visão geral da rota).
  useEffect(() => {
    setView((current) => {
      if (current.rotation === routeOrientation) return current;
      const focus = position?.floorId === floor.id ? { x: position.x, y: position.y }
        : origin?.piso_id === floor.id ? { x: origin.coord_x, y: origin.coord_y } : undefined;
      const next = { ...current, rotation: routeOrientation };
      return focus ? centerOnPosition(next, focus, bounds) : next;
    });
  }, [routeOrientation, position?.x, position?.y, position?.floorId, floor.id, origin?.id, bounds]);
  useEffect(() => {
    if (viewedFloor.current !== floor.id) { viewedFloor.current = floor.id; explored.current = false; followedSimulation.current = false; }
    if (compact && !explored.current && !routeNodes.some((node) => node.piso_id === floor.id) && !isFollowing)
      setView(nearbyView(bounds, anchor, routeOrientation));
  }, [compact, floor.id, bounds, anchor?.x, anchor?.y, routeNodes.length, isFollowing, routeOrientation]);
  useEffect(() => {
    if (compact && !explored.current && !isFollowing && routeNodes.some((node) => node.piso_id === floor.id)) {
      setView(framePoints(routeNodes.filter((node) => node.piso_id === floor.id), bounds, routeOrientation));
    }
  }, [compact, routeNodes, floor.id, bounds, isFollowing, routeOrientation]);
  useEffect(() => {
    if (compact && isFollowing && position?.floorId === floor.id && !followedSimulation.current) {
      followedSimulation.current = true;
      // O mapa já está na orientação da rota; só centraliza e aproxima.
      setView((current) => followPosition({ ...current, zoom: Math.min(current.zoom, 1.6) }, position, bounds, nextTurn));
    }
    if (position?.source !== "simulation") followedSimulation.current = false;
  }, [compact, isFollowing, position?.source, position?.floorId, floor.id, bounds, nextTurn?.x, nextTurn?.y]);
  useEffect(() => {
    if (locateRequest && position?.floorId === floor.id) {
      if (following === undefined) setLocalFollowing(true);
      setView((current) => position.source === "simulation"
        ? followPosition({ ...current, rotation: current.rotation }, position, bounds, nextTurn)
        : compact ? nearbyView(bounds, position, current.rotation) : centerOnPosition({ ...current, zoom: Math.max(current.zoom, 2.5), rotation: current.rotation }, position, bounds));
    } else if (locateRequest && origin?.piso_id === floor.id) setView((current) => compact ? nearbyView(bounds, { x: origin.coord_x, y: origin.coord_y }, current.rotation) : centerOnPosition({ ...current, zoom: Math.max(current.zoom, 2.5), rotation: current.rotation }, { x: origin.coord_x, y: origin.coord_y }, bounds));
  }, [locateRequest, floor.id]);
  useEffect(() => {
    if (isFollowing && position?.floorId === floor.id) setView((current) => position.source === "simulation"
      ? followPosition({ ...current, rotation: current.rotation }, position, bounds, nextTurn) : centerOnPosition({ ...current, rotation: current.rotation }, position, bounds));
  }, [isFollowing, position?.floorId, position?.x, position?.y, floor.id, bounds, nextTurn?.x, nextTurn?.y]);
  useEffect(() => {
    if (locateRequest && position?.floorId === floor.id) {
      if (following === undefined) setLocalFollowing(true);
      setView((current) => position.source === "simulation"
        ? followPosition({ ...current, rotation: current.rotation }, position, bounds, nextTurn)
        : compact ? nearbyView(bounds, position, current.rotation) : centerOnPosition({ ...current, zoom: Math.max(current.zoom, 2.5), rotation: current.rotation }, position, bounds));
    } else if (locateRequest && origin?.piso_id === floor.id) setView((current) => compact ? nearbyView(bounds, { x: origin.coord_x, y: origin.coord_y }, current.rotation) : centerOnPosition({ ...current, zoom: Math.max(current.zoom, 2.5), rotation: current.rotation }, { x: origin.coord_x, y: origin.coord_y }, bounds));
  }, [locateRequest, floor.id]);
  useEffect(() => {
    if (isFollowing && position?.floorId === floor.id) setView((current) => position.source === "simulation"
      ? followPosition({ ...current, rotation: current.rotation }, position, bounds, nextTurn) : centerOnPosition({ ...current, rotation: current.rotation }, position, bounds));
  }, [isFollowing, position?.floorId, position?.x, position?.y, floor.id, bounds, nextTurn?.x, nextTurn?.y]);
  const scaledWidth = bounds.mapWidth * view.zoom, scaledHeight = bounds.mapHeight * view.zoom;
  const scaleMeters = view.zoom >= 3 ? 2 : 5;
  const scaleWidth = scaleMeters * scaledWidth / (floor.largura_metros || 100);
  return <View testID="floor-map" style={compact ? { overflow: "hidden", width, maxWidth: "100%" } : { borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: colors.borderLight, backgroundColor: colors.surface, width: width + 2, maxWidth: "100%", shadowColor: "#0b1f1b", shadowOpacity: .08, shadowRadius: 18, shadowOffset: { width: 0, height: 6 } }}>
    {!compact && <MapToolbar zoom={view.zoom} onZoom={(factor) => { explore(); setView((v) => zoomAt(v, v.zoom * factor, bounds)); }}
      onReset={() => { explore(); setView(overview); }} onLocate={position || origin ? onLocate : undefined}
      onRoute={routeNodes.length ? () => { explore(); setView((current) => framePoints(routeNodes.filter((n) => n.piso_id === floor.id), bounds, current.rotation)); } : undefined} />}
    <View style={{ backgroundColor: colors.surfaceElevated }}>
      <MapGestureSurface bounds={bounds} view={view} onChange={setView} onDrag={(gesture) => { explore(); if (gesture !== "zoom") ignoreClickUntil.current = Date.now() + 250; }}>
        {/* A planta 2D gira 0° ou 180° para que a navegação venha de baixo para cima (padrão Waze). */}
        <View testID="map-2d-plan" style={{ position: "absolute", left: (width - scaledWidth) / 2 + view.x, top: (height - scaledHeight) / 2 + view.y, width: scaledWidth, height: scaledHeight, transform: [{ rotate: `${view.rotation}deg` }] }}>
          <FloorMap width={scaledWidth} height={scaledHeight} floorId={floor.id} imagemPlantaUrl={floor.imagem_planta_url}
            nodes={graph.nos} edges={graph.arestas} routeNodes={routeNodes} originNodeId={origin?.id} destinationNodeId={destination} compact={compact}
            highlightNodeId={highlight} pinnedNodeIds={pins}
            detailZoom={view.zoom} mapRotation={view.rotation} position={position} onNodePress={(node) => { if (Date.now() > ignoreClickUntil.current) onNodePress(node); }} />
        </View>
      </MapGestureSurface>
      <CompassBadge rotation={view.rotation} top={controlsTop ?? 12} />
      {compact && !!position && !isFollowing && <FollowRouteButton onPress={onLocate} />}
      {compact && <MapControls onOverview={() => { explore(); setView(overview); }}
        onZoomIn={() => { explore(); setView((v) => zoomAt(v, v.zoom * 1.5, bounds)); }}
        onZoomOut={() => { explore(); setView((v) => zoomAt(v, v.zoom / 1.5, bounds)); }} onLocate={onLocate} />}
      {!compact && <View pointerEvents="none" style={{ position: "absolute", bottom: 12, left: 12, padding: 8, borderRadius: 8, backgroundColor: `${colors.surface}ed` }}>
        <View style={{ width: scaleWidth, height: 5, borderBottomWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderColor: colors.textMuted }} /><Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 3 }}>{scaleMeters} m</Text>
      </View>}
    </View>
    {!compact && <Text style={{ backgroundColor: colors.surface, color: colors.textMuted, paddingHorizontal: 12, paddingTop: 10, fontSize: 12 }}>{Platform.OS === "web" ? "Arraste para explorar · roda ou dois dedos para aproximar · clique nos pontos" : "Arraste para explorar · use dois dedos para aproximar · toque nos pontos"}</Text>}
    {!compact && <MapLegend simulated={position?.source === "simulation"} />}
  </View>;
}

/** Indica onde está o norte. A planta só alterna entre 0° e 180°, então a agulha só aponta para cima ou para baixo. */
export function CompassBadge({ rotation, top }: { rotation: number; top: number }) {
  const southUp = rotation === 180;
  return <View testID="map-compass" accessible accessibilityRole="image"
    accessibilityLabel={southUp ? "Mapa invertido: o norte está para baixo para o percurso seguir para cima" : "Norte para cima"}
    style={{ position: "absolute", right: 12, top, width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: `${colors.surface}f2`, borderWidth: 1, borderColor: colors.borderLight }}>
    <View style={{ alignItems: "center", flexDirection: southUp ? "column-reverse" : "column" }}>
      <Text style={{ color: colors.danger, fontSize: 10, lineHeight: 11, fontWeight: "800" }}>N</Text>
      <View style={{ alignItems: "center", transform: [{ rotate: `${rotation}deg` }] }}>
        <View style={{ width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderBottomWidth: 10, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: colors.danger }} />
        <View style={{ width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 10, borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: colors.textMuted }} />
      </View>
    </View>
  </View>;
}
