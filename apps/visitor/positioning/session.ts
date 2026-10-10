import type { No, RotaResponse } from "../types";
import type { LocationSource, PositionEstimate, PositionSession } from "./types";
import { buildSimulationTrack } from "./routeProgress";
import { advanceSimulation, createSimulationMotion, SIMULATION_SPEEDS, type SimulationSpeed, type SimulationMotion } from "./simulation";
import type { SimulationTick } from "./providers/Simulation";

export const initialPositionSession: PositionSession = {
  confirmed: null,
  simulated: null,
  motion: null,
  status: "idle",
  generation: 0,
};

export type PositionEvent =
  | { type: "confirm"; node: No; shoppingCode: string; source: LocationSource; at: number; revision: string | null }
  | { type: "reset" }
  | { type: "stop" }
  | { type: "start"; route: RotaResponse; revision: string; at: number }
  | { type: "pause" }
  | { type: "resume"; revision: string }
  | { type: "speed"; speed: SimulationSpeed }
  | { type: "reroute" }
  | { type: "rerouted"; generation: number; motion: SimulationMotion }
  | { type: "failed"; generation: number }
  | SimulationTick;

export function currentPosition(session: PositionSession): PositionEstimate | null {
  return session.simulated ?? session.confirmed?.estimate ?? null;
}

function validCoordinates(x: number, y: number): boolean {
  return Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x <= 1 && y >= 0 && y <= 1;
}

/** Transições puras: tempo vem dos eventos, nunca de um relógio oculto. */
export function positionSessionReducer(state: PositionSession, event: PositionEvent): PositionSession {
  switch (event.type) {
    case "confirm": {
      const { node, shoppingCode, source, at, revision } = event;
      if (!node.ativo || !shoppingCode || !validCoordinates(node.coord_x, node.coord_y) || !Number.isFinite(at)) return state;
      return {
        confirmed: {
          node,
          estimate: {
            source, shoppingCode, floorId: node.piso_id,
            x: node.coord_x, y: node.coord_y,
            fromNodeId: node.id, toNodeId: node.id, edgeProgress: 0,
            observedAt: at, routeRevision: revision,
          },
        },
        simulated: null,
        motion: null,
        status: "idle",
        generation: state.generation + 1,
      };
    }
    case "reset":
      return { ...initialPositionSession, generation: state.generation + 1 };
    case "stop":
      return { ...state, simulated: null, motion: null, status: "idle", generation: state.generation + 1 };
    case "start": {
      const first = event.route.nos[0];
      const confirmed = state.confirmed;
      if (state.status !== "idle" || !confirmed || !event.route.sucesso || event.route.nos.length < 2 ||
          !event.revision || event.route.revisao !== event.revision ||
          first.id !== confirmed.node.id || first.piso_id !== confirmed.node.piso_id ||
          !validCoordinates(first.coord_x, first.coord_y) || !Number.isFinite(event.at)) return state;
      let motion;
      try { motion = createSimulationMotion(buildSimulationTrack(event.route, confirmed.estimate.shoppingCode), event.at); }
      catch { return state; }
      return {
        ...state,
        simulated: motion.progress.position,
        motion,
        status: "running",
        generation: state.generation + 1,
      };
    }
    case "pause":
      // Uma observação já enfileirada antes da pausa também fica inválida.
      return state.status === "running"
        ? { ...state, status: "paused", generation: state.generation + 1 } : state;
    case "resume":
      return state.status === "paused" && state.simulated?.routeRevision === event.revision
        ? { ...state, status: "running", generation: state.generation + 1 } : state;
    case "speed":
      return state.motion && (state.status === "running" || state.status === "paused") && SIMULATION_SPEEDS.includes(event.speed)
        ? { ...state, motion: { ...state.motion, speed: event.speed } } : state;
    case "reroute":
      return state.simulated ? { ...state, status: "rerouting", generation: state.generation + 1 } : state;
    case "failed":
      return state.status === "rerouting" && state.generation === event.generation ? { ...state, status: "error" } : state;
    case "rerouted":
      if (state.status !== "rerouting" || state.generation !== event.generation ||
          event.motion.track.shoppingCode !== state.simulated?.shoppingCode) return state;
      return { ...state, motion: event.motion, simulated: event.motion.progress.position,
        status: event.motion.progress.arrived ? "arrived" : "paused", generation: state.generation + 1 };
    case "tick": {
      if (state.status !== "running" || event.generation !== state.generation || !state.motion) return state;
      const motion = advanceSimulation(state.motion, event.elapsedMs, event.at);
      if (motion === state.motion) return state;
      return { ...state, motion, simulated: motion.progress.position,
        status: motion.progress.arrived ? "arrived" : "running" };
    }
  }
}
