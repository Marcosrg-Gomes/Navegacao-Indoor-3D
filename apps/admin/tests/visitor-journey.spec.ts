import { expect, test, type Page } from "@playwright/test";

type ScreenFiber = {
  return: ScreenFiber | null;
  memoizedProps?: { navigation?: { setParams?: (params: Record<string, string>) => void } };
};

/**
 * Reentrega o deep link atualizando os parâmetros da rota na mesma instância da tela.
 * `page.goto()` e a troca da URL recriam o componente no web e escondem o defeito.
 */
async function setRouteParams(page: Page, params: Record<string, string>) {
  await page.evaluate((next) => {
    const label = document.querySelector('[data-testid="origin-label"]');
    if (!label) throw new Error("origin-label não encontrado para localizar a instância da tela.");
    const fiberKey = Object.keys(label).find((key) => key.startsWith("__reactFiber$"));
    if (!fiberKey) throw new Error("React Fiber indisponível em origin-label.");
    let fiber = (label as unknown as Record<string, ScreenFiber | undefined>)[fiberKey];
    for (let depth = 0; fiber && depth < 200; depth += 1, fiber = fiber.return) {
      const navigation = fiber.memoizedProps?.navigation;
      if (navigation && typeof navigation.setParams === "function") {
        navigation.setParams(next);
        return;
      }
    }
    throw new Error("navigation.setParams não encontrado na árvore de fibers.");
  }, params);
}

function trackQrResolutions(page: Page) {
  const tokens: string[] = [];
  page.on("request", (request) => {
    const match = request.url().match(/\/api\/qr-codes\/([^/?#]+)/);
    if (match) tokens.push(decodeURIComponent(match[1]));
  });
  return tokens;
}

async function start(page: Page) {
  await page.goto("/?qr=MINI-ENTRADA-PRINCIPAL");
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
}

async function destination(page: Page, name: string) {
  if ((page.viewportSize()?.width ?? 1280) < 600) {
    await page.getByRole("button", { name: "Pesquisar destinos" }).click();
    await page.getByLabel("Buscar no Explorar").fill(name);
    const response = page.waitForResponse((res) => res.url().endsWith("/api/routes") && res.request().method() === "POST");
    await page.getByRole("button", { name: `Como chegar a ${name}`, exact: true }).click();
    const result = await response;
    expect(result.ok()).toBeTruthy();
    return { body: result.request().postDataJSON(), route: await result.json() };
  }
  await page.getByLabel("Buscar destinos", { exact: true }).fill(name);
  await page.getByRole("button", { name: `${name}, Aberto`, exact: true }).click();
  const response = page.waitForResponse((res) => res.url().endsWith("/api/routes") && res.request().method() === "POST");
  await page.getByRole("button", { name: "Traçar rota", exact: true }).click();
  const result = await response;
  expect(result.ok()).toBeTruthy();
  return { body: result.request().postDataJSON(), route: await result.json() };
}

const OUTRO_SHOPPING = {
  shopping: { id: 999, codigo: "OUTRO_SHOPPING", nome: "Shopping Outro", ativo: true },
  floor: { id: 9002, codigo: "OUTRO_TERREO", shopping_id: 999, nome: "Térreo Outro", nivel: 0, ativo: true },
  node: { id: 9001, codigo: "OUTRO_ENTRADA", piso_id: 9002, coord_x: 1, coord_y: 1, tipo: "entrada", nome: "Entrada do Outro Shopping", ativo: true },
  qrToken: "OUTRO-SHOPPING",
};
const DESTINATION_DISCARDED =
  "Destino de outro shopping foi descartado. Escolha um novo destino no shopping atual.";

/**
 * O Mini Shopping da suíte tem um único shopping. Acrescenta um segundo shopping
 * apenas às respostas deste navegador, sem alterar seeds ou dados do servidor.
 */
async function mockSecondShopping(page: Page) {
  // As distâncias não participam destes cenários e o endpoint tem cota por IP;
  // responder localmente evita consumir a cota compartilhada com as demais suítes.
  await page.route(/\/api\/routes\/distances/, (route) => route.fulfill({ json: {} }));
  await page.route("**/api/shoppings", async (route) => {
    if (route.request().method() !== "GET") return route.continue();
    const real = await (await route.fetch()).json();
    await route.fulfill({ json: [...real, OUTRO_SHOPPING.shopping] });
  });
  await page.route("**/api/shoppings/999/floors", (route) => route.fulfill({ json: [OUTRO_SHOPPING.floor] }));
  await page.route("**/api/shoppings/999/navigation-state", (route) => route.fulfill({ json: { revisao: "r999", ativo: true } }));
  await page.route("**/api/shoppings/999/scene", (route) => route.fulfill({
    json: {
      shopping_id: 999,
      scene_version: "teste",
      release: 1,
      model_url: "/static/models/mini-shopping/mini-shopping-v1.glb",
      floors: [{ piso_id: 9002, codigo: OUTRO_SHOPPING.floor.codigo, origin: [0, 0, 0], axis_x: [1, 0, 0], axis_y: [0, 0, 1] }],
      pois: [],
      anchors: [{ node_id: 9001, codigo: OUTRO_SHOPPING.node.codigo, piso_id: 9002, coord_x: 1, coord_y: 1, type: "entrada", name: OUTRO_SHOPPING.node.nome }],
    },
  }));
  await page.route("**/api/floors/9002/graph", (route) => route.fulfill({
    json: {
      piso_id: 9002,
      piso_nome: OUTRO_SHOPPING.floor.nome,
      nos: [OUTRO_SHOPPING.node],
      arestas: [],
      conexoes_entre_pisos: [],
    },
  }));
  await page.route("**/api/qr-codes/OUTRO-SHOPPING", (route) => route.fulfill({
    json: {
      qr_code: { id: 900, no_id: 9001, token: OUTRO_SHOPPING.qrToken, ativo: true },
      no: OUTRO_SHOPPING.node,
    },
  }));
}

test("Chegada à NATURA atualiza a origem; próxima rota parte dela e cancelar preserva a posição", async ({ page }) => {
  await start(page);
  const first = await destination(page, "NATURA");
  await page.getByRole("button", { name: "Cheguei ao destino", exact: true }).click();
  await expect(page.getByTestId("arrival-notice")).toContainText("Sua próxima rota começa aqui.");
  await expect(page.getByTestId("origin-label")).toHaveText("NATURA");
  await expect(page.getByTestId("route-panel")).toHaveCount(0);
  await expect(page.getByTestId("scene-map")).toHaveAttribute("data-route-node-ids", "");
  await page.getByRole("button", { name: "Iniciar outra navegação", exact: true }).click();
  await expect(page.getByTestId("origin-label")).toHaveText("NATURA");
  const next = await destination(page, "ANACAPRI");
  expect(next.body.origem_no_id).toBe(first.body.destino_no_id);
  expect(next.route.nos[0].id).toBe(first.body.destino_no_id);
  expect(next.route.nos.at(-1).id).toBe(next.body.destino_no_id);
  await page.getByRole("button", { name: "Cancelar rota", exact: true }).click();
  await expect(page.getByTestId("origin-label")).toHaveText("NATURA");
  await page.getByLabel("Buscar destinos", { exact: true }).fill("NATURA");
  await page.getByRole("button", { name: "NATURA, Aberto", exact: true }).click();
  await page.getByRole("button", { name: "Traçar rota", exact: true }).click();
  await expect(page.getByTestId("arrival-notice")).toBeVisible();
  await expect(page.getByTestId("route-panel")).toHaveCount(0);
});

test("Chegada no mezanino abre o piso e a navegação pelo Explorar usa a nova origem", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page);
  const first = await destination(page, "BURGER KING");
  await page.getByRole("button", { name: "Mais opções" }).click();
  await page.getByRole("button", { name: "Cheguei ao destino", exact: true }).click();
  await expect(page.getByTestId("origin-label")).toHaveText("BURGER KING");
  await expect(page.getByTestId("location-update")).toContainText("Mezanino");
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await expect(page.getByRole("button", { name: "Ver minha localização no mapa" })).toContainText("BURGER KING");
  await page.getByRole("button", { name: "Filtrar e ordenar", exact: true }).click();
  await page.getByRole("button", { name: "Mezanino", exact: true }).click();
  await page.getByRole("button", { name: "Mostrar resultados", exact: true }).click();
  await expect(page.getByRole("button", { name: "Ver BURGER KING no mapa", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "ADIDAS, ver detalhes", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Filtrar e ordenar", exact: true }).click();
  await page.getByRole("button", { name: "Térreo", exact: true }).click();
  await page.getByRole("button", { name: "Mostrar resultados", exact: true }).click();
  await page.getByLabel("Buscar no Explorar").fill("ADIDAS");
  const response = page.waitForResponse((res) => res.url().endsWith("/api/routes") && res.request().method() === "POST");
  await page.getByRole("button", { name: "Como chegar a ADIDAS", exact: true }).click();
  const next = await response;
  expect(next.request().postDataJSON().origem_no_id).toBe(first.body.destino_no_id);
  await expect(page.getByTestId("route-panel")).toContainText("ADIDAS");
  await expect(page.getByTestId("origin-label")).toHaveText("BURGER KING");
});

test("Instruções têm uma única lista e a opção acessível explica o trajeto", async ({ page }) => {
  await start(page);
  await page.getByRole("button", { name: "O que é acessível?", exact: true }).click();
  await expect(page.getByText(/Evita escadas e escadas rolantes/)).toBeVisible();
  await page.getByRole("switch", { name: "Rota acessível" }).click();
  const { route, body } = await destination(page, "BURGER KING");
  expect(body.acessivel).toBe(true);
  expect(route.nos.some((node: { tipo: string }) => node.tipo === "elevador")).toBe(true);
  expect(route.nos.some((node: { tipo: string }) => node.tipo.includes("escada"))).toBe(false);
  await expect(page.getByTestId("route-instructions")).toHaveCount(0);
  await expect(page.getByTestId("current-instruction")).toContainText(route.instrucoes[1]);
  await page.getByRole("button", { name: "Ver instruções", exact: true }).click();
  await expect(page.getByTestId("route-instructions")).toHaveCount(1);
  await expect(page.getByText(route.instrucoes.at(-1), { exact: true })).toHaveCount(1);
  await page.getByRole("button", { name: "Ocultar instruções", exact: true }).click();
  await expect(page.getByTestId("route-instructions")).toHaveCount(0);
  await page.getByRole("button", { name: "Ver instruções", exact: true }).click();
  await expect(page.getByTestId("route-instructions")).toHaveCount(1);
  await expect(page.getByText(route.instrucoes.at(-1), { exact: true })).toHaveCount(1);
});

test("Explorar combina filtros, abre detalhes e mantém layout legível no celular e desktop", async ({ page, request }) => {
  await start(page);
  const pois: { nome: string; categoria_nome: string }[] = await (await request.get("/api/pois")).json();
  const category = pois.find((poi) => poi.nome === "ADIDAS")!.categoria_nome;
  await page.getByRole("tab", { name: /Explorar/ }).click();
  for (const width of [360, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.getByRole("button", { name: "Filtrar e ordenar", exact: true }).click();
    await page.getByRole("button", { name: "Térreo", exact: true }).click();
    await page.getByRole("button", { name: category, exact: true }).click();
    await page.getByRole("button", { name: "Mostrar resultados", exact: true }).click();
    await expect(page.getByRole("button", { name: "ADIDAS, ver detalhes", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "BURGER KING, ver detalhes", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "ADIDAS, ver detalhes", exact: true }).click();
    await expect(page.getByRole("button", { name: "Traçar rota", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Fechar detalhes", exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const tabs = width < 600 ? [["Mapa", "Mapa"], ["Ler QR Code", "Ler QR"], ["Explorar", "Explorar"]] : [["Início", "Início"], ["Mapa", "Mapa"], ["Ler QR Code", "Ler QR"], ["Explorar", "Explorar"]];
    for (const [name, label] of tabs) {
      await expect(page.getByRole("tab", { name, exact: true }).getByText(label, { exact: true })).toBeInViewport({ ratio: 1 });
    }
    await page.getByRole("button", { name: "Filtrar e ordenar", exact: true }).click();
    await page.getByRole("button", { name: "Todas", exact: true }).click();
    await page.getByRole("button", { name: "Todos os pisos", exact: true }).click();
    await page.getByRole("button", { name: "Mostrar resultados", exact: true }).click();
    await expect(page.getByText("Filtros e ordenação", { exact: true })).toHaveCount(0);
    await page.screenshot({ path: `../../evidence/visitor-explore-${width}.png`, fullPage: true });
  }
});

test("Falha ao buscar piso da chegada mantém a origem e permite confirmar novamente", async ({ page }) => {
  await start(page);
  const { route } = await destination(page, "BURGER KING");
  const graphUrl = `**/api/floors/${route.nos.at(-1).piso_id}/graph`;
  await page.route(graphUrl, (request) => request.abort());
  await page.getByRole("button", { name: "Cheguei ao destino", exact: true }).click();
  await expect(page.getByText(/Não foi possível conectar ao servidor/)).toBeVisible();
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  await expect(page.getByTestId("arrival-notice")).toHaveCount(0);
  await page.unroute(graphUrl);
  await page.getByRole("button", { name: "Cheguei ao destino", exact: true }).click();
  await expect(page.getByTestId("origin-label")).toHaveText("BURGER KING");
  await expect(page.getByTestId("arrival-notice")).toBeVisible();
});

test("Cancelar durante a confirmação impede que uma resposta atrasada altere a localização", async ({ page }) => {
  await start(page);
  const { route } = await destination(page, "BURGER KING");
  const graphUrl = `**/api/floors/${route.nos.at(-1).piso_id}/graph`;
  let release!: () => void;
  const hold = new Promise<void>((resolve) => { release = resolve; });
  await page.route(graphUrl, async (request) => { await hold; await request.continue(); });
  await page.getByRole("button", { name: "Cheguei ao destino", exact: true }).click();
  await expect(page.getByRole("button", { name: "Atualizando posição…", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Cancelar rota", exact: true }).click();
  const response = page.waitForResponse((res) => res.url().endsWith(`/api/floors/${route.nos.at(-1).piso_id}/graph`));
  release();
  await response;
  await page.unroute(graphUrl);
  const next = await destination(page, "NATURA");
  expect(next.body.origem_no_id).toBe(route.nos[0].id);
  await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  await expect(page.getByTestId("arrival-notice")).toHaveCount(0);
});

test("Reabrir o mesmo QR com a tela montada resolve a origem novamente", async ({ page }) => {
  const resolutions = trackQrResolutions(page);
  await start(page);
  expect(resolutions).toEqual(["MINI-ENTRADA-PRINCIPAL"]);
  const search = page.getByLabel("Buscar destinos", { exact: true });
  await search.fill("MARCADOR");
  await expect(search).toHaveValue("MARCADOR");

  await setRouteParams(page, { qr: "MINI-ENTRADA-PRINCIPAL", token: "" });

  await expect.poll(() => resolutions.length).toBe(2);
  await expect(page.getByTestId("origin-label")).toHaveText("Entrada principal");
  expect(resolutions).toEqual(["MINI-ENTRADA-PRINCIPAL", "MINI-ENTRADA-PRINCIPAL"]);
  // A tela não foi recriada: o texto da busca sobreviveu à reabertura do link.
  await expect(search).toHaveValue("MARCADOR");
  // O efeito conclui limpando o parâmetro; com o defeito a URL ficaria presa no token.
  await expect.poll(() => new URL(page.url()).searchParams.get("qr")).toBe("");
});

test("Falha na resolução permite repetir o mesmo QR até definir a origem", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/qr-codes/**", async (route) => {
    attempts += 1;
    if (attempts === 1) {
      await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ detail: "falha simulada" }) });
      return;
    }
    await route.continue();
  });

  await page.goto("/?qr=MINI-ENTRADA-PRINCIPAL");
  await expect(page.getByText("falha simulada", { exact: true })).toBeVisible();
  expect(attempts).toBe(1);

  await setRouteParams(page, { qr: "MINI-ENTRADA-PRINCIPAL", token: "" });

  await expect(page.getByTestId("origin-label")).toHaveText("Entrada principal");
  expect(attempts).toBe(2);
  await page.unroute("**/api/qr-codes/**");
});

test("Reabrir o QR anterior restaura a origem trocada manualmente", async ({ page }) => {
  const resolutions = trackQrResolutions(page);
  await start(page);

  await page.getByRole("button", { name: "Alterar origem", exact: true }).click();
  await page.getByLabel("Lugar que estou vendo").fill("ADIDAS");
  await page.getByRole("button", { name: "Estou vendo ADIDAS", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar minha posição em ADIDAS", exact: true }).click();
  await expect(page.getByTestId("origin-label")).toHaveText("ADIDAS");
  expect(resolutions).toHaveLength(1);

  await setRouteParams(page, { qr: "MINI-ENTRADA-PRINCIPAL", token: "" });

  await expect(page.getByTestId("origin-label")).toHaveText("Entrada principal");
  expect(resolutions).toEqual(["MINI-ENTRADA-PRINCIPAL", "MINI-ENTRADA-PRINCIPAL"]);
});

test("Repetir o mesmo QR durante a requisição mantém uma única resolução", async ({ page }) => {
  const resolutions = trackQrResolutions(page);
  let release!: () => void;
  const hold = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/qr-codes/**", async (route) => { await hold; await route.continue(); });

  await page.goto("/?qr=MINI-ENTRADA-PRINCIPAL");
  await expect.poll(() => resolutions.length).toBe(1);
  await expect(page.getByTestId("origin-label")).not.toHaveText("Entrada principal");

  await setRouteParams(page, { qr: "", token: "" });
  await setRouteParams(page, { qr: "MINI-ENTRADA-PRINCIPAL", token: "" });
  await page.waitForTimeout(500);
  expect(resolutions).toEqual(["MINI-ENTRADA-PRINCIPAL"]);

  release();
  await expect(page.getByTestId("origin-label")).toHaveText("Entrada principal");
  expect(resolutions).toEqual(["MINI-ENTRADA-PRINCIPAL"]);
  await page.unroute("**/api/qr-codes/**");
});

test("Token diferente continua resolvendo depois de um token repetido", async ({ page, request }) => {
  const resolutions = trackQrResolutions(page);
  await start(page);
  const node = (await (await request.get("/api/qr-codes/MINI-MEZANINO-CENTRAL")).json()).no;

  await setRouteParams(page, { qr: "MINI-MEZANINO-CENTRAL", token: "" });

  await expect(page.getByTestId("origin-label")).toHaveText(node.nome);
  expect(resolutions).toEqual(["MINI-ENTRADA-PRINCIPAL", "MINI-MEZANINO-CENTRAL"]);
});

test("QR de outro shopping sem destino troca origem e piso sem anunciar descarte", async ({ page }) => {
  await mockSecondShopping(page);
  await start(page);
  await expect(page.getByTestId("origin-label").first()).toHaveText("Entrada principal");

  await setRouteParams(page, { qr: OUTRO_SHOPPING.qrToken, token: "" });

  await expect(page.getByTestId("origin-label").first()).toHaveText("Entrada do Outro Shopping");
  await expect(page.getByText(OUTRO_SHOPPING.shopping.nome, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(OUTRO_SHOPPING.floor.nome, { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Shopping Outro ✓", exact: true })).toBeVisible();
  await expect(page.getByText(DESTINATION_DISCARDED, { exact: true })).toHaveCount(0);
  await expect(page.getByTestId("route-panel")).toHaveCount(0);
  await expect(page.getByTestId("scene-map")).toHaveAttribute("data-route-node-ids", "");
});

test("QR de outro shopping com destino de loja descarta destino e rota com um único aviso", async ({ page }) => {
  await mockSecondShopping(page);
  await start(page);
  const { route } = await destination(page, "NATURA");
  expect(route.nos.length).toBeGreaterThan(0);
  await expect(page.getByTestId("route-panel")).toContainText("NATURA");
  await expect(page.getByText("Destino: NATURA", { exact: true })).toBeVisible();

  await setRouteParams(page, { qr: OUTRO_SHOPPING.qrToken, token: "" });

  await expect(page.getByTestId("origin-label").first()).toHaveText("Entrada do Outro Shopping");
  await expect(page.getByText(DESTINATION_DISCARDED, { exact: true })).toHaveCount(1);
  await expect(page.getByTestId("route-panel")).toHaveCount(0);
  await expect(page.getByText(/^Destino: /)).toHaveCount(0);
  await expect(page.getByTestId("arrival-notice")).toHaveCount(0);
  await expect(page.getByTestId("scene-map")).toHaveAttribute("data-route-node-ids", "");
});

test("QR de outro shopping com destino de nó descarta a rota e avisa uma vez", async ({ page }) => {
  await mockSecondShopping(page);
  await start(page);
  await page.getByRole("tab", { name: /Explorar/ }).click();
  await page.getByLabel("Buscar no Explorar").fill("Elevador");
  await page.getByRole("button", { name: "Filtrar e ordenar", exact: true }).click();
  await page.getByRole("button", { name: "Térreo", exact: true }).click();
  await page.getByRole("button", { name: "Mostrar resultados", exact: true }).click();
  await expect(page.getByRole("button", { name: /^Como chegar a Elevador/ })).toHaveCount(1);
  const response = page.waitForResponse((res) => res.url().endsWith("/api/routes") && res.request().method() === "POST");
  await page.getByRole("button", { name: /^Como chegar a Elevador/ }).click();
  expect((await response).ok()).toBeTruthy();
  await expect(page.getByTestId("route-panel")).toContainText(/Elevador/);

  await setRouteParams(page, { qr: OUTRO_SHOPPING.qrToken, token: "" });

  await expect(page.getByText(DESTINATION_DISCARDED, { exact: true })).toHaveCount(1);
  await expect(page.getByTestId("route-panel")).toHaveCount(0);
  await expect(page.getByTestId("arrival-notice")).toHaveCount(0);
  await expect(page.getByTestId("scene-map")).toHaveAttribute("data-route-node-ids", "");
});

test("Troca explícita de shopping continua sem anunciar descarte de destino", async ({ page }) => {
  await mockSecondShopping(page);
  await start(page);

  await page.getByRole("button", { name: "Shopping Outro", exact: true }).click();

  await expect(page.getByRole("button", { name: "Shopping Outro ✓", exact: true })).toBeVisible();
  await expect(page.getByText(OUTRO_SHOPPING.floor.nome, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(DESTINATION_DISCARDED, { exact: true })).toHaveCount(0);
});
