'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { getOrderForUser } = require('../src/orders');

test('只返回当前租户的订单', () => {
  const orders = [{ id: 'o-1', tenantId: 'tenant-b' }];
  assert.equal(getOrderForUser(orders, 'o-1', { tenantId: 'tenant-a' }), null);
});
