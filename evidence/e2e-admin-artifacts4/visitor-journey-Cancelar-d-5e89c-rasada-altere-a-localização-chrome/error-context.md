# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visitor-journey.spec.ts >> Cancelar durante a confirmação impede que uma resposta atrasada altere a localização
- Location: tests\visitor-journey.spec.ts:230:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByTestId('origin-label')
Expected substring: "Entrada principal"
Received string:    "Ponto de partida não definido"
Timeout: 5000ms

Call log:
  - Expect "toContainText" getByTestId('origin-label') with timeout 5000ms
  - waiting for getByTestId('origin-label')
    13 × locator resolved to <div dir="auto" data-testid="origin-label" class="css-146c3p1 r-1iewvzr r-ubezar r-1kfrs79">Ponto de partida não definido</div>
       - unexpected value "Ponto de partida não definido"

```

```yaml
- text: Ponto de partida não definido
```

# Test source

```ts
  1   | import { expect, test, type Page } from "@playwright/test";
  2   | 
  3   | type ScreenFiber = {
  4   |   return: ScreenFiber | null;
  5   |   memoizedProps?: { navigation?: { setParams?: (params: Record<string, string>) => void } };
  6   | };
  7   | 
  8   | /**
  9   |  * Reentrega o deep link atualizando os parâmetros da rota na mesma instância da tela.
  10  |  * `page.goto()` e a troca da URL recriam o componente no web e escondem o defeito.
  11  |  */
  12  | async function setRouteParams(page: Page, params: Record<string, string>) {
  13  |   await page.evaluate((next) => {
  14  |     const label = document.querySelector('[data-testid="origin-label"]');
  15  |     if (!label) throw new Error("origin-label não encontrado para localizar a instância da tela.");
  16  |     const fiberKey = Object.keys(label).find((key) => key.startsWith("__reactFiber$"));
  17  |     if (!fiberKey) throw new Error("React Fiber indisponível em origin-label.");
  18  |     let fiber = (label as unknown as Record<string, ScreenFiber | undefined>)[fiberKey];
  19  |     for (let depth = 0; fiber && depth < 200; depth += 1, fiber = fiber.return) {
  20  |       const navigation = fiber.memoizedProps?.navigation;
  21  |       if (navigation && typeof navigation.setParams === "function") {
  22  |         navigation.setParams(next);
  23  |         return;
  24  |       }
  25  |     }
  26  |     throw new Error("navigation.setParams não encontrado na árvore de fibers.");
  27  |   }, params);
  28  | }
  29  | 
  30  | function trackQrResolutions(page: Page) {
  31  |   const tokens: string[] = [];
  32  |   page.on("request", (request) => {
  33  |     const match = request.url().match(/\/api\/qr-codes\/([^/?#]+)/);
  34  |     if (match) tokens.push(decodeURIComponent(match[1]));
  35  |   });
  36  |   return tokens;
  37  | }
  38  | 
  39  | async function start(page: Page) {
  40  |   await page.goto("http://localhost:8081/?qr=MINI-ENTRADA-PRINCIPAL");
> 41  |   await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
      |                                                  ^ Error: expect(locator).toContainText(expected) failed
  42  | }
  43  | 
  44  | async function destination(page: Page, name: string) {
  45  |   if ((page.viewportSize()?.width ?? 1280) < 600) {
  46  |     await page.getByRole("button", { name: "Pesquisar destinos" }).click();
  47  |     await page.getByLabel("Buscar no Explorar").fill(name);
  48  |     const response = page.waitForResponse((res) => res.url().endsWith("/api/routes") && res.request().method() === "POST");
  49  |     await page.getByRole("button", { name: `Como chegar a ${name}`, exact: true }).click();
  50  |     const result = await response;
  51  |     expect(result.ok()).toBeTruthy();
  52  |     return { body: result.request().postDataJSON(), route: await result.json() };
  53  |   }
  54  |   await page.getByLabel("Buscar destinos", { exact: true }).fill(name);
  55  |   await page.getByRole("button", { name: `${name}, Aberto`, exact: true }).click();
  56  |   const response = page.waitForResponse((res) => res.url().endsWith("/api/routes") && res.request().method() === "POST");
  57  |   await page.getByRole("button", { name: "Traçar rota", exact: true }).click();
  58  |   const result = await response;
  59  |   expect(result.ok()).toBeTruthy();
  60  |   return { body: result.request().postDataJSON(), route: await result.json() };
  61  | }
  62  | 
  63  | const OUTRO_SHOPPING = {
  64  |   shopping: { id: 999, codigo: "OUTRO_SHOPPING", nome: "Shopping Outro", ativo: true },
  65  |   floor: { id: 9002, codigo: "OUTRO_TERREO", shopping_id: 999, nome: "Térreo Outro", nivel: 0, ativo: true },
  66  |   node: { id: 9001, codigo: "OUTRO_ENTRADA", piso_id: 9002, coord_x: 1, coord_y: 1, tipo: "entrada", nome: "Entrada do Outro Shopping", ativo: true },
  67  |   qrToken: "OUTRO-SHOPPING",
  68  | };
  69  | const DESTINATION_DISCARDED =
  70  |   "Destino de outro shopping foi descartado. Escolha um novo destino no shopping atual.";
  71  | 
  72  | /**
  73  |  * O Mini Shopping da suíte tem um único shopping. Acrescenta um segundo shopping
  74  |  * apenas às respostas deste navegador, sem alterar seeds ou dados do servidor.
  75  |  */
  76  | async function mockSecondShopping(page: Page) {
  77  |   // As distâncias não participam destes cenários e o endpoint tem cota por IP;
  78  |   // responder localmente evita consumir a cota compartilhada com as demais suítes.
  79  |   await page.route(/\/api\/routes\/distances/, (route) => route.fulfill({ json: {} }));
  80  |   await page.route("**/api/shoppings", async (route) => {
  81  |     if (route.request().method() !== "GET") return route.continue();
  82  |     const real = await (await route.fetch()).json();
  83  |     await route.fulfill({ json: [...real, OUTRO_SHOPPING.shopping] });
  84  |   });
  85  |   await page.route("**/api/shoppings/999/floors", (route) => route.fulfill({ json: [OUTRO_SHOPPING.floor] }));
  86  |   await page.route("**/api/shoppings/999/navigation-state", (route) => route.fulfill({ json: { revisao: "r999", ativo: true } }));
  87  |   await page.route("**/api/shoppings/999/scene", (route) => route.fulfill({
  88  |     json: {
  89  |       shopping_id: 999,
  90  |       scene_version: "teste",
  91  |       release: 1,
  92  |       model_url: "/static/models/mini-shopping/mini-shopping-v1.glb",
  93  |       floors: [{ piso_id: 9002, codigo: OUTRO_SHOPPING.floor.codigo, origin: [0, 0, 0], axis_x: [1, 0, 0], axis_y: [0, 0, 1] }],
  94  |       pois: [],
  95  |       anchors: [{ node_id: 9001, codigo: OUTRO_SHOPPING.node.codigo, piso_id: 9002, coord_x: 1, coord_y: 1, type: "entrada", name: OUTRO_SHOPPING.node.nome }],
  96  |     },
  97  |   }));
  98  |   await page.route("**/api/floors/9002/graph", (route) => route.fulfill({
  99  |     json: {
  100 |       piso_id: 9002,
  101 |       piso_nome: OUTRO_SHOPPING.floor.nome,
  102 |       nos: [OUTRO_SHOPPING.node],
  103 |       arestas: [],
  104 |       conexoes_entre_pisos: [],
  105 |     },
  106 |   }));
  107 |   await page.route("**/api/qr-codes/OUTRO-SHOPPING", (route) => route.fulfill({
  108 |     json: {
  109 |       qr_code: { id: 900, no_id: 9001, token: OUTRO_SHOPPING.qrToken, ativo: true },
  110 |       no: OUTRO_SHOPPING.node,
  111 |     },
  112 |   }));
  113 | }
  114 | 
  115 | test("Chegada à NATURA atualiza a origem; próxima rota parte dela e cancelar preserva a posição", async ({ page }) => {
  116 |   await start(page);
  117 |   const first = await destination(page, "NATURA");
  118 |   await page.getByRole("button", { name: "Cheguei ao destino", exact: true }).click();
  119 |   await expect(page.getByTestId("arrival-notice")).toContainText("Sua próxima rota começa aqui.");
  120 |   await expect(page.getByTestId("origin-label")).toHaveText("NATURA");
  121 |   await expect(page.getByTestId("route-panel")).toHaveCount(0);
  122 |   await page.getByRole("button", { name: "Iniciar outra navegação", exact: true }).click();
  123 |   await expect(page.getByTestId("origin-label")).toHaveText("NATURA");
  124 |   const next = await destination(page, "ANACAPRI");
  125 |   expect(next.body.origem_no_id).toBe(first.body.destino_no_id);
  126 |   expect(next.route.nos[0].id).toBe(first.body.destino_no_id);
  127 |   expect(next.route.nos.at(-1).id).toBe(next.body.destino_no_id);
  128 |   await page.getByRole("button", { name: "Cancelar rota", exact: true }).click();
  129 |   await expect(page.getByTestId("origin-label")).toHaveText("NATURA");
  130 |   await page.getByLabel("Buscar destinos", { exact: true }).fill("NATURA");
  131 |   await page.getByRole("button", { name: "NATURA, Aberto", exact: true }).click();
  132 |   await page.getByRole("button", { name: "Traçar rota", exact: true }).click();
  133 |   await expect(page.getByTestId("arrival-notice")).toBeVisible();
  134 |   await expect(page.getByTestId("route-panel")).toHaveCount(0);
  135 | });
  136 | 
  137 | test("Chegada no mezanino abre o piso e a navegação pelo Explorar usa a nova origem", async ({ page }) => {
  138 |   await page.setViewportSize({ width: 390, height: 844 });
  139 |   await start(page);
  140 |   const first = await destination(page, "BURGER KING");
  141 |   await page.getByRole("button", { name: "Mais opções" }).click();
```