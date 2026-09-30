import { expect, test } from "@playwright/test";

test("Início no celular oferece busca, posição e categorias com ações legíveis", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Onde você quer ir?" })).toBeVisible();
  await expect(page.getByTestId("origin-label")).toHaveText("Ponto de partida não definido");
  await expect(page.getByRole("button", { name: "Definir ponto de partida" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Explorar Banheiros" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("home-390.png") });
  for (const button of [page.getByRole("button", { name: /Ler QR Code/ }), page.getByRole("button", { name: "Definir ponto de partida" })]) {
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  await page.setViewportSize({ width: 320, height: 640 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole("button", { name: "Explorar Banheiros" })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });

  await page.getByRole("button", { name: "Explorar Banheiros" }).click();
  await expect(page).toHaveURL(/\/explore\?shortcut=wc/);
  await expect(page.getByRole("button", { name: "Mostrar Banheiros" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Remover filtro Banheiros" })).toBeVisible();
  await expect(page.getByText(/4 locais · banheiros/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("banheiros-390.png") });
});

test("Rota no celular mostra passo atual, mapa, correção de posição e chegada", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?qr=MINI-ENTRADA-PRINCIPAL");
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  const firstVisit = page.getByRole("button", { name: "Entendi", exact: true });
  if (await firstVisit.isVisible()) await firstVisit.click();
  await page.getByLabel("Buscar destinos", { exact: true }).fill("NATURA");
  await page.getByRole("button", { name: "NATURA, Aberto", exact: true }).click();
  await page.getByRole("button", { name: "Traçar rota", exact: true }).click();
  await expect(page.getByTestId("current-instruction")).toBeVisible();
  await expect(page.getByRole("button", { name: "Ver mapa do trajeto ↓" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Estou perdido" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cheguei ao destino" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("route-390.png") });
});
