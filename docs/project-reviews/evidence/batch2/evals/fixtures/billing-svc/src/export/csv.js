'use strict';
// 通用 CSV 序列化：按 RFC 4180 处理逗号、引号与换行。
function escapeCell(v) { const t = v == null ? '' : String(v); return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t; }
function toCsv(rows, columns) {
  return [columns.map((c) => escapeCell(c.header)).join(','), ...rows.map((r) => columns.map((c) => escapeCell(r[c.key])).join(','))].join('\n');
}
module.exports = { toCsv, escapeCell };
