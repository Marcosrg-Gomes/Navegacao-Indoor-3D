# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: business-rules.spec.ts >> Alteração espacial incompatível retira o 3D até o cadastro ser corrigido
- Location: tests\business-rules.spec.ts:5:1

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByTestId('origin-label')
Expected substring: "Entrada principal"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toContainText" getByTestId('origin-label') with timeout 5000ms
  - waiting for getByTestId('origin-label')

```

```yaml
- text: "{\"status\":\"ok\",\"versao\":\"1.0.0\"}"
```

# Test source

```ts
  1   | import { expect, test, type Page } from "@playwright/test";
  2   | 
  3   | const headers = { "X-API-Key": "audit-local-admin-key-with-32-characters", "X-Audit-Reason": "Teste das regras de negocio" };
  4   | 
  5   | test("Alteração espacial incompatível retira o 3D até o cadastro ser corrigido", async ({ page, request }) => {
  6   |   await start(page);
  7   |   await expect(page.getByTestId("scene-map")).toBeVisible();
  8   |   const nodes = await (await request.get("/api/admin/nodes", { headers })).json();
  9   |   const node = nodes.find((item: any) => item.tipo === "loja");
  10  |   try {
  11  |     expect((await request.put(`/api/admin/nodes/${node.id}`, { headers, data: { coord_x: Number(node.coord_x) + .001 } })).ok()).toBeTruthy();
  12  |     await expect(page.getByTestId("scene-fallback")).toContainText("não corresponde ao cadastro", { timeout: 12000 });
  13  |     await expect(page.getByTestId("floor-map")).toBeVisible();
  14  |     expect((await request.put(`/api/admin/nodes/${node.id}`, { headers, data: { coord_x: node.coord_x } })).ok()).toBeTruthy();
  15  |     await expect(page.getByTestId("scene-map")).toBeVisible({ timeout: 12000 });
  16  |     await expect(page.getByTestId("scene-fallback")).toHaveCount(0);
  17  |   } finally { await request.put(`/api/admin/nodes/${node.id}`, { headers, data: { coord_x: node.coord_x } }); }
  18  | });
  19  | async function start(page: Page) {
  20  |   await page.goto("http://localhost:8081/?qr=MINI-ENTRADA-PRINCIPAL");
> 21  |   await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
      |                                                  ^ Error: expect(locator).toContainText(expected) failed
  22  | }
  23  | async function natura(page: Page) {
  24  |   await page.getByLabel("Buscar destinos", { exact: true }).fill("NATURA");
  25  |   await page.getByRole("button", { name: "NATURA, Aberto", exact: true }).click();
  26  |   const response = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.request().method() === "POST");
  27  |   await page.getByRole("button", { name: "Traçar rota", exact: true }).click();
  28  |   return (await response).json();
  29  | }
  30  | async function failRouteRequests(page: Page) {
  31  |   await page.route("**/api/routes", async (route) => {
  32  |     if (route.request().method() !== "POST") return route.continue();
  33  |     await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ detail: "Falha simulada ao recalcular a rota." }) });
  34  |   });
  35  | }
  36  | 
  37  | test("Bloqueio e desbloqueio atualizam a rota automaticamente sem alterar a posição", async ({ page, request }) => {
  38  |   await start(page);
  39  |   const original = await natura(page);
  40  |   const edges = await (await request.get("/api/admin/edges", { headers })).json();
  41  |   const endpoint = original.nos.at(-1).id;
  42  |   const incident = edges.filter((edge: any) => edge.ativa && (edge.no_origem_id === endpoint || edge.no_destino_id === endpoint));
  43  |   expect(incident.length).toBeGreaterThan(0);
  44  |   try {
  45  |     for (const edge of incident) expect((await request.put(`/api/admin/edges/${edge.id}`, { headers, data: { ativa: false } })).ok()).toBeTruthy();
  46  |     await expect(page.getByTestId("route-panel")).toContainText(/Não existe|Nenhuma rota|não foi possível|Não foi possível/, { timeout: 12000 });
  47  |     await expect(page.getByRole("button", { name: "Cheguei ao destino", exact: true })).toBeDisabled();
  48  |     await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  49  |     const restored = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.ok());
  50  |     for (const edge of incident) expect((await request.put(`/api/admin/edges/${edge.id}`, { headers, data: { ativa: true } })).ok()).toBeTruthy();
  51  |     expect((await (await restored).json()).nos).toEqual(original.nos);
  52  |     await expect(page.getByRole("button", { name: "Cheguei ao destino", exact: true })).toBeEnabled();
  53  |   } finally {
  54  |     for (const edge of incident) await request.put(`/api/admin/edges/${edge.id}`, { headers, data: { ativa: true } });
  55  |   }
  56  | });
  57  | 
  58  | test("Chegada verifica a revisão mesmo antes da próxima atualização automática", async ({ page, request }) => {
  59  |   await start(page); await natura(page);
  60  |   // Retém as respostas de navigation-state até o clique ser despachado, para que o
  61  |   // polling não desabilite "Cheguei ao destino" antes da confirmação da chegada.
  62  |   let releaseChecks!: () => void;
  63  |   const checksGate = new Promise<void>((resolve) => { releaseChecks = resolve; });
  64  |   let released = false;
  65  |   const release = () => { if (!released) { released = true; releaseChecks(); } };
  66  |   await page.route("**/navigation-state", async (route) => {
  67  |     await checksGate;
  68  |     await route.continue();
  69  |   });
  70  |   const pois = await (await request.get("/api/pois")).json();
  71  |   const poi = pois.find((item: any) => item.nome === "NATURA");
  72  |   try {
  73  |     expect((await request.put(`/api/admin/stores/${poi.id}`, { headers, data: { status_operacional: "fechado" } })).ok()).toBeTruthy();
  74  |     const arrival = page.getByRole("button", { name: "Cheguei ao destino", exact: true });
  75  |     await expect(arrival).toBeEnabled();
  76  |     await arrival.click();
  77  |     release();
  78  |     await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  79  |     await expect(page.getByTestId("arrival-notice")).toHaveCount(0);
  80  |     await expect(page.getByTestId("route-panel")).toContainText(/mapa mudou|confirme|indisponível|fechado/i);
  81  |   } finally {
  82  |     release();
  83  |     await request.put(`/api/admin/stores/${poi.id}`, { headers, data: { status_operacional: "aberto" } });
  84  |   }
  85  | });
  86  | 
  87  | test("Explorar filtra funcionamento e consulta percursos acessíveis na API", async ({ page, request }) => {
  88  |   const pois = await (await request.get("/api/pois")).json();
  89  |   const poi = pois.find((item: any) => item.nome === "NATURA");
  90  |   try {
  91  |     expect((await request.put(`/api/admin/stores/${poi.id}`, { headers, data: { status_operacional: "fechado" } })).ok()).toBeTruthy();
  92  |     await start(page);
  93  |     await page.getByRole("tab", { name: /Explorar/ }).click();
  94  |     await page.getByRole("button", { name: "Filtrar e ordenar", exact: true }).click();
  95  |     await page.getByRole("button", { name: "Fechados", exact: true }).click();
  96  |     const distance = page.waitForResponse((r) => r.url().includes("/routes/distances?") && r.url().includes("acessivel=true"));
  97  |     await page.getByRole("button", { name: "Com rota sem escadas", exact: true }).click();
  98  |     expect((await distance).ok()).toBeTruthy();
  99  |     await page.getByRole("button", { name: "Mostrar resultados", exact: true }).click();
  100 |     await expect(page.getByRole("button", { name: "NATURA, ver detalhes", exact: true })).toBeVisible();
  101 |     await expect(page.getByRole("button", { name: "ADIDAS, ver detalhes", exact: true })).toHaveCount(0);
  102 |     await page.getByRole("button", { name: "Como chegar a NATURA", exact: true }).click();
  103 |     await expect(page.getByText(/Este local está fechado/)).toBeVisible();
  104 |     const confirmed = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.ok());
  105 |     await page.getByRole("button", { name: "Ver trajeto mesmo assim", exact: true }).click();
  106 |     expect((await confirmed).request().postDataJSON()).toMatchObject({ confirmar_indisponivel: true, acessivel: true });
  107 |   } finally { await request.put(`/api/admin/stores/${poi.id}`, { headers, data: { status_operacional: "aberto" } }); }
  108 | });
  109 | 
  110 | test("Histórico mostra motivo, restaura uma edição e apresenta falhas agregadas", async ({ page, request }) => {
  111 |   const created = await (await request.post("/api/admin/categories", { headers, data: { nome: "Categoria temporária de auditoria" } })).json();
  112 |   try {
  113 |     expect((await request.put(`/api/admin/categories/${created.id}`, { headers, data: { nome: "Categoria alterada" } })).ok()).toBeTruthy();
  114 |     await request.get("/api/qr-codes/CODIGO-INEXISTENTE-PARA-TESTE");
  115 |     await page.goto("/admin/auditoria");
  116 |     await page.getByLabel("API key", { exact: true }).fill("audit-local-admin-key-with-32-characters");
  117 |     await page.getByRole("button", { name: "Entrar", exact: true }).click();
  118 |     await expect(page.getByRole("heading", { name: "Histórico e falhas", exact: true })).toBeVisible();
  119 |     await expect(page.getByText(/qr · indisponivel:/)).toBeVisible();
  120 |     const entry = page.locator("article").filter({ hasText: `categorias ${created.id} · editar` }).first();
  121 |     await expect(entry).toContainText("Teste das regras de negocio");
```