import { test, expect, type Page } from "@playwright/test";
import { visitorQrUrl } from "./visitor-url";

const ALLOWED = ["0.00", "180.00"];

async function openAtEntrance(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"));
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
}

async function routeTo(page: Page, name: string) {
  await page.getByRole("button", { name: "Pesquisar destinos" }).click();
  await page.getByLabel("Buscar no Explorar").fill(name);
  await page.getByRole("button", { name: new RegExp(`^Como chegar a ${name}`) }).first().click();
  await expect(page.getByTestId("route-panel")).toBeVisible();
}

/** Ponta e base da seta em coordenadas de tela (inclui transformações CSS da planta). */
async function arrowOnScreen(page: Page) {
  return page.getByTestId("position-arrow").locator("path").evaluate((path: SVGPathElement) => {
    const matrix = path.getScreenCTM()!;
    const tip = new DOMPoint(0, -13).matrixTransform(matrix);
    const base = new DOMPoint(0, 4).matrixTransform(matrix);
    return { dx: tip.x - base.x, dy: tip.y - base.y };
  });
}

test("alternância 2D/3D preserva a orientação permitida", async ({ page }) => {
  await openAtEntrance(page);
  await page.getByRole("button", { name: "Mapa 2D", exact: true }).click();
  const map2d = page.getByTestId("map-2d-viewport");
  await expect(map2d).toBeVisible();
  await expect(map2d).toHaveAttribute("data-rotation", "0.00");
  await page.getByRole("button", { name: "Mapa 3D", exact: true }).click();
  await expect(page.getByTestId("scene-map")).toBeVisible();
  await expect(page.getByTestId("scene-map")).toHaveAttribute("data-orientation", "0");
  await page.getByRole("button", { name: "Mapa 2D", exact: true }).click();
  await expect(page.getByTestId("floor-map")).toBeVisible();
  await expect(map2d).toHaveAttribute("data-rotation", "0.00");
});

test("zoom e centralização continuam funcionando no 2D", async ({ page }) => {
  await openAtEntrance(page);
  await page.getByRole("button", { name: "Mapa 2D", exact: true }).click();
  const map = page.getByTestId("map-2d-viewport");
  await expect(map).toBeVisible();
  const box = await map.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.wheel(0, -300);
  await expect.poll(async () => Number(await map.getAttribute("data-zoom"))).toBeGreaterThan(1);
  await page.getByRole("button", { name: "Ver piso inteiro", exact: true }).click();
  await expect(map).toHaveAttribute("data-zoom", "1.000");
  await expect(map).toHaveAttribute("data-pan-x", "0.00");
  await expect(map).toHaveAttribute("data-pan-y", "0.00");
});

test("mudança de piso mantém rotação 0° sem rota", async ({ page }) => {
  await openAtEntrance(page);
  await page.getByRole("button", { name: "Mapa 2D", exact: true }).click();
  const map = page.getByTestId("map-2d-viewport");
  await expect(map).toBeVisible();
  await page.getByTestId("floor-switch").click();
  await page.getByRole("button", { name: /^Mezanino/ }).click();
  await expect(page.getByTestId("floor-map")).toBeVisible();
  await expect(map).toHaveAttribute("data-rotation", "0.00");
  await page.getByTestId("floor-switch").click();
  await page.getByRole("button", { name: /^Térreo/ }).click();
  await expect(map).toHaveAttribute("data-rotation", "0.00");
});

test("navegação: mapa só usa 0°/180°, não gira nas curvas e a seta aponta para cima", async ({ page }, info) => {
  await openAtEntrance(page);
  await page.getByRole("button", { name: "Mapa 2D", exact: true }).click();
  await routeTo(page, "NATURA");
  const map = page.getByTestId("map-2d-viewport");
  const panel = page.getByTestId("route-panel");
  await panel.getByRole("button", { name: "Iniciar navegação", exact: true }).click();
  const instructions = new Set<string>();
  const rotations: string[] = [];
  for (let i = 0; i < 14; i++) {
    await page.waitForTimeout(450);
    if (await page.getByTestId("arrival-confirmation").isVisible().catch(() => false)) break;
    const rotation = (await map.getAttribute("data-rotation"))!;
    expect(ALLOWED).toContain(rotation);
    rotations.push(rotation);
    instructions.add((await page.getByTestId("current-instruction").textContent()) || "");
    if (await page.getByTestId("position-arrow").count()) {
      const arrow = await arrowOnScreen(page);
      expect(arrow.dy).toBeLessThan(0);                       // ponta acima da base
      expect(Math.abs(arrow.dx)).toBeLessThan(Math.abs(arrow.dy) * .01 + .01); // sem inclinação
    }
  }
  // A rota até NATURA tem curva ("Vire ...") e a orientação não mudou com ela.
  expect([...instructions].some((text) => /Vire/.test(text))).toBe(true);
  expect(new Set(rotations).size).toBe(1);
  await page.screenshot({ path: info.outputPath("orientacao-2d-navegacao.png") });

  await page.getByRole("button", { name: "Mapa 3D", exact: true }).click();
  const scene = page.getByTestId("scene-map");
  await expect(scene).toBeVisible();
  await expect(scene).toHaveAttribute("data-orientation", String(Number(rotations[0])));
  await page.screenshot({ path: info.outputPath("orientacao-3d-navegacao.png") });
});
