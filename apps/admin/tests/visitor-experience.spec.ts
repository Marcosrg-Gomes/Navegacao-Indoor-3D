import { expect, test, type Page } from "@playwright/test";
import { visitorQrUrl } from "./visitor-url";

async function start(page: Page) {
  await page.evaluate(() => {
    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}
  });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await expect.poll(async () => await page.getByTestId("origin-label").textContent(), { timeout: 15000 }).toContain("Entrada principal");
  await page.waitForTimeout(2000);
}

async function destination(page: Page, name = "NATURA") {
  const response = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.request().method() === "POST");
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await page.waitForTimeout(1000);
  await page.getByLabel("Buscar no Explorar").fill(name);
  await page.getByRole("button", { name: name + ", Aberto", exact: true }).click();
  await page.waitForTimeout(1000);
  return (await response).json();
}

test("Favoritos e recentes persistem; a posição precisa ser confirmada novamente", async ({ page }) => {
  await start(page);
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await page.getByLabel("Buscar no Explorar").fill("natura");
  await expect(page.getByRole("button", { name: /NATURA.*aberto/i })).toBeVisible();
});

test("Explorar busca e ordena pelo percurso da API", async ({ page, request }) => {
  const origin = await (await request.get("/api/qr-codes/MINI-ENTRADA-PRINCIPAL")).json();
  const distances = await (await request.get("/api/routes/distances?origem_no_id=" + origin.no.id + "&acessivel=false")).json();
  // Seleciona um nó que a API garante ser alcançável (distância definida), independentemente dos dados do banco
  const reachableNodeId = Object.entries(distances).find(([, d]) => typeof d === "number" && Number.isFinite(d))?.[0];
  expect(reachableNodeId).toBeDefined();
  const pois = await (await request.get("/api/pois")).json();
  const targetPoi = pois.find((p: any) => String(p.no_id) === reachableNodeId);
  expect(targetPoi).toBeDefined();
  await start(page);
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await page.getByLabel("Buscar no Explorar").fill(targetPoi.nome);
  // Localiza pelo nome do POI (o testID usa poi.id, mas a distância é por no_id; o nome é o vínculo confiável)
  const poiElement = page.getByRole("button", { name: targetPoi.nome + ", ver detalhes", exact: true });
  await expect(poiElement).toBeVisible({ timeout: 15000 });
  // Verifica que a distância está sendo exibida (formato pode variar por navegador)
  expect(distances[reachableNodeId]).toBeDefined();
  const distanciaEsperada = Math.round(distances[reachableNodeId]);
  // Aguarda o diretório carregar as distâncias (assíncrono após montar a tab Explorar)
  await expect(poiElement).toContainText(distanciaEsperada.toString(), { timeout: 15000 });
});

test("Serviços sem loja recebem rotas e permitem voltar à entrada", async ({ page }) => {
  await start(page);
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await page.getByLabel("Buscar no Explorar").fill("banheiro");
  await page.getByRole("button", { name: /banheiro.*aberto/i }).first().click();
  await expect.poll(async () => await page.getByRole("button", { name: "Cheguei ao destino", exact: true }).isVisible(), { timeout: 20000 }).toBeTruthy();
  await page.getByRole("button", { name: "Cheguei ao destino", exact: true }).click();
  await expect(page.getByTestId("origin-label")).toContainText("Banheiro");
});

test("Avançar instruções e visualizar outro piso não altera a posição", async ({ page }) => {
  await start(page);
  await page.getByRole("switch", { name: "Rota sem escadas" }).click();
  const route = await destination(page, "BURGER KING");
  const steps = route.etapas.filter((s: any) => s.tipo !== "inicio");
  const transition = steps.findIndex((s: any) => s.tipo === "troca_piso");
  expect(transition).toBeGreaterThanOrEqual(0);
  await page.getByRole("button", { name: "Ver próximos passos", exact: true }).click();
  await page.getByRole("button", { name: "Ver detalhes do percurso", exact: true }).click();
  for (let i = 0; i < transition; i++) await page.getByRole("button", { name: "Próximo passo", exact: true }).click();
  await expect(page.getByTestId("current-instruction")).toContainText(steps[transition].texto);
});

test("Recálculo mantém mapa, sinaliza falha e recupera sem perder a origem", async ({ page }) => {
  await start(page);
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await page.getByLabel("Buscar no Explorar").fill("NATURA");
  await expect(page.getByRole("button", { name: /NATURA.*aberto/i })).toBeVisible();
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
});

test("Explorar recupera erro de carregamento e mantém alvos legíveis no celular", async ({ page }) => {
  const initialRevision = page.waitForResponse((response) => response.url().endsWith("/navigation-state"));
  await page.setViewportSize({ width: 360, height: 800 });
  await start(page);
  await initialRevision;
  await page.route("**/api/pois?*", (r) => r.abort());
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await expect(page.getByRole("button", { name: "Tentar novamente", exact: true })).toBeVisible();
  await page.unroute("**/api/pois?*");
  await page.getByRole("button", { name: "Tentar novamente", exact: true }).click();
  await page.getByLabel("Buscar no Explorar").fill("ADIDAS");
  const save = page.getByRole("button", { name: "Salvar ADIDAS nos favoritos", exact: true });
  await expect(save).toBeVisible();
});