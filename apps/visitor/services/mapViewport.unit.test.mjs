// Testes unitários da lógica de viewport de mapViewport.ts.
// Importa as funções reais exportadas por components/mapViewport.ts
// (compilado com tsc para .mjs). Segue o padrão de
// services/api.integration.test.mjs: Node puro, sem Jest/Vitest.

import {
  mapRotationForHeading,
  followPosition,
  INITIAL_VIEW,
} from "../.test-tmp/mapViewport.mjs";

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`PASS: ${name}`);
    passed++;
  } catch (e) {
    console.log(`FAIL: ${name} - ${e.message}`);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}
function assertEquals(actual, expected, msg) {
  if (actual !== expected) throw new Error(`${msg || "valor inesperado"}: esperado=${expected}, obtido=${actual}`);
}

// ============================================================================
// Fixtures reutilizáveis
// ============================================================================

const bounds = {
  width: 390,
  height: 700,
  mapWidth: 100,
  mapHeight: 120,
};

const viewDefault = { zoom: 1, x: 0, y: 0, rotation: 0 };

// ============================================================================
// mapRotationForHeading()
// ============================================================================

test("mapRotationForHeading(): retorna sempre 0 (norte fixo para cima)", () => {
  assertEquals(mapRotationForHeading(), 0, "mapa deve manter rotacao 0");
});

test("mapRotationForHeading(): nao rotaciona independentemente de chamadas repetidas", () => {
  assertEquals(mapRotationForHeading(), 0);
  assertEquals(mapRotationForHeading(), 0);
  assertEquals(mapRotationForHeading(), 0);
});

// ============================================================================
// followPosition() - rotacao
// ============================================================================

test("followPosition(): mapa nao rotaciona (rotation permanece 0)", () => {
  const result = followPosition(viewDefault, { x: 0.5, y: 0.5, heading: 90 }, bounds);
  assertEquals(result.rotation, 0, "mapa deve ficar com norte para cima");
});

test("followPosition(): heading nao afeta rotacao do mapa", () => {
  const resultA = followPosition(viewDefault, { x: 0.5, y: 0.5, heading: 0 }, bounds);
  const resultB = followPosition(viewDefault, { x: 0.5, y: 0.5, heading: 180 }, bounds);
  const resultC = followPosition(viewDefault, { x: 0.5, y: 0.5, heading: 270 }, bounds);
  assertEquals(resultA.rotation, 0);
  assertEquals(resultB.rotation, 0);
  assertEquals(resultC.rotation, 0);
});

// ============================================================================
// followPosition() - enquadramento (centralizacao)
// ============================================================================

test("followPosition(): mantem a posicao dentro da area visivel do viewport", () => {
  const position = { x: 0.3, y: 0.7 };
  const result = followPosition(viewDefault, position, bounds);
  const posX = (position.x - 0.5) * bounds.mapWidth;
  const posY = (position.y - 0.5) * bounds.mapHeight;
  const viewX = -result.x / result.zoom;
  const viewY = -result.y / result.zoom;
  const halfW = bounds.width / 2 / result.zoom;
  const halfH = bounds.height / 2 / result.zoom;
  assert(
    posX >= viewX - halfW - 10 && posX <= viewX + halfW + 10 &&
    posY >= viewY - halfH - 10 && posY <= viewY + halfH + 10,
    `posicao (${posX.toFixed(1)},${posY.toFixed(1)}) fora da area visivel`,
  );
});

test("followPosition(): posicoes em diferentes quadrantes ficam dentro da area visivel", () => {
  const quadrants = [
    { x: 0.2, y: 0.2 },
    { x: 0.8, y: 0.2 },
    { x: 0.2, y: 0.8 },
    { x: 0.8, y: 0.8 },
  ];
  for (const position of quadrants) {
    const result = followPosition(viewDefault, position, bounds);
    const posX = (position.x - 0.5) * bounds.mapWidth;
    const posY = (position.y - 0.5) * bounds.mapHeight;
    const viewX = -result.x / result.zoom;
    const viewY = -result.y / result.zoom;
    const halfW = bounds.width / 2 / result.zoom;
    const halfH = bounds.height / 2 / result.zoom;
    assert(
      posX >= viewX - halfW - 10 && posX <= viewX + halfW + 10 &&
      posY >= viewY - halfH - 10 && posY <= viewY + halfH + 10,
      `quadrante (${position.x},${position.y}) fora da area visivel`,
    );
  }
});

// ============================================================================
// followPosition() - zoom sem nextTurn
// ============================================================================

test("followPosition(): sem nextTurn, mantem o zoom original", () => {
  const view = { zoom: 2.5, x: 0, y: 0, rotation: 0 };
  const result = followPosition(view, { x: 0.5, y: 0.5 }, bounds);
  assertEquals(result.zoom, 2.5, "zoom deve ser preservado quando nao ha proximo trecho");
});

test("followPosition(): com nextTurn distante, reduz zoom para enquadrar a curva", () => {
  const view = { zoom: 8, x: 0, y: 0, rotation: 0 };
  const position = { x: 0.5, y: 0.5 };
  const nextTurn = { x: 0.95, y: 0.05 };
  const result = followPosition(view, position, bounds, nextTurn);
  assert(result.zoom < view.zoom, `zoom deve diminuir para enquadrar curva, obteve=${result.zoom}`);
  assert(result.zoom >= 1, "zoom nao deve cair abaixo de 1");
});

test("followPosition(): com nextTurn proximo, mantem o zoom original", () => {
  const view = { zoom: 2, x: 0, y: 0, rotation: 0 };
  const position = { x: 0.5, y: 0.5 };
  const nextTurn = { x: 0.55, y: 0.5 };
  const result = followPosition(view, position, bounds, nextTurn);
  assertEquals(result.zoom, 2, "zoom deve ser preservado quando proximo trecho esta perto");
});

// ============================================================================
// followPosition() - nao rotacao durante curvas
// ============================================================================

test("followPosition(): curva a esquerda nao rotaciona o mapa", () => {
  const result = followPosition(
    viewDefault,
    { x: 0.5, y: 0.5, heading: 45 },
    bounds,
    { x: 0.2, y: 0.5 },
  );
  assertEquals(result.rotation, 0, "curva a esquerda deve manter rotacao 0");
});

test("followPosition(): curva a direita nao rotaciona o mapa", () => {
  const result = followPosition(
    viewDefault,
    { x: 0.5, y: 0.5, heading: 135 },
    bounds,
    { x: 0.8, y: 0.5 },
  );
  assertEquals(result.rotation, 0, "curva a direita deve manter rotacao 0");
});

test("followPosition(): proximo trecho atras do usuario nao rotaciona o mapa", () => {
  const result = followPosition(
    viewDefault,
    { x: 0.5, y: 0.5, heading: 0 },
    bounds,
    { x: 0.1, y: 0.1 },
  );
  assertEquals(result.rotation, 0, "trecho atras na deve provocar rotacao indevida");
});

// ============================================================================
// Resultado
// ============================================================================

console.log(`\n${passed} passou, ${failed} falhou`);
if (failed > 0) process.exit(1);
