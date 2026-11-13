import { test, expect } from "@playwright/test";
import { visitorQrUrl } from "./visitor-url";

test("Diagnóstico: verificar se scene-map aparece após QR", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"));
  await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);
  await expect(page.locator('[data-testid="scene-map"]')).toBeVisible({ timeout: 30000 });
  const sceneMap = await page.locator('[data-testid="scene-map"]').count();
  const floorMap = await page.getByTestId("floor-map").count();
  console.log(`DIAG: sceneMap=${sceneMap} floorMap=${floorMap}`);
  expect(sceneMap).toBeGreaterThan(0);
});
