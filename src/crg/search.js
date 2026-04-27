'use strict';

/**
 * CRG FTS5 全文搜索模块
 *
 * 功能：
 *   - searchNodes: 关键词检索（FTS5 MATCH，支持 kind 过滤和 limit 限制）
 *   - rebuildFTS: 重建 fts_nodes 虚表索引（含 SENSITIVE_PATTERNS 二次校验）
 *
 * 注意：fts_nodes 是 content= 虚表，需要手动维护同步；
 * 每次 postprocess 结束后调用 rebuildFTS 全量重建，保证索引最新。
 */

const path = require('path');
const { tokenizeQuery } = require('./retrieval/tokenize');

function buildSearchTerms(keyword) {
  const normalized = String(keyword || '').trim();
  if (!normalized) return [];
  const tokens = tokenizeQuery(normalized).filter((term) => term.length >= 3);
  if (tokens.length <= 1) return [normalized];
  return [...new Set([normalized, ...tokens])];
}

function runFtsQuery(db, keyword, { kind, limit }) {
  // 将关键词包裹为 FTS5 短语查询（去除双引号），防止 NOT/NEAR/column-filter 操作符注入
  const safeKeyword = '"' + keyword.replace(/"/g, '') + '"';

  // bm25(fts_nodes) 返回负值（越负越相关），取负后转为正分便于消费者排序
  let whereClause = 'WHERE fts_nodes MATCH ?';
  const params = [safeKeyword];

  if (kind) {
    whereClause += ' AND n.kind = ?';
    params.push(kind);
  }

  const sql = `
    SELECT n.id AS node_id, n.name, n.file_path, n.kind, n.retrieval_text,
           -bm25(fts_nodes) AS score
    FROM fts_nodes f
    JOIN nodes n ON f.node_id = n.id
    ${whereClause}
    ORDER BY score DESC
    LIMIT ?
  `;
  params.push(limit);

  return db.prepare(sql).all(...params);
}

/**
 * 关键词搜索（FTS5 MATCH）
 *
 * @param {import('better-sqlite3').Database} db
 * @param {string} keyword - FTS5 查询关键词（支持 AND/OR/前缀* 等 FTS5 语法）
 * @param {object} [options]
 * @param {string} [options.kind] - 过滤 kind（如 'function', 'class'）
 * @param {number} [options.limit=20] - 最大返回数
 * @returns {Array<{ node_id: string, name: string, file_path: string, kind: string, score: number, snippet: string }>}
 */
function searchNodes(db, keyword, { kind, limit = 20 } = {}) {
  if (!keyword || !keyword.trim()) return [];

  try {
    const terms = buildSearchTerms(keyword);
    const candidates = new Map();
    terms.forEach((term, index) => {
      const rows = runFtsQuery(db, term, { kind, limit: limit * 2 });
      for (const row of rows) {
        const existing = candidates.get(row.node_id);
        const score = (row.score || 0) + (terms.length - index) * 0.01;
        if (!existing) {
          candidates.set(row.node_id, {
            ...row,
            score,
            matched_terms: [term],
          });
        } else {
          existing.score += score;
          existing.matched_terms = [...new Set([...(existing.matched_terms || []), term])];
        }
      }
    });

    // snippet：搜索结果无存储代码文本，以 "kind: name" 作为上下文摘要
    return [...candidates.values()]
      .sort((left, right) => right.score - left.score)
      .slice(0, limit)
      .map(row => ({
        ...row,
        score: Math.round(row.score * 1000) / 1000,
        snippet: row.retrieval_text || `${row.kind}: ${row.name}`,
      }));
  } catch (err) {
    // FTS5 查询语法错误時，返回空结果而非崩溃
    if (err.message && err.message.includes('fts5')) {
      return [];
    }
    throw err;
  }
}

/**
 * 重建 FTS5 索引（全量重建）
 *
 * 重建前对每条 node 的 file_path 执行 SENSITIVE_PATTERNS 二次校验，
 * 阻止敏感文件被写入全文索引。
 *
 * @param {import('better-sqlite3').Database} db
 * @returns {{ indexed_count: number, skipped_count: number }}
 */
function rebuildFTS(db) {
  // 延迟 require，避免循环依赖（isSensitiveFile 与本模块无依赖关系）
  const { isSensitiveFile } = require('./input-convergence');

  // Drop + recreate：DDL 必须在事务外执行（better-sqlite3 限制）
  // 比 DELETE 更安全：避免旧版 content=nodes 表在删除时触发内容回查报错
  db.exec('DROP TABLE IF EXISTS fts_nodes');
  db.exec(`CREATE VIRTUAL TABLE fts_nodes USING fts5(
    node_id UNINDEXED,
    name,
    retrieval_text,
    file_path UNINDEXED,
    kind UNINDEXED
  )`);

  // 获取所有节点（drop-recreate 后 prepare 语句需在 recreate 之后准备）
  const nodes = db.prepare(
    'SELECT id, name, retrieval_text, file_path, kind FROM nodes'
  ).all();

  let indexedCount = 0;
  let skippedCount = 0;

  const insertStmt = db.prepare(
    'INSERT INTO fts_nodes (node_id, name, retrieval_text, file_path, kind) VALUES (?, ?, ?, ?, ?)'
  );

  // 批量插入放在事务中提升性能
  const insertAll = db.transaction(() => {
    for (const node of nodes) {
      // 二次 SENSITIVE_PATTERNS 安全校验（使用 basename）
      const basename = path.basename(node.file_path);
      if (isSensitiveFile(basename)) {
        skippedCount++;
        continue;
      }
      insertStmt.run(
        node.id,
        node.name,
        node.retrieval_text || `${node.file_path} ${node.kind} ${node.name}`,
        node.file_path,
        node.kind
      );
      indexedCount++;
    }
  });

  insertAll();

  return { indexed_count: indexedCount, skipped_count: skippedCount };
}

module.exports = { searchNodes, rebuildFTS };
