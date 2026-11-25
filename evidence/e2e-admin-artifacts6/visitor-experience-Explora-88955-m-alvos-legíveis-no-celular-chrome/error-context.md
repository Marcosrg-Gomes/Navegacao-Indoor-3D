# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visitor-experience.spec.ts >> Explorar recupera erro de carregamento e mantém alvos legíveis no celular
- Location: tests\visitor-experience.spec.ts:145:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Como chegar a ADIDAS', exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('button', { name: 'Como chegar a ADIDAS', exact: true }) with timeout 5000ms
  - waiting for getByRole('button', { name: 'Como chegar a ADIDAS', exact: true })

```

```yaml
- text: Mini Shopping Térreo
- main "Explorar lojas e serviços":
  - heading "Encontre seu lugar." [level=1]
  - text: Lojas, alimentação e serviços do Mini Shopping
  - button "Meus lugares ↗":
    - img
    - text: Meus lugares
  - button "Ver minha localização no mapa":
    - img
    - text: Você está em Entrada principal · Térreo
    - img
  - textbox "Buscar no Explorar":
    - /placeholder: Buscar por nome ou serviço
    - text: ADIDAS
  - button "Todos"
  - button "Lojas"
  - button "Alimentação"
  - button "Banheiros"
  - button "Elevadores"
  - button "Filtrar e ordenar":
    - img
    - text: Filtros
  - text: 1 local
  - button "Por categoria"
  - button "ADIDAS, ver detalhes": E01 ADIDAS ESPORTE · Térreo Aberto · ≈ 15 m de percurso
  - button "ADIDAS, Aberto":
    - text: Ir
    - img
  - button "Salvar ADIDAS nos favoritos":
    - img
    - text: Salvar
  - button "Voltar para a entrada"
- tablist:
  - tab "Mapa":
    - img
    - text: Mapa
  - tab "Ler QR Code":
    - img
    - text: Ler QR
  - tab "Explorar" [selected]:
    - img
    - text: Explorar
```

# Test source

```ts
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
  141 |   await expect(page.getByRole("button", { name: "Cheguei ao destino", exact: true })).toBeEnabled();
  142 |   await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  143 | });
  144 | 
  145 | test("Explorar recupera erro de carregamento e mantém alvos legíveis no celular", async ({ page }) => {
  146 |   const initialRevision = page.waitForResponse((response) => response.url().endsWith("/navigation-state"));
  147 |   await page.setViewportSize({ width: 360, height: 800 });
  148 |   await start(page);
  149 |   await initialRevision;
  150 |   await page.route("**/api/pois?*", (r) => r.abort());
  151 |   await page.getByRole("tab", { name: /Explorar/ }).click();
  152 |   await expect(page.getByRole("button", { name: "Tentar novamente", exact: true })).toBeVisible();
  153 |   await page.unroute("**/api/pois?*");
  154 |   await page.getByRole("button", { name: "Tentar novamente", exact: true }).click();
  155 |   await page.getByLabel("Buscar no Explorar").fill("ADIDAS");
  156 |   const save = page.getByRole("button", { name: "Salvar ADIDAS nos favoritos", exact: true });
  157 |   await expect(save).toBeVisible();
  158 |   const box = await save.boundingBox();
  159 |   expect(box!.height).toBeGreaterThanOrEqual(44);
  160 |   expect(box!.width).toBeGreaterThanOrEqual(44);
  161 |   await page.evaluate(() => {
  162 |     document.querySelectorAll<HTMLElement>('[data-testid^="explore-poi-"] div').forEach((el) => {
  163 |       if (el.childElementCount === 0 && el.textContent?.trim()) el.style.fontSize = parseFloat(getComputedStyle(el).fontSize) * 1.6 + "px";
  164 |     });
  165 |   });
  166 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
> 167 |   await expect(page.getByRole("button", { name: "Como chegar a ADIDAS", exact: true })).toBeVisible();
      |                                                                                         ^ Error: expect(locator).toBeVisible() failed
  168 |   await page.screenshot({ path: "../../evidence/visitor-large-text-360.png", fullPage: true });
  169 | });
  170 | 
```