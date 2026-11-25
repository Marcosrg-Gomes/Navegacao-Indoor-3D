# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visitor-experience.spec.ts >> Favoritos e recentes persistem; a posição precisa ser confirmada novamente
- Location: tests\visitor-experience.spec.ts:31:1

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: locator.click: Test timeout of 45000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Como chegar a NATURA', exact: true })

```

# Page snapshot

```yaml
- generic [ref=e9]:
  - tablist [ref=e10]:
    - generic [ref=e13]:
      - generic [ref=e14]: Mini Shopping
      - generic [ref=e15]: Navegação indoor
    - generic [ref=e16]:
      - tab "Início" [ref=e17] [cursor=pointer]
      - tab "Mapa" [ref=e21] [cursor=pointer]
      - tab "Ler QR Code" [ref=e25] [cursor=pointer]:
        - generic [ref=e28]: Ler QR
      - tab "Explorar" [selected] [ref=e29] [cursor=pointer]
    - generic [ref=e33]: Térreo
  - generic [ref=e37]:
    - generic:
      - generic [aria-hidden]:
        - generic:
          - main:
            - generic:
              - generic:
                - generic:
                  - heading [level=1]: Mapa do shopping
                  - button:
                    - generic: ← Buscar outro destino
                  - generic:
                    - generic:
                      - generic:
                        - generic:
                          - textbox:
                            - /placeholder: Buscar loja ou serviço
                    - button
                  - generic:
                    - generic: Primeira vez por aqui?
                    - generic: Defina sua posição e escolha um destino. Abra a ajuda para conhecer os controles do mapa.
                    - generic:
                      - button:
                        - generic: Como usar o mapa
                      - button:
                        - generic: Entendi
                  - generic:
                    - generic:
                      - generic: Sua localização
                      - generic: Entrada principal
                      - generic: Térreo · QR Code às 21:01
                  - generic:
                    - button:
                      - generic: Alterar origem
                    - button:
                      - generic: Escanear QR
                  - generic:
                    - switch:
                      - generic: Rota sem escadas
                    - button:
                      - generic: O que é acessível?
                  - button:
                    - generic: Mais opções de navegação
              - generic:
                - generic:
                  - generic:
                    - generic:
                      - generic:
                        - button:
                          - generic: Térreo
                        - button:
                          - generic: Mezanino
                    - generic: "Mapa: Térreo"
                    - generic:
                      - generic:
                        - button:
                          - generic: Automático
                        - button:
                          - generic: Mapa 3D
                        - button:
                          - generic: Mapa 2D
                      - generic:
                        - generic:
                          - generic:
                            - generic:
                              - button
                              - generic: 1.0×
                              - button
                            - button:
                              - generic: Piso inteiro
                            - button:
                              - generic: Minha posição
                            - button:
                              - generic: Centralizar rota
                            - button
                          - generic:
                            - generic:
                              - button [ref=e41] [cursor=pointer]:
                                - generic [ref=e42]: Você está aqui
                              - button:
                                - generic: ↕ Escada
                              - button [ref=e43] [cursor=pointer]:
                                - generic [ref=e44]: E01
                              - button [ref=e45] [cursor=pointer]:
                                - generic [ref=e46]: D01
                          - generic: Arraste para explorar · roda ou pinça para aproximar
                          - generic:
                            - generic: Sua posição
                            - generic: Origem
                            - generic: Destino
                            - generic: Rota
                            - generic: Acesso entre pisos
    - main "Explorar lojas e serviços" [ref=e49]:
      - generic [ref=e50]:
        - generic [ref=e51]:
          - heading "Encontre seu lugar." [level=1] [ref=e52]
          - generic [ref=e53]: Lojas, alimentação e serviços do Mini Shopping
        - button "Meus lugares ↗" [ref=e54] [cursor=pointer]:
          - generic [ref=e57]: Meus lugares
      - generic [ref=e60]:
        - button "Ver minha localização no mapa" [ref=e61] [cursor=pointer]:
          - generic [ref=e65]: Você está em Entrada principal · Térreo
        - textbox "Buscar no Explorar" [ref=e70]:
          - /placeholder: Buscar por nome ou serviço
          - text: natura
        - generic "Tipos de lugares" [ref=e71]:
          - generic [ref=e72]:
            - button "Todos" [ref=e73] [cursor=pointer]
            - button "Lojas" [ref=e75] [cursor=pointer]
            - button "Alimentação" [ref=e77] [cursor=pointer]
            - button "Banheiros" [ref=e79] [cursor=pointer]
            - button "Elevadores" [ref=e81] [cursor=pointer]
        - button "Filtrar e ordenar" [ref=e84] [cursor=pointer]:
          - generic [ref=e87]: Filtros
        - generic [ref=e88]:
          - generic [ref=e89]: 1 local
          - button "Por categoria" [ref=e90] [cursor=pointer]
        - generic [ref=e93]:
          - button "NATURA, ver detalhes" [ref=e94] [cursor=pointer]:
            - generic [ref=e95]: E04
            - generic [ref=e97]:
              - generic [ref=e98]: NATURA
              - generic [ref=e99]: BELEZA · Térreo
              - generic [ref=e100]: Aberto · ≈ 31 m de percurso
          - generic [ref=e101]:
            - button "NATURA, Aberto" [ref=e102] [cursor=pointer]:
              - generic [ref=e103]: Ir
            - button "Remover NATURA dos favoritos" [active] [ref=e106] [cursor=pointer]:
              - generic [ref=e109]: Salvo
        - button "Voltar para a entrada" [ref=e110] [cursor=pointer]
```

# Test source

```ts
  1   | import { expect, test, type Page } from "@playwright/test";
  2   | 
  3   | async function start(page: Page) {
  4   |   await page.goto("http://localhost:8081/?qr=MINI-ENTRADA-PRINCIPAL");
  5   |   await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
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
> 40  |   await page.getByRole("button", { name: "Como chegar a NATURA", exact: true }).click();
      |                                                                                 ^ Error: locator.click: Test timeout of 45000ms exceeded.
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
  106 | 
  107 | test("Avançar instruções e visualizar outro piso não altera a posição", async ({ page }) => {
  108 |   await start(page);
  109 |   await page.getByRole("switch", { name: "Rota acessível" }).click();
  110 |   const route = await destination(page, "BURGER KING");
  111 |   const steps = route.etapas.filter((s: any) => s.tipo !== "inicio");
  112 |   const transition = steps.findIndex((s: any) => s.tipo === "troca_piso");
  113 |   expect(transition).toBeGreaterThanOrEqual(0);
  114 |   for (let i = 0; i < transition; i++) await page.getByRole("button", { name: "Próximo passo", exact: true }).click();
  115 |   await expect(page.getByTestId("current-instruction")).toContainText(steps[transition].texto);
  116 |   await page.getByRole("button", { name: "Ver trecho no Mezanino", exact: true }).click();
  117 |   await expect(page.getByTestId("scene-map")).toHaveAttribute("data-floor-id", String(steps[transition].piso_destino_id));
  118 |   await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  119 |   await expect(page.getByTestId("location-update")).toContainText("QR");
  120 |   await page.getByRole("button", { name: "Cheguei ao destino", exact: true }).click();
  121 |   await expect(page.getByTestId("location-update")).toContainText("Chegada");
  122 |   await expect(page.getByTestId("location-update")).toContainText("Mezanino");
  123 | });
  124 | 
  125 | test("Recálculo mantém mapa, sinaliza falha e recupera sem perder a origem", async ({ page }) => {
  126 |   await start(page);
  127 |   const route = await destination(page);
  128 |   const ids = route.nos.map((n: any) => n.id).join(",");
  129 |   let release!: () => void;
  130 |   const hold = new Promise<void>((resolve) => { release = resolve; });
  131 |   await page.route("**/api/routes", async (r) => { await hold; await r.abort(); });
  132 |   await page.getByRole("button", { name: "Recalcular", exact: true }).click();
  133 |   await expect(page.getByText("Recalculando trajeto…", { exact: true })).toBeVisible();
  134 |   await expect(page.getByTestId("scene-map")).toHaveAttribute("data-route-node-ids", ids);
  135 |   await expect(page.getByRole("button", { name: "Cheguei ao destino", exact: true })).toBeDisabled();
  136 |   release();
  137 |   await expect(page.getByText("Este é o trajeto anterior. Recalcule antes de continuar.", { exact: true })).toBeVisible();
  138 |   await expect(page.getByRole("button", { name: "Cheguei ao destino", exact: true })).toBeDisabled();
  139 |   await page.unroute("**/api/routes");
  140 |   await page.getByRole("button", { name: "Recalcular", exact: true }).click();
```