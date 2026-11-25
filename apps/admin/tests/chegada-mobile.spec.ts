import { test, expect } from "@playwright/test";
import { visitorQrUrl } from "./visitor-url";

test("Confirmação de chegada mobile após parar simulação", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 414, height: 896 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  // 1. Reconhecer origem pelo QR
  await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);

  // 2. Ir para Explorar e selecionar um destino
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await page.waitForTimeout(2000);
  await page.getByLabel("Buscar no Explorar").fill("NATURA");
  await expect(page.getByRole("button", { name: "NATURA, ver detalhes", exact: true })).toBeVisible();

  expect(errors).toEqual([]);
});
