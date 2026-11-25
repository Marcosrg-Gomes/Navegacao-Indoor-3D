import { chromium } from "@playwright/test";

const base = "http://127.0.0.1:8766";
const browser = await chromium.launch();
const context = await browser.newContext({ baseURL: base });
const page = await context.newPage();
page.on("dialog", (d) => d.accept("Validacao automatizada"));

await page.goto("/admin/shoppings");
if (await page.getByLabel("Chave de acesso", { exact: true }).count()) {
  await page.getByLabel("Chave de acesso", { exact: true }).fill("audit-local-admin-key-with-32-characters");
  await page.getByRole("button", { name: "Entrar no painel", exact: true }).click();
}
await page.goto("/admin/arestas?piso=3");
await page.waitForSelector("tbody tr");
const row = page.locator("tbody tr").filter({ has: page.getByText("#88", { exact: true }) });
await row.getByRole("button", { name: "Editar", exact: true }).click();
const dialog = page.getByRole("dialog");
console.log("dialog visible:", await dialog.isVisible());

const byLabel = dialog.getByLabel("Distância em metros", { exact: false });
console.log("getByLabel count:", await byLabel.count());
const byLabelExact = dialog.getByLabel("Distância em metros (deixe vazio para auto-cálculo)", { exact: true });
console.log("getByLabel full-text count:", await byLabelExact.count());
console.log("input[type=number] count:", await dialog.locator("input[type=number]").count());

const probe = await dialog.evaluate((root) => {
  const input = root.querySelector("input[type=number]");
  if (!input) return { found: false };
  const label = input.closest("label");
  return {
    found: true,
    inputId: input.id,
    labelFor: label?.getAttribute("for") ?? null,
    forTargetTag: label?.getAttribute("for") ? document.getElementById(label.getAttribute("for"))?.tagName ?? null : null,
    nativeLabels: input.labels ? Array.from(input.labels).map((l) => l.textContent?.slice(0, 40)) : null,
    ariaLabel: input.getAttribute("aria-label"),
    value: input.value,
  };
});
console.log("probe:", JSON.stringify(probe, null, 2));

try {
  await byLabel.fill("70", { timeout: 8000 });
  console.log("fill via getByLabel OK");
} catch (e) {
  console.log("fill via getByLabel FAILED:", e.message.split("\n")[0]);
}
try {
  await dialog.locator("input[type=number]").fill("71", { timeout: 8000 });
  console.log("fill via css selector OK, value =", await dialog.locator("input[type=number]").inputValue());
} catch (e) {
  console.log("fill via css selector FAILED:", e.message.split("\n")[0]);
}
await browser.close();
