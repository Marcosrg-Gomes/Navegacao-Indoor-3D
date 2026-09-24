import Svg, {
  Circle,
  G,
  Image as SvgImage,
  Line,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import type { Aresta, No, NoRota } from "@/types";
import { coordenadaNormalizada, TIPO_NO_COR } from "@/types";
import { getAssetUrl } from "@/services/api";
import { RouteOverlay } from "./RouteOverlay";

type FloorMapProps = {
  width: number;
  height: number;
  nodes: No[];
  edges?: Aresta[];
  routeNodes?: NoRota[];
  originNodeId?: number | null;
  destinationNodeId?: number | null;
  highlightNodeId?: number | null;
  /** URL externa ou caminho relativo retornado pelo upload (`/static/...`). */
  imagemPlantaUrl?: string | null;
  floorId?: number;
  onNodePress?: (node: No) => void;
  detailZoom?: number;
};

export function FloorMap({
  width,
  height,
  nodes,
  edges = [],
  routeNodes = [],
  originNodeId,
  destinationNodeId,
  highlightNodeId,
  imagemPlantaUrl,
  floorId,
  onNodePress,
  detailZoom = 1,
}: FloorMapProps) {
  const toX = (coord: number) => coordenadaNormalizada(coord) * width;
  const toY = (coord: number) => coordenadaNormalizada(coord) * height;
  const plantaUrl = getAssetUrl(imagemPlantaUrl);
  const transitions = ["elevador", "escada", "escada_rolante"];
  const priority = (node: No) => [originNodeId, destinationNodeId].includes(node.id) ? 0 : transitions.includes(node.tipo) ? 1 : 2;
  const visibleNodes = nodes.filter((node) => node.tipo !== "corredor" || [originNodeId, destinationNodeId, highlightNodeId].includes(node.id))
    .sort((a, b) => priority(a) - priority(b));
  const occupiedLabels: { x: number; y: number; width: number }[] = [];

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Mapa 2D do piso com nós e rota de navegação"
    >
      <Rect x={0} y={0} width={width} height={height} fill="#e8e4d8" />
      {plantaUrl ? (
        <SvgImage
          x={0}
          y={0}
          width={width}
          height={height}
          href={{ uri: plantaUrl }}
          preserveAspectRatio="none"
        />
      ) : (
        <>
          <Rect
            x={width * 0.04}
            y={height * 0.06}
            width={width * 0.92}
            height={height * 0.88}
            fill="#d9d3c3"
            stroke="#9a917c"
            strokeWidth={2}
          />
          <Rect
            x={width * 0.08}
            y={height * 0.1}
            width={width * 0.84}
            height={height * 0.12}
            fill="#cfc6b0"
          />
          <Rect
            x={width * 0.08}
            y={height * 0.78}
            width={width * 0.84}
            height={height * 0.12}
            fill="#cfc6b0"
          />
          <Rect
            x={width * 0.08}
            y={height * 0.28}
            width={width * 0.84}
            height={height * 0.46}
            fill="#b7c4b3"
          />
          <SvgText
            x={width / 2}
            y={height * 0.52}
            fill="#4a5344"
            fontSize={14}
            fontWeight="600"
            textAnchor="middle"
          >
            Planta baixa não cadastrada
          </SvgText>
        </>
      )}

      {edges.map((edge) => {
        const from = nodes.find((node) => node.id === edge.no_origem_id);
        const to = nodes.find((node) => node.id === edge.no_destino_id);
        if (!from || !to || !edge.ativa) return null;
        return (
          <Line
            key={edge.id}
            x1={toX(from.coord_x)}
            y1={toY(from.coord_y)}
            x2={toX(to.coord_x)}
            y2={toY(to.coord_y)}
            stroke="#94a3b8"
            strokeWidth={1.5}
            opacity={0.5}
          />
        );
      })}

      <RouteOverlay width={width} height={height} routeNodes={routeNodes} floorId={floorId} showEndpoints={false} />

      {visibleNodes.map((node) => {
        const isOrigin = node.id === originNodeId;
        const isDestination = node.id === destinationNodeId;
        const isHighlight = node.id === highlightNodeId;
        const radius = isOrigin || isDestination || isHighlight ? 9 : 6;
        const fill = isOrigin
          ? "#16a34a"
          : isDestination
            ? "#e11d48"
            : TIPO_NO_COR[node.tipo] ?? "#64748b";

        const transition = transitions.includes(node.tipo);
        const label = isOrigin ? "Você está aqui" : isDestination ? "Destino" : node.tipo === "banheiro" ? "WC" : transition ? node.tipo === "elevador" ? "Elevador" : "Escada" : detailZoom >= 1.6 ? node.nome : null;
        const labelWidth = Math.min(174, (label?.length || 0) * 6.5 + 16);
        const labelX = Math.max(labelWidth / 2 + 4, Math.min(width - labelWidth / 2 - 4, toX(node.coord_x) + (isOrigin || isDestination ? 0 : node.coord_x < .5 ? -labelWidth / 2 - 12 : labelWidth / 2 + 12)));
        const preferredY = toY(node.coord_y) - (isOrigin || isDestination ? 23 : 0);
        const labelY = [0, -26, 26, -52, 52].map((offset) => Math.max(16, Math.min(height - 16, preferredY + offset)))
          .find((y) => !occupiedLabels.some((other) => Math.abs(other.y - y) < 25 && Math.abs(other.x - labelX) < (other.width + labelWidth) / 2 + 5)
            && !visibleNodes.some((point) => Math.abs(toY(point.coord_y) - y) < 21 && Math.abs(toX(point.coord_x) - labelX) < labelWidth / 2 + 10));
        if (label && labelY !== undefined) occupiedLabels.push({ x: labelX, y: labelY, width: labelWidth });
        return <G key={node.id} onPress={() => onNodePress?.(node)} accessibilityLabel={node.nome || node.tipo}>
          {label && labelY !== undefined && Math.abs(labelY - preferredY) > 2 && <Line x1={toX(node.coord_x)} y1={toY(node.coord_y)} x2={labelX} y2={labelY} stroke="#94a3b8" strokeWidth={1} />}
          <Circle cx={toX(node.coord_x)} cy={toY(node.coord_y)} r={16} fill={fill} opacity={isOrigin || isDestination ? .18 : 0.01} />
          <Circle cx={toX(node.coord_x)} cy={toY(node.coord_y)} r={radius} fill={transition && !isOrigin && !isDestination ? "#7c3aed" : fill} stroke="#ffffff" strokeWidth={2} />
          {label && labelY !== undefined && <G>
            <Rect x={labelX - labelWidth / 2} y={labelY - 11} width={labelWidth} height={22} rx={6} fill={isOrigin ? "#166534" : isDestination ? "#be123c" : "#fff"} stroke={isOrigin || isDestination ? "#fff" : "#cbd5e1"} strokeWidth={1} />
            <SvgText x={labelX} y={labelY + 4} fontSize={11} fontFamily="sans-serif" fontWeight="600" textAnchor="middle" fill={isOrigin || isDestination ? "#fff" : "#334155"}>{label.length > 25 ? label.slice(0, 23) + "…" : label}</SvgText>
          </G>}
        </G>;
      })}
    </Svg>
  );
}
