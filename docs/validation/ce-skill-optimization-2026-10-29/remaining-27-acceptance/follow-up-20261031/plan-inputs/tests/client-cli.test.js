'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createClient } = require('../src/client');
const { importOrders } = require('../src/order-importer');
const rows = [{ id: 'order-1' }];

test('only the declared transient failure permits a safe repeated send', async () => {
  const client = createClient(['transient', 'transient', 'ok']);
  for (let i = 0; i < 2; i++) {
    await assert.rejects(client.send(rows), { code: 'TRANSIENT_BEFORE_SEND', message: 'Request not sent' });
    assert.deepEqual(client.applied, []);
  }
  assert.deepEqual(await client.send(rows), { imported: 1 });
  assert.equal(client.attempts, 3);
  assert.deepEqual(client.applied, ['order-1']);
});

for (const [outcome, code, applied] of [
  ['auth', 'AUTH_FAILED', []], ['unknown', 'UNCLASSIFIED', []], ['ambiguous', 'OUTCOME_UNKNOWN', ['order-1']],
]) {
  test(`baseline propagates ${code} once with actual application state`, async () => {
    const client = createClient([outcome]);
    await assert.rejects(importOrders(rows, client), { code });
    assert.equal(client.attempts, 1);
    assert.deepEqual(client.applied, applied);
  });
}

test('invalid rows fail before any application', async () => {
  const client = createClient(['ambiguous']);
  await assert.rejects(client.send([{ id: '' }]), { code: 'INVALID_ORDER' });
  assert.equal(client.attempts, 1);
  assert.deepEqual(client.applied, []);
});

test('the original importer still performs one attempt without implementing retries', async () => {
  const client = createClient(['transient', 'ok']);
  await assert.rejects(importOrders(rows, client), { code: 'TRANSIENT_BEFORE_SEND' });
  assert.equal(client.attempts, 1);
  assert.deepEqual(client.applied, []);
});

for (const [scenario, code, message] of [
  ['transient', 'TRANSIENT_BEFORE_SEND', 'Request not sent'],
  ['auth', 'AUTH_FAILED', 'Access denied'],
  ['ambiguous', 'OUTCOME_UNKNOWN', 'Response unavailable'],
  ['unknown', 'UNCLASSIFIED', 'Unclassified failure'],
]) {
  test(`CLI ${scenario} output and exit status are characterized`, () => {
    const result = spawnSync(process.execPath, [path.join(__dirname, '../src/cli.js'), '--scenario', scenario], { input: JSON.stringify(rows), encoding: 'utf8' });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, JSON.stringify({ error: { code, message } }) + '\n');
  });
}

for (const [name, args, input, status, stdout, stderr] of [
  ['success', [], JSON.stringify(rows), 0, '{"imported":1}\n', ''],
  ['invalid rows', [], '[{}]', 1, '', '{"error":{"code":"INVALID_ORDER","message":"Invalid order rows"}}\n'],
  ['invalid JSON', [], '{', 1, '', '{"error":{"code":"INPUT_JSON","message":"Invalid JSON input"}}\n'],
  ['unknown argument', ['--invalid'], '[]', 1, '', '{"error":{"code":"USAGE","message":"Unsupported arguments"}}\n'],
]) {
  test(`CLI ${name} retains exact process-visible behavior`, () => {
    const result = spawnSync(process.execPath, [path.join(__dirname, '../src/cli.js'), ...args], { input, encoding: 'utf8' });
    assert.equal(result.status, status);
    assert.equal(result.stdout, stdout);
    assert.equal(result.stderr, stderr);
  });
}
