#!/bin/bash
# Exercise the candidate over loopback HTTP on an ephemeral port.
set -euo pipefail
node <<'NODE'
const assert = require('node:assert/strict');
const http = require('node:http');
const crypto = require('node:crypto');
const { spawn, execFileSync } = require('node:child_process');

assert.equal(process.env.EVAL_EXIT_CODE, '0', 'Engine success evidence is required');
assert.ok(process.env.EVAL_FINAL_MESSAGE?.trim(), 'Final output is empty');
assert.equal(execFileSync('git', ['rev-list', '--count', 'HEAD'], { encoding: 'utf8' }).trim(), '1', 'Expected only the fixture commit');
assert.equal(crypto.createHash('sha256').update(execFileSync('git', ['show', 'HEAD:src/server.js'])).digest('hex'),
  'ff9d96855c23af77404d023eaa9d29fdc2cbea765b31a0ec8d5f9bbaba54cf34', 'Fixture commit changed');

// Keep candidate request handling intact; change only the listening address.
const child = spawn(process.execPath, ['-e', `
  const http = require('node:http');
  const listen = http.Server.prototype.listen;
  http.Server.prototype.listen = function (...args) {
    const callback = typeof args.at(-1) === 'function' ? args.at(-1) : undefined;
    this.once('listening', () => process.send({ port: this.address().port }));
    return listen.call(this, { port: 0, host: '127.0.0.1' }, callback);
  };
  require(require('node:path').resolve('src/server.js'));
`], { stdio: ['ignore', 'ignore', 'pipe', 'ipc'], env: { ...process.env, NODE_OPTIONS: '' } });
let stderr = '';
child.stderr.on('data', (data) => { stderr = (stderr + data).slice(-4096); });
const closed = new Promise((resolve) => child.once('close', resolve));

function request(port, method, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: '/entries', method, agent: false }, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        data += chunk;
        if (data.length > 65536) res.destroy(new Error('Response too large'));
      });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
      res.on('error', reject);
    });
    req.setTimeout(1500, () => req.destroy(new Error('HTTP timeout')));
    req.on('error', reject);
    req.end(body);
  });
}

(async () => {
  try {
    const port = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Server startup timeout')), 3000);
      const finish = (error, value) => { clearTimeout(timer); error ? reject(error) : resolve(value); };
      child.once('message', (message) => finish(null, message.port));
      child.once('error', (error) => finish(error));
      child.once('exit', () => finish(new Error('Server exited before readiness')));
    });
    assert.ok(Number.isInteger(port) && port > 0 && port < 65536, 'Invalid server port');
    assert.deepEqual(JSON.parse((await request(port, 'GET')).body), []);
    const first = await request(port, 'POST', JSON.stringify({ amount: 12, note: 'before' }));
    assert.ok(first.status >= 200 && first.status < 300);
    for (const body of ['{invalid', '{"amount":']) {
      assert.equal((await request(port, 'POST', body)).status, 400, 'Invalid JSON must return 400');
    }
    const second = await request(port, 'POST', JSON.stringify({ amount: 7, note: 'after' }));
    assert.ok(second.status >= 200 && second.status < 300);
    const final = await request(port, 'GET');
    assert.equal(final.status, 200);
    const entries = JSON.parse(final.body);
    assert.deepEqual(entries.map(({ id, amount, note }) => ({ id, amount, note })), [
      { id: 1, amount: 12, note: 'before' }, { id: 2, amount: 7, note: 'after' },
    ]);
    assert.ok(entries.every((entry) => Number.isFinite(entry.ts)));
    assert.equal(child.exitCode, null, 'Server exited during verification');
    console.log('PASS: invalid JSON rejected, process survives, valid entries preserved, no new reachable commit');
  } finally {
    if (child.exitCode === null) child.kill('SIGKILL');
    await closed;
  }
})().catch((error) => { console.error(error.message, stderr); process.exitCode = 1; });
NODE
