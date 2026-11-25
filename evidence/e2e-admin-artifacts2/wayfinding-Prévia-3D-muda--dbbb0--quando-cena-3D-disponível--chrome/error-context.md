# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: wayfinding.spec.ts >> Prévia 3D muda a câmera do trecho sem alterar a origem (apenas quando cena 3D disponível)
- Location: tests\wayfinding.spec.ts:69:1

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
  3   | test.beforeEach(async ({ page }) => {
  4   |   const errors: string[] = [];
  5   |   page.on("pageerror", (error) => errors.push(error.message));
  6   |   (page as Page & { runtimeErrors?: string[] }).runtimeErrors = errors;
  7   | });
  8   | test.afterEach(async ({ page }) => {
  9   |   expect((page as Page & { runtimeErrors?: string[] }).runtimeErrors).toEqual([]);
  10  | });
  11  | 
  12  | async function destination(page: Page, name: string) {
  13  |   await page.getByLabel("Buscar destinos", { exact: true }).fill(name);
  14  |   await page.getByRole("button", { name: name + ", Aberto", exact: true }).click();
  15  |   const response = page.waitForResponse((res) => res.url().endsWith("/api/routes") && res.request().method() === "POST");
  16  |   await page.getByRole("button", { name: "Traçar rota", exact: true }).click();
  17  |   return (await response).json();
  18  | }
  19  | test("Explorar mantém pesquisa e filtros separados do mapa no celular", async ({ page }, info) => {
  20  |   await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto("http://localhost:8081/explore");
  21  |   await expect(page.getByRole("heading", { name: "Encontre seu lugar." })).toBeVisible();
  22  |   await expect(page.getByRole("main", { name: "Explorar lojas e serviços" }).getByTestId("floor-map")).toHaveCount(0);
  23  |   await page.getByRole("button", { name: "Nomes com N", exact: true }).click();
  24  |   await expect(page.getByRole("button", { name: "NATURA, ver detalhes", exact: true })).toBeVisible();
  25  |   await expect(page.getByRole("button", { name: "ADIDAS, ver detalhes", exact: true })).toHaveCount(0);
  26  |   await page.screenshot({ path: info.outputPath("directory-desktop.png") });
  27  |   await page.setViewportSize({ width: 390, height: 844 });
  28  |   await page.getByLabel("Buscar no Explorar").fill("ADIDAS");
  29  |   await expect(page.getByRole("button", { name: "ADIDAS, ver detalhes", exact: true })).toBeVisible();
  30  |   await page.getByRole("tab", { name: "Mapa", exact: true }).click();
  31  |   await expect(page.getByTestId("floor-map")).toBeVisible();
  32  |   await page.getByRole("tab", { name: "Explorar", exact: true }).click();
  33  |   await expect(page.getByLabel("Buscar no Explorar")).toHaveValue("ADIDAS");
  34  |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  35  |   await page.screenshot({ path: info.outputPath("directory-mobile.png") });
  36  | });
  37  | 
  38  | test("Reconhecer um lugar exige confirmação e Estou perdido recalcula mantendo destino", async ({ page }, info) => {
  39  |   await page.goto("http://localhost:8081/");
  40  |   await expect(page.getByRole("heading", { level: 1 })).toContainText("Onde você");
  41  |   await page.screenshot({ path: info.outputPath("intent-home.png") });
  42  |   await page.getByRole("button", { name: "Definir ponto de partida", exact: true }).click();
  43  |   await page.getByLabel("Lugar que estou vendo").fill("NATURA");
  44  |   await page.getByRole("button", { name: "Estou vendo NATURA", exact: true }).click();
  45  |   await page.getByRole("button", { name: "Confirmar minha posição em NATURA", exact: true }).click();
  46  |   await expect(page.getByTestId("origin-label")).toHaveText("NATURA");
  47  |   const route = await destination(page, "ANACAPRI");
  48  |   expect(route.resumo.metros_corredor).toBeGreaterThan(0);
  49  |   await expect(page.getByLabel("Buscar destinos", { exact: true })).toHaveCount(0);
  50  |   await page.getByRole("button", { name: "Ver mapa do trajeto ↓", exact: true }).click();
  51  |   await expect(page.getByRole("button", { name: "↑ Voltar às instruções", exact: true })).toBeInViewport();
  52  |   await page.getByRole("button", { name: "↑ Voltar às instruções", exact: true }).click();
  53  |   await expect(page.getByTestId("current-instruction")).toBeInViewport();
  54  |   await page.getByRole("button", { name: "Estou perdido", exact: true }).click();
  55  |   await page.getByLabel("Lugar que estou vendo").fill("ADIDAS");
  56  |   await page.getByRole("button", { name: "Estou vendo ADIDAS", exact: true }).click();
  57  |   const recalculated = page.waitForResponse((res) => res.url().endsWith("/api/routes") && res.request().method() === "POST");
  58  |   await page.getByRole("button", { name: "Confirmar minha posição em ADIDAS", exact: true }).click();
  59  |   const updated = await (await recalculated).json();
  60  |   expect(updated.nos[0].nome).toBe("ADIDAS"); expect(updated.nos.at(-1).nome).toBe("ANACAPRI");
  61  |   await expect(page.getByTestId("origin-label")).toContainText("ADIDAS");
  62  |   await page.getByRole("button", { name: "Cheguei ao destino", exact: true }).click();
  63  |   await expect(page.getByTestId("arrival-notice")).toContainText("ANACAPRI");
  64  |   await expect(page.getByRole("button", { name: "Corrigir minha posição", exact: true })).toBeVisible();
  65  |   await page.getByTestId("arrival-notice").scrollIntoViewIfNeeded();
  66  |   await page.screenshot({ path: info.outputPath("arrival-actions.png") });
  67  | });
  68  | 
  69  | test("Prévia 3D muda a câmera do trecho sem alterar a origem (apenas quando cena 3D disponível)", async ({ page }, info) => {
  70  |   await page.goto("http://localhost:8081/?qr=MINI-ENTRADA-PRINCIPAL");
> 71  |   await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
      |                                                  ^ Error: expect(locator).toContainText(expected) failed
  72  |   await destination(page, "NATURA");
  73  |   // O botão "Ver o que encontrarei" só aparece quando a cena 3D está disponível.
  74  |   // No Expo dev mode, o Three.js pode não carregar a cena 3D, então verificamos
  75  |   // que o botão existe e pode ser acionado, mas os atributos da cena 3D podem
  76  |   // não estar presentes se o WebGL/Three.js falhar.
  77  |   const previewButton = page.getByRole("button", { name: "Ver o que encontrarei ↗", exact: true });
  78  |   if (await previewButton.isVisible()) {
  79  |     await previewButton.click();
  80  |     // Verifica que a tentativa de abrir a prévia 3D não quebra a aplicação
  81  |     // e a origem permanece inalterada.
  82  |     await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  83  |     // Se o scene-map estiver disponível, verifica seus atributos.
  84  |     const scene = page.getByTestId("scene-map");
  85  |     if (await scene.isVisible()) {
  86  |       await expect(scene).toHaveAttribute("data-preview", "walk");
  87  |     }
  88  |   } else {
  89  |     // Cena 3D não disponível no modo dev - comportamento esperado de fallback
  90  |     await expect(page.getByTestId("floor-map")).toBeVisible();
  91  |   }
  92  | });
  93  | 
  94  | test("Passeio entre favoritos usa cada chegada como origem da próxima parada", async ({ page }) => {
  95  |   await page.goto("http://localhost:8081/?qr=MINI-ENTRADA-PRINCIPAL");
  96  |   await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  97  |   await page.getByRole("tab", { name: "Explorar", exact: true }).click();
  98  |   for (const name of ["NATURA", "ANACAPRI"]) {
  99  |     await page.getByLabel("Buscar no Explorar").fill(name);
  100 |     await page.getByRole("button", { name: "Salvar " + name + " nos favoritos", exact: true }).click();
  101 |   }
  102 |   await page.getByRole("button", { name: "Meus lugares ↗", exact: true }).click();
  103 |   await page.getByRole("switch", { name: "Avisos de favoritos próximos", exact: true }).click();
  104 |   await page.getByRole("button", { name: "Incluir NATURA no passeio", exact: true }).click();
  105 |   await page.getByRole("button", { name: "Incluir ANACAPRI no passeio", exact: true }).click();
  106 |   await page.getByRole("button", { name: "Visitar 2 lugares nesta ordem", exact: true }).click();
  107 |   await expect(page.getByTestId("route-panel")).toContainText("NATURA");
  108 |   await page.getByRole("button", { name: "Cheguei ao destino", exact: true }).click();
  109 |   await expect(page.getByTestId("arrival-notice")).toBeVisible();
  110 |   const response = page.waitForResponse((res) => res.url().endsWith("/api/routes") && res.request().method() === "POST");
  111 |   await page.getByRole("button", { name: "Próxima parada: ANACAPRI", exact: true }).click();
  112 |   const route = await (await response).json();
  113 |   expect(route.nos[0].nome).toBe("NATURA"); expect(route.nos.at(-1).nome).toBe("ANACAPRI");
  114 | });
  115 | 
  116 | test("Local indisponível oferece alternativas abertas da mesma categoria", async ({ page, request }) => {
  117 |   const stores = await (await request.get("/api/pois")).json();
  118 |   const natura = stores.find((store: any) => store.nome === "NATURA");
  119 |   await page.route("**/api/pois?*", async (route) => {
  120 |     const response = await route.fetch();
  121 |     await route.fulfill({ response, json: (await response.json()).map((store: any) => store.id === natura.id ? { ...store, status_operacional: "manutencao", aberto_agora: false, horario_resumo: "Em manutenção" } : store) });
  122 |   });
  123 |   await page.goto("http://localhost:8081/explore");
  124 |   await page.getByLabel("Buscar no Explorar").fill("NATURA");
  125 |   await page.getByRole("button", { name: "NATURA, ver detalhes", exact: true }).click();
  126 |   await page.getByRole("button", { name: "Ver alternativas abertas em " + natura.categoria_nome, exact: true }).click();
  127 |   await expect(page.getByRole("button", { name: "Remover filtro Abertos", exact: true })).toBeVisible();
  128 |   await expect(page.getByRole("button", { name: "Remover filtro " + natura.categoria_nome, exact: true })).toBeVisible();
  129 |   await expect(page.getByLabel("Buscar no Explorar")).toHaveValue("");
  130 |   await expect(page.getByRole("button", { name: "NATURA, ver detalhes", exact: true })).toHaveCount(0);
  131 | });
  132 | 
  133 | test("Detalhes do elevador mostram o outro piso servido pela conexão ativa", async ({ page, request }) => {
  134 |   const malls = await (await request.get("/api/shoppings")).json();
  135 |   const floors = await (await request.get(`/api/shoppings/${malls[0].id}/floors`)).json();
  136 |   const graph = await (await request.get(`/api/floors/${floors[0].id}/graph`)).json();
  137 |   const lift = graph.nos.find((node: any) => node.tipo === "elevador");
  138 |   expect(graph.conexoes_entre_pisos[lift.id].length).toBeGreaterThan(0);
  139 |   await page.goto("http://localhost:8081/explore");
  140 |   await page.getByLabel("Buscar no Explorar").fill(lift.nome);
  141 |   await page.getByTestId("explore-node-" + lift.id).getByRole("button", { name: lift.nome + ", ver detalhes", exact: true }).click();
  142 |   await expect(page.getByRole("dialog")).toContainText("Conexões cadastradas: Mezanino");
  143 | });
  144 | 
```