import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:8766';
const OUT = '../../evidence/prints-telas';

const telas = [
  { nome: 'a-desktop-login', url: `${BASE}/admin/login`, desc: 'Admin — login' },
  { nome: 'a-desktop-dashboard', url: `${BASE}/admin/`, desc: 'Admin — dashboard' },
  { nome: 'a-desktop-shoppings', url: `${BASE}/admin/shoppings`, desc: 'Admin — shoppings' },
  { nome: 'a-desktop-pisos', url: `${BASE}/admin/pisos`, desc: 'Admin — pisos' },
  { nome: 'a-desktop-nos', url: `${BASE}/admin/nos`, desc: 'Admin — nós do grafo' },
  { nome: 'a-desktop-arestas', url: `${BASE}/admin/arestas`, desc: 'Admin — arestas' },
  { nome: 'a-desktop-lojas', url: `${BASE}/admin/lojas`, desc: 'Admin — lojas' },
  { nome: 'a-desktop-categorias', url: `${BASE}/admin/categorias`, desc: 'Admin — categorias' },
  { nome: 'a-desktop-qr', url: `${BASE}/admin/qr`, desc: 'Admin — QR Codes' },
  { nome: 'a-desktop-validacao', url: `${BASE}/admin/validacao`, desc: 'Admin — validação de cena' },
  { nome: 'a-desktop-cena-3d', url: `${BASE}/admin/cena-3d`, desc: 'Admin — cena 3D' },
  { nome: 'a-desktop-auditoria', url: `${BASE}/admin/auditoria`, desc: 'Admin — auditoria' },
];

export default async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  let ok = 0, falha = 0;

  for (const t of telas) {
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      try {
        const page = await context.newPage();
        await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.screenshot({ path: `${OUT}/${t.nome}.png`, fullPage: true });
        console.log(`[OK] ${t.nome} — ${t.desc}`);
        await page.close();
        ok++;
        await new Promise((r) => setTimeout(r, 5000));
        break;
      } catch (e) {
        console.error(`[FALHA tentativa ${tentativa}/3] ${t.nome}: ${e.message}`);
        if (tentativa === 3) { falha++; }
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }

  await browser.close();
  console.log(`\nConcluído: ${ok} OK, ${falha} falha(s).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
