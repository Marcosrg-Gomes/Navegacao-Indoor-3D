import Svg, {
  Circle,
  G,
  Image as SvgImage,
  Line,
  Path,
  Rect,
  Text as SvgText,
} from "react-native-svg";
import type { Aresta, No, NoRota } from "@/types";
import { coordenadaNormalizada, TIPO_NO_COR } from "@/types";
import { getAssetUrl } from "@/services/api";
import { RouteOverlay } from "./RouteOverlay";
import type { PositionEstimate } from "@/positioning/types";
import { mapRotationForHeading } from "./mapViewport";
import { colors } from "@/constants/colors";

type FloorMapProps = {
  width: number;
  height: number;
  nodes: No[];
  edges?: Aresta[];
  routeNodes?: NoRota[];
  originNodeId?: number | null;
  destinationNodeId?: number | null;
  highlightNodeId?: number | null;
  pinnedNodeIds?: number[];
  /** URL externa ou caminho relativo retornado pelo upload (`/static/...`). */
  imagemPlantaUrl?: string | null;
  floorId?: number;
  onNodePress?: (node: No) => void;
  detailZoom?: number;
  /** Rotação visual da planta; mantém os rótulos dos pontos legíveis. */
  mapRotation?: number;
  position?: PositionEstimate | null;
  compact?: boolean;
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
  pinnedNodeIds = [],
  imagemPlantaUrl,
  floorId,
  onNodePress,
  detailZoom = 1,
  mapRotation = 0,
  position,
  compact = false,
}: FloorMapProps) {
  const toX = (coord: number) => coordenadaNormalizada(coord) * width;
  const toY = (coord: number) => coordenadaNormalizada(coord) * height;
  const plantaUrl = getAssetUrl(imagemPlantaUrl);
  const transitions = ["elevador", "escada", "escada_rolante"];
  const priority = (node: No) => [originNodeId, destinationNodeId].includes(node.id) ? 0 : transitions.includes(node.tipo) ? 1 : 2;
  const visibleNodes = nodes.filter((node) => node.tipo !== "corredor" || [originNodeId, destinationNodeId, highlightNodeId].includes(node.id))
    .sort((a, b) => priority(a) - priority(b));
  const originNode = nodes.find((node) => node.id === originNodeId);
  const focus = position && position.floorId === floorId ? { x: position.x, y: position.y }
    : originNode ? { x: originNode.coord_x, y: originNode.coord_y } : null;
  const nearbyStores = new Set(nodes.filter((node) => node.tipo === "loja")
    .sort((a, b) => focus ? Math.hypot((a.coord_x - focus.x) * width, (a.coord_y - focus.y) * height) - Math.hypot((b.coord_x - focus.x) * width, (b.coord_y - focus.y) * height) : a.id - b.id)
    .slice(0, compact && position?.source === "simulation" ? 0 : 3).map((node) => node.id));
  const occupiedLabels: { x: number; y: number; width: number }[] = [];

  // Rotação decidida exclusivamente pela direção do próximo trecho da rota,
  // não pelo heading do usuário (evita inversões em curvas).
  const resolvedRotation = mapRotationForHeading(position?.heading, position && position.floorId === floorId && routeNodes.length
    ? (() => {
        const index = routeNodes.findIndex((node) => node.id === position.toNodeId && node.piso_id === floorId);
        const next = routeNodes[index + 1]?.piso_id === floorId ? routeNodes[index + 1] : routeNodes[index];
        return next ? coordenadaNormalizada(next.coord_x) - coordenadaNormalizada(position.x) > 0 ? 90 : 270 : undefined;
      })()
    : undefined);

  return (
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Mapa 2D do piso com nós e rota de navegação"
    >
      <g transform={`rotate(${mapRotation} ${width / 2} ${height / 2})`}>
        <Rect x={0} y={0} width={width} height={height} fill={compact ? colors.primarySoft : colors.bg} />
        {plantaUrl ? (
          <SvgImage
            x={0}
            y={0}
            width={width}
            height={height}
            href={{ uri: plantaUrl }}
            preserveAspectRatio="none"
            opacity={compact ? .58 : 1}
          />
        ) : (
          <>
            <Rect
              x={width * 0.04}
              y={height * 0.06}
              width={width * 0.92}
              height={height * 0.88}
              fill={colors.surfaceElevated}
              stroke={colors.border}
              strokeWidth={2}
            />
            <Rect
              x={width * 0.08}
              y={height * 0.1}
              width={width * 0.84}
              height={height * 0.12}
              fill={colors.surfaceHover}
            />
            <Rect
              x={width * 0.08}
              y={height * 0.78}
              width={width * 0.84}
              height={height * 0.12}
              fill={colors.surfaceHover}
            />
            <Rect
              x={width * 0.08}
              y={height * 0.28}
              width={width * 0.84}
              height={height * 0.46}
              fill={colors.primaryLighter}
            />
            <SvgText
              x={width / 2}
              y={height * 0.52}
              fill={colors.textMuted}
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
            <G key={edge.id}>
              {compact && <Line x1={toX(from.coord_x)} y1={toY(from.coord_y)} x2={toX(to.coord_x)} y2={toY(to.coord_y)} stroke={colors.border} strokeWidth={12} strokeLinecap="round" />}
              <Line x1={toX(from.coord_x)} y1={toY(from.coord_y)} x2={toX(to.coord_x)} y2={toY(to.coord_y)} stroke={compact ? colors.surface : colors.textMuted} strokeWidth={compact ? 9 : 1.5} strokeLinecap="round" opacity={compact ? 1 : .4} />
            </G>
          );
        })}

        <RouteOverlay width={width} height={height} routeNodes={routeNodes} floorId={floorId} showEndpoints={false} position={position} />

        {visibleNodes.map((node) => {
          const isOrigin = node.id === originNodeId;
          const isDestination = node.id === destinationNodeId;
          const isHighlight = node.id === highlightNodeId;
          const radius = isOrigin || isDestination || isHighlight ? 9 : compact && node.tipo === "loja" ? 3.5 : 6;
          const fill = isOrigin
            ? colors.origin
            : isDestination
              ? colors.destination
              : TIPO_NO_COR[node.tipo] ?? colors.textMuted;

          const transition = transitions.includes(node.tipo);
          const pinned = pinnedNodeIds.includes(node.id);
          const code = node.codigo.replace(/^(T|M)_LOJA_/, "");
          const label = isOrigin ? position?.source === "simulation" ? null : compact ? "Você" : "Você está aqui" : isDestination || isHighlight ? node.nome || "Destino" : pinned ? "★ " + node.nome : compact && position?.source === "simulation" ? null : node.tipo === "banheiro" ? "WC" : transition ? node.tipo === "elevador" ? "Elevador" : "Escada" : compact ? nearbyStores.has(node.id) && detailZoom >= 1.4 ? node.nome : null : detailZoom >= 1.6 ? node.nome : node.tipo === "loja" ? code : null;
          const labelWidth = Math.min(compact ? 92 : 174, (label?.length || 0) * (compact ? 5.8 : 6.5) + 16);
          const labelX = Math.max(labelWidth / 2 + 4, Math.min(width - labelWidth / 2 - 4, toX(node.coord_x) + (isOrigin || isDestination ? 0 : node.coord_x < .5 ? -labelWidth / 2 - 12 : labelWidth / 2 + 12)));
          const preferredY = toY(node.coord_y) - (isOrigin || isDestination ? 23 : 0);
          const labelY = [0, -26, 26, -52, 52].map((offset) => Math.max(16, Math.min(height - 16, preferredY + offset)))
            .find((y) => !occupiedLabels.some((other) => Math.abs(other.y - y) < 25 && Math.abs(other.x - labelX) < (other.width + labelWidth) / 2 + 5)
              && !visibleNodes.some((point) => Math.abs(toY(point.coord_y) - y) < 21 && Math.abs(toX(point.coord_x) - labelX) < labelWidth / 2 + 10));
          if (label && labelY !== undefined) occupiedLabels.push({ x: labelX, y: labelY, width: labelWidth });
          return <G key={node.id} onPress={() => onNodePress?.(node)} accessibilityLabel={node.nome || node.tipo}>
            {label && labelY !== undefined && Math.abs(labelY - preferredY) > 2 && <Line x1={toX(node.coord_x)} y1={toY(node.coord_y)} x2={labelX} y2={labelY} stroke={colors.border} strokeWidth={1} />}
            <Circle cx={toX(node.coord_x)} cy={toY(node.coord_y)} r={22} fill={fill} opacity={isOrigin || isDestination ? .18 : 0.01} />
            {(isHighlight || pinned) && <Rect x={toX(node.coord_x) - 14} y={toY(node.coord_y) - 14} width={28} height={28} fill="none" stroke={colors.accentDark} strokeWidth={3} strokeDasharray={pinned ? "4 3" : undefined} />}
            {isOrigin && (() => { const index = routeNodes.findIndex((point) => point.id === node.id); const next = index >= 0 ? routeNodes[index + 1] : undefined; if (!next || next.piso_id !== node.piso_id) return null; const dx = toX(next.coord_x) - toX(node.coord_x), dy = toY(next.coord_y) - toY(node.coord_y); if (Math.hypot(dx, dy) < 1) return null; return <Path d="M 15 -6 L 23 0 L 15 6" transform={`translate(${toX(node.coord_x)}, ${toY(node.coord_y)}) rotate(${Math.atan2(dy, dx) * 180 / Math.PI})`} fill="none" stroke={colors.success} strokeWidth={3} accessibilityLabel="Sentido inicial do percurso, não orientação do aparelho" />; })()}
            {isDestination ? <Rect testID="destination-marker" x={toX(node.coord_x) - radius} y={toY(node.coord_y) - radius} width={radius * 2} height={radius * 2} fill={fill} stroke={colors.surface} strokeWidth={2} />
              : <Circle cx={toX(node.coord_x)} cy={toY(node.coord_y)} r={radius} fill={transition && !isOrigin ? colors.accessible : fill} stroke={colors.surface} strokeWidth={2} />}
            {label && labelY !== undefined && <G transform={`rotate(${-mapRotation} ${labelX} ${labelY})`}>
              <Rect x={labelX - labelWidth / 2} y={labelY - (compact ? 10 : 11)} width={labelWidth} height={compact ? 20 : 22} rx={compact ? 10 : 6} fill={isOrigin ? colors.success : isDestination ? colors.danger : colors.surface} stroke={isOrigin || isDestination ? colors.surface : colors.border} strokeWidth={1} />
              <SvgText x={labelX} y={labelY + (compact ? 3 : 4)} fontSize={compact ? 10 : 11} fontFamily="sans-serif" fontWeight="600" textAnchor="middle" fill={isOrigin || isDestination ? colors.textOnPrimary : colors.text}>{label.length > (compact ? 13 : 25) ? label.slice(0, compact ? 12 : 23) + "…" : label}</SvgText>
            </G>}            
          </G>;
        })}
        {position && position.floorId === floorId && <G testID="position-marker" accessibilityLabel={position.source === "simulation" ? "Posição simulada" : "Última posição confirmada"}>
          <Circle cx={toX(position.x)} cy={toY(position.y)} r={18} fill={colors.surface} stroke={colors.primary} strokeWidth={3} opacity={.97} />
          <Path d={`M ${toX(position.x)} ${toY(position.y) - 11} L ${toX(position.x) + 10} ${toY(position.y) + 8} L ${toX(position.x)} ${toY(position.y) + 5} L ${toX(position.x) - 10} ${toY(position.y) + 8} Z`} transform={`rotate(0 ${toX(position.x)} ${toY(position.y)})`} fill={colors.primary} stroke={colors.primaryDark} strokeWidth={2} />
        </G>}
      </g>
    </Svg>
  );
}
