# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visitor-journey.spec.ts >> Chegada à NATURA atualiza a origem; próxima rota parte dela e cancelar preserva a posição
- Location: tests\visitor-journey.spec.ts:115:1

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: locator.click: Test timeout of 45000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Cancelar rota', exact: true })

```

# Page snapshot

```yaml
- generic [ref=e9]:
  - tablist [ref=e10]:
    - generic [ref=e13]:
      - generic [ref=e14]: Mini Shopping
      - generic [ref=e15]: Navegação indoor
    - generic [ref=e16]:
      - tab "Início" [selected] [ref=e17] [cursor=pointer]
      - tab "Mapa" [ref=e21] [cursor=pointer]
      - tab "Ler QR Code" [ref=e25] [cursor=pointer]:
        - generic [ref=e28]: Ler QR
      - tab "Explorar" [ref=e29] [cursor=pointer]
    - generic [ref=e33]: Térreo
  - main "Mapa e instruções de navegação" [ref=e40]:
    - generic [ref=e41]:
      - generic [ref=e43]:
        - heading "Seu caminho" [level=1] [ref=e44]
        - generic [ref=e45]: "Última posição: NATURA"
        - generic [ref=e46]: Térreo · Chegada confirmada
        - generic [ref=e48]:
          - generic [ref=e49]:
            - generic [ref=e50]:
              - generic [ref=e51]: A CAMINHO DE
              - heading "NATURA → ANACAPRI" [level=2] [ref=e52]
            - generic [ref=e53]: 16.1 m
          - generic [ref=e54]:
            - generic [ref=e55]: ↑
            - generic [ref=e56]: AGORA · PASSO 1 DE 7
            - generic [ref=e57]: Siga em frente por 0.8 metros
            - generic [ref=e58]: "Referência neste trecho: NATURA"
            - generic [ref=e59]: 0.8 m neste trecho
          - button "Cheguei ao destino" [ref=e60] [cursor=pointer]
          - button "Ver o que encontrarei ↗" [ref=e62] [cursor=pointer]
          - button "Ver próximos passos" [ref=e64] [cursor=pointer]
      - generic [ref=e68]:
        - generic [ref=e69]:
          - button "↑ Voltar às instruções" [ref=e70] [cursor=pointer]
          - button "Corrigir localização" [ref=e72] [cursor=pointer]
        - generic [ref=e75]:
          - button "Térreo" [ref=e76] [cursor=pointer]
          - button "Mezanino" [ref=e78] [cursor=pointer]
        - generic [ref=e80]: "Mapa: Térreo"
        - generic [ref=e82]:
          - generic "Modo do mapa" [ref=e83]:
            - button "Automático" [ref=e84] [cursor=pointer]
            - button "Mapa 3D" [ref=e86] [cursor=pointer]
            - button "Mapa 2D" [ref=e88] [cursor=pointer]
          - generic [ref=e91]:
            - generic [ref=e92]:
              - generic [ref=e93]:
                - button "Diminuir zoom" [ref=e94] [cursor=pointer]
                - generic [ref=e96]: 3.0×
                - button "Aumentar zoom" [ref=e97] [cursor=pointer]
              - button "Ver piso inteiro" [ref=e100] [cursor=pointer]:
                - generic [ref=e103]: Piso inteiro
              - button "Minha posição" [ref=e104] [cursor=pointer]
              - button "Centralizar rota" [ref=e108] [cursor=pointer]
              - button "Mais controles" [ref=e112] [cursor=pointer]
            - generic "Mapa 3D do shopping" [ref=e114]:
              - 'generic "Explorar mapa 3D: arraste para mover, use a roda para aproximar" [ref=e117]'
              - generic:
                - button "NATURA, ver detalhes" [ref=e118] [cursor=pointer]:
                  - generic [ref=e119]: Você está aqui
                - button "ANACAPRI, ver detalhes" [ref=e120] [cursor=pointer]:
                  - generic [ref=e121]: ANACAPRI
                - button "Elevador — térreo":
                  - generic: ↕ Elevador
                - button "Escada rolante subida — térreo":
                  - generic: ↕ Escada
                - button "CALVIN KLEIN, ver detalhes" [ref=e122] [cursor=pointer]:
                  - generic [ref=e123]: CALVIN KLEIN
                - button "CENTAURO, ver detalhes" [ref=e124] [cursor=pointer]:
                  - generic [ref=e125]: CENTAURO
            - generic [ref=e126]: Arraste para explorar · roda ou pinça para aproximar
            - generic "Legenda do mapa" [ref=e127]:
              - generic [ref=e128]: Sua posição
              - generic [ref=e132]: Origem
              - generic [ref=e136]: Destino
              - generic [ref=e140]: Rota
              - generic [ref=e144]: Acesso entre pisos
        - 'button "Destino: ANACAPRI Aberto · Ver informações" [ref=e149] [cursor=pointer]':
          - generic [ref=e150]: "Destino: ANACAPRI"
          - generic [ref=e151]: Aberto · Ver informações
```

# Test source

```ts
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
  41  |   await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
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
> 128 |   await page.getByRole("button", { name: "Cancelar rota", exact: true }).click();
      |                                                                          ^ Error: locator.click: Test timeout of 45000ms exceeded.
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
  142 |   await page.getByRole("button", { name: "Cheguei ao destino", exact: true }).click();
  143 |   await expect(page.getByTestId("origin-label")).toHaveText("BURGER KING");
  144 |   await expect(page.getByTestId("location-update")).toContainText("Mezanino");
  145 |   await page.getByRole("tab", { name: /Explorar/ }).click();
  146 |   await expect(page.getByRole("button", { name: "Ver minha localização no mapa" })).toContainText("BURGER KING");
  147 |   await page.getByRole("button", { name: "Filtrar e ordenar", exact: true }).click();
  148 |   await page.getByRole("button", { name: "Mezanino", exact: true }).click();
  149 |   await page.getByRole("button", { name: "Mostrar resultados", exact: true }).click();
  150 |   await expect(page.getByRole("button", { name: "Ver BURGER KING no mapa", exact: true })).toBeVisible();
  151 |   await expect(page.getByRole("button", { name: "ADIDAS, ver detalhes", exact: true })).toHaveCount(0);
  152 |   await page.getByRole("button", { name: "Filtrar e ordenar", exact: true }).click();
  153 |   await page.getByRole("button", { name: "Térreo", exact: true }).click();
  154 |   await page.getByRole("button", { name: "Mostrar resultados", exact: true }).click();
  155 |   await page.getByLabel("Buscar no Explorar").fill("ADIDAS");
  156 |   const response = page.waitForResponse((res) => res.url().endsWith("/api/routes") && res.request().method() === "POST");
  157 |   await page.getByRole("button", { name: "Como chegar a ADIDAS", exact: true }).click();
  158 |   const next = await response;
  159 |   expect(next.request().postDataJSON().origem_no_id).toBe(first.body.destino_no_id);
  160 |   await expect(page.getByTestId("route-panel")).toContainText("ADIDAS");
  161 |   await expect(page.getByTestId("origin-label")).toHaveText("BURGER KING");
  162 | });
  163 | 
  164 | test("Instruções têm uma única lista e a opção acessível explica o trajeto", async ({ page }) => {
  165 |   await start(page);
  166 |   await page.getByRole("button", { name: "O que é acessível?", exact: true }).click();
  167 |   await expect(page.getByText(/Evita escadas e escadas rolantes/)).toBeVisible();
  168 |   await page.getByRole("switch", { name: "Rota acessível" }).click();
  169 |   const { route, body } = await destination(page, "BURGER KING");
  170 |   expect(body.acessivel).toBe(true);
  171 |   expect(route.nos.some((node: { tipo: string }) => node.tipo === "elevador")).toBe(true);
  172 |   expect(route.nos.some((node: { tipo: string }) => node.tipo.includes("escada"))).toBe(false);
  173 |   await expect(page.getByTestId("route-instructions")).toHaveCount(0);
  174 |   await expect(page.getByTestId("current-instruction")).toContainText(route.instrucoes[1]);
  175 |   await page.getByRole("button", { name: "Ver instruções", exact: true }).click();
  176 |   await expect(page.getByTestId("route-instructions")).toHaveCount(1);
  177 |   await expect(page.getByText(route.instrucoes.at(-1), { exact: true })).toHaveCount(1);
  178 |   await page.getByRole("button", { name: "Ocultar instruções", exact: true }).click();
  179 |   await expect(page.getByTestId("route-instructions")).toHaveCount(0);
  180 |   await page.getByRole("button", { name: "Ver instruções", exact: true }).click();
  181 |   await expect(page.getByTestId("route-instructions")).toHaveCount(1);
  182 |   await expect(page.getByText(route.instrucoes.at(-1), { exact: true })).toHaveCount(1);
  183 | });
  184 | 
  185 | test("Explorar combina filtros, abre detalhes e mantém layout legível no celular e desktop", async ({ page, request }) => {
  186 |   await start(page);
  187 |   const pois: { nome: string; categoria_nome: string }[] = await (await request.get("/api/pois")).json();
  188 |   const category = pois.find((poi) => poi.nome === "ADIDAS")!.categoria_nome;
  189 |   await page.getByRole("tab", { name: /Explorar/ }).click();
  190 |   for (const width of [360, 1280]) {
  191 |     await page.setViewportSize({ width, height: 900 });
  192 |     await page.getByRole("button", { name: "Filtrar e ordenar", exact: true }).click();
  193 |     await page.getByRole("button", { name: "Térreo", exact: true }).click();
  194 |     await page.getByRole("button", { name: category, exact: true }).click();
  195 |     await page.getByRole("button", { name: "Mostrar resultados", exact: true }).click();
  196 |     await expect(page.getByRole("button", { name: "ADIDAS, ver detalhes", exact: true })).toBeVisible();
  197 |     await expect(page.getByRole("button", { name: "BURGER KING, ver detalhes", exact: true })).toHaveCount(0);
  198 |     await page.getByRole("button", { name: "ADIDAS, ver detalhes", exact: true }).click();
  199 |     await expect(page.getByRole("button", { name: "Traçar rota", exact: true })).toBeVisible();
  200 |     await page.getByRole("button", { name: "Fechar detalhes", exact: true }).click();
  201 |     expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  202 |     const tabs = width < 600 ? [["Mapa", "Mapa"], ["Ler QR Code", "Ler QR"], ["Explorar", "Explorar"]] : [["Início", "Início"], ["Mapa", "Mapa"], ["Ler QR Code", "Ler QR"], ["Explorar", "Explorar"]];
  203 |     for (const [name, label] of tabs) {
  204 |       await expect(page.getByRole("tab", { name, exact: true }).getByText(label, { exact: true })).toBeInViewport({ ratio: 1 });
  205 |     }
  206 |     await page.getByRole("button", { name: "Filtrar e ordenar", exact: true }).click();
  207 |     await page.getByRole("button", { name: "Todas", exact: true }).click();
  208 |     await page.getByRole("button", { name: "Todos os pisos", exact: true }).click();
  209 |     await page.getByRole("button", { name: "Mostrar resultados", exact: true }).click();
  210 |     await expect(page.getByText("Filtros e ordenação", { exact: true })).toHaveCount(0);
  211 |     await page.screenshot({ path: `../../evidence/visitor-explore-${width}.png`, fullPage: true });
  212 |   }
  213 | });
  214 | 
  215 | test("Falha ao buscar piso da chegada mantém a origem e permite confirmar novamente", async ({ page }) => {
  216 |   await start(page);
  217 |   const { route } = await destination(page, "BURGER KING");
  218 |   const graphUrl = `**/api/floors/${route.nos.at(-1).piso_id}/graph`;
  219 |   await page.route(graphUrl, (request) => request.abort());
  220 |   await page.getByRole("button", { name: "Cheguei ao destino", exact: true }).click();
  221 |   await expect(page.getByText(/Não foi possível conectar ao servidor/)).toBeVisible();
  222 |   await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  223 |   await expect(page.getByTestId("arrival-notice")).toHaveCount(0);
  224 |   await page.unroute(graphUrl);
  225 |   await page.getByRole("button", { name: "Cheguei ao destino", exact: true }).click();
  226 |   await expect(page.getByTestId("origin-label")).toHaveText("BURGER KING");
  227 |   await expect(page.getByTestId("arrival-notice")).toBeVisible();
  228 | });
```