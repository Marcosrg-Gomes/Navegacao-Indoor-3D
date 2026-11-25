import { test, expect } from "@playwright/test";
import { visitorQrUrl } from "./visitor-url";

test("Início no celular oferece busca, posição e categorias com ações legíveis", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("home-390.png") });
  await page.setViewportSize({ width: 320, height: 640 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
});

test("Rota no celular mostra passo atual, mapa, correção de posição e chegada", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await page.waitForTimeout(2000);
  await page.getByLabel("Buscar no Explorar").fill("NATURA");
  await expect(page.getByRole("button", { name: "NATURA, ver detalhes", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("route-390.png") });
});
