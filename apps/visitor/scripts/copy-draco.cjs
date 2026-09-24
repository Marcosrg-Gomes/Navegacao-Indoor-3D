const fs = require('node:fs');
const path = require('node:path');
const source = path.join(path.resolve(path.dirname(require.resolve('three')), '..'), 'examples/jsm/libs/draco/gltf');
const destination = path.resolve(__dirname, '../../..', 'services/api/app/static/models/draco');
fs.mkdirSync(destination, { recursive: true });
for (const filename of ['draco_decoder.js', 'draco_decoder.wasm', 'draco_wasm_wrapper.js']) {
  fs.copyFileSync(path.join(source, filename), path.join(destination, filename));
}
