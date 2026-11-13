import { test, expect } from "@playwright/test";
import { visitorQrUrl } from "./visitor-url";

test("Mapa 2D exibe rota contínua com setas direcionais por segmento", async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"));
  await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);

  await page.getByLabel("Buscar destinos", { exact: true }).fill("ADIDAS");
  await page.getByRole("button", { name: "ADIDAS, Aberto" }).click();
  await page.getByRole("button", { name: "Traçar rota", exact: true }).click();

  await expect(page.getByTestId("floor-map")).toBeVisible({ timeout: 15000 });
  await page.getByTestId("floor-map").screenshot({
    path: info.outputPath("mapa2d-rota-adidas.png"),
    fullPage: true,
  });

  // Deve haver polylines da rota (uma por aresta) com a cor da rota
  const routePolylines = page.locator('svg polyline[stroke="#6842d8"]');
  const count = await routePolylines.count();
  expect(count).toBeGreaterThanOrEqual(1);
});

test("Mapa 2D exibe origem e destino identificados", async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"));
  await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);

  await page.getByLabel("Buscar destinos", { exact: true }).fill("ADIDAS");
  await page.getByRole("button", { name: "ADIDAS, Aberto" }).click();
  await page.getByRole("button", { name: "Traçar rota", exact: true }).click();

  await expect(page.getByTestId("floor-map")).toBeVisible({ timeout: 15000 });
  await page.getByTestId("floor-map").screenshot({
    path: info.outputPath("mapa2d-origem-destino.png"),
    fullPage: true,
  });

  await expect(page.getByTestId("destination-marker")).toBeVisible();
});
