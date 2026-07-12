#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const {
  hashFile,
  parseCommonArgs,
  publicPath,
  readJson,
  resolvePathAgainstRoot,
  resolveRepoRoot,
  toPosix,
  unavailableSourceInput,
  writeJsonOutput,
} = require('./lib/audit-utils');

function buildArtifactManifest(options = {}) {
  if (options.mode === 'report-only') {
    throw new Error('mode:report-only forbids artifact-manifest writes.');
  }
  const repoRoot = resolveRepoRoot(options);
  const runDir = resolvePathAgainstRoot(repoRoot, options.runDir || options.source || '.');
  const files = listJsonFiles(runDir, { excludeDirs: new Set(['input', 'writeback-preview']) })
    .filter((filePath) => !new Set(['artifact-manifest.json', 'latest-summary.json']).has(path.basename(filePath)));
  const artifacts = files.map((filePath) => artifactEntry(runDir, filePath));
  const degradedReasonCodes = unique(artifacts.flatMap((entry) => entry.degraded_reason_codes || []));
  const cleanupPath = path.join(runDir, 'receipts', 'cleanup.json');
  const cleanupReceipt = fs.existsSync(cleanupPath) ? readJson(cleanupPath) : null;

  return {
    schema_version: 'spec-app-consistency-audit-artifact-manifest.v1',
    artifact_id: 'artifact-manifest',
    generated_at: new Date().toISOString(),
    source_inputs: artifacts.length > 0
      ? artifacts.map((entry) => ({
        type: 'run_artifact',
        path: entry.path,
        source_hash: entry.sha256,
        freshness: entry.freshness,
      }))
      : [unavailableSourceInput('run_artifacts', publicPath(repoRoot, runDir, 'run-outside-repo'), 'no_json_artifacts')],
    consumers: ['parent-workflow', 'artifact-consumers'],
    contract_status: 'candidate',
    data_sensitivity: 'internal',
    run_id: options.runId || inferRunId(runDir),
    run_dir: publicPath(repoRoot, runDir, 'run-outside-repo'),
    artifact_count: artifacts.length,
    artifacts,
    degraded_reason_codes: degradedReasonCodes,
    cleanup_receipt: cleanupReceipt ? {
      path: 'receipts/cleanup.json',
      status: cleanupReceipt.status,
      reason_codes: cleanupReceipt.reason_codes || [],
      cleanup_state: cleanupReceipt.cleanup_state,
      retention_state: cleanupReceipt.retention_state,
    } : null,
  };
}

function artifactEntry(runDir, filePath) {
  let json = {};
  let invalid = false;
  try {
    json = readJson(filePath);
  } catch (_error) {
    invalid = true;
  }
  const degraded = Array.isArray(json.degraded_modes) ? json.degraded_modes : [];
  return {
    path: toPosix(path.relative(runDir, filePath)),
    schema_version: json.schema_version || null,
    artifact_id: json.artifact_id || null,
    producer: inferProducer(filePath),
    consumers: json.consumers || [],
    sha256: hashFile(filePath),
    freshness: inferFreshness(json),
    data_sensitivity: json.data_sensitivity || 'internal',
    contract_status: json.contract_status || (invalid ? 'rejected' : 'candidate'),
    deprecated_aliases: [],
    degraded_reason_codes: degraded.map((entry) => entry.code).filter(Boolean),
  };
}

function inferProducer(filePath) {
  const name = path.basename(filePath);
  if (name === 'metadata.json') return 'build-run-metadata.js';
  if (name === 'preflight.json') return 'preflight.js';
  if (name === 'impact-facts.json') return 'build-impact-facts.js';
  if (name === 'app-audit-context.json') return 'build-audit-context.js';
  if (name === 'audit-report.json' || name === 'issues.json') return 'merge-contracts.js';
  if (name === 'verification-plan.json') return 'verification-compiler+validate-verification-plan.js';
  return 'app-audit-workflow';
}

function inferFreshness(json) {
  const source = Array.isArray(json.source_inputs) ? json.source_inputs[0] : null;
  return source && source.freshness ? source.freshness : 'current-run';
}

function listJsonFiles(dirPath, options = {}) {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (!options.excludeDirs || !options.excludeDirs.has(entry.name)) files.push(...listJsonFiles(fullPath, options));
    }
    else if (entry.isFile() && entry.name.endsWith('.json')) files.push(fullPath);
  }
  return files.sort((left, right) => left.localeCompare(right));
}

function inferRunId(runDir) {
  return path.basename(path.resolve(runDir));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

if (require.main === module) {
  try {
    const options = parseCommonArgs(process.argv.slice(2));
    const manifest = buildArtifactManifest(options);
    writeJsonOutput(manifest, options.output, options);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  buildArtifactManifest,
};
