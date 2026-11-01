const http = require('http');

const entries = [];

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/entries') {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      try {
        const { amount, note } = JSON.parse(body || '{}');
        if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
          res.statusCode = 400;
          return res.end('invalid amount');
        }
        entries.push({ id: entries.length + 1, amount, note, ts: Date.now() });
        res.statusCode = 201;
        res.end('ok');
      } catch (err) {
        res.statusCode = 400;
        res.end('invalid json');
      }
    });
    return;
  }
  if (req.method === 'GET' && req.url === '/entries') {
    res.setHeader('content-type', 'application/json');
    return res.end(JSON.stringify(entries));
  }
  res.statusCode = 404;
  res.end('not found');
});

server.listen(3000);
