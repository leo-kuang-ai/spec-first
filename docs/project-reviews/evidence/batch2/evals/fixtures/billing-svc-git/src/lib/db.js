'use strict';
// 内存存储。读用 query/get；写操作必须经 withTx（参照 src/invoices/refund.js），
// withTx 提交时刷新审计日志。_rawUpdate 会绕过审计，仅供数据迁移脚本使用。
const tables = { invoices: new Map(), payments: new Map() };

function query(table) { return [...tables[table].values()].map((r) => ({ ...r })); }
function get(table, id) { const r = tables[table].get(id); return r ? { ...r } : null; }
function _rawUpdate(table, id, patch) { tables[table].set(id, { ...tables[table].get(id), ...patch }); }

function withTx(fn) {
  const pending = [];
  const tx = {
    events: [],
    insert(table, row) { pending.push(() => tables[table].set(row.id, { ...row })); },
    update(table, id, patch) { pending.push(() => _rawUpdate(table, id, patch)); },
  };
  const result = fn(tx);
  for (const op of pending) op();
  require('./audit').flush(tx.events);
  return result;
}

function reset() { for (const t of Object.values(tables)) t.clear(); }

module.exports = { query, get, withTx, _rawUpdate, reset };
