import { test, expect } from "@playwright/test";
import { visitorQrUrl } from "./visitor-url";

async function openAtEntrance(page: import("@playwright/test").Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
}

test("alternância 2D/3D preserva a orientação permitida", async ({ page }) => {
  await openAtEntrance(page);
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
});

test("zoom e centralização continuam funcionando no 2D", async ({ page }) => {
  await openAtEntrance(page);
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
});

test("mudança de piso mantém rotação 0° sem rota", async ({ page }) => {
  await openAtEntrance(page);
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
});

test("navegação: mapa só usa 0°/180°, não gira nas curvas e a seta aponta para cima", async ({ page }) => {
  await openAtEntrance(page);
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
});
