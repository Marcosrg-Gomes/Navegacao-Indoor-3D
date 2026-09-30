import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  (page as Page & { runtimeErrors?: string[] }).runtimeErrors = errors;
});
test.afterEach(async ({ page }) => {
  expect((page as Page & { runtimeErrors?: string[] }).runtimeErrors).toEqual([]);
});

async function destination(page: Page, name: string) {
  await page.getByLabel("Buscar destinos", { exact: true }).fill(name);
  await page.getByRole("button", { name: name + ", Aberto", exact: true }).click();
  const response = page.waitForResponse((res) => res.url().endsWith("/api/routes") && res.request().method() === "POST");
  await page.getByRole("button", { name: "Traçar rota", exact: true }).click();
  return (await response).json();
}
test("Diretório liga índice, categorias e seleção à planta e mantém busca no celular", async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto("/explore");
  await expect(page.getByRole("heading", { name: "Encontre seu lugar." })).toBeVisible();
  await expect(page.getByTestId("floor-map")).toBeVisible();
  await page.getByRole("button", { name: "Nomes com N", exact: true }).click();
  await expect(page.getByRole("button", { name: "NATURA, ver detalhes", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "ADIDAS, ver detalhes", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "NATURA, ver detalhes", exact: true }).hover();
  await expect(page.getByRole("button", { name: "Informações do local", exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath("directory-desktop.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel("Buscar no Explorar").fill("ADIDAS");
  await page.getByRole("button", { name: "Ver no mapa ↗", exact: true }).click();
  await expect(page.getByTestId("floor-map")).toBeVisible();
  await expect(page.getByTestId("directory-selection")).toContainText("ADIDAS");
  await page.getByRole("button", { name: /Voltar à lista/ }).click();
  await expect(page.getByLabel("Buscar no Explorar")).toHaveValue("ADIDAS");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("directory-mobile.png") });
});

test("Reconhecer um lugar exige confirmação e Estou perdido recalcula mantendo destino", async ({ page }, info) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Onde você");
  await page.screenshot({ path: info.outputPath("intent-home.png") });
  await page.getByRole("button", { name: "Definir ponto de partida", exact: true }).click();
  await page.getByLabel("Lugar que estou vendo").fill("NATURA");
  await page.getByRole("button", { name: "Estou vendo NATURA", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar minha posição em NATURA", exact: true }).click();
  await expect(page.getByTestId("origin-label")).toHaveText("NATURA");
  const route = await destination(page, "ANACAPRI");
  expect(route.resumo.metros_corredor).toBeGreaterThan(0);
  await expect(page.getByLabel("Buscar destinos", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Ver mapa do trajeto ↓", exact: true }).click();
  await expect(page.getByRole("button", { name: "↑ Voltar às instruções", exact: true })).toBeInViewport();
  await page.getByRole("button", { name: "↑ Voltar às instruções", exact: true }).click();
  await expect(page.getByTestId("current-instruction")).toBeInViewport();
  await page.getByRole("button", { name: "Estou perdido", exact: true }).click();
  await page.getByLabel("Lugar que estou vendo").fill("ADIDAS");
  await page.getByRole("button", { name: "Estou vendo ADIDAS", exact: true }).click();
  const recalculated = page.waitForResponse((res) => res.url().endsWith("/api/routes") && res.request().method() === "POST");
  await page.getByRole("button", { name: "Confirmar minha posição em ADIDAS", exact: true }).click();
  const updated = await (await recalculated).json();
  expect(updated.nos[0].nome).toBe("ADIDAS"); expect(updated.nos.at(-1).nome).toBe("ANACAPRI");
  await expect(page.getByTestId("origin-label")).toContainText("ADIDAS");
  await page.getByRole("button", { name: "Cheguei ao destino", exact: true }).click();
  await expect(page.getByTestId("arrival-notice")).toContainText("ANACAPRI");
  await expect(page.getByRole("button", { name: "Corrigir minha posição", exact: true })).toBeVisible();
  await page.getByTestId("arrival-notice").scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("arrival-actions.png") });
});

test("Prévia 3D muda a câmera do trecho sem alterar a origem", async ({ page }, info) => {
  await page.goto("/?qr=MINI-ENTRADA-PRINCIPAL");
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  await destination(page, "NATURA");
  await page.getByRole("button", { name: "Ver o que encontrarei ↗", exact: true }).click();
  const scene = page.getByTestId("scene-map");
  await expect(scene).toHaveAttribute("data-preview", "walk");
  await expect(scene).not.toHaveAttribute("data-camera-position", "");
  await scene.scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("corridor-preview.png") });
  const position = await scene.getAttribute("data-camera-position");
  await page.getByRole("button", { name: "Próxima referência", exact: true }).click();
  await expect(scene).not.toHaveAttribute("data-camera-position", position!);
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  await page.getByRole("button", { name: "Voltar à vista do mapa", exact: true }).click();
  await expect(scene).toHaveAttribute("data-preview", "map");
});

test("Passeio entre favoritos usa cada chegada como origem da próxima parada", async ({ page }) => {
  await page.goto("/?qr=MINI-ENTRADA-PRINCIPAL");
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  await page.getByRole("tab", { name: "Explorar", exact: true }).click();
  for (const name of ["NATURA", "ANACAPRI"]) {
    await page.getByLabel("Buscar no Explorar").fill(name);
    await page.getByRole("button", { name: "Salvar " + name + " nos favoritos", exact: true }).click();
  }
  await page.getByRole("button", { name: "Meus lugares ↗", exact: true }).click();
  await page.getByRole("switch", { name: "Avisos de favoritos próximos", exact: true }).click();
  await page.getByRole("button", { name: "Incluir NATURA no passeio", exact: true }).click();
  await page.getByRole("button", { name: "Incluir ANACAPRI no passeio", exact: true }).click();
  await page.getByRole("button", { name: "Visitar 2 lugares nesta ordem", exact: true }).click();
  await expect(page.getByTestId("route-panel")).toContainText("NATURA");
  await page.getByRole("button", { name: "Cheguei ao destino", exact: true }).click();
  await expect(page.getByTestId("arrival-notice")).toBeVisible();
  const response = page.waitForResponse((res) => res.url().endsWith("/api/routes") && res.request().method() === "POST");
  await page.getByRole("button", { name: "Próxima parada: ANACAPRI", exact: true }).click();
  const route = await (await response).json();
  expect(route.nos[0].nome).toBe("NATURA"); expect(route.nos.at(-1).nome).toBe("ANACAPRI");
});

test("Local indisponível oferece alternativas abertas da mesma categoria", async ({ page, request }) => {
  const stores = await (await request.get("/api/pois")).json();
  const natura = stores.find((store: any) => store.nome === "NATURA");
  await page.route("**/api/pois?*", async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, json: (await response.json()).map((store: any) => store.id === natura.id ? { ...store, status_operacional: "manutencao", aberto_agora: false, horario_resumo: "Em manutenção" } : store) });
  });
  await page.goto("/explore");
  await page.getByLabel("Buscar no Explorar").fill("NATURA");
  await page.getByRole("button", { name: "NATURA, ver detalhes", exact: true }).click();
  await page.getByRole("button", { name: "Ver alternativas abertas em " + natura.categoria_nome, exact: true }).click();
  await expect(page.getByRole("button", { name: "Remover filtro Abertos", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Remover filtro " + natura.categoria_nome, exact: true })).toBeVisible();
  await expect(page.getByLabel("Buscar no Explorar")).toHaveValue("");
  await expect(page.getByRole("button", { name: "NATURA, ver detalhes", exact: true })).toHaveCount(0);
});

test("Detalhes do elevador mostram o outro piso servido pela conexão ativa", async ({ page, request }) => {
  const malls = await (await request.get("/api/shoppings")).json();
  const floors = await (await request.get(`/api/shoppings/${malls[0].id}/floors`)).json();
  const graph = await (await request.get(`/api/floors/${floors[0].id}/graph`)).json();
  const lift = graph.nos.find((node: any) => node.tipo === "elevador");
  expect(graph.conexoes_entre_pisos[lift.id].length).toBeGreaterThan(0);
  await page.goto("/explore");
  await page.getByLabel("Buscar no Explorar").fill(lift.nome);
  await page.getByTestId("explore-node-" + lift.id).getByRole("button", { name: lift.nome + ", ver detalhes", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Conexões cadastradas: Mezanino");
});
