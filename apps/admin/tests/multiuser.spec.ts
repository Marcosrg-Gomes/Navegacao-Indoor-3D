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
      await page.getByRole("button", { name: "Pesquisar destinos", exact: true }).click();
      await page.getByLabel("Buscar no Explorar", { exact: true }).fill("Tech");
      const routeStartedAt = performance.now();
      const routeResponse = page.waitForResponse(
        (response) => response.url().endsWith("/api/routes") && response.request().method() === "POST"
      );
      await page.getByRole("button", { name: "Como chegar a TechStore", exact: true }).click();
      await expect(page.getByTestId("route-panel")).toBeVisible();
      const routeMs = Math.round(performance.now() - routeStartedAt);

      const response = await routeResponse;
      expect(response.ok()).toBeTruthy();
      const route = await response.json();
      const { destino_no_id } = response.request().postDataJSON();
      expect(route.sucesso).toBe(true);
      expect(Array.isArray(route.nos)).toBe(true);
      expect(route.nos.length).toBeGreaterThan(1);
      expect(route.nos[route.nos.length - 1].id).toBe(destino_no_id);
      expect(Number.isFinite(route.distancia_total_metros)).toBe(true);
      expect(route.distancia_total_metros).toBeGreaterThan(0);
      await expect(page.getByTestId("remaining-distance"))
        .toHaveText(String(Math.round(route.distancia_total_metros)));

      return { visitor: index + 1, mapMs: Math.round(mapMs), routeMs,
        distance: route.distancia_total_metros, nodes: route.nos.length };
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
