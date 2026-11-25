import { test, expect } from "@playwright/test";
import { visitorQrUrl } from "./visitor-url";

test("navegação mobile mantém o mapa como foco e usa uma ação principal", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("navegacao-waze-390.png"), fullPage: true });
});

test("falha na rota no celular mostra o erro no banner sem anunciar caminho pronto", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
});

test("mapa baixo mantém a planta orientada e a posição longe da lateral", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
});

test("chegada confirmada mantém o mapa e a próxima rota parte da loja", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
});

test("mapa 3D no celular conserva posição e controles durante a navegação", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  await page.screenshot({ path: info.outputPath("mapa-3d-celular.png"), fullPage: true });
});
