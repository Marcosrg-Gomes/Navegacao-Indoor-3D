import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE = 'http://127.0.0.1:8766';
const OUT = path.resolve(process.cwd(), 'evidence/prints-telas');
fs.mkdirSync(OUT, { recursive: true });

const telas = [
  { nome: 'v-desktop-origem-manual-retry', url: `${BASE}/?manualOrigin=1`, vp: { width: 1280, height: 800 } },
  { nome: 'v-desktop-explorar-retry', url: `${BASE}/(tabs)/explore`, vp: { width: 1280, height: 800 } },
  { nome: 'v-mobile-scan-retry', url: `${BASE}/(tabs)/scan`, vp: { width: 375, height: 667 } },
  { nome: 'a-desktop-dashboard-retry', url: `${BASE}/admin/`, vp: { width: 1280, height: 800 } },
  { nome: 'a-desktop-qr-retry', url: `${BASE}/admin/qr`, vp: { width: 1280, height: 800 } },
  { nome: 'a-desktop-cena-3d-retry', url: `${BASE}/admin/cena-3d`, vp: { width: 1280, height: 800 } },
];

export default async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  let ok = 0, falha = 0;

  for (const t of telas) {
    let sucesso = false;
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      try {
        const page = await context.newPage({ viewport: t.vp });
        await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.screenshot({ path: `${OUT}/${t.nome}.png`, fullPage: true });
        console.log(`[OK] ${t.nome} (tentativa ${tentativa}/3)`);
        await page.close();
        ok++;
        sucesso = true;
        break;
      } catch (e) {
        console.error(`[FALHA tentativa ${tentativa}/3] ${t.nome}: ${e.message}`);
        await page.close().catch(() => {});
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
    if (!sucesso) falha++;
  }

  await browser.close();
  console.log(`\nRetry concluído: ${ok} OK, ${falha} falha(s).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
