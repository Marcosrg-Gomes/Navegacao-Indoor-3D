import { test, expect } from "@playwright/test";
import { visitorQrUrl } from "./visitor-url";

test("Confirmação de chegada mobile após parar simulação", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 414, height: 896 });
  await page.goto(visitorQrUrl("ENTRADA-PRINCIPAL"));
  await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);

  // Pesquisar destino
  await page.getByRole("button", { name: "Pesquisar destinos" }).click();
  await expect(page).toHaveURL(/.*\/explore.*/, { timeout: 15000 });
  await page.getByLabel("Buscar no Explorar").fill("TECHSTORE");
  const routeResponse = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Como chegar a TECHSTORE" }).click();
  await (await routeResponse).json();

  // Verificar rota no mapa
  await expect(page.getByTestId("route-panel")).toBeVisible({ timeout: 15000 });

  // Iniciar navegação (simulação)
  await page.getByRole("button", { name: "Iniciar navegação", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pausar", exact: true })).toBeVisible();

  // Parar simulação (Encerrar via Mais opções)
  await page.getByRole("button", { name: "Mais opções" }).click();
  await page.getByRole("button", { name: "Encerrar", exact: true }).click();

  // Após parar, o botão "Cheguei ao destino" deve estar disponível (rota mantida)
  await expect(page.getByRole("button", { name: "Cheguei ao destino", exact: true })).toBeVisible();

  // Confirmar chegada
  await page.getByRole("button", { name: "Cheguei ao destino", exact: true }).click();
  await expect(page.getByTestId("arrival-notice")).toBeVisible();

  expect(errors).toEqual([]);
});
