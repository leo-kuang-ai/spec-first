#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  ISSUE_SYNTHESIS_STATUSES,
  parseCommonArgs,
  resolveRepoRoot,
  resolvePathAgainstRoot,
  publicPath,
  createRunId,
} = require('./lib/audit-utils');

const { renderHeadlessFailureEnvelope } = require('./render-headless-envelope');
const {
  appendStageReceipt,
  buildLatestSummary,
  buildRunMetadata,
  finalizeMetadata,
} = require('./build-run-metadata');
const { cleanupRunInputs } = require('./cleanup-run-inputs');

const SCRIPTS_DIR = __dirname;

const HEADLESS_FAILURE_BANNER = 'App consistency audit failed (headless mode).';
const HEADLESS_REASON_CODE_PATTERN = /^Reason code:\s*([^\s]+)/m;
const SAFE_RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

function script(name) {
  return path.join(SCRIPTS_DIR, name);
}

function runStep(label, args, cwd) {
  const result = spawnSync(process.execPath, args, { cwd, encoding: 'utf8' });
  if (result.status !== 0) {
    const error = new Error(`step_failed: ${label} (exit ${result.status})\n${result.stderr || ''}`);
    error.reasonCode = 'step_failed';
    error.step = label;
    error.stderr = result.stderr || '';
    error.stdout = result.stdout || '';
    if (typeof result.stdout === 'string' && result.stdout.startsWith(HEADLESS_FAILURE_BANNER)) {
      error.upstreamEnvelope = result.stdout;
      const match = result.stdout.match(HEADLESS_REASON_CODE_PATTERN);
      if (match) error.reasonCode = match[1];
    }
    throw error;
  }
  return result;
}

function helpText() {
  return [
    'Usage: run-audit.js [phase:prepare|phase:finalize|phase:abort] mode:headless base:<ref> [options]',
    '',
    'Required:',
    '  mode:headless                 v1 仅支持 headless mode (default/report-only 留待后续版本)',
    '  base:<git-ref>                必填,headless mode 必须显式声明 diff 起点',
    '',
    'Common options:',
    '  --source <dir>                被审仓库根 (默认当前工作目录)',
    '  --prd <path>                  PRD markdown 文件路径',
    '  --figma-context <path>        Figma context JSON (本地物化结果)',
    '  --run-id <id>                 运行 ID (默认自动生成)',
    '  --run-dir <dir>               运行目录 (默认 <source>/.spec-first/app-audit/runs/<run-id>)',
    '  --raw-issues <path>           已经审过的 raw issues JSON;默认查找 <run-dir>/input/raw-issues.json',
    '  --issue-synthesis-status <s>  not_run | llm_provided | fixture_provided (无 raw issues 默认 not_run;有 raw issues 时必须 llm_provided 或 fixture_provided)',
    '  --max-files <n>               传给 metadata/diff 扫描的最大文件数',
    '  --prd-max-bytes <n>           传给 PRD 抽取的最大字节数',
    '  --help                        打印用法并退出',
    '',
    'Output:',
    '  在 run-dir 下生成 metadata.json/preflight.json/impact-facts.json/contracts/*.json',
    '  /merged-context.json/issues.json/audit-report.json/app-audit-context.json',
    '  /artifact-manifest.json/latest-summary.json/headless-envelope.txt。',
    '',
    'Boundary:',
    '  Runner 不生成 LLM verdict、不内联 issue synthesis,也不远程拉取 Figma/PRD。',
    '  LLM 审查产物需调用方在 input/raw-issues.json 落盘后再触发本 runner。',
    '',
  ].join('\n');
}

function emitFailure(reasonCode, message, runId, output, upstreamEnvelope) {
  const envelope = upstreamEnvelope
    || renderHeadlessFailureEnvelope({
      reasonCode,
      message,
      runId,
    });
  if (output) {
    fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
    fs.writeFileSync(path.resolve(output), envelope);
  } else {
    process.stdout.write(envelope);
  }
  process.exitCode = 1;
}

function parseRunnerArgs(argv) {
  const passthrough = [];
  let phase = 'legacy';
  let rawIssues = null;
  let rawIssuesValueMissing = false;
  let help = false;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (/^phase:(prepare|finalize|abort)$/.test(arg)) {
      phase = arg.slice('phase:'.length);
    } else if (arg === '--help' || arg === '-h') {
      help = true;
    } else if (arg === '--raw-issues') {
      const next = argv[index + 1];
      if (typeof next !== 'string' || next.length === 0 || next.startsWith('--')) {
        rawIssuesValueMissing = true;
      } else {
        rawIssues = next;
        index += 1;
      }
    } else {
      passthrough.push(arg);
    }
  }
  const options = parseCommonArgs(passthrough);
  return { options, rawIssues, rawIssuesValueMissing, help, phase };
}

function stageReceipt(stage, artifactPath, inputHashes = [], options = {}) {
  return {
    stage,
    producer_kind: 'deterministic_script',
    input_hashes: inputHashes.filter(Boolean),
    artifact_path: artifactPath,
    status: options.status || 'complete',
    reason_codes: options.reasonCodes || [],
    limitations: options.limitations || [],
    cleanup_state: options.cleanupState || 'not_applicable',
    retention_state: options.retentionState || 'run_local',
  };
}

function writeReceipt(runDir, name, receipt) {
  const receiptDir = path.join(runDir, 'receipts');
  fs.mkdirSync(receiptDir, { recursive: true });
  fs.writeFileSync(path.join(receiptDir, `${name}.json`), `${JSON.stringify({
    schema_version: 'spec-app-consistency-audit-stage-receipt.v1',
    artifact_id: `${name}-receipt`,
    generated_at: new Date().toISOString(),
    source_inputs: [{ type: 'run_artifact', path: 'metadata.json', source_hash_unavailable_reason: 'recorded_in_receipt', freshness: 'current-run' }],
    consumers: ['runner', 'artifact-consumers'],
    contract_status: 'candidate',
    data_sensitivity: 'internal',
    ...receipt,
  }, null, 2)}\n`);
}

function cleanupAndRecord({ repoRoot, absoluteRunDir, metadataPath }) {
  const cleanup = cleanupRunInputs({ repoRoot, runDir: absoluteRunDir });
  writeReceipt(absoluteRunDir, 'cleanup', cleanup);
  if (metadataPath && fs.existsSync(metadataPath)) {
    appendStageReceipt({ metadataPath, receipt: stageReceipt('cleanup', 'receipts/cleanup.json', [], {
      reasonCodes: cleanup.reason_codes,
      cleanupState: cleanup.cleanup_state,
      retentionState: cleanup.retention_state,
      limitations: cleanup.limitations,
    }) });
  }
  return cleanup;
}

function isInsideOrSame(parentPath, childPath) {
  const relative = path.relative(path.resolve(parentPath), path.resolve(childPath));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function boundaryError(reasonCode, message) {
  const error = new Error(`${reasonCode}: ${message}`);
  error.reasonCode = reasonCode;
  return error;
}

function validateRunId(runId) {
  return typeof runId === 'string'
    && SAFE_RUN_ID_PATTERN.test(runId)
    && !runId.includes('..');
}

function validateBoundedExistingPath({ repoRoot, inputPath, kind, expected }) {
  const resolution = require('./lib/audit-utils').resolveBoundedInputPath({
    repoRoot,
    inputPath,
    kind,
    expected,
  });
  if (!resolution.ok) {
    const error = new Error(`${resolution.reason_code}: ${resolution.reason}`);
    error.reasonCode = resolution.reason_code;
    throw error;
  }
}

function assertInsideBoundary({ parent, candidate, reasonCode, message }) {
  if (!isInsideOrSame(parent, candidate)) {
    throw boundaryError(reasonCode, message);
  }
}

function lstatIfExists(filePath) {
  try {
    return fs.lstatSync(filePath);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return null;
    throw error;
  }
}

function realpathExisting(filePath, reasonCode, message) {
  try {
    return fs.realpathSync.native
      ? fs.realpathSync.native(filePath)
      : fs.realpathSync(filePath);
  } catch (_error) {
    throw boundaryError(reasonCode, message);
  }
}

function nearestExistingPathInfo(filePath, reasonCode, message) {
  let currentPath = path.resolve(filePath);
  while (true) {
    if (lstatIfExists(currentPath)) {
      return {
        path: currentPath,
        realPath: realpathExisting(currentPath, reasonCode, message),
      };
    }
    const parentPath = path.dirname(currentPath);
    if (parentPath === currentPath) {
      throw boundaryError(reasonCode, message);
    }
    currentPath = parentPath;
  }
}

function assertWritePathInsideBoundary({ boundaryRoot, parent, candidate, reasonCode, message }) {
  assertInsideBoundary({ parent, candidate, reasonCode, message });

  const rootInfo = nearestExistingPathInfo(boundaryRoot, reasonCode, message);
  const parentInfo = nearestExistingPathInfo(parent, reasonCode, message);
  if (!isInsideOrSame(rootInfo.realPath, parentInfo.realPath)) {
    throw boundaryError(reasonCode, message);
  }

  const parentExists = lstatIfExists(parent);
  const parentRealPath = parentExists
    ? realpathExisting(parent, reasonCode, message)
    : null;
  const candidateInfo = nearestExistingPathInfo(candidate, reasonCode, message);
  if (!isInsideOrSame(rootInfo.realPath, candidateInfo.realPath)) {
    throw boundaryError(reasonCode, message);
  }
  if (parentRealPath && !isInsideOrSame(parentRealPath, candidateInfo.realPath)) {
    throw boundaryError(reasonCode, message);
  }
}

function validateSemanticBinding(stagedRawIssues, preparedMetadata) {
  const input = JSON.parse(fs.readFileSync(stagedRawIssues, 'utf8'));
  if (input.run_id !== preparedMetadata.run_id) {
    throw boundaryError('semantic_run_id_mismatch', 'Staged semantic artifact run_id does not match prepared run.');
  }
  if (input.prepare_fingerprint !== preparedMetadata.prepare_fingerprint) {
    throw boundaryError('semantic_prepare_fingerprint_mismatch', 'Staged semantic artifact does not match the prepared facts bundle.');
  }
  if (!input.producer_receipt || typeof input.producer_receipt.producer_kind !== 'string'
    || input.producer_receipt.producer_kind.trim().length === 0) {
    throw boundaryError('semantic_producer_receipt_required', 'Staged semantic artifact requires a producer receipt.');
  }
}

function finalizePreparedRun(context) {
  const {
    options,
    rawIssues,
    repoRoot,
    absoluteRunDir,
    runId,
    runIdToken,
    artifacts,
    sharedSourceFlags,
    synthesisFlags,
  } = context;
  const stagedRawIssues = rawIssues
    ? resolvePathAgainstRoot(repoRoot, rawIssues)
    : path.join(absoluteRunDir, 'input', 'raw-issues.json');
  let autoStubbed = false;
  if (!fs.existsSync(stagedRawIssues)) {
    if (options.issueSynthesisStatus === 'llm_provided' || options.issueSynthesisStatus === 'fixture_provided') {
      throw boundaryError(
        'issue_synthesis_status_without_input',
        `--issue-synthesis-status ${options.issueSynthesisStatus} requires a staged raw-issues artifact.`,
      );
    }
    fs.mkdirSync(path.dirname(stagedRawIssues), { recursive: true });
    fs.writeFileSync(stagedRawIssues, `${JSON.stringify({ issues: [], rejected_issues: [] }, null, 2)}\n`);
    autoStubbed = true;
  }
  if (!autoStubbed && (!options.issueSynthesisStatus || options.issueSynthesisStatus === 'not_run')) {
    throw boundaryError(
      'issue_synthesis_status_required_with_input',
      'Staged raw-issues requires llm_provided or fixture_provided provenance.',
    );
  }
  if (!autoStubbed) validateSemanticBinding(stagedRawIssues, context.preparedMetadata);
  const effectiveSynthesisFlags = autoStubbed ? [] : synthesisFlags;
  runStep('merge-contracts:issues', [
    script('merge-contracts.js'),
    '--issues-artifact',
    '--issue', stagedRawIssues,
    'from:code-review',
    runIdToken,
    ...effectiveSynthesisFlags,
    '--output', artifacts.issues,
  ], repoRoot);
  runStep('merge-contracts:report', [
    script('merge-contracts.js'),
    ...sharedSourceFlags,
    '--run-dir', absoluteRunDir,
    runIdToken,
    '--artifacts', artifacts.routes,
    '--artifacts', artifacts.quality,
    '--issue', artifacts.issues,
    ...effectiveSynthesisFlags,
    '--output', artifacts.report,
  ], repoRoot);
}

function main(argv) {
  let runId = null;
  let envelopePath = null;
  let metadataPath = null;
  try {
    const { options, rawIssues, rawIssuesValueMissing, help, phase } = parseRunnerArgs(argv);
    if (help) {
      process.stdout.write(helpText());
      return;
    }
    if (rawIssuesValueMissing) {
      emitFailure(
        'raw_issues_value_missing',
        '--raw-issues 必须紧跟一个非空文件路径。',
        options.runId,
        null,
      );
      return;
    }
    if (options.mode !== 'headless') {
      emitFailure(
        'mode_unsupported',
        `Runner v1 仅支持 mode:headless,收到 mode:${options.mode}。`,
        options.runId,
        null,
      );
      return;
    }
    if (!options.base) {
      emitFailure(
        'scope_headless_missing_base',
        'mode:headless 必须显式提供 base:<git-ref>。',
        options.runId,
        null,
      );
      return;
    }
    runId = options.runId || createRunId();
    if (!validateRunId(runId)) {
      emitFailure(
        'unsafe_run_id',
        'run-id must be a simple identifier using letters, numbers, dot, underscore, or dash.',
        runId,
        null,
      );
      return;
    }
    const repoRoot = resolveRepoRoot(options);
    validateBoundedExistingPath({
      repoRoot,
      inputPath: options.source || repoRoot,
      kind: 'source',
      expected: 'directory',
    });
    if (options.prd) {
      validateBoundedExistingPath({
        repoRoot,
        inputPath: options.prd,
        kind: 'prd',
        expected: 'file',
      });
    }
    if (options.figmaContext) {
      validateBoundedExistingPath({
        repoRoot,
        inputPath: options.figmaContext,
        kind: 'figma_context',
        expected: 'file',
      });
    }
    const defaultRunRoot = path.join(repoRoot, '.spec-first', 'app-audit', 'runs');
    const absoluteRunDir = options.runDir
      ? resolvePathAgainstRoot(repoRoot, options.runDir)
      : path.join(defaultRunRoot, runId);
    assertWritePathInsideBoundary({
      boundaryRoot: repoRoot,
      parent: defaultRunRoot,
      candidate: absoluteRunDir,
      reasonCode: 'run_dir_outside_default_root',
      message: 'run-dir must stay under .spec-first/app-audit/runs.',
    });

    envelopePath = options.output || path.join(absoluteRunDir, 'headless-envelope.txt');
    envelopePath = resolvePathAgainstRoot(repoRoot, envelopePath);
    assertWritePathInsideBoundary({
      boundaryRoot: repoRoot,
      parent: absoluteRunDir,
      candidate: envelopePath,
      reasonCode: 'output_outside_run_dir',
      message: 'output must stay inside the selected app-audit run directory.',
    });

    if (rawIssues) {
      validateBoundedExistingPath({
        repoRoot,
        inputPath: rawIssues,
        kind: 'raw_issues',
        expected: 'file',
      });
    }

    fs.mkdirSync(absoluteRunDir, { recursive: true });
    fs.mkdirSync(path.join(absoluteRunDir, 'contracts'), { recursive: true });

    const artifacts = {
      metadata: path.join(absoluteRunDir, 'metadata.json'),
      preflight: path.join(absoluteRunDir, 'preflight.json'),
      impact: path.join(absoluteRunDir, 'impact-facts.json'),
      product: path.join(absoluteRunDir, 'contracts', 'product-contract.json'),
      figma: path.join(absoluteRunDir, 'contracts', 'figma-design-contract.json'),
      code: path.join(absoluteRunDir, 'contracts', 'codebase-contract.json'),
      routes: path.join(absoluteRunDir, 'contracts', 'page-route-contract.json'),
      architecture: path.join(absoluteRunDir, 'contracts', 'kmp-architecture-contract.json'),
      quality: path.join(absoluteRunDir, 'contracts', 'engineering-quality-contract.json'),
      components: path.join(absoluteRunDir, 'contracts', 'component-contract.json'),
      modules: path.join(absoluteRunDir, 'contracts', 'module-contract.json'),
      analytics: path.join(absoluteRunDir, 'contracts', 'analytics-contract.json'),
      i18n: path.join(absoluteRunDir, 'contracts', 'i18n-contract.json'),
      industry: path.join(absoluteRunDir, 'contracts', 'industry-profile.preview.json'),
      rules: path.join(absoluteRunDir, 'contracts', 'industry-rule-pack-selection.json'),
      merged: path.join(absoluteRunDir, 'merged-context.json'),
      issues: path.join(absoluteRunDir, 'issues.json'),
      report: path.join(absoluteRunDir, 'audit-report.json'),
      context: path.join(absoluteRunDir, 'app-audit-context.json'),
      manifest: path.join(absoluteRunDir, 'artifact-manifest.json'),
      latestSummary: path.join(absoluteRunDir, 'latest-summary.json'),
      headlessEnvelope: envelopePath,
    };

    if (phase === 'abort') {
      if (!fs.existsSync(artifacts.metadata)) {
        throw boundaryError('prepare_receipt_missing', 'phase:abort requires an existing prepared run.');
      }
      metadataPath = artifacts.metadata;
      cleanupAndRecord({ repoRoot, absoluteRunDir, metadataPath });
      finalizeMetadata({ metadataPath, status: 'failed', statusReasonCodes: ['run_aborted'] });
      process.stdout.write(`App consistency audit aborted and ephemeral inputs cleaned (run-id: ${runId})\n`);
      return;
    }

    const sourceArg = options.source || repoRoot;
    const baseToken = `base:${options.base}`;
    const runIdToken = `run-id:${runId}`;
    const synthesisFlags = options.issueSynthesisStatus
      ? ['--issue-synthesis-status', options.issueSynthesisStatus]
      : [];

    const sharedSourceFlags = ['--source', sourceArg];
    const prdFlags = options.prd ? ['--prd', options.prd] : [];
    const figmaFlags = options.figmaContext ? ['--figma-context', options.figmaContext] : [];

    if (phase === 'finalize') {
      if (!fs.existsSync(artifacts.metadata) || !fs.existsSync(path.join(absoluteRunDir, 'receipts', 'prepare.json'))) {
        throw boundaryError('prepare_receipt_missing', 'phase:finalize requires a facts-ready prepare receipt.');
      }
      metadataPath = artifacts.metadata;
      try {
        const preparedMetadata = JSON.parse(fs.readFileSync(artifacts.metadata, 'utf8'));
        const currentMetadata = buildRunMetadata({ ...options, repoRoot, runId, runDir: absoluteRunDir, source: sourceArg });
        if (currentMetadata.prepare_fingerprint !== preparedMetadata.prepare_fingerprint) {
          throw boundaryError('source_fingerprint_stale', 'Source, PRD, Figma, or worktree changed after prepare; rerun phase:prepare.');
        }
        finalizePreparedRun({
          options,
          rawIssues,
          repoRoot,
          absoluteRunDir,
          runId,
          runIdToken,
          artifacts,
          sharedSourceFlags,
          synthesisFlags,
          preparedMetadata,
        });
        cleanupAndRecord({ repoRoot, absoluteRunDir, metadataPath });
        const reportArtifact = JSON.parse(fs.readFileSync(artifacts.report, 'utf8'));
        const degraded = Array.isArray(reportArtifact.scope_and_degraded_modes) ? reportArtifact.scope_and_degraded_modes : [];
        const finalizeReceipt = stageReceipt('finalize', 'audit-report.json', [preparedMetadata.worktree_fingerprint], {
          reasonCodes: reportArtifact.issue_synthesis_status === 'not_run' ? ['semantic_stage_not_run'] : [],
          limitations: reportArtifact.issue_synthesis_status === 'not_run' ? ['No staged semantic artifact was available; zero issues is not a pass.'] : [],
        });
        writeReceipt(absoluteRunDir, 'finalize', finalizeReceipt);
        appendStageReceipt({ metadataPath, receipt: finalizeReceipt });
        finalizeMetadata({
          metadataPath,
          status: degraded.length > 0 ? 'degraded' : 'complete',
          statusReasonCodes: degraded.map((entry) => entry && entry.code).filter(Boolean),
          stageReceipts: JSON.parse(fs.readFileSync(metadataPath, 'utf8')).stage_receipts,
        });
        runStep('build-audit-context', [script('build-audit-context.js'), '--artifacts-dir', absoluteRunDir, '--output', artifacts.context], repoRoot);
        const metadata = JSON.parse(fs.readFileSync(artifacts.metadata, 'utf8'));
        fs.writeFileSync(artifacts.latestSummary, `${JSON.stringify(buildLatestSummary(metadata), null, 2)}\n`);
        runStep('build-artifact-manifest', [script('build-artifact-manifest.js'), '--run-dir', absoluteRunDir, runIdToken, '--output', artifacts.manifest], repoRoot);
        runStep('render-headless-envelope', [script('render-headless-envelope.js'), '--metadata', artifacts.metadata, '--report', artifacts.report, '--output', artifacts.headlessEnvelope], repoRoot);
        process.stdout.write(`App consistency audit finalize complete (run-id: ${runId})\n`);
        return;
      } catch (error) {
        cleanupAndRecord({ repoRoot, absoluteRunDir, metadataPath });
        throw error;
      }
    }

    runStep('build-run-metadata', [
      script('build-run-metadata.js'),
      'mode:headless',
      baseToken,
      runIdToken,
      ...sharedSourceFlags,
      ...prdFlags,
      ...figmaFlags,
      '--run-dir', absoluteRunDir,
      '--output', artifacts.metadata,
    ], repoRoot);
    metadataPath = artifacts.metadata;

    runStep('preflight', [
      script('preflight.js'),
      ...sharedSourceFlags,
      ...prdFlags,
      ...figmaFlags,
      '--output', artifacts.preflight,
    ], repoRoot);

    runStep('build-impact-facts', [
      script('build-impact-facts.js'),
      'mode:headless',
      baseToken,
      ...sharedSourceFlags,
      ...prdFlags,
      ...figmaFlags,
      '--output', artifacts.impact,
    ], repoRoot);

    runStep('extract-prd-contract', [
      script('extract-prd-contract.js'),
      ...sharedSourceFlags,
      ...prdFlags,
      '--output', artifacts.product,
    ], repoRoot);

    runStep('extract-figma-contract', [
      script('extract-figma-contract.js'),
      ...sharedSourceFlags,
      ...figmaFlags,
      '--output', artifacts.figma,
    ], repoRoot);

    runStep('extract-code-contract', [
      script('extract-code-contract.js'),
      ...sharedSourceFlags,
      '--output', artifacts.code,
    ], repoRoot);

    runStep('extract-page-routes', [
      script('extract-page-routes.js'),
      ...sharedSourceFlags,
      '--product-contract', artifacts.product,
      '--figma-contract', artifacts.figma,
      '--code-contract', artifacts.code,
      '--output', artifacts.routes,
    ], repoRoot);

    runStep('extract-kmp-architecture', [
      script('extract-kmp-architecture.js'),
      ...sharedSourceFlags,
      '--output', artifacts.architecture,
    ], repoRoot);

    runStep('extract-engineering-quality', [
      script('extract-engineering-quality.js'),
      ...sharedSourceFlags,
      '--output', artifacts.quality,
    ], repoRoot);

    runStep('extract-components', [
      script('extract-components.js'),
      ...sharedSourceFlags,
      '--figma-contract', artifacts.figma,
      '--output', artifacts.components,
    ], repoRoot);

    runStep('extract-modules', [
      script('extract-modules.js'),
      ...sharedSourceFlags,
      '--output', artifacts.modules,
    ], repoRoot);

    runStep('extract-analytics', [
      script('extract-analytics.js'),
      ...sharedSourceFlags,
      '--output', artifacts.analytics,
    ], repoRoot);

    runStep('extract-i18n', [
      script('extract-i18n.js'),
      ...sharedSourceFlags,
      '--output', artifacts.i18n,
    ], repoRoot);

    runStep('build-industry-profile', [
      script('build-industry-profile.js'),
      ...sharedSourceFlags,
      '--product-contract', artifacts.product,
      '--figma-contract', artifacts.figma,
      '--code-contract', artifacts.code,
      '--analytics-contract', artifacts.analytics,
      '--i18n-contract', artifacts.i18n,
      '--output', artifacts.industry,
    ], repoRoot);

    runStep('select-rule-packs', [
      script('select-rule-packs.js'),
      ...sharedSourceFlags,
      '--preflight', artifacts.preflight,
      '--industry-profile', artifacts.industry,
      '--output', artifacts.rules,
    ], repoRoot);

    runStep('merge-contracts:merged', [
      script('merge-contracts.js'),
      '--artifacts', artifacts.product,
      '--artifacts', artifacts.figma,
      '--artifacts', artifacts.code,
      '--artifacts', artifacts.routes,
      '--artifacts', artifacts.architecture,
      '--artifacts', artifacts.quality,
      '--artifacts', artifacts.components,
      '--artifacts', artifacts.modules,
      '--artifacts', artifacts.analytics,
      '--artifacts', artifacts.i18n,
      '--artifacts', artifacts.industry,
      '--artifacts', artifacts.rules,
      '--output', artifacts.merged,
    ], repoRoot);

    if (phase === 'prepare') {
      runStep('build-audit-context', [
        script('build-audit-context.js'),
        '--artifacts-dir', absoluteRunDir,
        '--output', artifacts.context,
      ], repoRoot);
      const preparedMetadata = JSON.parse(fs.readFileSync(artifacts.metadata, 'utf8'));
      const receipt = stageReceipt('prepare', 'app-audit-context.json', [
        preparedMetadata.prepare_fingerprint,
        preparedMetadata.diff_hash,
      ], {
        reasonCodes: ['facts_ready'],
        limitations: ['Semantic artifact production is host-owned and has not run yet.'],
      });
      writeReceipt(absoluteRunDir, 'prepare', receipt);
      appendStageReceipt({ metadataPath: artifacts.metadata, receipt });
      fs.mkdirSync(path.join(absoluteRunDir, 'input'), { recursive: true });
      process.stdout.write(`Facts ready (run-id: ${runId})\n`);
      process.stdout.write(`Run dir: ${publicPath(repoRoot, absoluteRunDir, 'run-outside-repo')}\n`);
      return;
    }

    const stagedRawIssues = rawIssues
      ? resolvePathAgainstRoot(repoRoot, rawIssues)
      : path.join(absoluteRunDir, 'input', 'raw-issues.json');
    let autoStubbed = false;
    if (!fs.existsSync(stagedRawIssues)) {
      if (options.issueSynthesisStatus === 'llm_provided' || options.issueSynthesisStatus === 'fixture_provided') {
        cleanupAndRecord({ repoRoot, absoluteRunDir, metadataPath: artifacts.metadata });
        finalizeMetadata({ metadataPath: artifacts.metadata, status: 'failed', statusReasonCodes: ['issue_synthesis_status_without_input'] });
        emitFailure(
          'issue_synthesis_status_without_input',
          `--issue-synthesis-status ${options.issueSynthesisStatus} 需要 staged raw-issues 文件;runner 不会自动生成 LLM verdict。`,
          runId,
          envelopePath,
        );
        return;
      }
      fs.mkdirSync(path.dirname(stagedRawIssues), { recursive: true });
      fs.writeFileSync(stagedRawIssues, `${JSON.stringify({ issues: [], rejected_issues: [] }, null, 2)}\n`);
      autoStubbed = true;
    }
    if (!autoStubbed && (!options.issueSynthesisStatus || options.issueSynthesisStatus === 'not_run')) {
      cleanupAndRecord({ repoRoot, absoluteRunDir, metadataPath: artifacts.metadata });
      finalizeMetadata({ metadataPath: artifacts.metadata, status: 'failed', statusReasonCodes: ['issue_synthesis_status_required_with_input'] });
      emitFailure(
        'issue_synthesis_status_required_with_input',
        'Staged raw-issues 文件存在时,必须显式提供 --issue-synthesis-status (llm_provided 或 fixture_provided);runner 不会替调用方判断 issue 来源。',
        runId,
        envelopePath,
      );
      return;
    }
    const effectiveSynthesisFlags = autoStubbed ? [] : synthesisFlags;

    runStep('merge-contracts:issues', [
      script('merge-contracts.js'),
      '--issues-artifact',
      '--issue', stagedRawIssues,
      'from:code-review',
      runIdToken,
      ...effectiveSynthesisFlags,
      '--output', artifacts.issues,
    ], repoRoot);

    runStep('merge-contracts:report', [
      script('merge-contracts.js'),
      ...sharedSourceFlags,
      '--run-dir', absoluteRunDir,
      runIdToken,
      '--artifacts', artifacts.routes,
      '--artifacts', artifacts.quality,
      '--issue', artifacts.issues,
      ...effectiveSynthesisFlags,
      '--output', artifacts.report,
    ], repoRoot);

    const reportArtifact = JSON.parse(fs.readFileSync(artifacts.report, 'utf8'));
    const reportDegradedModes = Array.isArray(reportArtifact.scope_and_degraded_modes)
      ? reportArtifact.scope_and_degraded_modes
      : [];
    const finalStatus = reportDegradedModes.length > 0 ? 'degraded' : 'complete';
    const finalReasonCodes = reportDegradedModes
      .map((entry) => (entry && typeof entry === 'object' ? entry.code : entry))
      .filter((code) => typeof code === 'string' && code.length > 0);
    finalizeMetadata({
      metadataPath: artifacts.metadata,
      status: finalStatus,
      statusReasonCodes: finalReasonCodes,
    });

    cleanupAndRecord({ repoRoot, absoluteRunDir, metadataPath: artifacts.metadata });

    runStep('build-audit-context', [
      script('build-audit-context.js'),
      '--artifacts-dir', absoluteRunDir,
      '--output', artifacts.context,
    ], repoRoot);
    const auditContext = JSON.parse(fs.readFileSync(artifacts.context, 'utf8'));
    if (auditContext.valid !== true) {
      const error = new Error('artifact_validation_failed: generated artifacts failed validation.');
      error.reasonCode = 'artifact_validation_failed';
      throw error;
    }

    const metadata = JSON.parse(fs.readFileSync(artifacts.metadata, 'utf8'));
    const summary = buildLatestSummary(metadata);
    fs.writeFileSync(artifacts.latestSummary, `${JSON.stringify(summary, null, 2)}\n`);

    runStep('build-artifact-manifest', [
      script('build-artifact-manifest.js'),
      '--run-dir', absoluteRunDir,
      runIdToken,
      '--output', artifacts.manifest,
    ], repoRoot);

    runStep('render-headless-envelope', [
      script('render-headless-envelope.js'),
      '--metadata', artifacts.metadata,
      '--report', artifacts.report,
      '--output', artifacts.headlessEnvelope,
    ], repoRoot);

    process.stdout.write(`App consistency audit complete (run-id: ${runId})\n`);
    process.stdout.write(`Run dir: ${publicPath(repoRoot, absoluteRunDir, 'run-outside-repo')}\n`);
  } catch (error) {
    const reasonCode = error.reasonCode || 'runner_failed';
    const message = error.message || 'Runner failed.';
    if (error.stderr) {
      process.stderr.write(`${error.stderr}\n`);
    }
    if (metadataPath) {
      try {
        finalizeMetadata({
          metadataPath,
          status: 'failed',
          statusReasonCodes: [reasonCode].filter(Boolean),
        });
      } catch (finalizeError) {
        process.stderr.write(`finalize_failed: ${finalizeError.message}\n`);
      }
    }
    const failureOutput = reasonCode === 'output_outside_run_dir' ? null : envelopePath;
    emitFailure(reasonCode, message, runId, failureOutput, error.upstreamEnvelope);
  }
}

if (require.main === module) {
  main(process.argv.slice(2));
}

module.exports = {
  helpText,
  parseRunnerArgs,
  main,
  ISSUE_SYNTHESIS_STATUSES,
};
