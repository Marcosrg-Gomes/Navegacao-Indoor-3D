import { Polyline, Circle, G, Text as SvgText } from "react-native-svg";
import type { NoRota } from "@/types";
import { coordenadaNormalizada } from "@/types";
import { colors } from "@/constants/colors";

/** Separa segmentos consecutivos por piso, sem unir pontos de andares diferentes. */
export function RouteOverlay({ width, height, routeNodes, floorId }: {
  width: number; height: number; routeNodes: NoRota[]; floorId?: number;
}) {
  const segments: NoRota[][] = [];
  for (const node of routeNodes) {
    const last = segments[segments.length - 1];
    if (!last || last[0].piso_id !== node.piso_id) segments.push([node]);
    else last.push(node);
  }
  const toX = (n: NoRota) => coordenadaNormalizada(n.coord_x) * width;
  const toY = (n: NoRota) => coordenadaNormalizada(n.coord_y) * height;
  const visible = (n: NoRota) => floorId === undefined || n.piso_id === floorId;
  const first = routeNodes[0];
  const last = routeNodes[routeNodes.length - 1];
  return (
    <G>
      {segments.filter((s) => s.length > 1 && visible(s[0])).map((s, i) => (
        <Polyline key={i} points={s.map((n) => toX(n) + "," + toY(n)).join(" ")}
          fill="none" stroke={colors.route} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {[{ node: first, label: "Início", color: colors.origin }, { node: last, label: "Destino", color: colors.destination }]
        .filter((item) => item.node && visible(item.node)).map(({ node, label, color }) => (
          <G key={label}>
            <Circle cx={toX(node)} cy={toY(node)} r={9} fill={color} stroke="white" strokeWidth={2} />
            <SvgText x={Math.max(24, Math.min(width - 24, toX(node)))} y={Math.max(12, toY(node) - 14)} fill={color} fontSize={11} fontWeight="700" textAnchor="middle">{label}</SvgText>
          </G>
        ))}
    </G>
  );
}
