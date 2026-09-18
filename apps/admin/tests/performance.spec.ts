import { test, expect } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

test("RNF03: mapa visível e rota em 4G simulado", async ({ browser }, info) => {
  test.skip(info.project.name !== "chromium", "Throttling CDP disponível no Chromium");
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
    await page.goto("/?qr=ENTRADA-PRINCIPAL");
    await expect(page.getByTestId("floor-map")).toBeVisible();
    await expect(page.getByTestId("origin-label")).toContainText("Entrada Principal");
    const mapMs = await page.evaluate(async () => {
      const uri = document.querySelector("svg image")?.getAttribute("href");
      if (!uri) throw new Error("Planta não carregada");
      const image = new Image(); image.src = uri; await image.decode();
      return performance.now();
    });
    await page.getByLabel("Buscar destinos", { exact: true }).fill("Tech");
    await page.getByRole("button", { name: "TechStore, Aberto" }).click();
    const start = Date.now();
    await page.getByRole("button", { name: "Traçar rota", exact: true }).click();
    await expect(page.getByTestId("route-panel")).toBeVisible();
    samples.push({ mapMs: Math.round(mapMs), routeMs: Date.now() - start });
    await context.close();
  }
  mkdirSync("../evidence", { recursive: true });
  writeFileSync(`../evidence/performance-${process.env.AUDIT_PHASE || "after"}.json`, JSON.stringify({
    profile: "4G simulado: 9 Mbps down / 1 Mbps up / 80 ms, cache frio, Chromium, 360x640", samples,
  }, null, 2));
  console.log("RNF03", JSON.stringify(samples));
  for (const sample of samples) {
    expect(sample.mapMs).toBeLessThanOrEqual(3000);
    expect(sample.routeMs).toBeLessThanOrEqual(1000);
  }
});
