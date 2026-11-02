'use strict';
const { withTx } = require('../lib/db');
const audit = require('../lib/audit');

function createInvoice({ id, customer, amount, items = [] }) {
  return withTx((tx) => {
    tx.insert('invoices', { id, customer, amount, items, status: 'open' });
    audit.record(tx, 'invoice.create', id);
    return id;
  });
}

module.exports = { createInvoice };
