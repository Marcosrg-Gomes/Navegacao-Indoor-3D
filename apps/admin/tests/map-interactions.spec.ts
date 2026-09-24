import { test, expect, type Locator, type Page } from "@playwright/test";

async function openMap(page: Page, mode: "2D" | "3D") {
  await page.goto("/?qr=MINI-ENTRADA-PRINCIPAL");
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  await page.getByRole("button", { name: `Mapa ${mode}`, exact: true }).click();
  const map = page.getByTestId(mode === "2D" ? "map-2d-viewport" : "scene-map");
  await expect(map).toBeVisible();
  if (mode === "3D") await expect(map).toHaveAttribute("data-camera-target", /\d/);
  return map;
}

async function drag(page: Page, map: Locator, dx: number, dy: number) {
  await map.scrollIntoViewIfNeeded();
  const box = (await map.boundingBox())!;
  // Start in empty space so the test exercises panning without selecting a POI.
  const x = box.x + box.width * .23, y = box.y + box.height * .5;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y + dy, { steps: 12 });
  await page.mouse.up();
}

async function view2d(map: Locator) {
  return { x: Number(await map.getAttribute("data-pan-x")), y: Number(await map.getAttribute("data-pan-y")), zoom: Number(await map.getAttribute("data-zoom")) };
}

test("2D mantém arrastes sucessivos em 1×, alteração de preferências e troca de visualização", async ({ page }) => {
  const map = await openMap(page, "2D");
  await drag(page, map, 120, 35);
  await expect.poll(async () => (await view2d(map)).x).toBeCloseTo(120, 0);
  await drag(page, map, -45, 20);
  const panned = await view2d(map);
  expect(panned.x).toBeCloseTo(75, 0);
  expect(panned.y).toBeCloseTo(55, 0);
  await page.getByRole("switch", { name: "Rota acessível" }).click();
  expect(await view2d(map)).toEqual(panned);
  await page.getByRole("button", { name: "Mapa 3D", exact: true }).click();
  await expect(page.getByTestId("scene-map")).toHaveAttribute("data-camera-target", /\d/);
  await page.getByRole("button", { name: "Mapa 2D", exact: true }).click();
  expect(await view2d(map)).toEqual(panned);
  await page.getByRole("button", { name: "Ver piso inteiro", exact: true }).click();
  expect(await view2d(map)).toEqual({ x: 0, y: 0, zoom: 1 });
});

test("2D aproxima sob o cursor, mantém pontos clicáveis e enquadra origem e rota", async ({ page }) => {
  const map = await openMap(page, "2D");
  await map.scrollIntoViewIfNeeded();
  const box = (await map.boundingBox())!;
  const offset = { x: 55, y: -60 };
  await page.mouse.move(box.x + box.width / 2 + offset.x, box.y + box.height / 2 + offset.y);
  await page.mouse.wheel(0, -300);
  await expect.poll(async () => (await view2d(map)).zoom).toBeGreaterThan(1.5);
  const zoomed = await view2d(map);
  expect(zoomed.x).toBeCloseTo(offset.x * (1 - zoomed.zoom), 0);
  expect(zoomed.y).toBeCloseTo(offset.y * (1 - zoomed.zoom), 0);
  await page.getByRole("button", { name: "Ver piso inteiro", exact: true }).click();
  await map.locator('g[aria-label="ADIDAS"]').click();
  await expect(page.getByRole("button", { name: "Traçar rota", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Traçar rota", exact: true }).click();
  await expect(page.getByTestId("route-panel")).toBeVisible();
  await page.getByRole("button", { name: "Centralizar rota", exact: true }).click();
  expect((await view2d(map)).zoom).toBeGreaterThan(1);
  await page.getByRole("button", { name: /^Mezanino/ }).click();
  await page.getByRole("button", { name: /Minha posição/ }).click();
  await expect(page.getByText("Mapa: Térreo", { exact: true })).toBeVisible();
  await expect.poll(async () => (await view2d(map)).zoom).toBeGreaterThan(1);
  await map.screenshot({ path: "../../evidence/map-2d-location.png" });
});

test("3D mantém câmera após arraste, oferece zoom, rotação, vista superior e localização", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const map = await openMap(page, "3D");
  const initial = await map.getAttribute("data-camera-target");
  await drag(page, map, 100, 25);
  await expect(map).not.toHaveAttribute("data-camera-target", initial!);
  const panned = await map.getAttribute("data-camera-target");
  await page.getByRole("switch", { name: "Rota acessível" }).click();
  await expect(map).toHaveAttribute("data-camera-target", panned!);
  await page.getByRole("button", { name: "Aumentar zoom", exact: true }).click();
  await expect(map).toHaveAttribute("data-zoom", "1.500");
  await page.getByRole("button", { name: "Vista superior", exact: true }).click();
  await expect(page.getByRole("button", { name: "Vista inclinada", exact: true })).toBeVisible();
  const position = await map.getAttribute("data-camera-position");
  await page.getByRole("button", { name: "Girar mapa para a direita", exact: true }).click();
  await expect(map).not.toHaveAttribute("data-camera-position", position!);
  await page.getByRole("button", { name: "Ver piso inteiro", exact: true }).click();
  await expect(map).toHaveAttribute("data-camera-target", initial!);
  await expect(map).toHaveAttribute("data-zoom", "1.000");
  await page.getByRole("button", { name: /^Mezanino/ }).click();
  await page.getByRole("button", { name: /Minha posição/ }).click();
  await expect(page.getByText("Mapa: Térreo", { exact: true })).toBeVisible();
  await expect(map).toHaveAttribute("data-zoom", "3.000");
  await expect(map.getByRole("button", { name: "Entrada principal, ver detalhes" })).toBeVisible();
  await map.screenshot({ path: "../../evidence/map-3d-location.png" });
  expect(errors).toEqual([]);
});

test("Celular: arraste e pinça 2D/3D mantêm o zoom sem rolar a página ou abrir lojas", async ({ browser, browserName }) => {
  test.skip(browserName !== "chromium", "Gestos multitoque enviados por CDP no Chromium");
  const context = await browser.newContext({ viewport: { width: 414, height: 896 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  try {
    for (const mode of ["2D", "3D"] as const) {
      const map = await openMap(page, mode);
      await map.scrollIntoViewIfNeeded();
      const box = (await map.boundingBox())!;
      const initialTarget = await map.getAttribute("data-camera-target");
      const x = box.x + box.width * .27, y = box.y + box.height * .5;
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ id: 1, x, y }] });
      for (let i = 1; i <= 8; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ id: 1, x: x + i * 7, y }] });
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      if (mode === "2D") expect((await view2d(map)).x).toBeGreaterThan(40);
      else await expect(map).not.toHaveAttribute("data-camera-target", initialTarget!);
      const beforeZoom = Number(await map.getAttribute("data-zoom"));
      const points = (distance: number) => [{ id: 1, x: x - distance, y }, { id: 2, x: x + distance, y }];
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: points(30) });
      for (let d = 35; d <= 75; d += 5) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: points(d) });
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await expect.poll(async () => Number(await map.getAttribute("data-zoom"))).toBeGreaterThan(beforeZoom * 1.5);
      const afterBox = (await map.boundingBox())!;
      expect(afterBox.y).toBeCloseTo(box.y, 0);
      await expect(page.getByRole("button", { name: "Traçar rota", exact: true })).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
      await map.screenshot({ path: `../../evidence/map-${mode.toLowerCase()}-mobile-pinch.png` });
    }
  } finally { await context.close(); }
});
