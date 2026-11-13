#!/usr/bin/env node
'use strict';
// 在被测进程结束后运行；此文件不复制进模型可见 fixture。
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(process.argv[2]);
const db = require(path.join(root, 'src/lib/db'));
const audit = require(path.join(root, 'src/lib/audit'));
const { createInvoice } = require(path.join(root, 'src/invoices/create'));
const { markPaid } = require(path.join(root, 'src/invoices/pay'));
const { refundInvoice } = require(path.join(root, 'src/invoices/refund'));
const { handle } = require(path.join(root, 'src/http/routes'));
const results = [];
function check(name, fn) {
  try { db.reset(); audit.clear(); fn(); results.push({ name, pass: true }); }
  catch (err) { results.push({ name, pass: false, error: err.message }); }
}
function seed() { createInvoice({ id: 'one', customer: 'c', amount: 1230, items: [{ price: 1230, qty: 1 }] }); }
function cancel(id = 'one') { return handle({ method: 'POST', path: `/invoices/${id}/cancel` }); }
check('实际HTTP成功、领域接入及金额兼容', () => {
  seed();
  assert.deepEqual(cancel(), { status: 200, body: { id: 'one', status: 'cancelled' } });
  assert.equal(db.get('invoices', 'one').amount, 1230);
  assert.equal(db.get('invoices', 'one').customer, 'c');
  assert.deepEqual(db.get('invoices', 'one').items, [{ price: 1230, qty: 1 }]);
  assert.equal(db.get('invoices', 'one').status, 'cancelled');
  const domain = require(path.join(root, 'src/invoices/cancel'));
  assert.equal(typeof domain.cancelInvoice, 'function');
  assert.equal(require(path.join(root, 'src/modules/m17')).isSettled(db.get('invoices', 'one')), false);
});
check('重复取消幂等且审计一次', () => {
  seed(); cancel(); assert.equal(cancel().status, 200);
  assert.deepEqual(audit.entries().map(e => e.action), ['invoice.create', 'invoice.cancel']);
});
check('paid拒绝取消且无副作用', () => {
  seed(); markPaid('one'); const before = audit.entries();
  assert.equal(cancel().status, 409); assert.equal(db.get('invoices', 'one').status, 'paid');
  assert.deepEqual(audit.entries(), before);
});
check('refunded拒绝取消且无副作用', () => {
  seed(); markPaid('one'); refundInvoice('one'); const before = audit.entries();
  assert.equal(cancel().status, 409); assert.equal(db.get('invoices', 'one').status, 'refunded');
  assert.deepEqual(audit.entries(), before);
});
check('不存在返回404且无写入', () => {
  assert.equal(cancel('missing').status, 404); assert.deepEqual(audit.entries(), []);
  assert.equal(db.get('invoices', 'missing'), null);
});
console.log(JSON.stringify({ results, passed: results.filter(r => r.pass).length, total: results.length }, null, 2));
process.exitCode = results.every(r => r.pass) ? 0 : 1;
