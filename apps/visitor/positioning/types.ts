import type { No } from "../types";
import type { SimulationMotion } from "./simulation";

export type LocationSource = "qr" | "manual" | "arrival";
export type PositionSource = LocationSource | "simulation";

export type PositionEstimate = {
  source: PositionSource;
  shoppingCode: string;
  floorId: number;
  x: number;
  y: number;
  fromNodeId: number;
  toNodeId: number;
  edgeProgress: number;
  /** Rumo do deslocamento em graus: 0 aponta para cima, 90 para a direita. */
  heading?: number;
  observedAt: number;
  routeRevision: string | null;
};

export type ConfirmedPosition = {
  node: No;
  estimate: PositionEstimate & { source: LocationSource };
};

export type SimulationStatus = "idle" | "running" | "paused" | "rerouting" | "arrived" | "error";

/** A confirmação é a única fonte de originNode; simular nunca a sobrescreve. */
export type PositionSession = {
  confirmed: ConfirmedPosition | null;
  simulated: PositionEstimate | null;
  motion: SimulationMotion | null;
  status: SimulationStatus;
  /** Invalida observações enfileiradas quando a sessão para ou muda de origem. */
  generation: number;
};
