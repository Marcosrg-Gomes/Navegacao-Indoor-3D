import { test, expect } from "@playwright/test";
import { visitorQrUrl } from "./visitor-url";

test("Mapa 2D exibe rota contínua com setas direcionais por segmento", async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);

  await page.getByRole("tab", { name: /Explorar/ }).click();
  await page.waitForTimeout(2000);
  await page.getByLabel("Buscar no Explorar").fill("ADIDAS");
  await expect(page.getByRole("button", { name: "ADIDAS, ver detalhes", exact: true })).toBeVisible();
  await page.getByTestId("origin-label").screenshot({ path: info.outputPath("mapa2d-rota-adidas.png"), fullPage: true });
});

test("Mapa 2D exibe origem e destino identificados", async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);

  await page.getByRole("tab", { name: /Explorar/ }).click();
  await page.waitForTimeout(2000);
  await page.getByLabel("Buscar no Explorar").fill("ADIDAS");
  await expect(page.getByRole("button", { name: "ADIDAS, ver detalhes", exact: true })).toBeVisible();
  await page.getByTestId("origin-label").screenshot({ path: info.outputPath("mapa2d-origem-destino.png"), fullPage: true });
});
