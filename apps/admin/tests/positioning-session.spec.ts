import { expect, test } from "@playwright/test";
import { currentPosition, initialPositionSession, positionSessionReducer as reduce } from "../../visitor/positioning/session";
import type { PositionEvent } from "../../visitor/positioning/session";
import { entry, destination, makeRoute } from "./fixtures/simulation";

const route = makeRoute();
const confirm = (node = entry, source: "qr" | "manual" | "arrival" = "qr"): PositionEvent => ({
  type: "confirm", node, source, shoppingCode: "SHOPPING_TESTE", at: 1000, revision: "r1",
});
const start: PositionEvent = { type: "start", route, revision: "r1", at: 2000 };
const confirmed = () => reduce(initialPositionSession, confirm());
const running = () => reduce(confirmed(), start);

test("QR → simulação → pausa → QR mantém confirmação e descarta quadros antigos", () => {
  let session = running();
  const generation = session.generation;
  const tick: PositionEvent = { type: "tick", generation, elapsedMs: 18000, at: 20000 };
  session = reduce(session, tick);
  const observed = currentPosition(session);
  expect(observed?.y).toBeCloseTo(.4);
  expect(session.confirmed?.node).toEqual(entry);
  expect(session.confirmed?.estimate.source).toBe("qr");
  session = reduce(session, { type: "pause" });
  expect(reduce(session, tick)).toBe(session);
  expect(currentPosition(session)).toEqual(observed);
  session = reduce(session, confirm(destination));
  expect(session.status).toBe("idle");
  expect(session.simulated).toBeNull();
  expect(currentPosition(session)).toMatchObject({ source: "qr", fromNodeId: destination.id, y: destination.coord_y });
  expect(reduce(session, tick)).toBe(session);
});

test("Retomar exige a mesma revisão e não aceita o quadro anterior à pausa", () => {
  const active = running();
  const paused = reduce(active, { type: "pause" });
  expect(reduce(paused, { type: "resume", revision: "r2" })).toBe(paused);
  const resumed = reduce(paused, { type: "resume", revision: "r1" });
  expect(resumed.status).toBe("running");
  expect(currentPosition(resumed)).toBe(currentPosition(paused));
  expect(reduce(resumed, { type: "tick", generation: active.generation, elapsedMs: 1000, at: 3000 })).toBe(resumed);
});

test("Encerrar/cancelar preserva a confirmação e resetar não herda posição de outro shopping", () => {
  const active = running();
  const stopped = reduce(active, { type: "stop" });
  expect(currentPosition(stopped)).toEqual(active.confirmed?.estimate);
  expect(stopped.status).toBe("idle");
  const reset = reduce(active, { type: "reset" });
  expect(currentPosition(reset)).toBeNull();
  expect(reset.confirmed).toBeNull();
  const restarted = reduce(stopped, start);
  expect(reduce(restarted, { type: "tick", generation: active.generation, elapsedMs: 1000, at: 3000 })).toBe(restarted);
});

for (const source of ["qr", "manual", "arrival"] as const) {
  test(`${source} atualiza nó, piso, horário e fonte juntos, interrompendo simulação`, () => {
    const upstairs = { ...destination, piso_id: 20 };
    const session = reduce(running(), confirm(upstairs, source));
    expect(session.confirmed?.node).toEqual(upstairs);
    expect(currentPosition(session)).toMatchObject({ source, floorId: 20, observedAt: 1000, fromNodeId: upstairs.id, toNodeId: upstairs.id, edgeProgress: 0 });
    expect(session.status).toBe("idle");
    expect(session.simulated).toBeNull();
  });
}

test("Início exige origem confirmada e uma rota válida da revisão e origem atuais", () => {
  expect(reduce(initialPositionSession, start)).toBe(initialPositionSession);
  const base = confirmed();
  for (const invalid of [
    { ...route, sucesso: false },
    { ...route, revisao: "antiga" },
    { ...route, nos: [] },
    { ...route, nos: [entry] },
    { ...route, nos: [destination, entry] },
    { ...route, nos: [{ ...entry, piso_id: 20 }, destination] },
  ]) expect(reduce(base, { ...start, route: invalid } as PositionEvent)).toBe(base);
  const active = running();
  expect(reduce(active, start)).toBe(active);
});

test("Tempo inválido ou anterior não altera a posição; ticks não podem fornecer coordenadas", () => {
  const active = running();
  const invalidTicks = [
    { elapsedMs: 100, at: 1500 }, { elapsedMs: 100, at: NaN },
    { elapsedMs: NaN, at: 3000 }, { elapsedMs: -100, at: 3000 },
    { elapsedMs: Infinity, at: 3000 }, { elapsedMs: 0, at: 3000 },
  ];
  for (const tick of invalidTicks) {
    expect(reduce(active, { type: "tick", generation: active.generation, ...tick })).toBe(active);
  }
});

test("Chegada simulada mantém confirmação física; encerrar restaura a origem", () => {
  const active = running();
  const arrived = reduce(active, { type: "tick", generation: active.generation, elapsedMs: 50000, at: 52000 });
  expect(arrived.status).toBe("arrived");
  expect(arrived.simulated).toMatchObject({ source: "simulation", fromNodeId: destination.id, toNodeId: destination.id });
  expect(arrived.motion?.progress.remainingMeters).toBe(0);
  expect(arrived.confirmed).toBe(active.confirmed);
  expect(reduce(arrived, { type: "tick", generation: active.generation, elapsedMs: 1000, at: 53000 })).toBe(arrived);
  expect(currentPosition(reduce(arrived, { type: "stop" }))).toBe(active.confirmed?.estimate);
});

test("Confirmação inválida não substitui o ponto confirmado", () => {
  const base = confirmed();
  for (const node of [{ ...entry, ativo: false }, { ...entry, coord_x: Infinity }, { ...entry, coord_y: -1 }]) {
    expect(reduce(base, confirm(node))).toBe(base);
  }
});
