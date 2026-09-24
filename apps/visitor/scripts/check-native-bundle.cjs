const fs = require('node:fs');
const path = require('node:path');
const directory = path.resolve(__dirname, '../dist-native');
const maps = fs.readdirSync(directory, { recursive: true }).filter((name) => name.endsWith('.map'));
if (maps.length < 2) throw new Error('Gere Android e iOS com --source-maps antes da verificação.');
for (const filename of maps) {
  const map = JSON.parse(fs.readFileSync(path.join(directory, filename), 'utf8'));
  const forbidden = map.sources.filter((name) => /(?:node_modules[/\\](?:three|@react-three)[/\\]|(?:SceneCanvas|SceneMap|SceneControls|SceneLabels|MapGestureSurface)\.web)/.test(name));
  if (forbidden.length) throw new Error(`Dependências web no bundle nativo: ${forbidden.join(', ')}`);
}
console.log(`Native isolation OK: ${maps.length} source maps, sem Three.js, Fiber ou componentes web.`);
