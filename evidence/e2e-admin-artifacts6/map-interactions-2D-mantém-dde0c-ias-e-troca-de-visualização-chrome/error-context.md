# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: map-interactions.spec.ts >> 2D mantém arrastes sucessivos em 1×, alteração de preferências e troca de visualização
- Location: tests\map-interactions.spec.ts:28:1

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: locator.click: Test timeout of 45000ms exceeded.
Call log:
  - waiting for getByRole('switch', { name: 'Rota acessível' })

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
        - heading "Mapa do shopping" [level=1] [ref=e44]
        - button "← Buscar outro destino" [ref=e45] [cursor=pointer]
        - generic [ref=e47]:
          - textbox "Buscar destinos" [ref=e54]:
            - /placeholder: Buscar loja ou serviço
          - button "Ajuda" [ref=e55] [cursor=pointer]
        - generic [ref=e58]:
          - generic [ref=e59]: Primeira vez por aqui?
          - generic [ref=e60]: Defina sua posição e escolha um destino. Abra a ajuda para conhecer os controles do mapa.
          - generic [ref=e61]:
            - button "Como usar o mapa" [ref=e62] [cursor=pointer]
            - button "Entendi" [ref=e64] [cursor=pointer]
        - generic [ref=e69]:
          - generic [ref=e70]: Sua localização
          - generic [ref=e71]: Entrada principal
          - generic [ref=e72]: Térreo · QR Code às 20:58
        - generic [ref=e73]:
          - button "Alterar origem" [ref=e74] [cursor=pointer]
          - button "Escanear QR" [ref=e76] [cursor=pointer]
        - generic [ref=e78]:
          - switch "Rota sem escadas" [ref=e79] [cursor=pointer]
          - button "O que é acessível?" [ref=e83] [cursor=pointer]
        - button "Mais opções de navegação" [ref=e85] [cursor=pointer]
      - generic [ref=e89]:
        - generic [ref=e91]:
          - button "Térreo" [ref=e92] [cursor=pointer]
          - button "Mezanino" [ref=e94] [cursor=pointer]
        - generic [ref=e96]: "Mapa: Térreo"
        - generic [ref=e98]:
          - generic "Modo do mapa" [ref=e99]:
            - button "Automático" [ref=e100] [cursor=pointer]
            - button "Mapa 3D" [ref=e102] [cursor=pointer]
            - button "Mapa 2D" [ref=e104] [cursor=pointer]
          - generic [ref=e107]:
            - generic [ref=e108]:
              - generic [ref=e109]:
                - button "Diminuir zoom" [ref=e110] [cursor=pointer]
                - generic [ref=e112]: 1.0×
                - button "Aumentar zoom" [ref=e113] [cursor=pointer]
              - button "Ver piso inteiro" [ref=e116] [cursor=pointer]:
                - generic [ref=e119]: Piso inteiro
              - button "Minha posição" [ref=e120] [cursor=pointer]
            - generic [ref=e124]:
              - 'generic "Explorar mapa 2D: arraste para mover, use a roda ou os botões para aproximar. A bússola restaura a orientação original." [active] [ref=e125]':
                - img "Mapa 2D do piso com nós e rota de navegação" [ref=e128]:
                  - generic [ref=e129]:
                    - generic [ref=e130]: Norte
                    - generic "Entrada principal" [ref=e132]: Você está aqui
                    - generic "Escada rolante subida — térreo" [ref=e138]
                    - generic "Escada rolante descida — térreo" [ref=e141]
                    - generic "Elevador — térreo" [ref=e144]: Elevador
                    - generic "ADIDAS" [ref=e151]: E01
                    - generic "AREZZO" [ref=e157]: E02
                    - generic "CALVIN KLEIN" [ref=e163]: E03
                    - generic "NATURA" [ref=e169]: E04
                    - generic "CENTAURO" [ref=e175]: E05
                    - generic "CHILLI BEANS" [ref=e181]: E06
                    - generic "C&A" [ref=e187]: D01
                    - generic "ANACAPRI" [ref=e193]: D02
                    - generic "MAHOGANY" [ref=e199]: D03
                    - generic "CASA DAS ALIANÇAS" [ref=e205]: D04
                    - generic "REALME" [ref=e211]: D05
                    - generic "SESTINI" [ref=e217]: D06
                    - generic "Banheiro masculino — térreo" [ref=e224]: WC
                    - generic "Banheiro feminino — térreo" [ref=e231]: WC
                    - generic "Sua última posição confirmada" [ref=e238]: Você
              - img "Norte para cima" [ref=e246]:
                - generic [ref=e247]: "N"
              - generic: 5 m
            - generic [ref=e252]: Arraste para explorar · roda ou dois dedos para aproximar · clique nos pontos
            - generic "Legenda do mapa" [ref=e253]:
              - generic [ref=e254]: Sua posição
              - generic [ref=e258]: Origem
              - generic [ref=e262]: Destino
              - generic [ref=e266]: Rota
              - generic [ref=e270]: Acesso entre pisos
```

# Test source

```ts
  1   | import { test, expect, type Locator, type Page } from "@playwright/test";
  2   | 
  3   | async function openMap(page: Page, mode: "2D" | "3D") {
  4   |   await page.goto("http://localhost:8081/?qr=MINI-ENTRADA-PRINCIPAL");
  5   |   await expect(page.getByTestId("origin-label")).toContainText("Entrada principal");
  6   |   await page.getByRole("button", { name: `Mapa ${mode}`, exact: true }).click();
  7   |   const map = page.getByTestId(mode === "2D" ? "map-2d-viewport" : "scene-map");
  8   |   await expect(map).toBeVisible();
  9   |   if (mode === "3D") await expect(map).toHaveAttribute("data-camera-target", /\d/);
  10  |   return map;
  11  | }
  12  | 
  13  | async function drag(page: Page, map: Locator, dx: number, dy: number) {
  14  |   await map.scrollIntoViewIfNeeded();
  15  |   const box = (await map.boundingBox())!;
  16  |   // Start in empty space so the test exercises panning without selecting a POI.
  17  |   const x = box.x + box.width * .23, y = box.y + box.height * .5;
  18  |   await page.mouse.move(x, y);
  19  |   await page.mouse.down();
  20  |   await page.mouse.move(x + dx, y + dy, { steps: 12 });
  21  |   await page.mouse.up();
  22  | }
  23  | 
  24  | async function view2d(map: Locator) {
  25  |   return { x: Number(await map.getAttribute("data-pan-x")), y: Number(await map.getAttribute("data-pan-y")), zoom: Number(await map.getAttribute("data-zoom")) };
  26  | }
  27  | 
  28  | test("2D mantém arrastes sucessivos em 1×, alteração de preferências e troca de visualização", async ({ page }) => {
  29  |   const map = await openMap(page, "2D");
  30  |   await drag(page, map, 120, 35);
  31  |   await expect.poll(async () => (await view2d(map)).x).toBeCloseTo(120, 0);
  32  |   await drag(page, map, -45, 20);
  33  |   const panned = await view2d(map);
  34  |   expect(panned.x).toBeCloseTo(75, 0);
  35  |   expect(panned.y).toBeCloseTo(55, 0);
> 36  |   await page.getByRole("switch", { name: "Rota acessível" }).click();
      |                                                              ^ Error: locator.click: Test timeout of 45000ms exceeded.
  37  |   expect(await view2d(map)).toEqual(panned);
  38  |   await page.getByRole("button", { name: "Mapa 3D", exact: true }).click();
  39  |   await expect(page.getByTestId("scene-map")).toHaveAttribute("data-camera-target", /\d/);
  40  |   await page.getByRole("button", { name: "Mapa 2D", exact: true }).click();
  41  |   expect(await view2d(map)).toEqual(panned);
  42  |   await page.getByRole("button", { name: "Ver piso inteiro", exact: true }).click();
  43  |   expect(await view2d(map)).toEqual({ x: 0, y: 0, zoom: 1 });
  44  | });
  45  | 
  46  | test("2D aproxima sob o cursor, mantém pontos clicáveis e enquadra origem e rota", async ({ page }, info) => {
  47  |   const map = await openMap(page, "2D");
  48  |   await map.scrollIntoViewIfNeeded();
  49  |   const box = (await map.boundingBox())!;
  50  |   const offset = { x: 55, y: -60 };
  51  |   await page.mouse.move(box.x + box.width / 2 + offset.x, box.y + box.height / 2 + offset.y);
  52  |   await page.mouse.wheel(0, -300);
  53  |   await expect.poll(async () => (await view2d(map)).zoom).toBeGreaterThan(1.5);
  54  |   const zoomed = await view2d(map);
  55  |   expect(zoomed.x).toBeCloseTo(offset.x * (1 - zoomed.zoom), 0);
  56  |   expect(zoomed.y).toBeCloseTo(offset.y * (1 - zoomed.zoom), 0);
  57  |   await page.getByRole("button", { name: "Ver piso inteiro", exact: true }).click();
  58  |   await map.locator('g[aria-label="ADIDAS"]').click();
  59  |   await expect(page.getByRole("button", { name: "Traçar rota", exact: true })).toBeVisible();
  60  |   await page.getByRole("button", { name: "Traçar rota", exact: true }).click();
  61  |   await expect(page.getByTestId("route-panel")).toBeVisible();
  62  |   await page.getByRole("button", { name: "Centralizar rota", exact: true }).click();
  63  |   expect((await view2d(map)).zoom).toBeGreaterThan(1);
  64  |   await page.getByRole("button", { name: /^Mezanino/ }).click();
  65  |   await page.getByRole("button", { name: /Minha posição/ }).click();
  66  |   await expect(page.getByText("Mapa: Térreo", { exact: true })).toBeVisible();
  67  |   await expect.poll(async () => (await view2d(map)).zoom).toBeGreaterThan(1);
  68  |   await map.screenshot({ path: info.outputPath("map-2d-location.png") });
  69  | });
  70  | 
  71  | test("3D mantém câmera após arraste, oferece zoom, rotação, vista superior e localização", async ({ page }, info) => {
  72  |   const errors: string[] = [];
  73  |   page.on("pageerror", (error) => errors.push(error.message));
  74  |   const map = await openMap(page, "3D");
  75  |   const initial = await map.getAttribute("data-camera-target");
  76  |   await drag(page, map, 100, 25);
  77  |   await expect(map).not.toHaveAttribute("data-camera-target", initial!);
  78  |   const panned = await map.getAttribute("data-camera-target");
  79  |   await page.getByRole("switch", { name: "Rota acessível" }).click();
  80  |   await expect(map).toHaveAttribute("data-camera-target", panned!);
  81  |   await page.getByRole("button", { name: "Aumentar zoom", exact: true }).click();
  82  |   await expect(map).toHaveAttribute("data-zoom", "1.500");
  83  |   const keptPosition = await map.getAttribute("data-camera-position");
  84  |   const keptTarget = await map.getAttribute("data-camera-target");
  85  |   await page.getByRole("button", { name: "Mapa 2D", exact: true }).click();
  86  |   await expect(page.getByTestId("floor-map")).toBeVisible();
  87  |   await page.getByRole("button", { name: "Mapa 3D", exact: true }).click();
  88  |   await expect(map).toHaveAttribute("data-zoom", "1.500");
  89  |   await expect(map).toHaveAttribute("data-camera-position", keptPosition!);
  90  |   await expect(map).toHaveAttribute("data-camera-target", keptTarget!);
  91  |   await page.getByRole("button", { name: "Mais controles", exact: true }).click();
  92  |   await page.getByRole("button", { name: "Vista superior", exact: true }).click();
  93  |   await expect(page.getByRole("button", { name: "Vista inclinada", exact: true })).toBeVisible();
  94  |   const position = await map.getAttribute("data-camera-position");
  95  |   // O norte permanece fixo: não há botão de rotação horizontal. Apenas
  96  |   // vista superior/inclinada altera a câmera.
  97  |   await page.getByRole("button", { name: "Ver piso inteiro", exact: true }).click();
  98  |   await expect(map).toHaveAttribute("data-camera-target", "0.000,0.000,0.000");
  99  |   await expect(map).toHaveAttribute("data-zoom", "1.000");
  100 |   await page.getByRole("button", { name: /^Mezanino/ }).click();
  101 |   await page.getByRole("button", { name: /Minha posição/ }).click();
  102 |   await expect(page.getByText("Mapa: Térreo", { exact: true })).toBeVisible();
  103 |   await expect(map).toHaveAttribute("data-zoom", "3.000");
  104 |   await expect(map.getByRole("button", { name: "Entrada principal, ver detalhes" })).toBeVisible();
  105 |   await map.screenshot({ path: info.outputPath("map-3d-location.png") });
  106 |   expect(errors).toEqual([]);
  107 | });
  108 | 
  109 | test("Celular: arraste e pinça 2D/3D mantêm o zoom sem rolar a página ou abrir lojas", async ({ browser, browserName }, info) => {
  110 |   test.skip(browserName !== "chromium", "Gestos multitoque enviados por CDP no Chromium");
  111 |   const context = await browser.newContext({ viewport: { width: 414, height: 896 }, hasTouch: true, isMobile: true });
  112 |   const page = await context.newPage();
  113 |   const cdp = await context.newCDPSession(page);
  114 |   try {
  115 |     for (const mode of ["2D", "3D"] as const) {
  116 |       const map = await openMap(page, mode);
  117 |       await map.scrollIntoViewIfNeeded();
  118 |       const box = (await map.boundingBox())!;
  119 |       const initialTarget = await map.getAttribute("data-camera-target");
  120 |       const x = box.x + box.width * .27, y = box.y + box.height * .5;
  121 |       await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ id: 1, x, y }] });
  122 |       for (let i = 1; i <= 8; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ id: 1, x: x + i * 7, y }] });
  123 |       await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  124 |       if (mode === "2D") expect((await view2d(map)).x).toBeGreaterThan(40);
  125 |       else await expect(map).not.toHaveAttribute("data-camera-target", initialTarget!);
  126 |       const beforeZoom = Number(await map.getAttribute("data-zoom"));
  127 |       const points = (distance: number) => [{ id: 1, x: x - distance, y }, { id: 2, x: x + distance, y }];
  128 |       await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: points(30) });
  129 |       for (let d = 35; d <= 75; d += 5) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: points(d) });
  130 |       await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  131 |       await expect.poll(async () => Number(await map.getAttribute("data-zoom"))).toBeGreaterThan(beforeZoom * 1.5);
  132 |       const afterBox = (await map.boundingBox())!;
  133 |       expect(afterBox.y).toBeCloseTo(box.y, 0);
  134 |       await expect(page.getByRole("button", { name: "Traçar rota", exact: true })).toHaveCount(0);
  135 |       expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  136 |       await map.screenshot({ path: info.outputPath(`map-${mode.toLowerCase()}-mobile-pinch.png`) });
```