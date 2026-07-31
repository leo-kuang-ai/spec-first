'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { importOrders } = require('../src/order-importer');

test('forwards rows to the client', async () => {
  const rows = [{ id: 'o-1' }];
  const result = await importOrders(rows, { send: async (value) => value });
  assert.deepEqual(result, rows);
});
