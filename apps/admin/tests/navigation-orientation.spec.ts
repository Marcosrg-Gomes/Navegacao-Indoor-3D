import { expect, test } from "@playwright/test";
import type { NoRota } from "../../visitor/types";
import { loadVisitorModule } from "./visitorModules";

// Testes unitários (sem navegador) das regras de orientação compartilhadas pelo 2D e pelo 3D.
const orientation = loadVisitorModule<typeof import("../../visitor/components/navigationOrientation")>("../../visitor/components/navigationOrientation");
const { sceneHeadingDirection, sceneTransform, sceneYawForDirection } =
  loadVisitorModule<typeof import("../../visitor/components/sceneTransform")>("../../visitor/components/sceneTransform");
const { followPosition, framePoints, INITIAL_VIEW } =
  loadVisitorModule<typeof import("../../visitor/components/mapViewport")>("../../visitor/components/mapViewport");
const {
  bearingBetween, isAllowedOrientation, lookaheadPoint, markerPlanRotation, markerScreenRotation, normalizeDegrees,
  orientationForVector, resolveMapOrientation, snapOrientation, turnDirection, upcomingFloorPath,
} = orientation;

const FLOOR = 1;
const node = (id: number, x: number, y: number, piso_id = FLOOR): NoRota =>
  ({ id, codigo: `N${id}`, nome: `N${id}`, tipo: "corredor", piso_id, coord_x: x, coord_y: y } as NoRota);
const simulated = (route: NoRota[], edge: number, progress: number) => {
  const a = route[edge], b = route[edge + 1];
  return { floorId: a.piso_id, x: a.coord_x + (b.coord_x - a.coord_x) * progress, y: a.coord_y + (b.coord_y - a.coord_y) * progress,
    fromNodeId: a.id, toNodeId: b.id, source: "simulation" };
};
/** Percorre a rota em passos pequenos e devolve todas as orientações adotadas. */
function walk(route: NoRota[], steps = 20) {
  const seen: number[] = [];
  let previous: 0 | 180 | null = null;
  for (let edge = 0; edge < route.length - 1; edge++) {
    for (let i = 0; i <= steps; i++) {
      previous = resolveMapOrientation(route, FLOOR, simulated(route, edge, i / steps), previous);
      seen.push(previous);
    }
  }
  return seen;
}
const flips = (values: number[]) => values.filter((value, i) => i > 0 && value !== values[i - 1]).length;
/** Catálogo real do mini shopping: coord_y cresce para -Z. */
const sceneFloor = { piso_id: 1, origin: [-15, 0, 30], axis_x: [30, 0, 0], axis_y: [0, 0, -60] } as never;

test("normalização de ângulos cobre negativos, voltas completas e valores inválidos", () => {
  expect(normalizeDegrees(0)).toBe(0);
  expect(normalizeDegrees(360)).toBe(0);
  expect(normalizeDegrees(-90)).toBe(270);
  expect(normalizeDegrees(720 + 45)).toBe(45);
  expect(normalizeDegrees(-0)).toBe(0);
  expect(normalizeDegrees(Number.NaN)).toBe(0);
  expect(normalizeDegrees(Number.POSITIVE_INFINITY)).toBe(0);
});

test("bearing: 0° para cima, 90° direita, 180° baixo, 270° esquerda", () => {
  const o = { x: .5, y: .5 };
  expect(bearingBetween(o, { x: .5, y: .2 })).toBeCloseTo(0);
  expect(bearingBetween(o, { x: .8, y: .5 })).toBeCloseTo(90);
  expect(bearingBetween(o, { x: .5, y: .8 })).toBeCloseTo(180);
  expect(bearingBetween(o, { x: .2, y: .5 })).toBeCloseTo(270);
  expect(bearingBetween(o, o)).toBe(0);
});

test("somente 0° e 180° são orientações válidas", () => {
  expect(isAllowedOrientation(0)).toBe(true);
  expect(isAllowedOrientation(180)).toBe(true);
  for (const value of [15, 35, 45, 90, 120, 270, -180, 360, 179.9]) expect(isAllowedOrientation(value)).toBe(false);
  for (const value of [15, 35, 45, 89.9, 270.1, 359, -30]) expect(snapOrientation(value)).toBe(0);
  for (const value of [90.1, 120, 180, 225, 269.9, -150]) expect(snapOrientation(value)).toBe(180);
  // Empates (90°/270°) ficam em 0° para nunca girar por curvas laterais.
  expect(snapOrientation(90)).toBe(0);
  expect(snapOrientation(270)).toBe(0);
});

test("qualquer vetor ou rumo produz apenas 0° ou 180°", () => {
  for (let degrees = 0; degrees < 360; degrees += 1) {
    const angle = degrees * Math.PI / 180;
    for (const previous of [null, 0, 180] as const) {
      const value = orientationForVector(Math.sin(angle), -Math.cos(angle), previous);
      expect(value === 0 || value === 180).toBe(true);
    }
  }
  expect(orientationForVector(0, 0, null)).toBe(0);
  expect(orientationForVector(0, 0, 180)).toBe(180);
  expect(orientationForVector(Number.NaN, 1, 180)).toBe(180);
});

test("histerese: curvas laterais mantêm a orientação; só inversão clara troca", () => {
  expect(orientationForVector(0, -1, null)).toBe(0);      // para cima
  expect(orientationForVector(0, 1, null)).toBe(180);     // para baixo
  expect(orientationForVector(1, 0, null)).toBe(0);       // lateral começa em 0°
  expect(orientationForVector(1, 0, 180)).toBe(180);      // curva à direita mantém 180°
  expect(orientationForVector(-1, 0, 0)).toBe(0);         // curva à esquerda mantém 0°
  expect(orientationForVector(1, .5, 0)).toBe(0);         // diagonal ~27° abaixo do horizonte: ainda não inverte
  expect(orientationForVector(.3, 1, 0)).toBe(180);       // claramente para baixo: inverte
  expect(orientationForVector(.3, -1, 180)).toBe(0);      // claramente para cima: volta
});

test("seta: desenho gira com a planta e na tela aponta sempre para cima", () => {
  for (const value of [0, 180] as const) {
    expect(markerScreenRotation(value)).toBe(0);
    expect(normalizeDegrees(markerPlanRotation(value) + value)).toBe(0);
  }
  // Ponta da seta (0, -13) depois de girar desenho + planta: y negativo = para cima na tela.
  for (const value of [0, 180] as const) {
    const angle = (markerPlanRotation(value) + value) * Math.PI / 180;
    const tipY = 0 * Math.sin(angle) + -13 * Math.cos(angle);
    expect(tipY).toBeLessThan(0);
  }
});

test("rota em L (curva de 90°) não gira o mapa em nenhum quadro", () => {
  const up = [node(1, .5, .9), node(2, .5, .5), node(3, .9, .5)];
  const values = walk(up);
  expect(new Set(values)).toEqual(new Set([0]));
  const down = [node(1, .2, .1), node(2, .2, .6), node(3, .8, .6)];
  const downValues = walk(down);
  expect(new Set(downValues)).toEqual(new Set([180]));
});

test("zigue-zague lateral nunca alterna a orientação", () => {
  const route = [node(1, .1, .9), node(2, .3, .8), node(3, .1, .7), node(4, .3, .6), node(5, .1, .5), node(6, .3, .4)];
  const values = walk(route);
  expect(flips(values)).toBe(0);
  expect(values[0]).toBe(0);
});

test("retorno em U inverte uma única vez e permanece estável", () => {
  const route = [node(1, .3, .9), node(2, .3, .3), node(3, .7, .3), node(4, .7, .95)];
  const values = walk(route);
  expect(values[0]).toBe(0);
  expect(values[values.length - 1]).toBe(180);
  expect(flips(values)).toBe(1);
  for (const value of values) expect([0, 180]).toContain(value);
});

test("percurso à frente ignora outros pisos e começa na posição atual", () => {
  const route = [node(1, .5, .9), node(2, .5, .5), node(3, .5, .5, 2), node(4, .5, .1, 2)];
  expect(upcomingFloorPath(route, FLOOR, null)).toEqual([{ x: .5, y: .9 }, { x: .5, y: .5 }]);
  expect(upcomingFloorPath(route, 2, null)).toEqual([{ x: .5, y: .5 }, { x: .5, y: .1 }]);
  const position = simulated(route, 0, .5);
  expect(upcomingFloorPath(route, FLOOR, position)).toEqual([{ x: .5, y: .7 }, { x: .5, y: .5 }]);
  expect(lookaheadPoint([{ x: 0, y: 0 }, { x: 0, y: 1 }], .25)).toEqual({ x: 0, y: .25 });
  expect(lookaheadPoint([{ x: 0, y: 0 }])).toBeNull();
  expect(resolveMapOrientation([], FLOOR, null, null)).toBe(0);
  expect(resolveMapOrientation([], FLOOR, null, 180)).toBe(180);
});

test("2D e 3D usam a mesma orientação: câmera e seta apontam para o topo da tela", () => {
  for (const value of [0, 180] as const) {
    const forward = sceneHeadingDirection(sceneFloor, value);
    // Mini shopping: topo da planta (coord_y menor) fica em +Z.
    expect(forward[2]).toBeCloseTo(value === 0 ? 1 : -1);
    expect(forward[0]).toBeCloseTo(0);
    // Seta 3D: forma aponta para -Z antes do yaw; depois do yaw deve coincidir com `forward`.
    const yaw = sceneYawForDirection(sceneHeadingDirection(sceneFloor, markerPlanRotation(value)));
    const arrow = [-Math.sin(yaw), 0, -Math.cos(yaw)];
    expect(arrow[0]).toBeCloseTo(forward[0]);
    expect(arrow[2]).toBeCloseTo(forward[2]);
  }
});

test("3D não espelha a planta: esquerda/direita na tela coincidem com o 2D e com a API", () => {
  for (const value of [0, 180] as const) {
    const f = sceneHeadingDirection(sceneFloor, value);
    // Direita da câmera = forward × up (0, 1, 0).
    const right = [-f[2], 0, f[0]];
    const a = sceneTransform(sceneFloor, .2, .5), b = sceneTransform(sceneFloor, .8, .5);
    const towardRight = (b[0] - a[0]) * right[0] + (b[2] - a[2]) * right[2];
    // No 2D, coord_x crescente fica à direita com a planta a 0° e à esquerda a 180°.
    if (value === 0) expect(towardRight).toBeGreaterThan(0);
    else expect(towardRight).toBeLessThan(0);
    // coord_y menor (topo da planta) fica à frente (topo da tela) a 0°.
    const top = sceneTransform(sceneFloor, .5, .1), bottom = sceneTransform(sceneFloor, .5, .9);
    const ahead = (top[0] - bottom[0]) * f[0] + (top[2] - bottom[2]) * f[2];
    if (value === 0) expect(ahead).toBeGreaterThan(0);
    else expect(ahead).toBeLessThan(0);
  }
  // Curva "à esquerda" da API (leste → norte, coord_y decrescente) também é à esquerda no 3D.
  const p0 = sceneTransform(sceneFloor, .2, .5), p1 = sceneTransform(sceneFloor, .5, .5), p2 = sceneTransform(sceneFloor, .5, .2);
  const d1 = [p1[0] - p0[0], p1[2] - p0[2]], d2 = [p2[0] - p1[0], p2[2] - p1[2]];
  // Visto de cima (+Y) com a câmera do app, cross(d1, d2) em XZ: positivo = esquerda.
  const crossY = d1[1] * d2[0] - d1[0] * d2[1];
  expect(crossY).toBeGreaterThan(0);
});

test("vistas 2D preservam 0°/180° em enquadrar e acompanhar", () => {
  const bounds = { width: 390, height: 600, mapWidth: 330, mapHeight: 400 };
  const points = [{ coord_x: .2, coord_y: .2 }, { coord_x: .4, coord_y: .3 }];
  const normal = framePoints(points, bounds, 0), flipped = framePoints(points, bounds, 180);
  expect(normal.rotation).toBe(0);
  expect(flipped.rotation).toBe(180);
  expect(flipped.x).toBeCloseTo(-normal.x);
  expect(flipped.y).toBeCloseTo(-normal.y);
  for (const rotation of [0, 180] as const) {
    for (const heading of [0, 45, 90, 135, 180, 225, 270, 315]) {
      const view = followPosition({ ...INITIAL_VIEW, rotation, zoom: 2 }, { x: .4, y: .6, heading }, bounds, { x: .7, y: .6 });
      expect(view.rotation).toBe(rotation);
    }
  }
});

test("direção da curva para instruções e indicadores", () => {
  expect(turnDirection(0, 0)).toBe("straight");
  expect(turnDirection(0, 20)).toBe("straight");
  expect(turnDirection(0, 90)).toBe("right");
  expect(turnDirection(0, 270)).toBe("left");
  expect(turnDirection(350, 80)).toBe("right");
  expect(turnDirection(90, 0)).toBe("left");
  expect(turnDirection(0, 180)).toBe("back");
});
