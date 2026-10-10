import { expect, test } from "@playwright/test";
import { requestSimulationRoute, simulationConnections, type SimulationRouteApi } from "../../visitor/positioning/rerouting";
import { initialPositionSession, positionSessionReducer as reduce } from "../../visitor/positioning/session";
import { sampleSimulation } from "../../visitor/positioning/routeProgress";
import type { GraphResponse, No } from "../../visitor/types";
import { entry, destination, makeRoute } from "./fixtures/simulation";

const shopping = { id: 1, codigo: "TESTE", nome: "Teste", ativo: true };
const next: No = { ...destination, id: 3, codigo: "PROXIMA", coord_x: .8 };
function setup(progress = 0.25) {
  let session = reduce(initialPositionSession, { type: "confirm", node: entry, shoppingCode: "TESTE", source: "qr", at: 1000, revision: "r1" });
  session = reduce(session, { type: "start", route: makeRoute(), revision: "r1", at: 1000 });
  session = reduce(session, { type: "tick", generation: session.generation, elapsedMs: 42000 * progress, at: 100000 });
  const graph: GraphResponse = { piso_id: 10, piso_nome: "Térreo", nos: [entry, destination, next],
    arestas: [{ id: 1, no_origem_id: 1, no_destino_id: 2, distancia: 42, bidirecional: true, acessivel: true, ativa: true }] };
  const calls: number[] = [];
  const api: SimulationRouteApi = {
    getNavigationState: async () => ({ ativo: true, revisao: "r1" }),
    listFloors: async () => [{ id: 10, codigo: "T", shopping_id: 1, nome: "Térreo", nivel: 0, ativo: true }],
    getFloorGraph: async () => graph,
    getRouteDistances: async (id) => ({ 1: id === 1 ? 0 : 42, 2: id === 2 ? 0 : 42, 3: id === 3 ? 0 : 12 }),
    calculateRoute: async (from, to) => { calls.push(from); return makeRoute([graph.nos.find((n) => n.id === from)!, graph.nos.find((n) => n.id === to)!], [12]); },
  };
  const options = { session, shopping, destinationId: next.id, accessible: false, allowUnavailable: false, isCurrent: () => true, now: () => 100001 };
  return { session, graph, api, calls, options };
}

test("Recálculo preserva posição e inclui ligação parcial; repetir recálculo não desloca o marcador", async () => {
  const { options, api, calls } = setup();
  const result = await requestSimulationRoute(options, api);
  expect(calls).toEqual([entry.id]); // Retorno permitido ao extremo mais próximo.
  expect(result.motion.progress.position.x).toBeCloseTo(options.session.simulated!.x);
  expect(result.motion.progress.position.y).toBeCloseTo(options.session.simulated!.y);
  expect(result.motion.progress.remainingMeters).toBeCloseTo(10.5 + 12);
  expect(result.notice).toContain("ligação");
  const halfway = sampleSimulation(result.motion.track, 5.25, 100002);
  expect(halfway.position.y).toBeCloseTo(.1875);
  const newSession = { ...options.session, simulated: halfway.position, motion: { ...result.motion, progress: halfway } };
  const repeated = await requestSimulationRoute({ ...options, session: newSession }, api);
  expect(repeated.motion.progress.position.y).toBeCloseTo(halfway.position.y);
});

test("Aresta de mão única só permite ligação no sentido publicado", () => {
  const { session, graph } = setup(); graph.arestas[0].bidirecional = false;
  const connections = simulationConnections(session.simulated!, graph, false);
  expect(connections.map((item) => item.node.id)).toEqual([destination.id]);
  expect(connections[0].prefix?.distanceMeters).toBeCloseTo(31.5);
});

for (const reason of ["bloqueio", "acessibilidade", "geometria"] as const) {
  test(`Recálculo recusa ${reason} da aresta ocupada sem inventar aproximação`, async () => {
    const { options, api, graph } = setup();
    if (reason === "bloqueio") graph.arestas[0].ativa = false;
    if (reason === "acessibilidade") graph.arestas[0].acessivel = false;
    if (reason === "geometria") graph.nos = [{ ...entry, coord_x: .1 }, destination, next];
    await expect(requestSimulationRoute({ ...options, accessible: true }, api)).rejects.toThrow(/origem/);
  });
}

test("Nova rota após chegada parte da loja simulada e mantém confirmação original", async () => {
  const { options, api, calls, session } = setup(1);
  const pending = reduce(session, { type: "reroute" });
  const result = await requestSimulationRoute({ ...options, session: pending }, api);
  const changed = reduce(pending, { type: "rerouted", generation: pending.generation, motion: result.motion });
  expect(calls).toEqual([destination.id]);
  expect(changed.status).toBe("paused");
  expect(changed.confirmed?.node.id).toBe(entry.id);
  expect(changed.simulated?.fromNodeId).toBe(destination.id);
});

test("Destino igual à posição simulada produz chegada sem requisição de rota inválida", async () => {
  const { options, api, calls } = setup(1);
  const result = await requestSimulationRoute({ ...options, destinationId: destination.id }, api);
  expect(calls).toHaveLength(0);
  expect(result.motion.progress.arrived).toBe(true);
  expect(result.motion.progress.remainingMeters).toBe(0);
});

test("Desvio só aceita nó alcançável no piso e preserva destino", async () => {
  const { options, api, calls } = setup();
  const result = await requestSimulationRoute({ ...options, destinationId: destination.id, deviation: true, deviationNodeId: next.id }, api);
  expect(calls).toEqual([next.id]);
  expect(result.motion.progress.position).toMatchObject({ x: next.coord_x, y: next.coord_y, source: "simulation" });
  expect(result.motion.track.destination.id).toBe(destination.id);
  await expect(requestSimulationRoute({ ...options, deviation: true, deviationNodeId: 999 }, api)).rejects.toThrow(/alcançável/);
});

test("Mudança de revisão durante a resposta congela o progresso e não substitui a rota", async () => {
  const { options, api, session } = setup();
  let count = 0;
  api.getNavigationState = async () => ({ ativo: true, revisao: ++count === 1 ? "r1" : "r2" });
  const pending = reduce(session, { type: "reroute" });
  await expect(requestSimulationRoute(options, api)).rejects.toThrow(/mapa mudou/);
  const failed = reduce(pending, { type: "failed", generation: pending.generation });
  expect(failed.status).toBe("error");
  expect(failed.simulated).toBe(session.simulated);
  expect(failed.motion).toBe(session.motion);
});

test("Resposta tardia após QR/cancelamento não substitui posição nem dispara novas consultas", async () => {
  const { options, api, session, calls } = setup();
  let live = true, release!: () => void;
  api.getFloorGraph = async () => { await new Promise<void>((resolve) => { release = resolve; }); return setup().graph; };
  const pending = requestSimulationRoute({ ...options, isCurrent: () => live }, api);
  await expect.poll(() => !!release).toBe(true);
  live = false; release();
  await expect(pending).rejects.toThrow(/mais recente/);
  expect(calls).toHaveLength(0);
  const rerouting = reduce(session, { type: "reroute" });
  const corrected = reduce(rerouting, { type: "confirm", node: next, source: "qr", shoppingCode: "TESTE", revision: "r1", at: 100005 });
  expect(reduce(corrected, { type: "rerouted", generation: rerouting.generation, motion: session.motion! })).toBe(corrected);
});
