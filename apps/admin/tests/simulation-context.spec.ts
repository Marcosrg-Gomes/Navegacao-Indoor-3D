import { test, expect } from "@playwright/test";
import { visitorQrUrl } from "./visitor-url";

test("Contexto: simulação carrega e reconhece origem via QR", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
});

test("Contexto: navegação para Explorar funciona", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
});

test("Contexto: busca por NATURA no Explorar", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await page.waitForTimeout(2000);
  await page.getByLabel("Buscar no Explorar").fill("NATURA");
  await expect(page.getByRole("button", { name: "NATURA, ver detalhes", exact: true })).toBeVisible();
});
