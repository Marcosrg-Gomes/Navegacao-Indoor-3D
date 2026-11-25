import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE = 'http://127.0.0.1:8766';
const OUT = path.resolve(process.cwd(), 'evidence/prints-telas');
fs.mkdirSync(OUT, { recursive: true });

const ADMIN_KEY = 'audit-local-admin-key-with-32-characters';

// Telas que precisam ser capturadas (incluindo re-tentativas)
const telas = [
  // Visitante desktop
  { nome: 'v-desktop-entrada-qr', url: `${BASE}/?qr=MINI-ENTRADA-PRINCIPAL`, vp: { width: 1280, height: 800 }, tipo: 'visitante' },
  { nome: 'v-desktop-origem-manual', url: `${BASE}/?manualOrigin=1`, vp: { width: 1280, height: 800 }, tipo: 'visitante' },
  { nome: 'v-desktop-locate', url: `${BASE}/?locate=1`, vp: { width: 1280, height: 800 }, tipo: 'visitante' },
  { nome: 'v-desktop-explorar', url: `${BASE}/(tabs)/explore`, vp: { width: 1280, height: 800 }, tipo: 'visitante' },
  { nome: 'v-desktop-explorar-filtros', url: `${BASE}/(tabs)/explore?shortcut=shops&status=aberto`, vp: { width: 1280, height: 800 }, tipo: 'visitante' },
  { nome: 'v-desktop-scan', url: `${BASE}/(tabs)/scan`, vp: { width: 1280, height: 800 }, tipo: 'visitante' },

  // Visitante mobile
  { nome: 'v-mobile-entrada-qr', url: `${BASE}/?qr=MINI-ENTRADA-PRINCIPAL`, vp: { width: 375, height: 667 }, tipo: 'visitante' },
  { nome: 'v-mobile-origem-manual', url: `${BASE}/?manualOrigin=1`, vp: { width: 375, height: 667 }, tipo: 'visitante' },
  { nome: 'v-mobile-explorar', url: `${BASE}/(tabs)/explore`, vp: { width: 375, height: 667 }, tipo: 'visitante' },
  { nome: 'v-mobile-scan', url: `${BASE}/(tabs)/scan`, vp: { width: 375, height: 667 }, tipo: 'visitante' },

  // Admin desktop (com autenticação)
  { nome: 'a-desktop-login', url: `${BASE}/admin/login`, vp: { width: 1280, height: 800 }, tipo: 'admin' },
  { nome: 'a-desktop-dashboard', url: `${BASE}/admin/`, vp: { width: 1280, height: 800 }, tipo: 'admin' },
  { nome: 'a-desktop-shoppings', url: `${BASE}/admin/shoppings`, vp: { width: 1280, height: 800 }, tipo: 'admin' },
  { nome: 'a-desktop-pisos', url: `${BASE}/admin/pisos`, vp: { width: 1280, height: 800 }, tipo: 'admin' },
  { nome: 'a-desktop-nos', url: `${BASE}/admin/nos`, vp: { width: 1280, height: 800 }, tipo: 'admin' },
  { nome: 'a-desktop-arestas', url: `${BASE}/admin/arestas`, vp: { width: 1280, height: 800 }, tipo: 'admin' },
  { nome: 'a-desktop-lojas', url: `${BASE}/admin/lojas`, vp: { width: 1280, height: 800 }, tipo: 'admin' },
  { nome: 'a-desktop-categorias', url: `${BASE}/admin/categorias`, vp: { width: 1280, height: 800 }, tipo: 'admin' },
  { nome: 'a-desktop-qr', url: `${BASE}/admin/qr`, vp: { width: 1280, height: 800 }, tipo: 'admin' },
  { nome: 'a-desktop-validacao', url: `${BASE}/admin/validacao`, vp: { width: 1280, height: 800 }, tipo: 'admin' },
  { nome: 'a-desktop-cena-3d', url: `${BASE}/admin/cena-3d`, vp: { width: 1280, height: 800 }, tipo: 'admin' },
  { nome: 'a-desktop-auditoria', url: `${BASE}/admin/auditoria`, vp: { width: 1280, height: 800 }, tipo: 'admin' },
];

export default async function main() {
  const browser = await chromium.launch({ headless: false });
  let ok = 0, falha = 0;

  for (const t of telas) {
    let sucesso = false;
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      let context;
      try {
        context = await browser.newContext({ viewport: t.vp });

        // Header X-API-Key para telas admin
        if (t.tipo === 'admin') {
          await context.setExtraHTTPHeaders({
            'X-API-Key': ADMIN_KEY,
          });
          await context.route('**/api/**', (route) => {
            const headers = { ...route.request().headers(), 'X-API-Key': ADMIN_KEY };
            return route.continue({ headers });
          });
        }

        const page = await context.newPage();
        await page.goto(t.url, { waitUntil: 'networkidle', timeout: 60000 });
        
        // Espera para renderização React/SPA
        await page.waitForTimeout(4000);

        // Espera por elementos de conteúdo
        try {
          if (t.tipo === 'visitante') {
            await page.waitForSelector('[role="main"], .screen, [testID], nav, main', { timeout: 8000 });
          } else {
            await page.waitForSelector('input, button, [role="main"], nav, h1, h2', { timeout: 8000 });
          }
        } catch (e) {
          // continua mesmo assim
        }

        await page.screenshot({ path: `${OUT}/${t.nome}.png`, fullPage: true });
        console.log(`[OK] ${t.nome}`);
        await page.close();
        await context.close();
        ok++;
        sucesso = true;
        break;
      } catch (e) {
        console.error(`[FALHA tentativa ${tentativa}/3] ${t.nome}: ${e.message}`);
        if (context) {
          try { await context.close(); } catch {}
        }
        if (tentativa === 3) falha++;
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
    // Pausa entre telas para não sobrecarregar o servidor
    await new Promise((r) => setTimeout(r, 3000));
  }

  await browser.close();
  console.log(`\nConcluído: ${ok} OK, ${falha} falha(s).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
