# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: business-rules.spec.ts >> Aba Mapa sinaliza rota desatualizada após falha de recálculo
- Location: tests\business-rules.spec.ts:163:1

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: page.waitForResponse: Test timeout of 45000ms exceeded.
```

# Page snapshot

```yaml
- generic [ref=e9]:
  - generic [ref=e11]:
    - generic [ref=e13]:
      - generic [ref=e15]: Mini Shopping
      - generic [ref=e16]: Térreo
    - main "Mapa e instruções de navegação" [ref=e18]:
      - generic [ref=e20]:
        - heading "Seu caminho" [level=1] [ref=e21]
        - generic [ref=e22]: "Última posição: Entrada principal"
        - generic [ref=e23]: Térreo · QR Code
        - generic [ref=e25]:
          - generic [ref=e26]:
            - generic [ref=e27]:
              - generic [ref=e28]: A CAMINHO DE
              - heading "Entrada principal → NATURA" [level=2] [ref=e29]
            - generic [ref=e30]: 30.6 m
          - generic [ref=e31]:
            - generic [ref=e32]: ↑
            - generic [ref=e33]: AGORA · PASSO 1 DE 8
            - generic [ref=e34]: Siga em frente por 2.6 metros
            - generic [ref=e35]: "Referência neste trecho: Entrada principal"
            - generic [ref=e36]: 2.6 m neste trecho
          - button "Cheguei ao destino" [ref=e37] [cursor=pointer]
          - button "Ver o que encontrarei ↗" [ref=e39] [cursor=pointer]
          - button "Ver próximos passos" [ref=e41] [cursor=pointer]
        - generic [ref=e43]:
          - generic [ref=e44]:
            - button "↑ Voltar às instruções" [ref=e45] [cursor=pointer]
            - button "Corrigir localização" [ref=e47] [cursor=pointer]
          - generic [ref=e50]:
            - button "Térreo" [ref=e51] [cursor=pointer]
            - button "Mezanino" [ref=e53] [cursor=pointer]
          - generic [ref=e55]: "Mapa: Térreo"
          - generic [ref=e57]:
            - generic "Modo do mapa" [ref=e58]:
              - button "Automático" [ref=e59] [cursor=pointer]
              - button "Mapa 3D" [ref=e61] [cursor=pointer]
              - button "Mapa 2D" [ref=e63] [cursor=pointer]
            - generic [ref=e66]:
              - generic [ref=e67]:
                - generic [ref=e68]:
                  - button "Diminuir zoom" [ref=e69] [cursor=pointer]
                  - generic [ref=e71]: 1.0×
                  - button "Aumentar zoom" [ref=e72] [cursor=pointer]
                - button "Ver piso inteiro" [ref=e75] [cursor=pointer]:
                  - generic [ref=e78]: Piso inteiro
                - button "Minha posição" [ref=e79] [cursor=pointer]
                - button "Centralizar rota" [ref=e83] [cursor=pointer]
                - button "Mais controles" [ref=e87] [cursor=pointer]
              - generic "Mapa 3D do shopping" [ref=e89]:
                - 'generic "Explorar mapa 3D: arraste para mover, use a roda para aproximar" [ref=e92]'
                - generic:
                  - button "NATURA, ver detalhes" [ref=e93] [cursor=pointer]:
                    - generic [ref=e94]: NATURA
                  - button "Entrada principal, ver detalhes" [ref=e95] [cursor=pointer]:
                    - generic [ref=e96]: Você está aqui
                  - button "Elevador — térreo":
                    - generic: ↕ Elevador
                  - button "ADIDAS, ver detalhes" [ref=e97] [cursor=pointer]:
                    - generic [ref=e98]: E01
                  - button "AREZZO, ver detalhes" [ref=e99] [cursor=pointer]:
                    - generic [ref=e100]: E02
                  - button "C&A, ver detalhes" [ref=e101] [cursor=pointer]:
                    - generic [ref=e102]: D01
                  - button "ANACAPRI, ver detalhes" [ref=e103] [cursor=pointer]:
                    - generic [ref=e104]: D02
                  - button "CASA DAS ALIANÇAS, ver detalhes" [ref=e105] [cursor=pointer]:
                    - generic [ref=e106]: D04
              - generic [ref=e107]: Arraste para explorar · roda ou pinça para aproximar
              - generic "Legenda do mapa" [ref=e108]:
                - generic [ref=e109]: Sua posição
                - generic [ref=e113]: Origem
                - generic [ref=e117]: Destino
                - generic [ref=e121]: Rota
                - generic [ref=e125]: Acesso entre pisos
          - 'button "Destino: NATURA Aberto · Ver informações" [ref=e130] [cursor=pointer]':
            - generic [ref=e131]: "Destino: NATURA"
            - generic [ref=e132]: Aberto · Ver informações
  - tablist [ref=e133]:
    - tab "Início" [selected] [ref=e134] [cursor=pointer]
    - tab "Mapa" [ref=e139] [cursor=pointer]
    - tab "Ler QR Code" [ref=e144] [cursor=pointer]:
      - generic [ref=e148]: Ler QR
    - tab "Explorar" [ref=e149] [cursor=pointer]
```

# Test source

```ts
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
  141 |   const failed = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.request().method() === "POST");
  142 |   await page.getByLabel("Código ou link do QR").fill("MINI-TERREO-CENTRAL");
  143 |   await page.getByRole("button", { name: "Usar código", exact: true }).click();
  144 |   expect((await failed).status()).toBe(503);
  145 | 
  146 |   await expect(page).toHaveURL(/\/map$/);
  147 |   const warning = page.getByTestId("route-warning");
  148 |   await expect(warning).toBeVisible();
  149 |   await expect(warning).toContainText("Rota não disponível");
  150 |   await expect(warning).toContainText("Falha simulada ao recalcular a rota.");
  151 |   await expect(page.getByRole("heading", { name: "Mapa do shopping" })).toBeVisible();
  152 |   await expect(page.getByRole("button", { name: /Destino: NATURA/ })).toHaveCount(0);
  153 |   await expect(page.getByText("Rota pronta para começar", { exact: true })).toHaveCount(0);
  154 | 
  155 |   await page.unroute("**/api/routes");
  156 |   const retried = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.request().method() === "POST");
  157 |   await warning.getByRole("button", { name: "Recalcular rota", exact: true }).click();
  158 |   expect((await retried).ok()).toBeTruthy();
  159 |   await expect(page.getByTestId("route-warning")).toHaveCount(0);
  160 |   await expect(page.getByRole("button", { name: /Destino: NATURA/ })).toBeVisible();
  161 | });
  162 | 
  163 | test("Aba Mapa sinaliza rota desatualizada após falha de recálculo", async ({ page }) => {
  164 |   await page.setViewportSize({ width: 900, height: 900 });
  165 |   await start(page);
  166 |   await natura(page);
  167 |   await failRouteRequests(page);
> 168 |   const failed = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.request().method() === "POST");
      |                       ^ Error: page.waitForResponse: Test timeout of 45000ms exceeded.
  169 |   await page.getByRole("button", { name: "Recalcular", exact: true }).click();
  170 |   expect((await failed).status()).toBe(503);
  171 |   await expect(page.getByTestId("route-panel")).toContainText("Falha simulada ao recalcular a rota.");
  172 |   await expect(page.getByTestId("route-panel")).toContainText("Este é o trajeto anterior.");
  173 | 
  174 |   await page.getByRole("tab", { name: "Mapa", exact: true }).click();
  175 |   const warning = page.getByTestId("route-warning");
  176 |   await expect(warning).toBeVisible();
  177 |   await expect(warning).toContainText("Rota desatualizada");
  178 |   await expect(warning).toContainText("Falha simulada ao recalcular a rota.");
  179 |   await expect(warning).toContainText(/último cálculo/i);
  180 |   await expect(page.getByRole("heading", { name: "Mapa do trajeto" })).toBeVisible();
  181 |   await expect(page.getByRole("button", { name: /Destino: NATURA/ })).toBeVisible();
  182 | });
  183 | 
```