# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: map-interactions.spec.ts >> 2D aproxima sob o cursor, mantém pontos clicáveis e enquadra origem e rota
- Location: tests\map-interactions.spec.ts:46:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByTestId('origin-label')
Expected substring: "Entrada principal"
Received string:    "Ponto de partida não definido"
Timeout: 5000ms

Call log:
  - Expect "toContainText" getByTestId('origin-label') with timeout 5000ms
  - waiting for getByTestId('origin-label')
    - locator resolved to <div dir="auto" data-testid="origin-label" class="css-146c3p1 r-1iewvzr r-1b6yd1w r-b88u0q r-waer2z r-1bymd8e">Ponto de partida não definido</div>
    11 × unexpected value "Ponto de partida não definido"
       - locator resolved to <div dir="auto" data-testid="origin-label" class="css-146c3p1 r-1iewvzr r-ubezar r-1kfrs79">Ponto de partida não definido</div>
    - unexpected value "Ponto de partida não definido"

```

```yaml
- text: Ponto de partida não definido
```

# Test source

```ts
  1   | import { test, expect, type Locator, type Page } from "@playwright/test";
  2   | 
  3   | async function openMap(page: Page, mode: "2D" | "3D") {
  4   |   await page.goto("http://localhost:8081/?qr=MINI-ENTRADA-PRINCIPAL");
> 5   |   await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
      |                                                  ^ Error: expect(locator).toContainText(expected) failed
  6   |   await page.getByRole("button", { name: `Mapa ${mode}`, exact: true }).click();
  7   |   const map = page.getByTestId(mode === "2D" ? "map-2d-viewport" : "scene-map");
  8   |   await expect(map).toBeVisible();
  9   |   if (mode === "3D") await expect(map).toHaveAttribute("data-camera-target", /\d/);
  10  |   return map;
  11  | }
  12  | 
  13  | async function drag(page: Page, map: Locator, dx: number, dy: number) {
  14  |   await map.scrollIntoViewIfNeeded();
  15  |   const box = (await map.boundingBox())!;
  16  |   // Start in empty space so the test exercises panning without selecting a POI.
  17  |   const x = box.x + box.width * .23, y = box.y + box.height * .5;
  18  |   await page.mouse.move(x, y);
  19  |   await page.mouse.down();
  20  |   await page.mouse.move(x + dx, y + dy, { steps: 12 });
  21  |   await page.mouse.up();
  22  | }
  23  | 
  24  | async function view2d(map: Locator) {
  25  |   return { x: Number(await map.getAttribute("data-pan-x")), y: Number(await map.getAttribute("data-pan-y")), zoom: Number(await map.getAttribute("data-zoom")) };
  26  | }
  27  | 
  28  | test("2D mantém arrastes sucessivos em 1×, alteração de preferências e troca de visualização", async ({ page }) => {
  29  |   const map = await openMap(page, "2D");
  30  |   await drag(page, map, 120, 35);
  31  |   await expect.poll(async () => (await view2d(map)).x).toBeCloseTo(120, 0);
  32  |   await drag(page, map, -45, 20);
  33  |   const panned = await view2d(map);
  34  |   expect(panned.x).toBeCloseTo(75, 0);
  35  |   expect(panned.y).toBeCloseTo(55, 0);
  36  |   await page.getByRole("switch", { name: "Rota acessível" }).click();
  37  |   expect(await view2d(map)).toEqual(panned);
  38  |   await page.getByRole("button", { name: "Mapa 3D", exact: true }).click();
  39  |   await expect(page.getByTestId("scene-map")).toHaveAttribute("data-camera-target", /\d/);
  40  |   await page.getByRole("button", { name: "Mapa 2D", exact: true }).click();
  41  |   expect(await view2d(map)).toEqual(panned);
  42  |   await page.getByRole("button", { name: "Ver piso inteiro", exact: true }).click();
  43  |   expect(await view2d(map)).toEqual({ x: 0, y: 0, zoom: 1 });
  44  | });
  45  | 
  46  | test("2D aproxima sob o cursor, mantém pontos clicáveis e enquadra origem e rota", async ({ page }, info) => {
  47  |   const map = await openMap(page, "2D");
  48  |   await map.scrollIntoViewIfNeeded();
  49  |   const box = (await map.boundingBox())!;
  50  |   const offset = { x: 55, y: -60 };
  51  |   await page.mouse.move(box.x + box.width / 2 + offset.x, box.y + box.height / 2 + offset.y);
  52  |   await page.mouse.wheel(0, -300);
  53  |   await expect.poll(async () => (await view2d(map)).zoom).toBeGreaterThan(1.5);
  54  |   const zoomed = await view2d(map);
  55  |   expect(zoomed.x).toBeCloseTo(offset.x * (1 - zoomed.zoom), 0);
  56  |   expect(zoomed.y).toBeCloseTo(offset.y * (1 - zoomed.zoom), 0);
  57  |   await page.getByRole("button", { name: "Ver piso inteiro", exact: true }).click();
  58  |   await map.locator('g[aria-label="ADIDAS"]').click();
  59  |   await expect(page.getByRole("button", { name: "Traçar rota", exact: true })).toBeVisible();
  60  |   await page.getByRole("button", { name: "Traçar rota", exact: true }).click();
  61  |   await expect(page.getByTestId("route-panel")).toBeVisible();
  62  |   await page.getByRole("button", { name: "Centralizar rota", exact: true }).click();
  63  |   expect((await view2d(map)).zoom).toBeGreaterThan(1);
  64  |   await page.getByRole("button", { name: /^Mezanino/ }).click();
  65  |   await page.getByRole("button", { name: /Minha posição/ }).click();
  66  |   await expect(page.getByText("Mapa: Térreo", { exact: true })).toBeVisible();
  67  |   await expect.poll(async () => (await view2d(map)).zoom).toBeGreaterThan(1);
  68  |   await map.screenshot({ path: info.outputPath("map-2d-location.png") });
  69  | });
  70  | 
  71  | test("3D mantém câmera após arraste, oferece zoom, rotação, vista superior e localização", async ({ page }, info) => {
  72  |   const errors: string[] = [];
  73  |   page.on("pageerror", (error) => errors.push(error.message));
  74  |   const map = await openMap(page, "3D");
  75  |   const initial = await map.getAttribute("data-camera-target");
  76  |   await drag(page, map, 100, 25);
  77  |   await expect(map).not.toHaveAttribute("data-camera-target", initial!);
  78  |   const panned = await map.getAttribute("data-camera-target");
  79  |   await page.getByRole("switch", { name: "Rota acessível" }).click();
  80  |   await expect(map).toHaveAttribute("data-camera-target", panned!);
  81  |   await page.getByRole("button", { name: "Aumentar zoom", exact: true }).click();
  82  |   await expect(map).toHaveAttribute("data-zoom", "1.500");
  83  |   const keptPosition = await map.getAttribute("data-camera-position");
  84  |   const keptTarget = await map.getAttribute("data-camera-target");
  85  |   await page.getByRole("button", { name: "Mapa 2D", exact: true }).click();
  86  |   await expect(page.getByTestId("floor-map")).toBeVisible();
  87  |   await page.getByRole("button", { name: "Mapa 3D", exact: true }).click();
  88  |   await expect(map).toHaveAttribute("data-zoom", "1.500");
  89  |   await expect(map).toHaveAttribute("data-camera-position", keptPosition!);
  90  |   await expect(map).toHaveAttribute("data-camera-target", keptTarget!);
  91  |   await page.getByRole("button", { name: "Mais controles", exact: true }).click();
  92  |   await page.getByRole("button", { name: "Vista superior", exact: true }).click();
  93  |   await expect(page.getByRole("button", { name: "Vista inclinada", exact: true })).toBeVisible();
  94  |   const position = await map.getAttribute("data-camera-position");
  95  |   // O norte permanece fixo: não há botão de rotação horizontal. Apenas
  96  |   // vista superior/inclinada altera a câmera.
  97  |   await page.getByRole("button", { name: "Ver piso inteiro", exact: true }).click();
  98  |   await expect(map).toHaveAttribute("data-camera-target", "0.000,0.000,0.000");
  99  |   await expect(map).toHaveAttribute("data-zoom", "1.000");
  100 |   await page.getByRole("button", { name: /^Mezanino/ }).click();
  101 |   await page.getByRole("button", { name: /Minha posição/ }).click();
  102 |   await expect(page.getByText("Mapa: Térreo", { exact: true })).toBeVisible();
  103 |   await expect(map).toHaveAttribute("data-zoom", "3.000");
  104 |   await expect(map.getByRole("button", { name: "Entrada principal, ver detalhes" })).toBeVisible();
  105 |   await map.screenshot({ path: info.outputPath("map-3d-location.png") });
```