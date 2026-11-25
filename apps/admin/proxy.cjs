const http = require('http');

const proxy = http.createServer((req, res) => {
  const options = {
    hostname: 'localhost',
    port: 8766,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };
  const proxyReq = http.request(options, proxyRes => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  proxyReq.on('error', e => {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Proxy error: ' + e.message);
  });
  req.pipe(proxyReq);
});

proxy.listen(8081, '127.0.0.1', () => {
  console.log('Proxy listening on http://127.0.0.1:8081 -> localhost:8766');
});
