'use strict';

const fs = require('fs');
const path = require('path');
const artifactPaths = require('../artifact-paths');
const { GRAPH_QUALITY_FILE = 'graph-quality.json', resolveGraphDir } = artifactPaths;
const { inferJvmPackageRootsFromRows } = require('../graph');

function graphQualityPath(repoRoot, options = {}) {
  if (typeof artifactPaths.resolveGraphQuality === 'function') {
    return artifactPaths.resolveGraphQuality(repoRoot, options);
  }
  if (options.generationDir) return path.join(options.generationDir, GRAPH_QUALITY_FILE);
  return path.join(resolveGraphDir(repoRoot), GRAPH_QUALITY_FILE);
}

function safeAll(db, sql, params = []) {
  try {
    return db.prepare(sql).all(...params);
  } catch (_) {
    return [];
  }
}

function safeGet(db, sql, params = []) {
  try {
    return db.prepare(sql).get(...params) || null;
  } catch (_) {
    return null;
  }
}

function countBy(rows, field) {
  const result = {};
  for (const row of rows || []) {
    const key = row[field] || 'unknown';
    result[key] = (result[key] || 0) + 1;
  }
  return result;
}

function normalizeSamples(items, limit = 10) {
  return (Array.isArray(items) ? items : []).filter(Boolean).slice(0, limit);
}

function ratio(numerator, denominator) {
  if (!denominator) return 0;
  return Number((numerator / denominator).toFixed(4));
}

function classifyUnresolvedTarget(row, repoPackageRoots) {
  const target = String(row && row.target_path_raw || row && row.target_name || '').replace(/^`|`$/g, '');
  if (!target) return 'unknown';
  if (/^(java|javax|android|androidx|kotlin|kotlinx)\./.test(target)) {
    return 'platform_external';
  }
  if (repoPackageRoots.some((root) => target === root || target.startsWith(`${root}.`))) {
    return 'repo_internal_candidate';
  }
  if (target.startsWith('.') || target.startsWith('/')) {
    return 'relative_or_local';
  }
  if (/^[a-zA-Z_][\w$]*(\.[a-zA-Z_][\w$]*)+/.test(target)) {
    return 'third_party_external_candidate';
  }
  return 'symbol_or_unknown';
}

function countUnresolvedTargetCategories(unresolvedRows, repoPackageRoots) {
  const rows = Array.isArray(unresolvedRows) ? unresolvedRows : [];
  const categories = {};
  for (const row of rows) {
    const category = row.target_category || (row.edge_kind === 'imports_from'
      ? classifyUnresolvedTarget(row, repoPackageRoots)
      : 'symbol_or_unknown');
    categories[category] = (categories[category] || 0) + 1;
  }
  return categories;
}

function buildGraphQualityReport(db, {
  repoRoot,
  generationId,
  generatedAt = new Date().toISOString(),
  buildSnapshot = {},
  postprocessStats = {},
  warnings = [],
} = {}) {
  const nodeRows = safeAll(db, 'SELECT kind, name, parser_quality, confidence, source_tier, file_path, inference_reason FROM nodes');
  const edgeRows = safeAll(db, 'SELECT kind, confidence, resolution_method FROM edges');
  const unresolvedRows = safeAll(db, 'SELECT edge_kind, source_file, target_name, target_path_raw, target_category, target_package_root, reason, confidence, resolution_method FROM unresolved_edges');
  const communityRows = safeAll(db, 'SELECT health_status, community_source, algorithm, cohesion FROM communities');
  const flowRows = safeAll(db, 'SELECT entry_source, entry_confidence, truncated FROM flows');
  const ftsRow = safeGet(db, 'SELECT COUNT(*) AS count FROM fts_nodes');
  const indexedFileRow = safeGet(db, 'SELECT COUNT(DISTINCT file_path) AS count FROM nodes');

  const nodeCount = nodeRows.length;
  const edgeCount = edgeRows.length;
  const unresolvedCount = unresolvedRows.length;
  const indexedFileCount = indexedFileRow ? indexedFileRow.count || 0 : 0;
  const changedParsedCount = buildSnapshot.parsed_count ?? buildSnapshot.parsed_files?.length ?? null;
  const finalInputCount = buildSnapshot.final_input_count ?? null;
  const noParserCount = buildSnapshot.no_parser_count ?? 0;
  const parseErrorCount = buildSnapshot.parse_error_count ?? 0;
  const skippedCount = buildSnapshot.skipped_count ?? 0;
  const skippedSensitiveCount = buildSnapshot.skipped_sensitive_count ?? 0;
  const repoPackageRoots = inferJvmPackageRootsFromRows(nodeRows);
  const unresolvedTargetCategories = countUnresolvedTargetCategories(unresolvedRows, repoPackageRoots);
  const externalDependencyRows = nodeRows.filter((row) => row.kind === 'external_dependency');

  const limitations = [];
  if (nodeCount === 0) {
    limitations.push({ code: 'graph-empty', message: 'No indexed nodes are available.' });
  }
  if (edgeCount === 0) {
    limitations.push({ code: 'edge-empty', message: 'No resolved edges are available; impact and flow evidence are low signal.' });
  }
  if (noParserCount > 0) {
    limitations.push({ code: 'no-parser-files', count: noParserCount, samples: normalizeSamples(buildSnapshot.no_parser_samples) });
  }
  if (parseErrorCount > 0) {
    limitations.push({ code: 'parse-error-files', count: parseErrorCount, samples: normalizeSamples(buildSnapshot.parse_error_samples) });
  }
  if (skippedSensitiveCount > 0) {
    limitations.push({ code: 'skipped-sensitive-files', count: skippedSensitiveCount });
  }
  if (unresolvedCount > 0) {
    limitations.push({ code: 'unresolved-edges', count: unresolvedCount });
  }

  return {
    schema_version: 'graph-quality/v1',
    generated_at: generatedAt,
    generation_id: generationId || null,
    repo_root: repoRoot || null,
    advisory: true,
    coverage: {
      final_input_count: finalInputCount,
      parsed_count: indexedFileCount,
      changed_parsed_count: changedParsedCount,
      skipped_count: skippedCount,
      no_parser_count: noParserCount,
      parse_error_count: parseErrorCount,
      module_only_count: buildSnapshot.module_only_count ?? 0,
      skipped_sensitive_count: skippedSensitiveCount,
      parser_success_rate: finalInputCount == null ? null : Math.min(ratio(indexedFileCount, finalInputCount), 1),
      samples: {
        skipped: normalizeSamples(buildSnapshot.skipped_samples),
        no_parser: normalizeSamples(buildSnapshot.no_parser_samples),
        parse_error: normalizeSamples(buildSnapshot.parse_error_samples),
      },
    },
    graph: {
      node_count: nodeCount,
      edge_count: edgeCount,
      nodes_by_kind: countBy(nodeRows, 'kind'),
      edges_by_kind: countBy(edgeRows, 'kind'),
      confidence_distribution: {
        nodes: countBy(nodeRows, 'confidence'),
        edges: countBy(edgeRows, 'confidence'),
      },
      edge_resolution_methods: countBy(edgeRows, 'resolution_method'),
    },
    unresolved_edges: {
      count: unresolvedCount,
      rate: ratio(unresolvedCount, unresolvedCount + edgeCount),
      by_kind: countBy(unresolvedRows, 'edge_kind'),
      by_reason: countBy(unresolvedRows, 'reason'),
      by_target_category: unresolvedTargetCategories,
      repo_package_roots: normalizeSamples(repoPackageRoots, 10),
      by_resolution_method: countBy(unresolvedRows, 'resolution_method'),
      samples: normalizeSamples(safeAll(db, `
        SELECT source_id, source_file, edge_kind, target_name, target_path_raw, reason, evidence
        FROM unresolved_edges
        LIMIT 10
      `)),
    },
    retrieval_index: {
      fts_indexed: postprocessStats.fts_indexed ?? (ftsRow ? ftsRow.count : 0),
      fts_skipped: postprocessStats.fts_skipped ?? 0,
      coverage_status: nodeCount > 0 && (postprocessStats.fts_indexed ?? (ftsRow ? ftsRow.count : 0)) === 0 ? 'unknown' : 'available',
    },
    external_dependencies: {
      count: externalDependencyRows.length,
      by_category: countBy(externalDependencyRows, 'inference_reason'),
      samples: normalizeSamples(externalDependencyRows.map((row) => ({
        name: row.name,
        category: row.inference_reason || 'unknown',
      }))),
    },
    communities: {
      count: communityRows.length,
      status: communityRows.length > 0 ? 'available' : 'unknown',
      by_health: countBy(communityRows, 'health_status'),
      by_source: countBy(communityRows, 'community_source'),
      by_algorithm: countBy(communityRows, 'algorithm'),
    },
    flows: {
      count: flowRows.length,
      status: flowRows.length > 0 ? 'available' : 'unknown',
      by_entry_source: countBy(flowRows, 'entry_source'),
      by_entry_confidence: countBy(flowRows, 'entry_confidence'),
      truncated_count: flowRows.filter((row) => row.truncated).length,
    },
    warnings: Array.isArray(warnings) ? warnings : [],
    limitations,
  };
}

function summarizeGraphQuality(report) {
  if (!report) {
    return {
      state: 'missing',
      limitations: [{ code: 'graph-quality-missing', message: 'graph-quality.json is not available.' }],
    };
  }
  return {
    state: report.graph && report.graph.node_count > 0 ? 'available' : 'degraded',
    generation_id: report.generation_id || null,
    advisory: report.advisory !== false,
    coverage: report.coverage || null,
    unresolved_edges: report.unresolved_edges ? {
      count: report.unresolved_edges.count,
      rate: report.unresolved_edges.rate,
      by_reason: report.unresolved_edges.by_reason,
      by_target_category: report.unresolved_edges.by_target_category,
    } : null,
    graph: report.graph ? {
      node_count: report.graph.node_count,
      edge_count: report.graph.edge_count,
      confidence_distribution: report.graph.confidence_distribution,
    } : null,
    communities: report.communities || null,
    flows: report.flows || null,
    external_dependencies: report.external_dependencies || null,
    limitations: normalizeSamples(report.limitations, 8),
  };
}

function readGraphQuality(repoRoot, options = {}) {
  const candidates = [];
  if (options.generationDir) candidates.push(graphQualityPath(repoRoot, { generationDir: options.generationDir }));
  candidates.push(graphQualityPath(repoRoot));

  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch (_) {
      return null;
    }
  }
  return null;
}

function writeGraphQualityReport(db, options = {}) {
  const report = buildGraphQualityReport(db, options);
  const generationDir = options.generationDir;
  if (!generationDir) {
    throw new Error('writeGraphQualityReport requires generationDir');
  }
  const generationPath = graphQualityPath(options.repoRoot, { generationDir });
  fs.mkdirSync(path.dirname(generationPath), { recursive: true });
  fs.writeFileSync(generationPath, JSON.stringify(report, null, 2));

  let controlPlanePath = null;
  if (options.writeControlPlane !== false) {
    // 控制面副本只指向最新 active generation，方便 hook/status 轻量读取。
    controlPlanePath = path.join(resolveGraphDir(options.repoRoot), GRAPH_QUALITY_FILE);
    fs.mkdirSync(path.dirname(controlPlanePath), { recursive: true });
    fs.writeFileSync(controlPlanePath, JSON.stringify(report, null, 2));
  }
  return { report, path: generationPath, control_plane_path: controlPlanePath };
}

module.exports = {
  buildGraphQualityReport,
  classifyUnresolvedTarget,
  readGraphQuality,
  summarizeGraphQuality,
  writeGraphQualityReport,
};
