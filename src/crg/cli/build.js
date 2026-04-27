'use strict';

/**
 * CRG build 子命令：全量/增量构建代码图
 * CRG stats 子命令：查看已构建代码图的统计信息
 *
 * 均在本文件中实现，分别导出 run（build）和 runStats（stats）。
 *
 * 注意：better-sqlite3 为可选原生模块，未安装时 exit 2 给出清晰提示。
 */

const path = require('path');
const fs = require('fs');
const { makeEnvelope } = require('./envelope');
const {
  GRAPH_CODE_NAVIGATION_FILE,
  GRAPH_QUALITY_FILE,
  GRAPH_INDEX_STATUS_FILE,
  GRAPH_OPERATIONS_LOG_FILE,
  resolveGraphDir,
  resolveGraphDb,
  resolveGraphInputFingerprints,
  resolveRepoTopology,
} = require('../artifact-paths');
const {
  buildGenerationId,
  resolveActiveGraphDb,
  resolveGenerationDb,
  resolveGenerationDir,
} = require('../generations/paths');

const GRAPH_CODE_NAVIGATION_FILENAME = GRAPH_CODE_NAVIGATION_FILE || 'code-navigation.json';
const GRAPH_QUALITY_FILENAME = GRAPH_QUALITY_FILE || 'graph-quality.json';
const GRAPH_INDEX_STATUS_FILENAME = GRAPH_INDEX_STATUS_FILE || 'graph-index-status.json';
const GRAPH_OPERATIONS_LOG_FILENAME = GRAPH_OPERATIONS_LOG_FILE || 'graph-operations.jsonl';

// ---------------------------------------------------------------------------
// 共用：尝试加载 better-sqlite3
// ---------------------------------------------------------------------------

/**
 * 加载 better-sqlite3，失败时打印提示并 exit 2
 *
 * @returns {Function} better-sqlite3 构造函数（仅用于验证是否可加载）
 */
function requireSqlite() {
  try {
    return require('better-sqlite3');
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      process.stderr.write(
        'error: CRG native module (better-sqlite3) not installed. Run: npm install\n'
      );
      process.exit(2);
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 后处理占位调用（Unit 7 实现，此处仅安全 try/catch）
// ---------------------------------------------------------------------------

/**
 * 尝试调用后处理逻辑（社区检测、PageRank、flows 等）。
 * postprocess 模块自身不存在时静默跳过；传递依赖缺失等错误正常上抛。
 *
 * @param {object} db - better-sqlite3 db 实例
 */
function tryPostprocess(db, options = {}) {
  // 先用 require.resolve 检查 postprocess 模块是否存在（不执行）
  // 若模块自身缺失（MODULE_NOT_FOUND），静默跳过
  try {
    require.resolve('./postprocess');
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') return;
    throw e;
  }
  // 模块存在，正常加载并执行（传递依赖缺失等错误允许上抛）
  const { runPostprocess } = require('./postprocess');
  return runPostprocess(db, options);
}

// ---------------------------------------------------------------------------
// build 子命令
// ---------------------------------------------------------------------------

/**
 * 解析 build 所需参数
 *
 * @param {string[]} argv
 * @returns {{ repo: string|null, force: boolean }}
 */
function parseBuildArgs(argv) {
  let repo = null;
  let force = false;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--repo=')) {
      repo = argv[i].slice('--repo='.length);
    } else if (argv[i] === '--repo' && i + 1 < argv.length) {
      repo = argv[++i];
    } else if (argv[i] === '--force') {
      force = true;
    }
  }

  return { repo, force };
}

/**
 * 将 parseFile 结果归类为构建质量信号。
 *
 * 设计取舍：
 * - 不引入额外 schema，仅在 build 输出层暴露当前批次质量
 * - no_parser / parse_error 保留具体原因
 * - module_only 用于识别“仅保留 module 节点”的退化结果
 *
 * @param {{ nodes?: object[], reason?: string, skipped?: boolean }} result
 * @returns {'ok'|'no_parser'|'parse_error'|'module_only'}
 */
function classifyParseQuality(result) {
  const reason = result && typeof result.reason === 'string' ? result.reason : '';
  if (reason === 'no_parser') return 'no_parser';
  if (reason.startsWith('parse_error:')) return 'parse_error';
  const nodes = Array.isArray(result && result.nodes) ? result.nodes : [];
  if (nodes.length === 1 && nodes[0] && nodes[0].kind === 'module') return 'module_only';
  return 'ok';
}

function summarizeUnresolvedRows(rows, countOverride) {
  const unresolvedRows = Array.isArray(rows) ? rows : [];
  const unresolvedByKind = Object.create(null);
  const unresolvedByFile = Object.create(null);

  for (const row of unresolvedRows) {
    unresolvedByKind[row.edge_kind] = (unresolvedByKind[row.edge_kind] || 0) + 1;
    unresolvedByFile[row.source_file] = (unresolvedByFile[row.source_file] || 0) + 1;
  }

  return {
    count: typeof countOverride === 'number' ? countOverride : unresolvedRows.length,
    top_kinds: Object.entries(unresolvedByKind)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([kind, count]) => ({ kind, count })),
    top_source_files: Object.entries(unresolvedByFile)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([file_path, count]) => ({ file_path, count })),
    samples: unresolvedRows.slice(0, 10),
  };
}

function loadPersistedUnresolvedSnapshot(db) {
  const metaRow = db.prepare(
    'SELECT unresolved_edge_count FROM graph_meta WHERE id = 1'
  ).get();
  const count = metaRow ? (metaRow.unresolved_edge_count || 0) : 0;
  const topKinds = db.prepare(`
    SELECT edge_kind AS kind, COUNT(*) AS count
    FROM unresolved_edges
    GROUP BY edge_kind
    ORDER BY count DESC
    LIMIT 5
  `).all();
  const topSourceFiles = db.prepare(`
    SELECT source_file AS file_path, COUNT(*) AS count
    FROM unresolved_edges
    GROUP BY source_file
    ORDER BY count DESC
    LIMIT 5
  `).all();
  const samples = db.prepare(`
    SELECT source_id, source_file, edge_kind, target_name, target_path_raw
    FROM unresolved_edges
    LIMIT 10
  `).all();
  const sampleCountRow = db.prepare('SELECT COUNT(*) AS c FROM unresolved_edges').get();

  return {
    count,
    top_kinds: topKinds,
    top_source_files: topSourceFiles,
    samples,
    sample_count: sampleCountRow ? (sampleCountRow.c || 0) : 0,
  };
}

function safeAll(db, sql, params = []) {
  try {
    return db.prepare(sql).all(...params);
  } catch (_) {
    return [];
  }
}

function safeCount(db, tableName) {
  try {
    const row = db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get();
    return row ? row.count || 0 : 0;
  } catch (_) {
    return 0;
  }
}

function writeJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
}

function appendOperation(repoRoot, payload) {
  const logPath = path.join(resolveGraphDir(repoRoot), GRAPH_OPERATIONS_LOG_FILENAME);
  try {
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.appendFileSync(logPath, `${JSON.stringify({
      schema_version: 'graph-operations/v1',
      generated_at: new Date().toISOString(),
      ...payload,
    })}\n`);
  } catch (_) {
    // 操作日志是审计线索，不能阻断 graph build 主产出。
  }
}

function writeGraphControlPlane({ repoRoot, db, nodeCount, edgeCount, generationId, warnings = [], degraded = false, qualityPath = null }) {
  const graphDir = resolveGraphDir(repoRoot);
  const topCommunities = safeAll(db, `
    SELECT id AS community_id, label, file_count
    FROM communities
    ORDER BY file_count DESC
    LIMIT 5
  `);
  const topFlows = safeAll(db, `
    SELECT id AS flow_id, entry_node_id AS entry_node, name, criticality, node_count
    FROM flows
    ORDER BY criticality DESC
    LIMIT 5
  `);
  const highRiskNodes = safeAll(db, `
    SELECT id, name, file_path, kind
    FROM nodes
    WHERE kind != 'module'
    ORDER BY is_test ASC, line_end - line_start DESC
    LIMIT 10
  `);
  const testRoots = safeAll(db, `
    SELECT DISTINCT file_path
    FROM nodes
    WHERE is_test = 1
    LIMIT 20
  `).map((row) => row.file_path);

  const status = {
    schema_version: 'graph-index-status/v1',
    generated_at: new Date().toISOString(),
    generation_id: generationId,
    state: degraded ? 'degraded' : 'ready',
    stats: {
      node_count: nodeCount,
      edge_count: edgeCount,
      community_count: safeCount(db, 'communities'),
      flow_count: safeCount(db, 'flows'),
    },
    artifacts: {
      quality: qualityPath || null,
    },
    capabilities: {
      locate: nodeCount > 0,
      path: edgeCount > 0,
      explain: nodeCount > 0,
      impact: nodeCount > 0,
      review_context: nodeCount > 0,
      workflow_context: true,
      hook: true,
    },
    limitations: warnings.map((warning) => ({
      code: warning.type || 'build-warning',
      message: JSON.stringify(warning),
    })),
  };
  const navigation = {
    schema_version: 'code-navigation/v1',
    generated_at: status.generated_at,
    generation_id: generationId,
    entrypoints: highRiskNodes.slice(0, 5),
    test_roots: testRoots,
    high_risk_nodes: highRiskNodes,
    top_communities: topCommunities,
    top_flows: topFlows,
    query_starters: [
      { query: 'repository architecture modules entrypoints', command: 'spec-first crg locate --repo=<repo> --query="repository architecture modules entrypoints"' },
      { query: 'review risks candidate tests', command: 'spec-first crg review-context --repo=<repo> --since=<base>' },
    ],
    quality_path: qualityPath || null,
    limitations: [],
  };

  writeJson(path.join(graphDir, GRAPH_INDEX_STATUS_FILENAME), status);
  writeJson(path.join(graphDir, GRAPH_CODE_NAVIGATION_FILENAME), navigation);
}

/**
 * build 子命令核心逻辑（async，由 run 入口驱动）
 *
 * @param {string[]} argv - router.js 传入的参数（不含子命令名本身）
 */
async function runBuildAsync(argv) {
  const startTime = Date.now();

  const { repo: repoRaw, force } = parseBuildArgs(argv);

  // --repo 是必填参数
  if (!repoRaw) {
    process.stderr.write('error: --repo=<path> is required for crg build\n');
    process.exit(1);
  }

  // 解析并验证目录（router.js 已处理，但 build.js 独立保持可测）
  const repoRoot = path.resolve(repoRaw);
  try {
    const stat = fs.statSync(repoRoot);
    if (!stat.isDirectory()) {
      process.stderr.write(`error: --repo path is not a directory: ${repoRoot}\n`);
      process.exit(1);
    }
  } catch (_) {
    process.stderr.write(`error: --repo path does not exist: ${repoRoot}\n`);
    process.exit(1);
  }

  // 延迟加载 better-sqlite3（未安装时 exit 2）
  requireSqlite();

  // 延迟加载内部模块（确保原生包已可用）
  const { initDatabase } = require('../migrations');
  const { collectInputFiles } = require('../input-convergence');
  const { parseFile, buildChunksForNodes } = require('../parser');
  const { detectChangedFiles, updateFingerprints } = require('../incremental');
  const {
    upsertNodes,
    upsertChunks,
    upsertEdges,
    deleteStaleNodes,
    resolveEdges,
    setUnresolvedEdgeCount,
    replaceUnresolvedEdges,
  } = require('../graph');

  // 确保 .spec-first/graph/ 目录存在
  const graphDir = resolveGraphDir(repoRoot);
  if (!fs.existsSync(graphDir)) {
    fs.mkdirSync(graphDir, { recursive: true });
  }

  const generationId = buildGenerationId();
  const generationDir = resolveGenerationDir(repoRoot, generationId);
  const dbPath = resolveGenerationDb(repoRoot, generationId);
  fs.mkdirSync(generationDir, { recursive: true });

  const currentDbPath = resolveActiveGraphDb(repoRoot);
  if (fs.existsSync(currentDbPath) && currentDbPath !== dbPath) {
    try {
      fs.copyFileSync(currentDbPath, dbPath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  const db = initDatabase(dbPath);

  // iOS 自动检测：Podfile.lock 或 *.xcodeproj / *.xcworkspace 存在即视为 iOS 仓库
  const isIos = (() => {
    if (fs.existsSync(path.join(repoRoot, 'Podfile.lock'))) return true;
    try {
      return fs.readdirSync(repoRoot).some(
        (e) => e.endsWith('.xcodeproj') || e.endsWith('.xcworkspace')
      );
    } catch (_) {
      return false;
    }
  })();

  try {
    // 收集输入文件（async）；collectInputFiles 在收集层已通过语言过滤保证 finalInputs 为纯代码文件
    const { finalInputs, stats: inputStats } = await collectInputFiles(repoRoot, { isIos });
    const inputSet = new Set(finalInputs);

    // 当前输入集之外的历史图路径也必须清理：
    // 仅依赖 fingerprints 会遗漏”已从输入规则中排除、但旧节点仍残留”的路径。
    const existingGraphPaths = db
      .prepare(`
        SELECT file_path FROM nodes
        UNION
        SELECT file_path FROM fingerprints
      `)
      .all()
      .map((row) => row.file_path);
    const prunedPaths = existingGraphPaths.filter((filePath) => !inputSet.has(filePath));

    // --force 时清空 fingerprints，强制全量重建
    if (force) {
      db.prepare('DELETE FROM fingerprints').run();
    }

    // 增量检测（changedShas 供后续 updateFingerprints 复用，避免二次读取）
    const { changed, deleted, changedShas } = detectChangedFiles(db, finalInputs, repoRoot);
    const deletedPaths = [...new Set([...deleted, ...prunedPaths])];

    // 处理已删除文件：移除节点 + 更新 fingerprints
    deleteStaleNodes(db, deletedPaths);
    updateFingerprints(db, [], deletedPaths, repoRoot);

    // 解析变更文件，收集节点和原始边
    const allRawEdges = [];
    const allNodes = [];
    const skippedChanged = [];
    const parsedChanged = [];
    const rebuildableFiles = [];
    const quality = {
      ok_count: 0,
      no_parser_count: 0,
      parse_error_count: 0,
      module_only_count: 0,
      skipped_count: 0,
      parsed_samples: [],
      skipped_samples: [],
      no_parser_samples: [],
      parse_error_samples: [],
      module_only_samples: [],
    };
    for (const file of changed) {
      const result = parseFile(file, repoRoot);
      if (result.skipped) {
        skippedChanged.push(file);
        quality.skipped_count++;
        if (quality.skipped_samples.length < 10) quality.skipped_samples.push(file);
        continue;
      }
      const qualityStatus = classifyParseQuality(result);
      if (qualityStatus === 'ok') quality.ok_count++;
      if (qualityStatus === 'no_parser') quality.no_parser_count++;
      if (qualityStatus === 'parse_error') quality.parse_error_count++;
      if (qualityStatus === 'module_only') quality.module_only_count++;
      const sampleKey = `${qualityStatus}_samples`;
      if (Array.isArray(quality[sampleKey]) && quality[sampleKey].length < 10) {
        quality[sampleKey].push(file);
      }

      // no_parser / parse_error 属于退化结果：
      // 已有旧事实时不覆盖；没有旧事实时保留 module 级 fallback，避免文件从查询面完全消失。
      // 其余结果（ok / module_only）视为可重建，参与文件级局部替换。
      if (qualityStatus === 'no_parser' || qualityStatus === 'parse_error') {
        if (!existingGraphPaths.includes(file) && Array.isArray(result.nodes) && result.nodes.length > 0) {
          parsedChanged.push(file);
          rebuildableFiles.push(file);
          if (quality.parsed_samples.length < 10) quality.parsed_samples.push(file);
          for (const node of result.nodes) {
            node.parser_quality = qualityStatus;
            node.generation_id = generationId;
          }
          allNodes.push(...result.nodes.filter((node) => node.kind === 'module'));
        }
        continue;
      }

      parsedChanged.push(file);
      if (quality.parsed_samples.length < 10) quality.parsed_samples.push(file);
      rebuildableFiles.push(file);
      for (const node of result.nodes) {
        node.parser_quality = qualityStatus;
        node.generation_id = generationId;
      }
      allNodes.push(...result.nodes);
      allRawEdges.push(...result.rawEdges);
    }

    // 对成功解析的 changed 文件执行"局部替换"：
    // 先按 file_path 删除旧节点（级联删除旧边），再统一写入新节点。
    // 这样可避免函数改名 / 删除 / 行号变化时旧事实残留。
    deleteStaleNodes(db, rebuildableFiles);
    upsertNodes(db, allNodes);
    if (typeof buildChunksForNodes === 'function') {
      upsertChunks(db, buildChunksForNodes(allNodes));
    }

    // 批量解析边并写入
    const { resolved, unresolvedCount, unresolved, inferredNodes = [] } = resolveEdges(db, allRawEdges, repoRoot);
    if (inferredNodes.length > 0) {
      upsertNodes(db, inferredNodes);
    }
    upsertEdges(db, resolved);
    // 仅在实际处理了文件时更新 unresolved_edge_count：
    //   增量构建 0 变更时 unresolvedCount=0，不代表真实情况，保留上一次全量构建的值
    if (parsedChanged.length > 0 || force) {
      setUnresolvedEdgeCount(db, unresolvedCount);
      replaceUnresolvedEdges(db, unresolved);
    }

    // 更新 fingerprints：
    //   - 仅为真正入图的变更文件 upsert
    //   - 对解析阶段 skipped 的文件做 delete，避免留下无效指纹
    updateFingerprints(db, parsedChanged, skippedChanged, repoRoot, changedShas);

    // 更新 graph_meta.last_built
    db.prepare(`UPDATE graph_meta SET last_built = ? WHERE id = 1`).run(new Date().toISOString());

    const buildSnapshot = {
      generation_id: generationId,
      generation_dir: generationDir,
      final_input_count: finalInputs.length,
      changed_count: changed.length,
      parsed_count: parsedChanged.length,
      parsed_files: parsedChanged,
      parsed_samples: quality.parsed_samples,
      skipped_count: quality.skipped_count,
      skipped_samples: quality.skipped_samples,
      no_parser_count: quality.no_parser_count,
      no_parser_samples: quality.no_parser_samples,
      parse_error_count: quality.parse_error_count,
      parse_error_samples: quality.parse_error_samples,
      module_only_count: quality.module_only_count,
      module_only_samples: quality.module_only_samples,
      skipped_sensitive_count: inputStats.ignored_files_by_rule.sensitive_pattern || 0,
      warnings: [],
    };

    // 后处理占位（Unit 7）
    const postprocessStats = tryPostprocess(db, {
      repoRoot,
      generationId,
      generationDir,
      buildSnapshot,
      writeControlPlane: false,
    }) || {};

    // 写入 fingerprints.json（Unit 9）
    writeFingerprintsJson(db, repoRoot);

    // 统计计数
    const nodeCount = db.prepare('SELECT COUNT(*) as c FROM nodes').get().c;
    const edgeCount = db.prepare('SELECT COUNT(*) as c FROM edges').get().c;
    const durationMs = Date.now() - startTime;
    const skippedSensitive = inputStats.ignored_files_by_rule.sensitive_pattern || 0;
    const warnings = [];
    const unresolvedRate = allRawEdges.length > 0 ? unresolvedCount / allRawEdges.length : 0;

    if (skippedSensitive > 0) {
      process.stderr.write(`warning: skipped_sensitive: ${skippedSensitive}\n`);
      warnings.push({
        type: 'skipped_sensitive',
        count: skippedSensitive,
      });
    }

    if (unresolvedRate > 0.1) {
      warnings.push({
        type: 'high_unresolved_edge_rate',
        scope: 'last_build',
        rate: unresolvedRate,
        unresolved_count: unresolvedCount,
      });
    }

    const hasParserDegradation = quality.no_parser_count > 0 || quality.parse_error_count > 0;

    if (quality.no_parser_count > 0) {
      warnings.push({
        type: 'no_parser_files',
        count: quality.no_parser_count,
      });
    }
    if (quality.parse_error_count > 0) {
      warnings.push({
        type: 'parse_error_files',
        count: quality.parse_error_count,
      });
    }
    if (quality.module_only_count > 0) {
      warnings.push({
        type: 'module_only_files',
        count: quality.module_only_count,
      });
    }
    if (force && hasParserDegradation) {
      warnings.push({
        type: 'force_rebuild_partial',
        no_parser_count: quality.no_parser_count,
        parse_error_count: quality.parse_error_count,
      });
    }

    const currentUnresolvedSnapshot = summarizeUnresolvedRows(unresolved, unresolvedCount);
    const lastBuildUnresolvedSnapshot = (parsedChanged.length === 0 && !force)
      ? loadPersistedUnresolvedSnapshot(db)
      : {
        ...currentUnresolvedSnapshot,
        sample_count: unresolved.length,
      };
    const { assessGenerationHealth } = require('../generations/health');
    const { promoteGeneration } = require('../generations/promote');
    const { writeGraphQualityReport } = require('../quality/report');
    const { detectRepoTopology, writeRepoTopology } = require('../topology/modules');
    const health = assessGenerationHealth({
      dbPath,
      nodeCount,
      edgeCount,
    });
    if (!health.healthy) {
      warnings.push({
        type: 'generation_health_failed',
        reason: health.reason,
      });
    }
    const repoTopology = writeRepoTopology(repoRoot, detectRepoTopology(repoRoot));
    buildSnapshot.warnings = warnings;

    const envelope = makeEnvelope(repoRoot, {
      generation_id: generationId,
      node_count: nodeCount,
      edge_count: edgeCount,
      changed_files: parsedChanged.length,
      duration_ms: durationMs,
      skipped_sensitive: skippedSensitive,
      unresolved_edge_count: lastBuildUnresolvedSnapshot.count,
      last_build_unresolved_edge_count: lastBuildUnresolvedSnapshot.count,
      last_build_unresolved_summary: {
        top_kinds: lastBuildUnresolvedSnapshot.top_kinds,
        top_source_files: lastBuildUnresolvedSnapshot.top_source_files,
        sample_count: lastBuildUnresolvedSnapshot.sample_count,
      },
      last_build_unresolved_samples: lastBuildUnresolvedSnapshot.samples,
      build_quality: {
        ok_count: quality.ok_count,
        no_parser_count: quality.no_parser_count,
        parse_error_count: quality.parse_error_count,
        module_only_count: quality.module_only_count,
      },
      build_quality_detail: {
        skipped_count: quality.skipped_count,
        parsed_samples: quality.parsed_samples,
        skipped_samples: quality.skipped_samples,
        no_parser_samples: quality.no_parser_samples,
        parse_error_samples: quality.parse_error_samples,
        module_only_samples: quality.module_only_samples,
      },
      topology: {
        kind: repoTopology.kind,
        unit_count: repoTopology.units.length,
        artifact_path: resolveRepoTopology(repoRoot),
      },
    }, { warnings, degraded: hasParserDegradation || !health.healthy });

    const qualityResult = writeGraphQualityReport(db, {
      repoRoot,
      generationId,
      generationDir,
      buildSnapshot,
      postprocessStats,
      warnings,
      writeControlPlane: health.healthy,
    });
    const relativeQualityPath = path.relative(repoRoot, qualityResult.path);

    if (health.healthy) {
      promoteGeneration(repoRoot, {
        generationId,
        dbPath,
        health,
        qualityPath: relativeQualityPath,
      });
    }
    writeGraphControlPlane({
      repoRoot,
      db,
      nodeCount,
      edgeCount,
      generationId,
      warnings,
      degraded: hasParserDegradation || !health.healthy,
      qualityPath: health.healthy ? path.join('.spec-first', 'graph', GRAPH_QUALITY_FILENAME) : null,
    });
    appendOperation(repoRoot, {
      operation: health.healthy ? 'promote' : 'degrade',
      generation_id: generationId,
      node_count: nodeCount,
      edge_count: edgeCount,
      status: health.healthy ? 'ready' : 'degraded',
    });

    process.stdout.write(JSON.stringify(envelope, null, 2) + '\n');
  } finally {
    try { db.close(); } catch (_) {}
  }
}

/**
 * build 子命令入口（由 router.js 调用）
 *
 * @param {string[]} argv
 */
function run(argv) {
  runBuildAsync(argv).catch((err) => {
    process.stderr.write(`error: ${err.message}\n`);
    process.exit(2);
  });
}

// ---------------------------------------------------------------------------
// stats 子命令
// ---------------------------------------------------------------------------

/**
 * stats 子命令入口（由 router.js 调用）
 *
 * @param {string[]} argv - router.js 传入的参数
 */
function runStats(argv) {
  let db;
  // 解析 --repo
  let repoRaw = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--repo=')) {
      repoRaw = argv[i].slice('--repo='.length);
    } else if (argv[i] === '--repo' && i + 1 < argv.length) {
      repoRaw = argv[++i];
    }
  }

  if (!repoRaw) {
    process.stderr.write('error: --repo=<path> is required for crg stats\n');
    process.exit(1);
  }

  const repoRoot = path.resolve(repoRaw);
  const dbPath = resolveActiveGraphDb(repoRoot);

  // 检查图是否已构建
  if (!fs.existsSync(dbPath)) {
    process.stderr.write(
      `error: CRG graph not built. Run: spec-first crg build --repo=${repoRoot}\n`
    );
    process.exit(2);
  }

  // 延迟加载 better-sqlite3（未安装时 exit 2）
  requireSqlite();

  const { initDatabase } = require('../migrations');

  try {
    db = initDatabase(dbPath);

    const nodeCount = db.prepare('SELECT COUNT(*) as c FROM nodes').get().c;
    const edgeCount = db.prepare('SELECT COUNT(*) as c FROM edges').get().c;

    // corpus_health：统计非 module 节点行数之和
    const locRow = db
      .prepare(`SELECT SUM(line_end - line_start) as total FROM nodes WHERE kind != 'module'`)
      .get();
    const totalLoc = locRow.total || 0;

    let healthStatus;
    if (totalLoc < 30000) {
      healthStatus = 'small';
    } else if (totalLoc <= 500000) {
      healthStatus = 'optimal';
    } else {
      healthStatus = 'large';
    }

    const metaRow = db
      .prepare('SELECT last_built, unresolved_edge_count FROM graph_meta WHERE id = 1')
      .get();
    const lastBuilt = metaRow ? metaRow.last_built : null;
    const unresolvedEdgeCount = metaRow ? (metaRow.unresolved_edge_count || 0) : 0;
    const unresolvedSnapshot = loadPersistedUnresolvedSnapshot(db);
    const fingerprintRows = db
      .prepare('SELECT file_path, sha256 FROM fingerprints')
      .all();
    const { computeFileSHA } = require('../incremental');
    const staleFiles = [];
    for (const row of fingerprintRows) {
      const absPath = path.join(repoRoot, row.file_path);
      const current = computeFileSHA(absPath);
      if (!current || current.sha !== row.sha256) {
        staleFiles.push(row.file_path);
      }
    }

    const warnings = [];
    if (staleFiles.length > 0) {
      warnings.push({
        type: 'stale',
        stale_files: staleFiles,
      });
    }

    const envelope = makeEnvelope(repoRoot, {
      node_count: nodeCount,
      edge_count: edgeCount,
      corpus_health: {
        status: healthStatus,
        total_loc: totalLoc,
      },
      last_built: lastBuilt,
      unresolved_edge_count: unresolvedSnapshot.count || unresolvedEdgeCount,
      last_build_unresolved_edge_count: unresolvedSnapshot.count || unresolvedEdgeCount,
      last_build_unresolved_summary: {
        top_kinds: unresolvedSnapshot.top_kinds,
        top_source_files: unresolvedSnapshot.top_source_files,
        sample_count: unresolvedSnapshot.sample_count,
      },
      last_build_unresolved_samples: unresolvedSnapshot.samples,
    }, { warnings });

    process.stdout.write(JSON.stringify(envelope, null, 2) + '\n');
  } catch (err) {
    process.stderr.write(`error: ${err.message}\n`);
    process.exit(2);
  } finally {
    try { if (db) db.close(); } catch (_) {}
  }
}

// ---------------------------------------------------------------------------
// fingerprints.json 产物管理（Unit 9）
// ---------------------------------------------------------------------------

/**
 * 写入 .spec-first/graph/input-fingerprints.json
 *
 * 记录当次构建的输入文件指纹（SHA-256）和输出产物，供增量刷新稳定性验证使用。
 *
 * @param {object} db - better-sqlite3 db 实例
 * @param {string} repoRoot - 仓库根目录
 */
function writeFingerprintsJson(db, repoRoot) {
  const fingerprints = db.prepare('SELECT file_path, sha256 FROM fingerprints').all();
  const meta = db.prepare('SELECT * FROM graph_meta WHERE id = 1').get();

  const pkg = (() => {
    try { return require('../../../package.json'); } catch { return { version: 'unknown' }; }
  })();

  const data = {
    schema_version: meta?.schema_version || 'crg-cli/v1',
    analyzer_version: pkg.version,
    generated_at: new Date().toISOString(),
    inputs: Object.fromEntries(fingerprints.map(f => [f.file_path, f.sha256])),
    outputs: {
      'graph.db': 'sqlite-database',
    },
  };

  const outPath = resolveGraphInputFingerprints(repoRoot);
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
}

module.exports = { run, runStats, classifyParseQuality };
