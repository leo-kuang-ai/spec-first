'use strict';

const fs = require('node:fs');

function paymentStatus(order) {
  return order.refunds.length ? 'refund_complete' : 'paid';
}

function notify(file, paymentId, deduplicate) {
  const order = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!deduplicate || !order.refunds.includes(paymentId)) order.refunds.push(paymentId);
  fs.writeFileSync(file, JSON.stringify(order));
}

function writeRecord(file, revision) {
  const record = revision === 'legacy' ? { status: 'refunded' } : { refund_state: 'settled' };
  if (revision === 'dual') record.status = 'refunded';
  fs.writeFileSync(file, JSON.stringify(record));
}

function readRecord(file, revision) {
  const record = JSON.parse(fs.readFileSync(file, 'utf8'));
  return revision === 'legacy' ? record.status === 'refunded' : record.refund_state === 'settled' || record.status === 'refunded';
}

function route(file, url, bridge) {
  const state = paymentStatus(JSON.parse(fs.readFileSync(file, 'utf8')));
  if (url === '/v2/order') return { payment_state: state };
  if (url === '/v1/order') return { status: bridge && state === 'refund_complete' ? 'refunded' : state };
  throw Error(url);
}

module.exports = { writeRecord, readRecord, notify, route };
