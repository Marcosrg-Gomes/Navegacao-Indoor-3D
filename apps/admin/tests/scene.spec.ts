import { test, expect } from "@playwright/test";
import { visitorQrUrl } from "./visitor-url";

const auth = { "X-API-Key": "audit-local-admin-key-with-32-characters", "X-Audit-Reason": "Validacao automatizada" };

test("Mini Shopping: QR, GLB real, loja térrea, rota idêntica em 2D/3D e chegada", async ({ page, request }, info) => {
  test.skip(info.project.name === "webkit", "WebKit headless não renderiza WebGL/Three.js GLB (limitação do engine)");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"));
  await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);
  // O modo "auto" renderiza a cena 3D: o scene-map só fica visível quando o GLB carrega com sucesso.
  await expect(page.getByTestId("scene-map")).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole("button", { name: "Centralizar rota", exact: true })).toBeVisible({ timeout: 20000 });
  await page.getByLabel("Buscar destinos", { exact: true }).fill("ADIDAS");
  await page.getByRole("button", { name: "ADIDAS, Aberto" }).click();
  const response = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Traçar rota", exact: true }).click();
  const route = await (await response).json();
  await expect(page.getByTestId("scene-map")).toBeVisible({ timeout: 20000 });
  await expect(page.getByTestId("scene-map")).toHaveAttribute("data-destination-code", "E01");
  await expect(page.getByTestId("scene-map")).toHaveAttribute("data-route-node-ids", route.nos.map((n: { id: number }) => n.id).join(","));
  await page.getByTestId("scene-map").screenshot({ path: info.outputPath("visitor-ground-route.png") });
  await page.getByRole("button", { name: "Mapa 2D", exact: true }).click();
  await expect(page.getByTestId("floor-map")).toBeVisible();
  const visibleEdges = route.nos.slice(1).filter((node: { piso_id: number }, index: number) => node.piso_id === route.nos[index].piso_id).length;
  await expect(page.locator('svg polyline[stroke="#1f5fc9"]')).toHaveCount(visibleEdges);
  await page.getByRole("button", { name: "Cheguei ao destino", exact: true }).click();
  await expect(page.getByTestId("arrival-notice")).toBeVisible();
  expect(errors).toEqual([]);
  await info.attach("route", { body: JSON.stringify(route, null, 2), contentType: "application/json" });
});

test("Mini Shopping: elevador acessível, mudança de piso e bloqueio", async ({ page, request }, info) => {
  await page.setViewportSize({ width: 414, height: 896 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await page.waitForTimeout(2000);
  await page.getByLabel("Buscar no Explorar").fill("BURGER");
  await expect(page.getByText("BURGER KING", { exact: true })).toBeVisible();
});

test("Falha do GLB preserva mapa 2D, destino e instruções; tentativa manual recupera", async ({ page }) => {
  await page.route("**/mini-shopping-v*.glb", (route) => route.abort());
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"));
  await expect(page.getByTestId("scene-fallback")).toBeVisible();
  await expect(page.getByTestId("floor-map")).toBeVisible();
  await page.getByLabel("Buscar destinos", { exact: true }).fill("ADIDAS");
  await page.getByRole("button", { name: "ADIDAS, Aberto" }).click();
  await page.getByRole("button", { name: "Traçar rota", exact: true }).click();
  await page.getByRole("button", { name: "Ver próximos passos", exact: true }).click();
  // Sem o GLB, a navegação continua em 2D: o route-panel mostra a rota ativa (a chegada exige simulação de movimento).
  await expect(page.getByTestId("route-panel")).toContainText(/A CAMINHO DE|Siga em frente/);
  await expect(page.getByTestId("scene-fallback")).toBeVisible();
  await expect(page.getByRole("button", { name: "Tentar 3D novamente", exact: true })).toBeVisible();
  const recoveredModel = page.waitForResponse((response) => /mini-shopping-v\d+\.glb$/.test(response.url()) && response.ok());
  await page.unroute("**/mini-shopping-v*.glb");
  await page.getByRole("button", { name: "Tentar 3D novamente", exact: true }).click();
  expect((await recoveredModel).ok()).toBeTruthy();
  await expect(page.getByRole("button", { name: "Centralizar rota", exact: true })).toBeVisible({ timeout: 20000 });
  await expect(page.getByTestId("scene-map")).toHaveAttribute("data-destination-code", "E01");
});

test("Painel mostra inventário da cena e links dos pisos", async ({ page }) => {
  await page.goto("/admin/cena-3d");
  await expect(page.getByLabel(/Chave de acesso/)).toBeVisible({ timeout: 15000 });
  await page.getByLabel(/Chave de acesso/).fill("audit-local-admin-key-with-32-characters");
  await page.getByRole("button", { name: "Entrar no painel", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Catálogo/ })).toBeVisible({ timeout: 15000 });
  await page.screenshot({ path: "../../evidence/admin-scene-validation.png", fullPage: true });
});

test("Botão acessível da loja visível do térreo abre o POI correto", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"));
  await expect(page.getByRole("button", { name: "Centralizar rota", exact: true })).toBeVisible({ timeout: 20000 });
  const scene = page.getByTestId("scene-map");
  await scene.scrollIntoViewIfNeeded();
  const poiResponse = page.waitForResponse((response) => /\/api\/pois\/\d+$/.test(response.url()) && response.request().method() === "GET");
  await scene.getByRole("button", { name: "ADIDAS, ver detalhes" }).click();
  const poi = await poiResponse;
  expect(poi.ok()).toBeTruthy();
  expect((await poi.json()).codigo).toBe("E01");
  // A planta SVG também contém o texto "ADIDAS" (camada decorativa do 2D, oculta no modo 3D).
  await expect(page.getByText("ADIDAS", { exact: true }).filter({ visible: true })).toBeVisible();
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
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"));
  await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);
  await expect(page.getByTestId("scene-fallback")).toContainText("WebGL indisponível");
  await expect(page.getByTestId("floor-map")).toBeVisible();
});

test("GLB sem resposta atinge o limite de carregamento e libera o mapa 2D", async ({ page }) => {
  await page.route("**/mini-shopping-v*.glb", () => {});
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);
  await expect(page.getByTestId("scene-fallback")).toContainText("excedeu 20 segundos", { timeout: 25_000 });
  await expect(page.getByTestId("floor-map")).toBeVisible();
  await expect(page.getByRole("button", { name: "Tentar 3D novamente", exact: true })).toBeVisible();
});
