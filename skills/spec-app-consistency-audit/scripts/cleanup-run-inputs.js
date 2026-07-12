#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { parseCommonArgs, resolvePathAgainstRoot, resolveRepoRoot, writeJsonOutput } = require('./lib/audit-utils');

function cleanupRunInputs(options = {}) {
  const repoRoot = resolveRepoRoot(options);
  if (!options.runDir) throw new Error('cleanup_run_dir_required: --run-dir is required.');
  const runDir = resolvePathAgainstRoot(repoRoot, options.runDir);
  const allowedRoot = path.join(repoRoot, '.spec-first', 'app-audit', 'runs');
  const relative = path.relative(allowedRoot, runDir);
  if (relative === '' || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('cleanup_run_dir_outside_boundary: run-dir must be a child of .spec-first/app-audit/runs.');
  }
  if (!fs.existsSync(allowedRoot) || !fs.existsSync(runDir)) {
    throw new Error('cleanup_run_dir_missing: run-dir and its managed root must exist.');
  }
  if (fs.lstatSync(runDir).isSymbolicLink()) {
    throw new Error('cleanup_run_dir_symlink_rejected: run-dir must not be a symlink.');
  }
  const realAllowedRoot = fs.realpathSync(allowedRoot);
  const realRunDir = fs.realpathSync(runDir);
  const realRepoRoot = fs.realpathSync(repoRoot);
  const managedRelative = path.relative(realRepoRoot, realAllowedRoot);
  if (managedRelative === '' || managedRelative.startsWith('..') || path.isAbsolute(managedRelative)) {
    throw new Error('cleanup_managed_root_realpath_escape: managed run root resolves outside the repository.');
  }
  const realRelative = path.relative(realAllowedRoot, realRunDir);
  if (realRelative === '' || realRelative.startsWith('..') || path.isAbsolute(realRelative)) {
    throw new Error('cleanup_run_dir_realpath_escape: run-dir resolves outside the managed root.');
  }
  const inputDir = path.join(runDir, 'input');
  const existed = fs.existsSync(inputDir);
  if (existed) fs.rmSync(inputDir, { recursive: true, force: true });
  const receipt = {
    schema_version: 'spec-app-consistency-audit-stage-receipt.v1',
    artifact_id: 'cleanup-receipt',
    generated_at: new Date().toISOString(),
    source_inputs: [{
      type: 'run_artifact',
      path: 'input',
      source_hash_unavailable_reason: existed ? 'ephemeral_inputs_removed' : 'ephemeral_inputs_absent',
      freshness: 'current-run',
    }],
    consumers: ['runner', 'artifact-consumers'],
    contract_status: 'candidate',
    data_sensitivity: 'internal',
    stage: 'cleanup',
    producer_kind: 'deterministic_script',
    input_hashes: [],
    artifact_path: 'receipts/cleanup.json',
    status: 'complete',
    reason_codes: [existed ? 'ephemeral_inputs_removed' : 'ephemeral_inputs_already_absent'],
    limitations: ['Host agent transcripts are outside run-directory cleanup authority.'],
    retention_state: 'ephemeral_removed',
    cleanup_state: existed ? 'removed' : 'already_absent',
  };
  return receipt;
}

if (require.main === module) {
  try {
    const options = parseCommonArgs(process.argv.slice(2));
    writeJsonOutput(cleanupRunInputs(options), options.output, options);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { cleanupRunInputs };
