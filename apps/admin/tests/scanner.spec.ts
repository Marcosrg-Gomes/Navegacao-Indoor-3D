import { test, expect } from "@playwright/test";

test("Scanner aceita outra leitura após voltar à aba (eventos simulados)", async ({ page, browser }, info) => {
  test.skip(info.project.name !== "chromium", "Fixture de MediaStream simulada para Chromium");
  info.annotations.push({ type: "browser-version", description: `chromium ${browser.version()} (${process.platform})` });
  info.annotations.push({ type: "scope", description: "Vídeo sintético e decoder simulado; não valida leitura óptica nem câmera física." });
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
  await page.goto("/scan");
  await expect(page.locator("video")).toBeVisible();
  await page.evaluate(() => { (window as Window & { auditQrToken: string }).auditQrToken = "ENTRADA-PRINCIPAL"; });
  await expect(page.getByTestId("origin-label")).toContainText("Entrada Principal");
  await page.evaluate(() => { (window as Window & { auditQrToken: string }).auditQrToken = "DESTINO-SUPERIOR"; });
  await page.getByRole("button", { name: "Escanear QR", exact: true }).click();
  await expect(page.getByTestId("origin-label")).toContainText("Livraria Superior");
  await expect(page.getByText("Mapa: Piso superior", { exact: true })).toBeVisible();
});
