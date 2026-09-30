import { expect, test } from "@playwright/test";

test("Explorar tem título único, destinos visíveis e ações sem duplicação", async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/explore");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("button", { name: "ADIDAS, ver detalhes", exact: true })).toBeInViewport();
  await expect(page.getByRole("button", { name: "Ver detalhes de ADIDAS", exact: true })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("explore-desktop.png") });
  await page.setViewportSize({ width: 360, height: 800 });
  await expect(page.getByRole("button", { name: "ADIDAS, ver detalhes", exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("explore-mobile.png") });
});

test("Filtros por teclado mantêm foco, mostram critérios ativos e permitem remoção", async ({ page }) => {
  await page.goto("/explore");
  const trigger = page.getByRole("button", { name: "Filtrar e ordenar", exact: true });
  await trigger.focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Filtros e ordenação", exact: true })).toBeFocused();
  await expect(page.getByRole("dialog", { name: "Filtros e ordenação", exact: true })).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Mostrar resultados", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Fechar Filtros e ordenação", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Térreo", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await expect(page.getByRole("button", { name: "Remover filtro Térreo", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Remover filtro Térreo", exact: true }).click();
  await expect(page.getByRole("button", { name: "Remover filtro Térreo", exact: true })).toHaveCount(0);
  const details = page.getByRole("button", { name: "ADIDAS, ver detalhes", exact: true });
  await details.focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "ADIDAS", exact: true })).toBeFocused();
  await page.keyboard.press("Escape"); await expect(details).toBeFocused();
});

test("Texto ampliado preserva ações e detalhes com movimento reduzido", async ({ page }, info) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/explore");
  await page.getByLabel("Buscar no Explorar").fill("ADIDAS");
  const route = page.getByRole("button", { name: "Como chegar a ADIDAS", exact: true });
  await expect(route).toBeVisible();
  await page.evaluate(() => document.querySelectorAll<HTMLElement>("[role=main] div, [role=main] input, [role=main] h1").forEach((element) => {
    if ((!element.childElementCount && element.textContent?.trim()) || element.tagName === "INPUT") {
      const size = parseFloat(getComputedStyle(element).fontSize); element.style.fontSize = size * 2 + "px"; element.style.lineHeight = "1.45";
    }
  }));
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(route).toBeVisible();
  expect((await route.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await route.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("explore-large-text.png"), fullPage: true });
  await page.getByRole("button", { name: "ADIDAS, ver detalhes", exact: true }).click();
  await expect(page.getByRole("button", { name: "Traçar rota", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("Logotipo cadastrado aparece e falha de carregamento mantém identificação", async ({ page }) => {
  await page.route("**/api/pois?*", async (route) => {
    const response = await route.fetch(); const pois = await response.json();
    await route.fulfill({ response, json: pois.map((poi: any) => ({ ...poi, logo_url: poi.nome === "ADIDAS" ? "/marca-teste.svg" : poi.logo_url })) });
  });
  await page.route("**/marca-teste.svg", (route) => route.fulfill({ contentType: "image/svg+xml", body: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect width="48" height="48" fill="#164c70"/></svg>' }));
  await page.goto("/explore");
  const adidas = page.getByRole("button", { name: "ADIDAS, ver detalhes", exact: true });
  await expect(adidas).toBeVisible();
  await expect(adidas.locator("img")).toBeVisible();
  await expect(adidas.getByText("E01", { exact: true })).toHaveCount(0);
  await page.unroute("**/marca-teste.svg");
  await page.route("**/marca-teste.svg", (route) => route.fulfill({ status: 404 }));
  await page.reload();
  await expect(adidas.getByText("E01", { exact: true })).toBeVisible();
  await adidas.click();
  await expect(page.getByRole("button", { name: "Traçar rota", exact: true })).toBeVisible();
});

test("Textos de resultados e ação principal mantêm contraste de pelo menos 4,5 para 1", async ({ page }) => {
  await page.goto("/explore");
  const adidas = page.getByRole("button", { name: "ADIDAS, ver detalhes", exact: true });
  await expect(adidas).toBeVisible();
  for (const text of [adidas.getByText("ADIDAS", { exact: true }), adidas.getByText(/^Aberto/), adidas.getByText(/ESPORTE/), page.getByRole("button", { name: "Como chegar a ADIDAS", exact: true }).getByText("Ir →", { exact: true })]) {
    const contrast = await text.evaluate((element) => {
      function luminance(color: string) {
        const rgb = color.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((value) => { const channel = value / 255; return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4; });
        return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
      }
      let parent: Element | null = element, background = "rgb(255, 255, 255)";
      while (parent) {
        const color = getComputedStyle(parent).backgroundColor;
        if (color !== "rgba(0, 0, 0, 0)" && color !== "transparent") { background = color; break; }
        parent = parent.parentElement;
      }
      const first = luminance(getComputedStyle(element).color), second = luminance(background);
      return (Math.max(first, second) + .05) / (Math.min(first, second) + .05);
    });
    expect(contrast).toBeGreaterThanOrEqual(4.5);
  }
});
