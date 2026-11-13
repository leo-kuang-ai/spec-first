'use strict';
// 满 100 元（含，即 10000 分）打九折。
function applyDiscount(cents) { return cents >= 10000 ? Math.round(cents * 0.9) : cents; }
module.exports = { applyDiscount };
