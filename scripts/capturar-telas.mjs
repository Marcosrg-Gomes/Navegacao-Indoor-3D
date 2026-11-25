import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:8766';
const OUT = '../../evidence/prints-telas';

const telas = [
  { nome: 'visitante-entrada', url: `${BASE}/?qr=MINI-ENTRADA-PRINCIPAL`, wait: 'networkidle' },
  { nome: 'admin-painel', url: `${BASE}/admin/`, wait: 'networkidle' },
];

export default async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });

  for (const t of telas) {
    const page = await context.newPage();
    await page.goto(t.url, { waitUntil: t.wait, timeout: 30000 });
    await page.screenshot({ path: `${OUT}/${t.nome}.png`, fullPage: true });
    console.log(`OK: ${t.nome} -> ${OUT}/${t.nome}.png`);
    await page.close();
  }

  await browser.close();
  console.log('Concluído. Prints salvos em evidence/prints-telas/');
}

main().catch((e) => { console.error(e); process.exit(1); });
