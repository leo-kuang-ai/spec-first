#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const {
  hashFile,
  parseCommonArgs,
  publicPath,
  resolvePathAgainstRoot,
  resolveRepoRoot,
  unavailableSourceInput,
  writeJsonOutput,
} = require('./lib/audit-utils');
const { validateArtifact } = require('./validate-artifacts');

function buildAuditContext(options = {}) {
  if (!options.artifactsDir && !options.runDir) {
    throw new Error('artifacts_dir_required: build-audit-context requires --artifacts-dir or run-dir:<path>.');
  }
  const repoRoot = resolveRepoRoot(options);
  const artifactsDir = resolvePathAgainstRoot(repoRoot, options.artifactsDir || options.runDir);
  const outputPath = options.output ? resolvePathAgainstRoot(repoRoot, options.output) : null;
  assertManagedContextPaths(repoRoot, artifactsDir, outputPath);
  const files = listJsonFiles(artifactsDir, {
    excludeDirs: new Set(['input', 'writeback-preview']),
    exclude: new Set([
      outputPath,
      path.join(artifactsDir, 'app-audit-context.json'),
      path.join(artifactsDir, 'artifact-manifest.json'),
      path.join(artifactsDir, 'latest-summary.json'),
    ].filter(Boolean).map((filePath) => path.resolve(filePath))),
  });
  const artifacts = [];
  const validation = [];

  for (const filePath of files) {
    let artifact = null;
    try {
      artifact = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
      validation.push({
        file: toPosix(path.relative(artifactsDir, filePath)),
        valid: false,
        errors: [{ path: 'file', code: 'invalid_json', message: error.message }],
      });
      continue;
    }

    const result = validateArtifact(artifact);
    validation.push({
      file: toPosix(path.relative(artifactsDir, filePath)),
      valid: result.valid,
      errors: result.errors,
    });
    artifacts.push({
      artifact_id: artifact.artifact_id || null,
      schema_version: artifact.schema_version || null,
      contract_status: artifact.contract_status || null,
      artifact_authority: artifact.artifact_authority || null,
      retention_class: artifact.retention_class || null,
      run_id: artifact.run_id || null,
      prepare_fingerprint: artifact.prepare_fingerprint || null,
      generated_at: artifact.generated_at || null,
      source_inputs: artifact.source_inputs || [],
      consumers: artifact.consumers || [],
      coverage_caps: artifact.coverage && Array.isArray(artifact.coverage.conclusion_caps)
        ? artifact.coverage.conclusion_caps
        : [],
      file: toPosix(path.relative(artifactsDir, filePath)),
    });
  }

  const context = {
    schema_version: 'spec-app-consistency-audit-context.v1',
    artifact_id: 'app-audit-context',
    generated_at: new Date().toISOString(),
    source_inputs: artifacts.length > 0
      ? artifacts.map((entry) => ({
        type: 'run_artifact',
        path: entry.file,
        source_hash: hashFile(path.join(artifactsDir, entry.file)),
        freshness: 'current-run',
      }))
      : [unavailableSourceInput('run_artifacts', publicPath(repoRoot, artifactsDir, 'run-outside-repo'), 'no_json_artifacts')],
    consumers: ['llm-audit-planner', 'expert-agents', 'report-writer'],
    contract_status: 'candidate',
    data_sensitivity: 'internal',
    artifacts_dir: publicPath(repoRoot, artifactsDir, 'run-outside-repo'),
    artifact_count: artifacts.length,
    valid: validation.every((entry) => entry.valid),
    artifacts,
    validation,
    degraded_modes: validation
      .filter((entry) => !entry.valid)
      .map((entry) => ({
        code: 'invalid_artifact',
        severity: 'error',
        summary: `Artifact failed validation: ${entry.file}`,
        path: entry.file,
      })),
  };

  return context;
}

function isInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function existingParent(filePath) {
  let current = path.resolve(filePath);
  while (!fs.existsSync(current)) current = path.dirname(current);
  return fs.realpathSync(fs.statSync(current).isDirectory() ? current : path.dirname(current));
}

function assertManagedContextPaths(repoRoot, artifactsDir, outputPath) {
  const realRepo = fs.realpathSync(repoRoot);
  const managedRoot = path.join(realRepo, '.spec-first', 'app-audit', 'runs');
  if (!fs.existsSync(managedRoot) || !fs.existsSync(artifactsDir) || fs.lstatSync(artifactsDir).isSymbolicLink()) {
    throw new Error('audit_context_run_boundary_invalid: artifacts-dir must be an existing non-symlink managed run.');
  }
  const realManaged = fs.realpathSync(managedRoot);
  const realArtifacts = fs.realpathSync(artifactsDir);
  if (!isInside(realRepo, realManaged) || realManaged === realRepo || !isInside(realManaged, realArtifacts) || realArtifacts === realManaged) {
    throw new Error('audit_context_run_boundary_escape: artifacts-dir resolves outside the managed run root.');
  }
  if (outputPath) {
    if (fs.existsSync(outputPath) && fs.lstatSync(outputPath).isSymbolicLink()) throw new Error('audit_context_output_symlink_rejected: output must not be a symlink.');
    const parent = existingParent(outputPath);
    if (!isInside(realArtifacts, parent)) throw new Error('audit_context_output_outside_run_boundary: output must remain inside the run.');
  }
}

function listJsonFiles(dirPath, options = {}) {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      if (!options.excludeDirs || !options.excludeDirs.has(entry.name)) {
        files.push(...listJsonFiles(fullPath, options));
      }
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      const absolutePath = path.resolve(fullPath);
      if (!options.exclude || !options.exclude.has(absolutePath)) files.push(fullPath);
    }
  }
  return files.sort((left, right) => left.localeCompare(right));
}

function toPosix(value) {
  return String(value || '').replace(/\\/g, '/');
}

function parseArgs(argv) {
  const options = parseCommonArgs(argv);
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--artifacts-dir') options.artifactsDir = argv[++index];
  }
  return options;
}

if (require.main === module) {
  try {
    const options = parseArgs(process.argv.slice(2));
    const context = buildAuditContext(options);
    const outputPath = options.output ? resolvePathAgainstRoot(resolveRepoRoot(options), options.output) : null;
    writeJsonOutput(context, outputPath, options);
    if (!context.valid) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = {
  buildAuditContext,
};
