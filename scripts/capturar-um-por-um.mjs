import { chromium } from 'playwright';
import { execSync } from 'child_process';
import fs from 'fs';

const BASE = 'http://127.0.0.1:8766';
const OUT = '../../evidence/prints-telas';

fs.mkdirSync(OUT, { recursive: true });

const telas = [
  { nome: 'v-desktop-entrada-qr', url: `${BASE}/?qr=MINI-ENTRADA-PRINCIPAL`, desc: 'Visitante — mapa 2D com origem por QR' },
  { nome: 'v-desktop-origem-manual', url: `${BASE}/?manualOrigin=1`, desc: 'Visitante — seleção manual de origem' },
  { nome: 'v-desktop-locate', url: `${BASE}/?locate=1`, desc: 'Visitante — localizar posição no mapa' },
  { nome: 'v-desktop-explorar', url: `${BASE}/(tabs)/explore`, desc: 'Visitante — explorar destinos (desktop)' },
  { nome: 'v-desktop-explorar-filtros', url: `${BASE}/(tabs)/explore?shortcut=shops&status=aberto`, desc: 'Visitante — explorar com filtros (desktop)' },
  { nome: 'v-desktop-scan', url: `${BASE}/(tabs)/scan`, desc: 'Visitante — ler QR Code (desktop)' },
  { nome: 'v-mobile-entrada-qr', url: `${BASE}/?qr=MINI-ENTRADA-PRINCIPAL`, vp: { width: 375, height: 667 }, desc: 'Visitante mobile — mapa 2D com origem por QR' },
  { nome: 'v-mobile-origem-manual', url: `${BASE}/?manualOrigin=1`, vp: { width: 375, height: 667 }, desc: 'Visitante mobile — seleção manual de origem' },
  { nome: 'v-mobile-explorar', url: `${BASE}/(tabs)/explore`, vp: { width: 375, height: 667 }, desc: 'Visitante mobile — explorar destinos' },
  { nome: 'v-mobile-scan', url: `${BASE}/(tabs)/scan`, vp: { width: 375, height: 667 }, desc: 'Visitante mobile — ler QR Code' },
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

function iniciarServidor() {
  console.log('  [Servidor] Iniciando uvicorn na porta 8766...');
  try {
    execSync(
      'start cmd /c ".\\.venv\\Scripts\\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8766"',
      { cwd: 'services/api', stdio: 'ignore' }
    );
  } catch (e) {
    console.log('  [Servidor] Erro ao iniciar (pode já estar rodando)');
  }
  console.log('  [Servidor] Aguardando inicialização (10s)...');
  const inicio = Date.now();
  while (Date.now() - inicio < 10000) { /* espera 10s */ }
}

function pararServidor() {
  console.log('  [Servidor] Encerrando processos Python...');
  try {
    execSync('powershell -Command "Get-Process python -ErrorAction SilentlyContinue | Stop-Process -Force"', { stdio: 'ignore' });
  } catch (e) { /* ignora */ }
  const inicio = Date.now();
  while (Date.now() - inicio < 3000) { /* espera 3s */ }
}

export default async function main() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  let ok = 0, falha = 0;

  for (let i = 0; i < telas.length; i++) {
    const t = telas[i];
    console.log(`\n[${i + 1}/${telas.length}] ${t.nome} — ${t.desc}`);

    iniciarServidor();

    try {
      const vp = t.vp || { width: 1280, height: 800 };
      const page = await context.newPage({ viewport: vp });
      await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.screenshot({ path: `${OUT}/${t.nome}.png`, fullPage: true });
      console.log(`  [OK] ${t.nome}`);
      await page.close();
      ok++;
    } catch (e) {
      console.error(`  [FALHA] ${t.nome}: ${e.message}`);
      falha++;
    }

    pararServidor();
  }

  await browser.close();
  console.log(`\n========================================`);
  console.log(`Concluído: ${ok} OK, ${falha} falha(s).`);
  console.log(`Prints salvos em: evidence/prints-telas/`);
  console.log(`========================================`);
}

main().catch((e) => { console.error(e); process.exit(1); });
