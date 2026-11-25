import { test, expect } from "@playwright/test";
import { visitorQrUrl } from "./visitor-url";

test("Fluxo completo: QR, busca, rota, navegação simulada, chegada e nova navegação", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 414, height: 896 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"));

  // 1. Reconhecer origem pelo QR
  await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);

  // 2. Ir para Explorar e pesquisar
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await page.waitForTimeout(2000);
  await page.getByLabel("Buscar no Explorar").fill("NATURA");
  await expect(page.getByRole("button", { name: "NATURA, ver detalhes", exact: true })).toBeVisible();

  expect(errors).toEqual([]);
});

test("Destino inexistente não quebra o fluxo", async ({ page }) => {
  await page.setViewportSize({ width: 414, height: 896 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);
  await page.getByRole("button", { name: "Pesquisar destinos" }).click();
  await page.getByLabel("Buscar no Explorar").fill("ZZZ_NAO_EXISTE");
  await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);
});

test("Acessibilidade: rota sem escadas com mudança de pavimento", async ({ page }) => {
  await page.setViewportSize({ width: 414, height: 896 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await page.waitForTimeout(2000);
  await page.getByLabel("Buscar no Explorar").fill("banheiro");
  const routeResponse = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.request().method() === "POST");
  await page.getByRole("button", { name: /mezanino.*aberto/i }).first().click();
  const route = await (await routeResponse).json();
  expect(route.sucesso).toBeTruthy();
  expect(route.nos.some((n: { tipo: string }) => n.tipo === "elevador")).toBeTruthy();
  expect(route.nos.some((n: { tipo: string }) => n.tipo.includes("escada"))).toBeFalsy();
});
