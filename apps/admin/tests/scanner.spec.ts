import { test, expect, type Page } from "@playwright/test";

async function installScannerFixture(page: Page) {
  await page.addInitScript(() => {
    // Exercise CameraView and screen focus without accessing a real camera or CDN.
    const state = window as Window & { auditQrToken: string | null };
    state.auditQrToken = null;
    const query = navigator.permissions.query.bind(navigator.permissions);
    navigator.permissions.query = (descriptor) => descriptor.name === "camera"
      ? Promise.resolve({ state: "granted" } as PermissionStatus)
      : query(descriptor);
    navigator.mediaDevices.getUserMedia = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 320; canvas.height = 240;
      const paint = () => canvas.getContext("2d")!.fillRect(0, 0, 320, 240);
      paint();
      const timer = setInterval(paint, 100);
      const stream = canvas.captureStream(10);
      const track = stream.getVideoTracks()[0];
      const stop = track.stop.bind(track);
      track.stop = () => { clearInterval(timer); stop(); };
      return stream;
    };
    navigator.mediaDevices.enumerateDevices = async () => [];
    Object.defineProperty(window, "Worker", { value: class {
      onmessage: ((event: { data: unknown }) => void) | null = null;
      postMessage() {
        const token = state.auditQrToken;
        queueMicrotask(() => this.onmessage?.({ data: token ? {
          type: "qr", data: token, cornerPoints: [],
          bounds: { origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } },
        } : null }));
      }
    } });
  });
}

test("Scanner mantém uma única resolução enquanto a leitura está pendente", async ({ page }, info) => {
  test.skip(info.project.name !== "chromium", "Fixture de MediaStream simulada para Chromium");
  await installScannerFixture(page);
  let requests = 0;
  let releaseFirst: (() => void) | undefined;
  const firstPending = new Promise<void>((resolve) => { releaseFirst = resolve; });
  await page.route("**/api/qr-codes/**", async (route) => {
    requests += 1;
    if (requests === 1) await firstPending;
    await route.continue();
  });
  await page.goto("/scan");
  await expect(page.locator("video")).toBeVisible();
  await page.evaluate(() => { (window as Window & { auditQrToken: string }).auditQrToken = "ENTRADA-PRINCIPAL"; });
  await expect.poll(() => requests).toBe(1);

  const input = page.getByLabel("Código ou link do QR", { exact: true });
  await input.fill("DESTINO-SUPERIOR");
  await input.press("Enter");
  await expect(page.getByRole("button", { name: "Usar código", exact: true })).toBeDisabled();
  await page.evaluate(() => { (window as Window & { auditQrToken: string }).auditQrToken = "DESTINO-SUPERIOR"; });
  await page.waitForTimeout(100);
  expect(requests).toBe(1);

  releaseFirst?.();
  await expect(page.getByTestId("origin-label")).toContainText("Entrada Principal");
  await expect(page).toHaveURL(/\/map$/);
  expect(requests).toBe(1);
});

test("Scanner não navega após perder o foco durante a resolução", async ({ page }, info) => {
  test.skip(info.project.name !== "chromium", "Fixture de MediaStream simulada para Chromium");
  await installScannerFixture(page);
  let requests = 0;
  let releaseRequest: (() => void) | undefined;
  const pendingRequest = new Promise<void>((resolve) => { releaseRequest = resolve; });
  await page.route("**/api/qr-codes/**", async (route) => {
    requests += 1;
    await pendingRequest;
    await route.continue();
  });
  await page.goto("/scan");
  await expect(page.locator("video")).toBeVisible();
  await page.evaluate(() => { (window as Window & { auditQrToken: string }).auditQrToken = "ENTRADA-PRINCIPAL"; });
  await expect.poll(() => requests).toBe(1);
  const response = page.waitForResponse("**/api/qr-codes/ENTRADA-PRINCIPAL");

  await page.getByRole("tab", { name: "Início", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Início", exact: true })).toHaveAttribute("aria-selected", "true");
  releaseRequest?.();
  await response;
  await expect(page).toHaveURL(/\/(?:\?.*)?$/);
});

test("Scanner permite nova tentativa após falha", async ({ page }, info) => {
  test.skip(info.project.name !== "chromium", "Fixture de MediaStream simulada para Chromium");
  await installScannerFixture(page);
  let requests = 0;
  await page.route("**/api/qr-codes/ENTRADA-PRINCIPAL", async (route) => {
    requests += 1;
    if (requests === 1) {
      await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ detail: "QR Code não encontrado ou inativo" }) });
      return;
    }
    await route.continue();
  });
  await page.goto("/scan");
  await expect(page.locator("video")).toBeVisible();
  await page.evaluate(() => { (window as Window & { auditQrToken: string }).auditQrToken = "ENTRADA-PRINCIPAL"; });
  await expect(page.getByText("QR Code não encontrado ou inativo", { exact: true })).toBeVisible();
  await page.evaluate(() => { (window as Window & { auditQrToken: string | null }).auditQrToken = null; });
  await page.getByRole("button", { name: "Tentar novamente", exact: true }).click();
  await page.getByLabel("Código ou link do QR", { exact: true }).fill("ENTRADA-PRINCIPAL");
  await page.getByRole("button", { name: "Usar código", exact: true }).click();
  await expect(page.getByTestId("origin-label")).toContainText("Entrada Principal");
  expect(requests).toBe(2);
});

test("Scanner aceita outra leitura após voltar à aba (eventos simulados)", async ({ page, browser }, info) => {
  test.skip(info.project.name !== "chromium", "Fixture de MediaStream simulada para Chromium");
  info.annotations.push({ type: "browser-version", description: `chromium ${browser.version()} (${process.platform})` });
  info.annotations.push({ type: "scope", description: "Vídeo sintético e decoder simulado; não valida leitura óptica nem câmera física." });
  await installScannerFixture(page);
  await page.goto("/scan");
  await expect(page.locator("video")).toBeVisible();
  await page.evaluate(() => { (window as Window & { auditQrToken: string }).auditQrToken = "ENTRADA-PRINCIPAL"; });
  await expect(page.getByTestId("origin-label")).toContainText("Entrada Principal");
  await page.evaluate(() => { (window as Window & { auditQrToken: string }).auditQrToken = "DESTINO-SUPERIOR"; });
  await page.getByRole("button", { name: "Escanear QR", exact: true }).click();
  await expect(page.getByTestId("origin-label")).toContainText("Livraria Superior");
  await expect(page.getByText("Mapa: Piso superior", { exact: true })).toBeVisible();
});
