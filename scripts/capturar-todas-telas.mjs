import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:8766';
const OUT = '../../evidence/prints-telas';

const DESKTOP = { width: 1280, height: 800 };
const MOBILE = { width: 375, height: 667 };

// (nome, url, viewport, descricao)
// NOTA: telas do visitante que dependem de interação (calcular rota, confirmar chegada,
// abrir filtro, escolher destino) não são forçáveis apenas por URL. Elas aparecem após cliques.
// Aqui estão as telas alcançáveis diretamente por URL.
const telas = [
  // ============ VISITANTE - Desktop ============
  { nome: 'v-desktop-entrada-qr', url: `${BASE}/?qr=MINI-ENTRADA-PRINCIPAL`, vp: DESKTOP, desc: 'Visitante — mapa 2D com origem por QR (entrada principal)' },
  { nome: 'v-desktop-origem-manual', url: `${BASE}/?manualOrigin=1`, vp: DESKTOP, desc: 'Visitante — seleção manual de ponto de partida' },
  { nome: 'v-desktop-locate', url: `${BASE}/?locate=1`, vp: DESKTOP, desc: 'Visitante — localizar posição no mapa' },
  { nome: 'v-desktop-explorar', url: `${BASE}/(tabs)/explore`, vp: DESKTOP, desc: 'Visitante — explorar destinos (desktop)' },
  { nome: 'v-desktop-explorar-filtros', url: `${BASE}/(tabs)/explore?shortcut=shops&status=aberto&accessibleOnly=true`, vp: DESKTOP, desc: 'Visitante — explorar com filtros (lojas, abertos, sem escadas)' },
  { nome: 'v-desktop-scan', url: `${BASE}/(tabs)/scan`, vp: DESKTOP, desc: 'Visitante — ler QR Code' },

  // ============ VISITANTE - Mobile ============
  { nome: 'v-mobile-entrada-qr', url: `${BASE}/?qr=MINI-ENTRADA-PRINCIPAL`, vp: MOBILE, desc: 'Visitante mobile — mapa 2D com origem por QR' },
  { nome: 'v-mobile-origem-manual', url: `${BASE}/?manualOrigin=1`, vp: MOBILE, desc: 'Visitante mobile — seleção manual de origem' },
  { nome: 'v-mobile-explorar', url: `${BASE}/(tabs)/explore`, vp: MOBILE, desc: 'Visitante mobile — explorar destinos' },
  { nome: 'v-mobile-scan', url: `${BASE}/(tabs)/scan`, vp: MOBILE, desc: 'Visitante mobile — ler QR Code' },

  // ============ ADMIN - Desktop ============
  { nome: 'a-desktop-login', url: `${BASE}/admin/login`, vp: DESKTOP, desc: 'Admin — tela de login' },
  { nome: 'a-desktop-dashboard', url: `${BASE}/admin/`, vp: DESKTOP, desc: 'Admin — dashboard' },
  { nome: 'a-desktop-shoppings', url: `${BASE}/admin/shoppings`, vp: DESKTOP, desc: 'Admin — cadastro de shoppings' },
  { nome: 'a-desktop-pisos', url: `${BASE}/admin/pisos`, vp: DESKTOP, desc: 'Admin — pisos e andares' },
  { nome: 'a-desktop-nos', url: `${BASE}/admin/nos`, vp: DESKTOP, desc: 'Admin — nós do grafo' },
  { nome: 'a-desktop-arestas', url: `${BASE}/admin/arestas`, vp: DESKTOP, desc: 'Admin — arestas e conexões' },
  { nome: 'a-desktop-lojas', url: `${BASE}/admin/lojas`, vp: DESKTOP, desc: 'Admin — lojas / POIs' },
  { nome: 'a-desktop-categorias', url: `${BASE}/admin/categorias`, vp: DESKTOP, desc: 'Admin — categorias' },
  { nome: 'a-desktop-qr', url: `${BASE}/admin/qr`, vp: DESKTOP, desc: 'Admin — QR Codes' },
  { nome: 'a-desktop-validacao', url: `${BASE}/admin/validacao`, vp: DESKTOP, desc: 'Admin — validação de cena' },
  { nome: 'a-desktop-cena-3d', url: `${BASE}/admin/cena-3d`, vp: DESKTOP, desc: 'Admin — cena 3D' },
  { nome: 'a-desktop-auditoria', url: `${BASE}/admin/auditoria`, vp: DESKTOP, desc: 'Admin — histórico e falhas (auditoria)' },
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
      console.log(`[OK] ${t.nome} (${t.vp.width}x${t.vp.height}) — ${t.desc}`);
      await page.close();
      ok++;
      // delay maior para o servidor recuperar entre telas
      await new Promise((r) => setTimeout(r, 10000));
    } catch (e) {
      console.error(`[FALHA] ${t.nome}: ${e.message}`);
      falha++;
    }
  }

  await browser.close();
  console.log(`\nConcluído: ${ok} OK, ${falha} falha(s).`);
  console.log(`Prints salvos em: evidence/prints-telas/`);
  console.log('\nObs: telas como "rota calculada", "chegada confirmada", "filtro aberto"');
  console.log('exigem cliques no app e não são capturáveis apenas por URL.');
}

main().catch((e) => { console.error(e); process.exit(1); });
