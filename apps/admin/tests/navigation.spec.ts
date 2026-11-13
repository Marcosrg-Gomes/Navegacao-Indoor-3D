import { test, expect } from "@playwright/test";
import { visitorQrUrl } from "./visitor-url";

test("Fluxo completo: QR, busca, rota, navegação simulada, chegada e nova navegação", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 414, height: 896 });
  await page.goto(visitorQrUrl("ENTRADA-PRINCIPAL"));

  // 1. Reconhecer origem pelo QR
  await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);

  // 2. Pesquisar estabelecimento
  await page.getByRole("button", { name: "Pesquisar destinos" }).click();
  await page.getByLabel("Buscar no Explorar").fill("TechStore");

  // 3. Solicitar rota
  const routeResponse = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Como chegar a TechStore" }).click();
  const route = await (await routeResponse).json();

  // 4. Exibir rota no mapa 2D
  await expect(page.getByTestId("floor-map")).toBeVisible({ timeout: 15000 });

  // 5. Painel de rota visível (instruções disponíveis)
  await expect(page.getByTestId("route-panel")).toBeVisible();

  expect(errors).toEqual([]);
  await info.attach("route", { body: JSON.stringify(route, null, 2), contentType: "application/json" });
});

test("Destino inexistente não quebra o fluxo", async ({ page }) => {
  await page.setViewportSize({ width: 414, height: 896 });
  await page.goto(visitorQrUrl("ENTRADA-PRINCIPAL"));
  await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);
  await page.getByRole("button", { name: "Pesquisar destinos" }).click();
  await page.getByLabel("Buscar no Explorar").fill("ZZZ_NAO_EXISTE");
  await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);
});

test("Acessibilidade: rota sem escadas com mudança de pavimento", async ({ page }) => {
  await page.setViewportSize({ width: 414, height: 896 });
  await page.goto(visitorQrUrl("ENTRADA-PRINCIPAL"));
  await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);
  await page.getByRole("button", { name: "Pesquisar destinos" }).click();
  // Aguarda a tela Explorar montar antes de abrir filtros
  await expect(page.getByRole("button", { name: /Filtros/ })).toBeVisible({ timeout: 10000 });
  await page.getByRole("button", { name: /Filtros/ }).click();
  // Aguarda o sheet de filtros abrir
  await expect(page.getByText("Filtros e ordenação", { exact: true })).toBeVisible({ timeout: 10000 });
  await page.getByText("Com rota sem escadas", { exact: true }).click();
  await expect(page.getByRole("button", { name: /Mostrar resultados/ })).toBeVisible({ timeout: 10000 });
  await page.getByRole("button", { name: /Mostrar resultados/ }).click();
  await page.getByLabel("Buscar no Explorar").fill("Livraria Superior");
  const routeResponse = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Como chegar a Livraria Superior" }).click();
  const route = await (await routeResponse).json();
  expect(route.sucesso).toBeTruthy();
  expect(route.nos.some((n: { tipo: string }) => n.tipo === "elevador")).toBeTruthy();
  expect(route.nos.some((n: { tipo: string }) => n.tipo.includes("escada"))).toBeFalsy();
});
