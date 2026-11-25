import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const url = process.argv[2];
const nome = process.argv[3];
const vpw = parseInt(process.argv[4]) || 1280;
const vph = parseInt(process.argv[5]) || 800;

// Caminho absoluto baseado no diretorio deste script (scripts/) -> evidence/prints-telas/
const OUT = path.resolve(process.cwd(), 'evidence/prints-telas');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: vpw, height: vph } });
  try {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.screenshot({ path: `${OUT}/${nome}.png`, fullPage: true });
    console.log(`[OK] ${nome} -> ${OUT}/${nome}.png`);
    await page.close();
  } catch (e) {
    console.error(`[FALHA] ${nome}: ${e.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
