const http = require('http');

const server = http.createServer((clientReq, clientRes) => {
  const options = {
    hostname: 'localhost',
    port: 3002,
    path: clientReq.url,
    method: clientReq.method,
    headers: clientReq.headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(clientRes, { end: true });
  });

  proxyReq.on('error', (err) => {
    clientRes.writeHead(502);
    clientRes.end('Bad Gateway: ' + err.message);
  });

  clientReq.pipe(proxyReq, { end: true });
});

server.listen(3000, '0.0.0.0', () => {
  console.log('Proxy: port 3000 → 3002');
});
