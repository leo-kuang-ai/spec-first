'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { total } = require('../src/ledger/total');
test('total sums price * qty', () => {
  assert.equal(total({ items: [{ price: 500, qty: 2 }, { price: 300, qty: 1 }] }), 1300);
});
