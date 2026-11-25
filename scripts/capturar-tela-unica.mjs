import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE = 'http://127.0.0.1:8766';
const nome = process.argv[2];
const url = process.argv[3];
const vpw = parseInt(process.argv[4]) || 1280;
const vph = parseInt(process.argv[5]) || 800;
const OUT = path.resolve(process.cwd(), 'evidence/prints-telas');
fs.mkdirSync(OUT, { recursive: true });

const arquivo = `${OUT}/${nome}.png`;

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: vpw, height: vph } });
  try {
    const page = await context.newPage();
    
    // Esperar networkidle (sem requisições por 500ms)
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    
    // Espera adicional para renderização do React/SPA
    await page.waitForTimeout(5000);
    
    // Tentar esperar por elementos de conteúdo específicos
    try {
      // Visitante: esperar por elementos de mapa ou conteúdo
      await page.waitForSelector('[role="main"], .screen, [testID], nav, main', { timeout: 8000 });
    } catch (e) {
      // continuar mesmo assim
    }
    
    await page.screenshot({ path: arquivo, fullPage: true });
    console.log(`[OK] ${nome} salvo`);
    await page.close();
  } catch (e) {
    console.error(`[FALHA] ${nome}: ${e.message}`);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
