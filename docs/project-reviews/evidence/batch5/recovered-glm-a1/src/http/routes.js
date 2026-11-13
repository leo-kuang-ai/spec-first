'use strict';
const { createInvoice } = require('../invoices/create');
const { cancelInvoice } = require('../invoices/cancel');

// cancel 领域错误的 code -> HTTP 状态映射；其余错误维持 500。
const cancelErrorStatus = { not_found: 404, invalid_state: 409 };

function handle(req) {
  try {
    if (req.method === 'POST' && req.path === '/invoices') {
      createInvoice(req.body);
      return { status: 201 };
    }
    const cancel = req.method === 'POST' && /^\/invoices\/([^/]+)\/cancel$/.exec(req.path);
    if (cancel) {
      return { status: 200, body: cancelInvoice(cancel[1]) };
    }
    return { status: 404 };
  } catch (err) {
    if (cancelErrorStatus[err.code]) return { status: cancelErrorStatus[err.code], error: err.message };
    return { status: 500, error: err.message };
  }
}

module.exports = { handle };
