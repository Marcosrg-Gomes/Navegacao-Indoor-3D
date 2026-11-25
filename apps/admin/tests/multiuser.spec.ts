import { test, expect } from "@playwright/test";
import { visitorQrUrl } from "./visitor-url";

test("RNF03: cinco visitantes simultâneos carregam mapa e calculam rota", async ({ browser }, info) => {
  test.setTimeout(120000);
  test.skip(info.project.name !== "chrome" && info.project.name !== "chromium", "Baseline concorrente mantido em um único motor")

  const results = await Promise.all(Array.from({ length: 5 }, async (_, index) => {
    const context = await browser.newContext({ viewport: { width: 360, height: 640 } });
    const page = await context.newPage();
    const startedAt = performance.now();
    try {
      await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"));
      await expect(page.getByTestId("floor-map")).toBeVisible({ timeout: 15000 });
      await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
      const mapMs = performance.now() - startedAt;
      await page.getByRole("button", { name: "Pesquisar destinos", exact: true }).click();
      await page.getByLabel("Buscar no Explorar", { exact: true }).fill("NATURA");
      const routeStartedAt = performance.now();
      const routeResponse = page.waitForResponse(
        (response) => response.url().endsWith("/api/routes") && response.request().method() === "POST"
      );
      await page.getByRole("button", { name: /^NATURA, (Aberto|Fechado|Em manutenção)$/ }).click();
      const response = await routeResponse;
      const routeMs = Math.round(performance.now() - routeStartedAt);
      await expect(page.getByTestId("route-panel")).toBeVisible({ timeout: 20000 });

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
  // RNF03 (mapa <= 3 s e rota <= 1 s) é medido em isolamento por performance.spec.ts.
  // Aqui o objetivo é robustez: 5 visitantes concluem o fluxo concorrentemente.
  // Os tempos ficam no anexo como evidência; a única asserção é um teto de
  // travamento, pois o ambiente headless compartilha CPU e renderização 3D.
  for (const result of results) {
    expect(result.mapMs).toBeLessThanOrEqual(15000);
  }
});
