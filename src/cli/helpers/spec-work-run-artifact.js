'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { writeFileAtomicIfAbsent } = require('../atomic-write');
const { validateAgainstSchema } = require('../../contracts/schema-validator');
const { readVerificationRunSummary, aggregateRunSummaryStatus } = require('./verification-run-summary');
const {
  resolveTargetRepoRoot,
  validateOutputContainment,
  validateRepoRelativeField,
} = require('./target-repo');

const PAYLOAD_SCHEMA_VERSION = 'spec-work-run-artifact-payload/v2';
const ARTIFACT_SCHEMA_VERSION = 'spec-work-run-artifact/v2';
const STATE_SCHEMA_VERSION = 'spec-work-run-state/v1';
// 此 producer 仅服务 spec-work closeout,故 ref 固定 spec-work。verification-run-summary
// 已支持 spec-debug/spec-code-review workflow,但本 producer 当前不消费它们;若未来为 debug/
// review 接线 run artifact,validateRunSummaryReference 的 spec-work 硬编码需同步放宽。
const WORKFLOW = 'spec-work';
const DEFAULT_RETENTION_DAYS = 30;
const ALLOWED_RAW_LOG_KINDS = new Set(['none', 'repo_relative_artifact']);
const ALLOWED_PLAN_SOURCES = new Set(['explicit', 'inferred', 'missing']);
const ALLOWED_PRODUCER_REASON_CODES = new Set([
  'trigger-task-pack',
  'trigger-not-run-validation',
  'trigger-deferred-follow-up',
  'trigger-substantive-work',
  'no-trigger-matched',
  'producer-error',
  'producer-write-side-only',
]);
const INTEGRATED_PRODUCER_REASON_CODES = new Set([
  'trigger-task-pack',
  'trigger-not-run-validation',
  'trigger-deferred-follow-up',
  'trigger-substantive-work',
]);
const ALLOWED_PAYLOAD_PRODUCER_FIELDS = new Set([
  'workflow_integrated',
  'reason_code',
]);
const ALLOWED_LLM_ASSERTED_FIELDS = new Set(['summary', 'read_artifacts', 'key_decisions', 'deferred_follow_up', 'next_action']);
const ALLOWED_DIRECT_EVIDENCE_FIELDS = new Set([
  'source_refs',
  'checks_or_logs',
  'repo_scope',
  'limitations',
  'redaction_status',
]);
const ALLOWED_DIRECT_EVIDENCE_REDACTION_STATUSES = new Set(['redacted', 'none-required']);
const LLM_SUMMARY_MAX_LENGTH = 1000;
const LLM_NEXT_ACTION_MAX_LENGTH = 500;
const LLM_ARRAY_ITEM_MAX_LENGTH = 500;
const DIRECT_EVIDENCE_SHORT_MAX_LENGTH = 160;
const DIRECT_EVIDENCE_ITEM_MAX_LENGTH = 300;
const DIRECT_EVIDENCE_MAX_ITEMS = 20;
const SAFE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,80}$/;
const ARTIFACT_SCHEMA_PATH = path.join(__dirname, '..', '..', '..', 'docs', 'contracts', 'workflows', 'spec-work-run-artifact.schema.json');
const STATE_SCHEMA_PATH = path.join(__dirname, '..', '..', '..', 'docs', 'contracts', 'workflows', 'spec-work-run-state.schema.json');
const ALLOWED_PAYLOAD_FIELDS = new Set([
  'schema_version',
  'workflow',
  'mode',
  'producer',
  'plan_path',
  'plan_source',
  'task_pack_path',
  'source_refs',
  'script_confirmed',
  'llm_asserted',
  'provider_untrusted',
  'direct_evidence_used',
  'retention',
]);
const ALLOWED_SCRIPT_CONFIRMED_FIELDS = new Set([
  'validation',
  'changed_files',
  'artifact_refs',
  'raw_log_ref',
  'resume_evidence',
]);
const ALLOWED_VALIDATION_FIELDS = new Set([
  'status',
  'reason_code',
  'run_summary_ref',
]);
const ALLOWED_RAW_LOG_REF_FIELDS = new Set([
  'kind',
  'display_ref',
  'secret_stripped',
  'redaction_status',
  'retention_status',
  'access_boundary',
  'reason_code',
]);
const ALLOWED_RESUME_EVIDENCE_FIELDS = new Set([
  'status',
  'reason_code',
]);
const ALLOWED_PROVIDER_UNTRUSTED_FIELDS = new Set([
  'readiness_status',
  'summaries',
]);
const ALLOWED_RETENTION_FIELDS = new Set([
  'retention_status',
  'artifact_category',
  'raw_log_retention_impact',
  'redaction_status',
  'owner',
  'expires_at',
]);

let cachedArtifactSchema = null;
let cachedStateSchema = null;

function getArtifactSchema() {
  if (!cachedArtifactSchema) {
    cachedArtifactSchema = JSON.parse(fs.readFileSync(ARTIFACT_SCHEMA_PATH, 'utf8'));
  }
  return cachedArtifactSchema;
}

function getStateSchema() {
  if (!cachedStateSchema) {
    cachedStateSchema = JSON.parse(fs.readFileSync(STATE_SCHEMA_PATH, 'utf8'));
  }
  return cachedStateSchema;
}

function runCli(argv) {
  const args = Array.isArray(argv) ? [...argv] : [];
  const subcommand = args[0];

  if (subcommand !== 'write') {
    if (subcommand === 'state-write') {
      const result = runStateWriteCli(args.slice(1));
      writeJson(result.output);
      return result.exitCode;
    }
    if (subcommand === 'state-read') {
      const result = runStateReadCli(args.slice(1));
      writeJson(result.output);
      return result.exitCode;
    }
    if (subcommand === 'read') {
      const result = runReadCli(args.slice(1));
      writeJson(result.output);
      return result.exitCode;
    }
    if (subcommand === 'prune') {
      const result = runPruneCli(args.slice(1));
      writeJson(result.output);
      return result.exitCode;
    }
    writeJson({
      status: 'rejected',
      reason_code: 'invalid-command',
      errors: ['Usage: spec-work-run-artifact <write|read|state-write|state-read|prune> ...'],
    });
    return 2;
  }

  const parsed = parseArgs(args.slice(1));
  if (parsed.errors.length > 0) {
    writeJson({ status: 'rejected', reason_code: 'invalid-arguments', errors: parsed.errors });
    return 2;
  }

  const result = writeSpecWorkRunArtifact({
    inputPath: parsed.input,
    runId: parsed.runId,
    targetRepo: parsed.targetRepo,
  });
  writeJson(result.output);
  return result.exitCode;
}

function parseArgs(args) {
  const parsed = {
    input: '',
    runId: '',
    targetRepo: '',
    errors: [],
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--input') {
      parsed.input = args[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg === '--run-id') {
      parsed.runId = args[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg === '--target-repo') {
      parsed.targetRepo = args[index + 1] || '';
      index += 1;
      continue;
    }
    parsed.errors.push(`unknown argument: ${arg}`);
  }

  if (!parsed.input) parsed.errors.push('--input is required');
  if (!parsed.runId) parsed.errors.push('--run-id is required');
  if (!parsed.targetRepo) parsed.errors.push('--target-repo is required');
  return parsed;
}

function runStateWriteCli(argv) {
  const parsed = parseStateWriteArgs(argv);
  if (parsed.errors.length > 0) {
    return rejected('invalid-arguments', parsed.errors);
  }
  return writeSpecWorkRunState(parsed);
}

function runStateReadCli(argv) {
  const parsed = parseStateReadArgs(argv);
  if (parsed.errors.length > 0) {
    return rejected('invalid-arguments', parsed.errors);
  }
  return readSpecWorkRunState(parsed);
}

function parseStateWriteArgs(args) {
  const parsed = {
    inputPath: '',
    runId: '',
    targetRepo: '',
    expectedGeneration: null,
    expectedSha256: '',
    errors: [],
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const value = args[index + 1] || '';
    if (arg === '--input') parsed.inputPath = value;
    else if (arg === '--run-id') parsed.runId = value;
    else if (arg === '--target-repo') parsed.targetRepo = value;
    else if (arg === '--expected-generation') {
      if (!/^\d+$/.test(value)) parsed.errors.push('--expected-generation must be a non-negative integer');
      else parsed.expectedGeneration = Number(value);
    } else if (arg === '--expected-sha256') parsed.expectedSha256 = value;
    else {
      parsed.errors.push(`unknown argument: ${arg}`);
      continue;
    }
    index += 1;
  }
  if (!parsed.inputPath) parsed.errors.push('--input is required');
  if (!parsed.runId) parsed.errors.push('--run-id is required');
  if (!parsed.targetRepo) parsed.errors.push('--target-repo is required');
  if (parsed.expectedGeneration === null) parsed.errors.push('--expected-generation is required');
  if (!/^[a-f0-9]{64}$/.test(parsed.expectedSha256)) {
    parsed.errors.push('--expected-sha256 must be a lowercase SHA-256 digest');
  }
  return parsed;
}

function parseStateReadArgs(args) {
  const parsed = { targetRepo: '', workspaceSlug: '', runId: '', errors: [] };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const value = args[index + 1] || '';
    if (arg === '--target-repo') parsed.targetRepo = value;
    else if (arg === '--workspace-slug') parsed.workspaceSlug = value;
    else if (arg === '--run-id') parsed.runId = value;
    else {
      parsed.errors.push(`unknown argument: ${arg}`);
      continue;
    }
    index += 1;
  }
  if (!parsed.targetRepo) parsed.errors.push('--target-repo is required');
  if (!parsed.workspaceSlug) parsed.errors.push('--workspace-slug is required');
  if (!parsed.runId) parsed.errors.push('--run-id is required');
  if (parsed.workspaceSlug && !isSafeId(parsed.workspaceSlug)) parsed.errors.push('invalid workspace slug');
  if (parsed.runId && !isSafeId(parsed.runId)) parsed.errors.push('invalid run id');
  return parsed;
}

function writeSpecWorkRunArtifact({ inputPath, runId, targetRepo }) {
  const target = resolveTargetRepoRoot(targetRepo);
  if (!target.ok) {
    return notWritten('target-repo-not-found', target.errors);
  }
  const targetRepoRoot = target.root;
  const warnings = [];

  if (!isSafeId(runId)) {
    return rejected('invalid-run-id', ['run-id must be a stable safe identifier']);
  }

  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(path.resolve(inputPath), 'utf8'));
  } catch (error) {
    return rejected('input-json-invalid', [error.message]);
  }

  const validation = validatePayload(payload);
  if (validation.errors.length > 0) {
    return rejected(validation.reasonCode, validation.errors);
  }

  const workspaceSlug = slugify(path.basename(targetRepoRoot));
  const artifactPath = path.posix.join('.spec-first', 'workflows', WORKFLOW, workspaceSlug, runId, 'run.json');
  const absoluteArtifactPath = path.join(targetRepoRoot, artifactPath);
  const containment = validateOutputContainment(targetRepoRoot, absoluteArtifactPath);
  if (containment.errors.length > 0) {
    return rejected('artifact-path-escape', containment.errors);
  }
  const runSummaryValidation = validateRunSummaryReference({
    payload,
    targetRepo,
    workspaceSlug,
    runId,
  });
  if (runSummaryValidation.errors.length > 0) {
    return rejected(runSummaryValidation.reasonCode, runSummaryValidation.errors);
  }
  const artifact = buildArtifact(payload, {
    runId,
    workspaceSlug,
    artifactPath,
    warnings,
  });

  try {
    fs.mkdirSync(path.dirname(absoluteArtifactPath), { recursive: true });
    const postMkdirContainment = validateOutputContainment(targetRepoRoot, absoluteArtifactPath);
    if (postMkdirContainment.errors.length > 0) {
      return rejected('artifact-path-escape', postMkdirContainment.errors);
    }
    writeFileAtomicIfAbsent(absoluteArtifactPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  } catch (error) {
    if (error && error.code === 'EEXIST') {
      return notWritten('artifact-already-exists', [`run artifact already exists: ${artifactPath}`], {
        artifactPath,
        schemaVersion: ARTIFACT_SCHEMA_VERSION,
        warnings,
      });
    }
    return notWritten('artifact-write-failed', [error.message], {
      artifactPath,
      schemaVersion: ARTIFACT_SCHEMA_VERSION,
      warnings,
    });
  }

  return {
    exitCode: 0,
    output: {
      status: 'written',
      reason_code: 'written',
      artifact_path: artifactPath,
      schema_version: ARTIFACT_SCHEMA_VERSION,
      producer_available: true,
      workflow_integrated: artifact.producer.workflow_integrated,
      warnings,
    },
  };
}

function runReadCli(argv) {
  const parsed = parseReadArgs(argv);
  if (parsed.errors.length > 0) {
    return {
      exitCode: 2,
      output: rejected('invalid-arguments', parsed.errors).output,
    };
  }

  const result = readSpecWorkRunArtifact(parsed);
  return {
    exitCode: result.exitCode,
    output: result.output,
  };
}

function runPruneCli(argv) {
  const parsed = parsePruneArgs(argv);
  if (parsed.errors.length > 0) {
    return {
      exitCode: 2,
      output: rejected('invalid-arguments', parsed.errors).output,
    };
  }

  const result = pruneSpecWorkRunArtifacts(parsed);
  return {
    exitCode: result.exitCode,
    output: result.output,
  };
}

function parseReadArgs(args) {
  const parsed = {
    targetRepo: '',
    workspaceSlug: '',
    runId: '',
    json: false,
    errors: [],
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--json') {
      parsed.json = true;
      continue;
    }
    if (arg === '--target-repo') {
      parsed.targetRepo = args[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg === '--workspace-slug') {
      parsed.workspaceSlug = args[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg === '--run-id') {
      parsed.runId = args[index + 1] || '';
      index += 1;
      continue;
    }
    parsed.errors.push(`unknown argument: ${arg}`);
  }

  if (!parsed.targetRepo) parsed.errors.push('--target-repo is required');
  if ((parsed.workspaceSlug && !parsed.runId) || (!parsed.workspaceSlug && parsed.runId)) {
    parsed.errors.push('--workspace-slug and --run-id must be provided together');
  }
  if (parsed.workspaceSlug && !isSafeId(parsed.workspaceSlug)) {
    parsed.errors.push('--workspace-slug must be a stable safe identifier');
  }
  if (parsed.runId && !isSafeId(parsed.runId)) {
    parsed.errors.push('--run-id must be a stable safe identifier');
  }
  return parsed;
}

function parsePruneArgs(args) {
  const parsed = {
    targetRepo: '',
    retentionDays: DEFAULT_RETENTION_DAYS,
    dryRun: false,
    json: false,
    errors: [],
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--json') {
      parsed.json = true;
      continue;
    }
    if (arg === '--dry-run') {
      parsed.dryRun = true;
      continue;
    }
    if (arg === '--target-repo') {
      parsed.targetRepo = args[index + 1] || '';
      index += 1;
      continue;
    }
    if (arg === '--retention-days') {
      const rawValue = args[index + 1] || '';
      if (!/^\d+$/.test(rawValue)) {
        parsed.errors.push(`--retention-days must be a non-negative integer, got '${rawValue}'`);
      } else {
        parsed.retentionDays = Number(rawValue);
      }
      index += 1;
      continue;
    }
    parsed.errors.push(`unknown argument: ${arg}`);
  }

  if (!parsed.targetRepo) parsed.errors.push('--target-repo is required');
  if (!Number.isInteger(parsed.retentionDays) || parsed.retentionDays < 0) {
    parsed.errors.push('--retention-days must be a non-negative integer');
  }
  return parsed;
}

function readSpecWorkRunArtifact({ targetRepo, workspaceSlug = '', runId = '' }) {
  const selectorErrors = validateReadSelector(workspaceSlug, runId);
  if (selectorErrors.length > 0) {
    return rejected('invalid-arguments', selectorErrors);
  }

  const target = resolveTargetRepoRoot(targetRepo);
  if (!target.ok) {
    return notWritten('target-repo-not-found', target.errors);
  }
  const targetRepoRoot = target.root;

  const containment = validateOutputContainment(
    targetRepoRoot,
    path.join(targetRepoRoot, '.spec-first', 'workflows', WORKFLOW, 'containment-probe', 'run.json'),
  );
  if (containment.errors.length > 0) {
    return rejected('artifact-path-escape', containment.errors);
  }

  const artifactInfo = resolveRunArtifactPath(targetRepoRoot, { workspaceSlug, runId });
  if (!artifactInfo.ok) {
    if (artifactInfo.reason_code === 'artifact-path-escape' || artifactInfo.reason_code === 'artifact-root-not-directory') {
      return rejected(artifactInfo.reason_code, artifactInfo.errors || [`artifact path cannot be inspected: ${artifactInfo.relativePath || '<unknown>'}`]);
    }
    return {
      exitCode: 1,
      output: {
        status: 'not-found',
        reason_code: artifactInfo.reason_code,
        artifact_path: artifactInfo.relativePath || null,
        schema_version: ARTIFACT_SCHEMA_VERSION,
        producer_available: true,
        workflow_integrated: false,
        warnings: [],
        artifact: null,
      },
    };
  }

  let artifact;
  try {
    artifact = JSON.parse(fs.readFileSync(artifactInfo.path, 'utf8'));
  } catch (error) {
    return {
      exitCode: 1,
      output: {
        status: 'not-readable',
        reason_code: 'artifact-unreadable',
        artifact_path: artifactInfo.relativePath,
        schema_version: ARTIFACT_SCHEMA_VERSION,
        producer_available: true,
        workflow_integrated: false,
        warnings: [],
        errors: [error.message],
        artifact: null,
      },
    };
  }
  const artifactValidation = validateArtifact(artifact);
  if (artifactValidation.errors.length > 0) {
    return {
      exitCode: 1,
      output: {
        status: 'not-readable',
        reason_code: 'artifact-schema-invalid',
        artifact_path: artifactInfo.relativePath,
        schema_version: ARTIFACT_SCHEMA_VERSION,
        producer_available: true,
        workflow_integrated: false,
        warnings: [],
        errors: artifactValidation.errors,
        artifact: null,
      },
    };
  }

  return {
    exitCode: 0,
    output: {
      status: 'read',
      reason_code: 'read',
      artifact_path: artifactInfo.relativePath,
      schema_version: ARTIFACT_SCHEMA_VERSION,
      producer_available: true,
      workflow_integrated: artifact.producer.workflow_integrated,
      warnings: [],
      artifact,
    },
  };
}

function writeSpecWorkRunState({
  inputPath,
  runId,
  targetRepo,
  expectedGeneration,
  expectedSha256,
}) {
  if (!isSafeId(runId)) return rejected('invalid-run-id', ['run-id must be a stable safe identifier']);
  const target = resolveTargetRepoRoot(targetRepo);
  if (!target.ok) return notWritten('target-repo-not-found', target.errors);
  const targetRepoRoot = target.root;
  const workspaceSlug = slugify(path.basename(targetRepoRoot));
  const current = readSpecWorkRunState({ targetRepo, workspaceSlug, runId });
  if (current.exitCode !== 0) return current;
  if (current.output.generation !== expectedGeneration
    || current.output.snapshot_sha256 !== expectedSha256) {
    return {
      exitCode: 1,
      output: {
        status: 'not-written',
        reason_code: 'run-state-conflict',
        expected_generation: expectedGeneration,
        actual_generation: current.output.generation,
        expected_sha256: expectedSha256,
        actual_sha256: current.output.snapshot_sha256,
        errors: ['run state changed after the caller read it'],
      },
    };
  }

  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(path.resolve(inputPath), 'utf8'));
  } catch (error) {
    return rejected('input-json-invalid', [error.message]);
  }
  const validation = validateRunStatePayload(payload, runId);
  if (validation.length > 0) return rejected('run-state-schema-invalid', validation);

  const previous = current.output.state;
  if (previous && !sameWorktreeIdentity(previous.worktree_identity, payload.worktree_identity)) {
    return {
      exitCode: 1,
      output: {
        status: 'not-written',
        reason_code: 'run-source-drifted',
        generation: current.output.generation,
        snapshot_sha256: current.output.snapshot_sha256,
        errors: ['current worktree identity differs from the last confirmed snapshot'],
      },
    };
  }

  const generation = expectedGeneration + 1;
  const relativePath = path.posix.join(
    '.spec-first', 'workflows', WORKFLOW, workspaceSlug, runId, 'state',
    `${String(generation).padStart(6, '0')}.json`,
  );
  const absolutePath = path.join(targetRepoRoot, relativePath);
  const containment = validateOutputContainment(targetRepoRoot, absolutePath);
  if (containment.errors.length > 0) return rejected('artifact-path-escape', containment.errors);
  const snapshot = {
    schema_version: STATE_SCHEMA_VERSION,
    generation,
    previous_generation: expectedGeneration,
    previous_sha256: expectedSha256,
    captured_at: new Date().toISOString(),
    run_id: runId,
    worktree_identity: payload.worktree_identity,
    units: payload.units,
    authorization: payload.authorization === undefined ? {} : payload.authorization,
    collision: payload.collision === undefined
      ? { status: 'none', reason_code: 'none' }
      : payload.collision,
    recovery: payload.recovery === undefined
      ? { status: 'not-needed', reason_code: 'not-needed' }
      : payload.recovery,
    limitations: payload.limitations === undefined ? [] : payload.limitations,
  };
  const snapshotValidation = validateRunStateSnapshot(snapshot, runId);
  if (snapshotValidation.length > 0) return rejected('run-state-schema-invalid', snapshotValidation);
  const serialized = `${JSON.stringify(snapshot, null, 2)}\n`;
  try {
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    const postMkdirContainment = validateOutputContainment(targetRepoRoot, absolutePath);
    if (postMkdirContainment.errors.length > 0) return rejected('artifact-path-escape', postMkdirContainment.errors);
    writeFileAtomicIfAbsent(absolutePath, serialized, 'utf8');
  } catch (error) {
    const collision = error && error.code === 'EEXIST';
    return {
      exitCode: 1,
      output: {
        status: 'not-written',
        reason_code: collision ? 'run-state-conflict' : 'run-state-write-failed',
        generation,
        artifact_path: relativePath,
        errors: [error.message],
      },
    };
  }
  return {
    exitCode: 0,
    output: {
      status: 'written',
      reason_code: 'written',
      schema_version: STATE_SCHEMA_VERSION,
      generation,
      previous_generation: expectedGeneration,
      previous_sha256: expectedSha256,
      snapshot_sha256: sha256(serialized),
      artifact_path: relativePath,
      warnings: current.output.warnings,
    },
  };
}

function readSpecWorkRunState({ targetRepo, workspaceSlug, runId }) {
  if (!isSafeId(workspaceSlug) || !isSafeId(runId)) {
    return rejected('invalid-arguments', ['workspace slug and run id must be stable safe identifiers']);
  }
  const target = resolveTargetRepoRoot(targetRepo);
  if (!target.ok) return notWritten('target-repo-not-found', target.errors);
  const targetRepoRoot = target.root;
  const runRelativePath = path.posix.join(
    '.spec-first', 'workflows', WORKFLOW, workspaceSlug, runId, 'run.json',
  );
  const runPath = path.join(targetRepoRoot, runRelativePath);
  const containment = validateOutputContainment(targetRepoRoot, runPath);
  if (containment.errors.length > 0) return rejected('artifact-path-escape', containment.errors);
  let runRaw;
  let runArtifact;
  try {
    runRaw = fs.readFileSync(runPath, 'utf8');
    runArtifact = JSON.parse(runRaw);
  } catch (error) {
    return {
      exitCode: 1,
      output: {
        status: 'not-readable',
        reason_code: 'artifact-unreadable',
        artifact_path: runRelativePath,
        errors: [error.message],
      },
    };
  }
  const runValidation = validateArtifact(runArtifact);
  if (runValidation.errors.length > 0) {
    return rejected('artifact-schema-invalid', runValidation.errors);
  }
  let generation = 0;
  let snapshotSha256 = sha256(runRaw);
  let state = null;
  const warnings = [];
  const stateDir = path.join(path.dirname(runPath), 'state');
  if (fs.existsSync(stateDir)) {
    const stateContainment = validateOutputContainment(targetRepoRoot, path.join(stateDir, '000001.json'));
    if (stateContainment.errors.length > 0) return rejected('artifact-path-escape', stateContainment.errors);
    let entries;
    try {
      const stat = fs.lstatSync(stateDir);
      if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('state path is not a real directory');
      entries = fs.readdirSync(stateDir)
        .filter((entry) => /^\d{6}\.json$/.test(entry))
        .sort();
    } catch (error) {
      return rejected('run-state-unreadable', [error.message]);
    }
    for (const entry of entries) {
      const expectedEntry = `${String(generation + 1).padStart(6, '0')}.json`;
      if (entry !== expectedEntry) {
        warnings.push(`ignored non-contiguous state snapshot: ${entry}`);
        break;
      }
      const snapshotPath = path.join(stateDir, entry);
      try {
        const stat = fs.lstatSync(snapshotPath);
        if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('snapshot is not a regular file');
        const raw = fs.readFileSync(snapshotPath, 'utf8');
        const candidate = JSON.parse(raw);
        const errors = validateRunStateSnapshot(candidate, runId);
        if (errors.length > 0
          || candidate.previous_generation !== generation
          || candidate.previous_sha256 !== snapshotSha256) {
          warnings.push(`ignored invalid state snapshot: ${entry}`);
          break;
        }
        generation = candidate.generation;
        snapshotSha256 = sha256(raw);
        state = candidate;
      } catch (_error) {
        warnings.push(`ignored unreadable state snapshot: ${entry}`);
        break;
      }
    }
  }
  return {
    exitCode: 0,
    output: {
      status: 'read',
      reason_code: generation === 0 ? 'legacy-generation-zero' : 'read',
      schema_version: state ? STATE_SCHEMA_VERSION : runArtifact.schema_version,
      generation,
      snapshot_sha256: snapshotSha256,
      run_artifact: runArtifact,
      state,
      warnings,
    },
  };
}

function validateRunStatePayload(payload, runId) {
  const errors = [];
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return ['payload must be an object'];
  const allowed = new Set(['run_id', 'worktree_identity', 'units', 'authorization', 'collision', 'recovery', 'limitations']);
  for (const key of Object.keys(payload)) if (!allowed.has(key)) errors.push(`unknown state payload field: ${key}`);
  if (payload.run_id !== runId) errors.push('payload run_id does not match the selected run');
  validateWorktreeIdentity(payload.worktree_identity, errors);
  validateUnits(payload.units, errors);
  if (!Array.isArray(payload.limitations || [])) errors.push('limitations must be an array');
  return errors;
}

function validateRunStateSnapshot(snapshot, runId) {
  const errors = [];
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return ['snapshot must be an object'];
  const allowed = new Set([
    'schema_version', 'generation', 'previous_generation', 'previous_sha256',
    'captured_at', 'run_id', 'worktree_identity', 'units', 'authorization',
    'collision', 'recovery', 'limitations',
  ]);
  for (const key of Object.keys(snapshot)) if (!allowed.has(key)) errors.push(`unknown snapshot field: ${key}`);
  if (snapshot.schema_version !== STATE_SCHEMA_VERSION) errors.push('unsupported run state schema version');
  if (!Number.isInteger(snapshot.generation) || snapshot.generation < 1) errors.push('generation must be a positive integer');
  if (!Number.isInteger(snapshot.previous_generation) || snapshot.previous_generation !== snapshot.generation - 1) {
    errors.push('previous_generation must immediately precede generation');
  }
  if (!/^[a-f0-9]{64}$/.test(snapshot.previous_sha256 || '')) errors.push('previous_sha256 must be a SHA-256 digest');
  if (!Number.isFinite(Date.parse(snapshot.captured_at))) errors.push('captured_at must be an ISO timestamp');
  if (snapshot.run_id !== runId) errors.push('snapshot run_id does not match the selected run');
  validateWorktreeIdentity(snapshot.worktree_identity, errors);
  validateUnits(snapshot.units, errors);
  if (!Array.isArray(snapshot.limitations)) errors.push('limitations must be an array');
  const schemaResult = validateAgainstSchema(getStateSchema(), snapshot);
  if (!schemaResult.valid) errors.push(...schemaResult.errors);
  return errors;
}

function validateWorktreeIdentity(identity, errors) {
  if (!identity || typeof identity !== 'object' || Array.isArray(identity)) {
    errors.push('worktree_identity must be an object');
    return;
  }
  const allowed = new Set(['repo_root', 'git_head', 'dirty_fingerprint']);
  for (const key of Object.keys(identity)) if (!allowed.has(key)) errors.push(`unknown worktree identity field: ${key}`);
  if (typeof identity.repo_root !== 'string' || !path.isAbsolute(identity.repo_root)) {
    errors.push('worktree_identity.repo_root must be absolute');
  }
  if (identity.git_head !== null && !/^[a-f0-9]{40}$/.test(identity.git_head || '')) {
    errors.push('worktree_identity.git_head must be null or a full commit SHA');
  }
  if (!/^[a-f0-9]{64}$/.test(identity.dirty_fingerprint || '')) {
    errors.push('worktree_identity.dirty_fingerprint must be a SHA-256 digest');
  }
}

function validateUnits(units, errors) {
  if (!Array.isArray(units)) {
    errors.push('units must be an array');
    return;
  }
  const ids = new Set();
  const statuses = new Set(['pending', 'running', 'passed', 'failed', 'blocked', 'unknown']);
  for (const unit of units) {
    if (!unit || typeof unit !== 'object' || Array.isArray(unit)) {
      errors.push('each unit must be an object');
      continue;
    }
    const allowed = new Set([
      'unit_id', 'status', 'requested_engine', 'actual_engine', 'authorization',
      'collision', 'recovery', 'verification',
    ]);
    for (const key of Object.keys(unit)) if (!allowed.has(key)) errors.push(`unknown unit field: ${key}`);
    if (!isSafeId(unit.unit_id) || ids.has(unit.unit_id)) errors.push('unit_id must be unique and safe');
    ids.add(unit.unit_id);
    if (!statuses.has(unit.status)) errors.push(`unsupported unit status: ${unit.status}`);
    const verification = unit.verification;
    if (!verification || typeof verification !== 'object' || Array.isArray(verification)) {
      errors.push(`unit ${unit.unit_id || '<unknown>'} requires verification transaction`);
      continue;
    }
    const verificationStatuses = new Set(['not-started', 'started', 'passed', 'failed', 'unknown']);
    if (!verificationStatuses.has(verification.status)) errors.push('unsupported verification status');
    if (verification.status === 'passed') {
      if (verification.confirmed !== true
        || !Array.isArray(verification.evidence_refs)
        || verification.evidence_refs.length === 0) {
        errors.push('passed verification requires confirmed evidence refs');
      }
    } else if (verification.confirmed === true) {
      errors.push('only passed verification may set confirmed=true');
    }
  }
}

function sameWorktreeIdentity(left, right) {
  return Boolean(left && right
    && left.repo_root === right.repo_root
    && left.git_head === right.git_head
    && left.dirty_fingerprint === right.dirty_fingerprint);
}

function sha256(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

function pruneSpecWorkRunArtifacts({ targetRepo, retentionDays, dryRun }) {
  const target = resolveTargetRepoRoot(targetRepo);
  if (!target.ok) {
    return notWritten('target-repo-not-found', target.errors, {
      artifactPath: null,
      schemaVersion: ARTIFACT_SCHEMA_VERSION,
      warnings: [],
    });
  }
  const targetRepoRoot = target.root;

  const containment = validateOutputContainment(
    targetRepoRoot,
    path.join(targetRepoRoot, '.spec-first', 'workflows', WORKFLOW, 'containment-probe', 'run.json'),
  );
  if (containment.errors.length > 0) {
    return rejected('artifact-path-escape', containment.errors);
  }

  const workflowRootState = resolveWorkflowRoot(targetRepoRoot);
  if (!workflowRootState.ok) {
    return rejected(workflowRootState.reason_code, workflowRootState.errors);
  }
  if (!workflowRootState.exists) {
    return {
      exitCode: 0,
      output: {
        status: 'pruned',
        reason_code: 'nothing-to-prune',
        artifact_path: null,
        schema_version: ARTIFACT_SCHEMA_VERSION,
        producer_available: true,
        workflow_integrated: false,
        warnings: [],
        removed: [],
        retained: [],
        retention_days: retentionDays,
        dry_run: dryRun,
      },
    };
  }

  const now = Date.now();
  const removed = [];
  const retained = [];

  const workspaceEntries = safeReaddir(workflowRootState.path);
  if (!workspaceEntries.ok) {
    return rejected('artifact-root-unreadable', [`workflow artifact root cannot be listed: ${workspaceEntries.error}`]);
  }
  for (const workspaceSlug of workspaceEntries.entries) {
    const workspaceDir = path.join(workflowRootState.path, workspaceSlug);
    if (!isSafeRunDirectory(targetRepoRoot, workspaceDir)) {
      retained.push({
        artifact_path: toPosixRef(path.relative(targetRepoRoot, workspaceDir)),
        reason_code: 'artifact-path-escape',
      });
      continue;
    }
    const runEntries = safeReaddir(workspaceDir);
    if (!runEntries.ok) {
      retained.push({
        artifact_path: toPosixRef(path.relative(targetRepoRoot, workspaceDir)),
        reason_code: 'artifact-unreadable',
      });
      continue;
    }
    for (const runId of runEntries.entries) {
      const runDir = path.join(workspaceDir, runId);
      if (!isSafeRunDirectory(targetRepoRoot, runDir)) {
        retained.push({
          artifact_path: toPosixRef(path.relative(targetRepoRoot, runDir)),
          reason_code: 'artifact-path-escape',
        });
        continue;
      }
      const artifactPath = path.join(runDir, 'run.json');
      if (!fs.existsSync(artifactPath)) continue;
      const safeArtifact = resolveSafeArtifactFile(
        targetRepoRoot,
        artifactPath,
        toPosixRef(path.relative(targetRepoRoot, artifactPath)),
      );
      if (!safeArtifact.ok) {
        retained.push({
          artifact_path: safeArtifact.relativePath,
          reason_code: safeArtifact.reason_code,
        });
        continue;
      }

      let artifact;
      try {
        artifact = JSON.parse(fs.readFileSync(safeArtifact.path, 'utf8'));
      } catch (error) {
        retained.push({
          artifact_path: toPosixRef(path.relative(targetRepoRoot, artifactPath)),
          reason_code: 'artifact-unreadable',
        });
        continue;
      }
      const artifactValidation = validateArtifact(artifact);
      if (artifactValidation.errors.length > 0) {
        retained.push({
          artifact_path: toPosixRef(path.relative(targetRepoRoot, artifactPath)),
          reason_code: 'artifact-schema-invalid',
        });
        continue;
      }

      const retention = artifact && artifact.retention ? artifact.retention : {};
      const expiry = Date.parse(retention.expires_at || '');
      const createdAt = Date.parse(artifact.generated_at || '');
      const effectiveExpiry = Number.isNaN(expiry)
        ? (Number.isNaN(createdAt) ? safeArtifact.mtimeMs + retentionDays * 24 * 60 * 60 * 1000 : createdAt + retentionDays * 24 * 60 * 60 * 1000)
        : expiry;

      if (effectiveExpiry > now) {
        retained.push({
          artifact_path: toPosixRef(path.relative(targetRepoRoot, artifactPath)),
          reason_code: 'retention-active',
        });
        continue;
      }

      if (!dryRun) {
        try {
          fs.rmSync(runDir, { recursive: true, force: true });
        } catch (error) {
          retained.push({
            artifact_path: toPosixRef(path.relative(targetRepoRoot, artifactPath)),
            reason_code: 'artifact-remove-failed',
          });
          continue;
        }
      }
      removed.push({
        artifact_path: toPosixRef(path.relative(targetRepoRoot, artifactPath)),
        reason_code: 'expired',
      });
    }
  }

  return {
    exitCode: 0,
    output: {
      status: 'pruned',
      reason_code: removed.length > 0 ? 'pruned-expired-artifacts' : 'nothing-to-prune',
      artifact_path: null,
      schema_version: ARTIFACT_SCHEMA_VERSION,
      producer_available: true,
      workflow_integrated: false,
      warnings: [],
      removed,
      retained,
      retention_days: retentionDays,
      dry_run: dryRun,
    },
  };
}

function resolveRunArtifactPath(targetRepoRoot, { workspaceSlug = '', runId = '' }) {
  const workflowRoot = resolveWorkflowRoot(targetRepoRoot);
  if (!workflowRoot.ok) {
    return {
      ok: false,
      reason_code: workflowRoot.reason_code,
      relativePath: toPosixRef(path.relative(targetRepoRoot, workflowRoot.path || targetRepoRoot)),
      errors: workflowRoot.errors,
    };
  }
  if (!workflowRoot.exists) {
    return { ok: false, reason_code: 'artifact-not-found', relativePath: null };
  }
  const baseRoot = workflowRoot.path;

  if (workspaceSlug && runId) {
    const relativePath = path.posix.join('.spec-first', 'workflows', WORKFLOW, workspaceSlug, runId, 'run.json');
    const absolutePath = path.join(targetRepoRoot, relativePath);
    const containment = validateOutputContainment(targetRepoRoot, absolutePath);
    if (containment.errors.length > 0) {
      return { ok: false, reason_code: 'artifact-path-escape', relativePath, errors: containment.errors };
    }
    return resolveSafeArtifactFile(targetRepoRoot, absolutePath, relativePath);
  }

  let latest = null;
  const baseEntries = safeReaddir(baseRoot);
  if (!baseEntries.ok) {
    return { ok: false, reason_code: 'artifact-root-unreadable', relativePath: null, errors: [baseEntries.error] };
  }
  for (const candidateWorkspaceSlug of baseEntries.entries) {
    const workspaceDir = path.join(baseRoot, candidateWorkspaceSlug);
    if (!isSafeRunDirectory(targetRepoRoot, workspaceDir)) continue;
    const runEntries = safeReaddir(workspaceDir);
    if (!runEntries.ok) continue;
    for (const candidateRunId of runEntries.entries) {
      const runDir = path.join(workspaceDir, candidateRunId);
      if (!isSafeRunDirectory(targetRepoRoot, runDir)) continue;
      const artifactPath = path.join(runDir, 'run.json');
      if (!fs.existsSync(artifactPath)) continue;
      const relativePath = toPosixRef(path.relative(targetRepoRoot, artifactPath));
      const safeArtifact = resolveSafeArtifactFile(targetRepoRoot, artifactPath, relativePath);
      if (!safeArtifact.ok) {
        if (safeArtifact.reason_code === 'artifact-path-escape') return safeArtifact;
        continue;
      }
      if (
        !latest
        || safeArtifact.mtimeMs > latest.mtimeMs
        || (safeArtifact.mtimeMs === latest.mtimeMs && safeArtifact.relativePath > latest.relativePath)
      ) {
        latest = {
          path: safeArtifact.path,
          relativePath: safeArtifact.relativePath,
          mtimeMs: safeArtifact.mtimeMs,
        };
      }
    }
  }

  return latest ? { ok: true, ...latest } : { ok: false, reason_code: 'artifact-not-found', relativePath: null };
}

function validateReadSelector(workspaceSlug, runId) {
  const errors = [];
  if ((workspaceSlug && !runId) || (!workspaceSlug && runId)) {
    errors.push('workspaceSlug and runId must be provided together');
  }
  if (workspaceSlug && !isSafeId(workspaceSlug)) {
    errors.push('workspaceSlug must be a stable safe identifier');
  }
  if (runId && !isSafeId(runId)) {
    errors.push('runId must be a stable safe identifier');
  }
  return errors;
}

function resolveSafeArtifactFile(targetRepoRoot, absoluteArtifactPath, relativePath) {
  const containment = validateOutputContainment(targetRepoRoot, absoluteArtifactPath);
  if (containment.errors.length > 0) {
    return { ok: false, reason_code: 'artifact-path-escape', relativePath, errors: containment.errors };
  }

  let stat;
  try {
    stat = fs.lstatSync(absoluteArtifactPath);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return { ok: false, reason_code: 'artifact-not-found', relativePath };
    }
    return {
      ok: false,
      reason_code: 'artifact-unreadable',
      relativePath,
      errors: [`artifact file cannot be inspected: ${relativePath}`],
    };
  }

  if (stat.isSymbolicLink()) {
    return {
      ok: false,
      reason_code: 'artifact-path-escape',
      relativePath,
      errors: [`artifact file must not be a symlink: ${relativePath}`],
    };
  }
  if (!stat.isFile()) {
    return {
      ok: false,
      reason_code: 'artifact-unreadable',
      relativePath,
      errors: [`artifact path is not a file: ${relativePath}`],
    };
  }

  try {
    const realRepoRoot = fs.realpathSync(path.resolve(targetRepoRoot));
    const realArtifactPath = fs.realpathSync(absoluteArtifactPath);
    const realRelative = path.relative(realRepoRoot, realArtifactPath);
    if (realRelative.startsWith('..') || path.isAbsolute(realRelative)) {
      return {
        ok: false,
        reason_code: 'artifact-path-escape',
        relativePath,
        errors: [`artifact file escapes target repo: ${relativePath}`],
      };
    }
  } catch (error) {
    return {
      ok: false,
      reason_code: 'artifact-unreadable',
      relativePath,
      errors: [`artifact file realpath failed: ${error.message}`],
    };
  }

  return {
    ok: true,
    path: absoluteArtifactPath,
    relativePath,
    mtimeMs: stat.mtimeMs,
  };
}

function resolveWorkflowRoot(targetRepoRoot) {
  const workflowRoot = path.join(targetRepoRoot, '.spec-first', 'workflows', WORKFLOW);
  const containment = validateOutputContainment(
    targetRepoRoot,
    path.join(workflowRoot, 'containment-probe', 'run.json'),
  );
  if (containment.errors.length > 0) {
    return {
      ok: false,
      exists: fs.existsSync(workflowRoot),
      path: workflowRoot,
      reason_code: 'artifact-path-escape',
      errors: containment.errors,
    };
  }
  if (!fs.existsSync(workflowRoot)) {
    return { ok: true, exists: false, path: workflowRoot };
  }
  try {
    const stat = fs.lstatSync(workflowRoot);
    if (!stat.isDirectory()) {
      return {
        ok: false,
        exists: true,
        path: workflowRoot,
        reason_code: 'artifact-root-not-directory',
        errors: [`workflow artifact root is not a directory: ${path.relative(targetRepoRoot, workflowRoot)}`],
      };
    }
  } catch (error) {
    return {
      ok: false,
      exists: true,
      path: workflowRoot,
      reason_code: 'artifact-root-not-directory',
      errors: [`workflow artifact root cannot be inspected: ${error.message}`],
    };
  }
  return { ok: true, exists: true, path: workflowRoot };
}

function validatePayload(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { errors: ['payload must be a JSON object'], reasonCode: 'payload-invalid' };
  }
  validateObjectFields(payload, 'payload', ALLOWED_PAYLOAD_FIELDS, errors);
  if (payload.schema_version !== PAYLOAD_SCHEMA_VERSION) errors.push(`schema_version must be ${PAYLOAD_SCHEMA_VERSION}`);
  if (payload.workflow !== WORKFLOW) errors.push(`workflow must be ${WORKFLOW}`);
  if (!['interactive', 'non-interactive'].includes(payload.mode)) errors.push('mode must be interactive or non-interactive');
  if (!ALLOWED_PLAN_SOURCES.has(payload.plan_source)) errors.push('plan_source must be explicit, inferred, or missing');
  validatePayloadProducer(payload.producer, errors);
  for (const field of ['script_confirmed', 'llm_asserted', 'provider_untrusted']) {
    if (!payload[field] || typeof payload[field] !== 'object' || Array.isArray(payload[field])) {
      errors.push(`${field} must be an object`);
    }
  }

  validateRepoRelativeField(payload.plan_path, 'plan_path', errors, { nullable: true });
  validateRepoRelativeField(payload.task_pack_path, 'task_pack_path', errors, { nullable: true });
  validateRepoRelativeArray(payload.source_refs, 'source_refs', errors);

  if (payload.script_confirmed && typeof payload.script_confirmed === 'object') {
    validateObjectFields(payload.script_confirmed, 'script_confirmed', ALLOWED_SCRIPT_CONFIRMED_FIELDS, errors);
    validateRepoRelativeArray(payload.script_confirmed.changed_files, 'script_confirmed.changed_files', errors);
    validateRepoRelativeArray(payload.script_confirmed.artifact_refs, 'script_confirmed.artifact_refs', errors, { allowSpecFirstWorkflows: true });
    validateValidation(payload.script_confirmed.validation, errors);
    validateRawLogRef(payload.script_confirmed.raw_log_ref, errors);
    validateResumeEvidence(payload.script_confirmed.resume_evidence, errors);
  }

  if (payload.llm_asserted && typeof payload.llm_asserted === 'object') {
    for (const field of Object.keys(payload.llm_asserted)) {
      if (!ALLOWED_LLM_ASSERTED_FIELDS.has(field)) errors.push(`llm_asserted.${field} is not allowed`);
    }
    validateBoundedString(payload.llm_asserted.summary, 'llm_asserted.summary', errors, { maxLength: LLM_SUMMARY_MAX_LENGTH, maxLines: 20 });
    validateBoundedString(payload.llm_asserted.next_action, 'llm_asserted.next_action', errors, { maxLength: LLM_NEXT_ACTION_MAX_LENGTH, maxLines: 5 });
    validateRepoRelativeArray(payload.llm_asserted.read_artifacts, 'llm_asserted.read_artifacts', errors, { allowSpecFirstWorkflows: true });
    for (const field of ['read_artifacts', 'key_decisions', 'deferred_follow_up']) {
      validateStringArray(payload.llm_asserted[field], `llm_asserted.${field}`, errors, { maxLength: LLM_ARRAY_ITEM_MAX_LENGTH, maxLines: 5 });
    }
  }

  if (payload.provider_untrusted && typeof payload.provider_untrusted === 'object') {
    validateObjectFields(payload.provider_untrusted, 'provider_untrusted', ALLOWED_PROVIDER_UNTRUSTED_FIELDS, errors);
    if (!['fresh', 'stale', 'degraded', 'not-run', 'unknown'].includes(payload.provider_untrusted.readiness_status)) {
      errors.push('provider_untrusted.readiness_status is invalid');
    }
    validateStringArray(payload.provider_untrusted.summaries, 'provider_untrusted.summaries', errors, { maxLength: 500, maxLines: 5, maxItems: 20 });
  }

  if (Object.prototype.hasOwnProperty.call(payload, 'direct_evidence_used')) {
    validateDirectEvidenceUsed(payload.direct_evidence_used, errors);
  }

  validateRetention(payload.retention, errors);
  scanUnsafeStrings(payload, errors);

  return {
    errors,
    reasonCode: errors.length > 0 ? classifyErrors(errors) : null,
  };
}

function validatePayloadProducer(producer, errors) {
  if (producer === undefined) return;
  if (!producer || typeof producer !== 'object' || Array.isArray(producer)) {
    errors.push('producer must be an object when provided');
    return;
  }
  validateObjectFields(producer, 'producer', ALLOWED_PAYLOAD_PRODUCER_FIELDS, errors);
  if (typeof producer.workflow_integrated !== 'boolean') {
    errors.push('producer.workflow_integrated must be a boolean');
  }
  if (!ALLOWED_PRODUCER_REASON_CODES.has(producer.reason_code)) {
    errors.push('producer.reason_code is invalid');
  } else if (typeof producer.workflow_integrated === 'boolean') {
    const isTriggerReason = INTEGRATED_PRODUCER_REASON_CODES.has(producer.reason_code);
    if (producer.workflow_integrated && !isTriggerReason) {
      errors.push('producer.reason_code must be a durable trigger when producer.workflow_integrated is true');
    }
    if (!producer.workflow_integrated && isTriggerReason) {
      errors.push('producer.reason_code must be non-integrated when producer.workflow_integrated is false');
    }
  }
}

function validateDirectEvidenceUsed(directEvidenceUsed, errors) {
  if (directEvidenceUsed === null) return;
  if (!directEvidenceUsed || typeof directEvidenceUsed !== 'object' || Array.isArray(directEvidenceUsed)) {
    errors.push('direct_evidence_used must be an object or null');
    return;
  }
  for (const field of Object.keys(directEvidenceUsed)) {
    if (!ALLOWED_DIRECT_EVIDENCE_FIELDS.has(field)) errors.push(`direct_evidence_used.${field} is not allowed`);
  }
  for (const field of ALLOWED_DIRECT_EVIDENCE_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(directEvidenceUsed, field)) {
      errors.push(`direct_evidence_used.${field} is required`);
    }
  }
  validateBoundedString(directEvidenceUsed.repo_scope, 'direct_evidence_used.repo_scope', errors, {
    maxLength: DIRECT_EVIDENCE_SHORT_MAX_LENGTH,
    maxLines: 1,
  });
  for (const field of ['source_refs', 'checks_or_logs', 'limitations']) {
    validateStringArray(directEvidenceUsed[field], `direct_evidence_used.${field}`, errors, {
      maxLength: DIRECT_EVIDENCE_ITEM_MAX_LENGTH,
      maxItems: DIRECT_EVIDENCE_MAX_ITEMS,
      maxLines: 4,
    });
  }
  if (!ALLOWED_DIRECT_EVIDENCE_REDACTION_STATUSES.has(directEvidenceUsed.redaction_status)) {
    errors.push('direct_evidence_used.redaction_status is invalid');
  }
}

function validateValidation(validation, errors) {
  if (!validation || typeof validation !== 'object' || Array.isArray(validation)) {
    errors.push('script_confirmed.validation must be an object');
    return;
  }
  validateObjectFields(validation, 'script_confirmed.validation', ALLOWED_VALIDATION_FIELDS, errors);
  if (!['passed', 'failed', 'not-run', 'degraded'].includes(validation.status)) {
    errors.push('script_confirmed.validation.status is invalid');
  }
  if (!validation.reason_code || typeof validation.reason_code !== 'string') {
    errors.push('script_confirmed.validation.reason_code is required');
  }
  validateRepoRelativeField(validation.run_summary_ref, 'script_confirmed.validation.run_summary_ref', errors, {
    allowSpecFirstWorkflows: true,
  });
  if (typeof validation.run_summary_ref !== 'string' || !validation.run_summary_ref.endsWith('/verification-run-summary.json')) {
    errors.push('script_confirmed.validation.run_summary_ref must point at verification-run-summary.json');
  }
}

function validateRunSummaryReference({ payload, targetRepo, workspaceSlug, runId }) {
  const validation = payload.script_confirmed && payload.script_confirmed.validation;
  const runSummaryRef = validation && validation.run_summary_ref;
  const expectedRef = path.posix.join('.spec-first', 'workflows', WORKFLOW, workspaceSlug, runId, 'verification-run-summary.json');
  if (runSummaryRef !== expectedRef) {
    return {
      reasonCode: 'validation-run-summary-ref-mismatch',
      errors: [`script_confirmed.validation.run_summary_ref must be ${expectedRef}`],
    };
  }

  const read = readVerificationRunSummary({ targetRepo, runSummaryRef });
  if (read.exitCode !== 0) {
    return {
      reasonCode: 'validation-run-summary-not-readable',
      errors: [
        `validation run summary is not readable: ${read.output.reason_code}`,
        ...(read.output.errors || []),
      ],
    };
  }

  const aggregateStatus = aggregateRunSummaryStatus(read.output.summary);
  if (aggregateStatus !== validation.status) {
    return {
      reasonCode: 'validation-run-summary-status-mismatch',
      errors: [
        `script_confirmed.validation.status ${validation.status} does not match run summary aggregate ${aggregateStatus}`,
      ],
    };
  }

  return { reasonCode: null, errors: [] };
}

function validateRawLogRef(rawLogRef, errors) {
  if (!rawLogRef || typeof rawLogRef !== 'object' || Array.isArray(rawLogRef)) {
    errors.push('script_confirmed.raw_log_ref must be an object');
    return;
  }
  validateObjectFields(rawLogRef, 'script_confirmed.raw_log_ref', ALLOWED_RAW_LOG_REF_FIELDS, errors);
  if (!ALLOWED_RAW_LOG_KINDS.has(rawLogRef.kind)) errors.push('raw_log_ref.kind is invalid for Phase 1B');
  if (rawLogRef.kind === 'repo_relative_artifact') {
    validateRepoRelativeField(rawLogRef.display_ref, 'raw_log_ref.display_ref', errors, { allowSpecFirstWorkflows: true });
  }
  if (rawLogRef.kind === 'none' && rawLogRef.display_ref) errors.push('raw_log_ref.display_ref must be empty when kind is none');
  if (rawLogRef.secret_stripped !== true) errors.push('raw_log_ref.secret_stripped must be true');
  if (!['redacted', 'none-required'].includes(rawLogRef.redaction_status)) errors.push('raw_log_ref.redaction_status is invalid');
  if (rawLogRef.retention_status !== 'lifecycle-deferred') errors.push('raw_log_ref.retention_status must be lifecycle-deferred');
  if (!['repo-local', 'none'].includes(rawLogRef.access_boundary)) errors.push('raw_log_ref.access_boundary is invalid');
  if (typeof rawLogRef.reason_code !== 'string' || rawLogRef.reason_code.trim() === '') errors.push('raw_log_ref.reason_code must be non-empty');
}

function validateResumeEvidence(resumeEvidence, errors) {
  if (!resumeEvidence || typeof resumeEvidence !== 'object' || Array.isArray(resumeEvidence)) {
    errors.push('script_confirmed.resume_evidence must be an object');
    return;
  }
  validateObjectFields(resumeEvidence, 'script_confirmed.resume_evidence', ALLOWED_RESUME_EVIDENCE_FIELDS, errors);
  if (!['read', 'not-found', 'not-readable', 'not-run'].includes(resumeEvidence.status)) {
    errors.push('resume_evidence.status is invalid');
  }
  if (resumeEvidence.status !== 'read' && (!resumeEvidence.reason_code || typeof resumeEvidence.reason_code !== 'string')) {
    errors.push('resume_evidence.reason_code is required when status is not read');
  }
}

function validateRetention(retention, errors) {
  if (!retention || typeof retention !== 'object' || Array.isArray(retention)) {
    errors.push('retention must be an object');
    return;
  }
  validateObjectFields(retention, 'retention', ALLOWED_RETENTION_FIELDS, errors);
  if (retention.retention_status !== 'lifecycle-deferred') errors.push('retention.retention_status must be lifecycle-deferred');
  if (retention.artifact_category !== 'spec-work-run-evidence') errors.push('retention.artifact_category must be spec-work-run-evidence');
  if (!['none', 'repo-relative-redacted-ref'].includes(retention.raw_log_retention_impact)) {
    errors.push('retention.raw_log_retention_impact is invalid');
  }
  if (!['redacted', 'none-required'].includes(retention.redaction_status)) errors.push('retention.redaction_status is invalid');
  if (retention.owner !== undefined && typeof retention.owner !== 'string') errors.push('retention.owner must be a string when present');
  if (retention.expires_at !== undefined && typeof retention.expires_at !== 'string') {
    errors.push('retention.expires_at must be a string when present');
  } else if (retention.expires_at !== undefined && Number.isNaN(Date.parse(retention.expires_at))) {
    errors.push('retention.expires_at must be an ISO date when present');
  }
}

function validateObjectFields(value, pointer, allowedFields, errors) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  for (const field of Object.keys(value)) {
    if (!allowedFields.has(field)) {
      errors.push(`${pointer}.${field} is not allowed`);
    }
  }
}

function validateArtifact(artifact) {
  const result = validateAgainstSchema(getArtifactSchema(), artifact);
  return result.valid ? { errors: [] } : { errors: result.errors };
}

function validateRepoRelativeArray(values, field, errors, options = {}) {
  if (values === undefined || values === null) return;
  if (!Array.isArray(values)) {
    errors.push(`${field} must be an array`);
    return;
  }
  for (const value of values) validateRepoRelativeField(value, field, errors, options);
}

function validateStringArray(values, field, errors, options = {}) {
  if (!Array.isArray(values)) {
    errors.push(`${field} must be an array`);
    return;
  }
  if (options.maxItems && values.length > options.maxItems) errors.push(`${field} must contain <= ${options.maxItems} items`);
  for (const value of values) {
    validateBoundedString(value, `${field} entries`, errors, options);
  }
}

function validateBoundedString(value, field, errors, options = {}) {
  if (typeof value !== 'string' || value.trim() === '') {
    errors.push(`${field} must be a non-empty string`);
    return;
  }
  if (options.maxLength && value.length > options.maxLength) errors.push(`${field} must be <= ${options.maxLength} chars`);
  if (options.maxLines && value.split(/\r?\n/).length > options.maxLines) errors.push(`${field} must be <= ${options.maxLines} lines`);
}

function scanUnsafeStrings(value, errors, pointer = 'payload') {
  if (typeof value === 'string') {
    if (path.isAbsolute(value) || /^[A-Za-z]:[\\/]/.test(value)) errors.push(`${pointer} contains an absolute path`);
    if (/https?:\/\/[^/\s]+:[^@\s]+@/i.test(value)) errors.push(`${pointer} contains a credential-bearing URL`);
    if (/https?:\/\/\S*[?&](?:token|access_token|api_key|key|secret|password)=/i.test(value)) errors.push(`${pointer} contains an unredacted credential query parameter`);
    if (/(?:authorization|api[_-]?key|access[_-]?token|secret|password)\s*[:=]\s*[^<\s][^\s]*/i.test(value)) errors.push(`${pointer} contains a secret-like value`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanUnsafeStrings(item, errors, `${pointer}[${index}]`));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (/^(raw_output|raw_text|raw_log|provider_raw_output)$/i.test(key) && typeof child === 'string' && child.trim() !== '') {
        errors.push(`${pointer}.${key} must not contain raw output`);
      }
      scanUnsafeStrings(child, errors, `${pointer}.${key}`);
    }
  }
}

function buildArtifact(payload, { runId, workspaceSlug, artifactPath, warnings }) {
  const retention = buildRetention(payload.retention);
  const producer = buildProducer(payload.producer);
  return {
    schema_version: ARTIFACT_SCHEMA_VERSION,
    generated_at: new Date().toISOString(),
    workflow: WORKFLOW,
    run_id: runId,
    mode: payload.mode,
    workspace_slug: workspaceSlug,
    producer: {
      producer_available: true,
      workflow_integrated: producer.workflowIntegrated,
      reason_code: producer.reasonCode,
    },
    plan_path: payload.plan_path || null,
    plan_source: payload.plan_source || 'missing',
    task_pack_path: payload.task_pack_path || null,
    source_refs: payload.source_refs || [],
    script_confirmed: payload.script_confirmed,
    llm_asserted: payload.llm_asserted,
    provider_untrusted: payload.provider_untrusted,
    ...(Object.prototype.hasOwnProperty.call(payload, 'direct_evidence_used') ? { direct_evidence_used: payload.direct_evidence_used } : {}),
    retention,
    artifact_path: artifactPath,
    warnings,
  };
}

function buildProducer(producer) {
  if (!producer || typeof producer !== 'object' || Array.isArray(producer)) {
    return {
      workflowIntegrated: false,
      reasonCode: 'producer-write-side-only',
    };
  }
  return {
    workflowIntegrated: producer.workflow_integrated,
    reasonCode: producer.reason_code,
  };
}

function buildRetention(retention) {
  const base = {
    retention_status: retention.retention_status,
    artifact_category: retention.artifact_category,
    raw_log_retention_impact: retention.raw_log_retention_impact,
    redaction_status: retention.redaction_status,
  };

  if (retention.owner) {
    base.owner = retention.owner;
  }
  if (retention.expires_at) {
    base.expires_at = retention.expires_at;
  }
  if (!base.owner) {
    base.owner = 'spec-work';
  }
  if (!base.expires_at) {
    const expiresAt = new Date(Date.now() + DEFAULT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    base.expires_at = expiresAt.toISOString();
  }
  return base;
}

function classifyErrors(errors) {
  if (errors.some((error) => /secret|credential|raw output|absolute path|URL/i.test(error))) return 'security-rejected';
  if (errors.some((error) => /path|runtime mirrors/.test(error))) return 'path-rejected';
  return 'schema-rejected';
}

function rejected(reasonCode, errors) {
  return {
    exitCode: 1,
    output: {
      status: 'rejected',
      reason_code: reasonCode,
      artifact_path: null,
      schema_version: ARTIFACT_SCHEMA_VERSION,
      producer_available: true,
      workflow_integrated: false,
      warnings: [],
      errors,
    },
  };
}

function notWritten(reasonCode, errors, extras = {}) {
  return {
    exitCode: 0,
    output: {
      status: 'not-written',
      reason_code: reasonCode,
      artifact_path: extras.artifactPath || null,
      schema_version: extras.schemaVersion || ARTIFACT_SCHEMA_VERSION,
      producer_available: true,
      workflow_integrated: false,
      warnings: extras.warnings || [],
      errors,
    },
  };
}

function slugify(value) {
  return String(value || 'workspace')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'workspace';
}

function isSafeId(value) {
  return SAFE_ID_PATTERN.test(value || '');
}

// repo-relative ref 是跨平台契约标识符,不是本地文件系统路径:schema pattern、
// validateRepoRelativeField 与下游 consumer 都只接受 POSIX 正斜杠。真实文件 IO 仍用
// path.join / path.relative 的原生分隔符,只有对外输出的 ref 经过这里归一化。
function toPosixRef(value) {
  return String(value || '').split(path.sep).join('/');
}

function isSafeRunDirectory(targetRepoRoot, absoluteDirPath) {
  try {
    const stat = fs.lstatSync(absoluteDirPath);
    if (!stat.isDirectory() || stat.isSymbolicLink()) return false;
  } catch (error) {
    return false;
  }
  const containment = validateOutputContainment(
    targetRepoRoot,
    path.join(absoluteDirPath, 'run.json'),
  );
  return containment.errors.length === 0;
}

function safeReaddir(dirPath) {
  try {
    return { ok: true, entries: fs.readdirSync(dirPath) };
  } catch (error) {
    return { ok: false, error: error && error.message ? error.message : String(error), entries: [] };
  }
}

function writeJson(payload) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

module.exports = {
  ARTIFACT_SCHEMA_VERSION,
  DEFAULT_RETENTION_DAYS,
  PAYLOAD_SCHEMA_VERSION,
  STATE_SCHEMA_VERSION,
  runCli,
  readSpecWorkRunArtifact,
  readSpecWorkRunState,
  pruneSpecWorkRunArtifacts,
  validatePayload,
  writeSpecWorkRunArtifact,
  writeSpecWorkRunState,
};
