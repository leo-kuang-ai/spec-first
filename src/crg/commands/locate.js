'use strict';

const { openDb } = require('../cli/open-db');
const { makeEnvelope } = require('../cli/envelope');
const { searchNodes } = require('../search');
const { tokenizeQuery } = require('../retrieval/tokenize');

function parseArgs(argv) {
  const options = { query: '', limit: 10, detail: 'minimal' };
  for (const arg of argv) {
    if (arg.startsWith('--query=')) options.query = arg.slice('--query='.length);
    else if (arg.startsWith('--limit=')) options.limit = Math.max(1, Math.min(parseInt(arg.slice('--limit='.length), 10) || 10, 50));
    else if (arg.startsWith('--detail=')) options.detail = arg.slice('--detail='.length);
  }
  return options;
}

function candidateFromNode(node, score, evidence, detail) {
  const item = {
    id: node.id || node.node_id,
    name: node.name,
    file_path: node.file_path,
    kind: node.kind,
    score,
    decision_input_kind: 'inferred',
    confidence: 'Inferred',
    source_tier: 'crg_ast',
    evidence,
    inference_reason: 'directory_proximity',
  };
  if (detail === 'standard') {
    item.line_start = node.line_start || null;
    item.line_end = node.line_end || null;
    item.score_breakdown = evidence;
    item.snippet = node.snippet || node.retrieval_text || null;
  }
  return item;
}

function run(argv) {
  const options = parseArgs(argv);
  if (!options.query.trim()) {
    process.stderr.write('error: --query=<keywords> is required\n');
    process.exit(1);
  }
  if (!['minimal', 'standard'].includes(options.detail)) {
    process.stderr.write('error: --detail must be minimal or standard\n');
    process.exit(1);
  }

  const { db, repoRoot } = openDb(argv);
  const candidates = new Map();
  const query = options.query.trim();

  const addCandidate = (node, score, evidence) => {
    const id = node.id || node.node_id;
    if (!id) return;
    const existing = candidates.get(id);
    if (!existing || existing.score < score) {
      candidates.set(id, candidateFromNode(node, score, evidence, options.detail));
    }
  };

  const exactQueries = [
    { sql: 'SELECT id, name, file_path, kind, line_start, line_end, retrieval_text FROM nodes WHERE id = ? LIMIT ?', evidence: 'exact id match' },
    { sql: 'SELECT id, name, file_path, kind, line_start, line_end, retrieval_text FROM nodes WHERE name = ? LIMIT ?', evidence: 'exact name match' },
    { sql: 'SELECT id, name, file_path, kind, line_start, line_end, retrieval_text FROM nodes WHERE file_path = ? LIMIT ?', evidence: 'exact path match' },
  ];
  for (const exact of exactQueries) {
    for (const row of db.prepare(exact.sql).all(query, options.limit)) {
      addCandidate(row, 100, [exact.evidence]);
    }
  }

  const lexicalTerms = [...new Set([query, ...tokenizeQuery(query).filter((term) => term.length >= 3)])];
  for (let termIndex = 0; termIndex < lexicalTerms.length; termIndex++) {
    const term = lexicalTerms[termIndex];
    const like = `%${term.replace(/[%_]/g, '')}%`;
    const lexicalRows = db.prepare(`
      SELECT id, name, file_path, kind, line_start, line_end, retrieval_text
      FROM nodes
      WHERE name LIKE ? OR file_path LIKE ? OR retrieval_text LIKE ?
      LIMIT ?
    `).all(like, like, like, options.limit * 2);
    for (const row of lexicalRows) {
      addCandidate(
        row,
        row.file_path === query ? 95 : (term === query ? 70 : Math.max(62, 68 - termIndex * 2)),
        [term === query ? 'lexical name/path match' : `lexical token match: ${term}`]
      );
    }
  }

  for (const row of searchNodes(db, query, { limit: options.limit * 2 })) {
    addCandidate({
      id: row.node_id,
      name: row.name,
      file_path: row.file_path,
      kind: row.kind,
      retrieval_text: row.snippet,
      snippet: row.snippet,
    }, 50 + Math.min(row.score || 0, 20), row.matched_terms && row.matched_terms.length > 0
      ? row.matched_terms.map((term) => `fts token match: ${term}`)
      : ['fts retrieval_text match']);
  }

  const items = Array.from(candidates.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit);

  db.close();

  process.stdout.write(JSON.stringify(makeEnvelope(repoRoot, {
    query,
    detail_profile: options.detail,
    candidates: items,
    alternatives: items.slice(1),
    limitations: items.length === 0
      ? [{ code: 'no-locate-results', message: 'No CRG candidates matched the query.' }]
      : [],
  })) + '\n');
}

module.exports = { run };
