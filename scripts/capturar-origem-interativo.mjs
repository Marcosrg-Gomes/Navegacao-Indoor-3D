import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const BASE = 'http://127.0.0.1:8766';
const OUT = path.resolve(process.cwd(), 'evidence/prints-telas');
fs.mkdirSync(OUT, { recursive: true });

const telas = [
  { nome: 'v-desktop-origem-manual', url: `${BASE}/?manualOrigin=1`, vp: { width: 1280, height: 800 } },
  { nome: 'v-mobile-origem-manual', url: `${BASE}/?manualOrigin=1`, vp: { width: 375, height: 667 } },
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
        const page = await context.newPage();
        
        await page.goto(t.url, { waitUntil: 'networkidle', timeout: 60000 });
        await page.waitForTimeout(5000);

        // Tentar clicar no botão "Definir ponto de partida" / "Alterar origem"
        try {
          // Procurar botões de origem
          const botoes = await page.$$('button');
          for (const b of botoes) {
            const texto = await b.textContent();
            if (texto && (texto.includes('Definir ponto de partida') || texto.includes('Alterar origem') || texto.includes('Corrigir minha posição'))) {
              await b.click();
              await page.waitForTimeout(3000);
              break;
            }
          }
        } catch (e) {
          // continua
        }

        // Se ainda não apareceu, tentar clicar no centro do mapa (área do mapa)
        try {
          await page.click('body', { position: { x: t.vp.width / 2, y: t.vp.height / 2 } });
          await page.waitForTimeout(3000);
        } catch (e) {
          // continua
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
  console.log(`\nOrigem interativo concluído: ${ok} OK, ${falha} falha(s).`);
}

main().catch((e) => { console.error(e); process.exit(1); });
