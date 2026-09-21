const http = require('http');

const entries = [];

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/entries') {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      const { amount, note } = JSON.parse(body || '{}');
      entries.push({ id: entries.length + 1, amount, note, ts: Date.now() });
      res.end('ok');
    });
    return;
  }
  if (req.method === 'GET' && req.url === '/entries') {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(entries));
    return;
  }
  res.statusCode = 404;
  res.end('not found');
});

server.listen(3000);
