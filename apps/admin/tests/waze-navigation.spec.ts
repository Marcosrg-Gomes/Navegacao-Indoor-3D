import { expect, test } from "@playwright/test";

test("navegação mobile mantém o mapa como foco e usa uma ação principal", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?qr=MINI-ENTRADA-PRINCIPAL");
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");

  const map = page.getByTestId("floor-map");
  await expect(map).toBeVisible();
  await expect(page.getByRole("button", { name: "Pesquisar destinos" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

  await page.getByRole("button", { name: "Pesquisar destinos" }).click();
  await expect(page.getByRole("main", { name: "Explorar lojas e serviços" }).getByTestId("floor-map")).toHaveCount(0);
  await page.getByLabel("Buscar no Explorar").fill("NATURA");
  const response = page.waitForResponse((result) => result.url().endsWith("/api/routes") && result.request().method() === "POST");
  await page.getByRole("button", { name: /^Como chegar a NATURA/ }).click();
  expect((await response).ok()).toBeTruthy();

  const panel = page.getByTestId("route-panel");
  await expect(panel).toBeVisible();
  await expect(panel.getByRole("button", { name: "Iniciar navegação", exact: true })).toBeVisible();
  await expect(page.getByTestId("remaining-distance")).toBeVisible();
  await expect(page.getByTestId("current-instruction")).toBeVisible();
  await expect(map).toBeVisible();

  const initial = Number(await page.getByTestId("remaining-distance").textContent());
  const firstRouteEdge = map.locator('polyline[stroke="#6842d8"]').first();
  const beforeWalking = await firstRouteEdge.getAttribute("points");
  await panel.getByRole("button", { name: "Iniciar navegação", exact: true }).click();
  await expect(page.getByText("NAVEGAÇÃO SIMULADA", { exact: true })).toBeVisible();
  await expect(panel.getByRole("button", { name: "Pausar", exact: true })).toBeVisible();
  await expect.poll(async () => Number(await page.getByTestId("remaining-distance").textContent())).toBeLessThan(initial);
  await expect.poll(() => firstRouteEdge.getAttribute("points")).not.toBe(beforeWalking);
  await panel.getByRole("button", { name: "Pausar", exact: true }).click();
  await expect(panel.getByRole("button", { name: "Continuar", exact: true })).toBeVisible();

  await page.screenshot({ path: info.outputPath("navegacao-waze-390.png"), fullPage: true });
});

test("mapa baixo mantém a planta orientada e a posição longe da lateral", async ({ page }, info) => {
  await page.setViewportSize({ width: 520, height: 585 });
  await page.goto("/?qr=MINI-ENTRADA-PRINCIPAL");
  await page.getByRole("button", { name: "Pesquisar destinos" }).click();
  await page.getByLabel("Buscar no Explorar").fill("AREZZO");
  await page.getByRole("button", { name: /^Como chegar a AREZZO/ }).click();
  await page.getByTestId("route-panel").getByRole("button", { name: "Iniciar navegação" }).click();
  await expect.poll(async () => Number(await page.getByTestId("remaining-distance").textContent())).toBeLessThan(18);
  const viewport = page.getByTestId("map-2d-viewport");
  await expect(viewport).toHaveAttribute("data-rotation", "0.00");
  const marker = viewport.getByTestId("position-marker");
  const frame = await viewport.boundingBox(), point = await marker.boundingBox();
  expect(frame && point).toBeTruthy();
  if (frame && point) {
    const centerX = point.x + point.width / 2 - frame.x;
    expect(centerX).toBeGreaterThan(frame.width * .18);
    expect(centerX).toBeLessThan(frame.width * .82);
  }
  await page.screenshot({ path: info.outputPath("mapa-compacto-are-zzo.png"), fullPage: true });
});

test("início continua legível nos principais tamanhos de celular", async ({ page }, info) => {
  for (const width of [320, 360, 390, 430]) {
    await page.setViewportSize({ width, height: 760 });
    await page.goto("/?qr=MINI-ENTRADA-PRINCIPAL");
    await expect(page.getByTestId("floor-map")).toBeVisible();
    await expect(page.getByRole("button", { name: "Pesquisar destinos" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Mapa", exact: true })).toBeInViewport({ ratio: 1 });
    await expect(page.getByRole("tab", { name: "Ler QR Code", exact: true })).toBeInViewport({ ratio: 1 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 390) await page.screenshot({ path: info.outputPath("mapa-inicial-390.png"), fullPage: true });
  }
});

test("troca de piso mostra o andar atual e cabe na tela pequena", async ({ page }, info) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto("/?qr=MINI-ENTRADA-PRINCIPAL");
  const switcher = page.getByTestId("floor-switch");
  await expect(switcher).toHaveAttribute("aria-label", /Piso atual: Térreo/);
  await switcher.click();
  await page.screenshot({ path: info.outputPath("escolher-piso-320.png"), fullPage: true });
  await page.getByRole("button", { name: "Mezanino", exact: true }).click();
  await expect(switcher).toHaveAttribute("aria-label", /Piso atual: Mezanino/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await switcher.click();
  await page.getByRole("button", { name: "Térreo", exact: true }).click();
  await expect(switcher).toHaveAttribute("aria-label", /Piso atual: Térreo/);
});

test("chegada confirmada mantém o mapa e a próxima rota parte da loja", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?qr=MINI-ENTRADA-PRINCIPAL");
  await page.getByRole("button", { name: "Pesquisar destinos" }).click();
  await page.getByLabel("Buscar no Explorar").fill("NATURA");
  const firstResponse = page.waitForResponse((result) => result.url().endsWith("/api/routes") && result.request().method() === "POST");
  await page.getByRole("button", { name: /^Como chegar a NATURA/ }).click();
  const first = await firstResponse;
  const naturaId = first.request().postDataJSON().destino_no_id;

  await page.getByRole("button", { name: "Mais opções" }).click();
  await page.getByRole("button", { name: "Cheguei ao destino" }).click();
  await expect(page.getByTestId("arrival-notice")).toContainText("Você chegou a NATURA");
  await expect(page.getByTestId("floor-map")).toBeVisible();
  await page.getByRole("button", { name: "Iniciar outra navegação" }).click();
  await page.getByRole("tab", { name: "Explorar", exact: true }).click();
  await page.getByLabel("Buscar no Explorar").fill("ANACAPRI");
  const secondResponse = page.waitForResponse((result) => result.url().endsWith("/api/routes") && result.request().method() === "POST");
  await page.getByRole("button", { name: /^Como chegar a ANACAPRI/ }).click();
  expect((await secondResponse).request().postDataJSON().origem_no_id).toBe(naturaId);
});

test("mapa 3D no celular conserva posição e controles durante a navegação", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?qr=MINI-ENTRADA-PRINCIPAL");
  await page.getByRole("button", { name: "Pesquisar destinos" }).click();
  await page.getByLabel("Buscar no Explorar").fill("NATURA");
  await page.getByRole("button", { name: /^Como chegar a NATURA/ }).click();
  await page.getByTestId("route-panel").getByRole("button", { name: "Iniciar navegação" }).click();
  await page.getByRole("button", { name: "Mapa 3D" }).click();
  await expect(page.getByTestId("scene-map")).toBeVisible();
  await expect(page.getByTestId("scene-map").locator("canvas")).toBeVisible();
  await expect(page.getByText(/Carregando mapa 3D/)).toHaveCount(0);
  await expect(page.getByTestId("scene-map").getByRole("button", { name: "Orientar mapa para norte" })).toBeVisible();
  await expect(page.getByTestId("scene-map").getByRole("button", { name: "Ver piso inteiro" })).toBeVisible();
  await page.screenshot({ path: info.outputPath("navegacao-3d-390.png"), fullPage: true });
});
