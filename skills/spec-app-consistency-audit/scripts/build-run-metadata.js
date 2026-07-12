#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const {
  buildAppAuditCoverageCapabilities,
  buildAppAuditInputExpectations,
  buildAppAuditVerdictScope,
  collectGitDiffFacts,
  createRunId,
  hashText,
  includedUntrackedSourceFiles,
  listSourceTextFiles,
  parseCommonArgs,
  publicPath,
  resolvePathAgainstRoot,
  resolveRepoRoot,
  sourceInputFromFile,
  sourceInputFromFiles,
  writeJsonOutput,
} = require('./lib/audit-utils');

function buildRunMetadata(options = {}) {
  if (options.mode === 'report-only') {
    throw new Error('mode:report-only forbids metadata artifact writes.');
  }
  if (options.mode === 'headless' && !options.base) {
    throw new Error('scope_headless_missing_base: mode:headless requires base:<ref> before metadata writes.');
  }
  const repoRoot = resolveRepoRoot(options);
  const runId = options.runId || createRunId();
  const absoluteRunDir = options.runDir
    ? resolvePathAgainstRoot(repoRoot, options.runDir)
    : path.join(repoRoot, '.spec-first', 'app-audit', 'runs', runId);
  const publicRunDir = publicPath(repoRoot, absoluteRunDir, 'run-outside-repo');
  const generatedAt = new Date().toISOString();
  const status = options.status || 'started';
  const source = listSourceTextFiles({
    repoRoot,
    source: options.source || '.',
    allowOutside: options.allowOutside,
    maxFiles: options.maxFiles || options.maxScanFiles || 2000,
  });
  const diffFacts = collectGitDiffFacts(repoRoot, options);
  const includedUntrackedFiles = includedUntrackedSourceFiles(repoRoot, source.files, diffFacts.untrackedFiles);
  const headSha = gitText(repoRoot, ['rev-parse', 'HEAD']).trim();
  const diffHash = diffFacts.diffHash;
  const sourceInput = sourceInputFromFiles('code', source.files, repoRoot, {
    sourceRoot: source.sourceRoot,
    truncated: source.truncated,
    maxFiles: source.maxFiles,
    skippedLargeFiles: source.skippedLargeFiles,
    skippedLargeFileCount: source.skippedLargeFileCount,
  });
  const auxiliaryInputs = [];
  if (options.prd) auxiliaryInputs.push(sourceInputFromFile('prd', resolvePathAgainstRoot(repoRoot, options.prd), repoRoot));
  if (options.figmaContext) auxiliaryInputs.push(sourceInputFromFile('figma', resolvePathAgainstRoot(repoRoot, options.figmaContext), repoRoot));
  const worktreeFingerprint = hashText([
    headSha || 'no-head',
    options.base || '',
    diffHash,
    sourceInput.source_hash || sourceInput.source_hash_unavailable_reason || '',
  ].join('\n'));
  const prepareFingerprint = hashText([
    worktreeFingerprint,
    ...auxiliaryInputs.map((input) => `${input.type}:${input.source_hash || input.source_hash_unavailable_reason || ''}`),
  ].join('\n'));

  const metadata = {
    schema_version: 'spec-app-consistency-audit-metadata.v1',
    artifact_id: 'metadata',
    generated_at: generatedAt,
    source_inputs: [sourceInput, ...auxiliaryInputs],
    consumers: ['parent-workflow', 'report-writer', 'artifact-consumers'],
    contract_status: 'candidate',
    data_sensitivity: 'internal',
    run_id: runId,
    host: options.host || process.env.SPEC_FIRST_HOST || 'unknown',
    mode: options.mode || 'default',
    source_root: publicPath(repoRoot, source.sourceRoot, 'source-outside-repo'),
    branch: gitText(repoRoot, ['branch', '--show-current']).trim(),
    head_sha: headSha,
    base_ref: options.base || '',
    resolved_base_sha: diffFacts.resolved_base_sha || '',
    diff_scope_kind: diffFacts.kind,
    worktree_state: gitText(repoRoot, ['status', '--porcelain']).trim() ? 'dirty' : 'clean',
    diff_hash: diffHash,
    worktree_fingerprint: worktreeFingerprint,
    prepare_fingerprint: prepareFingerprint,
    untracked_policy: 'source_snapshot_includes_scanned_untracked',
    included_untracked_files: includedUntrackedFiles,
    generated_against: {
      head_sha: headSha,
      diff_hash: diffHash,
      diff_scope_kind: diffFacts.kind,
      resolved_base_sha: diffFacts.resolved_base_sha || '',
      source_root_hash: sourceInput.source_hash || sourceInput.source_hash_unavailable_reason,
    },
    started_at: options.startedAt || generatedAt,
    status,
    status_reason_codes: [],
    stage_receipts: [],
    contract_versions: {
      preflight: 'spec-app-consistency-audit-preflight.v1',
      impact_facts: 'spec-app-consistency-audit-impact-facts.v1',
      audit_report: 'spec-app-consistency-audit-report.v1',
      issue: 'spec-app-consistency-audit-issue.v1',
    },
    depth: options.depth || 'default',
    input_expectations: buildAppAuditInputExpectations(options),
    coverage_capabilities: buildAppAuditCoverageCapabilities(options),
    audit_verdict_scope: buildAppAuditVerdictScope(options),
    run_dir: publicRunDir,
    summary_path: path.posix.join(publicRunDir, 'app-consistency-audit.summary.md'),
    issues_path: path.posix.join(publicRunDir, 'issues.json'),
  };
  if (options.completedAt || ['complete', 'degraded', 'failed'].includes(status)) {
    metadata.completed_at = options.completedAt || generatedAt;
  }
  return metadata;
}

function buildLatestSummary(metadata) {
  return {
    schema_version: 'spec-app-consistency-audit-latest-summary.v1',
    artifact_id: 'latest-summary',
    generated_at: new Date().toISOString(),
    run_id: metadata.run_id,
    summary_path: metadata.summary_path,
    issues_path: metadata.issues_path,
    head_sha: metadata.head_sha,
    diff_hash: metadata.diff_hash,
    worktree_fingerprint: metadata.worktree_fingerprint,
    source_hash: metadata.generated_against.source_root_hash,
    audit_verdict_scope: metadata.audit_verdict_scope,
  };
}

const FINAL_METADATA_STATUSES = new Set(['complete', 'degraded', 'failed']);

function finalizeMetadata(options = {}) {
  if (!options.metadataPath) {
    throw new Error('finalizeMetadata: metadataPath is required.');
  }
  if (!FINAL_METADATA_STATUSES.has(options.status)) {
    throw new Error(`finalizeMetadata: status must be one of ${[...FINAL_METADATA_STATUSES].join(', ')}.`);
  }
  const fs = require('node:fs');
  const raw = fs.readFileSync(options.metadataPath, 'utf8');
  const metadata = JSON.parse(raw);
  const completedAt = options.completedAt || new Date().toISOString();
  metadata.status = options.status;
  metadata.completed_at = completedAt;
  if (Array.isArray(options.statusReasonCodes) && options.statusReasonCodes.length > 0) {
    const existing = Array.isArray(metadata.status_reason_codes) ? metadata.status_reason_codes : [];
    const merged = [...existing];
    for (const code of options.statusReasonCodes) {
      if (typeof code === 'string' && code.length > 0 && !merged.includes(code)) {
        merged.push(code);
      }
    }
    metadata.status_reason_codes = merged;
  }
  if (Array.isArray(options.stageReceipts)) {
    metadata.stage_receipts = options.stageReceipts;
  }
  fs.writeFileSync(options.metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  return metadata;
}

function appendStageReceipt(options = {}) {
  const fs = require('node:fs');
  const metadata = JSON.parse(fs.readFileSync(options.metadataPath, 'utf8'));
  const receipts = Array.isArray(metadata.stage_receipts) ? metadata.stage_receipts : [];
  const next = receipts.filter((entry) => entry.stage !== options.receipt.stage);
  next.push(options.receipt);
  metadata.stage_receipts = next;
  fs.writeFileSync(options.metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
  return metadata;
}

function gitText(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  return result.status === 0 ? result.stdout : '';
}

if (require.main === module) {
  let options = {};
  try {
    options = parseCommonArgs(process.argv.slice(2));
    const metadata = buildRunMetadata(options);
    writeJsonOutput(metadata, options.output, options);
  } catch (error) {
    if (options.mode === 'headless' && /^scope_/.test(error.message)) {
      const { renderHeadlessFailureEnvelope } = require('./render-headless-envelope');
      process.stdout.write(renderHeadlessFailureEnvelope({
        reasonCode: error.message.split(':')[0],
        message: error.message,
        runId: options.runId,
      }));
    } else {
      process.stderr.write(`${error.message}\n`);
    }
    process.exitCode = 1;
  }
}

module.exports = {
  buildLatestSummary,
  buildRunMetadata,
  finalizeMetadata,
  appendStageReceipt,
};
