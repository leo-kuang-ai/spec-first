'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { initDatabase } = require('../../src/crg/migrations');
const { upsertNodes, upsertEdges, upsertChunks } = require('../../src/crg/graph');
const { rebuildFTS, searchNodes } = require('../../src/crg/search');
const { retrieveContext } = require('../../src/crg/retrieval/api');
const { buildQueryPlan } = require('../../src/crg/retrieval/query-plan');

describe('crg retrieval', () => {
  test('query planning 能按问题语义推断 plan / work / review intent', () => {
    expect(buildQueryPlan({ query: 'architecture modules entrypoints' }).profile).toBe('plan');
    expect(buildQueryPlan({ query: 'implement fix test coverage' }).profile).toBe('work');
    expect(buildQueryPlan({ query: 'review risk change audit' }).profile).toBe('review');
  });

  test('review profile 优先 blast radius 与 candidate tests', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crg-retrieval-'));
    const db = initDatabase(path.join(tmpDir, 'graph.db'));

    try {
      upsertNodes(db, [
        { id: 'src/a.js#function#critical#L1', file_path: 'src/a.js', name: 'critical', kind: 'function', line_start: 1, line_end: 20, retrieval_text: 'critical payment review risk' },
        { id: 'src/b.js#function#caller#L1', file_path: 'src/b.js', name: 'caller', kind: 'function', line_start: 1, line_end: 10, retrieval_text: 'caller blast radius payment' },
        { id: 'tests/a.test.js#module#a.test.js#L0', file_path: 'tests/a.test.js', name: 'a.test.js', kind: 'module', line_start: 0, line_end: 0, is_test: 1, retrieval_text: 'candidate test payment critical' },
      ]);
      upsertEdges(db, [
        { id: 'edge-1', source_id: 'src/b.js#function#caller#L1', target_id: 'src/a.js#function#critical#L1', kind: 'calls', weight: 1 },
      ]);
      upsertChunks(db, [
        { id: 'chunk-1', node_id: 'src/a.js#function#critical#L1', parent_symbol_id: 'src/a.js#function#critical#L1', file_path: 'src/a.js', kind: 'chunk', name: 'critical#chunk1', line_start: 1, line_end: 10, retrieval_text: 'critical payment chunk' },
      ]);

      const result = retrieveContext(db, {
        profile: 'review',
        query: 'critical payment review',
        changedFiles: ['src/a.js'],
        candidateTests: ['tests/a.test.js'],
        riskPaths: ['src/a.js'],
      });

      expect(result.query_plan.profile).toBe('review');
      expect(result.ranked_context[0].score_breakdown).toEqual(expect.objectContaining({
        base: expect.any(Number),
        changed_file: expect.any(Number),
        risk_path: expect.any(Number),
        total: expect.any(Number),
      }));
      expect(result.ranked_context[0].file_path).toBe('src/a.js');
      expect(result.ranked_context.some((item) => item.file_path === 'tests/a.test.js')).toBe(true);
    } finally {
      db.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('plan profile 优先 entrypoints 与 modules，budget 下先裁剪叙述性资产', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crg-retrieval-'));
    const db = initDatabase(path.join(tmpDir, 'graph.db'));

    try {
      upsertNodes(db, [
        { id: 'src/cli/index.js#function#runCli#L1', file_path: 'src/cli/index.js', name: 'runCli', kind: 'function', line_start: 1, line_end: 10, retrieval_text: 'entrypoint cli architecture module' },
        { id: 'src/crg/router.js#module#router.js#L0', file_path: 'src/crg/router.js', name: 'router.js', kind: 'module', line_start: 0, line_end: 0, retrieval_text: 'module router architecture' },
        { id: 'docs/README.md#module#README.md#L0', file_path: 'docs/README.md', name: 'README.md', kind: 'module', line_start: 0, line_end: 0, retrieval_text: 'narrative overview architecture docs docs docs docs docs docs docs' },
      ]);

      const result = retrieveContext(db, {
        profile: 'plan',
        query: 'architecture modules entrypoints',
        budget: 200,
      });

      expect(result.query_plan.profile).toBe('plan');
      expect(result.ranked_context[0].file_path).toBe('src/cli/index.js');
      expect(result.ranked_context.some((item) => item.file_path === 'src/crg/router.js')).toBe(true);
      expect(result.ranked_context.some((item) => item.file_path === 'docs/README.md')).toBe(false);
    } finally {
      db.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('FTS 多词 query 会拆 token 召回候选', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crg-retrieval-'));
    const db = initDatabase(path.join(tmpDir, 'graph.db'));

    try {
      upsertNodes(db, [
        {
          id: 'app/src/main/java/com/example/LoginHelper.kt#function#postLogin#L10',
          file_path: 'app/src/main/java/com/example/LoginHelper.kt',
          name: 'postLogin',
          kind: 'function',
          line_start: 10,
          line_end: 20,
          retrieval_text: 'postLogin user login auth',
        },
        {
          id: 'app/src/main/java/com/example/Feed.kt#function#renderFeed#L1',
          file_path: 'app/src/main/java/com/example/Feed.kt',
          name: 'renderFeed',
          kind: 'function',
          line_start: 1,
          line_end: 8,
          retrieval_text: 'feed render timeline',
        },
      ]);
      rebuildFTS(db);

      const results = searchNodes(db, 'login auth sign in', { limit: 5 });

      expect(results.map((item) => item.node_id)).toContain(
        'app/src/main/java/com/example/LoginHelper.kt#function#postLogin#L10'
      );
      expect(results[0].matched_terms).toEqual(expect.arrayContaining(['login']));
    } finally {
      db.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
