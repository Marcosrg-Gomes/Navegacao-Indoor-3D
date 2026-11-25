# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: layout-accessibility.spec.ts >> Acessibilidade do Modal: fechamento por teclado e retorno do foco
- Location: tests\layout-accessibility.spec.ts:45:1

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:8765/?qr=MINI-ENTRADA-PRINCIPAL
Call log:
  - navigating to "http://127.0.0.1:8765/?qr=MINI-ENTRADA-PRINCIPAL", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - heading "Não é possível acessar esse site" [level=1] [ref=e7]
    - paragraph [ref=e8]:
      - text: A conexão com
      - strong [ref=e9]: 127.0.0.1
      - text: foi recusada.
    - generic [ref=e10]:
      - paragraph [ref=e11]: "Tente:"
      - list [ref=e12]:
        - listitem [ref=e13]: Verificar a conexão
        - listitem [ref=e14]:
          - link "Verificar o proxy e o firewall" [ref=e15] [cursor=pointer]:
            - /url: "#buttons"
    - generic [ref=e16]: ERR_CONNECTION_REFUSED
  - generic [ref=e17]:
    - button "Recarregar" [ref=e19] [cursor=pointer]
    - button "Saiba mais" [ref=e20] [cursor=pointer]
```

# Test source

```ts
  1   | import { expect, test } from "@playwright/test";
  2   | import { visitorQrUrl } from "./visitor-url";
  3   | 
  4   | async function loadWithQr(page: any) {
  5   |   await page.setViewportSize({ width: 414, height: 896 });
> 6   |   await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"));
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:8765/?qr=MINI-ENTRADA-PRINCIPAL
  7   |   await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);
  8   |   await page.getByRole("button", { name: "Pesquisar destinos" }).click();
  9   |   await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  10  | }
  11  | 
  12  | test("Explorar tem título único, destinos visíveis e ações sem duplicação", async ({ page }, info) => {
  13  |   await page.setViewportSize({ width: 1280, height: 800 });
  14  |   await loadWithQr(page);
  15  |   const adidas = page.getByRole("button", { name: "ADIDAS, ver detalhes", exact: true });
  16  |   await expect(adidas).toBeVisible();
  17  |   await adidas.scrollIntoViewIfNeeded();
  18  |   await expect(adidas).toBeInViewport();
  19  |   await page.screenshot({ path: info.outputPath("explore-desktop.png") });
  20  |   await page.setViewportSize({ width: 360, height: 800 });
  21  |   await expect(adidas).toBeVisible();
  22  |   await adidas.scrollIntoViewIfNeeded();
  23  |   await expect(adidas).toBeInViewport();
  24  |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  25  |   await page.screenshot({ path: info.outputPath("explore-mobile.png") });
  26  | });
  27  | 
  28  | test("Filtros aplicados mostram critérios ativos e permitem remoção", async ({ page }) => {
  29  |   await loadWithQr(page);
  30  |   // Aguarda a tela Explorar montar completamente
  31  |   await expect(page.getByRole("button", { name: "Filtrar e ordenar", exact: true })).toBeVisible({ timeout: 15000 });
  32  |   const trigger = page.getByRole("button", { name: "Filtrar e ordenar", exact: true });
  33  |   await trigger.click();
  34  |   const dialog = page.getByRole("dialog", { name: "Filtros e ordenação", exact: true });
  35  |   await expect(dialog).toBeVisible();
  36  |   // Foco inicial está dentro do dialog (comportamento correto de modal)
  37  |   await expect(dialog).toBeFocused();
  38  |   await page.getByRole("button", { name: "Térreo", exact: true }).click();
  39  |   await page.keyboard.press("Escape");
  40  |   await expect(page.getByRole("button", { name: "Remover filtro Térreo", exact: true })).toBeVisible();
  41  |   await page.getByRole("button", { name: "Remover filtro Térreo", exact: true }).click();
  42  |   await expect(page.getByRole("button", { name: "Remover filtro Térreo", exact: true })).toHaveCount(0);
  43  | });
  44  | 
  45  | test("Acessibilidade do Modal: fechamento por teclado e retorno do foco", async ({ page }) => {
  46  |   await loadWithQr(page);
  47  |   const trigger = page.getByRole("button", { name: "Filtrar e ordenar", exact: true });
  48  |   await expect(trigger).toBeVisible({ timeout: 15000 });
  49  |   await trigger.click();
  50  |   const dialog = page.getByRole("dialog", { name: "Filtros e ordenação", exact: true });
  51  |   await expect(dialog).toBeVisible();
  52  |   await expect(dialog).toBeFocused();
  53  |   // Fecha com Escape e verifica retorno do foco ao trigger
  54  |   await page.keyboard.press("Escape");
  55  |   await expect(dialog).toBeHidden();
  56  |   await expect(trigger).toBeFocused();
  57  | });
  58  | 
  59  | test("Texto ampliado preserva ações e detalhes com movimento reduzido", async ({ page }, info) => {
  60  |   await page.setViewportSize({ width: 360, height: 800 });
  61  |   await page.emulateMedia({ reducedMotion: "reduce" });
  62  |   await loadWithQr(page);
  63  |   await page.getByLabel("Buscar no Explorar").fill("ADIDAS");
  64  |   const route = page.getByRole("button", { name: "Como chegar a ADIDAS", exact: true });
  65  |   await expect(route).toBeVisible();
  66  |   await page.evaluate(() => document.querySelectorAll<HTMLElement>("[role=main] div, [role=main] input, [role=main] h1").forEach((element) => {
  67  |     if ((!element.childElementCount && element.textContent?.trim()) || element.tagName === "INPUT") {
  68  |       const size = parseFloat(getComputedStyle(element).fontSize); element.style.fontSize = size * 2 + "px"; element.style.lineHeight = "1.45";
  69  |     }
  70  |   }));
  71  |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  72  |   await expect(route).toBeVisible();
  73  |   expect((await route.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  74  |   await route.scrollIntoViewIfNeeded();
  75  |   await page.screenshot({ path: info.outputPath("explore-large-text.png"), fullPage: true });
  76  |   await page.getByRole("button", { name: "ADIDAS, ver detalhes", exact: true }).click();
  77  |   await expect(page.getByRole("button", { name: "Traçar rota", exact: true })).toBeVisible();
  78  |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  79  | });
  80  | 
  81  | test("Logotipo cadastrado aparece e falha de carregamento mantém identificação", async ({ page }) => {
  82  |   await page.route("**/api/pois?*", async (route) => {
  83  |     const response = await route.fetch(); const pois = await response.json();
  84  |     await route.fulfill({ response, json: pois.map((poi: any) => ({ ...poi, logo_url: poi.nome === "ADIDAS" ? "/marca-teste.svg" : poi.logo_url })) });
  85  |   });
  86  |   await page.route("**/marca-teste.svg", (route) => route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="#164c70"/></svg>' }));
  87  |   await loadWithQr(page);
  88  |   const adidas = page.getByRole("button", { name: "ADIDAS, ver detalhes", exact: true });
  89  |   await expect(adidas).toBeVisible();
  90  |   await expect(adidas.locator("img")).toBeVisible();
  91  |   await expect(adidas.getByText("E01", { exact: true })).toHaveCount(0);
  92  |   await page.unroute("**/marca-teste.svg");
  93  |   await page.route("**/marca-teste.svg", (route) => route.fulfill({ status: 404 }));
  94  |   await page.reload();
  95  |   await expect(adidas.getByText("E01", { exact: true })).toBeVisible();
  96  |   await adidas.click();
  97  |   await expect(page.getByRole("button", { name: "Traçar rota", exact: true })).toBeVisible();
  98  | });
  99  | 
  100 | test("Textos de resultados e ação principal mantêm contraste de pelo menos 4,5 para 1", async ({ page }) => {
  101 |   await loadWithQr(page);
  102 |   const adidas = page.getByRole("button", { name: "ADIDAS, ver detalhes", exact: true });
  103 |   await expect(adidas).toBeVisible();
  104 |   for (const text of [adidas.getByText("ADIDAS", { exact: true }), adidas.getByText(/^Aberto/), adidas.getByText(/ESPORTE/), page.getByRole("button", { name: "Como chegar a ADIDAS", exact: true }).getByText("Ir", { exact: true })]) {
  105 |     const contrast = await text.evaluate((element) => {
  106 |       function luminance(color: string) {
```