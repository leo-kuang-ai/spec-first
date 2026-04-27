'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const { initDatabase } = require('../../src/crg/migrations');
const { upsertEdges, upsertNodes, replaceUnresolvedEdges } = require('../../src/crg/graph');
const { buildGraphQualityReport } = require('../../src/crg/quality/report');

describe('crg graph quality report', () => {
  test('报告覆盖 parser 降级、边置信度与 unresolved 统计', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crg-quality-'));
    const db = initDatabase(path.join(tmpDir, 'graph.db'));

    try {
      upsertNodes(db, [
        { id: 'src/a.js#function#a#L1', file_path: 'src/a.js', name: 'a', kind: 'function' },
        { id: 'src/b.js#function#b#L1', file_path: 'src/b.js', name: 'b', kind: 'function' },
      ]);
      upsertEdges(db, [
        {
          id: 'e1',
          source_id: 'src/a.js#function#a#L1',
          target_id: 'src/b.js#function#b#L1',
          kind: 'calls',
          confidence: 'Observed',
          resolution_method: 'direct_target_id',
        },
      ]);
      replaceUnresolvedEdges(db, [
        {
          source_id: 'src/a.js#function#a#L1',
          source_file: 'src/a.js',
          edge_kind: 'calls',
          target_name: 'missing',
          reason: 'no_match',
        },
      ]);

      const report = buildGraphQualityReport(db, {
        repoRoot: tmpDir,
        generationId: 'gen-1',
        buildSnapshot: {
          final_input_count: 3,
          parsed_count: 1,
          no_parser_count: 1,
          no_parser_samples: ['src/no-parser.swift'],
          parse_error_count: 1,
          parse_error_samples: ['src/bad.kt'],
        },
      });

      expect(report.schema_version).toBe('graph-quality/v1');
      expect(report.coverage.parsed_count).toBe(2);
      expect(report.coverage.changed_parsed_count).toBe(1);
      expect(report.coverage.parser_success_rate).toBeCloseTo(0.6667);
      expect(report.graph.confidence_distribution.edges.Observed).toBe(1);
      expect(report.unresolved_edges.by_reason.no_match).toBe(1);
      expect(report.limitations.map((item) => item.code)).toEqual(expect.arrayContaining([
        'no-parser-files',
        'parse-error-files',
        'unresolved-edges',
      ]));
    } finally {
      db.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('unresolved imports 会按平台、仓库内候选和第三方依赖分桶', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crg-quality-'));
    const db = initDatabase(path.join(tmpDir, 'graph.db'));

    try {
      upsertNodes(db, [
        {
          id: 'app/src/main/java/com/example/app/LoginHelper.kt#module#LoginHelper.kt#L0',
          file_path: 'app/src/main/java/com/example/app/LoginHelper.kt',
          name: 'LoginHelper.kt',
          kind: 'module',
        },
        {
          id: 'app/src/main/java/com/example/app/Profile.kt#module#Profile.kt#L0',
          file_path: 'app/src/main/java/com/example/app/Profile.kt',
          name: 'Profile.kt',
          kind: 'module',
        },
      ]);
      replaceUnresolvedEdges(db, [
        {
          source_id: 'app/src/main/java/com/example/app/Profile.kt#module#Profile.kt#L0',
          source_file: 'app/src/main/java/com/example/app/Profile.kt',
          edge_kind: 'imports_from',
          target_name: 'com.example.app.LoginHelper',
          target_path_raw: 'com.example.app.LoginHelper',
          reason: 'no_match',
        },
        {
          source_id: 'app/src/main/java/com/example/app/Profile.kt#module#Profile.kt#L0',
          source_file: 'app/src/main/java/com/example/app/Profile.kt',
          edge_kind: 'imports_from',
          target_name: 'android.content.Context',
          target_path_raw: 'android.content.Context',
          reason: 'no_match',
        },
        {
          source_id: 'app/src/main/java/com/example/app/Profile.kt#module#Profile.kt#L0',
          source_file: 'app/src/main/java/com/example/app/Profile.kt',
          edge_kind: 'imports_from',
          target_name: 'retrofit2.http.GET',
          target_path_raw: 'retrofit2.http.GET',
          reason: 'no_match',
        },
      ]);

      const report = buildGraphQualityReport(db, {
        repoRoot: tmpDir,
        generationId: 'gen-1',
        buildSnapshot: { final_input_count: 2, parsed_count: 2 },
      });

      expect(report.unresolved_edges.by_target_category).toEqual(expect.objectContaining({
        repo_internal_candidate: 1,
        platform_external: 1,
        third_party_external_candidate: 1,
      }));
      expect(report.unresolved_edges.repo_package_roots).toContain('com.example');
    } finally {
      db.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('报告 external dependency stub 分布', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crg-quality-'));
    const db = initDatabase(path.join(tmpDir, 'graph.db'));

    try {
      upsertNodes(db, [
        {
          id: 'external:platform_external:android',
          file_path: 'external/platform_external/android',
          name: 'android',
          kind: 'external_dependency',
          inference_reason: 'platform_external',
          source_tier: 'external_dependency',
        },
        {
          id: 'external:third_party_external_candidate:retrofit2',
          file_path: 'external/third_party_external_candidate/retrofit2',
          name: 'retrofit2',
          kind: 'external_dependency',
          inference_reason: 'third_party_external_candidate',
          source_tier: 'external_dependency',
        },
      ]);

      const report = buildGraphQualityReport(db, {
        repoRoot: tmpDir,
        generationId: 'gen-1',
        buildSnapshot: { final_input_count: 2, parsed_count: 2 },
      });

      expect(report.external_dependencies).toEqual(expect.objectContaining({
        count: 2,
        by_category: expect.objectContaining({
          platform_external: 1,
          third_party_external_candidate: 1,
        }),
      }));
    } finally {
      db.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
