'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { applyDiscount } = require('../src/pricing/discount');
test('discount applies from 10000 cents inclusive', () => {
  assert.equal(applyDiscount(9999), 9999);
  assert.equal(applyDiscount(10000), 9000);
});
