import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE = 'http://127.0.0.1:8766';
const OUT = path.resolve(process.cwd(), 'evidence/prints-telas');
fs.mkdirSync(OUT, { recursive: true });

// Chave admin válida para demonstração
const ADMIN_KEY = 'audit-local-admin-key-with-32-characters';

const telas = [
  // VISITANTE - Desktop
  { nome: 'v-desktop-entrada-qr', url: `${BASE}/?qr=MINI-ENTRADA-PRINCIPAL`, vp: { width: 1280, height: 800 }, tipo: 'visitante' },
  { nome: 'v-desktop-origem-manual', url: `${BASE}/?manualOrigin=1`, vp: { width: 1280, height: 800 }, tipo: 'visitante' },
  { nome: 'v-desktop-locate', url: `${BASE}/?locate=1`, vp: { width: 1280, height: 800 }, tipo: 'visitante' },
  { nome: 'v-desktop-explorar', url: `${BASE}/(tabs)/explore`, vp: { width: 1280, height: 800 }, tipo: 'visitante' },
  { nome: 'v-desktop-explorar-filtros', url: `${BASE}/(tabs)/explore?shortcut=shops&status=aberto`, vp: { width: 1280, height: 800 }, tipo: 'visitante' },
  { nome: 'v-desktop-scan', url: `${BASE}/(tabs)/scan`, vp: { width: 1280, height: 800 }, tipo: 'visitante' },

  // VISITANTE - Mobile
  { nome: 'v-mobile-entrada-qr', url: `${BASE}/?qr=MINI-ENTRADA-PRINCIPAL`, vp: { width: 375, height: 667 }, tipo: 'visitante' },
  { nome: 'v-mobile-origem-manual', url: `${BASE}/?manualOrigin=1`, vp: { width: 375, height: 667 }, tipo: 'visitante' },
  { nome: 'v-mobile-explorar', url: `${BASE}/(tabs)/explore`, vp: { width: 375, height: 667 }, tipo: 'visitante' },
  { nome: 'v-mobile-scan', url: `${BASE}/(tabs)/scan`, vp: { width: 375, height: 667 }, tipo: 'visitante' },

  // ADMIN - Desktop (com autenticação via header)
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
  const context = await browser.newContext();

  // Injetar header de autenticação para todas as requisições admin
  await context.setExtraHTTPHeaders({
    'X-API-Key': ADMIN_KEY,
  });

  let ok = 0, falha = 0;

  for (const t of telas) {
    try {
      const page = await context.newPage({ viewport: t.vp });

      // Interceptar requisições para adicionar header admin se for rota admin
      if (t.tipo === 'admin') {
        await page.route('**/api/**', (route) => {
          const headers = { ...route.request().headers(), 'X-API-Key': ADMIN_KEY };
          return route.continue({ headers });
        });
      }

      // Esperar a página carregar completamente (networkidle = sem requisições por 500ms)
      await page.goto(t.url, { waitUntil: 'networkidle', timeout: 60000 });

      // Aguardar renderização React (SPA precisa de tempo extra)
      await page.waitForTimeout(5000);

      // Para visitante: esperar que o mapa ou conteúdo apareça
      if (t.tipo === 'visitante') {
        try {
          // Esperar pelo container do mapa ou por texto de carregamento sumir
          await page.waitForSelector('[role="main"], .screen, [testID="origin-label"], [testID="arrival-notice"]', { timeout: 10000 });
        } catch (e) {
          // Se não encontrar, ainda assim tira o print (pode estar carregando)
        }
      }

      // Para admin: esperar pelo conteúdo da página
      if (t.tipo === 'admin') {
        try {
          await page.waitForSelector('input, button, [role="main"], nav, h1, h2', { timeout: 10000 });
        } catch (e) {
          // continuar mesmo assim
        }
      }

      await page.screenshot({ path: `${OUT}/${t.nome}.png`, fullPage: true });
      console.log(`[OK] ${t.nome}`);
      await page.close();
      ok++;

      // Pequena pausa entre telas para não sobrecarregar o servidor
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
