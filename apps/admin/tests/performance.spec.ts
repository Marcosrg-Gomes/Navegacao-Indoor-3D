import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { visitorQrUrl } from "./visitor-url";

test("RNF03: mapa visível e rota em 4G simulado", async ({ browser }, info) => {
  test.skip(info.project.name !== "chrome" && info.project.name !== "chromium", "Throttling CDP disponível no Chromium/Chrome");
  test.setTimeout(180000);
  const samples = [];
  for (let i = 0; i < 5; i++) {
    const context = await browser.newContext({ viewport: { width: 360, height: 640 } });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false, latency: 80, downloadThroughput: 9 * 1024 * 1024 / 8,
      uploadThroughput: 1024 * 1024 / 8, connectionType: "cellular4g",
    });
    await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"));
    await expect(page.getByTestId("floor-map")).toBeVisible();
    await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);
    // Tempo até o mapa estar utilizável, contado desde o início da navegação.
    const mapMs = await page.evaluate(() => performance.now());
    await page.getByRole("button", { name: "Pesquisar destinos", exact: true }).click();
    await page.getByLabel("Buscar no Explorar", { exact: true }).fill("NATURA");
    const start = Date.now();
    await page.getByRole("button", { name: /^NATURA, (Aberto|Fechado|Em manutenção)$/ }).click();
    await expect(page.getByTestId("route-panel")).toBeVisible();
    samples.push({ mapMs: Math.round(mapMs), routeMs: Date.now() - start });
    await context.close();
  }
  mkdirSync("../../evidence", { recursive: true });
  writeFileSync(`../../evidence/performance-${process.env.AUDIT_PHASE || "after"}.json`, JSON.stringify({
    profile: "4G simulado: 9 Mbps down / 1 Mbps up / 80 ms, cache frio, Chromium, 360x640",
    fixture: "mini shopping (MINI-ENTRADA-PRINCIPAL → NATURA)",
    samples,
  }, null, 2));
  console.log("RNF03", JSON.stringify(samples));
  for (const sample of samples) {
    expect(sample.mapMs).toBeLessThanOrEqual(3000);
    expect(sample.routeMs).toBeLessThanOrEqual(1000);
  }
});
