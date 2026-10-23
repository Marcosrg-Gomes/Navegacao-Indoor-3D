import { expect, test, type Page } from "@playwright/test";

const headers = { "X-API-Key": "audit-local-admin-key-with-32-characters", "X-Audit-Reason": "Teste das regras de negocio" };

test("Alteração espacial incompatível retira o 3D até o cadastro ser corrigido", async ({ page, request }) => {
  await start(page);
  await expect(page.getByTestId("scene-map")).toBeVisible();
  const nodes = await (await request.get("/api/admin/nodes", { headers })).json();
  const node = nodes.find((item: any) => item.tipo === "loja");
  try {
    expect((await request.put(`/api/admin/nodes/${node.id}`, { headers, data: { coord_x: Number(node.coord_x) + .001 } })).ok()).toBeTruthy();
    await expect(page.getByTestId("scene-fallback")).toContainText("não corresponde ao cadastro", { timeout: 12000 });
    await expect(page.getByTestId("floor-map")).toBeVisible();
    expect((await request.put(`/api/admin/nodes/${node.id}`, { headers, data: { coord_x: node.coord_x } })).ok()).toBeTruthy();
    await expect(page.getByTestId("scene-map")).toBeVisible({ timeout: 12000 });
    await expect(page.getByTestId("scene-fallback")).toHaveCount(0);
  } finally { await request.put(`/api/admin/nodes/${node.id}`, { headers, data: { coord_x: node.coord_x } }); }
});
async function start(page: Page) {
  await page.goto("/?qr=MINI-ENTRADA-PRINCIPAL");
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
}
async function natura(page: Page) {
  await page.getByLabel("Buscar destinos", { exact: true }).fill("NATURA");
  await page.getByRole("button", { name: "NATURA, Aberto", exact: true }).click();
  const response = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Traçar rota", exact: true }).click();
  return (await response).json();
}
async function failRouteRequests(page: Page) {
  await page.route("**/api/routes", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ detail: "Falha simulada ao recalcular a rota." }) });
  });
}

test("Bloqueio e desbloqueio atualizam a rota automaticamente sem alterar a posição", async ({ page, request }) => {
  await start(page);
  const original = await natura(page);
  const edges = await (await request.get("/api/admin/edges", { headers })).json();
  const endpoint = original.nos.at(-1).id;
  const incident = edges.filter((edge: any) => edge.ativa && (edge.no_origem_id === endpoint || edge.no_destino_id === endpoint));
  expect(incident.length).toBeGreaterThan(0);
  try {
    for (const edge of incident) expect((await request.put(`/api/admin/edges/${edge.id}`, { headers, data: { ativa: false } })).ok()).toBeTruthy();
    await expect(page.getByTestId("route-panel")).toContainText(/Não existe|Nenhuma rota|não foi possível|Não foi possível/, { timeout: 12000 });
    await expect(page.getByRole("button", { name: "Cheguei ao destino", exact: true })).toBeDisabled();
    await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
    const restored = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.ok());
    for (const edge of incident) expect((await request.put(`/api/admin/edges/${edge.id}`, { headers, data: { ativa: true } })).ok()).toBeTruthy();
    expect((await (await restored).json()).nos).toEqual(original.nos);
    await expect(page.getByRole("button", { name: "Cheguei ao destino", exact: true })).toBeEnabled();
  } finally {
    for (const edge of incident) await request.put(`/api/admin/edges/${edge.id}`, { headers, data: { ativa: true } });
  }
});

test("Chegada verifica a revisão mesmo antes da próxima atualização automática", async ({ page, request }) => {
  await start(page); await natura(page);
  let allowCheck = false;
  await page.route("**/navigation-state", async (route) => {
    if (allowCheck) await route.continue(); else await new Promise<void>((resolve) => setTimeout(resolve, 6000)).then(() => route.continue()).catch(() => {});
  });
  const pois = await (await request.get("/api/pois")).json();
  const poi = pois.find((item: any) => item.nome === "NATURA");
  try {
    expect((await request.put(`/api/admin/stores/${poi.id}`, { headers, data: { status_operacional: "fechado" } })).ok()).toBeTruthy();
    allowCheck = true;
    await page.getByRole("button", { name: "Cheguei ao destino", exact: true }).click();
    await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
    await expect(page.getByTestId("arrival-notice")).toHaveCount(0);
    await expect(page.getByTestId("route-panel")).toContainText(/mapa mudou|confirme|indisponível|fechado/i);
  } finally { await request.put(`/api/admin/stores/${poi.id}`, { headers, data: { status_operacional: "aberto" } }); }
});

test("Explorar filtra funcionamento e consulta percursos acessíveis na API", async ({ page, request }) => {
  const pois = await (await request.get("/api/pois")).json();
  const poi = pois.find((item: any) => item.nome === "NATURA");
  try {
    expect((await request.put(`/api/admin/stores/${poi.id}`, { headers, data: { status_operacional: "fechado" } })).ok()).toBeTruthy();
    await start(page);
    await page.getByRole("tab", { name: /Explorar/ }).click();
    await page.getByRole("button", { name: "Filtrar e ordenar", exact: true }).click();
    await page.getByRole("button", { name: "Fechados", exact: true }).click();
    const distance = page.waitForResponse((r) => r.url().includes("/routes/distances?") && r.url().includes("acessivel=true"));
    await page.getByRole("button", { name: "Com rota sem escadas", exact: true }).click();
    expect((await distance).ok()).toBeTruthy();
    await page.getByRole("button", { name: "Mostrar resultados", exact: true }).click();
    await expect(page.getByRole("button", { name: "NATURA, ver detalhes", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "ADIDAS, ver detalhes", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Como chegar a NATURA", exact: true }).click();
    await expect(page.getByText(/Este local está fechado/)).toBeVisible();
    const confirmed = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.ok());
    await page.getByRole("button", { name: "Ver trajeto mesmo assim", exact: true }).click();
    expect((await confirmed).request().postDataJSON()).toMatchObject({ confirmar_indisponivel: true, acessivel: true });
  } finally { await request.put(`/api/admin/stores/${poi.id}`, { headers, data: { status_operacional: "aberto" } }); }
});

test("Histórico mostra motivo, restaura uma edição e apresenta falhas agregadas", async ({ page, request }) => {
  const created = await (await request.post("/api/admin/categories", { headers, data: { nome: "Categoria temporária de auditoria" } })).json();
  try {
    expect((await request.put(`/api/admin/categories/${created.id}`, { headers, data: { nome: "Categoria alterada" } })).ok()).toBeTruthy();
    await request.get("/api/qr-codes/CODIGO-INEXISTENTE-PARA-TESTE");
    await page.goto("/admin/auditoria");
    await page.getByLabel("API key", { exact: true }).fill("audit-local-admin-key-with-32-characters");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Histórico e falhas", exact: true })).toBeVisible();
    await expect(page.getByText(/qr · indisponivel:/)).toBeVisible();
    const entry = page.locator("article").filter({ hasText: `categorias ${created.id} · editar` }).first();
    await expect(entry).toContainText("Teste das regras de negocio");
    page.on("dialog", (dialog) => dialog.accept("Restaurar nome para validar historico"));
    await entry.getByRole("button", { name: /Restaurar estado anterior/ }).click();
    await expect(page.getByRole("status")).toContainText("restaurado");
    const categories = await (await request.get("/api/admin/categories", { headers })).json();
    expect(categories.find((item: any) => item.id === created.id).nome).toBe("Categoria temporária de auditoria");
  } finally { await request.delete(`/api/admin/categories/${created.id}`, { headers }); }
});

test("Aba Mapa mostra falha de recálculo após troca de origem por QR", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await start(page);
  await natura(page);
  await page.getByRole("tab", { name: "Mapa", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Mapa do trajeto" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Destino: NATURA/ })).toBeVisible();

  await page.getByRole("button", { name: "Escanear QR", exact: true }).click();
  await expect(page.getByLabel("Código ou link do QR")).toBeVisible();
  await failRouteRequests(page);
  const failed = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.request().method() === "POST");
  await page.getByLabel("Código ou link do QR").fill("MINI-TERREO-CENTRAL");
  await page.getByRole("button", { name: "Usar código", exact: true }).click();
  expect((await failed).status()).toBe(503);

  await expect(page).toHaveURL(/\/map$/);
  const warning = page.getByTestId("route-warning");
  await expect(warning).toBeVisible();
  await expect(warning).toContainText("Rota não disponível");
  await expect(warning).toContainText("Falha simulada ao recalcular a rota.");
  await expect(page.getByRole("heading", { name: "Mapa do shopping" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Destino: NATURA/ })).toHaveCount(0);
  await expect(page.getByText("Rota pronta para começar", { exact: true })).toHaveCount(0);

  await page.unroute("**/api/routes");
  const retried = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.request().method() === "POST");
  await warning.getByRole("button", { name: "Recalcular rota", exact: true }).click();
  expect((await retried).ok()).toBeTruthy();
  await expect(page.getByTestId("route-warning")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Destino: NATURA/ })).toBeVisible();
});

test("Aba Mapa sinaliza rota desatualizada após falha de recálculo", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await start(page);
  await natura(page);
  await failRouteRequests(page);
  const failed = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Recalcular", exact: true }).click();
  expect((await failed).status()).toBe(503);
  await expect(page.getByTestId("route-panel")).toContainText("Falha simulada ao recalcular a rota.");
  await expect(page.getByTestId("route-panel")).toContainText("Este é o trajeto anterior.");

  await page.getByRole("tab", { name: "Mapa", exact: true }).click();
  const warning = page.getByTestId("route-warning");
  await expect(warning).toBeVisible();
  await expect(warning).toContainText("Rota desatualizada");
  await expect(warning).toContainText("Falha simulada ao recalcular a rota.");
  await expect(warning).toContainText(/último cálculo/i);
  await expect(page.getByRole("heading", { name: "Mapa do trajeto" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Destino: NATURA/ })).toBeVisible();
});
