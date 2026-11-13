'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createLedger } = require('../lib/ledger.cjs');
const { createHandler } = require('../lib/http.cjs');
const { formatReceipt } = require('../lib/receipt.cjs');
test('single request completes and repeated request is stable', async () => {
  let calls = 0;
  const handle = createHandler(createLedger({ charge: async () => { calls += 1; } }));
  const request = { tenantId: 'one', requestId: 'r1', amountCents: 1250 };
  const first = await handle(request);
  assert.equal(first.status, 'captured');
  assert.deepEqual(await handle(request), first);
  assert.equal(calls, 1);
});
test('receipt formatting', () => {
  assert.equal(formatReceipt({status:'captured', chargedCents:1250}), 'captured: 12.50');
});
