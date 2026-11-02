'use strict';
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(process.argv[2]);
const { createLedger } = require(path.join(root, 'lib/ledger.cjs'));
const { createHandler } = require(path.join(root, 'lib/http.cjs'));
const { formatReceipt } = require(path.join(root, 'lib/receipt.cjs'));
const request = (tenantId, requestId = 'shared') => ({ tenantId, requestId, amountCents: 1250 });
const cases = {
  D1_amount_contract: async () => {
    const calls = [];
    const handle = createHandler(createLedger({ charge: async value => calls.push(value) }));
    await handle(request('a'));
    assert.equal(calls[0].amountCents, 1250);
  },
  D2_tenant_isolation: async () => {
    const calls = [];
    const handle = createHandler(createLedger({ charge: async value => calls.push(value) }));
    await handle(request('a'));
    await handle(request('b'));
    assert.deepEqual(calls.map(value => value.tenantId), ['a', 'b']);
  },
  D3_retry_after_failure: async () => {
    let calls = 0;
    const handle = createHandler(createLedger({ charge: async () => {
      calls += 1;
      if (calls === 1) throw new Error('transient provider failure');
    } }));
    await assert.rejects(handle(request('a')), /transient/);
    const retry = await handle(request('a'));
    assert.equal(calls, 2);
    assert.equal(retry.status, 'captured');
  },
  N1_formatting_preserved: async () => {
    for (const cents of [1, 99, 100, 1250, 90001]) {
      const receipt = {status: 'captured', chargedCents: cents};
      assert.equal(formatReceipt(receipt), `captured: ${(cents / 100).toFixed(2)}`);
    }
  },
};
(async () => {
  const results = {};
  for (const [id, run] of Object.entries(cases)) {
    try { await run(); results[id] = {passed:true}; }
    catch (error) { results[id] = {passed:false, detail:error.message}; }
  }
  console.log(JSON.stringify(results));
})();
