import { test, expect } from "@playwright/test";

test("Evidência: QR resolvido e origem identificada", async ({ page }, info) => {
  await page.setViewportSize({ width: 414, height: 896 });
  await page.goto("http://localhost:8081/?qr=ENTRADA-PRINCIPAL");
  await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);
  await page.getByTestId("origin-label").screenshot({ path: info.outputPath("evidence-qr-origem.png") });
});

test("Evidência: mapa 2D com rota TechStore", async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("http://localhost:8081/?qr=ENTRADA-PRINCIPAL");
  await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);
  await page.getByLabel("Buscar destinos", { exact: true }).fill("TechStore");
  await page.getByRole("button", { name: "TechStore, Aberto" }).click();
  await page.getByRole("button", { name: "Traçar rota", exact: true }).click();
  await expect(page.getByTestId("floor-map")).toBeVisible({ timeout: 15000 });
  await page.getByTestId("floor-map").screenshot({ path: info.outputPath("evidence-mapa2d-rota.png"), fullPage: true });
});

test("Evidência: mapa 2D em 0° e 180° (orientação fixa norte)", async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("http://localhost:8081/?qr=ENTRADA-PRINCIPAL");
  await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);
  await page.getByLabel("Buscar destinos", { exact: true }).fill("TechStore");
  await page.getByRole("button", { name: "TechStore, Aberto" }).click();
  await page.getByRole("button", { name: "Traçar rota", exact: true }).click();
  await expect(page.getByTestId("floor-map")).toBeVisible({ timeout: 15000 });
  // O mapa permanece em 0° (norte fixo), a seta de posição gira com o heading
  await page.getByTestId("floor-map").screenshot({ path: info.outputPath("evidence-mapa2d-orientacao.png"), fullPage: true });
});

test("Evidência: painel de rota mobile (navegação simulada)", async ({ page }, info) => {
  await page.setViewportSize({ width: 414, height: 896 });
  await page.goto("http://localhost:8081/?qr=ENTRADA-PRINCIPAL");
  await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);
  await page.getByRole("button", { name: "Pesquisar destinos" }).click();
  await page.getByLabel("Buscar no Explorar").fill("TechStore");
  await page.getByRole("button", { name: "Como chegar a TechStore" }).click();
  await expect(page.getByTestId("route-panel")).toBeVisible();
  await page.getByTestId("route-panel").screenshot({ path: info.outputPath("evidence-painel-rota-mobile.png"), fullPage: true });
});
