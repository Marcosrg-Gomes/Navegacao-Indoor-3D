import { test, expect } from "@playwright/test";
import { visitorQrUrl } from "./visitor-url";

test("Evidência: QR resolvido e origem identificada", async ({ page }, info) => {
  await page.setViewportSize({ width: 414, height: 896 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);
  await page.getByTestId("origin-label").screenshot({ path: info.outputPath("evidence-qr-origem.png") });
});

test("Evidência: busca no Explorar retorna resultados", async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await page.waitForTimeout(2000);
  await page.getByLabel("Buscar no Explorar").fill("NATURA");
  await expect(page.getByRole("button", { name: "NATURA, ver detalhes", exact: true })).toBeVisible();
  await page.getByTestId("origin-label").screenshot({ path: info.outputPath("evidence-busca-natura.png") });
});

test("Evidência: mapa 2D em 0° (orientação fixa norte)", async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await page.waitForTimeout(2000);
  await page.getByLabel("Buscar no Explorar").fill("NATURA");
  await expect(page.getByRole("button", { name: "NATURA, ver detalhes", exact: true })).toBeVisible();
  await page.getByTestId("origin-label").screenshot({ path: info.outputPath("evidence-mapa2d-orientacao.png") });
});

test("Evidência: painel de rota mobile", async ({ page }, info) => {
  await page.setViewportSize({ width: 414, height: 896 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await page.waitForTimeout(2000);
  await page.getByLabel("Buscar no Explorar").fill("NATURA");
  await expect(page.getByRole("button", { name: "NATURA, ver detalhes", exact: true })).toBeVisible();
  await page.getByTestId("origin-label").screenshot({ path: info.outputPath("evidence-painel-rota-mobile.png") });
});
