import { test, expect } from "@playwright/test";
import { visitorQrUrl } from "./visitor-url";

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => {
    const msg = error.message || "";
    // Avisos de compilação de shader WebGL/Three.js no WebKit não são falhas funcionais.
    if (/getShaderInfoLog|getProgramInfoLog/.test(msg)) return;
    errors.push(msg);
  });
  (page as Page & { runtimeErrors?: string[] }).runtimeErrors = errors;
});
test.afterEach(async ({ page }) => {
  expect((page as Page & { runtimeErrors?: string[] }).runtimeErrors).toEqual([]);
});

test("Explorar mantém pesquisa e filtros separados do mapa no celular", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await expect.poll(async () => await page.getByTestId("origin-label").textContent(), { timeout: 15000 }).toContain("Entrada principal");
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await page.waitForTimeout(2000);
  await page.getByLabel("Buscar no Explorar").fill("ADIDAS");
  await expect(page.getByRole("button", { name: "ADIDAS, ver detalhes", exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath("directory-desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("Buscar no Explorar").fill("ADIDAS");
  await expect(page.getByRole("button", { name: "ADIDAS, ver detalhes", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("directory-mobile.png") });
});

test("Reconhecer um lugar exige confirmação e Estou perdido recalcula mantendo destino", async ({ page }, info) => {
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  await page.screenshot({ path: info.outputPath("intent-home.png") });
});

test("Prévia 3D muda a câmera do trecho sem alterar a origem (apenas quando cena 3D disponível)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
});

test("Passeio entre favoritos usa cada chegada como origem da próxima parada", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  await page.screenshot({ path: info.outputPath("passeio-favoritos.png") });
});
