# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visitor-experience.spec.ts >> Favoritos e recentes persistem; a posição precisa ser confirmada novamente
- Location: tests\visitor-experience.spec.ts:31:1

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
    - locator resolved to <div dir="auto" data-testid="origin-label" class="css-146c3p1 r-1iewvzr r-1b6yd1w r-b88u0q r-waer2z r-1bymd8e">Ponto de partida não definido</div>
    10 × unexpected value "Ponto de partida não definido"
       - locator resolved to <div dir="auto" data-testid="origin-label" class="css-146c3p1 r-1iewvzr r-ubezar r-1kfrs79">Ponto de partida não definido</div>
    - unexpected value "Ponto de partida não definido"

```

```yaml
- text: Ponto de partida não definido
```

# Test source

```ts
  1   | import { expect, test, type Page } from "@playwright/test";
  2   | 
  3   | async function start(page: Page) {
  4   |   await page.goto("http://localhost:8081/?qr=MINI-ENTRADA-PRINCIPAL");
> 5   |   await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
      |                                                  ^ Error: expect(locator).toContainText(expected) failed
  6   | }
  7   | async function destination(page: Page, name = "NATURA") {
  8   |   await page.getByLabel("Buscar destinos", { exact: true }).fill(name);
  9   |   await page.getByRole("button", { name: name + ", Aberto", exact: true }).click();
  10  |   const response = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.request().method() === "POST");
  11  |   await page.getByRole("button", { name: "Traçar rota", exact: true }).click();
  12  |   return (await response).json();
  13  | }
  14  | 
  15  | test("Ajuda lembra dispensa e pode ser reaberta pelo teclado", async ({ page }) => {
  16  |   await start(page);
  17  |   await expect(page.getByText("Primeira vez por aqui?", { exact: true })).toBeVisible();
  18  |   await page.getByRole("button", { name: "Entendi", exact: true }).click();
  19  |   await page.reload();
  20  |   await expect(page.getByTestId("origin-label")).toHaveText("Ponto de partida não definido");
  21  |   await expect(page.getByText("Primeira vez por aqui?", { exact: true })).toHaveCount(0);
  22  |   const help = page.getByRole("button", { name: "Ajuda", exact: true });
  23  |   await help.focus();
  24  |   await page.keyboard.press("Enter");
  25  |   await expect(page.getByRole("heading", { name: "Ajuda para se localizar", exact: true })).toBeVisible();
  26  |   await page.getByRole("button", { name: "Fechar ajuda", exact: true }).focus();
  27  |   await page.keyboard.press("Enter");
  28  |   await expect(help).toBeVisible();
  29  | });
  30  | 
  31  | test("Favoritos e recentes persistem; a posição precisa ser confirmada novamente", async ({ page }) => {
  32  |   await start(page);
  33  |   await page.getByRole("tab", { name: /Explorar/ }).click();
  34  |   await page.getByLabel("Buscar no Explorar").fill("natura");
  35  |   const save = page.getByRole("button", { name: "Salvar NATURA nos favoritos", exact: true });
  36  |   await expect(save).toBeEnabled();
  37  |   await save.focus();
  38  |   await page.keyboard.press("Enter");
  39  |   await expect(page.getByRole("button", { name: "Remover NATURA dos favoritos", exact: true })).toBeVisible();
  40  |   await page.getByRole("button", { name: "Como chegar a NATURA", exact: true }).click();
  41  |   await expect(page.getByTestId("route-panel")).toContainText("NATURA");
  42  |   await expect(page).toHaveURL(/\/$/);
  43  |   await page.goto("/explore");
  44  |   await page.getByRole("button", { name: "Filtrar e ordenar", exact: true }).click();
  45  |   await page.getByRole("button", { name: "Favoritos", exact: true }).click();
  46  |   await page.getByRole("button", { name: "Mostrar resultados", exact: true }).click();
  47  |   await expect(page.getByRole("button", { name: "NATURA, ver detalhes", exact: true })).toBeVisible();
  48  |   await expect(page.getByRole("button", { name: "ADIDAS, ver detalhes", exact: true })).toHaveCount(0);
  49  |   await page.getByRole("button", { name: "Filtrar e ordenar", exact: true }).click();
  50  |   await page.getByRole("button", { name: "Recentes", exact: true }).click();
  51  |   await page.getByRole("button", { name: "Mostrar resultados", exact: true }).click();
  52  |   await expect(page.getByRole("button", { name: "NATURA, ver detalhes", exact: true })).toBeVisible();
  53  |   await expect(page.getByRole("button", { name: "Ver minha localização no mapa" })).toContainText("Defina sua posição");
  54  | });
  55  | 
  56  | test("Explorar busca e ordena pelo percurso da API", async ({ page, request }) => {
  57  |   const origin = await (await request.get("/api/qr-codes/MINI-ENTRADA-PRINCIPAL")).json();
  58  |   const distances = await (await request.get("/api/routes/distances?origem_no_id=" + origin.no.id)).json();
  59  |   // Isola a página da cota compartilhada (20 req/60 s por IP) de
  60  |   // /api/routes/distances: responde localmente com os dados reais já obtidos,
  61  |   // evitando "Distância indisponível" quando outros specs já consumiram o
  62  |   // limite no mesmo worker do CI. Mantém a validação real (≈ 31 m).
  63  |   await page.route(/\/api\/routes\/distances/, (route) =>
  64  |     route.fulfill({ json: distances })
  65  |   );
  66  |   await start(page);
  67  |   const pois = await (await request.get("/api/pois")).json();
  68  |   const natura = pois.find((p: any) => p.nome === "NATURA");
  69  |   await page.getByRole("tab", { name: /Explorar/ }).click();
  70  |   await page.getByLabel("Buscar no Explorar").fill("natura");
  71  |   await expect(page.getByTestId("explore-poi-" + natura.id)).toContainText("≈ " + Math.round(distances[natura.no_id]) + " m de percurso");
  72  |   await page.getByLabel("Buscar no Explorar").fill("");
  73  |   await page.getByRole("button", { name: "Filtrar e ordenar", exact: true }).click();
  74  |   await page.getByRole("button", { name: "Lojas", exact: true }).click();
  75  |   await page.getByRole("button", { name: "Mais próximos", exact: true }).click();
  76  |   await page.getByRole("button", { name: "Mostrar resultados", exact: true }).click();
  77  |   const malls = await (await request.get("/api/shoppings")).json();
  78  |   const floors = await (await request.get("/api/shoppings/" + malls[0].id + "/floors")).json();
  79  |   const graphs = await Promise.all(floors.map(async (floor: any) => (await request.get("/api/floors/" + floor.id + "/graph")).json()));
  80  |   const shopNodes = new Set(graphs.flatMap((graph: any) => graph.nos.filter((node: any) => node.tipo === "loja").map((node: any) => node.id)));
  81  |   const expected = pois.filter((p: any) => shopNodes.has(p.no_id) && distances[p.no_id] !== undefined).sort((a: any, b: any) => distances[a.no_id] - distances[b.no_id] || a.nome.localeCompare(b.nome, "pt-BR"));
  82  |   await expect(page.locator('[data-testid^="explore-poi-"]').first()).toHaveAttribute("data-testid", "explore-poi-" + expected[0].id);
  83  | });
  84  | 
  85  | test("Serviços sem loja recebem rotas e permitem voltar à entrada", async ({ page, request }) => {
  86  |   await start(page);
  87  |   const origin = await (await request.get("/api/qr-codes/MINI-ENTRADA-PRINCIPAL")).json();
  88  |   const floors = await (await request.get("/api/shoppings")).json();
  89  |   const floorList = await (await request.get("/api/shoppings/" + floors[0].id + "/floors")).json();
  90  |   const graph = await (await request.get("/api/floors/" + floorList[0].id + "/graph")).json();
  91  |   const lift = graph.nos.find((n: any) => n.tipo === "elevador");
  92  |   await page.getByRole("tab", { name: /Explorar/ }).click();
  93  |   await page.getByRole("button", { name: "Filtrar e ordenar", exact: true }).click();
  94  |   await page.getByRole("button", { name: "Elevadores", exact: true }).click();
  95  |   await page.getByRole("button", { name: "Mostrar resultados", exact: true }).click();
  96  |   const response = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.request().method() === "POST");
  97  |   await page.getByTestId("explore-node-" + lift.id).getByRole("button", { name: "Como chegar a " + lift.nome, exact: true }).click();
  98  |   expect((await response).request().postDataJSON().destino_no_id).toBe(lift.id);
  99  |   await page.getByRole("button", { name: "Cheguei ao destino", exact: true }).click();
  100 |   await expect(page.getByTestId("origin-label")).toHaveText(lift.nome);
  101 |   await page.getByRole("tab", { name: /Explorar/ }).click();
  102 |   const back = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.request().method() === "POST");
  103 |   await page.getByRole("button", { name: "Voltar para a entrada", exact: true }).click();
  104 |   expect((await back).request().postDataJSON()).toMatchObject({ origem_no_id: lift.id, destino_no_id: origin.no.id });
  105 | });
```