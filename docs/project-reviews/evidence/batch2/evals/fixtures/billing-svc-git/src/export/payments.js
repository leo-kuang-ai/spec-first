'use strict';
const { toCsv } = require('./csv');
const { formatAmount } = require('../ledger/money');
const { query } = require('../lib/db');

function exportPayments() {
  const rows = query('payments').sort((a, b) => a.id - b.id).map((p) => ({ ...p, amount: formatAmount(p.amount) }));
  return toCsv(rows, [{ key: 'id', header: 'ID' }, { key: 'paidAt', header: 'Paid At' }, { key: 'amount', header: 'Amount' }]);
}

function pagePayments(offset, limit) { return query('payments').sort((a, b) => a.id - b.id).slice(offset, offset + limit); }

module.exports = { exportPayments, pagePayments };
