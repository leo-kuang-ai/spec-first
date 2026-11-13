'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../src/lib/db');
const audit = require('../src/lib/audit');
const { createInvoice } = require('../src/invoices/create');
const { markPaid } = require('../src/invoices/pay');
const { refundInvoice } = require('../src/invoices/refund');

test('create, pay and refund write audit entries', () => {
  db.reset(); audit.clear();
  createInvoice({ id: 'a', customer: 'c', amount: 500 });
  markPaid('a'); refundInvoice('a');
  assert.equal(db.get('invoices', 'a').status, 'refunded');
  assert.deepEqual(audit.entries().map((e) => e.action), ['invoice.create', 'invoice.pay', 'invoice.refund']);
});
