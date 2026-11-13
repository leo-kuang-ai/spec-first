'use strict';
const { assertPositiveCents } = require('../validate');
const { createInvoice } = require('./create');

// 表单金额是“元”字符串（如 "12.30"），存储使用整数分。
function createInvoiceFromForm(form) {
  const amount = Math.round(parseFloat(form.amount) * 100);
  assertPositiveCents(amount);
  return createInvoice({ id: form.id, customer: form.customer, amount });
}

module.exports = { createInvoiceFromForm };
