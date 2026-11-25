# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: scene.spec.ts >> Mini Shopping: elevador acessível, mudança de piso e bloqueio
- Location: tests\scene.spec.ts:33:1

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
  1   | import { test, expect } from "@playwright/test";
  2   | import { visitorQrUrl } from "./visitor-url";
  3   | 
  4   | const auth = { "X-API-Key": "audit-local-admin-key-with-32-characters", "X-Audit-Reason": "Validacao automatizada" };
  5   | 
  6   | test("Mini Shopping: QR, GLB real, loja térrea, rota idêntica em 2D/3D e chegada", async ({ page, request }, info) => {
  7   |   const errors: string[] = [];
  8   |   page.on("pageerror", (error) => errors.push(error.message));
  9   |   const model = page.waitForResponse((r) => /mini-shopping-v\d+\.glb$/.test(r.url()));
  10  |   await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"));
  11  |   await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);
  12  |   expect((await model).ok()).toBeTruthy();
  13  |   await expect(page.getByRole("button", { name: "Centralizar rota", exact: true })).toBeVisible({ timeout: 20000 });
  14  |   await page.getByLabel("Buscar destinos", { exact: true }).fill("ADIDAS");
  15  |   await page.getByRole("button", { name: "ADIDAS, Aberto" }).click();
  16  |   const response = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.request().method() === "POST");
  17  |   await page.getByRole("button", { name: "Traçar rota", exact: true }).click();
  18  |   const route = await (await response).json();
  19  |   await expect(page.getByTestId("scene-map")).toBeVisible({ timeout: 20000 });
  20  |   await expect(page.getByTestId("scene-map")).toHaveAttribute("data-destination-code", "E01");
  21  |   await expect(page.getByTestId("scene-map")).toHaveAttribute("data-route-node-ids", route.nos.map((n: { id: number }) => n.id).join(","));
  22  |   await page.getByTestId("scene-map").screenshot({ path: info.outputPath("visitor-ground-route.png") });
  23  |   await page.getByRole("button", { name: "Mapa 2D", exact: true }).click();
  24  |   await expect(page.getByTestId("floor-map")).toBeVisible();
  25  |   const visibleEdges = route.nos.slice(1).filter((node: { piso_id: number }, index: number) => node.piso_id === route.nos[index].piso_id).length;
  26  |   await expect(page.locator('svg polyline[stroke="#1f5fc9"]')).toHaveCount(visibleEdges);
  27  |   await page.getByRole("button", { name: "Cheguei ao destino", exact: true }).click();
  28  |   await expect(page.getByTestId("arrival-notice")).toBeVisible();
  29  |   expect(errors).toEqual([]);
  30  |   await info.attach("route", { body: JSON.stringify(route, null, 2), contentType: "application/json" });
  31  | });
  32  | 
  33  | test("Mini Shopping: elevador acessível, mudança de piso e bloqueio", async ({ page, request }, info) => {
  34  |   await page.setViewportSize({ width: 414, height: 896 });
> 35  |   await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"));
      |              ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:8765/?qr=MINI-ENTRADA-PRINCIPAL
  36  |   await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);
  37  |   await page.getByRole("button", { name: "Pesquisar destinos" }).click();
  38  |   // Aguarda a navegação para a tela Explorar
  39  |   await expect(page).toHaveURL(/.*\/explore.*/, { timeout: 15000 });
  40  |   // Aguarda o botão de filtros ficar visível
  41  |   await expect(page.getByRole("button", { name: /Filtros/ })).toBeVisible({ timeout: 15000 });
  42  |   await page.getByRole("button", { name: /Filtros/ }).click();
  43  |   await page.getByRole("button", { name: "Com rota sem escadas" }).click();
  44  |   await page.getByRole("button", { name: "Mostrar resultados" }).click();
  45  |   await page.getByLabel("Buscar no Explorar").fill("BURGER");
  46  |   const response = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.request().method() === "POST");
  47  |   await page.getByRole("button", { name: "Como chegar a BURGER KING" }).click();
  48  |   const route = await (await response).json();
  49  |   expect(route.sucesso).toBeTruthy();
  50  |   expect(route.nos.some((n: { tipo: string }) => n.tipo === "elevador")).toBeTruthy();
  51  |   expect(route.nos.some((n: { tipo: string }) => n.tipo.includes("escada"))).toBeFalsy();
  52  |   const floorId = route.nos.at(-1).piso_id;
  53  |   await page.getByTestId("floor-switch").click();
  54  |   await page.getByRole("button", { name: "Mezanino", exact: true }).click();
  55  |   await page.getByRole("button", { name: "Mapa 3D", exact: true }).click();
  56  |   await expect(page.getByTestId("scene-map")).toBeVisible({ timeout: 20000 });
  57  |   await expect(page.getByTestId("scene-map")).toHaveAttribute("data-floor-id", String(floorId));
  58  |   await expect(page.getByTestId("scene-map")).toHaveAttribute("data-route-node-ids", route.nos.filter((n: { piso_id: number }) => n.piso_id === floorId).map((n: { id: number }) => n.id).join(","));
  59  |   await page.getByTestId("scene-map").screenshot({ path: info.outputPath("visitor-upper-accessible.png") });
  60  |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  61  |   const edges = await (await request.get("/api/admin/edges", { headers: auth })).json();
  62  |   const lift = route.nos.filter((n: { tipo: string }) => n.tipo === "elevador");
  63  |   const edge = edges.find((e: { no_origem_id: number; no_destino_id: number }) => e.no_origem_id === lift[0].id && e.no_destino_id === lift[1].id);
  64  |   expect(edge).toBeTruthy();
  65  |   try {
  66  |     expect((await request.put(`/api/admin/edges/${edge.id}`, { headers: auth, data: { ativa: false } })).ok()).toBeTruthy();
  67  |     await page.getByRole("button", { name: "Mais opções", exact: true }).click();
  68  |     await page.getByRole("button", { name: "Recalcular rota", exact: true }).click();
  69  |     // Com "Sem escadas" ativo, a API explica que não há alternativa acessível (nunca devolve rota com escadas).
  70  |     await expect(page.getByText(/Não há rota sem escadas até este destino/).first()).toBeVisible();
  71  |   } finally {
  72  |     await request.put(`/api/admin/edges/${edge.id}`, { headers: auth, data: { ativa: true } });
  73  |   }
  74  |   await info.attach("accessible-route", { body: JSON.stringify(route, null, 2), contentType: "application/json" });
  75  | });
  76  | 
  77  | test("Falha do GLB preserva mapa 2D, destino e instruções; tentativa manual recupera", async ({ page }) => {
  78  |   await page.route("**/mini-shopping-v*.glb", (route) => route.abort());
  79  |   await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"));
  80  |   await expect(page.getByTestId("scene-fallback")).toBeVisible();
  81  |   await expect(page.getByTestId("floor-map")).toBeVisible();
  82  |   await page.getByLabel("Buscar destinos", { exact: true }).fill("ADIDAS");
  83  |   await page.getByRole("button", { name: "ADIDAS, Aberto" }).click();
  84  |   await page.getByRole("button", { name: "Traçar rota", exact: true }).click();
  85  |   await page.getByRole("button", { name: "Ver instruções", exact: true }).click();
  86  |   await expect(page.getByTestId("route-panel")).toContainText("Você chegou ao destino: ADIDAS");
  87  |   await expect(page.getByTestId("scene-fallback")).toBeVisible();
  88  |   await expect(page.getByRole("button", { name: "Tentar 3D novamente", exact: true })).toBeVisible();
  89  |   const recoveredModel = page.waitForResponse((response) => /mini-shopping-v\d+\.glb$/.test(response.url()) && response.ok());
  90  |   await page.unroute("**/mini-shopping-v*.glb");
  91  |   await page.getByRole("button", { name: "Tentar 3D novamente", exact: true }).click();
  92  |   expect((await recoveredModel).ok()).toBeTruthy();
  93  |   await expect(page.getByRole("button", { name: "Centralizar rota", exact: true })).toBeVisible({ timeout: 20000 });
  94  |   await expect(page.getByTestId("scene-map")).toHaveAttribute("data-destination-code", "E01");
  95  | });
  96  | 
  97  | test("Painel mostra inventário da cena e links dos pisos", async ({ page }) => {
  98  |   await page.goto("/admin/cena-3d");
  99  |   await expect(page.getByLabel(/Chave de acesso/)).toBeVisible({ timeout: 15000 });
  100 |   await page.getByLabel(/Chave de acesso/).fill("audit-local-admin-key-with-32-characters");
  101 |   await page.getByRole("button", { name: "Entrar no painel", exact: true }).click();
  102 |   await expect(page.getByRole("heading", { name: /Catálogo/ })).toBeVisible({ timeout: 15000 });
  103 |   await page.screenshot({ path: "../../evidence/admin-scene-validation.png", fullPage: true });
  104 | });
  105 | 
  106 | test("Botão acessível da loja visível do térreo abre o POI correto", async ({ page }) => {
  107 |   await page.setViewportSize({ width: 1280, height: 900 });
  108 |   await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"));
  109 |   await expect(page.getByRole("button", { name: "Centralizar rota", exact: true })).toBeVisible({ timeout: 20000 });
  110 |   const scene = page.getByTestId("scene-map");
  111 |   await scene.scrollIntoViewIfNeeded();
  112 |   const poiResponse = page.waitForResponse((response) => /\/api\/pois\/\d+$/.test(response.url()) && response.request().method() === "GET");
  113 |   await scene.getByRole("button", { name: "ADIDAS, ver detalhes" }).click();
  114 |   const poi = await poiResponse;
  115 |   expect(poi.ok()).toBeTruthy();
  116 |   expect((await poi.json()).codigo).toBe("E01");
  117 |   // A planta SVG também contém o texto "ADIDAS" (camada decorativa do 2D, oculta no modo 3D).
  118 |   await expect(page.getByText("ADIDAS", { exact: true }).filter({ visible: true })).toBeVisible();
  119 |   await expect(page.getByText("BURGER KING", { exact: true })).toHaveCount(0);
  120 |   await expect(page.getByRole("button", { name: "Traçar rota", exact: true })).toBeVisible();
  121 | });
  122 | 
  123 | test("Sem WebGL o visitante mantém QR e mapa 2D", async ({ page }) => {
  124 |   await page.addInitScript(() => {
  125 |     const getContext = HTMLCanvasElement.prototype.getContext;
  126 |     HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
  127 |       return type === "webgl2" ? null : getContext.apply(this, [type, ...args] as Parameters<typeof getContext>);
  128 |     } as typeof getContext;
  129 |   });
  130 |   await page.goto(visitorQrUrl("MINI-ENTRADA-PRINCIPAL"));
  131 |   await expect(page.getByTestId("origin-label")).toContainText(/entrada principal/i);
  132 |   await expect(page.getByTestId("scene-fallback")).toContainText("WebGL indisponível");
  133 |   await expect(page.getByTestId("floor-map")).toBeVisible();
  134 | });
  135 | 
```