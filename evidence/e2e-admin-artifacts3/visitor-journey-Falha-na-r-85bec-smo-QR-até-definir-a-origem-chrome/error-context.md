# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: visitor-journey.spec.ts >> Falha na resolução permite repetir o mesmo QR até definir a origem
- Location: tests\visitor-journey.spec.ts:269:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('falha simulada', { exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('falha simulada', { exact: true }) with timeout 5000ms
  - waiting for getByText('falha simulada', { exact: true })

```

```yaml
- text: "{\"status\":\"ok\",\"versao\":\"1.0.0\"}"
```

# Test source

```ts
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
  229 | 
  230 | test("Cancelar durante a confirmação impede que uma resposta atrasada altere a localização", async ({ page }) => {
  231 |   await start(page);
  232 |   const { route } = await destination(page, "BURGER KING");
  233 |   const graphUrl = `**/api/floors/${route.nos.at(-1).piso_id}/graph`;
  234 |   let release!: () => void;
  235 |   const hold = new Promise<void>((resolve) => { release = resolve; });
  236 |   await page.route(graphUrl, async (request) => { await hold; await request.continue(); });
  237 |   await page.getByRole("button", { name: "Cheguei ao destino", exact: true }).click();
  238 |   await expect(page.getByRole("button", { name: "Atualizando posição…", exact: true })).toBeDisabled();
  239 |   await page.getByRole("button", { name: "Cancelar rota", exact: true }).click();
  240 |   const response = page.waitForResponse((res) => res.url().endsWith(`/api/floors/${route.nos.at(-1).piso_id}/graph`));
  241 |   release();
  242 |   await response;
  243 |   await page.unroute(graphUrl);
  244 |   const next = await destination(page, "NATURA");
  245 |   expect(next.body.origem_no_id).toBe(route.nos[0].id);
  246 |   await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  247 |   await expect(page.getByTestId("arrival-notice")).toHaveCount(0);
  248 | });
  249 | 
  250 | test("Reabrir o mesmo QR com a tela montada resolve a origem novamente", async ({ page }) => {
  251 |   const resolutions = trackQrResolutions(page);
  252 |   await start(page);
  253 |   expect(resolutions).toEqual(["MINI-ENTRADA-PRINCIPAL"]);
  254 |   const search = page.getByLabel("Buscar destinos", { exact: true });
  255 |   await search.fill("MARCADOR");
  256 |   await expect(search).toHaveValue("MARCADOR");
  257 | 
  258 |   await setRouteParams(page, { qr: "MINI-ENTRADA-PRINCIPAL", token: "" });
  259 | 
  260 |   await expect.poll(() => resolutions.length).toBe(2);
  261 |   await expect(page.getByTestId("origin-label")).toHaveText("Entrada principal");
  262 |   expect(resolutions).toEqual(["MINI-ENTRADA-PRINCIPAL", "MINI-ENTRADA-PRINCIPAL"]);
  263 |   // A tela não foi recriada: o texto da busca sobreviveu à reabertura do link.
  264 |   await expect(search).toHaveValue("MARCADOR");
  265 |   // O efeito conclui limpando o parâmetro; com o defeito a URL ficaria presa no token.
  266 |   await expect.poll(() => new URL(page.url()).searchParams.get("qr")).toBe("");
  267 | });
  268 | 
  269 | test("Falha na resolução permite repetir o mesmo QR até definir a origem", async ({ page }) => {
  270 |   let attempts = 0;
  271 |   await page.route("**/api/qr-codes/**", async (route) => {
  272 |     attempts += 1;
  273 |     if (attempts === 1) {
  274 |       await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ detail: "falha simulada" }) });
  275 |       return;
  276 |     }
  277 |     await route.continue();
  278 |   });
  279 | 
  280 |   await page.goto("http://localhost:8081/?qr=MINI-ENTRADA-PRINCIPAL");
> 281 |   await expect(page.getByText("falha simulada", { exact: true })).toBeVisible();
      |                                                                   ^ Error: expect(locator).toBeVisible() failed
  282 |   expect(attempts).toBe(1);
  283 | 
  284 |   await setRouteParams(page, { qr: "MINI-ENTRADA-PRINCIPAL", token: "" });
  285 | 
  286 |   await expect(page.getByTestId("origin-label")).toHaveText("Entrada principal");
  287 |   expect(attempts).toBe(2);
  288 |   await page.unroute("**/api/qr-codes/**");
  289 | });
  290 | 
  291 | test("Reabrir o QR anterior restaura a origem trocada manualmente", async ({ page }) => {
  292 |   const resolutions = trackQrResolutions(page);
  293 |   await start(page);
  294 | 
  295 |   await page.getByRole("button", { name: "Alterar origem", exact: true }).click();
  296 |   await page.getByLabel("Lugar que estou vendo").fill("ADIDAS");
  297 |   await page.getByRole("button", { name: "Estou vendo ADIDAS", exact: true }).click();
  298 |   await page.getByRole("button", { name: "Confirmar minha posição em ADIDAS", exact: true }).click();
  299 |   await expect(page.getByTestId("origin-label")).toHaveText("ADIDAS");
  300 |   expect(resolutions).toHaveLength(1);
  301 | 
  302 |   await setRouteParams(page, { qr: "MINI-ENTRADA-PRINCIPAL", token: "" });
  303 | 
  304 |   await expect(page.getByTestId("origin-label")).toHaveText("Entrada principal");
  305 |   expect(resolutions).toEqual(["MINI-ENTRADA-PRINCIPAL", "MINI-ENTRADA-PRINCIPAL"]);
  306 | });
  307 | 
  308 | test("Repetir o mesmo QR durante a requisição mantém uma única resolução", async ({ page }) => {
  309 |   const resolutions = trackQrResolutions(page);
  310 |   let release!: () => void;
  311 |   const hold = new Promise<void>((resolve) => { release = resolve; });
  312 |   await page.route("**/api/qr-codes/**", async (route) => { await hold; await route.continue(); });
  313 | 
  314 |   await page.goto("http://localhost:8081/?qr=MINI-ENTRADA-PRINCIPAL");
  315 |   await expect.poll(() => resolutions.length).toBe(1);
  316 |   await expect(page.getByTestId("origin-label")).not.toHaveText("Entrada principal");
  317 | 
  318 |   await setRouteParams(page, { qr: "", token: "" });
  319 |   await setRouteParams(page, { qr: "MINI-ENTRADA-PRINCIPAL", token: "" });
  320 |   await page.waitForTimeout(500);
  321 |   expect(resolutions).toEqual(["MINI-ENTRADA-PRINCIPAL"]);
  322 | 
  323 |   release();
  324 |   await expect(page.getByTestId("origin-label")).toHaveText("Entrada principal");
  325 |   expect(resolutions).toEqual(["MINI-ENTRADA-PRINCIPAL"]);
  326 |   await page.unroute("**/api/qr-codes/**");
  327 | });
  328 | 
  329 | test("Token diferente continua resolvendo depois de um token repetido", async ({ page, request }) => {
  330 |   const resolutions = trackQrResolutions(page);
  331 |   await start(page);
  332 |   const node = (await (await request.get("/api/qr-codes/MINI-MEZANINO-CENTRAL")).json()).no;
  333 | 
  334 |   await setRouteParams(page, { qr: "MINI-MEZANINO-CENTRAL", token: "" });
  335 | 
  336 |   await expect(page.getByTestId("origin-label")).toHaveText(node.nome);
  337 |   expect(resolutions).toEqual(["MINI-ENTRADA-PRINCIPAL", "MINI-MEZANINO-CENTRAL"]);
  338 | });
  339 | 
  340 | test("QR de outro shopping sem destino troca origem e piso sem anunciar descarte", async ({ page }) => {
  341 |   await mockSecondShopping(page);
  342 |   await start(page);
  343 |   await expect(page.getByTestId("origin-label").first()).toHaveText("Entrada principal");
  344 | 
  345 |   await setRouteParams(page, { qr: OUTRO_SHOPPING.qrToken, token: "" });
  346 | 
  347 |   await expect(page.getByTestId("origin-label").first()).toHaveText("Entrada do Outro Shopping");
  348 |   await expect(page.getByText(OUTRO_SHOPPING.shopping.nome, { exact: true }).first()).toBeVisible();
  349 |   await expect(page.getByText(OUTRO_SHOPPING.floor.nome, { exact: true }).first()).toBeVisible();
  350 |   await expect(page.getByRole("button", { name: "Shopping Outro ✓", exact: true })).toBeVisible();
  351 |   await expect(page.getByText(DESTINATION_DISCARDED, { exact: true })).toHaveCount(0);
  352 |   await expect(page.getByTestId("route-panel")).toHaveCount(0);
  353 | });
  354 | 
  355 | test("QR de outro shopping com destino de loja descarta destino e rota com um único aviso", async ({ page }) => {
  356 |   await mockSecondShopping(page);
  357 |   await start(page);
  358 |   const { route } = await destination(page, "NATURA");
  359 |   expect(route.nos.length).toBeGreaterThan(0);
  360 |   await expect(page.getByTestId("route-panel")).toContainText("NATURA");
  361 |   await expect(page.getByText("Destino: NATURA", { exact: true })).toBeVisible();
  362 | 
  363 |   await setRouteParams(page, { qr: OUTRO_SHOPPING.qrToken, token: "" });
  364 | 
  365 |   await expect(page.getByTestId("origin-label").first()).toHaveText("Entrada do Outro Shopping");
  366 |   await expect(page.getByText(DESTINATION_DISCARDED, { exact: true })).toHaveCount(1);
  367 |   await expect(page.getByTestId("route-panel")).toHaveCount(0);
  368 |   await expect(page.getByText(/^Destino: /)).toHaveCount(0);
  369 |   await expect(page.getByTestId("arrival-notice")).toHaveCount(0);
  370 | });
  371 | 
  372 | test("QR de outro shopping com destino de nó descarta a rota e avisa uma vez", async ({ page }) => {
  373 |   await mockSecondShopping(page);
  374 |   await start(page);
  375 |   await page.getByRole("tab", { name: /Explorar/ }).click();
  376 |   await page.getByLabel("Buscar no Explorar").fill("Elevador");
  377 |   await page.getByRole("button", { name: "Filtrar e ordenar", exact: true }).click();
  378 |   await page.getByRole("button", { name: "Térreo", exact: true }).click();
  379 |   await page.getByRole("button", { name: "Mostrar resultados", exact: true }).click();
  380 |   await expect(page.getByRole("button", { name: /^Como chegar a Elevador/ })).toHaveCount(1);
  381 |   const response = page.waitForResponse((res) => res.url().endsWith("/api/routes") && res.request().method() === "POST");
```