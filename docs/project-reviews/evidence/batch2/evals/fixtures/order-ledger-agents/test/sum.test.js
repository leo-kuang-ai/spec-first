'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { total } = require('../src/sum');

test('total sums price * qty over items', () => {
  const orders = [
    { id: 1, items: [{ id: 'a', price: 5, qty: 2 }] },
    { id: 2, items: [{ id: 'b', price: 3, qty: 1 }] },
  ];
  assert.equal(total(orders), 13);
});
