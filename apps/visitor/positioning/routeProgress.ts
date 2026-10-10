import type { EtapaRota, NoRota, RotaResponse } from "../types";
import type { PositionEstimate } from "./types";

export type SimulationSegment = {
  from: NoRota;
  to: NoRota;
  instruction: EtapaRota;
  startMeters: number;
  endMeters: number;
  distanceMeters: number;
  vertical: boolean;
  /** Fração já percorrida da aresta completa ao conectar uma nova rota. */
  startProgress?: number;
};

export type SimulationTrack = {
  shoppingCode: string;
  revision: string;
  segments: SimulationSegment[];
  totalMeters: number;
  arrival: EtapaRota;
  destination: NoRota;
};

export type SimulationProgress = {
  position: PositionEstimate;
  traveledMeters: number;
  remainingMeters: number;
  segmentIndex: number;
  instruction: EtapaRota;
  arrived: boolean;
};

function invariant(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function validNode(node: NoRota): boolean {
  return Number.isInteger(node.id) && node.id > 0 && Number.isInteger(node.piso_id) && node.piso_id > 0 &&
    [node.coord_x, node.coord_y].every((value) => Number.isFinite(value) && value >= 0 && value <= 1);
}

function matches(step: EtapaRota, from: NoRota, to: NoRota): boolean {
  return step.no_origem_id === from.id && step.no_destino_id === to.id &&
    step.piso_origem_id === from.piso_id && step.piso_destino_id === to.piso_id;
}

function heading(from: NoRota, to: NoRota): number {
  const dx = to.coord_x - from.coord_x;
  const dy = to.coord_y - from.coord_y;
  if (Math.hypot(dx, dy) < 1e-9) return 0;
  return Math.atan2(dx, -dy) * 180 / Math.PI;
}

/** Compila somente o caminho autorizado pela API; não procura rotas no cliente. */
export function buildSimulationTrack(route: RotaResponse, shoppingCode: string): SimulationTrack {
  invariant(route.sucesso && !!shoppingCode && !!route.revisao && route.nos.length >= 1,
    "Escolha uma rota válida antes de iniciar a demonstração.");
  invariant(route.nos.every(validNode), "A rota contém uma posição inválida.");
  const steps = route.etapas;
  invariant(!!steps && steps.length === route.nos.length + 1, "A rota não contém todos os trechos necessários à demonstração.");
  const first = route.nos[0], last = route.nos[route.nos.length - 1];
  const arrival = steps[steps.length - 1];
  invariant(steps[0].tipo === "inicio" && matches(steps[0], first, first) &&
    arrival.tipo === "chegada" && matches(arrival, last, last), "O início ou a chegada da rota não corresponde aos nós.");
  let totalMeters = 0;
  const segments = route.nos.slice(0, -1).map((from, index): SimulationSegment => {
    const to = route.nos[index + 1], instruction = steps[index + 1];
    const distance = instruction.distancia_exata_metros;
    invariant(typeof distance === "number" && Number.isFinite(distance) && distance > 0,
      "Atualize a rota: faltam distâncias exatas válidas para a demonstração.");
    const vertical = from.piso_id !== to.piso_id;
    invariant(from.id !== to.id && matches(instruction, from, to) &&
      instruction.tipo === (vertical ? "troca_piso" : "caminho"), "Um trecho não corresponde à sequência da rota.");
    invariant(!vertical || (from.tipo === to.tipo && ["escada", "escada_rolante", "elevador"].includes(from.tipo)),
      "A mudança de piso não possui um conector válido.");
    const startMeters = totalMeters;
    totalMeters += distance;
    invariant(Number.isFinite(totalMeters), "A distância da rota é inválida.");
    return { from: { ...from }, to: { ...to }, instruction: { ...instruction },
      startMeters, endMeters: totalMeters, distanceMeters: distance, vertical };
  });
  // O total público é arredondado a duas casas; não redistribuir seu erro nas arestas.
  invariant(Number.isFinite(route.distancia_total_metros) && Math.abs(totalMeters - route.distancia_total_metros) <= .00500001,
    "As distâncias dos trechos não correspondem ao total da rota.");
  return { shoppingCode, revision: route.revisao, segments, totalMeters, arrival: { ...arrival }, destination: { ...last } };
}

/** Uma mesma distância sempre produz a mesma posição, qualquer que seja o FPS. */
export function sampleSimulation(track: SimulationTrack, traveledMeters: number, observedAt: number): SimulationProgress {
  invariant(Number.isFinite(traveledMeters) && traveledMeters >= 0 && Number.isFinite(observedAt), "Progresso inválido.");
  const traveled = track.totalMeters - traveledMeters <= 1e-9 ? track.totalMeters : traveledMeters;
  const arrived = traveled >= track.totalMeters;
  if (arrived) {
    const node = track.destination;
    const previous = track.segments[track.segments.length - 1];
    return { position: { source: "simulation", shoppingCode: track.shoppingCode, routeRevision: track.revision,
      floorId: node.piso_id, x: node.coord_x, y: node.coord_y,
      fromNodeId: node.id, toNodeId: node.id, edgeProgress: 0, heading: previous ? heading(previous.from, previous.to) : 0, observedAt },
      traveledMeters: track.totalMeters, remainingMeters: 0, segmentIndex: Math.max(0, track.segments.length - 1),
      instruction: track.arrival, arrived: true };
  }
  // Busca binária evita percorrer toda a rota a cada quadro.
  let low = 0, high = track.segments.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (track.segments[middle].endMeters <= traveled) low = middle + 1;
    else high = middle;
  }
  const segment = track.segments[low];
  const directionSegment = segment.vertical
    ? track.segments.slice(0, low).reverse().find((item) => !item.vertical)
      ?? track.segments.slice(low + 1).find((item) => !item.vertical)
    : segment;
  const localProgress = Math.min(1, Math.max(0, (traveled - segment.startMeters) / segment.distanceMeters));
  const progress = (segment.startProgress ?? 0) + (1 - (segment.startProgress ?? 0)) * localProgress;
  const node = arrived ? segment.to : segment.from;
  // No acesso vertical, permanece no embarque até concluir o trecho. Nunca cruza pisos por interpolação 2D.
  const interpolate = !arrived && !segment.vertical;
  return {
    position: {
      source: "simulation", shoppingCode: track.shoppingCode, routeRevision: track.revision,
      floorId: node.piso_id,
      x: interpolate ? segment.from.coord_x + (segment.to.coord_x - segment.from.coord_x) * progress : node.coord_x,
      y: interpolate ? segment.from.coord_y + (segment.to.coord_y - segment.from.coord_y) * progress : node.coord_y,
      fromNodeId: node.id, toNodeId: arrived || segment.vertical ? node.id : segment.to.id,
      edgeProgress: interpolate ? progress : 0,
      heading: directionSegment ? heading(directionSegment.from, directionSegment.to) : 0, observedAt,
    },
    traveledMeters: traveled, remainingMeters: Math.max(0, track.totalMeters - traveled),
    segmentIndex: low, instruction: arrived ? track.arrival : segment.instruction, arrived,
  };
}
