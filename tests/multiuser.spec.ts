import { test, expect } from "@playwright/test";

test("RNF03: cinco visitantes simultâneos carregam mapa e calculam rota", async ({ browser }, info) => {
  test.skip(info.project.name !== "chromium", "Baseline concorrente mantido em um único motor")

  const results = await Promise.all(Array.from({ length: 5 }, async (_, index) => {
    const context = await browser.newContext({ viewport: { width: 360, height: 640 } });
    const page = await context.newPage();
    const startedAt = performance.now();
    try {
      await page.goto("/?qr=ENTRADA-PRINCIPAL");
      await expect(page.getByTestId("floor-map")).toBeVisible();
      await expect(page.getByTestId("origin-label")).toContainText("Entrada Principal");
      const mapMs = performance.now() - startedAt;
      await page.getByLabel("Buscar destinos", { exact: true }).fill("Tech");
      await page.getByRole("button", { name: "TechStore, Aberto" }).click();
      const routeStartedAt = performance.now();
      await page.getByRole("button", { name: "Traçar rota", exact: true }).click();
      await expect(page.getByTestId("route-panel")).toBeVisible();
      return { visitor: index + 1, mapMs: Math.round(mapMs), routeMs: Math.round(performance.now() - routeStartedAt) };
    } finally {
      await context.close();
    }
  }));

  await info.attach("five-simultaneous-visitors", {
    body: JSON.stringify(results, null, 2),
    contentType: "application/json",
  });
  for (const result of results) {
    expect(result.mapMs).toBeLessThanOrEqual(3000);
    expect(result.routeMs).toBeLessThanOrEqual(1000);
  }
});
