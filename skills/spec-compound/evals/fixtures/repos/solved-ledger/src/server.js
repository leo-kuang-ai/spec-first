const http = require('http');

const entries = [];

function parseEntry(body) {
  const { amount, note } = JSON.parse(body || '{}');
  // Guard added by the fix: reject non-finite numbers instead of storing NaN.
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return null;
  }
  return { id: entries.length + 1, amount, note, ts: Date.now() };
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/entries') {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      const entry = parseEntry(body);
      if (!entry) { res.statusCode = 400; return res.end('invalid amount'); }
      entries.push(entry);
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

if (require.main === module) {
  server.listen(3000);
}
