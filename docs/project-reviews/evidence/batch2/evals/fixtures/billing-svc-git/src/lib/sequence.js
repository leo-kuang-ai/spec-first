'use strict';
let next = 1000;
// 发票号必须由 nextInvoiceNo 分配，不要用 max+1 推算。
function nextInvoiceNo() { next += 1; return `INV-${next}`; }
module.exports = { nextInvoiceNo };
