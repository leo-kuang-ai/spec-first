'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const { initDatabase } = require('../../src/crg/migrations');

describe('crg migrations', () => {
  test('初始化时会设置 CRG 查询热点需要的 pragma', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crg-migrations-pragmas-'));
    const db = initDatabase(path.join(tmpDir, 'graph.db'));

    try {
      expect(db.pragma('synchronous', { simple: true })).toBe(1);
      expect(db.pragma('cache_size', { simple: true })).toBe(-64000);
      expect(db.pragma('temp_store', { simple: true })).toBe(2);
      expect(db.pragma('mmap_size', { simple: true })).toBe(268435456);
    } finally {
      db.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('edges 反向查询需要 source/target + kind 复合索引', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crg-migrations-indexes-'));
    const db = initDatabase(path.join(tmpDir, 'graph.db'));

    try {
      const indexNames = db.prepare("PRAGMA index_list('edges')").all().map((row) => row.name);
      expect(indexNames).toEqual(expect.arrayContaining([
        'idx_edges_target_kind',
        'idx_edges_source_kind',
      ]));

      const targetKindColumns = db.prepare("PRAGMA index_info('idx_edges_target_kind')").all();
      expect(targetKindColumns.map((row) => row.name)).toEqual(['target_id', 'kind']);

      const sourceKindColumns = db.prepare("PRAGMA index_info('idx_edges_source_kind')").all();
      expect(sourceKindColumns.map((row) => row.name)).toEqual(['source_id', 'kind']);

      const nodeIndexNames = db.prepare("PRAGMA index_list('nodes')").all().map((row) => row.name);
      expect(nodeIndexNames).toContain('idx_nodes_name');

      const unresolvedIndexNames = db.prepare("PRAGMA index_list('unresolved_edges')").all().map((row) => row.name);
      expect(unresolvedIndexNames).toEqual(expect.arrayContaining([
        'idx_unresolved_edges_source_id',
        'idx_unresolved_edges_target_path',
        'idx_unresolved_edges_target_category',
      ]));
    } finally {
      db.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('legacy DB additive migration 会补齐质量算法元数据列', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crg-migrations-legacy-'));
    const dbPath = path.join(tmpDir, 'graph.db');
    let db = initDatabase(dbPath);
    db.close();

    db = initDatabase(dbPath);
    try {
      const edgeColumns = db.prepare('PRAGMA table_info(edges)').all().map((row) => row.name);
      expect(edgeColumns).toEqual(expect.arrayContaining([
        'confidence',
        'resolution_method',
        'evidence',
        'inference_reason',
      ]));

      const unresolvedColumns = db.prepare('PRAGMA table_info(unresolved_edges)').all().map((row) => row.name);
      expect(unresolvedColumns).toEqual(expect.arrayContaining([
        'target_category',
        'target_package_root',
        'reason',
        'confidence',
        'resolution_method',
        'evidence',
      ]));

      const communityColumns = db.prepare('PRAGMA table_info(communities)').all().map((row) => row.name);
      expect(communityColumns).toEqual(expect.arrayContaining([
        'algorithm',
        'community_source',
        'cohesion',
        'health_note',
      ]));

      const flowColumns = db.prepare('PRAGMA table_info(flows)').all().map((row) => row.name);
      expect(flowColumns).toEqual(expect.arrayContaining([
        'entry_source',
        'entry_confidence',
        'entry_evidence',
        'entry_inference_reason',
        'truncated',
        'truncation_reason',
      ]));
    } finally {
      db.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
