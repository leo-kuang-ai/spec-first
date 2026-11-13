'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../src/lib/db');
const { createInvoiceFromForm } = require('../src/invoices/fromForm');
test('form amount in yuan is stored as cents', () => {
  db.reset();
  createInvoiceFromForm({ id: 'f1', customer: 'c', amount: '12.30' });
  assert.equal(db.get('invoices', 'f1').amount, 1230);
});
