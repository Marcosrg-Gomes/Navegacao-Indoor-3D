import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE = 'http://127.0.0.1:8766';
const OUT = path.resolve(process.cwd(), 'evidence/prints-telas');
fs.mkdirSync(OUT, { recursive: true });

const telas = [
  { nome: 'v-desktop-origem-manual-final', url: `${BASE}/?manualOrigin=1`, vp: { width: 1280, height: 800 } },
  { nome: 'v-desktop-explorar-final', url: `${BASE}/(tabs)/explore`, vp: { width: 1280, height: 800 } },
  { nome: 'v-mobile-scan-final', url: `${BASE}/(tabs)/scan`, vp: { width: 375, height: 667 } },
  { nome: 'a-desktop-dashboard-final', url: `${BASE}/admin/`, vp: { width: 1280, height: 800 } },
  { nome: 'a-desktop-qr-final', url: `${BASE}/admin/qr`, vp: { width: 1280, height: 800 } },
  { nome: 'a-desktop-cena-3d-final', url: `${BASE}/admin/cena-3d`, vp: { width: 1280, height: 800 } },
];

export default async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  let ok = 0, falha = 0;

  for (const t of telas) {
    try {
      const page = await context.newPage({ viewport: t.vp });
      await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.screenshot({ path: `${OUT}/${t.nome}.png`, fullPage: true });
      console.log(`[OK] ${t.nome}`);
      await page.close();
      ok++;
      await new Promise((r) => setTimeout(r, 3000));
    } catch (e) {
      console.error(`[FALHA] ${t.nome}: ${e.message}`);
      falha++;
    }
  }

  await browser.close();
  console.log(`\nConcluído: ${ok} OK, ${falha} falha(s).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
