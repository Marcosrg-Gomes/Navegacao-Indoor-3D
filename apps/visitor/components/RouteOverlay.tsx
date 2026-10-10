import { Polyline, Circle, G, Text as SvgText } from "react-native-svg";
import type { NoRota } from "@/types";
import { coordenadaNormalizada } from "@/types";
import { colors } from "@/constants/colors";
import type { PositionEstimate } from "@/positioning/types";
import { remainingRouteEdges } from "./remainingRoute";

/** Desenha apenas os trechos ainda à frente, sem ligar pisos diferentes. */
export function RouteOverlay({ width, height, routeNodes, floorId, showEndpoints = true, position }: {
  width: number; height: number; routeNodes: NoRota[]; floorId?: number; showEndpoints?: boolean; position?: PositionEstimate | null;
}) {
  const edges = remainingRouteEdges(routeNodes, position).filter((edge) => floorId === undefined || edge.floorId === floorId);
  const toX = (n: { coord_x: number }) => coordenadaNormalizada(n.coord_x) * width;
  const toY = (n: { coord_y: number }) => coordenadaNormalizada(n.coord_y) * height;
  const visible = (n: NoRota) => floorId === undefined || n.piso_id === floorId;
  const first = routeNodes[0];
  const last = routeNodes[routeNodes.length - 1];
  return (
    <G>
      {edges.map((edge, index) => (
        <G key={`${edge.to.id}-${index}`}>
          <Polyline points={`${toX(edge.from)},${toY(edge.from)} ${toX(edge.to)},${toY(edge.to)}`}
            fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
          <Polyline points={`${toX(edge.from)},${toY(edge.from)} ${toX(edge.to)},${toY(edge.to)}`}
            fill="none" stroke={colors.route} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
        </G>
      ))}
      {edges.map((edge, index) => {
        const previous = edge.from, node = edge.to, dx = toX(node) - toX(previous), dy = toY(node) - toY(previous), length = Math.hypot(dx, dy);
        if (length < 24) return null;
        const x = (toX(node) + toX(previous)) / 2, y = (toY(node) + toY(previous)) / 2, ux = dx / length, uy = dy / length;
        return <Polyline key={`${node.id}-${index}`} points={[(x - ux * 7 - uy * 5) + "," + (y - uy * 7 + ux * 5), (x + ux * 3) + "," + (y + uy * 3), (x - ux * 7 + uy * 5) + "," + (y - uy * 7 - ux * 5)].join(" ")} fill="none" stroke="white" strokeWidth={2} />;
      })}
      {showEndpoints && [{ node: first, label: "Início", color: colors.origin }, { node: last, label: "Destino", color: colors.destination }]
        .filter((item) => item.node && visible(item.node)).map(({ node, label, color }) => (
          <G key={label}>
            <Circle cx={toX(node)} cy={toY(node)} r={9} fill={color} stroke="white" strokeWidth={2} />
            <SvgText x={Math.max(24, Math.min(width - 24, toX(node)))} y={Math.max(12, toY(node) - 14)} fill={color} fontSize={11} fontWeight="700" textAnchor="middle">{label}</SvgText>
          </G>
        ))}
    </G>
  );
}
