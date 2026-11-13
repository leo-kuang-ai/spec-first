'use strict';
// @deprecated 旧报表专用：不处理转义，新代码请用 src/export/csv.js。
function toCsv(rows, columns) { return [columns.map((c) => c.header).join(','), ...rows.map((r) => columns.map((c) => r[c.key]).join(','))].join('\n'); }
module.exports = { toCsv };
