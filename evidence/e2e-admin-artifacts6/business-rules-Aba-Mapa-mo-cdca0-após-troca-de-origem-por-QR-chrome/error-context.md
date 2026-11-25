# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: business-rules.spec.ts >> Aba Mapa mostra falha de recálculo após troca de origem por QR
- Location: tests\business-rules.spec.ts:130:1

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: locator.click: Test timeout of 45000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Escanear QR', exact: true })

```

# Page snapshot

```yaml
- generic [ref=e9]:
  - generic [ref=e10]:
    - generic:
      - generic [aria-hidden]:
        - generic [ref=e11]:
          - generic [ref=e13]: Mini Shopping
          - generic [ref=e14]: Térreo
        - generic:
          - main:
            - generic:
              - generic:
                - heading [level=1]: Seu caminho
                - generic: "Última posição: Entrada principal"
                - generic: Térreo · QR Code
                - generic:
                  - generic:
                    - generic:
                      - generic:
                        - generic: A CAMINHO DE
                        - heading [level=2]: Entrada principal → NATURA
                      - generic: 30.6 m
                    - generic:
                      - generic: ↑
                      - generic: AGORA · PASSO 1 DE 8
                      - generic: Siga em frente por 2.6 metros
                      - generic: "Referência neste trecho: Entrada principal"
                      - generic: 2.6 m neste trecho
                    - button:
                      - generic: Cheguei ao destino
                    - button:
                      - generic: Ver o que encontrarei ↗
                    - button:
                      - generic: Ver próximos passos
                - generic:
                  - generic:
                    - button:
                      - generic: ↑ Voltar às instruções
                    - button:
                      - generic: Corrigir localização
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
                            - button [ref=e18] [cursor=pointer]:
                              - generic [ref=e19]: NATURA
                            - button [ref=e20] [cursor=pointer]:
                              - generic [ref=e21]: Você está aqui
                            - button:
                              - generic: ↕ Elevador
                            - button [ref=e22] [cursor=pointer]:
                              - generic [ref=e23]: E01
                            - button [ref=e24] [cursor=pointer]:
                              - generic [ref=e25]: E02
                            - button [ref=e26] [cursor=pointer]:
                              - generic [ref=e27]: D01
                            - button [ref=e28] [cursor=pointer]:
                              - generic [ref=e29]: D02
                            - button [ref=e30] [cursor=pointer]:
                              - generic [ref=e31]: D04
                        - generic: Arraste para explorar · roda ou pinça para aproximar
                        - generic:
                          - generic: Sua posição
                          - generic: Origem
                          - generic: Destino
                          - generic: Rota
                          - generic: Acesso entre pisos
                  - button:
                    - generic: "Destino: NATURA"
                    - generic: Aberto · Ver informações
    - generic [ref=e32]:
      - generic [ref=e34]:
        - generic [ref=e36]: Mini Shopping
        - generic [ref=e37]: Térreo
      - main "Mapa do shopping" [ref=e39]:
        - generic [ref=e41]:
          - generic [ref=e42]:
            - generic [ref=e43]:
              - generic [ref=e44]: PLANTA DO SHOPPING
              - heading "Mapa do trajeto" [level=1] [ref=e45]
            - button "Ajuda do mapa" [ref=e46] [cursor=pointer]:
              - generic [ref=e49]: Ajuda
          - generic [ref=e50]:
            - generic [ref=e53]:
              - generic [ref=e54]: SUA POSIÇÃO CONFIRMADA
              - generic [ref=e55]: Entrada principal
            - button "Mostrar minha posição" [ref=e56] [cursor=pointer]:
              - generic [ref=e57]: Me localizar
          - 'button "Destino: NATURA Ver instruções →" [ref=e58] [cursor=pointer]':
            - generic [ref=e59]: "Destino: NATURA"
            - generic [ref=e60]: Ver instruções →
          - generic [ref=e61]:
            - generic [ref=e62]: PISOS DO SHOPPING
            - generic "Pisos do shopping" [ref=e64]:
              - generic [ref=e65]:
                - button "Ver Térreo" [pressed] [ref=e66] [cursor=pointer]:
                  - generic [ref=e67]: Térreo
                - button "Ver Mezanino" [ref=e68] [cursor=pointer]:
                  - generic [ref=e69]: Mezanino
          - generic [ref=e70]: Mapa
          - generic [ref=e71]: Térreo
          - generic [ref=e72]:
            - generic "Modo do mapa" [ref=e73]:
              - button "Automático" [ref=e74] [cursor=pointer]
              - button "Mapa 3D" [ref=e76] [cursor=pointer]
              - button "Mapa 2D" [ref=e78] [cursor=pointer]
            - generic [ref=e81]:
              - generic [ref=e82]:
                - generic [ref=e83]:
                  - button "Diminuir zoom" [ref=e84] [cursor=pointer]
                  - generic [ref=e86]: 1.0×
                  - button "Aumentar zoom" [ref=e87] [cursor=pointer]
                - button "Ver piso inteiro" [ref=e90] [cursor=pointer]:
                  - generic [ref=e93]: Piso inteiro
                - button "Minha posição" [ref=e94] [cursor=pointer]
                - button "Centralizar rota" [ref=e98] [cursor=pointer]
                - button "Mais controles" [ref=e102] [cursor=pointer]
              - generic "Mapa 3D do shopping" [ref=e104]:
                - 'generic "Explorar mapa 3D: arraste para mover, use a roda para aproximar" [ref=e107]'
                - generic:
                  - button "NATURA, ver detalhes" [ref=e108] [cursor=pointer]:
                    - generic [ref=e109]: NATURA
                  - button "Entrada principal, ver detalhes" [ref=e110] [cursor=pointer]:
                    - generic [ref=e111]: Você está aqui
                  - button "ADIDAS, ver detalhes" [ref=e112] [cursor=pointer]:
                    - generic [ref=e113]: E01
                  - button "C&A, ver detalhes" [ref=e114] [cursor=pointer]:
                    - generic [ref=e115]: D01
                  - button "ANACAPRI, ver detalhes" [ref=e116] [cursor=pointer]:
                    - generic [ref=e117]: D02
                  - button "CASA DAS ALIANÇAS, ver detalhes" [ref=e118] [cursor=pointer]:
                    - generic [ref=e119]: D04
              - generic [ref=e120]: Arraste para explorar · roda ou pinça para aproximar
              - generic "Legenda do mapa" [ref=e121]:
                - generic [ref=e122]: Sua posição
                - generic [ref=e126]: Origem
                - generic [ref=e130]: Destino
                - generic [ref=e134]: Rota
                - generic [ref=e138]: Acesso entre pisos
          - generic [ref=e143]:
            - button "Escanear QR Code" [ref=e144] [cursor=pointer]:
              - generic [ref=e147]: Escanear QR
            - button "Explorar lugares e serviços" [ref=e148] [cursor=pointer]:
              - generic [ref=e149]: Explorar lugares
          - generic [ref=e150]: Arraste a planta para explorar. Use dois dedos para aproximar.
  - tablist [ref=e151]:
    - tab "Início" [ref=e152] [cursor=pointer]
    - tab "Mapa" [active] [selected] [ref=e157] [cursor=pointer]
    - tab "Ler QR Code" [ref=e162] [cursor=pointer]:
      - generic [ref=e166]: Ler QR
    - tab "Explorar" [ref=e167] [cursor=pointer]
```

# Test source

```ts
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
> 138 |   await page.getByRole("button", { name: "Escanear QR", exact: true }).click();
      |                                                                        ^ Error: locator.click: Test timeout of 45000ms exceeded.
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
  168 |   const failed = page.waitForResponse((r) => r.url().endsWith("/api/routes") && r.request().method() === "POST");
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