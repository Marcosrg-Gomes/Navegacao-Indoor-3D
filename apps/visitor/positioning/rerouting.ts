import type { GraphResponse, No, Piso, RotaResponse, Shopping } from "../types";
import type { PositionSession, PositionEstimate } from "./types";
import { buildSimulationTrack, type SimulationSegment } from "./routeProgress";
import { createSimulationMotion } from "./simulation";

export type SimulationRouteApi = {
  getNavigationState: (id: number) => Promise<{ revisao: string; ativo: boolean }>;
  listFloors: (id: number) => Promise<Piso[]>;
  getFloorGraph: (id: number) => Promise<GraphResponse>;
  getRouteDistances: (id: number, accessible: boolean) => Promise<Record<string, number>>;
  calculateRoute: (from: number, to: number, accessible: boolean, allowUnavailable: boolean) => Promise<RotaResponse>;
};

type Connection = { node: No; prefix?: SimulationSegment };

function samePoint(node: No, position: PositionEstimate) {
  return node.piso_id === position.floorId && Math.abs(node.coord_x - position.x) < 1e-8 && Math.abs(node.coord_y - position.y) < 1e-8;
}

/** Só usa a aresta ocupada, com sentido e acessibilidade verificados no grafo atual. */
export function simulationConnections(position: PositionEstimate, graph: GraphResponse, accessible: boolean): Connection[] {
  if (position.floorId !== graph.piso_id) throw new Error("O piso da posição simulada está indisponível.");
  const from = graph.nos.find((node) => node.id === position.fromNodeId && node.ativo);
  const to = graph.nos.find((node) => node.id === position.toNodeId && node.ativo);
  if (!from || !to) throw new Error("A posição simulada não está mais no mapa. Corrija a origem.");
  if (samePoint(from, position)) return [{ node: from }];
  if (samePoint(to, position)) return [{ node: to }];
  const p = position.edgeProgress;
  if (!(p > 0 && p < 1) ||
      Math.abs(position.x - (from.coord_x + (to.coord_x - from.coord_x) * p)) > 1e-8 ||
      Math.abs(position.y - (from.coord_y + (to.coord_y - from.coord_y) * p)) > 1e-8) {
    throw new Error("A geometria mudou no ponto simulado. Corrija a origem antes de continuar.");
  }
  const connections: Connection[] = [];
  for (const [a, b, progress] of [[from, to, p], [to, from, 1 - p]] as const) {
    if (accessible && [a.tipo, b.tipo].some((type) => type === "escada" || type === "escada_rolante")) continue;
    const edges = graph.arestas.filter((edge) => edge.ativa && (!accessible || edge.acessivel) &&
      ((edge.no_origem_id === a.id && edge.no_destino_id === b.id) ||
        (edge.bidirecional && edge.no_destino_id === a.id && edge.no_origem_id === b.id)) &&
      typeof edge.distancia === "number" && Number.isFinite(edge.distancia) && edge.distancia > 0);
    if (!edges.length) continue;
    const distance = Math.min(...edges.map((edge) => edge.distancia!)) * (1 - progress);
    connections.push({ node: b, prefix: {
      from: a, to: b, startProgress: progress, startMeters: 0, endMeters: distance, distanceMeters: distance, vertical: false,
      instruction: { tipo: "caminho", texto: `Continue por ${distance.toFixed(1)} m até ${b.tipo === "corredor" ? "o próximo trecho" : b.nome || "o ponto de ligação"}.`,
        no_origem_id: a.id, no_destino_id: b.id, piso_origem_id: a.piso_id, piso_destino_id: b.piso_id,
        distancia_metros: Math.round(distance * 10) / 10, distancia_exata_metros: distance },
    } });
  }
  if (!connections.length) throw new Error("O trecho da posição simulada está bloqueado ou não permite este modo de rota. Corrija a origem.");
  return connections.sort((a, b) => a.prefix!.distanceMeters - b.prefix!.distanceMeters || a.node.id - b.node.id);
}

/** Não consulta /routes com origem=destino; o trajeto nulo não inventa movimento. */
function stationaryRoute(node: No, revision: string): RotaResponse {
  const step = { no_origem_id: node.id, no_destino_id: node.id, piso_origem_id: node.piso_id,
    piso_destino_id: node.piso_id, distancia_metros: 0, distancia_exata_metros: 0 };
  const etapas: NonNullable<RotaResponse["etapas"]> = [
    { ...step, tipo: "inicio", texto: "Ponto de partida da demonstração." },
    { ...step, tipo: "chegada", texto: "Chegada simulada." },
  ];
  return { sucesso: true, revisao: revision, nos: [node], distancia_total_metros: 0, etapas, instrucoes: etapas.map((item) => item.texto) };
}

export async function requestSimulationRoute(options: {
  session: PositionSession; shopping: Shopping; destinationId: number; accessible: boolean;
  allowUnavailable: boolean; deviation?: boolean; deviationNodeId?: number;
  isCurrent: () => boolean; now: () => number;
}, api: SimulationRouteApi) {
  const { session, shopping, destinationId, accessible, allowUnavailable, isCurrent } = options;
  const position = session.simulated;
  if (!position || !session.motion || position.shoppingCode !== shopping.codigo) throw new Error("Inicie uma demonstração neste shopping.");
  const check = () => { if (!isCurrent()) throw new Error("Recálculo substituído por uma ação mais recente."); };
  check();
  const state = await api.getNavigationState(shopping.id); check();
  if (!state.ativo) throw new Error("Este shopping está indisponível.");
  const floors = await api.listFloors(shopping.id); check();
  if (!floors.some((floor) => floor.id === position.floorId)) throw new Error("O piso simulado está indisponível. Corrija a origem.");
  const graph = await api.getFloorGraph(position.floorId); check();
  const connections = simulationConnections(position, graph, accessible);
  let selected: Connection | undefined;
  let route: RotaResponse | undefined;
  for (const connection of connections) {
    // Uma única busca da API permite escolher ligação/desvio alcançável sem outro Dijkstra no cliente.
    const distances = await api.getRouteDistances(connection.node.id, accessible); check();
    let candidate = connection;
    if (options.deviation) {
      const routeIds = new Set(session.motion.track.segments.flatMap((segment) => [segment.from.id, segment.to.id]));
      const candidates = graph.nos.filter((node) => node.ativo && node.id !== destinationId &&
        node.id !== connection.node.id && Number.isFinite(distances[node.id]) && distances[node.id] > 0 &&
        (options.deviationNodeId === undefined || node.id === options.deviationNodeId))
        .sort((a, b) => Number(routeIds.has(a.id)) - Number(routeIds.has(b.id)) || distances[a.id] - distances[b.id] || a.id - b.id);
      if (!candidates.length) continue;
      candidate = { node: candidates[0] };
    } else if (connection.node.id !== destinationId && !Number.isFinite(distances[destinationId])) continue;
    selected = candidate;
    route = candidate.node.id === destinationId ? stationaryRoute(candidate.node, state.revisao)
      : await api.calculateRoute(candidate.node.id, destinationId, accessible, allowUnavailable);
    check();
    break;
  }
  if (!route || !selected) throw new Error(options.deviation ? "Não há outro ponto alcançável neste piso para simular um desvio." : "Não há rota disponível a partir da posição simulada.");
  const after = await api.getNavigationState(shopping.id); check();
  if (!after.ativo || state.revisao !== after.revisao || route.revisao !== after.revisao) {
    throw new Error("O mapa mudou durante o recálculo. Tente novamente.");
  }
  if (route.nos[0]?.id !== selected.node.id || route.nos[route.nos.length - 1]?.id !== destinationId) {
    throw new Error("A resposta da rota não corresponde à origem e ao destino solicitados.");
  }
  const track = buildSimulationTrack(route, shopping.codigo);
  if (selected.prefix) {
    const offset = selected.prefix.distanceMeters;
    track.segments = [selected.prefix, ...track.segments.map((segment) => ({ ...segment, startMeters: segment.startMeters + offset, endMeters: segment.endMeters + offset }))];
    track.totalMeters += offset;
  }
  const motion = createSimulationMotion(track, options.now());
  motion.speed = session.motion.speed;
  return { route, motion, origin: selected.node, notice: options.deviation
    ? `Desvio simulado para ${selected.node.nome || selected.node.codigo}.`
    : selected.prefix ? "Rota calculada a partir do ponto de ligação mais próximo permitido; o trecho até ele está incluído." : null };
}
