'use strict';

function checkMonthExamples(body) {
  const visible = body.replace(/<!--[\s\S]*?(?:-->|$)/g, '');
  assert.match(visible, /(?<![\w./-])(?:\.\/)?src\/server\.js(?![\w/-]|\.\w)/);
  assert.match(visible, /\bUTC\b/);
  const columns = ['request', 'http status', 'entry ids'];
  const split = line => line.trim().replace(/^\||\|$/g, '').split('|')
    .map(cell => cell.trim().replace(/^`([^`]+)`$/, '$1'));
  const lines = visible.split('\n');
  const headers = lines.map(split).map(cells => cells.map(cell => cell.replace(/^(\*\*|__)(.+)\1$/, '$2').toLowerCase()));
  const tables = headers.flatMap((cells, index) => cells.length === columns.length && columns.every(name => cells.includes(name)) ? [index] : []);
  assert.equal(tables.length, 1, 'Expected one acceptance table for the client');
  const start = tables[0];
  const separators = split(lines[start + 1] || '');
  assert.ok(separators.length === columns.length && separators.every(cell => /^:?-{3,}:?$/.test(cell)), 'Missing table separator');
  const cases = new Map();
  for (const line of lines.slice(start + 2)) {
    if (!line.includes('|')) break;
    const cells = split(line);
    assert.equal(cells.length, columns.length, 'Incomplete acceptance row');
    const [request, status, ids] = columns.map(name => cells[headers[start].indexOf(name)]);
    assert.ok(!cases.has(request), 'Conflicting or repeated example for ' + request);
    cases.set(request, [status.replace(/^200 OK$/i, '200').replace(/^400 Bad Request$/i, '400'), ids.split(',').map(id => id.trim()).sort()]);
  }
  assert.deepEqual(cases, new Map([
    ['GET /entries', ['200', ['11', '12', '13']]],
    ['GET /entries?month=2026-02', ['200', ['12']]],
    ['GET /entries?month=2026-13', ['400', ['none']]],
  ]));
}
