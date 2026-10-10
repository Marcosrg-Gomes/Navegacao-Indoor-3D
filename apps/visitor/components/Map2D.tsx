import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Text, TouchableOpacity, View } from "react-native";
import type { GraphResponse, No, NoRota, Piso } from "../types";
import type { PositionEstimate } from "../positioning/types";
import { FloorMap } from "./FloorMap";
import { MapGestureSurface } from "./MapGestureSurface";
import { MapLegend, MapToolbar } from "./MapToolbar";
import { centerOnPosition, clampView, followPosition, framePoints, INITIAL_VIEW, nearbyView, zoomAt } from "./mapViewport";

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
  const [view, setView] = useState(() => compact ? nearbyView(bounds, anchor) : INITIAL_VIEW);
  const explored = useRef(false);
  const viewedFloor = useRef(floor.id);
  const followedSimulation = useRef(false);
  const [localFollowing, setLocalFollowing] = useState(false);
  const isFollowing = following ?? localFollowing;
  const nextTurn = position?.source === "simulation" ? (() => {
    const index = routeNodes.findIndex((node) => node.id === position.toNodeId && node.piso_id === floor.id);
    const next = routeNodes[index + 1]?.piso_id === floor.id ? routeNodes[index + 1] : routeNodes[index];
    return next ? { x: next.coord_x, y: next.coord_y } : undefined;
  })() : undefined;
  const explore = () => { explored.current = true; if (following === undefined) setLocalFollowing(false); onExplore?.(); };
  const ignoreClickUntil = useRef(0);
  useEffect(() => { setView((v) => clampView(v, bounds)); }, [bounds]);
  useEffect(() => {
    if (viewedFloor.current !== floor.id) { viewedFloor.current = floor.id; explored.current = false; followedSimulation.current = false; }
    if (compact && !explored.current && !routeNodes.some((node) => node.piso_id === floor.id) && !(isFollowing && position?.source === "simulation"))
      setView(nearbyView(bounds, anchor));
  }, [compact, floor.id, bounds, anchor?.x, anchor?.y, routeNodes.length, isFollowing, position?.source]);
  useEffect(() => {
    if (compact && !explored.current && !(isFollowing && position?.source === "simulation") && routeNodes.some((node) => node.piso_id === floor.id)) {
      setView(framePoints(routeNodes.filter((node) => node.piso_id === floor.id), bounds));
    }
  }, [compact, routeNodes, floor.id, bounds, isFollowing, position?.source]);
  useEffect(() => {
    if (compact && isFollowing && position?.source === "simulation" && position.floorId === floor.id && !followedSimulation.current) {
      followedSimulation.current = true;
      setView((current) => followPosition({ ...current, zoom: Math.min(current.zoom, 1.6) }, position, bounds, nextTurn));
    }
    if (position?.source !== "simulation") followedSimulation.current = false;
  }, [compact, isFollowing, position?.source, position?.floorId, floor.id, bounds, nextTurn?.x, nextTurn?.y]);
  useEffect(() => {
    if (locateRequest && position?.floorId === floor.id) {
      if (following === undefined) setLocalFollowing(true);
      setView((current) => position.source === "simulation"
        ? followPosition(current, position, bounds, nextTurn)
        : compact ? nearbyView(bounds, position) : centerOnPosition({ ...current, zoom: Math.max(current.zoom, 2.5) }, position, bounds));
    } else if (locateRequest && origin?.piso_id === floor.id) setView((current) => compact ? nearbyView(bounds, { x: origin.coord_x, y: origin.coord_y }) : centerOnPosition({ ...current, zoom: Math.max(current.zoom, 2.5) }, { x: origin.coord_x, y: origin.coord_y }, bounds));
  }, [locateRequest, floor.id]);
  useEffect(() => {
    if (isFollowing && position?.floorId === floor.id) setView((current) => position.source === "simulation"
      ? followPosition(current, position, bounds, nextTurn) : centerOnPosition(current, position, bounds));
  }, [isFollowing, position?.floorId, position?.x, position?.y, position?.heading, floor.id, bounds, nextTurn?.x, nextTurn?.y]);
  const scaledWidth = bounds.mapWidth * view.zoom, scaledHeight = bounds.mapHeight * view.zoom;
  const scaleMeters = view.zoom >= 3 ? 2 : 5;
  const scaleWidth = scaleMeters * scaledWidth / (floor.largura_metros || 100);
  return <View testID="floor-map" style={{ borderRadius: 2, overflow: "hidden", borderWidth: 1, borderColor: "#dbe3ed", width: width + 2, maxWidth: "100%" }}>
    {!compact && <MapToolbar zoom={view.zoom} onZoom={(factor) => { explore(); setView((v) => zoomAt(v, v.zoom * factor, bounds)); }}
      onReset={() => { explore(); setView(INITIAL_VIEW); }} onLocate={position || origin ? onLocate : undefined}
      onRoute={routeNodes.length ? () => { explore(); setView(framePoints(routeNodes.filter((n) => n.piso_id === floor.id), bounds)); } : undefined} />}
    <View style={{ backgroundColor: "#eaf0f5" }}>
      <MapGestureSurface bounds={bounds} view={view} onChange={setView} onDrag={(gesture) => { explore(); if (gesture !== "zoom") ignoreClickUntil.current = Date.now() + 250; }}>
        <View style={{ position: "absolute", left: (width - scaledWidth) / 2 + view.x, top: (height - scaledHeight) / 2 + view.y, width: scaledWidth, height: scaledHeight, transform: [{ rotate: `${view.rotation}deg` }] }}>
          <FloorMap width={scaledWidth} height={scaledHeight} floorId={floor.id} imagemPlantaUrl={floor.imagem_planta_url}
            nodes={graph.nos} edges={graph.arestas} routeNodes={routeNodes} originNodeId={origin?.id} destinationNodeId={destination} compact={compact}
            highlightNodeId={highlight} pinnedNodeIds={pins}
            detailZoom={view.zoom} mapRotation={view.rotation} position={position} onNodePress={(node) => { if (Date.now() > ignoreClickUntil.current) onNodePress(node); }} />
        </View>
      </MapGestureSurface>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Orientar mapa para norte" accessibilityHint="Interrompe o acompanhamento e deixa a planta na orientação original" onPress={() => { explore(); setView((current) => centerOnPosition({ ...current, rotation: 0 }, anchor || { x: .5, y: .5 }, bounds)); }} style={{ position: "absolute", right: 12, top: controlsTop ?? 12, width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: "#ffffffed" }}><Text style={{ color: "#334155", fontSize: 11, fontWeight: "800" }}>N</Text><Text style={{ color: "#334155", fontSize: 18, lineHeight: 18, transform: [{ rotate: `${180 + view.rotation}deg` }] }}>↑</Text></TouchableOpacity>
      {compact && position?.source === "simulation" && !isFollowing && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Voltar a acompanhar a rota" onPress={onLocate} style={{ position: "absolute", bottom: 65, alignSelf: "center", minHeight: 44, justifyContent: "center", paddingHorizontal: 16, borderRadius: 22, backgroundColor: "#14212d" }}><Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>◎ Acompanhar rota</Text></TouchableOpacity>}
      {compact && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Ver piso inteiro" onPress={() => { explore(); setView(INITIAL_VIEW); }} style={{ position: "absolute", bottom: 12, left: 12, minWidth: 104, height: 44, paddingHorizontal: 10, justifyContent: "center", alignItems: "center", borderRadius: 12, backgroundColor: "#fff" }}><Text style={{ color: "#17473f", fontSize: 12, fontWeight: "800" }}>Piso inteiro</Text></TouchableOpacity>}
      {compact && <View style={{ position: "absolute", bottom: 12, right: 12, flexDirection: "row", gap: 5 }}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Diminuir zoom" onPress={() => { explore(); setView((v) => zoomAt(v, v.zoom / 1.5, bounds)); }} style={{ backgroundColor: "#ffffff", width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 12 }}><Text style={{ color: "#17473f", fontSize: 23, fontWeight: "800" }}>−</Text></TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Aumentar zoom" onPress={() => { explore(); setView((v) => zoomAt(v, v.zoom * 1.5, bounds)); }} style={{ backgroundColor: "#ffffff", width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 12 }}><Text style={{ color: "#17473f", fontSize: 23, fontWeight: "800" }}>+</Text></TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Minha posição" accessibilityHint="Volta a acompanhar sua posição no percurso" onPress={onLocate} style={{ backgroundColor: "#f5cc54", width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 12 }}><Text style={{ color: "#17473f", fontSize: 24, fontWeight: "800" }}>◎</Text></TouchableOpacity>
      </View>}
      {!compact && <View pointerEvents="none" style={{ position: "absolute", bottom: 12, left: 12, padding: 8, borderRadius: 8, backgroundColor: "#ffffffed" }}>
        <View style={{ width: scaleWidth, height: 5, borderBottomWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderColor: "#475569" }} /><Text style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>{scaleMeters} m</Text>
      </View>}
    </View>
    {!compact && <Text style={{ backgroundColor: "#fff", color: "#64748b", paddingHorizontal: 12, paddingTop: 10, fontSize: 12 }}>{Platform.OS === "web" ? "Arraste para explorar · roda ou dois dedos para aproximar · clique nos pontos" : "Arraste para explorar · use dois dedos para aproximar · toque nos pontos"}</Text>}
    {!compact && <MapLegend simulated={position?.source === "simulation"} />}
  </View>;
}
