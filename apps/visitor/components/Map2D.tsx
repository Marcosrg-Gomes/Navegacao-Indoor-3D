import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Text, View } from "react-native";
import type { GraphResponse, No, NoRota, Piso } from "../types";
import { FloorMap } from "./FloorMap";
import { MapGestureSurface } from "./MapGestureSurface";
import { MapLegend, MapToolbar } from "./MapToolbar";
import { clampView, framePoints, INITIAL_VIEW, zoomAt } from "./mapViewport";

export function Map2D({ width, height, floor, graph, routeNodes, origin, destination, onNodePress, onLocate, locateRequest }: {
  width: number; height: number; floor: Piso; graph: GraphResponse; routeNodes: NoRota[];
  origin: No | null; destination?: number; onNodePress: (node: No) => void; onLocate: () => void; locateRequest: number;
}) {
  const bounds = useMemo(() => {
    const ratio = (floor.altura_metros || 60) / (floor.largura_metros || 100);
    const mapWidth = Math.min(width - 48, (height - 60) / ratio);
    return { width, height, mapWidth, mapHeight: mapWidth * ratio };
  }, [width, height, floor.largura_metros, floor.altura_metros]);
  const [view, setView] = useState(INITIAL_VIEW);
  const ignoreClickUntil = useRef(0);
  useEffect(() => { setView((v) => clampView(v, bounds)); }, [bounds]);
  useEffect(() => {
    if (locateRequest && origin?.piso_id === floor.id) setView(framePoints([origin], bounds));
  }, [locateRequest, floor.id]);
  const scaledWidth = bounds.mapWidth * view.zoom, scaledHeight = bounds.mapHeight * view.zoom;
  const scaleMeters = view.zoom >= 3 ? 2 : 5;
  const scaleWidth = scaleMeters * scaledWidth / (floor.largura_metros || 100);
  return <View testID="floor-map" style={{ borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#dbe3ed", width: width + 2, maxWidth: "100%" }}>
    <MapToolbar zoom={view.zoom} onZoom={(factor) => setView((v) => zoomAt(v, v.zoom * factor, bounds))}
      onReset={() => setView(INITIAL_VIEW)} onLocate={origin ? onLocate : undefined}
      onRoute={routeNodes.length ? () => setView(framePoints(routeNodes.filter((n) => n.piso_id === floor.id), bounds)) : undefined} />
    <View style={{ backgroundColor: "#eaf0f5" }}>
      <MapGestureSurface bounds={bounds} view={view} onChange={setView} onDrag={() => { ignoreClickUntil.current = Date.now() + 250; }}>
        <View style={{ position: "absolute", left: (width - scaledWidth) / 2 + view.x, top: (height - scaledHeight) / 2 + view.y }}>
          <FloorMap width={scaledWidth} height={scaledHeight} floorId={floor.id} imagemPlantaUrl={floor.imagem_planta_url}
            nodes={graph.nos} routeNodes={routeNodes} originNodeId={origin?.id} destinationNodeId={destination}
            detailZoom={view.zoom} onNodePress={(node) => { if (Date.now() > ignoreClickUntil.current) onNodePress(node); }} />
        </View>
      </MapGestureSurface>
      <View pointerEvents="none" style={{ position: "absolute", right: 12, top: 12, padding: 9, borderRadius: 10, backgroundColor: "#ffffffed" }}><Text style={{ color: "#334155", fontWeight: "700" }}>N ↓</Text></View>
      <View pointerEvents="none" style={{ position: "absolute", bottom: 12, left: 12, padding: 8, borderRadius: 8, backgroundColor: "#ffffffed" }}>
        <View style={{ width: scaleWidth, height: 5, borderBottomWidth: 2, borderLeftWidth: 2, borderRightWidth: 2, borderColor: "#475569" }} /><Text style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>{scaleMeters} m</Text>
      </View>
    </View>
    <Text style={{ backgroundColor: "#fff", color: "#64748b", paddingHorizontal: 12, paddingTop: 10, fontSize: 12 }}>{Platform.OS === "web" ? "Arraste para explorar · roda ou dois dedos para aproximar · clique nos pontos" : "Arraste para explorar · use dois dedos para aproximar · toque nos pontos"}</Text>
    <MapLegend />
  </View>;
}
