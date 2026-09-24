const fs = require('node:fs');
const path = require('node:path');
const QRCode = require('../apps/admin/node_modules/qrcode');
const root = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'assets/models/mini-shopping/scene-catalog-v1.json'), 'utf8'));
const output = path.join(root, 'assets/qr');
const escape = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const cards = [];
  for (const [token, code] of Object.entries(catalog.qr_codes)) {
    const svg = await QRCode.toString(token, { type: 'svg', errorCorrectionLevel: 'M', margin: 4, width: 260 });
    fs.writeFileSync(path.join(output, token + '.svg'), svg);
    cards.push(`<article><h2>${escape(catalog.anchors[code].name)}</h2>${svg}<p>${token}</p></article>`);
  }
  fs.writeFileSync(path.join(output, 'mini-shopping-qrs.html'), `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>QR Codes — Mini Shopping</title><style>body{font:16px sans-serif;margin:24px}main{display:grid;grid-template-columns:1fr 1fr;gap:20px}article{border:1px solid #555;padding:12px;text-align:center;break-inside:avoid}h2{font-size:18px}svg{width:60mm;height:60mm}p{font-size:12px}@media print{body{margin:0}}</style><h1>Mini Shopping — QR Codes de localização</h1><p>Imprimir em escala de 100%. Cada código identifica uma âncora do modelo.</p><main>${cards.join('')}</main></html>`);
  console.log(`${cards.length} QR Codes e folha de impressão gerados em ${output}`);
})().catch((error) => { console.error(error); process.exitCode = 1; });
