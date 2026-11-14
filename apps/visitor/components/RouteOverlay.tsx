import { Polyline, Circle, G, Path, Text as SvgText } from "react-native-svg";
import type { NoRota } from "@/types";
import { coordenadaNormalizada } from "@/types";
import { colors } from "@/constants/colors";
import type { PositionEstimate } from "@/positioning/types";
import { remainingRouteEdges } from "./remainingRoute";

/** Desenha os trechos da rota ainda à frente, com setas direcionais. */
export function RouteOverlay({ width, height, routeNodes, floorId, showEndpoints = true, position, mapRotation = 0 }: {
  width: number; height: number; routeNodes: NoRota[]; floorId?: number; showEndpoints?: boolean; position?: PositionEstimate | null; mapRotation?: number;
}) {
  const edges = remainingRouteEdges(routeNodes, position).filter((edge) => floorId === undefined || edge.floorId === floorId);
  const toX = (n: { coord_x: number }) => coordenadaNormalizada(n.coord_x) * width;
  const toY = (n: { coord_y: number }) => coordenadaNormalizada(n.coord_y) * height;
  const visible = (n: NoRota) => floorId === undefined || n.piso_id === floorId;
  const first = routeNodes[0];
  const last = routeNodes[routeNodes.length - 1];
  return (
    <G>
      {/* Polyline por segmento da rota (fundo branco para destacá-la) */}
      {edges.map((edge, index) => (
        <G key={`route-bg-${index}`}>
          <Polyline points={`${toX(edge.from)},${toY(edge.from)} ${toX(edge.to)},${toY(edge.to)}`} fill="none" stroke="#ffffff" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />
          <Polyline points={`${toX(edge.from)},${toY(edge.from)} ${toX(edge.to)},${toY(edge.to)}`} fill="none" stroke={colors.route} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />
        </G>
      ))}
      {/* Setas direcionais nos segmentos */}
      {edges.map((edge, index) => {
        const previous = edge.from, node = edge.to, dx = toX(node) - toX(previous), dy = toY(node) - toY(previous), length = Math.hypot(dx, dy);
        if (length < 30) return null;
        const x = (toX(node) + toX(previous)) / 2, y = (toY(node) + toY(previous)) / 2, ux = dx / length, uy = dy / length;
        return <Path key={`${node.id}-${index}`} d={[(x - ux * 9 - uy * 6) + "," + (y - uy * 9 + ux * 6), (x + ux * 6) + "," + (y + uy * 6), (x - ux * 9 + uy * 6) + "," + (y - uy * 9 - ux * 6)].join(" ")} fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />
      })}
      {showEndpoints && [{ node: first, label: "Início", color: colors.origin }, { node: last, label: "Destino", color: colors.destination }]
        .filter((item) => item.node && visible(item.node)).map(({ node, label, color }) => (
          <G key={label}>
            <Circle cx={toX(node)} cy={toY(node)} r={10} fill={color} stroke="white" strokeWidth={2} />
            <SvgText transform={mapRotation ? `rotate(${-mapRotation} ${toX(node)} ${toY(node)})` : undefined} x={Math.max(24, Math.min(width - 24, toX(node)))} y={Math.max(12, toY(node) - 16)} fill={color} fontSize={11} fontWeight="800" textAnchor="middle">{label}</SvgText>
          </G>
        ))}
    </G>
  );
}
