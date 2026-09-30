import { expect, test } from "@playwright/test";

test("Barra inferior mostra quatro destinos claros em celulares estreitos", async ({ page }, info) => {
  for (const width of [320, 360, 390, 414]) {
    await page.setViewportSize({ width, height: 760 });
    await page.goto("/");
    const names = ["Início", "Mapa", "Ler QR Code", "Explorar"];
    for (const name of names) {
      const tab = page.getByRole("tab", { name, exact: true });
      await expect(tab).toBeInViewport({ ratio: 1 });
      const box = (await tab.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`inicio-${width}.png`) });

    await page.getByRole("tab", { name: "Mapa", exact: true }).click();
    await expect(page).toHaveURL(/\/map$/);
    await expect(page.getByRole("heading", { name: "Mapa do shopping" })).toBeVisible();
    await expect(page.getByTestId("floor-map")).toBeVisible();
    await page.screenshot({ path: info.outputPath(`mapa-${width}.png`) });

    await page.getByRole("tab", { name: "Início", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Onde você quer ir?" })).toBeVisible();
  }
});

test("Mapa mantém posição e oferece instruções quando há rota ativa", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?qr=MINI-ENTRADA-PRINCIPAL");
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  await page.getByLabel("Buscar destinos", { exact: true }).fill("NATURA");
  await page.getByRole("button", { name: "NATURA, Aberto", exact: true }).click();
  await page.getByRole("button", { name: "Traçar rota", exact: true }).click();
  await page.getByRole("tab", { name: "Mapa", exact: true }).click();
  const map = page.getByRole("main", { name: "Mapa do shopping" });
  await expect(page.getByRole("heading", { name: "Mapa do trajeto" })).toBeVisible();
  await expect(map.getByTestId("origin-label")).toContainText("Entrada principal");
  await expect(map.getByRole("button", { name: /Destino: NATURA/ })).toBeVisible();
  await expect(map.getByTestId("floor-map")).toBeVisible();
  await page.screenshot({ path: info.outputPath("mapa-rota-390.png") });
  await map.getByRole("button", { name: /Destino: NATURA/ }).click();
  await expect(page.getByTestId("current-instruction")).toBeVisible();
});

test("Leitura do código QR abre o mapa com a posição atualizada", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 760 });
  await page.goto("/scan");
  await page.getByLabel("Código ou link do QR").fill("MINI-ENTRADA-PRINCIPAL");
  await page.getByRole("button", { name: "Usar código" }).click();
  await expect(page).toHaveURL(/\/map$/);
  await expect(page.getByRole("main", { name: "Mapa do shopping" }).getByTestId("origin-label")).toContainText("Entrada principal");
  await expect(page.getByRole("tab", { name: "Mapa", exact: true })).toHaveAttribute("aria-selected", "true");
});

test("Mapa mobile inicia em 2D e permite alternar para 3D sem perder zoom", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/map");
  await expect(page.getByTestId("floor-map")).toBeVisible();
  await page.getByRole("button", { name: "Mapa 3D", exact: true }).click();
  const scene = page.getByTestId("scene-map");
  await expect(scene).toBeVisible();
  await expect(scene).toHaveAttribute("data-camera-target", /\d/);
  await expect(page.getByTestId("floor-map")).toBeHidden();
  await page.getByRole("button", { name: "Aumentar zoom", exact: true }).click();
  await expect(scene).toHaveAttribute("data-zoom", "1.500");
  await page.getByRole("button", { name: "Mapa 2D", exact: true }).click();
  await expect(page.getByTestId("floor-map")).toBeVisible();
  await page.getByRole("button", { name: "Mapa 3D", exact: true }).click();
  await expect(scene).toHaveAttribute("data-zoom", "1.500");
});

test("Trocar de aba preserva o enquadramento escolhido no mapa", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/map");
  const map = page.getByRole("main", { name: "Mapa do shopping" });
  await expect(map.getByTestId("floor-map")).toBeVisible();
  await map.getByRole("button", { name: "Aumentar zoom", exact: true }).click();
  await expect(map.getByTestId("map-2d-viewport")).toHaveAttribute("data-zoom", "1.500");
  await page.getByRole("tab", { name: "Explorar", exact: true }).click();
  await page.getByRole("tab", { name: "Mapa", exact: true }).click();
  await expect(map.getByTestId("map-2d-viewport")).toHaveAttribute("data-zoom", "1.500");
});
