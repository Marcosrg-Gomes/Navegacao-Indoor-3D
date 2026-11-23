import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { visitorQrUrl } from "./visitor-url";

const ADMIN_URL = "/admin/";
const ADMIN_API_KEY = "audit-local-admin-key-with-32-characters";

/**
 * Executa a auditoria automatizada do axe-core na página atual.
 * Retorna as violações encontradas (WCAG 2.2 AA + melhores práticas).
 */
async function axeAudit(page: any, options?: { name?: string; tags?: string[] }) {
  const results = await new AxeBuilder({ page })
    .withTags(options?.tags || ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  if (results.violations.length > 0) {
    console.log(`\n[AXE ${options?.name || "page"}] ${results.violations.length} violação(ões):`);
    for (const v of results.violations) {
      console.log(`  - [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} nó(s))`);
    }
  }
  return results;
}

/**
 * Carrega a página do visitante com um token QR (viewport mobile, onde o
 * botão "Pesquisar destinos" está visível) e aguarda hidratação.
 */
async function loadVisitor(page: any, token = "MINI-ENTRADA-PRINCIPAL") {
  await page.setViewportSize({ width: 414, height: 896 });
  await page.setExtraHTTPHeaders({ 'cache-control': 'no-cache, no-store, must-revalidate' });
  await page.goto(visitorQrUrl(token), { waitUntil: "networkidle" });
  await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i, { timeout: 30000 });
}

/**
 * Abre a tela de Explorar a partir da home do visitante.
 */
async function openExplore(page: any) {
  await page.getByRole("button", { name: "Pesquisar destinos" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1, { timeout: 30000 });
}

/**
 * Autentica no painel admin definindo a chave na sessionStorage e recarregando.
 */
async function loginAdmin(page: any) {
  await page.goto(ADMIN_URL);
  await page.addInitScript((key) => {
    sessionStorage.setItem("admin_api_key", key);
  }, ADMIN_API_KEY);
  await page.reload();
  await expect(page.locator("nav")).toBeVisible({ timeout: 30000 });
}

test.describe("Visitante — acessibilidade (público)", () => {
  test("Página inicial (QR da entrada) está livre de violações WCAG AA", async ({ page }) => {
    await loadVisitor(page);
    const results = await axeAudit(page, { name: "visitante-home" });
    expect(results.violations).toEqual([]);
  });

  test("Explorar — busca de destinos está livre de violações WCAG AA", async ({ page }) => {
    await loadVisitor(page);
    await openExplore(page);
    const results = await axeAudit(page, { name: "visitante-explorar" });
    expect(results.violations).toEqual([]);
  });

  test("Explorar móvel (360px) está livre de violações WCAG AA", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"));
    await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i, { timeout: 30000 });
    await openExplore(page);
    const results = await axeAudit(page, { name: "visitante-explorar-mobile" });
    expect(results.violations).toEqual([]);
  });

  test("Filtros e ordenação (dialog) estão livres de violações WCAG AA", async ({ page }) => {
    await loadVisitor(page);
    await openExplore(page);
    await page.getByRole("button", { name: "Filtrar e ordenar", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Filtros e ordenação", exact: true });
    await expect(dialog).toBeVisible();
    const results = await axeAudit(page, { name: "visitante-filtros-dialog" });
    expect(results.violations).toEqual([]);
  });

  test("Texto ampliado (200%) mantém a página livre de violações WCAG AA", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"), { waitUntil: "networkidle" });
    await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i, { timeout: 30000 });
    await openExplore(page);
    await page.evaluate(() => {
      document.querySelectorAll<HTMLElement>("[role=main] div, [role=main] input, [role=main] h1").forEach((element) => {
        if ((!element.childElementCount && element.textContent?.trim()) || element.tagName === "INPUT") {
          const size = parseFloat(getComputedStyle(element).fontSize);
          element.style.fontSize = size * 2 + "px";
          element.style.lineHeight = "1.45";
        }
      });
    });
    const results = await axeAudit(page, { name: "visitante-texto-ampliado" });
    expect(results.violations).toEqual([]);
  });
});

test.describe("Visitante — navegação por teclado", () => {
  test("É possível navegar pelo Explorar usando apenas o teclado (Tab/Enter/Esc)", async ({ page }) => {
    await loadVisitor(page);
    await openExplore(page);

    await page.keyboard.press("Tab");
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(["BUTTON", "INPUT", "A", "SELECT", "TEXTAREA"]).toContain(focused);

    await page.getByRole("button", { name: "Filtrar e ordenar", exact: true }).focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "Filtros e ordenação", exact: true });
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("O mapa aceita setas do teclado quando tem foco", async ({ page }) => {
    await loadVisitor(page);
    await page.keyboard.press("Tab");
    await page.keyboard.press("ArrowRight");
    await openExplore(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  });
});

test.describe("Admin — acessibilidade (autenticado)", () => {
  test("Página de login está livre de violações WCAG AA", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(ADMIN_URL);
    await page.addInitScript(() => sessionStorage.removeItem("admin_api_key"));
    await page.reload();
    await expect(page.locator("form")).toBeVisible();

    const results = await axeAudit(page, { name: "admin-login" });
    expect(results.violations).toEqual([]);
  });

  test("Dashboard está livre de violações WCAG AA", async ({ page }) => {
    await loginAdmin(page);
    await page.goto(ADMIN_URL);
    const results = await axeAudit(page, { name: "admin-dashboard" });
    expect(results.violations).toEqual([]);
  });

  test("Lojas estão livres de violações WCAG AA", async ({ page }) => {
    await loginAdmin(page);
    await page.goto(`${ADMIN_URL}lojas`);
    const results = await axeAudit(page, { name: "admin-lojas" });
    expect(results.violations).toEqual([]);
  });

  test("Categorias estão livres de violações WCAG AA", async ({ page }) => {
    await loginAdmin(page);
    await page.goto(`${ADMIN_URL}categorias`);
    const results = await axeAudit(page, { name: "admin-categorias" });
    expect(results.violations).toEqual([]);
  });

  test("Pisos estão livres de violações WCAG AA", async ({ page }) => {
    await loginAdmin(page);
    await page.goto(`${ADMIN_URL}pisos`);
    const results = await axeAudit(page, { name: "admin-pisos" });
    expect(results.violations).toEqual([]);
  });

  test("Editor de Nós está livre de violações WCAG AA", async ({ page }) => {
    await loginAdmin(page);
    await page.goto(`${ADMIN_URL}nos`);
    const results = await axeAudit(page, { name: "admin-nodes" });
    expect(results.violations).toEqual([]);
  });

  test("Arestas estão livres de violações WCAG AA", async ({ page }) => {
    await loginAdmin(page);
    await page.goto(`${ADMIN_URL}arestas`);
    const results = await axeAudit(page, { name: "admin-arestas" });
    expect(results.violations).toEqual([]);
  });

  test("QR Codes estão livres de violações WCAG AA", async ({ page }) => {
    await loginAdmin(page);
    await page.goto(`${ADMIN_URL}qr`);
    const results = await axeAudit(page, { name: "admin-qrcodes" });
    expect(results.violations).toEqual([]);
  });

  test("Validação está livre de violações WCAG AA", async ({ page }) => {
    await loginAdmin(page);
    await page.goto(`${ADMIN_URL}validacao`);
    const results = await axeAudit(page, { name: "admin-validacao" });
    expect(results.violations).toEqual([]);
  });

  test("Cena 3D está livre de violações WCAG AA", async ({ page }) => {
    await loginAdmin(page);
    await page.goto(`${ADMIN_URL}cena-3d`);
    const results = await axeAudit(page, { name: "admin-cena-3d" });
    expect(results.violations).toEqual([]);
  });

  test("Auditoria (Histórico e falhas) está livre de violações WCAG AA", async ({ page }) => {
    await loginAdmin(page);
    await page.goto(`${ADMIN_URL}auditoria`);
    const results = await axeAudit(page, { name: "admin-auditoria" });
    expect(results.violations).toEqual([]);
  });
});
