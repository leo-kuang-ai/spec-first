'use strict';
function total(invoice) { return invoice.items.reduce((s, i) => s + i.price * i.qty, 0); }
module.exports = { total };
