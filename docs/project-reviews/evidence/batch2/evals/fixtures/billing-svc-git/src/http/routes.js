'use strict';
const { createInvoice } = require('../invoices/create');

function handle(req) {
  try {
    if (req.method === 'POST' && req.path === '/invoices') {
      createInvoice(req.body);
      return { status: 201 };
    }
    return { status: 404 };
  } catch (err) {
    return { status: 500, error: err.message };
  }
}

module.exports = { handle };
