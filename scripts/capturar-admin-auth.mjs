import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE = 'http://127.0.0.1:8766';
const OUT = path.resolve(process.cwd(), 'evidence/prints-telas');
fs.mkdirSync(OUT, { recursive: true });

// Chave admin válida para demonstração (do mini_server.py)
const ADMIN_KEY = 'audit-local-admin-key-with-32-characters';

const telas = [
  { nome: 'a-desktop-login', url: `${BASE}/admin/login`, vp: { width: 1280, height: 800 }, precisaAuth: false },
  { nome: 'a-desktop-dashboard', url: `${BASE}/admin/`, vp: { width: 1280, height: 800 }, precisaAuth: true },
  { nome: 'a-desktop-shoppings', url: `${BASE}/admin/shoppings`, vp: { width: 1280, height: 800 }, precisaAuth: true },
  { nome: 'a-desktop-pisos', url: `${BASE}/admin/pisos`, vp: { width: 1280, height: 800 }, precisaAuth: true },
  { nome: 'a-desktop-nos', url: `${BASE}/admin/nos`, vp: { width: 1280, height: 800 }, precisaAuth: true },
  { nome: 'a-desktop-arestas', url: `${BASE}/admin/arestas`, vp: { width: 1280, height: 800 }, precisaAuth: true },
  { nome: 'a-desktop-lojas', url: `${BASE}/admin/lojas`, vp: { width: 1280, height: 800 }, precisaAuth: true },
  { nome: 'a-desktop-categorias', url: `${BASE}/admin/categorias`, vp: { width: 1280, height: 800 }, precisaAuth: true },
  { nome: 'a-desktop-qr', url: `${BASE}/admin/qr`, vp: { width: 1280, height: 800 }, precisaAuth: true },
  { nome: 'a-desktop-validacao', url: `${BASE}/admin/validacao`, vp: { width: 1280, height: 800 }, precisaAuth: true },
  { nome: 'a-desktop-cena-3d', url: `${BASE}/admin/cena-3d`, vp: { width: 1280, height: 800 }, precisaAuth: true },
  { nome: 'a-desktop-auditoria', url: `${BASE}/admin/auditoria`, vp: { width: 1280, height: 800 }, precisaAuth: true },
];

export default async function main() {
  const browser = await chromium.launch({ headless: false });
  let ok = 0, falha = 0;

  for (const t of telas) {
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      try {
        // Cada tela abre um novo contexto para isolar sessões
        const context = await browser.newContext({ viewport: t.vp });

        // Injetar header X-API-Key em TODAS as requisições (para telas que precisam de auth)
        if (t.precisaAuth) {
          await context.setExtraHTTPHeaders({
            'X-API-Key': ADMIN_KEY,
          });
          // Também interceptar rotas da API para garantir o header
          await context.route('**/api/**', (route) => {
            const headers = { ...route.request().headers(), 'X-API-Key': ADMIN_KEY };
            return route.continue({ headers });
          });
        }

        const page = await context.newPage();
        await page.goto(t.url, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(4000); // espera renderização React

        await page.screenshot({ path: `${OUT}/${t.nome}.png`, fullPage: true });
        console.log(`[OK] ${t.nome} (tentativa ${tentativa}/3)`);
        await page.close();
        await context.close();
        ok++;
        break;
      } catch (e) {
        console.error(`[FALHA tentativa ${tentativa}/3] ${t.nome}: ${e.message}`);
        if (tentativa === 3) falha++;
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
    await new Promise((r) => setTimeout(r, 3000));
  }

  await browser.close();
  console.log(`\nAdmin concluído: ${ok} OK, ${falha} falha(s).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
