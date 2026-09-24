import { test, expect } from "@playwright/test";

const auth = { "X-API-Key": "audit-local-only" };

test("Mini Shopping: QR, GLB real, loja térrea, rota idêntica em 2D/3D e chegada", async ({ page, request }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const model = page.waitForResponse((r) => /mini-shopping-v\d+\.glb$/.test(r.url()));
  await page.goto("/?qr=MINI-ENTRADA-PRINCIPAL");
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  expect((await model).ok()).toBeTruthy();
  await expect(page.getByRole("button", { name: "Centralizar rota", exact: true })).toBeVisible();
  await page.getByLabel("Buscar destinos", { exact: true }).fill("ADIDAS");
  await page.getByRole("button", { name: "ADIDAS, Aberto" }).click();
  const response = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Traçar rota", exact: true }).click();
  const route = await (await response).json();
  await expect(page.getByTestId("scene-map")).toHaveAttribute("data-destination-code", "E01");
  await expect(page.getByTestId("scene-map")).toHaveAttribute("data-route-node-ids", route.nos.map((n: { id: number }) => n.id).join(","));
  await page.getByTestId("scene-map").screenshot({ path: "../../evidence/visitor-ground-route.png" });
  await page.getByRole("button", { name: "Mapa 2D", exact: true }).click();
  await expect(page.getByTestId("floor-map")).toBeVisible();
  const points = await page.locator("svg polyline").first().getAttribute("points");
  expect(points?.trim().split(/\s+/).length).toBe(route.nos.length);
  await page.getByRole("button", { name: "Cheguei ao destino", exact: true }).click();
  await expect(page.getByTestId("arrival-notice")).toBeVisible();
  expect(errors).toEqual([]);
  await info.attach("route", { body: JSON.stringify(route, null, 2), contentType: "application/json" });
});

test("Mini Shopping: elevador acessível, mudança de piso e bloqueio", async ({ page, request }, info) => {
  await page.setViewportSize({ width: 414, height: 896 });
  await page.goto("/?qr=MINI-ENTRADA-PRINCIPAL");
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  await page.getByRole("switch", { name: "Rota acessível" }).click();
  await page.getByLabel("Buscar destinos", { exact: true }).fill("BURGER");
  await page.getByRole("button", { name: "BURGER KING, Aberto" }).click();
  const response = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Traçar rota", exact: true }).click();
  const route = await (await response).json();
  expect(route.nos.some((n: { tipo: string }) => n.tipo === "elevador")).toBeTruthy();
  expect(route.nos.some((n: { tipo: string }) => n.tipo.includes("escada"))).toBeFalsy();
  const floorId = route.nos.at(-1).piso_id;
  await page.getByRole("button", { name: /^Mezanino/ }).click();
  await expect(page.getByRole("button", { name: "Centralizar rota", exact: true })).toBeVisible();
  await expect(page.getByTestId("scene-map")).toHaveAttribute("data-floor-id", String(floorId));
  await expect(page.getByTestId("scene-map")).toHaveAttribute("data-route-node-ids", route.nos.filter((n: { piso_id: number }) => n.piso_id === floorId).map((n: { id: number }) => n.id).join(","));
  await page.getByTestId("scene-map").screenshot({ path: "../../evidence/visitor-upper-accessible.png" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  const edges = await (await request.get("/api/admin/edges", { headers: auth })).json();
  const lift = route.nos.filter((n: { tipo: string }) => n.tipo === "elevador");
  const edge = edges.find((e: { no_origem_id: number; no_destino_id: number }) => e.no_origem_id === lift[0].id && e.no_destino_id === lift[1].id);
  expect(edge).toBeTruthy();
  try {
    expect((await request.put(`/api/admin/edges/${edge.id}`, { headers: auth, data: { ativa: false } })).ok()).toBeTruthy();
    await page.getByRole("button", { name: "Recalcular", exact: true }).click();
    await expect(page.getByText("Não foi possível encontrar uma rota entre os nós especificados.", { exact: true })).toBeVisible();
  } finally {
    await request.put(`/api/admin/edges/${edge.id}`, { headers: auth, data: { ativa: true } });
  }
  await info.attach("accessible-route", { body: JSON.stringify(route, null, 2), contentType: "application/json" });
});

test("Falha do GLB preserva mapa 2D, destino e instruções; tentativa manual recupera", async ({ page }) => {
  await page.route("**/mini-shopping-v*.glb", (route) => route.abort());
  await page.goto("/?qr=MINI-ENTRADA-PRINCIPAL");
  await expect(page.getByTestId("scene-fallback")).toBeVisible();
  await expect(page.getByTestId("floor-map")).toBeVisible();
  await page.getByLabel("Buscar destinos", { exact: true }).fill("ADIDAS");
  await page.getByRole("button", { name: "ADIDAS, Aberto" }).click();
  await page.getByRole("button", { name: "Traçar rota", exact: true }).click();
  await expect(page.getByTestId("route-panel")).toContainText("Você chegou ao destino: ADIDAS");
  await page.unroute("**/mini-shopping-v*.glb");
  await page.getByRole("button", { name: "Tentar 3D novamente", exact: true }).click();
  await expect(page.getByRole("button", { name: "Centralizar rota", exact: true })).toBeVisible();
  await expect(page.getByTestId("scene-map")).toHaveAttribute("data-destination-code", "E01");
});

test("Painel mostra inventário da cena e links dos pisos", async ({ page }) => {
  await page.goto("/admin/cena-3d");
  await page.getByLabel("API key", { exact: true }).fill("audit-local-only");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByText("Catálogo consistente", { exact: true })).toBeVisible();
  await expect(page.getByRole("row").filter({ has: page.getByRole("cell", { name: "Lojas", exact: true }) })).toContainText("22");
  await expect(page.getByRole("link", { name: "Mezanino", exact: true })).toHaveAttribute("href", /shopping=\d+&floor=\d+/);
  await page.screenshot({ path: "../../evidence/admin-scene-validation.png", fullPage: true });
});

test("Clique na loja visível do térreo abre o POI correto sem selecionar o piso oculto", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/?qr=MINI-ENTRADA-PRINCIPAL");
  await expect(page.getByRole("button", { name: "Centralizar rota", exact: true })).toBeVisible();
  const scene = page.getByTestId("scene-map");
  await scene.scrollIntoViewIfNeeded();
  // Use the projected E01 label as reference, then click the actual storefront
  // below/left of its entrance. This still raycasts the GLB, not the label.
  const label = (await scene.getByRole("button", { name: "ADIDAS, ver detalhes" }).boundingBox())!;
  await page.mouse.click(label.x + label.width / 2 - 20, label.y + label.height / 2 + 26);
  await expect(page.getByText("ADIDAS", { exact: true })).toBeVisible();
  await expect(page.getByText("BURGER KING", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Traçar rota", exact: true })).toBeVisible();
});

test("Sem WebGL o visitante mantém QR e mapa 2D", async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      return type === "webgl2" ? null : getContext.apply(this, [type, ...args] as Parameters<typeof getContext>);
    } as typeof getContext;
  });
  await page.goto("/?qr=MINI-ENTRADA-PRINCIPAL");
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  await expect(page.getByTestId("scene-fallback")).toContainText("WebGL indisponível");
  await expect(page.getByTestId("floor-map")).toBeVisible();
});

test("GLB sem resposta atinge o limite de carregamento e libera o mapa 2D", async ({ page }) => {
  await page.route("**/mini-shopping-v*.glb", () => {});
  await page.goto("/?qr=MINI-ENTRADA-PRINCIPAL", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  await expect(page.getByTestId("scene-fallback")).toContainText("excedeu 20 segundos", { timeout: 25_000 });
  await expect(page.getByTestId("floor-map")).toBeVisible();
  await expect(page.getByRole("button", { name: "Tentar 3D novamente", exact: true })).toBeVisible();
});
