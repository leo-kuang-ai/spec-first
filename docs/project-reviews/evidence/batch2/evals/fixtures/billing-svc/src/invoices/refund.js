'use strict';
const { withTx, get } = require('../lib/db');
const audit = require('../lib/audit');

function refundInvoice(id) {
  const inv = get('invoices', id);
  if (!inv || inv.status !== 'paid') throw new Error('only paid invoices can be refunded');
  return withTx((tx) => {
    tx.update('invoices', id, { status: 'refunded' });
    audit.record(tx, 'invoice.refund', id);
  });
}

module.exports = { refundInvoice };
