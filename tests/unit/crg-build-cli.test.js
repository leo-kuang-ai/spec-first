'use strict';

describe('crg build/stats cli', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  test('build 会删除已被输入收敛排除的历史节点路径', async () => {
    const outputSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const deleteStaleNodes = jest.fn();
    const updateFingerprints = jest.fn();

    jest.isolateModules(() => {
      jest.doMock('better-sqlite3', () => jest.fn());
      jest.doMock('fs', () => {
        const actual = jest.requireActual('fs');
        return {
          ...actual,
          statSync: () => ({ isDirectory: () => true }),
          existsSync: () => true,
          mkdirSync: jest.fn(),
          writeFileSync: jest.fn(),
        };
      });
      jest.doMock('../../src/crg/migrations', () => ({
        initDatabase: () => ({
          close: jest.fn(),
          prepare: jest.fn((sql) => {
            if (sql.includes('SELECT file_path FROM nodes')) {
              return {
                all: () => [
                  { file_path: '.claude/skills/demo/runtime.js' },
                  { file_path: 'src/index.js' },
                ],
              };
            }
            if (sql.includes('SELECT COUNT(*) as c FROM nodes')) return { get: () => ({ c: 1 }) };
            if (sql.includes('SELECT COUNT(*) as c FROM edges')) return { get: () => ({ c: 0 }) };
            if (sql.includes('UPDATE graph_meta SET last_built')) return { run: jest.fn() };
            if (sql.includes('DELETE FROM fingerprints')) return { run: jest.fn() };
            return { get: () => ({}), all: () => [], run: jest.fn() };
          }),
        }),
      }));
      jest.doMock('../../src/crg/input-convergence', () => ({
        collectInputFiles: async () => ({
          finalInputs: ['src/index.js'],
          stats: { ignored_files_by_rule: {} },
        }),
      }));
      jest.doMock('../../src/crg/parser', () => ({
        inferLanguage: () => 'javascript',
        parseFile: () => ({ nodes: [], rawEdges: [], skipped: false }),
      }));
      jest.doMock('../../src/crg/incremental', () => ({
        detectChangedFiles: () => ({
          changed: [],
          deleted: [],
          changedShas: new Map(),
        }),
        updateFingerprints,
      }));
      jest.doMock('../../src/crg/graph', () => ({
        upsertNodes: jest.fn(),
        upsertEdges: jest.fn(),
        deleteStaleNodes,
        resolveEdges: () => ({ resolved: [], unresolvedCount: 0, unresolved: [] }),
        setUnresolvedEdgeCount: jest.fn(),
        replaceUnresolvedEdges: jest.fn(),
      }));
      jest.doMock('../../src/crg/cli/postprocess', () => ({
        runPostprocess: jest.fn(),
      }));

      const { run } = require('../../src/crg/cli/build');
      run(['--repo=/repo', '--force']);
    });

    await new Promise((resolve) => setImmediate(resolve));

    expect(deleteStaleNodes).toHaveBeenCalledWith(
      expect.any(Object),
      ['.claude/skills/demo/runtime.js']
    );
    expect(updateFingerprints).toHaveBeenCalledWith(
      expect.any(Object),
      [],
      ['.claude/skills/demo/runtime.js'],
      '/repo'
    );
    outputSpy.mockRestore();
  });

  test('build 将 collectInputFiles 的输出直接传给 detectChangedFiles（语言过滤在收集层已完成）', async () => {
    const outputSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const detectChangedFiles = jest.fn(() => ({
      changed: [],
      deleted: [],
      changedShas: new Map(),
    }));

    jest.isolateModules(() => {
      jest.doMock('better-sqlite3', () => jest.fn());
      jest.doMock('fs', () => {
        const actual = jest.requireActual('fs');
        return {
          ...actual,
          statSync: () => ({ isDirectory: () => true }),
          existsSync: () => true,
          mkdirSync: jest.fn(),
          writeFileSync: jest.fn(),
        };
      });
      jest.doMock('../../src/crg/migrations', () => ({
        initDatabase: () => ({
          close: jest.fn(),
          prepare: jest.fn((sql) => {
            if (sql.includes('SELECT file_path FROM nodes')) return { all: () => [] };
            if (sql.includes('SELECT COUNT(*) as c FROM nodes')) return { get: () => ({ c: 1 }) };
            if (sql.includes('SELECT COUNT(*) as c FROM edges')) return { get: () => ({ c: 0 }) };
            if (sql.includes('UPDATE graph_meta SET last_built')) return { run: jest.fn() };
            return { get: () => ({}), all: () => [], run: jest.fn() };
          }),
        }),
      }));
      jest.doMock('../../src/crg/input-convergence', () => ({
        // collectInputFiles 在收集层已完成语言过滤，只返回代码文件
        collectInputFiles: async () => ({
          finalInputs: ['src/index.js'],
          stats: { ignored_files_by_rule: {} },
        }),
      }));
      jest.doMock('../../src/crg/parser', () => ({
        parseFile: () => ({ nodes: [], rawEdges: [], skipped: false }),
      }));
      jest.doMock('../../src/crg/incremental', () => ({
        detectChangedFiles,
        updateFingerprints: jest.fn(),
      }));
      jest.doMock('../../src/crg/graph', () => ({
        upsertNodes: jest.fn(),
        upsertEdges: jest.fn(),
        deleteStaleNodes: jest.fn(),
        resolveEdges: () => ({ resolved: [], unresolvedCount: 0, unresolved: [] }),
        setUnresolvedEdgeCount: jest.fn(),
        replaceUnresolvedEdges: jest.fn(),
      }));
      jest.doMock('../../src/crg/cli/postprocess', () => ({
        runPostprocess: jest.fn(),
      }));

      const { run } = require('../../src/crg/cli/build');
      run(['--repo=/repo', '--force']);
    });

    await new Promise((resolve) => setImmediate(resolve));

    expect(detectChangedFiles).toHaveBeenCalledWith(
      expect.any(Object),
      ['src/index.js'],
      '/repo'
    );
    outputSpy.mockRestore();
  });

  test('build 对解析阶段 skipped 的文件会清理 fingerprints，避免留下脏账', async () => {
    const outputSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const updateFingerprints = jest.fn();

    jest.isolateModules(() => {
      jest.doMock('better-sqlite3', () => jest.fn());
      jest.doMock('fs', () => {
        const actual = jest.requireActual('fs');
        return {
          ...actual,
          statSync: () => ({ isDirectory: () => true }),
          existsSync: () => true,
          mkdirSync: jest.fn(),
          writeFileSync: jest.fn(),
        };
      });
      jest.doMock('../../src/crg/migrations', () => ({
        initDatabase: () => ({
          close: jest.fn(),
          prepare: jest.fn((sql) => {
            if (sql.includes('SELECT file_path FROM nodes')) return { all: () => [] };
            if (sql.includes('SELECT COUNT(*) as c FROM nodes')) return { get: () => ({ c: 0 }) };
            if (sql.includes('SELECT COUNT(*) as c FROM edges')) return { get: () => ({ c: 0 }) };
            if (sql.includes('UPDATE graph_meta SET last_built')) return { run: jest.fn() };
            return { get: () => ({}), all: () => [], run: jest.fn() };
          }),
        }),
      }));
      jest.doMock('../../src/crg/input-convergence', () => ({
        collectInputFiles: async () => ({
          finalInputs: ['src/header.h'],
          stats: { ignored_files_by_rule: {} },
        }),
      }));
      jest.doMock('../../src/crg/parser', () => ({
        inferLanguage: () => 'c',
        parseFile: () => ({ nodes: [], rawEdges: [], skipped: true, reason: 'unsupported_lang' }),
      }));
      jest.doMock('../../src/crg/incremental', () => ({
        detectChangedFiles: () => ({
          changed: ['src/header.h'],
          deleted: [],
          changedShas: new Map([['src/header.h', 'sha-header']]),
        }),
        updateFingerprints,
      }));
      jest.doMock('../../src/crg/graph', () => ({
        upsertNodes: jest.fn(),
        upsertEdges: jest.fn(),
        deleteStaleNodes: jest.fn(),
        resolveEdges: () => ({ resolved: [], unresolvedCount: 0, unresolved: [] }),
        setUnresolvedEdgeCount: jest.fn(),
        replaceUnresolvedEdges: jest.fn(),
      }));
      jest.doMock('../../src/crg/cli/postprocess', () => ({
        runPostprocess: jest.fn(),
      }));

      const { run } = require('../../src/crg/cli/build');
      run(['--repo=/repo', '--force']);
    });

    await new Promise((resolve) => setImmediate(resolve));

    expect(updateFingerprints).toHaveBeenNthCalledWith(
      1,
      expect.any(Object),
      [],
      [],
      '/repo'
    );
    expect(updateFingerprints).toHaveBeenNthCalledWith(
      2,
      expect.any(Object),
      [],
      ['src/header.h'],
      '/repo',
      expect.any(Map)
    );
    outputSpy.mockRestore();
  });

  test('build 自动识别 iOS/Xcode 仓库并开启 Pod 输入收敛', async () => {
    const outputSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const collectInputFiles = jest.fn(async () => ({
      finalInputs: ['HuashengSecurities/AppDelegate.h'],
      stats: { ignored_files_by_rule: {} },
    }));

    jest.isolateModules(() => {
      jest.doMock('better-sqlite3', () => jest.fn());
      jest.doMock('fs', () => {
        const actual = jest.requireActual('fs');
        return {
          ...actual,
          statSync: () => ({ isDirectory: () => true }),
          existsSync: (target) => {
            if (target === '/repo/HuashengSecurities.xcodeproj') return true;
            if (target === '/repo/HuashengSecurities.xcworkspace') return false;
            if (target === '/repo/Podfile.lock') return true;
            if (target === '/repo/Pods') return true;
            return true;
          },
          mkdirSync: jest.fn(),
          writeFileSync: jest.fn(),
        };
      });
      jest.doMock('../../src/crg/migrations', () => ({
        initDatabase: () => ({
          close: jest.fn(),
          prepare: jest.fn((sql) => {
            if (sql.includes('SELECT file_path FROM nodes')) return { all: () => [] };
            if (sql.includes('SELECT COUNT(*) as c FROM nodes')) return { get: () => ({ c: 1 }) };
            if (sql.includes('SELECT COUNT(*) as c FROM edges')) return { get: () => ({ c: 0 }) };
            if (sql.includes('UPDATE graph_meta SET last_built')) return { run: jest.fn() };
            return { get: () => ({}), all: () => [], run: jest.fn() };
          }),
        }),
      }));
      jest.doMock('../../src/crg/input-convergence', () => ({
        collectInputFiles,
      }));
      jest.doMock('../../src/crg/parser', () => ({
        inferLanguage: () => 'c',
        parseFile: () => ({ nodes: [], rawEdges: [], skipped: false }),
      }));
      jest.doMock('../../src/crg/incremental', () => ({
        detectChangedFiles: () => ({
          changed: [],
          deleted: [],
          changedShas: new Map(),
        }),
        updateFingerprints: jest.fn(),
      }));
      jest.doMock('../../src/crg/graph', () => ({
        upsertNodes: jest.fn(),
        upsertEdges: jest.fn(),
        deleteStaleNodes: jest.fn(),
        resolveEdges: () => ({ resolved: [], unresolvedCount: 0, unresolved: [] }),
        setUnresolvedEdgeCount: jest.fn(),
        replaceUnresolvedEdges: jest.fn(),
      }));
      jest.doMock('../../src/crg/cli/postprocess', () => ({
        runPostprocess: jest.fn(),
      }));

      const { run } = require('../../src/crg/cli/build');
      run(['--repo=/repo']);
    });

    await new Promise((resolve) => setImmediate(resolve));

    expect(collectInputFiles).toHaveBeenCalledWith('/repo', expect.objectContaining({
      isIos: true,
    }));
    outputSpy.mockRestore();
  });

  test('build 对成功解析的 changed 文件先删除旧节点再统一写入，避免幽灵事实残留', async () => {
    const outputSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const deleteStaleNodes = jest.fn();
    const upsertNodes = jest.fn();
    const upsertEdges = jest.fn();

    jest.isolateModules(() => {
      jest.doMock('better-sqlite3', () => jest.fn());
      jest.doMock('fs', () => {
        const actual = jest.requireActual('fs');
        return {
          ...actual,
          statSync: () => ({ isDirectory: () => true }),
          existsSync: () => true,
          mkdirSync: jest.fn(),
          writeFileSync: jest.fn(),
        };
      });
      jest.doMock('../../src/crg/migrations', () => ({
        initDatabase: () => ({
          close: jest.fn(),
          prepare: jest.fn((sql) => {
            if (sql.includes('SELECT file_path FROM nodes')) return { all: () => [] };
            if (sql.includes('SELECT COUNT(*) as c FROM nodes')) return { get: () => ({ c: 2 }) };
            if (sql.includes('SELECT COUNT(*) as c FROM edges')) return { get: () => ({ c: 1 }) };
            if (sql.includes('UPDATE graph_meta SET last_built')) return { run: jest.fn() };
            return { get: () => ({}), all: () => [], run: jest.fn() };
          }),
        }),
      }));
      jest.doMock('../../src/crg/input-convergence', () => ({
        collectInputFiles: async () => ({
          finalInputs: ['src/a.js'],
          stats: { ignored_files_by_rule: {} },
        }),
      }));
      jest.doMock('../../src/crg/parser', () => ({
        parseFile: () => ({
          nodes: [
            { id: 'src/a.js#module#a.js#L0', kind: 'module' },
            { id: 'src/a.js#function#foo#L10', kind: 'function' },
          ],
          rawEdges: [{ source_id: 'src/a.js#function#foo#L10', target_name: 'a.js', target_path_raw: 'src/a.js', kind: 'defined_in' }],
          skipped: false,
        }),
      }));
      jest.doMock('../../src/crg/incremental', () => ({
        detectChangedFiles: () => ({
          changed: ['src/a.js'],
          deleted: [],
          changedShas: new Map([['src/a.js', 'sha-a']]),
        }),
        updateFingerprints: jest.fn(),
      }));
      jest.doMock('../../src/crg/graph', () => ({
        upsertNodes,
        upsertEdges,
        deleteStaleNodes,
        resolveEdges: () => ({ resolved: [{ id: 'e1' }], unresolvedCount: 0, unresolved: [] }),
        setUnresolvedEdgeCount: jest.fn(),
        replaceUnresolvedEdges: jest.fn(),
      }));
      jest.doMock('../../src/crg/cli/postprocess', () => ({
        runPostprocess: jest.fn(),
      }));

      const { run } = require('../../src/crg/cli/build');
      run(['--repo=/repo']);
    });

    await new Promise((resolve) => setImmediate(resolve));

    expect(deleteStaleNodes).toHaveBeenNthCalledWith(1, expect.any(Object), []);
    expect(deleteStaleNodes).toHaveBeenNthCalledWith(2, expect.any(Object), ['src/a.js']);
    expect(upsertNodes).toHaveBeenCalledWith(expect.any(Object), expect.arrayContaining([
      expect.objectContaining({ id: 'src/a.js#module#a.js#L0' }),
      expect.objectContaining({ id: 'src/a.js#function#foo#L10' }),
    ]));
    expect(upsertEdges).toHaveBeenCalled();
    outputSpy.mockRestore();
  });

  test('build 输出 parser 降级质量统计与 last-build unresolved 语义字段', async () => {
    const outputSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const deleteStaleNodes = jest.fn();
    const upsertNodes = jest.fn();
    const replaceUnresolvedEdges = jest.fn();

    jest.isolateModules(() => {
      jest.doMock('better-sqlite3', () => jest.fn());
      jest.doMock('fs', () => {
        const actual = jest.requireActual('fs');
        return {
          ...actual,
          statSync: () => ({ isDirectory: () => true }),
          existsSync: () => true,
          mkdirSync: jest.fn(),
          writeFileSync: jest.fn(),
        };
      });
      jest.doMock('../../src/crg/migrations', () => ({
        initDatabase: () => ({
          close: jest.fn(),
          prepare: jest.fn((sql) => {
            if (sql.includes('SELECT file_path FROM nodes')) return { all: () => [] };
            if (sql.includes('SELECT COUNT(*) as c FROM nodes')) return { get: () => ({ c: 3 }) };
            if (sql.includes('SELECT COUNT(*) as c FROM edges')) return { get: () => ({ c: 0 }) };
            if (sql.includes('UPDATE graph_meta SET last_built')) return { run: jest.fn() };
            return { get: () => ({}), all: () => [], run: jest.fn() };
          }),
        }),
      }));
      jest.doMock('../../src/crg/input-convergence', () => ({
        collectInputFiles: async () => ({
          finalInputs: ['src/a.swift', 'src/b.kt', 'src/c.rb'],
          stats: { ignored_files_by_rule: {} },
        }),
      }));
      jest.doMock('../../src/crg/parser', () => ({
        parseFile: (file) => {
          if (file.endsWith('.swift')) {
            return {
              nodes: [{ id: 'src/a.swift#module#a.swift#L0', kind: 'module' }],
              rawEdges: [{ source_id: 'src/a.swift#module#a.swift#L0', target_name: 'Foundation', target_path_raw: 'Foundation', kind: 'imports_from' }],
              skipped: false,
              reason: 'no_parser',
            };
          }
          if (file.endsWith('.kt')) {
            return {
              nodes: [{ id: 'src/b.kt#module#b.kt#L0', kind: 'module' }],
              rawEdges: [{ source_id: 'src/b.kt#module#b.kt#L0', target_name: 'kotlin.io', target_path_raw: 'kotlin.io', kind: 'imports_from' }],
              skipped: false,
              reason: 'parse_error: bad grammar',
            };
          }
          return {
            nodes: [{ id: 'src/c.rb#module#c.rb#L0', kind: 'module' }],
            rawEdges: [{ source_id: 'src/c.rb#module#c.rb#L0', target_name: 'json', target_path_raw: 'json', kind: 'imports_from' }],
            skipped: false,
          };
        },
      }));
      jest.doMock('../../src/crg/incremental', () => ({
        detectChangedFiles: () => ({
          changed: ['src/a.swift', 'src/b.kt', 'src/c.rb'],
          deleted: [],
          changedShas: new Map(),
        }),
        updateFingerprints: jest.fn(),
      }));
      jest.doMock('../../src/crg/graph', () => ({
        upsertNodes,
        upsertEdges: jest.fn(),
        deleteStaleNodes,
        resolveEdges: () => ({
          resolved: [],
          unresolvedCount: 2,
          unresolved: [
            {
              source_id: 'src/c.rb#module#c.rb#L0',
              source_file: 'src/c.rb',
              edge_kind: 'imports_from',
              target_name: 'json',
              target_path_raw: 'json',
            },
            {
              source_id: 'src/c.rb#module#c.rb#L0',
              source_file: 'src/c.rb',
              edge_kind: 'imports_from',
              target_name: 'yaml',
              target_path_raw: 'yaml',
            },
          ],
        }),
        setUnresolvedEdgeCount: jest.fn(),
        replaceUnresolvedEdges,
      }));
      jest.doMock('../../src/crg/cli/postprocess', () => ({
        runPostprocess: jest.fn(),
      }));

      const { run } = require('../../src/crg/cli/build');
      run(['--repo=/repo', '--force']);
    });

    await new Promise((resolve) => setImmediate(resolve));

    const payload = JSON.parse(outputSpy.mock.calls[0][0]);
    expect(payload.degraded).toBe(true);
    expect(payload.data.unresolved_edge_count).toBe(2);
    expect(payload.data.last_build_unresolved_edge_count).toBe(2);
    expect(payload.data.last_build_unresolved_summary).toEqual({
      top_kinds: [{ kind: 'imports_from', count: 2 }],
      top_source_files: [{ file_path: 'src/c.rb', count: 2 }],
      sample_count: 2,
    });
    expect(payload.data.last_build_unresolved_samples).toEqual([
      expect.objectContaining({
        source_file: 'src/c.rb',
        edge_kind: 'imports_from',
        target_name: 'json',
      }),
      expect.objectContaining({
        source_file: 'src/c.rb',
        edge_kind: 'imports_from',
        target_name: 'yaml',
      }),
    ]);
    expect(payload.data.build_quality).toEqual({
      ok_count: 0,
      no_parser_count: 1,
      parse_error_count: 1,
      module_only_count: 1,
    });
    expect(deleteStaleNodes).toHaveBeenNthCalledWith(1, expect.any(Object), []);
    expect(deleteStaleNodes).toHaveBeenNthCalledWith(2, expect.any(Object), ['src/a.swift', 'src/b.kt', 'src/c.rb']);
    expect(upsertNodes).toHaveBeenCalledWith(expect.any(Object), expect.arrayContaining([
      expect.objectContaining({ id: 'src/a.swift#module#a.swift#L0', parser_quality: 'no_parser' }),
      expect.objectContaining({ id: 'src/b.kt#module#b.kt#L0', parser_quality: 'parse_error' }),
      expect.objectContaining({ id: 'src/c.rb#module#c.rb#L0', parser_quality: 'module_only' }),
    ]));
    expect(replaceUnresolvedEdges).toHaveBeenCalledWith(expect.any(Object), [
      expect.objectContaining({ source_file: 'src/c.rb', edge_kind: 'imports_from', target_name: 'json' }),
      expect.objectContaining({ source_file: 'src/c.rb', edge_kind: 'imports_from', target_name: 'yaml' }),
    ]);
    expect(payload.warnings).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'no_parser_files', count: 1 }),
      expect.objectContaining({ type: 'parse_error_files', count: 1 }),
      expect.objectContaining({ type: 'module_only_files', count: 1 }),
      expect.objectContaining({ type: 'force_rebuild_partial', no_parser_count: 1, parse_error_count: 1 }),
      expect.objectContaining({ type: 'high_unresolved_edge_rate', scope: 'last_build' }),
    ]));
    outputSpy.mockRestore();
  });

  test('build 不创建旧路径 .spec-first-graph（negative guard）', async () => {
    const outputSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const mkdirSyncMock = jest.fn();

    jest.isolateModules(() => {
      jest.doMock('better-sqlite3', () => jest.fn());
      jest.doMock('fs', () => {
        const actual = jest.requireActual('fs');
        return {
          ...actual,
          statSync: () => ({ isDirectory: () => true }),
          // Return false for graph dir to trigger mkdirSync, true for everything else
          existsSync: (p) => {
            if (typeof p === 'string' && p.includes('.spec-first/graph')) return false;
            return true;
          },
          mkdirSync: mkdirSyncMock,
          writeFileSync: jest.fn(),
        };
      });
      jest.doMock('../../src/crg/migrations', () => ({
        initDatabase: () => ({
          close: jest.fn(),
          prepare: jest.fn((sql) => {
            if (sql.includes('SELECT file_path FROM nodes')) return { all: () => [] };
            if (sql.includes('SELECT COUNT(*) as c FROM nodes')) return { get: () => ({ c: 0 }) };
            if (sql.includes('SELECT COUNT(*) as c FROM edges')) return { get: () => ({ c: 0 }) };
            if (sql.includes('UPDATE graph_meta SET last_built')) return { run: jest.fn() };
            return { get: () => ({}), all: () => [], run: jest.fn() };
          }),
        }),
      }));
      jest.doMock('../../src/crg/input-convergence', () => ({
        collectInputFiles: async () => ({
          finalInputs: [],
          stats: { ignored_files_by_rule: {} },
        }),
      }));
      jest.doMock('../../src/crg/parser', () => ({
        inferLanguage: () => 'javascript',
        parseFile: () => ({ nodes: [], rawEdges: [], skipped: false }),
      }));
      jest.doMock('../../src/crg/incremental', () => ({
        detectChangedFiles: () => ({ changed: [], deleted: [], changedShas: new Map() }),
        updateFingerprints: jest.fn(),
      }));
      jest.doMock('../../src/crg/graph', () => ({
        upsertNodes: jest.fn(),
        upsertEdges: jest.fn(),
        deleteStaleNodes: jest.fn(),
        resolveEdges: () => ({ resolved: [], unresolvedCount: 0, unresolved: [] }),
        setUnresolvedEdgeCount: jest.fn(),
        replaceUnresolvedEdges: jest.fn(),
      }));
      jest.doMock('../../src/crg/cli/postprocess', () => ({
        runPostprocess: jest.fn(),
      }));

      const { run } = require('../../src/crg/cli/build');
      run(['--repo=/repo', '--force']);
    });

    await new Promise((resolve) => setImmediate(resolve));

    // Verify old directory was never created
    const oldPathCalls = mkdirSyncMock.mock.calls.filter(
      (args) => typeof args[0] === 'string' && args[0].includes('spec-first-graph')
    );
    expect(oldPathCalls).toHaveLength(0);

    // Verify new directory was created instead
    const newPathCalls = mkdirSyncMock.mock.calls.filter(
      (args) => typeof args[0] === 'string' && args[0].includes('.spec-first/graph')
    );
    expect(newPathCalls.length).toBeGreaterThan(0);

    outputSpy.mockRestore();
  });

  test('runStats 在 fingerprints 与磁盘不一致时输出 stale warning', () => {
    const outputSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

    jest.isolateModules(() => {
      jest.doMock('better-sqlite3', () => jest.fn());
      jest.doMock('../../src/crg/migrations', () => ({
        initDatabase: () => ({
          close: jest.fn(),
          prepare: jest.fn((sql) => {
            if (sql.includes('SELECT COUNT(*) as c FROM nodes')) return { get: () => ({ c: 3 }) };
            if (sql.includes('SELECT COUNT(*) as c FROM edges')) return { get: () => ({ c: 2 }) };
            if (sql.includes('SUM(line_end - line_start)')) return { get: () => ({ total: 42 }) };
            if (sql.includes('SELECT last_built, unresolved_edge_count')) {
              return { get: () => ({ last_built: '2026-04-11T00:00:00.000Z', unresolved_edge_count: 1 }) };
            }
            if (sql.includes('FROM unresolved_edges') && sql.includes('GROUP BY edge_kind')) {
              return { all: () => [{ kind: 'imports_from', count: 1 }] };
            }
            if (sql.includes('FROM unresolved_edges') && sql.includes('GROUP BY source_file')) {
              return { all: () => [{ file_path: 'src/a.js', count: 1 }] };
            }
            if (sql.includes('FROM unresolved_edges') && sql.includes('LIMIT 10')) {
              return { all: () => [{ source_id: 'src/a.js#module#a.js#L0', source_file: 'src/a.js', edge_kind: 'imports_from', target_name: 'x', target_path_raw: 'x' }] };
            }
            if (sql.includes('SELECT COUNT(*) AS c FROM unresolved_edges')) {
              return { get: () => ({ c: 1 }) };
            }
            if (sql.includes('SELECT file_path, sha256 FROM fingerprints')) {
              return { all: () => [{ file_path: 'src/a.js', sha256: 'old-sha' }] };
            }
            return { get: () => ({}), all: () => [] };
          }),
        }),
      }));
      jest.doMock('../../src/crg/incremental', () => ({
        computeFileSHA: () => ({ sha: 'new-sha' }),
      }));
      jest.doMock('fs', () => {
        const actual = jest.requireActual('fs');
        return {
          ...actual,
          existsSync: () => true,
        };
      });

      const { runStats } = require('../../src/crg/cli/build');
      runStats(['--repo=/repo']);
    });

    const payload = JSON.parse(outputSpy.mock.calls[0][0]);
    expect(payload.warnings).toEqual([
      expect.objectContaining({
        type: 'stale',
        stale_files: ['src/a.js'],
      }),
    ]);
    expect(payload.data.last_build_unresolved_edge_count).toBe(1);
    expect(payload.data.last_build_unresolved_summary).toEqual({
      top_kinds: [{ kind: 'imports_from', count: 1 }],
      top_source_files: [{ file_path: 'src/a.js', count: 1 }],
      sample_count: 1,
    });
    expect(payload.data.last_build_unresolved_samples).toEqual([
      expect.objectContaining({ source_file: 'src/a.js', edge_kind: 'imports_from', target_name: 'x' }),
    ]);
    outputSpy.mockRestore();
  });
});
