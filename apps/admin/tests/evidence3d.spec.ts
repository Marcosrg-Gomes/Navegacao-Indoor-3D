import { test, expect } from "@playwright/test";
import { visitorQrUrl } from "./visitor-url";

test("Evidência: mapa 3D com GLB real renderizado", async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"));
  await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);
  // Aguardar o GLB carregar e o modo 3D (auto) exibir o scene-map
  await expect(page.locator('[data-testid="scene-map"]')).toBeVisible({ timeout: 30000 });
  await page.locator('[data-testid="scene-map"]').screenshot({ path: info.outputPath("evidence-mapa3d-glb.png") });
});
