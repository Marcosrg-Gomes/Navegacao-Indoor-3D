import { expect, test, type Page } from "@playwright/test";

async function start(page: Page) {
  await page.goto("/?qr=MINI-ENTRADA-PRINCIPAL");
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
}
async function destination(page: Page, name = "NATURA") {
  await page.getByLabel("Buscar destinos", { exact: true }).fill(name);
  await page.getByRole("button", { name: name + ", Aberto", exact: true }).click();
  const response = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Traçar rota", exact: true }).click();
  return (await response).json();
}

test("Ajuda lembra dispensa e pode ser reaberta pelo teclado", async ({ page }) => {
  await start(page);
  await expect(page.getByText("Primeira vez por aqui?", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Entendi", exact: true }).click();
  await page.reload();
  await expect(page.getByTestId("origin-label")).toHaveText("Ponto de partida não definido");
  await expect(page.getByText("Primeira vez por aqui?", { exact: true })).toHaveCount(0);
  const help = page.getByRole("button", { name: "Ajuda", exact: true });
  await help.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Ajuda para se localizar", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Fechar ajuda", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(help).toBeVisible();
});

test("Favoritos e recentes persistem; a posição precisa ser confirmada novamente", async ({ page }) => {
  await start(page);
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await page.getByLabel("Buscar no Explorar").fill("natura");
  const save = page.getByRole("button", { name: "Salvar NATURA nos favoritos", exact: true });
  await expect(save).toBeEnabled();
  await save.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Remover NATURA dos favoritos", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Como chegar a NATURA", exact: true }).click();
  await expect(page.getByTestId("route-panel")).toContainText("NATURA");
  await expect(page).toHaveURL(/\/$/);
  await page.goto("/explore");
  await page.getByRole("button", { name: "Filtrar e ordenar", exact: true }).click();
  await page.getByRole("button", { name: "Favoritos", exact: true }).click();
  await page.getByRole("button", { name: "Mostrar resultados", exact: true }).click();
  await expect(page.getByRole("button", { name: "NATURA, ver detalhes", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "ADIDAS, ver detalhes", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Filtrar e ordenar", exact: true }).click();
  await page.getByRole("button", { name: "Recentes", exact: true }).click();
  await page.getByRole("button", { name: "Mostrar resultados", exact: true }).click();
  await expect(page.getByRole("button", { name: "NATURA, ver detalhes", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ver minha localização no mapa" })).toContainText("Defina sua posição");
});

test("Explorar busca e ordena pelo percurso da API", async ({ page, request }) => {
  await start(page);
  const origin = await (await request.get("/api/qr-codes/MINI-ENTRADA-PRINCIPAL")).json();
  const distances = await (await request.get("/api/routes/distances?origem_no_id=" + origin.no.id)).json();
  const pois = await (await request.get("/api/pois")).json();
  const natura = pois.find((p: any) => p.nome === "NATURA");
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await page.getByLabel("Buscar no Explorar").fill("natura");
  await expect(page.getByTestId("explore-poi-" + natura.id)).toContainText("≈ " + Math.round(distances[natura.no_id]) + " m de percurso");
  await page.getByLabel("Buscar no Explorar").fill("");
  await page.getByRole("button", { name: "Filtrar e ordenar", exact: true }).click();
  await page.getByRole("button", { name: "Lojas", exact: true }).click();
  await page.getByRole("button", { name: "Mais próximos", exact: true }).click();
  await page.getByRole("button", { name: "Mostrar resultados", exact: true }).click();
  const malls = await (await request.get("/api/shoppings")).json();
  const floors = await (await request.get("/api/shoppings/" + malls[0].id + "/floors")).json();
  const graphs = await Promise.all(floors.map(async (floor: any) => (await request.get("/api/floors/" + floor.id + "/graph")).json()));
  const shopNodes = new Set(graphs.flatMap((graph: any) => graph.nos.filter((node: any) => node.tipo === "loja").map((node: any) => node.id)));
  const expected = pois.filter((p: any) => shopNodes.has(p.no_id) && distances[p.no_id] !== undefined).sort((a: any, b: any) => distances[a.no_id] - distances[b.no_id] || a.nome.localeCompare(b.nome, "pt-BR"));
  await expect(page.locator('[data-testid^="explore-poi-"]').first()).toHaveAttribute("data-testid", "explore-poi-" + expected[0].id);
});

test("Serviços sem loja recebem rotas e permitem voltar à entrada", async ({ page, request }) => {
  await start(page);
  const origin = await (await request.get("/api/qr-codes/MINI-ENTRADA-PRINCIPAL")).json();
  const floors = await (await request.get("/api/shoppings")).json();
  const floorList = await (await request.get("/api/shoppings/" + floors[0].id + "/floors")).json();
  const graph = await (await request.get("/api/floors/" + floorList[0].id + "/graph")).json();
  const lift = graph.nos.find((n: any) => n.tipo === "elevador");
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await page.getByRole("button", { name: "Filtrar e ordenar", exact: true }).click();
  await page.getByRole("button", { name: "Elevadores", exact: true }).click();
  await page.getByRole("button", { name: "Mostrar resultados", exact: true }).click();
  const response = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.request().method() === "POST");
  await page.getByTestId("explore-node-" + lift.id).getByRole("button", { name: "Como chegar a " + lift.nome, exact: true }).click();
  expect((await response).request().postDataJSON().destino_no_id).toBe(lift.id);
  await page.getByRole("button", { name: "Cheguei ao destino", exact: true }).click();
  await expect(page.getByTestId("origin-label")).toHaveText(lift.nome);
  await page.getByRole("tab", { name: /Explorar/ }).click();
  const back = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.request().method() === "POST");
  await page.getByRole("button", { name: "Voltar para a entrada", exact: true }).click();
  expect((await back).request().postDataJSON()).toMatchObject({ origem_no_id: lift.id, destino_no_id: origin.no.id });
});

test("Avançar instruções e visualizar outro piso não altera a posição", async ({ page }) => {
  await start(page);
  await page.getByRole("switch", { name: "Rota acessível" }).click();
  const route = await destination(page, "BURGER KING");
  const steps = route.etapas.filter((s: any) => s.tipo !== "inicio");
  const transition = steps.findIndex((s: any) => s.tipo === "troca_piso");
  expect(transition).toBeGreaterThanOrEqual(0);
  for (let i = 0; i < transition; i++) await page.getByRole("button", { name: "Próximo passo", exact: true }).click();
  await expect(page.getByTestId("current-instruction")).toContainText(steps[transition].texto);
  await page.getByRole("button", { name: "Ver trecho no Mezanino", exact: true }).click();
  await expect(page.getByTestId("scene-map")).toHaveAttribute("data-floor-id", String(steps[transition].piso_destino_id));
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  await expect(page.getByTestId("location-update")).toContainText("QR");
  await page.getByRole("button", { name: "Cheguei ao destino", exact: true }).click();
  await expect(page.getByTestId("location-update")).toContainText("Chegada");
  await expect(page.getByTestId("location-update")).toContainText("Mezanino");
});

test("Recálculo mantém mapa, sinaliza falha e recupera sem perder a origem", async ({ page }) => {
  await start(page);
  const route = await destination(page);
  const ids = route.nos.map((n: any) => n.id).join(",");
  let release!: () => void;
  const hold = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/routes", async (r) => { await hold; await r.abort(); });
  await page.getByRole("button", { name: "Recalcular", exact: true }).click();
  await expect(page.getByText("Recalculando trajeto…", { exact: true })).toBeVisible();
  await expect(page.getByTestId("scene-map")).toHaveAttribute("data-route-node-ids", ids);
  await expect(page.getByRole("button", { name: "Cheguei ao destino", exact: true })).toBeDisabled();
  release();
  await expect(page.getByText("Este é o trajeto anterior. Recalcule antes de continuar.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cheguei ao destino", exact: true })).toBeDisabled();
  await page.unroute("**/api/routes");
  await page.getByRole("button", { name: "Recalcular", exact: true }).click();
  await expect(page.getByRole("button", { name: "Cheguei ao destino", exact: true })).toBeEnabled();
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
});

test("Explorar recupera erro de carregamento e mantém alvos legíveis no celular", async ({ page }) => {
  const initialRevision = page.waitForResponse((response) => response.url().endsWith("/navigation-state"));
  await page.setViewportSize({ width: 360, height: 800 });
  await start(page);
  await initialRevision;
  await page.route("**/api/pois?*", (r) => r.abort());
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await expect(page.getByRole("button", { name: "Tentar novamente", exact: true })).toBeVisible();
  await page.unroute("**/api/pois?*");
  await page.getByRole("button", { name: "Tentar novamente", exact: true }).click();
  await page.getByLabel("Buscar no Explorar").fill("ADIDAS");
  const save = page.getByRole("button", { name: "Salvar ADIDAS nos favoritos", exact: true });
  await expect(save).toBeVisible();
  const box = await save.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  expect(box!.width).toBeGreaterThanOrEqual(44);
  await page.evaluate(() => {
    document.querySelectorAll<HTMLElement>('[data-testid^="explore-poi-"] div').forEach((el) => {
      if (el.childElementCount === 0 && el.textContent?.trim()) el.style.fontSize = parseFloat(getComputedStyle(el).fontSize) * 1.6 + "px";
    });
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole("button", { name: "Como chegar a ADIDAS", exact: true })).toBeVisible();
  await page.screenshot({ path: "../../evidence/visitor-large-text-360.png", fullPage: true });
});
