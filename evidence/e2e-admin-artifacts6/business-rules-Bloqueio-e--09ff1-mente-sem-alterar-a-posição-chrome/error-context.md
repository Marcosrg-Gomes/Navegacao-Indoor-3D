# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: business-rules.spec.ts >> Bloqueio e desbloqueio atualizam a rota automaticamente sem alterar a posição
- Location: tests\business-rules.spec.ts:37:1

# Error details

```
Error: apiRequestContext.get: connect ECONNREFUSED 127.0.0.1:8765
Call log:
  - → GET http://127.0.0.1:8765/api/admin/edges
    - user-agent: Playwright/1.63.0 (x64; windows 10.0) node/24.12
    - accept: */*
    - accept-encoding: gzip,deflate,br
    - X-API-Key: audit-local-admin-key-with-32-characters
    - X-Audit-Reason: Teste das regras de negocio

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
        - generic [ref=e45]: "Última posição: Entrada principal"
        - generic [ref=e46]: Térreo · QR Code
        - generic [ref=e48]:
          - generic [ref=e49]:
            - generic [ref=e50]:
              - generic [ref=e51]: A CAMINHO DE
              - heading "Entrada principal → NATURA" [level=2] [ref=e52]
            - generic [ref=e53]: 30.6 m
          - generic [ref=e54]:
            - generic [ref=e55]: ↑
            - generic [ref=e56]: AGORA · PASSO 1 DE 8
            - generic [ref=e57]: Siga em frente por 2.6 metros
            - generic [ref=e58]: "Referência neste trecho: Entrada principal"
            - generic [ref=e59]: 2.6 m neste trecho
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
                - generic [ref=e96]: 1.0×
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
                  - generic [ref=e119]: NATURA
                - button "Entrada principal, ver detalhes" [ref=e120] [cursor=pointer]:
                  - generic [ref=e121]: Você está aqui
                - button "Escada rolante subida — térreo":
                  - generic: ↕ Escada
                - button "ADIDAS, ver detalhes" [ref=e122] [cursor=pointer]:
                  - generic [ref=e123]: E01
                - button "C&A, ver detalhes" [ref=e124] [cursor=pointer]:
                  - generic [ref=e125]: D01
            - generic [ref=e126]: Arraste para explorar · roda ou pinça para aproximar
            - generic "Legenda do mapa" [ref=e127]:
              - generic [ref=e128]: Sua posição
              - generic [ref=e132]: Origem
              - generic [ref=e136]: Destino
              - generic [ref=e140]: Rota
              - generic [ref=e144]: Acesso entre pisos
        - 'button "Destino: NATURA Aberto · Ver informações" [ref=e149] [cursor=pointer]':
          - generic [ref=e150]: "Destino: NATURA"
          - generic [ref=e151]: Aberto · Ver informações
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
  21  |   await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
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
> 40  |   const edges = await (await request.get("/api/admin/edges", { headers })).json();
      |                                      ^ Error: apiRequestContext.get: connect ECONNREFUSED 127.0.0.1:8765
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
  122 |     page.on("dialog", (dialog) => dialog.accept("Restaurar nome para validar historico"));
  123 |     await entry.getByRole("button", { name: /Restaurar estado anterior/ }).click();
  124 |     await expect(page.getByRole("status")).toContainText("restaurado");
  125 |     const categories = await (await request.get("/api/admin/categories", { headers })).json();
  126 |     expect(categories.find((item: any) => item.id === created.id).nome).toBe("Categoria temporária de auditoria");
  127 |   } finally { await request.delete(`/api/admin/categories/${created.id}`, { headers }); }
  128 | });
  129 | 
  130 | test("Aba Mapa mostra falha de recálculo após troca de origem por QR", async ({ page }) => {
  131 |   await page.setViewportSize({ width: 900, height: 900 });
  132 |   await start(page);
  133 |   await natura(page);
  134 |   await page.getByRole("tab", { name: "Mapa", exact: true }).click();
  135 |   await expect(page.getByRole("heading", { name: "Mapa do trajeto" })).toBeVisible();
  136 |   await expect(page.getByRole("button", { name: /Destino: NATURA/ })).toBeVisible();
  137 | 
  138 |   await page.getByRole("button", { name: "Escanear QR", exact: true }).click();
  139 |   await expect(page.getByLabel("Código ou link do QR")).toBeVisible();
  140 |   await failRouteRequests(page);
```