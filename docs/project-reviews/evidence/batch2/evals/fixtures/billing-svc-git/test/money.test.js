'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { formatAmount } = require('../src/ledger/money');
test('ledger amount has two decimals and no symbol', () => {
  assert.equal(formatAmount(1230), '12.30');
  assert.equal(formatAmount(1234.6), '12.35');
});
