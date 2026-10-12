import { expect, test, type Page } from "@playwright/test";
import { createServer, type ViteDevServer } from "vite";
import path from "node:path";

let server: ViteDevServer;
let url: string;
test.beforeAll(async () => {
  const apps = path.resolve(process.cwd(), "..");
  const root = path.join(apps, "admin/tests/fixtures/simulation-context");
  const platform = path.join(root, "platform.ts");
  server = await createServer({ configFile: false, root,
    resolve: { alias: [
      { find: "@", replacement: path.join(apps, "visitor") },
      ...["react-native", "expo-router", "expo-constants", "./VisitorPreferences"].map((find) => ({ find, replacement: platform })),
      { find: /^react$/, replacement: path.join(apps, "visitor/node_modules/react/index.js") },
      { find: /^react\//, replacement: path.join(apps, "visitor/node_modules/react/") },
      { find: "react-dom", replacement: path.join(apps, "visitor/node_modules/react-dom") },
    ] },
    esbuild: { jsx: "automatic" },
    define: { "process.env.EXPO_PUBLIC_API_URL": '""' },
    server: { host: "127.0.0.1", port: 0, fs: { allow: [apps] },
      proxy: { "/api": process.env.AUDIT_URL || "http://127.0.0.1:8766" } },
  });
  await server.listen();
  const address = server.httpServer!.address() as { port: number };
  url = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => { await server?.close(); });

async function state(page: Page) { return JSON.parse((await page.getByTestId("state").textContent())!); }
async function click(page: Page, name: string) { await page.getByRole("button", { name, exact: true }).click(); }
async function start(page: Page) {
  await page.goto(url);
  await click(page, "Entrada QR");
  await expect.poll(async () => (await state(page)).origin).toBeTruthy();
  await click(page, "Natura");
  await expect.poll(async () => !!(await state(page)).route && !(await state(page)).busy).toBe(true);
  await click(page, "Iniciar");
  await expect.poll(async () => (await state(page)).status).toBe("running");
  await click(page, "4x");
}
async function paused(page: Page) {
  await expect.poll(async () => (await state(page)).progress?.traveledMeters).toBeGreaterThan(2);
  await click(page, "Pausar");
  await expect.poll(async () => (await state(page)).status).toBe("paused");
  return state(page);
}
function samePosition(a: any, b: any) {
  expect(a.position.x).toBeCloseTo(b.position.x, 8);
  expect(a.position.y).toBeCloseTo(b.position.y, 8);
  expect(a.position.floorId).toBe(b.position.floorId);
}

test("Contexto: chegada Natura → Anacapri usa posição simulada sem confirmar chegada física", async ({ page }) => {
  await start(page);
  const initial = await state(page);
  await expect.poll(async () => (await state(page)).status, { timeout: 20000 }).toBe("arrived");
  const arrived = await state(page);
  expect(arrived.origin).toBe(initial.origin);
  expect(arrived.arrived).toBe(false);
  const response = page.waitForResponse((res) => res.url().endsWith("/api/routes") && res.request().method() === "POST");
  await click(page, "Anacapri");
  expect((await response).request().postDataJSON().origem_no_id).toBe(initial.destination);
  await expect.poll(async () => (await state(page)).status).toBe("paused");
  samePosition(await state(page), arrived);
  await click(page, "Encerrar");
  await expect.poll(async () => (await state(page)).status).toBe("idle");
  await expect.poll(async () => (await state(page)).route?.nos[0].id).toBe(initial.origin);
  expect((await state(page)).position.source).toBe("qr");
});

test("Contexto: acessibilidade e novo destino recalculam do mesmo ponto; desvio mantém destino", async ({ page }) => {
  await start(page);
  const snapshot = await paused(page);
  for (const command of ["Sem escadas", "Anacapri"]) {
    const response = page.waitForResponse((res) => res.url().endsWith("/api/routes") && res.request().method() === "POST");
    await click(page, command);
    expect((await response).request().postDataJSON().acessivel).toBe(true);
    await expect.poll(async () => (await state(page)).busy).toBe(false);
    expect((await state(page)).status).toBe("paused");
    samePosition(await state(page), snapshot);
  }
  const before = await state(page);
  await click(page, "Desvio");
  await expect.poll(async () => (await state(page)).notice).toContain("Desvio simulado");
  const after = await state(page);
  expect(after.destination).toBe(before.destination);
  expect(after.origin).toBe(before.origin);
  expect(after.position.fromNodeId).toBe(after.route.nos[0].id);
});

test("Contexto: outra aba e segundo plano pausam e exigem retomada explícita", async ({ page }) => {
  await start(page);
  for (const [leave, back] of [["Outra aba", "Início"], ["Segundo plano", "Ativo"]]) {
    await click(page, leave);
    await expect.poll(async () => (await state(page)).status).toBe("paused");
    const snapshot = await state(page);
    await click(page, back);
    expect((await state(page)).status).toBe("paused");
    samePosition(await state(page), snapshot);
    await click(page, "Retomar");
    await expect.poll(async () => (await state(page)).status).toBe("running");
  }
});

test("Contexto: falha de recálculo congela posição e permite nova tentativa", async ({ page }) => {
  await start(page);
  const snapshot = await paused(page);
  await page.route("**/api/routes", (route) => route.fulfill({ status: 503, contentType: "application/json", body: '{"detail":"Falha temporária no teste"}' }));
  await click(page, "Recalcular");
  await expect.poll(async () => (await state(page)).status).toBe("error");
  samePosition(await state(page), snapshot);
  expect((await state(page)).route).toEqual(snapshot.route);
  await page.unroute("**/api/routes");
  await click(page, "Recalcular");
  await expect.poll(async () => (await state(page)).status).toBe("paused");
  samePosition(await state(page), snapshot);
  expect((await state(page)).error).toBeNull();
});

test("Contexto: bloqueio real pausa no ponto ocupado, sem recálculo em loop; desbloqueio permite continuar", async ({ page, request }) => {
  await start(page);
  const snapshot = await paused(page);
  const headers = { "X-API-Key": "audit-local-admin-key-with-32-characters", "X-Audit-Reason": "Teste isolado de simulacao" };
  const edges = await (await request.get("/api/admin/edges", { headers })).json();
  const { fromNodeId, toNodeId } = snapshot.position;
  const occupied = edges.filter((edge: any) => edge.ativa &&
    ((edge.no_origem_id === fromNodeId && edge.no_destino_id === toNodeId) ||
     (edge.no_origem_id === toNodeId && edge.no_destino_id === fromNodeId)));
  expect(occupied.length).toBeGreaterThan(0);
  let graphCalls = 0;
  page.on("request", (req) => { if (req.url().endsWith("/graph")) graphCalls++; });
  try {
    for (const edge of occupied) expect((await request.put(`/api/admin/edges/${edge.id}`, { headers, data: { ativa: false } })).ok()).toBe(true);
    await expect.poll(async () => (await state(page)).status, { timeout: 10000 }).toBe("error");
    samePosition(await state(page), snapshot);
    expect((await state(page)).error).toContain("bloqueado");
    const calls = graphCalls;
    // Duas consultas periódicas sem nova revisão não podem iniciar novas rotas.
    await page.waitForTimeout(4500);
    expect(graphCalls).toBe(calls);
    samePosition(await state(page), snapshot);
    for (const edge of occupied) expect((await request.put(`/api/admin/edges/${edge.id}`, { headers, data: { ativa: true } })).ok()).toBe(true);
    await expect.poll(async () => (await state(page)).status, { timeout: 10000 }).toBe("paused");
    samePosition(await state(page), snapshot);
  } finally {
    for (const edge of occupied) await request.put(`/api/admin/edges/${edge.id}`, { headers, data: { ativa: true } });
  }
});

test("Contexto: falha ao consultar destino congela sessão sem deixar recálculo pendente", async ({ page }) => {
  await start(page);
  const snapshot = await paused(page);
  await page.route("**/api/pois/*", (route) => route.abort());
  await click(page, "Recalcular");
  await expect.poll(async () => (await state(page)).status).toBe("error");
  expect((await state(page)).busy).toBe(false);
  samePosition(await state(page), snapshot);
});

for (const command of ["Cancelar", "Entrada QR", "Anacapri"]) {
  test(`Contexto: ${command} invalida recálculo atrasado`, async ({ page }) => {
    await start(page);
    await paused(page);
    let release!: () => void;
    const hold = new Promise<void>((resolve) => { release = resolve; });
    let intercepted = false;
    let delivered = false;
    await page.route("**/api/routes", async (route) => {
      if (intercepted) { await route.continue(); return; }
      intercepted = true;
      const response = await route.fetch();
      await hold;
      await route.fulfill({ response });
      delivered = true;
    });
    try {
      await click(page, "Recalcular");
      await expect.poll(() => intercepted).toBe(true);
      const oldDestination = (await state(page)).destination;
      await click(page, command);
      if (command === "Entrada QR") {
        await expect.poll(async () => (await state(page)).route?.nos[0].id).toBe((await state(page)).origin);
      } else if (command === "Anacapri") {
        await expect.poll(async () => (await state(page)).destination).not.toBe(oldDestination);
      }
      await expect.poll(async () => (await state(page)).status).toBe(command === "Anacapri" ? "paused" : "idle");
      await expect.poll(async () => (await state(page)).busy).toBe(false);
      const snapshot = await state(page);
      release();
      await expect.poll(() => delivered).toBe(true);
      samePosition(await state(page), snapshot);
      expect((await state(page)).route).toEqual(snapshot.route);
      expect((await state(page)).destination).toBe(snapshot.destination);
    } finally { release(); }
  });
}
