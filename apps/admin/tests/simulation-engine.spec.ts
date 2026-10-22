import { expect, test } from "@playwright/test";
import type { SimulationScheduler } from "../../visitor/positioning/providers/Simulation";
import { entry, destination, makeRoute, floorRoute } from "./fixtures/simulation";
import { loadVisitorModule } from "./visitorModules";

const { buildSimulationTrack, sampleSimulation } =
  loadVisitorModule<typeof import("../../visitor/positioning/routeProgress")>("../../visitor/positioning/routeProgress");
const { advanceSimulation, createSimulationMotion } =
  loadVisitorModule<typeof import("../../visitor/positioning/simulation")>("../../visitor/positioning/simulation");
const { SimulationClock } =
  loadVisitorModule<typeof import("../../visitor/positioning/providers/Simulation")>("../../visitor/positioning/providers/Simulation");
const { initialPositionSession, positionSessionReducer: reduce } =
  loadVisitorModule<typeof import("../../visitor/positioning/session")>("../../visitor/positioning/session");
const { centerOnPosition, followPosition, INITIAL_VIEW, nearbyView } =
  loadVisitorModule<typeof import("../../visitor/components/mapViewport")>("../../visitor/components/mapViewport");
const { remainingRouteEdges } =
  loadVisitorModule<typeof import("../../visitor/components/remainingRoute")>("../../visitor/components/remainingRoute");

test("Movimento independe de FPS e velocidade não altera a geometria", () => {
  const track = buildSimulationTrack(makeRoute(), "TESTE");
  const initial = createSimulationMotion(track, 1000);
  const once = advanceSimulation(initial, 12000, 13000);
  let frames = initial;
  for (let i = 1; i <= 720; i++) frames = advanceSimulation(frames, 12000 / 720, 1000 + i * 12000 / 720);
  expect(frames.progress.traveledMeters).toBeCloseTo(once.progress.traveledMeters, 9);
  expect(frames.progress.position.y).toBeCloseTo(once.progress.position.y, 9);
  expect(once.progress.position.heading).toBeCloseTo(180, 9);
  const fast = advanceSimulation({ ...initial, speed: 4 }, 3000, 13000);
  expect(fast.progress).toEqual(once.progress);
  let complete = initial;
  for (let i = 1; i <= 2520; i++) complete = advanceSimulation(complete, 1000 / 60, 1000 + i * 1000 / 60);
  expect(complete.progress.arrived).toBe(true);
  expect(complete.progress.remainingMeters).toBe(0);
});

for (const kind of ["elevador", "escada", "escada_rolante"] as const) {
  test(`${kind}: permanece no embarque e troca piso somente ao concluir o conector`, () => {
    const track = buildSimulationTrack(floorRoute(kind), "TESTE");
    const before = sampleSimulation(track, 11.99, 1000);
    expect(before.position.floorId).toBe(10);
    const during = sampleSimulation(track, 14, 2000);
    expect(during.instruction.tipo).toBe("troca_piso");
    expect(during.position).toMatchObject({ floorId: 10, x: .5, y: .3, fromNodeId: 3, toNodeId: 3, edgeProgress: 0 });
    expect(during.position.heading).toBeCloseTo(before.position.heading!, 9);
    const after = sampleSimulation(track, 16.7, 3000);
    expect(after.position).toMatchObject({ floorId: 20, x: .6, y: .4, fromNodeId: 4 });
    expect(after.instruction.tipo).toBe("caminho");
    expect(after.remainingMeters).toBeCloseTo(24);
  });
}

test("Câmera 2D orienta o trecho à frente e mantém a seta abaixo do centro", () => {
  const bounds = { width: 390, height: 400, mapWidth: 330, mapHeight: 320 };
  for (const heading of [0, 90, 180, 270]) {
    const view = followPosition({ ...INITIAL_VIEW, zoom: 2.5 }, { x: .5, y: .5, heading }, bounds);
    expect(view.rotation).toBe(-heading);
    expect(view.zoom).toBe(2.5);
    expect(view.x).toBeCloseTo(0);
    // Sem nextTurn, o deslocamento fixo posiciona a seta a 60% da altura.
    expect(bounds.height / 2 + view.y).toBeCloseTo(bounds.height * .6, 6);
  }
  const thinFloor = { width: 390, height: 400, mapWidth: 150, mapHeight: 300 };
  const nearby = nearbyView(thinFloor, { x: .5, y: .1 });
  expect(nearby.zoom).toBeGreaterThan(2);
  expect(nearby.rotation).toBe(0);
  const centered = centerOnPosition({ ...INITIAL_VIEW, zoom: 2.5, rotation: -90 }, { x: .5, y: .5 }, bounds);
  expect(centered.x).toBeCloseTo(0);
  expect(centered.y).toBeCloseTo(0);
  const beforeLeftTurn = followPosition({ ...INITIAL_VIEW, zoom: 1.6 }, { x: .5, y: .5, heading: 0 }, bounds, { x: .25, y: .3 });
  expect(beforeLeftTurn.x).toBeGreaterThan(0);
});

test("Linha da rota encolhe no trecho atual e não reaparece após a chegada", () => {
  const turn = { ...entry, id: 3, coord_x: .7 };
  const nodes = makeRoute([entry, turn, { ...destination, coord_x: .7 }], [12, 42]).nos;
  const base = { source: "simulation" as const, shoppingCode: "TESTE", floorId: 10, heading: 90,
    edgeProgress: .5, observedAt: 1000, routeRevision: "r1" };
  const halfway = remainingRouteEdges(nodes, { ...base, x: .6, y: .1, fromNodeId: 1, toNodeId: 3 });
  expect(halfway).toHaveLength(2);
  expect(halfway[0].from.coord_x).toBeCloseTo(.6);
  const afterTurn = remainingRouteEdges(nodes, { ...base, x: .7, y: .4, fromNodeId: 3, toNodeId: 2 });
  expect(afterTurn).toHaveLength(1);
  expect(afterTurn[0].from.coord_y).toBeCloseTo(.4);
  expect(remainingRouteEdges(nodes, { ...base, x: .7, y: .8, fromNodeId: 2, toNodeId: 2 })).toHaveLength(0);
  expect(remainingRouteEdges(nodes)).toHaveLength(2);
});

test("Distâncias exatas preservam trechos pequenos e contornos, sem atalhos entre nós", () => {
  const corner = { ...entry, id: 3, coord_x: .7 };
  const track = buildSimulationTrack(makeRoute([entry, corner, destination], [.01234, 3.45678]), "TESTE");
  expect(track.totalMeters).toBeCloseTo(3.46912, 10);
  const first = sampleSimulation(track, .00617, 1000);
  expect(first.position.x).toBeCloseTo(.6);
  expect(first.position.y).toBe(.1);
  expect(sampleSimulation(track, .01234, 1000).position.fromNodeId).toBe(corner.id);
  const end = sampleSimulation(track, 100, 1000);
  expect(end.arrived).toBe(true);
  expect(end.position).toMatchObject({ x: destination.coord_x, y: destination.coord_y, fromNodeId: destination.id });
  expect(end.remainingMeters).toBe(0);
});

test("Compilação recusa saltos de piso, etapas divergentes e distâncias inválidas/antigas", () => {
  const badConnector = floorRoute(); badConnector.nos[2] = { ...badConnector.nos[2], tipo: "loja" };
  const badStep = makeRoute(); badStep.etapas![1].no_destino_id = 999;
  const badTotal = makeRoute(); badTotal.distancia_total_metros = 45;
  const badCoordinate = makeRoute(); badCoordinate.nos = [{ ...entry, coord_x: NaN }, destination];
  const missing = makeRoute(); delete missing.etapas![1].distancia_exata_metros;
  for (const route of [badConnector, badStep, badTotal, badCoordinate, missing]) {
    expect(() => buildSimulationTrack(route, "TESTE")).toThrow();
  }
  for (const value of [0, -1, NaN, Infinity]) {
    const route = makeRoute(); route.etapas![1].distancia_exata_metros = value;
    expect(() => buildSimulationTrack(route, "TESTE")).toThrow();
  }
});

function fakeScheduler() {
  let time = 0, wall = 1000, id = 0;
  const pending = new Map<number, () => void>();
  const scheduler: SimulationScheduler = {
    now: () => time, wallTime: () => wall,
    request: (fn) => { pending.set(++id, fn); return id; }, cancel: (key) => { pending.delete(key); },
  };
  return { scheduler, pending, advance: (ms: number, frame = true) => {
    time += ms; wall += ms;
    if (frame) { const callbacks = [...pending.values()]; pending.clear(); callbacks.forEach((fn) => fn()); }
  }, changeWall: (ms: number) => { wall += ms; } };
}

test("Relógio e sessão: pausa não caminha, retomada não recupera tempo invisível e QR cancela ticks", () => {
  const fake = fakeScheduler();
  const clock = new SimulationClock(fake.scheduler);
  let session = reduce(initialPositionSession, { type: "confirm", node: entry, source: "qr", shoppingCode: "TESTE", revision: "r1", at: 1000 });
  session = reduce(session, { type: "start", route: makeRoute(), revision: "r1", at: 1000 });
  const listen = (tick: Parameters<typeof reduce>[1]) => { session = reduce(session, tick); };
  clock.start(session.generation, listen);
  fake.advance(1000);
  fake.advance(500, false); clock.flush(); clock.stop(); session = reduce(session, { type: "pause" });
  const paused = session;
  fake.advance(60000);
  expect(session).toBe(paused);
  expect(session.motion?.progress.traveledMeters).toBe(1.5);
  session = reduce(session, { type: "speed", speed: 2 });
  session = reduce(session, { type: "resume", revision: "r1" });
  clock.start(session.generation, listen);
  const stale = [...fake.pending.values()][0];
  fake.advance(1000);
  expect(session.motion?.progress.traveledMeters).toBe(3.5);
  clock.stop(); session = reduce(session, { type: "confirm", node: destination, source: "qr", shoppingCode: "TESTE", revision: "r1", at: 65000 });
  const corrected = session;
  stale(); fake.advance(1000);
  expect(session).toBe(corrected);
  expect(fake.pending.size).toBe(0);
});

test("Movimento reduzido diminui atualizações sem perder distância ao pausar", () => {
  const fake = fakeScheduler(), clock = new SimulationClock(fake.scheduler);
  const ticks: number[] = [];
  clock.setMinTickMs(1000);
  clock.start(1, (tick) => ticks.push(tick.elapsedMs));
  for (let i = 0; i < 4; i++) fake.advance(200);
  expect(ticks).toEqual([]);
  fake.advance(200);
  expect(ticks).toEqual([1000]);
  fake.advance(250);
  clock.flush(); clock.stop();
  expect(ticks).toEqual([1000, 250]);
});

test("Mudança do relógio civil e callbacks de execução anterior não alteram duração", () => {
  const fake = fakeScheduler();
  const clock = new SimulationClock(fake.scheduler);
  const ticks: { generation: number; elapsedMs: number; at: number }[] = [];
  clock.start(1, (tick) => ticks.push(tick));
  const stale = [...fake.pending.values()][0];
  fake.advance(100);
  fake.changeWall(-100000);
  fake.advance(100);
  expect(ticks.map((tick) => tick.elapsedMs)).toEqual([100, 100]);
  expect(ticks[1].at).toBeGreaterThan(ticks[0].at);
  clock.start(2, (tick) => ticks.push(tick));
  stale();
  expect(fake.pending.size).toBe(1);
  fake.advance(500);
  expect(ticks[2]).toMatchObject({ generation: 2, elapsedMs: 500 });
  expect(ticks[2].at).toBeGreaterThan(ticks[1].at);
  clock.stop();
});

test("A chegada em um quadro encerra o relógio sem agendar outro callback", () => {
  const fake = fakeScheduler(), clock = new SimulationClock(fake.scheduler);
  clock.start(1, () => clock.stop());
  fake.advance(1000);
  expect(fake.pending.size).toBe(0);
});
