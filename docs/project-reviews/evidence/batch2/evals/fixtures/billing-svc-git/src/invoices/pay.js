'use strict';
const { withTx } = require('../lib/db');
const audit = require('../lib/audit');

function markPaid(id) {
  return withTx((tx) => {
    tx.update('invoices', id, { status: 'paid' });
    audit.record(tx, 'invoice.pay', id);
  });
}

module.exports = { markPaid };
