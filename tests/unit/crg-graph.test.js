'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const { initDatabase } = require('../../src/crg/migrations');
const { upsertNodes, resolveEdges } = require('../../src/crg/graph');

describe('resolveEdges', () => {
  test('upsertNodes 会写入 generation_id、parser_quality、summary、retrieval_text', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crg-graph-'));
    const dbPath = path.join(tmpDir, 'graph.db');
    const db = initDatabase(dbPath);

    try {
      upsertNodes(db, [
        {
          id: 'src/a.js#function#foo#L1',
          file_path: 'src/a.js',
          name: 'foo',
          kind: 'function',
          line_start: 1,
          line_end: 3,
          generation_id: 'gen-1',
          parser_quality: 'ok',
          summary: 'function foo defined in src/a.js',
          retrieval_text: 'src/a.js function foo',
        },
      ]);

      const row = db.prepare(`
        SELECT generation_id, parser_quality, summary, retrieval_text
        FROM nodes
        WHERE id = 'src/a.js#function#foo#L1'
      `).get();

      expect(row).toEqual({
        generation_id: 'gen-1',
        parser_quality: 'ok',
        summary: 'function foo defined in src/a.js',
        retrieval_text: 'src/a.js function foo',
      });
    } finally {
      db.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('同名符号存在歧义时不应按裸 name 串线', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crg-graph-'));
    const dbPath = path.join(tmpDir, 'graph.db');
    const db = initDatabase(dbPath);

    try {
      upsertNodes(db, [
        {
          id: 'src/a.js#module#a.js#L0',
          file_path: 'src/a.js',
          name: 'a.js',
          kind: 'module',
        },
        {
          id: 'src/b.js#module#b.js#L0',
          file_path: 'src/b.js',
          name: 'b.js',
          kind: 'module',
        },
        {
          id: 'src/caller.js#function#caller#L1',
          file_path: 'src/caller.js',
          name: 'caller',
          kind: 'function',
          line_start: 1,
          line_end: 3,
        },
        {
          id: 'src/a.js#function#foo#L1',
          file_path: 'src/a.js',
          name: 'foo',
          kind: 'function',
          line_start: 1,
          line_end: 2,
        },
        {
          id: 'src/b.js#function#foo#L1',
          file_path: 'src/b.js',
          name: 'foo',
          kind: 'function',
          line_start: 1,
          line_end: 2,
        },
      ]);

      const result = resolveEdges(db, [
        {
          source_id: 'src/caller.js#function#caller#L1',
          target_name: 'foo',
          target_path_raw: null,
          kind: 'calls',
        },
      ]);

      expect(result.resolved).toHaveLength(0);
      expect(result.unresolvedCount).toBe(1);
      expect(result.unresolved).toEqual([
        expect.objectContaining({
          source_id: 'src/caller.js#function#caller#L1',
          source_file: 'src/caller.js',
          edge_kind: 'calls',
          target_name: 'foo',
        }),
      ]);
    } finally {
      db.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('raw edge 已提供 target_id 时应直接解析，不再按 name 猜测', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crg-graph-'));
    const dbPath = path.join(tmpDir, 'graph.db');
    const db = initDatabase(dbPath);

    try {
      upsertNodes(db, [
        {
          id: 'src/caller.js#function#caller#L1',
          file_path: 'src/caller.js',
          name: 'caller',
          kind: 'function',
          line_start: 1,
          line_end: 3,
        },
        {
          id: 'src/a.js#function#foo#L1',
          file_path: 'src/a.js',
          name: 'foo',
          kind: 'function',
          line_start: 1,
          line_end: 2,
        },
      ]);

      const result = resolveEdges(db, [
        {
          source_id: 'src/caller.js#function#caller#L1',
          target_id: 'src/a.js#function#foo#L1',
          target_name: 'foo',
          target_path_raw: null,
          kind: 'calls',
        },
      ]);

      expect(result.unresolvedCount).toBe(0);
      expect(result.resolved).toEqual([
        expect.objectContaining({
          id: 'src/caller.js#function#caller#L1:src/a.js#function#foo#L1:calls',
          source_id: 'src/caller.js#function#caller#L1',
          target_id: 'src/a.js#function#foo#L1',
          kind: 'calls',
          weight: 1,
          confidence: 'Observed',
          resolution_method: 'direct_target_id',
        }),
      ]);
    } finally {
      db.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('同名符号歧义时，同文件唯一匹配应被解析（同文件优先消歧）', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crg-graph-'));
    const dbPath = path.join(tmpDir, 'graph.db');
    const db = initDatabase(dbPath);

    try {
      upsertNodes(db, [
        // a.js 中有 helper
        {
          id: 'src/a.js#function#helper#L1',
          file_path: 'src/a.js',
          name: 'helper',
          kind: 'function',
          line_start: 1,
          line_end: 3,
        },
        // b.js 中也有 helper（同名但不同文件）
        {
          id: 'src/b.js#function#helper#L1',
          file_path: 'src/b.js',
          name: 'helper',
          kind: 'function',
          line_start: 1,
          line_end: 3,
        },
        // a.js 中的 caller 调用 helper（source 和 target 在同一文件）
        {
          id: 'src/a.js#function#caller#L10',
          file_path: 'src/a.js',
          name: 'caller',
          kind: 'function',
          line_start: 10,
          line_end: 15,
        },
      ]);

      const result = resolveEdges(db, [
        {
          source_id: 'src/a.js#function#caller#L10',
          target_name: 'helper',
          target_path_raw: null,
          kind: 'calls',
        },
      ]);

      // source 和 helper 同在 a.js，应消歧成功
      expect(result.unresolvedCount).toBe(0);
      expect(result.resolved).toHaveLength(1);
      expect(result.resolved[0].target_id).toBe('src/a.js#function#helper#L1');
    } finally {
      db.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('同名符号歧义且跨文件均有匹配时，应视为 unresolved', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crg-graph-'));
    const dbPath = path.join(tmpDir, 'graph.db');
    const db = initDatabase(dbPath);

    try {
      upsertNodes(db, [
        {
          id: 'src/a.js#function#util#L1',
          file_path: 'src/a.js',
          name: 'util',
          kind: 'function',
          line_start: 1,
          line_end: 3,
        },
        {
          id: 'src/b.js#function#util#L1',
          file_path: 'src/b.js',
          name: 'util',
          kind: 'function',
          line_start: 1,
          line_end: 3,
        },
        // caller 在第三个文件 c.js，两个 util 都不在同文件
        {
          id: 'src/c.js#function#caller#L1',
          file_path: 'src/c.js',
          name: 'caller',
          kind: 'function',
          line_start: 1,
          line_end: 5,
        },
      ]);

      const result = resolveEdges(db, [
        {
          source_id: 'src/c.js#function#caller#L1',
          target_name: 'util',
          target_path_raw: null,
          kind: 'calls',
        },
      ]);

      expect(result.unresolvedCount).toBe(1);
      expect(result.resolved).toHaveLength(0);
      expect(result.unresolved[0]).toEqual(expect.objectContaining({
        source_file: 'src/c.js',
        edge_kind: 'calls',
        target_name: 'util',
      }));
    } finally {
      db.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('Java/Kotlin 全限定 import 可解析到仓库内符号节点', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crg-graph-'));
    const dbPath = path.join(tmpDir, 'graph.db');
    const db = initDatabase(dbPath);

    try {
      upsertNodes(db, [
        {
          id: 'trade/src/main/java/com/example/trade/LoginProvider.kt#module#LoginProvider.kt#L0',
          file_path: 'trade/src/main/java/com/example/trade/LoginProvider.kt',
          name: 'LoginProvider.kt',
          kind: 'module',
        },
        {
          id: 'trade/src/main/java/com/example/trade/LoginProvider.kt#class#LoginProvider#L12',
          file_path: 'trade/src/main/java/com/example/trade/LoginProvider.kt',
          name: 'LoginProvider',
          kind: 'class',
          line_start: 12,
          line_end: 60,
        },
        {
          id: 'app/src/main/java/com/example/app/AppEntry.java#module#AppEntry.java#L0',
          file_path: 'app/src/main/java/com/example/app/AppEntry.java',
          name: 'AppEntry.java',
          kind: 'module',
        },
      ]);

      const result = resolveEdges(db, [
        {
          source_id: 'app/src/main/java/com/example/app/AppEntry.java#module#AppEntry.java#L0',
          target_name: 'com.example.trade.LoginProvider',
          target_path_raw: 'com.example.trade.LoginProvider',
          kind: 'imports_from',
        },
      ], tmpDir);

      expect(result.unresolvedCount).toBe(0);
      expect(result.resolved).toEqual([
        expect.objectContaining({
          target_id: 'trade/src/main/java/com/example/trade/LoginProvider.kt#class#LoginProvider#L12',
          resolution_method: 'jvm_fqn_symbol',
          inference_reason: 'jvm_fqn_import_path',
        }),
      ]);
    } finally {
      db.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('外部 import 生成 external dependency stub 而不是 unresolved 噪声', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'crg-graph-'));
    const dbPath = path.join(tmpDir, 'graph.db');
    const db = initDatabase(dbPath);

    try {
      upsertNodes(db, [
        {
          id: 'app/src/main/java/com/example/app/AppEntry.java#module#AppEntry.java#L0',
          file_path: 'app/src/main/java/com/example/app/AppEntry.java',
          name: 'AppEntry.java',
          kind: 'module',
        },
        {
          id: 'app/src/main/java/com/example/app/Profile.java#module#Profile.java#L0',
          file_path: 'app/src/main/java/com/example/app/Profile.java',
          name: 'Profile.java',
          kind: 'module',
        },
      ]);

      const result = resolveEdges(db, [
        {
          source_id: 'app/src/main/java/com/example/app/AppEntry.java#module#AppEntry.java#L0',
          target_name: 'android.content.Context',
          target_path_raw: 'android.content.Context',
          kind: 'imports_from',
        },
        {
          source_id: 'app/src/main/java/com/example/app/AppEntry.java#module#AppEntry.java#L0',
          target_name: 'retrofit2.http.GET',
          target_path_raw: 'retrofit2.http.GET',
          kind: 'imports_from',
        },
        {
          source_id: 'app/src/main/java/com/example/app/AppEntry.java#module#AppEntry.java#L0',
          target_name: 'com.example.missing.InternalApi',
          target_path_raw: 'com.example.missing.InternalApi',
          kind: 'imports_from',
        },
      ], tmpDir);

      expect(result.unresolvedCount).toBe(1);
      expect(result.unresolved[0]).toEqual(expect.objectContaining({
        target_path_raw: 'com.example.missing.InternalApi',
        target_category: 'repo_internal_candidate',
        target_package_root: 'com.example',
      }));
      expect(result.inferredNodes).toEqual(expect.arrayContaining([
        expect.objectContaining({ id: 'external:platform_external:android', kind: 'external_dependency' }),
        expect.objectContaining({ id: 'external:third_party_external_candidate:retrofit2', kind: 'external_dependency' }),
      ]));
      expect(result.resolved).toEqual(expect.arrayContaining([
        expect.objectContaining({
          target_id: 'external:platform_external:android',
          kind: 'imports_external',
          resolution_method: 'external_dependency_stub',
        }),
        expect.objectContaining({
          target_id: 'external:third_party_external_candidate:retrofit2',
          kind: 'imports_external',
          resolution_method: 'external_dependency_stub',
        }),
      ]));
    } finally {
      db.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
