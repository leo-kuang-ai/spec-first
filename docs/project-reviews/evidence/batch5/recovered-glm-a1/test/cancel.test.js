'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const db = require('../src/lib/db');
const audit = require('../src/lib/audit');
const { createInvoice } = require('../src/invoices/create');
const { markPaid } = require('../src/invoices/pay');
const { refundInvoice } = require('../src/invoices/refund');
const { cancelInvoice } = require('../src/invoices/cancel');
const { handle } = require('../src/http/routes');
const { isSettled } = require('../src/modules/m17');

function openInvoice(id) {
  createInvoice({ id, customer: 'cust-1', amount: 9900, items: [{ sku: 'x', qty: 2, price: 4950 }] });
}

test('open invoice is cancelled once with a single audit entry and unchanged fields', () => {
  db.reset(); audit.clear();
  openInvoice('c1');
  const result = cancelInvoice('c1');
  const after = db.get('invoices', 'c1');
  assert.deepEqual(result, { id: 'c1', status: 'cancelled' });
  assert.equal(after.status, 'cancelled');
  assert.equal(after.customer, 'cust-1');
  assert.equal(after.amount, 9900);
  assert.deepEqual(after.items, [{ sku: 'x', qty: 2, price: 4950 }]);
  assert.deepEqual(
    audit.entries().filter((e) => e.action === 'invoice.cancel'),
    [{ action: 'invoice.cancel', entityId: 'c1' }]
  );
});

test('cancelling an already cancelled invoice succeeds without a second audit entry', () => {
  db.reset(); audit.clear();
  openInvoice('c2');
  const first = cancelInvoice('c2');
  const second = cancelInvoice('c2');
  assert.deepEqual(first, { id: 'c2', status: 'cancelled' });
  assert.deepEqual(second, { id: 'c2', status: 'cancelled' });
  assert.equal(audit.entries().filter((e) => e.action === 'invoice.cancel').length, 1);
  assert.equal(db.get('invoices', 'c2').status, 'cancelled');
});

test('paid and refunded invoices cannot be cancelled', () => {
  db.reset(); audit.clear();
  openInvoice('c3'); markPaid('c3');
  assert.throws(() => cancelInvoice('c3'), (err) => err.code === 'invalid_state');
  assert.equal(db.get('invoices', 'c3').status, 'paid');
  openInvoice('c4'); markPaid('c4'); refundInvoice('c4');
  assert.throws(() => cancelInvoice('c4'), (err) => err.code === 'invalid_state');
  assert.equal(db.get('invoices', 'c4').status, 'refunded');
  assert.equal(audit.entries().filter((e) => e.action === 'invoice.cancel').length, 0);
});

test('missing invoice cannot be cancelled', () => {
  db.reset(); audit.clear();
  assert.throws(() => cancelInvoice('nope'), (err) => err.code === 'not_found');
  assert.equal(audit.entries().length, 0);
});

test('POST /invoices/:id/cancel maps domain outcomes to status codes', () => {
  db.reset(); audit.clear();
  openInvoice('h1');
  assert.deepEqual(handle({ method: 'POST', path: '/invoices/h1/cancel' }), {
    status: 200,
    body: { id: 'h1', status: 'cancelled' },
  });
  assert.deepEqual(handle({ method: 'POST', path: '/invoices/h1/cancel' }), {
    status: 200,
    body: { id: 'h1', status: 'cancelled' },
  });
  assert.equal(audit.entries().filter((e) => e.action === 'invoice.cancel').length, 1);
  openInvoice('h2'); markPaid('h2');
  const conflict = handle({ method: 'POST', path: '/invoices/h2/cancel' });
  assert.equal(conflict.status, 409);
  assert.equal(db.get('invoices', 'h2').status, 'paid');
  assert.equal(handle({ method: 'POST', path: '/invoices/missing/cancel' }).status, 404);
});

test('existing routes and settled reporting stay compatible with cancellation', () => {
  db.reset(); audit.clear();
  assert.deepEqual(handle({ method: 'POST', path: '/invoices', body: { id: 'r1', customer: 'c', amount: 100 } }), { status: 201 });
  cancelInvoice('r1');
  assert.equal(isSettled(db.get('invoices', 'r1')), false);
  openInvoice('r2'); markPaid('r2');
  assert.equal(isSettled(db.get('invoices', 'r2')), true);
});
