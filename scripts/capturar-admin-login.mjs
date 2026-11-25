import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE = 'http://127.0.0.1:8766';
const OUT = path.resolve(process.cwd(), 'evidence/prints-telas');
fs.mkdirSync(OUT, { recursive: true });

const ADMIN_KEY = 'audit-local-admin-key-with-32-characters';

const telasAdmin = [
  { nome: 'a-desktop-login', url: `${BASE}/admin/login`, vp: { width: 1280, height: 800 }, ehLogin: true },
  { nome: 'a-desktop-dashboard', url: `${BASE}/admin/`, vp: { width: 1280, height: 800 }, ehLogin: false },
  { nome: 'a-desktop-shoppings', url: `${BASE}/admin/shoppings`, vp: { width: 1280, height: 800 }, ehLogin: false },
  { nome: 'a-desktop-pisos', url: `${BASE}/admin/pisos`, vp: { width: 1280, height: 800 }, ehLogin: false },
  { nome: 'a-desktop-nos', url: `${BASE}/admin/nos`, vp: { width: 1280, height: 800 }, ehLogin: false },
  { nome: 'a-desktop-arestas', url: `${BASE}/admin/arestas`, vp: { width: 1280, height: 800 }, ehLogin: false },
  { nome: 'a-desktop-lojas', url: `${BASE}/admin/lojas`, vp: { width: 1280, height: 800 }, ehLogin: false },
  { nome: 'a-desktop-categorias', url: `${BASE}/admin/categorias`, vp: { width: 1280, height: 800 }, ehLogin: false },
  { nome: 'a-desktop-qr', url: `${BASE}/admin/qr`, vp: { width: 1280, height: 800 }, ehLogin: false },
  { nome: 'a-desktop-validacao', url: `${BASE}/admin/validacao`, vp: { width: 1280, height: 800 }, ehLogin: false },
  { nome: 'a-desktop-cena-3d', url: `${BASE}/admin/cena-3d`, vp: { width: 1280, height: 800 }, ehLogin: false },
  { nome: 'a-desktop-auditoria', url: `${BASE}/admin/auditoria`, vp: { width: 1280, height: 800 }, ehLogin: false },
];

export default async function main() {
  const browser = await chromium.launch({ headless: false });
  let ok = 0, falha = 0;

  for (const t of telasAdmin) {
    let sucesso = false;
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
      let context;
      try {
        context = await browser.newContext({ viewport: t.vp });
        const page = await context.newPage();

        if (t.ehLogin) {
          // Tela de login: só captura, não precisa autenticar
          await page.goto(t.url, { waitUntil: 'networkidle', timeout: 60000 });
          await page.waitForTimeout(3000);
        } else {
          // Telas que precisam de login: fazer login primeiro
          await page.goto(`${BASE}/admin/login`, { waitUntil: 'networkidle', timeout: 60000 });
          await page.waitForTimeout(2000);

          // Preencher o campo de chave
          await page.fill('input#admin-key', ADMIN_KEY);
          await page.waitForTimeout(1000);

          // Clicar no botão de entrar
          await page.click('button.primary');
          await page.waitForTimeout(3000);

          // Agora navegar para a tela alvo
          await page.goto(t.url, { waitUntil: 'networkidle', timeout: 60000 });
          await page.waitForTimeout(3000);
        }

        // Espera por elementos de conteúdo
        try {
          await page.waitForSelector('input, button, [role="main"], nav, h1, h2', { timeout: 8000 });
        } catch (e) {
          // continua mesmo assim
        }

        await page.screenshot({ path: `${OUT}/${t.nome}.png`, fullPage: true });
        console.log(`[OK] ${t.nome} (tentativa ${tentativa}/3)`);
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
    await new Promise((r) => setTimeout(r, 3000));
  }

  await browser.close();
  console.log(`\nAdmin concluído: ${ok} OK, ${falha} falha(s).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
