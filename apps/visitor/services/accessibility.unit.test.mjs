// Testes unitários das mensagens de anúncio de acessibilidade (VoiceOver /
// TalkBack) e do rastreador de dedução. Executa em Node puro, sem Jest/Vitest.
// Espelha os formatos usados por hooks/useAccessibilityAnnouncer.ts e pelos
// formatos puros de services/accessibilityAnnouncements.ts.

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); console.log(`PASS: ${name}`); passed++; }
  catch (e) { console.log(`FAIL: ${name} - ${e.message}`); failed++; }
}
function assert(condition, msg) { if (!condition) throw new Error(msg); }
function assertEquals(actual, expected, msg) {
  if (actual !== expected) throw new Error(`${msg || "valor inesperado"}: esperado=${JSON.stringify(expected)}, obtido=${JSON.stringify(actual)}`);
}

// ============================================================================
// Formatos de anúncio (espelho dos formatos puros do serviço de acessibilidade)
// ============================================================================

function routeAnnouncement({ destination, distanceMeters, steps, accessible }) {
  const distancia = Math.round(distanceMeters);
  const passo = steps === 1 ? "passo" : "passos";
  const acessivel = accessible ? " (rota sem escadas)" : "";
  return `Rota calculada até ${destination}, ${distancia} metros, ${steps} ${passo}${acessivel}.`;
}
function arrivalAnnouncement(destination) { return `Você chegou ao destino: ${destination}.`; }
function floorAnnouncement(floorName) { return `Agora exibindo o piso ${floorName}.`; }
function originAnnouncement({ nodeName, floorName }) {
  return `Sua localização está em ${nodeName}, ${floorName || "piso desconhecido"}.`;
}
function errorAnnouncement(message) { return `Erro na rota: ${message}.`; }
function instructionAnnouncement(instruction) { return instruction; }

class AnnouncementTracker {
  constructor() { this.prev = new Map(); }
  shouldAnnounce(key, value) {
    const normalized = value === null ? null : String(value);
    const previous = this.prev.get(key) ?? null;
    const changed = normalized !== null && normalized !== previous;
    if (changed) this.prev.set(key, normalized);
    else if (normalized === null) this.prev.delete(key);
    return changed;
  }
  reset() { this.prev.clear(); }
}

// ============================================================================

test("routeAnnouncement(): monta mensagem com destino, distância e passos", () => {
  const msg = routeAnnouncement({ destination: "Natura", distanceMeters: 142.7, steps: 3, accessible: false });
  assertEquals(msg, "Rota calculada até Natura, 143 metros, 3 passos.");
});

test("routeAnnouncement(): passo singular quando há um único passo", () => {
  const msg = routeAnnouncement({ destination: "Entrada", distanceMeters: 40, steps: 1, accessible: false });
  assertEquals(msg, "Rota calculada até Entrada, 40 metros, 1 passo.");
});

test("routeAnnouncement(): informa rota sem escadas quando acessível", () => {
  const msg = routeAnnouncement({ destination: "Livraria", distanceMeters: 250, steps: 5, accessible: true });
  assertEquals(msg, "Rota calculada até Livraria, 250 metros, 5 passos (rota sem escadas).");
});

test("arrivalAnnouncement(): anuncia chegada ao destino", () => {
  assertEquals(arrivalAnnouncement("Natura"), "Você chegou ao destino: Natura.");
});

test("floorAnnouncement(): anuncia o piso exibido", () => {
  assertEquals(floorAnnouncement("Mezanino"), "Agora exibindo o piso Mezanino.");
});

test("originAnnouncement(): anuncia origem com piso", () => {
  assertEquals(originAnnouncement({ nodeName: "Entrada Principal", floorName: "Térreo" }),
    "Sua localização está em Entrada Principal, Térreo.");
});

test("originAnnouncement(): piso desconhecido quando não há piso", () => {
  assertEquals(originAnnouncement({ nodeName: "Entrada Principal", floorName: null }),
    "Sua localização está em Entrada Principal, piso desconhecido.");
});

test("errorAnnouncement(): anuncia erro da rota", () => {
  assertEquals(errorAnnouncement("Não há rota sem escadas até este destino"),
    "Erro na rota: Não há rota sem escadas até este destino.");
});

test("instructionAnnouncement(): repete a instrução da próxima manobra", () => {
  assertEquals(instructionAnnouncement("Vire à direita após a loja"), "Vire à direita após a loja");
});

// ============================================================================
// Rastreador de dedução: cada anúncio acontece exatamente uma vez por transição
// ============================================================================

test("tracker: anuncia na primeira transição e não repete o mesmo valor", () => {
  const t = new AnnouncementTracker();
  assert(t.shouldAnnounce("route", "rev-1") === true, "primeira vez deve anunciar");
  assert(t.shouldAnnounce("route", "rev-1") === false, "mesmo revisão não deve anunciar");
  assert(t.shouldAnnounce("route", "rev-2") === true, "nova revisão deve anunciar");
});

test("tracker: valores nulos não anunciam e liberam o estado para reanunciar", () => {
  const t = new AnnouncementTracker();
  assert(t.shouldAnnounce("error", null) === false, "nulo inicial não anuncia");
  assert(t.shouldAnnounce("error", "falha") === true, "erro deve anunciar");
  assert(t.shouldAnnounce("error", null) === false, "limpar erro não anuncia");
  assert(t.shouldAnnounce("error", "falha") === true, "erro retornando deve anunciar novamente");
});

test("tracker: chaves independentes não se interferem", () => {
  const t = new AnnouncementTracker();
  assert(t.shouldAnnounce("arrival", "Natura") === true, "chegada anuncia");
  assert(t.shouldAnnounce("floor", "Térreo") === true, "piso anuncia independente");
  assert(t.shouldAnnounce("arrival", "Natura") === false, "chegada repetida não anuncia");
});

test("tracker: IDs numéricos (piso/origem) são tratados como texto", () => {
  const t = new AnnouncementTracker();
  assert(t.shouldAnnounce("floor", 1) === true, "piso 1 anuncia");
  assert(t.shouldAnnounce("floor", 1) === false, "piso 1 repetido não anuncia");
  assert(t.shouldAnnounce("floor", 2) === true, "piso 2 anuncia");
});

test("tracker: instrução de manobra anuncia apenas quando muda", () => {
  const t = new AnnouncementTracker();
  assert(t.shouldAnnounce("instruction", "Vire à direita") === true, "primeira instrução anuncia");
  assert(t.shouldAnnounce("instruction", "Vire à direita") === false, "mesma instrução não anuncia");
  assert(t.shouldAnnounce("instruction", "Siga em frente") === true, "nova instrução anuncia");
  assert(t.shouldAnnounce("instruction", null) === false, "sem instrução não anuncia");
});

// ============================================================================

console.log(`\n${passed} passou, ${failed} falhou`);
if (failed > 0) process.exit(1);
