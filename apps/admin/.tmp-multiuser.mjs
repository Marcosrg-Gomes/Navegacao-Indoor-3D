import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const context = await browser.newContext({ baseURL: "http://127.0.0.1:8765", viewport: { width: 360, height: 640 } });
const page = await context.newPage();
await page.goto("/?qr=MINI-ENTRADA-PRINCIPAL");
await page.getByTestId("floor-map").waitFor({ timeout: 20000 });
console.log("url1:", page.url());
console.log("testids:", await page.evaluate(() => Array.from(document.querySelectorAll("[data-testid]")).map((e) => e.getAttribute("data-testid"))));
await page.getByRole("button", { name: "Pesquisar destinos", exact: true }).click();
await page.getByLabel("Buscar no Explorar", { exact: true }).fill("NATURA");
const route = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.request().method() === "POST");
await page.getByRole("button", { name: /^NATURA, (Aberto|Fechado|Em manutenção)$/ }).click();
const res = await route;
console.log("route status:", res.status());
await page.waitForTimeout(1500);
console.log("url2:", page.url());
const ids = await page.evaluate(() => Array.from(document.querySelectorAll("[data-testid]")).map((e) => e.getAttribute("data-testid")));
console.log("testids2:", JSON.stringify(ids));
const probe = await page.evaluate(() => {
  const el = document.querySelector('[data-testid="route-panel"]');
  if (!el) return { found: false };
  const r = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  return { found: true, rect: { w: r.width, h: r.height, x: r.x, y: r.y }, display: cs.display, visibility: cs.visibility, opacity: cs.opacity };
});
console.log("route-panel probe:", JSON.stringify(probe));
await browser.close();
