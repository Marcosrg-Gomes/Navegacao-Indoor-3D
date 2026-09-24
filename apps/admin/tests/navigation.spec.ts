import { test, expect } from "@playwright/test";

const auth = { "X-API-Key": "audit-local-only" };

test.beforeEach(async ({ browser }, info) => {
  info.annotations.push({ type: "browser-version", description: `${info.project.name} ${browser.version()} (${process.platform})` });
});

test("QR → mapa → busca → rota → chegada; bloqueio administrativo muda a rota", async ({ page, context, request }, info) => {
  await page.setViewportSize({ width: 360, height: 640 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?qr=ENTRADA-PRINCIPAL");
  await expect(page.getByTestId("origin-label")).toContainText("Entrada Principal");
  await expect(page.getByTestId("floor-map")).toBeVisible();
  const image = page.locator('svg image').first();
  await expect(image).toHaveAttribute("href", /\/static\/plantas\/demo.svg/);
  await page.getByLabel("Buscar destinos", { exact: true }).fill("Tech");
  await page.getByRole("button", { name: "TechStore, Aberto" }).click();
  await page.getByRole("button", { name: "Traçar rota", exact: true }).click();
  await expect(page.getByTestId("route-panel")).toBeVisible();
  const first = await request.post("/api/routes", { data: { origem_no_id: 1, destino_no_id: 17 } });
  const original = await first.json();
  expect(first.ok()).toBeTruthy();
  const edgeResponse = await request.get("/api/admin/edges/4", { headers: auth });
  expect(edgeResponse.ok()).toBeTruthy();
  const edge = await edgeResponse.json();
  const traversesEdge = (route: typeof original) => route.nos.some((node: { id: number }, index: number) => {
    const next = route.nos[index + 1];
    return next && ((node.id === edge.no_origem_id && next.id === edge.no_destino_id) ||
      (edge.bidirecional && node.id === edge.no_destino_id && next.id === edge.no_origem_id));
  });
  expect(traversesEdge(original)).toBeTruthy();

  const admin = await context.newPage();
  await admin.goto("/admin/arestas");
  await admin.getByLabel("API key", { exact: true }).fill("audit-local-only");
  await admin.getByRole("button", { name: "Entrar", exact: true }).click();
  const edgeRow = admin.locator("tbody tr").filter({ has: admin.locator("td:first-child", { hasText: /^#4$/ }) });
  try {
    await edgeRow.getByRole("button", { name: "Bloquear", exact: true }).click();
    await expect(edgeRow.getByRole("button", { name: "Reativar", exact: true })).toBeVisible();
    const nextRoute = page.waitForResponse((res) => res.url().endsWith("/api/routes") && res.request().method() === "POST");
    await page.getByRole("button", { name: "Recalcular", exact: true }).click();
    const updated = await (await nextRoute).json();
    expect(updated.nos.map((n: { id: number }) => n.id)).not.toEqual(original.nos.map((n: { id: number }) => n.id));
    expect(traversesEdge(updated)).toBeFalsy();
    await expect(page.getByTestId("route-panel")).toContainText(updated.distancia_total_metros.toFixed(1));
    await edgeRow.getByRole("button", { name: "Reativar", exact: true }).click();
    await expect(edgeRow.getByRole("button", { name: "Bloquear", exact: true })).toBeVisible();
    const restoredResponse = page.waitForResponse((res) => res.url().endsWith("/api/routes") && res.request().method() === "POST");
    await page.getByRole("button", { name: "Recalcular", exact: true }).click();
    const restored = await (await restoredResponse).json();
    expect(restored.nos).toEqual(original.nos);
    expect(restored.distancia_total_metros).toEqual(original.distancia_total_metros);
    expect(traversesEdge(restored)).toBeTruthy();
    await info.attach("edge-cycle", { body: JSON.stringify({ edge, original, blocked: updated, restored }, null, 2), contentType: "application/json" });
    await page.getByRole("button", { name: "Cheguei ao destino", exact: true }).click();
    await expect(page.getByTestId("arrival-notice")).toContainText("Você chegou ao destino!");
    await page.screenshot({ path: `../../evidence/${process.env.AUDIT_PHASE || "final"}-${info.project.name}-arrival-360.png`, fullPage: true });
  } finally {
    const cleanup = await request.put("/api/admin/edges/4", { headers: auth, data: { ativa: edge.ativa } });
    expect(cleanup.ok()).toBeTruthy();
    await admin.close();
  }
  expect(errors).toEqual([]);
});

test("Scanner manual, QR inválido, aviso de manutenção e categorias cadastradas", async ({ page }) => {
  await page.setViewportSize({ width: 414, height: 896 });
  await page.goto("/scan");
  await page.getByLabel("Código ou link do QR", { exact: true }).fill("QR-INVALIDO");
  await page.getByRole("button", { name: "Usar código", exact: true }).click();
  await expect(page.getByText("QR Code não encontrado ou inativo", { exact: true })).toBeVisible();
  await page.getByLabel("Código ou link do QR", { exact: true }).fill("ENTRADA-PRINCIPAL");
  await page.getByRole("button", { name: "Usar código", exact: true }).click();
  await expect(page.getByTestId("origin-label")).toContainText("Entrada Principal");
  await page.getByLabel("Buscar destinos", { exact: true }).fill("Brilho");
  await page.getByRole("button", { name: "Joalheria Brilho, Em manutenção" }).click();
  await expect(page.getByText(/Este local está em manutenção/)).toBeVisible();
  await page.getByRole("button", { name: "Ver trajeto mesmo assim" }).click();
  await expect(page.getByTestId("route-panel")).toBeVisible();
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await page.getByRole("button", { name: "Tecnologia", exact: true }).click();
  await expect(page.getByText("TechStore", { exact: true })).toBeVisible();
  await expect(page.getByText("Moda Fashion", { exact: true })).toHaveCount(0);
});

test("Mapa entre pisos e layout sem overflow em 360 e 414 pixels", async ({ page }, info) => {
  for (const [width, height] of [[360, 640], [414, 896]]) {
    await page.setViewportSize({ width, height });
    await page.goto("/?qr=ENTRADA-PRINCIPAL");
    await expect(page.getByTestId("origin-label")).toContainText("Entrada Principal");
    await page.getByLabel("Buscar destinos", { exact: true }).fill("Superior");
    await page.getByRole("button", { name: "Livraria Superior, Aberto" }).click();
    const routeResponse = page.waitForResponse((res) => res.url().endsWith("/api/routes") && res.request().method() === "POST");
    await page.getByRole("button", { name: "Traçar rota", exact: true }).click();
    const route = await (await routeResponse).json();
    const transitions = route.nos.slice(1).map((node: { piso_id: number }, i: number) => [route.nos[i], node])
      .filter(([a, b]: [{ piso_id: number }, { piso_id: number }]) => a.piso_id !== b.piso_id);
    expect(transitions.length).toBeGreaterThan(0);
    for (const [a, b] of transitions) {
      expect(["escada", "elevador"]).toContain(a.tipo);
      expect(["escada", "elevador"]).toContain(b.tipo);
    }
    await info.attach(`multi-floor-${width}`, { body: JSON.stringify(route, null, 2), contentType: "application/json" });
    await expect(page.getByTestId("route-panel")).toContainText("Rota entre pisos");
    await page.getByRole("button", { name: "Piso superior", exact: true }).click();
    await expect(page.getByText("Mapa: Piso superior", { exact: true })).toBeVisible();
    const dimensions = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
    await page.getByRole("button", { name: "Aumentar zoom" }).click();
    await expect(page.getByText("1.5×", { exact: true })).toBeVisible();
    await page.screenshot({ path: `../../evidence/${process.env.AUDIT_PHASE || "final"}-${info.project.name}-map-${width}.png`, fullPage: true });
  }
});

test("Falhas de rede têm mensagem e permitem repetir a busca", async ({ page }) => {
  await page.goto("/?qr=ENTRADA-PRINCIPAL");
  await expect(page.getByTestId("origin-label")).toContainText("Entrada Principal");
  await page.route("**/api/pois?**", (route) => route.abort());
  await page.getByLabel("Buscar destinos", { exact: true }).fill("Tech");
  await expect(page.getByText(/Não foi possível conectar ao servidor/)).toBeVisible();
  await page.unroute("**/api/pois?**");
  await page.getByLabel("Tentar buscar novamente").click();
  await expect(page.getByRole("button", { name: "TechStore, Aberto" })).toBeVisible();
});

test("Painel responsivo, refresh de rota e edição de QR disponíveis", async ({ page }) => {
  await page.goto("/admin/qr");
  await page.getByLabel("API key", { exact: true }).fill("audit-local-only");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.locator("canvas").first()).toBeVisible();
  for (const width of [360, 414]) {
    await page.setViewportSize({ width, height: 640 });
    const dimensions = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
  }
  await page.getByRole("button", { name: "Editar", exact: true }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Cancelar", exact: true }).click();
  await page.reload();
  await expect(page.locator("canvas").first()).toBeVisible();
});
