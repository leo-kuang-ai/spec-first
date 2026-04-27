'use strict';

/**
 * CRG SQLite schema 初始化与版本管理
 *
 * 调用方式：
 *   const { initDatabase } = require('./migrations');
 *   const db = initDatabase('/path/to/graph.db');
 *
 * 注意：better-sqlite3 在 Unit 2 阶段尚未 npm install，
 * require('better-sqlite3') 是运行时行为，编写阶段不需要可运行。
 */

const SCHEMA_VERSION = 'crg-cli/v1';

/**
 * 所有 DDL 语句（按依赖顺序排列）
 * communities 须先于 nodes 创建（nodes 外键引用 communities.id）
 */
const DDL_STATEMENTS = [
  // PRAGMA 设置
  `PRAGMA foreign_keys = ON`,
  `PRAGMA journal_mode = WAL`,
  `PRAGMA synchronous = NORMAL`,
  `PRAGMA cache_size = -64000`,
  `PRAGMA temp_store = MEMORY`,
  `PRAGMA mmap_size = 268435456`,

  // communities 表（先建，供 nodes 外键引用）
  `CREATE TABLE IF NOT EXISTS communities (
    id TEXT PRIMARY KEY,
    label TEXT,
    file_count INTEGER DEFAULT 0,
    health_status TEXT CHECK (health_status IN ('healthy', 'isolated', 'fragmented', 'scattered') OR health_status IS NULL),
    health_density REAL,
    health_independence REAL,
    algorithm TEXT DEFAULT 'directory',
    community_source TEXT DEFAULT 'directory',
    cohesion REAL,
    health_note TEXT
  )`,

  // nodes 表
  `CREATE TABLE IF NOT EXISTS nodes (
    id TEXT PRIMARY KEY,
    file_path TEXT NOT NULL,
    name TEXT NOT NULL,
    kind TEXT NOT NULL,
    line_start INTEGER,
    line_end INTEGER,
    is_test INTEGER DEFAULT 0,
    generation_id TEXT,
    parser_quality TEXT DEFAULT 'ok',
    summary TEXT,
    retrieval_text TEXT,
    community_id TEXT,
    confidence TEXT DEFAULT 'Observed',
    source_tier TEXT DEFAULT 'crg_ast',
    evidence TEXT DEFAULT '[]',
    inference_reason TEXT,
    FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE SET NULL
  )`,

  // edges 表
  `CREATE TABLE IF NOT EXISTS edges (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    weight REAL DEFAULT 1.0,
    confidence TEXT DEFAULT 'Inferred',
    resolution_method TEXT,
    evidence TEXT DEFAULT '[]',
    inference_reason TEXT,
    FOREIGN KEY (source_id) REFERENCES nodes(id) ON DELETE CASCADE,
    FOREIGN KEY (target_id) REFERENCES nodes(id) ON DELETE CASCADE
  )`,

  // flows 表
  `CREATE TABLE IF NOT EXISTS flows (
    id TEXT PRIMARY KEY,
    entry_node_id TEXT,
    name TEXT,
    criticality REAL DEFAULT 0.0,
    node_count INTEGER DEFAULT 0,
    depth INTEGER DEFAULT 0,
    entry_source TEXT,
    entry_confidence TEXT DEFAULT 'Inferred',
    entry_evidence TEXT DEFAULT '[]',
    entry_inference_reason TEXT,
    truncated INTEGER DEFAULT 0,
    truncation_reason TEXT,
    max_depth INTEGER DEFAULT 5,
    max_nodes INTEGER DEFAULT 20,
    FOREIGN KEY (entry_node_id) REFERENCES nodes(id) ON DELETE SET NULL
  )`,

  // flow_nodes 表（flow 和 node 的多对多）
  `CREATE TABLE IF NOT EXISTS flow_nodes (
    flow_id TEXT NOT NULL,
    node_id TEXT NOT NULL,
    position INTEGER DEFAULT 0,
    PRIMARY KEY (flow_id, node_id),
    FOREIGN KEY (flow_id) REFERENCES flows(id) ON DELETE CASCADE,
    FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE
  )`,

  // graph_meta 表（单行，强制 id=1）
  `CREATE TABLE IF NOT EXISTS graph_meta (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    schema_version TEXT DEFAULT 'crg-cli/v1',
    last_built TEXT,
    analyzer_version TEXT,
    unresolved_edge_count INTEGER DEFAULT 0
  )`,

  // fingerprints 表（文件 SHA 增量检测）
  `CREATE TABLE IF NOT EXISTS fingerprints (
    file_path TEXT PRIMARY KEY,
    sha256 TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,

  // unresolved_edges 表（最近一次 build 的 unresolved 明细，便于审计和治理）
  `CREATE TABLE IF NOT EXISTS unresolved_edges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_id TEXT NOT NULL,
    source_file TEXT NOT NULL,
    edge_kind TEXT NOT NULL,
    target_name TEXT,
    target_path_raw TEXT,
    target_category TEXT,
    target_package_root TEXT,
    reason TEXT,
    confidence TEXT DEFAULT 'Unknown',
    resolution_method TEXT DEFAULT 'unresolved',
    evidence TEXT DEFAULT '[]'
  )`,

  `CREATE TABLE IF NOT EXISTS chunks (
    id TEXT PRIMARY KEY,
    node_id TEXT NOT NULL,
    parent_symbol_id TEXT NOT NULL,
    generation_id TEXT,
    file_path TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'chunk',
    name TEXT NOT NULL,
    line_start INTEGER,
    line_end INTEGER,
    summary TEXT,
    retrieval_text TEXT,
    FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE
  )`,

  // FTS5 虚表（全文搜索，独立存储，不使用 content= 外部内容表）
  // 注意：content=nodes 方案要求 FTS 列名与 nodes 表列名严格对应；
  //       独立 FTS 更简单，rebuildFTS 负责全量重建保持一致。
  `CREATE VIRTUAL TABLE IF NOT EXISTS fts_nodes USING fts5(
    node_id UNINDEXED,
    name,
    retrieval_text,
    file_path UNINDEXED,
    kind UNINDEXED
  )`,

  // 索引
  `CREATE INDEX IF NOT EXISTS idx_nodes_file_path ON nodes(file_path)`,
  `CREATE INDEX IF NOT EXISTS idx_nodes_name ON nodes(name)`,
  `CREATE INDEX IF NOT EXISTS idx_nodes_kind ON nodes(kind)`,
  // Pass5 community 传播：WHERE file_path = ? AND kind = 'module' → 覆盖索引，避免全表扫描
  `CREATE INDEX IF NOT EXISTS idx_nodes_file_path_kind ON nodes(file_path, kind)`,
  // F3 测试覆盖：JOIN nodes ON is_test = 1 → 过滤测试节点
  `CREATE INDEX IF NOT EXISTS idx_nodes_is_test ON nodes(is_test)`,
  `CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source_id)`,
  `CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target_id)`,
  `CREATE INDEX IF NOT EXISTS idx_edges_source_kind ON edges(source_id, kind)`,
  `CREATE INDEX IF NOT EXISTS idx_edges_target_kind ON edges(target_id, kind)`,
  // F3/F5 assessNodeRisk：edges WHERE kind IN ('calls','imports_from') 过滤
  `CREATE INDEX IF NOT EXISTS idx_edges_kind ON edges(kind)`,
  `CREATE INDEX IF NOT EXISTS idx_unresolved_edges_source_file ON unresolved_edges(source_file)`,
  `CREATE INDEX IF NOT EXISTS idx_unresolved_edges_source_id ON unresolved_edges(source_id)`,
  `CREATE INDEX IF NOT EXISTS idx_unresolved_edges_kind ON unresolved_edges(edge_kind)`,
  `CREATE INDEX IF NOT EXISTS idx_unresolved_edges_target_path ON unresolved_edges(target_path_raw)`,
  `CREATE INDEX IF NOT EXISTS idx_chunks_node_id ON chunks(node_id)`,
  `CREATE INDEX IF NOT EXISTS idx_chunks_file_path ON chunks(file_path)`,
];

/**
 * 初始化 CRG SQLite 数据库
 *
 * @param {string} dbPath  数据库文件路径（不存在时自动创建）
 * @returns {import('better-sqlite3').Database} better-sqlite3 db 实例
 */
function initDatabase(dbPath) {
  let Database;
  try {
    Database = require('better-sqlite3');
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      process.stderr.write(
        'error: CRG native module (better-sqlite3) not installed. Run: npm install\n'
      );
      process.exit(2);
    }
    throw err;
  }

  const db = new Database(dbPath);

  // 执行所有 DDL 语句
  for (const sql of DDL_STATEMENTS) {
    db.exec(sql);
  }

  function addMissingColumns(tableName, columns) {
    const existing = db.prepare(`PRAGMA table_info(${tableName})`).all().map((column) => column.name);
    for (const column of columns) {
      if (!existing.includes(column.name)) {
        db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${column.ddl}`);
      }
    }
  }

  // 迁移：检测旧版 content=nodes 的 fts_nodes（列名 node_id 与 nodes.id 不匹配）
  // 若 SQL 定义含 content=nodes，则 DROP 重建为独立 FTS5 表
  const ftsMeta = db
    .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='fts_nodes'")
    .get();
  if (ftsMeta && ftsMeta.sql && (
    ftsMeta.sql.includes('content=nodes') ||
    !ftsMeta.sql.includes('retrieval_text')
  )) {
    db.exec('DROP TABLE IF EXISTS fts_nodes');
    db.exec(`CREATE VIRTUAL TABLE fts_nodes USING fts5(
      node_id UNINDEXED,
      name,
      retrieval_text,
      file_path UNINDEXED,
      kind UNINDEXED
    )`);
  }

  // 迁移：flows 表若缺 name/depth 列，则补列（ADD COLUMN，不破坏现有数据）
  const flowsMeta = db
    .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='flows'")
    .get();
  if (flowsMeta && flowsMeta.sql) {
    if (!flowsMeta.sql.includes('"name"') && !flowsMeta.sql.includes(' name ')) {
      db.exec('ALTER TABLE flows ADD COLUMN name TEXT');
    }
    if (!flowsMeta.sql.includes('"depth"') && !flowsMeta.sql.includes(' depth ')) {
      db.exec('ALTER TABLE flows ADD COLUMN depth INTEGER DEFAULT 0');
    }
  }
  addMissingColumns('flows', [
    { name: 'entry_source', ddl: 'entry_source TEXT' },
    { name: 'entry_confidence', ddl: "entry_confidence TEXT DEFAULT 'Inferred'" },
    { name: 'entry_evidence', ddl: "entry_evidence TEXT DEFAULT '[]'" },
    { name: 'entry_inference_reason', ddl: 'entry_inference_reason TEXT' },
    { name: 'truncated', ddl: 'truncated INTEGER DEFAULT 0' },
    { name: 'truncation_reason', ddl: 'truncation_reason TEXT' },
    { name: 'max_depth', ddl: 'max_depth INTEGER DEFAULT 5' },
    { name: 'max_nodes', ddl: 'max_nodes INTEGER DEFAULT 20' },
  ]);

  addMissingColumns('edges', [
    { name: 'confidence', ddl: "confidence TEXT DEFAULT 'Inferred'" },
    { name: 'resolution_method', ddl: 'resolution_method TEXT' },
    { name: 'evidence', ddl: "evidence TEXT DEFAULT '[]'" },
    { name: 'inference_reason', ddl: 'inference_reason TEXT' },
  ]);

  addMissingColumns('unresolved_edges', [
    { name: 'target_category', ddl: 'target_category TEXT' },
    { name: 'target_package_root', ddl: 'target_package_root TEXT' },
    { name: 'reason', ddl: 'reason TEXT' },
    { name: 'confidence', ddl: "confidence TEXT DEFAULT 'Unknown'" },
    { name: 'resolution_method', ddl: "resolution_method TEXT DEFAULT 'unresolved'" },
    { name: 'evidence', ddl: "evidence TEXT DEFAULT '[]'" },
  ]);
  db.exec('CREATE INDEX IF NOT EXISTS idx_unresolved_edges_target_category ON unresolved_edges(target_category)');

  const nodeColumns = db.prepare(`PRAGMA table_info(nodes)`).all().map((column) => column.name);
  if (!nodeColumns.includes('generation_id')) {
    db.exec('ALTER TABLE nodes ADD COLUMN generation_id TEXT');
  }
  if (!nodeColumns.includes('parser_quality')) {
    db.exec(`ALTER TABLE nodes ADD COLUMN parser_quality TEXT DEFAULT 'ok'`);
  }
  if (!nodeColumns.includes('summary')) {
    db.exec('ALTER TABLE nodes ADD COLUMN summary TEXT');
  }
  if (!nodeColumns.includes('retrieval_text')) {
    db.exec('ALTER TABLE nodes ADD COLUMN retrieval_text TEXT');
  }
  const chunkMeta = db
    .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='chunks'")
    .get();
  if (!chunkMeta) {
    db.exec(`CREATE TABLE chunks (
      id TEXT PRIMARY KEY,
      node_id TEXT NOT NULL,
      parent_symbol_id TEXT NOT NULL,
      generation_id TEXT,
      file_path TEXT NOT NULL,
      kind TEXT NOT NULL DEFAULT 'chunk',
      name TEXT NOT NULL,
      line_start INTEGER,
      line_end INTEGER,
      summary TEXT,
      retrieval_text TEXT,
      FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE
    )`);
    db.exec('CREATE INDEX IF NOT EXISTS idx_chunks_node_id ON chunks(node_id)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_chunks_file_path ON chunks(file_path)');
  }

  // 迁移：communities 表若无 CHECK 约束，则重建以添加 health_status CHECK
  const commMeta = db
    .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='communities'")
    .get();
  if (commMeta && commMeta.sql && !commMeta.sql.includes('CHECK')) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS communities_new (
        id TEXT PRIMARY KEY,
        label TEXT,
        file_count INTEGER DEFAULT 0,
        health_status TEXT CHECK (health_status IN ('healthy', 'isolated', 'fragmented', 'scattered') OR health_status IS NULL),
        health_density REAL,
        health_independence REAL,
        algorithm TEXT DEFAULT 'directory',
        community_source TEXT DEFAULT 'directory',
        cohesion REAL,
        health_note TEXT
      )
    `);
    db.exec(`
      INSERT OR IGNORE INTO communities_new (id, label, file_count, health_status, health_density, health_independence)
      SELECT id, label, file_count, health_status, health_density, health_independence FROM communities
    `);
    db.exec(`DROP TABLE communities`);
    db.exec(`ALTER TABLE communities_new RENAME TO communities`);
  }
  addMissingColumns('communities', [
    { name: 'algorithm', ddl: "algorithm TEXT DEFAULT 'directory'" },
    { name: 'community_source', ddl: "community_source TEXT DEFAULT 'directory'" },
    { name: 'cohesion', ddl: 'cohesion REAL' },
    { name: 'health_note', ddl: 'health_note TEXT' },
  ]);

  // 确保 graph_meta 单行存在（schema 版本写入）
  db.prepare(
    `INSERT OR IGNORE INTO graph_meta (id, schema_version) VALUES (1, ?)`
  ).run(SCHEMA_VERSION);

  return db;
}

module.exports = { initDatabase, SCHEMA_VERSION };
