'use strict';

// 通用 CSV 序列化：columns 为 [{ key, header }]，按 RFC 4180 处理逗号、引号与换行。
function escapeCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(rows, columns) {
  const header = columns.map((c) => escapeCell(c.header)).join(',');
  const body = rows.map((row) => columns.map((c) => escapeCell(row[c.key])).join(','));
  return [header, ...body].join('\n');
}

module.exports = { toCsv, escapeCell };
