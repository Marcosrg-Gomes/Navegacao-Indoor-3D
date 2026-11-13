import { test, expect } from "@playwright/test";

async function startNavigationToNatura(page: any) {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://localhost:8081/?qr=MINI-ENTRADA-PRINCIPAL");
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  await expect(page.getByRole("button", { name: "Pesquisar destinos" })).toBeVisible();
  await page.getByRole("button", { name: "Pesquisar destinos" }).click();
  await page.getByLabel("Buscar no Explorar").fill("NATURA");
  await page.getByRole("button", { name: /^Como chegar a NATURA/ }).click();
  await page.getByTestId("route-panel").getByRole("button", { name: "Iniciar navegação" }).click();
}

test("alternância 2D/3D preserva norte para cima", async ({ page }) => {
  await page.goto("http://localhost:8081/?qr=MINI-ENTRADA-PRINCIPAL");
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  await page.getByRole("button", { name: "Mapa 2D", exact: true }).click();
  const map2d = page.getByTestId("map-2d-viewport");
  await expect(map2d).toBeVisible();
  await expect(map2d).toHaveAttribute("data-rotation", "0.00");
  await page.getByRole("button", { name: "Mapa 3D", exact: true }).click();
  const map3d = page.getByTestId("scene-map");
  await expect(map3d).toBeVisible();
  await page.getByRole("button", { name: "Mapa 2D", exact: true }).click();
  await expect(page.getByTestId("floor-map")).toBeVisible();
  await expect(map2d).toHaveAttribute("data-rotation", "0.00");
});

test("zoom e centralização continuam funcionando no 2D", async ({ page }) => {
  await page.goto("http://localhost:8081/?qr=MINI-ENTRADA-PRINCIPAL");
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  await page.getByRole("button", { name: "Mapa 2D", exact: true }).click();
  const map = page.getByTestId("map-2d-viewport");
  await expect(map).toBeVisible();
  await map.scrollIntoViewIfNeeded();
  const box = await map.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.wheel(0, -300);
  await expect.poll(async () => Number(await map.getAttribute("data-zoom"))).toBeGreaterThan(1);
  await page.getByRole("button", { name: "Ver piso inteiro", exact: true }).click();
  await expect(map).toHaveAttribute("data-zoom", "1.000");
  await expect(map).toHaveAttribute("data-pan-x", "0.00");
  await expect(map).toHaveAttribute("data-pan-y", "0.00");
});

test("mudança de piso mantém o mapa 2D orientado para norte", async ({ page }) => {
  await page.goto("http://localhost:8081/?qr=MINI-ENTRADA-PRINCIPAL");
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  await page.getByRole("button", { name: "Mapa 2D", exact: true }).click();
  const map = page.getByTestId("map-2d-viewport");
  await expect(map).toBeVisible();
  await page.getByRole("button", { name: /^Mezanino/ }).click();
  await expect(page.getByTestId("floor-map")).toBeVisible();
  await expect(map).toHaveAttribute("data-rotation", "0.00");
  await page.getByRole("button", { name: /^Térreo/ }).click();
  await expect(page.getByTestId("floor-map")).toBeVisible();
  await expect(map).toHaveAttribute("data-rotation", "0.00");
});

// Nota: os testes de rotação zero durante navegação simulada e de rotação do
// marcador via heading dependem do build do visitante (apps/visitor/build:web),
// que não pode ser executado nesta etapa (regra: não sobrescrever arquivos
// estáticos rastreados). A lógica correspondente é validada por teste unitário
// em simulation-engine.spec.ts ("Câmera 2D mantém o norte fixo e a seta abaixo
// do centro"), que importa o código-fonte de mapViewport.ts diretamente.
