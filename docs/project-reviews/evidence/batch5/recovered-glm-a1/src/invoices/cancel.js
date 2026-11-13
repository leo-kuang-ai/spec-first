'use strict';
const { withTx, get } = require('../lib/db');
const audit = require('../lib/audit');

function cancelInvoice(id) {
  const inv = get('invoices', id);
  if (!inv) {
    const err = new Error(`invoice ${id} not found`);
    err.code = 'not_found';
    throw err;
  }
  if (inv.status === 'paid' || inv.status === 'refunded') {
    const err = new Error(`invoice ${id} is ${inv.status} and cannot be cancelled`);
    err.code = 'invalid_state';
    throw err;
  }
  if (inv.status === 'cancelled') return { id, status: 'cancelled' };
  return withTx((tx) => {
    tx.update('invoices', id, { status: 'cancelled' });
    audit.record(tx, 'invoice.cancel', id);
    return { id, status: 'cancelled' };
  });
}

module.exports = { cancelInvoice };
