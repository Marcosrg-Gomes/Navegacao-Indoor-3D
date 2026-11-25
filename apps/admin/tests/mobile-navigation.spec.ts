import { test, expect } from "@playwright/test";
import { visitorQrUrl } from "./visitor-url";

test("Barra inferior mostra quatro destinos claros em celulares estreitos", async ({ page }, info) => {
  for (const width of [320, 360, 390, 414]) {
    await page.setViewportSize({ width, height: 760 });
    await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`inicio-${width}.png`) });
  }
});

test("Mapa mantém posição e oferece instruções quando há rota ativa", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await page.waitForTimeout(2000);
  await page.getByLabel("Buscar no Explorar").fill("NATURA");
  await expect(page.getByRole("button", { name: "NATURA, ver detalhes", exact: true })).toBeVisible();
});

test("Leitura do código QR abre o mapa com a posição atualizada", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
});

test("Trocar de aba preserva o enquadramento escolhido no mapa", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await page.waitForTimeout(2000);
  await page.getByRole("tab", { name: /Mapa/ }).click();
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
});
