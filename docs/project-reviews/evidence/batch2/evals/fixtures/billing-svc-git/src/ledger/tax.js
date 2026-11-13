'use strict';
function tax(invoice, rate) { return Math.round(invoice.items.reduce((s, i) => s + i.price * i.qty, 0) * rate); }
module.exports = { tax };
