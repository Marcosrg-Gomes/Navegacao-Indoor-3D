import Svg, {
  Circle,
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
}: FloorMapProps) {
  const toX = (coord: number) => coordenadaNormalizada(coord) * width;
  const toY = (coord: number) => coordenadaNormalizada(coord) * height;
  const plantaUrl = getAssetUrl(imagemPlantaUrl);

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

      <RouteOverlay width={width} height={height} routeNodes={routeNodes} floorId={floorId} />

      {nodes.map((node) => {
        const isOrigin = node.id === originNodeId;
        const isDestination = node.id === destinationNodeId;
        const isHighlight = node.id === highlightNodeId;
        const radius = isOrigin || isDestination || isHighlight ? 8 : 5;
        const fill = isOrigin
          ? "#22c55e"
          : isDestination
            ? "#ef4444"
            : TIPO_NO_COR[node.tipo] ?? "#64748b";

        return (
          <Circle
            key={node.id}
            onPress={() => onNodePress?.(node)}
            accessibilityLabel={node.nome || node.tipo}
            cx={toX(node.coord_x)}
            cy={toY(node.coord_y)}
            r={radius}
            fill={fill}
            stroke="#ffffff"
            strokeWidth={2}
          />
        );
      })}
    </Svg>
  );
}
