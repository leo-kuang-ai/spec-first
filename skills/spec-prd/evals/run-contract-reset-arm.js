#!/usr/bin/env node
'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  isExactRepoRelativePath,
  isSecretDeniedPath,
} = require('../../../src/cli/helpers/secret-deny-patterns');
const {
  assertNoSensitiveContent,
  computeTreeHash,
  ensurePrivateDir,
  isWithinRoot,
  opaqueNamespaceId,
  writePrivateFile,
} = require('./lib/contract-reset-safety');
const {
  computeMaterializationContractHash,
  computeThresholdContractHash,
  deriveExpectedSchedule,
  isPassedIsolationEvidence,
} = require('./run-evals');
const {
  CONTRACT_RESET_ARMS,
  ISOLATION_PRIMITIVES,
  ISOLATION_PROBE_NAMES,
  ISOLATION_SCHEMA_VERSION,
} = require('./lib/contract-reset-contract');

const ARMS = new Set(CONTRACT_RESET_ARMS);
const ISOLATION_PRIMITIVE_SET = new Set(ISOLATION_PRIMITIVES);

function sha256(value) {
  return `sha256:${crypto.createHash('sha256').update(value).digest('hex')}`;
}

function writePrivateJson(filePath, value) {
  writePrivateFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function listTreeFiles(root) {
  const files = [];
  function visit(current, relative = '') {
    for (const name of fs.readdirSync(current).sort()) {
      if (!relative && name === '.git') continue;
      const absolute = path.join(current, name);
      const nextRelative = relative ? `${relative}/${name}` : name;
      const stat = fs.lstatSync(absolute);
      if (stat.isSymbolicLink()) {
        throw new Error(`symlink source is forbidden: ${nextRelative}`);
      }
      if (stat.isDirectory()) {
        visit(absolute, nextRelative);
      } else if (stat.isFile()) {
        files.push(nextRelative.split(path.sep).join('/'));
      }
    }
  }
  if (fs.existsSync(root)) visit(root);
  return files;
}

function git(repoRoot, args, options = {}) {
  const result = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: options.encoding === undefined ? 'utf8' : options.encoding,
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.status !== 0) {
    const error = new Error(`git ${args.join(' ')} failed: ${String(result.stderr || result.stdout || '').trim()}`);
    error.reason_code = 'git_operation_failed';
    throw error;
  }
  return result.stdout;
}

function validateSourcePath(repoRoot, revision, sourcePath, options = {}) {
  if (!isExactRepoRelativePath(sourcePath)) {
    throw new Error(`source path must be exact repo-relative: ${sourcePath}`);
  }
  if (isSecretDeniedPath(sourcePath)) {
    throw new Error(`secret-denied source path: ${sourcePath}`);
  }
  const entry = String(git(repoRoot, ['ls-tree', revision, '--', sourcePath])).trim();
  if (!entry) {
    if (options.allowMissing === true) return { present: false, mode: null };
    throw new Error(`tracked source is missing at ${revision}: ${sourcePath}`);
  }
  if (/^120000\s/.test(entry)) {
    throw new Error(`symlink source is forbidden: ${sourcePath}`);
  }
  const modeMatch = entry.match(/^(100644|100755)\s/);
  if (!modeMatch) throw new Error(`unsupported tracked source mode for ${sourcePath}`);
  return {
    present: true,
    mode: modeMatch[1] === '100755' ? 0o755 : 0o644,
  };
}

function resolveRunFile(runDir, relativePath, label) {
  if (!isExactRepoRelativePath(relativePath)) {
    throw new Error(`${label} must be an exact run-relative path: ${relativePath}`);
  }
  const absolutePath = path.resolve(runDir, relativePath);
  if (!isWithinRoot(absolutePath, runDir)) {
    throw new Error(`${label} escapes run directory: ${relativePath}`);
  }
  const stat = fs.lstatSync(absolutePath);
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error(`${label} must be a regular non-symlink file: ${relativePath}`);
  }
  return absolutePath;
}

function materializeArmSource(options) {
  const repoRoot = path.resolve(options.repoRoot);
  const runDir = path.resolve(options.runDir);
  const destination = path.resolve(options.destination);
  const manifest = options.manifest;
  const arm = options.arm;
  if (!ARMS.has(arm) && !manifest.arms[arm]) {
    throw new Error(`unknown arm: ${arm}`);
  }
  if (!isWithinRoot(destination, runDir)) {
    throw new Error(`materialization destination escapes run directory: ${destination}`);
  }
  if (fs.existsSync(destination)) {
    throw new Error(`materialization destination already exists: ${destination}`);
  }
  if (!manifest || manifest.schema_version !== 'contract-reset-source-manifest/v1') {
    throw new Error('invalid contract-reset source manifest');
  }
  const armContract = manifest.arms && manifest.arms[arm];
  if (!armContract || !Array.isArray(armContract.patch_chain)) {
    throw new Error(`arm contract missing: ${arm}`);
  }
  const sourceEntries = manifest.source_files || [];
  const sourcePaths = sourceEntries.map((entry) => entry.path);
  if (sourcePaths.length === 0) {
    throw new Error('source manifest must declare source_files');
  }

  const parentDir = path.dirname(destination);
  ensurePrivateDir(parentDir);
  const tempDir = path.join(parentDir, `.${path.basename(destination)}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`);
  try {
    ensurePrivateDir(tempDir);
    for (const sourceEntry of sourceEntries) {
      const sourcePath = sourceEntry.path;
      const sourceInfo = validateSourcePath(repoRoot, manifest.parent_revision, sourcePath, {
        allowMissing: sourceEntry.baseline_present === false,
      });
      if (!sourceInfo.present) continue;
      const bytes = git(repoRoot, ['show', `${manifest.parent_revision}:${sourcePath}`], { encoding: null });
      writePrivateFile(path.join(tempDir, sourcePath), bytes, { mode: sourceInfo.mode });
    }
    git(tempDir, ['init', '-q']);

    for (const patchId of armContract.patch_chain) {
      const patchContract = manifest.patches && manifest.patches[patchId];
      if (!patchContract) throw new Error(`patch contract missing: ${patchId}`);
      const patchPath = resolveRunFile(runDir, patchContract.path, `patch ${patchId}`);
      const patchBytes = fs.readFileSync(patchPath);
      if (sha256(patchBytes) !== patchContract.sha256) {
        throw new Error(`patch hash mismatch: ${patchId}`);
      }
      git(tempDir, ['apply', '--whitespace=nowarn', patchPath]);
    }

    const actualFiles = listTreeFiles(tempDir);
    const allowlist = new Set(sourcePaths);
    for (const actualPath of actualFiles) {
      if (!allowlist.has(actualPath)) {
        throw new Error(`patch created undeclared source file: ${actualPath}`);
      }
      if (isSecretDeniedPath(actualPath)) {
        throw new Error(`secret-denied source path: ${actualPath}`);
      }
    }
    const treeHash = computeTreeHash(tempDir, actualFiles);
    if (!armContract.tree_hash && options.allowUnverifiedTreeHash !== true) {
      throw new Error(`arm tree hash is missing for ${arm}`);
    }
    if (armContract.tree_hash && treeHash !== armContract.tree_hash) {
      throw new Error(`arm tree hash mismatch for ${arm}: expected ${armContract.tree_hash}, got ${treeHash}`);
    }
    fs.rmSync(path.join(tempDir, '.git'), { recursive: true, force: true });
    fs.renameSync(tempDir, destination);
    return {
      schema_version: 'contract-reset-materialization/v1',
      artifact_type: 'confirmed',
      status: 'materialized',
      arm,
      tree_hash: treeHash,
      source_file_count: actualFiles.length,
      destination,
    };
  } catch (error) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    fs.rmSync(destination, { recursive: true, force: true });
    throw error;
  }
}

function buildMaterializationVerification(options) {
  const manifest = options.manifest;
  const reports = Array.isArray(options.armReports) ? options.armReports : [];
  const reportsByArm = new Map(reports.map((entry) => [entry && entry.arm, entry]));
  const arms = {};
  for (const arm of CONTRACT_RESET_ARMS) {
    const report = reportsByArm.get(arm);
    const armContract = manifest.arms && manifest.arms[arm];
    if (!report
      || report.status !== 'materialized'
      || report.artifact_type !== 'confirmed'
      || !armContract
      || report.tree_hash !== armContract.tree_hash) {
      throw new Error(`materialization verification is incomplete for ${arm}`);
    }
    arms[arm] = {
      patch_chain: [...armContract.patch_chain],
      tree_hash: report.tree_hash,
      source_file_count: report.source_file_count,
    };
  }
  return {
    schema_version: 'contract-reset-materialization-verification/v1',
    artifact_type: 'confirmed',
    producer: 'run-contract-reset-arm.js',
    parent_revision: manifest.parent_revision,
    contract_hash: computeMaterializationContractHash(manifest),
    arms,
  };
}

function prepareArmNamespace(options) {
  const repoRoot = path.resolve(options.repoRoot);
  const runDir = path.resolve(options.runDir);
  const manifest = options.manifest;
  const cases = options.cases;
  const arm = options.arm;
  const repeat = Number(options.repeat);
  const orderPosition = Number(options.orderPosition);
  const sessionId = String(options.sessionId || '');
  const caseEntry = cases && Array.isArray(cases.cases)
    ? cases.cases.find((entry) => entry.id === options.caseId)
    : null;
  if (!caseEntry) throw new Error(`unknown case: ${options.caseId}`);
  if (!sessionId || /(?:baseline|phase1|candidate)/i.test(sessionId)) {
    throw new Error('session_id must be opaque and must not encode arm identity');
  }
  const scheduleRow = (manifest.sessions || []).find((entry) => (
    entry.case_id === caseEntry.id
    && entry.arm === arm
    && Number(entry.repeat) === repeat
    && Number(entry.order_position) === orderPosition
    && entry.session_id === sessionId
  ));
  if (!scheduleRow) throw new Error('session/order row does not match the frozen source manifest');

  const namespaceId = opaqueNamespaceId(sessionId);
  const namespaceRoot = path.join(runDir, 'namespaces', namespaceId);
  if (fs.existsSync(namespaceRoot)) throw new Error(`namespace already exists: ${namespaceId}`);
  ensurePrivateDir(namespaceRoot);
  try {
    const sourceRoot = path.join(namespaceRoot, 'source');
    const materialization = materializeArmSource({
      repoRoot,
      runDir,
      manifest,
      arm,
      destination: sourceRoot,
    });
    const inputsRoot = path.join(namespaceRoot, 'inputs');
    ensurePrivateDir(inputsRoot);
    const inputFacts = [];
    for (const input of caseEntry.inputs || []) {
      if (!input || !isExactRepoRelativePath(input.path || '') || isSecretDeniedPath(input.path)) {
        throw new Error(`case input path is unsafe or secret-denied: ${input && input.path}`);
      }
      const bytes = Buffer.from(String(input.content || ''), 'utf8');
      assertNoSensitiveContent(`case input ${input.path}`, bytes);
      const target = path.join(inputsRoot, input.path);
      if (!isWithinRoot(target, inputsRoot)) throw new Error(`case input escapes namespace: ${input.path}`);
      writePrivateFile(target, bytes);
      inputFacts.push({ path: `inputs/${input.path}`, sha256: sha256(bytes), bytes: bytes.length });
    }
    const modelVisibleManifest = {
      schema_version: 'contract-reset-model-visible-manifest/v1',
      artifact_type: 'generated',
      case_id: caseEntry.id,
      intent: caseEntry.intent,
      authority_profile: caseEntry.authority_profile,
      review_focus: caseEntry.review_focus,
      session_id: sessionId,
      repeat,
      order_position: orderPosition,
      invocation_profile: manifest.invocation_profile,
      source: {
        root: 'source',
        tree_hash: materialization.tree_hash,
        files: (manifest.source_files || []).map((entry) => entry.path),
      },
      inputs: inputFacts,
      limitations: [
        'Only namespace-local inputs and source are available.',
        'Arm identity, version mapping, oracle, grades, sibling outputs, and holdout are intentionally absent.',
      ],
    };
    const serialized = `${JSON.stringify(modelVisibleManifest, null, 2)}\n`;
    if (/"arm"\s*:|version_mapping|owner_answer_oracle|grading_notes|holdout_bundle/i.test(serialized)) {
      throw new Error('model-visible manifest leaks control-plane identity');
    }
    writePrivateFile(path.join(namespaceRoot, 'model-visible-manifest.json'), serialized);
    ensurePrivateDir(path.join(namespaceRoot, 'output'));
    return {
      schema_version: 'contract-reset-namespace-preparation/v1',
      artifact_type: 'generated',
      status: 'prepared',
      namespace_id: namespaceId,
      namespace_root: namespaceRoot,
      arm,
      case_id: caseEntry.id,
      repeat,
      order_position: orderPosition,
      session_id: sessionId,
      source_tree_hash: materialization.tree_hash,
      model_visible_manifest_hash: sha256(Buffer.from(serialized)),
      input_count: inputFacts.length,
    };
  } catch (error) {
    fs.rmSync(namespaceRoot, { recursive: true, force: true });
    throw error;
  }
}

function detectIsolationPrimitive() {
  if (process.platform === 'darwin') {
    const command = '/usr/bin/sandbox-exec';
    try {
      fs.accessSync(command, fs.constants.X_OK);
      return { status: 'available', id: 'macos-sandbox-exec', command };
    } catch (_error) {
      // Fall through to the explicit unavailable result.
    }
  }
  return {
    status: 'unavailable',
    id: null,
    command: null,
    reason_code: 'hard_isolation_unavailable',
  };
}

function sandboxLiteral(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function macSandboxProfile(namespaceRoot, outputDir) {
  const executable = fs.realpathSync.native(process.execPath);
  const executableDir = path.dirname(executable);
  const readRoots = [
    '/System/Library',
    '/usr/lib',
    '/usr/share',
    '/private/var/db/dyld',
    executableDir,
    namespaceRoot,
  ];
  return [
    '(version 1)',
    '(deny default)',
    '(allow process*)',
    '(allow signal (target self))',
    '(allow sysctl-read)',
    '(allow mach-lookup)',
    '(allow file-read-metadata)',
    `(allow file-read* ${readRoots.map((root) => `(subpath ${sandboxLiteral(root)})`).join(' ')})`,
    `(allow file-read* (literal ${sandboxLiteral(executable)}))`,
    `(allow file-write* (subpath ${sandboxLiteral(outputDir)}))`,
    '(allow file-read* file-write* (literal "/dev/null"))',
  ].join('\n');
}

function buildIsolationTargets(options) {
  const namespaceRoot = path.resolve(options.namespaceRoot);
  const control = path.resolve(options.controlPath);
  const parentTraversal = path.relative(namespaceRoot, control);
  if (path.isAbsolute(parentTraversal)
    || !parentTraversal.split(path.sep).includes('..')
    || parentTraversal === control) {
    throw new Error('parent traversal probe must preserve a distinct namespace-relative ../ path');
  }
  return {
    absolute: options.absolutePath || '/etc/passwd',
    parent_traversal: parentTraversal,
    symlink: path.resolve(options.symlinkPath),
    control,
    sibling: path.resolve(options.siblingPath),
  };
}

function buildRunProbePaths(runDir, namespaceRoot) {
  const resolvedRunDir = path.resolve(runDir);
  const resolvedNamespaceRoot = path.resolve(namespaceRoot);
  if (!isWithinRoot(resolvedNamespaceRoot, resolvedRunDir)) {
    throw new Error('namespace root escapes run directory');
  }
  const siblingId = `probe-sibling-${crypto.createHash('sha256')
    .update(resolvedNamespaceRoot)
    .digest('hex')
    .slice(0, 16)}`;
  const controlRoot = path.join(resolvedRunDir, 'control');
  const siblingRoot = path.join(resolvedRunDir, 'namespaces', siblingId);
  if (isWithinRoot(siblingRoot, resolvedNamespaceRoot)
    || isWithinRoot(resolvedNamespaceRoot, siblingRoot)) {
    throw new Error('sibling probe namespace overlaps current namespace');
  }
  return {
    controlRoot,
    controlPath: path.join(controlRoot, 'owner-answer-oracle.canary'),
    siblingRoot,
    siblingPath: path.join(siblingRoot, 'output', 'sibling-arm-output.canary'),
  };
}

function runIsolationProbe(options) {
  const primitive = options.primitive || detectIsolationPrimitive();
  const base = {
    schema_version: ISOLATION_SCHEMA_VERSION,
    primitive: primitive.id || null,
    model_invoked: false,
    probes: {},
  };
  if (primitive.status !== 'available') {
    return {
      ...base,
      artifact_type: 'degraded',
      status: 'inconclusive',
      reason_code: 'hard_isolation_unavailable',
    };
  }
  if (!ISOLATION_PRIMITIVE_SET.has(primitive.id)) {
    return {
      ...base,
      artifact_type: 'degraded',
      status: 'inconclusive',
      reason_code: 'isolation_primitive_unsupported',
    };
  }

  const namespaceRoot = path.resolve(options.namespaceRoot);
  const probeRoot = path.join(namespaceRoot, '.isolation-probe');
  const outputDir = path.join(probeRoot, 'output');
  ensurePrivateDir(outputDir);
  const resultPath = path.join(outputDir, 'result.json');
  const probeScript = path.join(probeRoot, 'probe.js');
  const targets = buildIsolationTargets(options);
  writePrivateFile(probeScript, [
    "'use strict';",
    "const fs = require('node:fs');",
    'const targets = JSON.parse(process.argv[2]);',
    'const resultPath = process.argv[3];',
    'const probes = {};',
    'for (const [name, target] of Object.entries(targets)) {',
    '  try {',
    '    fs.readFileSync(target);',
    "    probes[name] = { denied: false, code: 'read-succeeded' };",
    '  } catch (error) {',
    "    const code = error && error.code ? error.code : 'unknown-error';",
    "    probes[name] = { denied: code === 'EACCES' || code === 'EPERM', code };",
    '  }',
    '}',
    "fs.writeFileSync(resultPath, `${JSON.stringify(probes)}\\n`, 'utf8');",
  ].join('\n'));

  const profile = macSandboxProfile(namespaceRoot, outputDir);
  const result = spawnSync(primitive.command, [
    '-p',
    profile,
    fs.realpathSync.native(process.execPath),
    probeScript,
    JSON.stringify(targets),
    resultPath,
  ], {
    cwd: namespaceRoot,
    encoding: 'utf8',
    timeout: 15000,
    maxBuffer: 1024 * 1024,
  });
  if (result.status !== 0 || !fs.existsSync(resultPath)) {
    return {
      ...base,
      artifact_type: 'degraded',
      status: 'inconclusive',
      reason_code: 'isolation_probe_execution_failed',
      exit_code: result.status,
      signal: result.signal || null,
      error: result.error ? result.error.message : null,
      stderr: String(result.stderr || '').trim().slice(0, 1000),
    };
  }
  let probes;
  try {
    probes = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  } catch (_error) {
    return {
      ...base,
      artifact_type: 'degraded',
      status: 'inconclusive',
      reason_code: 'isolation_probe_result_invalid',
      exit_code: result.status,
    };
  }
  const probeNames = probes && typeof probes === 'object' && !Array.isArray(probes)
    ? Object.keys(probes).sort()
    : [];
  const exactProbeSet = JSON.stringify(probeNames) === JSON.stringify([...ISOLATION_PROBE_NAMES].sort());
  const passedCandidate = {
    ...base,
    artifact_type: 'confirmed',
    status: 'passed',
    reason_code: 'isolation_probe_passed',
    probes,
    exit_code: result.status,
  };
  const allDenied = exactProbeSet && isPassedIsolationEvidence(passedCandidate);
  return allDenied ? passedCandidate : {
    ...passedCandidate,
    status: 'invalid',
    reason_code: 'isolation_probe_contract_invalid',
  };
}

function runContractResetArm(options) {
  const prepared = prepareArmNamespace(options);
  const runDir = path.resolve(options.runDir);
  const probePaths = buildRunProbePaths(runDir, prepared.namespace_root);
  ensurePrivateDir(probePaths.controlRoot);
  ensurePrivateDir(path.dirname(probePaths.siblingPath));
  const { controlPath, siblingPath } = probePaths;
  writePrivateFile(controlPath, 'CONTROL_PLANE_CANARY\n');
  writePrivateFile(siblingPath, 'SIBLING_ARM_CANARY\n');
  const symlinkPath = path.join(prepared.namespace_root, '.probe-outside-link');
  fs.symlinkSync(controlPath, symlinkPath);
  const isolation = runIsolationProbe({
    namespaceRoot: prepared.namespace_root,
    controlPath,
    siblingPath,
    symlinkPath,
    absolutePath: options.absoluteProbePath || '/etc/passwd',
    primitive: options.primitive,
  });
  fs.rmSync(symlinkPath, { force: true });
  fs.rmSync(path.join(prepared.namespace_root, '.isolation-probe'), { recursive: true, force: true });

  if (isolation.status !== 'passed') {
    return {
      schema_version: 'contract-reset-arm-run/v1',
      artifact_type: isolation.status === 'invalid' ? 'confirmed' : 'degraded',
      status: isolation.status === 'invalid' ? 'invalid' : 'inconclusive',
      reason_code: isolation.reason_code,
      model_invoked: false,
      namespace: prepared,
      isolation,
    };
  }
  return {
    schema_version: 'contract-reset-arm-run/v1',
    artifact_type: 'degraded',
    status: 'inconclusive',
    reason_code: 'agent_invocation_profile_not_configured',
    model_invoked: false,
    namespace: prepared,
    isolation,
  };
}

function defaultRuntimeSourcePaths(repoRoot) {
  const tracked = String(git(repoRoot, [
    'ls-files',
    '--',
    'skills/spec-prd',
    'templates/claude/hooks/prd-prewrite-guard',
    'templates/claude/hooks/prd-readiness-guard',
    'templates/qoder/hooks/prd-prewrite-guard',
    'templates/qoder/hooks/prd-readiness-guard',
  ])).split(/\r?\n/).filter(Boolean);
  return tracked
    .filter((sourcePath) => !sourcePath.startsWith('skills/spec-prd/evals/'))
    .sort();
}

function prepareRun(options) {
  const repoRoot = path.resolve(options.repoRoot);
  const runDir = path.resolve(options.runDir);
  const casesPath = path.resolve(options.casesPath);
  const candidatePatchSource = path.resolve(options.candidatePatchPath);
  if (fs.existsSync(runDir)) throw new Error(`run directory already exists: ${runDir}`);
  const casesBytes = fs.readFileSync(casesPath);
  const cases = JSON.parse(casesBytes.toString('utf8'));
  if (cases.schema_version !== 'contract-reset-cases/v1') {
    throw new Error('Contract Reset cases schema is invalid');
  }
  const parentRevision = String(git(repoRoot, ['rev-parse', 'HEAD'])).trim();
  const sourcePaths = options.sourcePaths || defaultRuntimeSourcePaths(repoRoot);
  const candidateAddedPath = 'skills/spec-prd/references/product-contract-authoring.md';
  if (!sourcePaths.includes(candidateAddedPath)) sourcePaths.push(candidateAddedPath);
  sourcePaths.sort();
  const baselinePaths = sourcePaths.filter((sourcePath) => sourcePath !== candidateAddedPath);
  const controlPatch = git(repoRoot, ['diff', '--binary', parentRevision, '--', ...baselinePaths], { encoding: null });
  if (!controlPatch || controlPatch.length === 0) {
    throw new Error('phase1 control patch is empty; Gate A requires a distinct phase1_control arm');
  }
  const candidatePatch = fs.readFileSync(candidatePatchSource);
  if (candidatePatch.length === 0) throw new Error('candidate patch is empty');

  ensurePrivateDir(runDir);
  try {
    writePrivateFile(path.join(runDir, 'control.patch'), controlPatch);
    writePrivateFile(path.join(runDir, 'candidate.patch'), candidatePatch);
    const sessions = deriveExpectedSchedule(cases).map((entry) => ({
      ...entry,
      session_id: crypto.randomUUID(),
    }));
    const casesRelativePath = path.relative(repoRoot, casesPath).split(path.sep).join('/');
    if (!isExactRepoRelativePath(casesRelativePath)) {
      throw new Error('cases path must stay inside the repository');
    }
    const manifest = {
      schema_version: 'contract-reset-source-manifest/v1',
      artifact_type: 'generated',
      run_id: options.runId || path.basename(runDir),
      attempt_id: options.attemptId || `gate-a-${path.basename(runDir)}`,
      created_at: new Date().toISOString(),
      parent_revision: parentRevision,
      cases_path: casesRelativePath,
      cases_hash: sha256(casesBytes),
      patches: {
        phase1_control: { path: 'control.patch', sha256: sha256(controlPatch) },
        candidate: { path: 'candidate.patch', sha256: sha256(candidatePatch) },
      },
      source_files: sourcePaths.map((sourcePath) => ({
        path: sourcePath,
        tracked: true,
        baseline_present: sourcePath !== candidateAddedPath,
      })),
      arms: {
        baseline: { patch_chain: [], tree_hash: null },
        phase1_control: { patch_chain: ['phase1_control'], tree_hash: null },
        candidate: { patch_chain: ['phase1_control', 'candidate'], tree_hash: null },
      },
      invocation_profile: cases.run_contract.invocation_profile,
      threshold_contract_hash: computeThresholdContractHash(cases),
      sessions,
    };
    const prepareRoot = path.join(runDir, '.prepare');
    const armReports = [];
    for (const arm of CONTRACT_RESET_ARMS) {
      const destination = path.join(prepareRoot, arm);
      const result = materializeArmSource({
        repoRoot,
        runDir,
        manifest,
        arm,
        destination,
        allowUnverifiedTreeHash: true,
      });
      manifest.arms[arm].tree_hash = result.tree_hash;
      armReports.push(result);
    }
    fs.rmSync(prepareRoot, { recursive: true, force: true });
    const materializationVerification = buildMaterializationVerification({ manifest, armReports });
    const materializationBytes = Buffer.from(
      `${JSON.stringify(materializationVerification, null, 2)}\n`,
      'utf8',
    );
    writePrivateFile(path.join(runDir, 'materialization-verification.json'), materializationBytes);
    manifest.materialization_verification = {
      path: 'materialization-verification.json',
      sha256: sha256(materializationBytes),
    };
    writePrivateJson(path.join(runDir, 'source-manifest.json'), manifest);
    const holdout = {
      schema_version: 'contract-reset-holdout-commitment/v1',
      artifact_type: 'degraded',
      attempt_id: manifest.attempt_id,
      commitment_status: 'unavailable',
      candidate_hash: manifest.arms.candidate.tree_hash,
      source_hash: manifest.arms.phase1_control.tree_hash,
      opaque_custody_id: null,
      bundle_hash: null,
      custodian: null,
      retention_authority: null,
      expires_at: null,
      reason_code: options.holdoutReason || 'independent_custody_boundary_unavailable',
      limitation: '当前 host 没有与实现者身份隔离的 custody primitive；未创建伪 sealed bundle。',
    };
    writePrivateJson(path.join(runDir, 'promotion-holdout-commitment.json'), holdout);
    return {
      schema_version: 'contract-reset-run-preparation/v1',
      artifact_type: 'generated',
      status: 'prepared',
      run_dir: runDir,
      run_id: manifest.run_id,
      parent_revision: parentRevision,
      source_file_count: sourcePaths.length,
      scheduled_session_count: sessions.length,
      arm_tree_hashes: Object.fromEntries(
        Object.entries(manifest.arms).map(([arm, value]) => [arm, value.tree_hash]),
      ),
      holdout_commitment_status: 'unavailable',
    };
  } catch (error) {
    fs.rmSync(runDir, { recursive: true, force: true });
    throw error;
  }
}

function buildRunFacts(manifest, armReports) {
  const reports = Array.isArray(armReports) ? armReports : [armReports];
  const invalid = reports.some((report) => report.status === 'invalid');
  const modelInvoked = reports.some((report) => report.model_invoked === true);
  const attemptedSessions = reports.filter((report) => report && report.namespace).map((report) => ({
    case_id: report.namespace.case_id,
    arm: report.namespace.arm,
    repeat: report.namespace.repeat,
    order_position: report.namespace.order_position,
    session_id: report.namespace.session_id,
    namespace_id: report.namespace.namespace_id,
    status: report.status,
    reason_code: report.reason_code,
    model_invoked: report.model_invoked === true,
  }));
  const completedSessions = reports
    .filter((report) => report && report.namespace && report.status === 'completed' && report.model_invoked === true)
    .map((report) => ({
      case_id: report.namespace.case_id,
      arm: report.namespace.arm,
      repeat: report.namespace.repeat,
      order_position: report.namespace.order_position,
      session_id: report.namespace.session_id,
      namespace_id: report.namespace.namespace_id,
      status: 'completed',
      reason_code: report.reason_code,
      model_invoked: true,
      retained_evidence: report.retained_evidence || null,
    }));
  const complete = !invalid
    && completedSessions.length === (manifest.sessions || []).length
    && completedSessions.length > 0;
  const isolationReport = reports.find((report) => report.isolation) || null;
  const isolation = isolationReport
    ? {
      artifact_type: isolationReport.isolation.artifact_type,
      status: isolationReport.isolation.status,
      primitive: isolationReport.isolation.primitive,
      probes: isolationReport.isolation.probes,
      reason_code: isolationReport.isolation.reason_code,
      exit_code: isolationReport.isolation.exit_code,
      signal: isolationReport.isolation.signal || null,
      error: isolationReport.isolation.error || null,
    }
    : {
      artifact_type: 'degraded',
      status: 'inconclusive',
      primitive: null,
      probes: {},
      reason_code: 'hard_isolation_unavailable',
    };
  const reasonCodes = new Set(reports.map((report) => report.reason_code).filter(Boolean));
  if (!complete) reasonCodes.add('model_outcomes_missing');
  if (attemptedSessions.length !== (manifest.sessions || []).length) {
    reasonCodes.add('session_execution_incomplete');
  }
  if (modelInvoked && completedSessions.some((entry) => !entry.retained_evidence)) {
    reasonCodes.add('retained_evidence_missing');
  }
  reasonCodes.add('holdout_commitment_unavailable');
  const status = invalid ? 'invalid' : (complete ? 'completed' : 'inconclusive');
  return {
    schema_version: 'contract-reset-run-facts/v1',
    artifact_type: status === 'inconclusive' ? 'degraded' : 'confirmed',
    status,
    model_invoked: modelInvoked,
    isolation,
    scheduled_session_count: (manifest.sessions || []).length,
    attempted_sessions: attemptedSessions,
    completed_sessions: completedSessions,
    sessions: manifest.sessions,
    reason_codes: [...reasonCodes].sort(),
    limitations: [
      'No model output was counted without a passed hard-isolation probe.',
      'Product quality and materiality remain reviewer/owner judgments.',
    ],
  };
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--prepare-run') args.prepareRun = true;
    else if (arg === '--probe-only') args.probeOnly = true;
    else if (arg === '--materialize-only') args.materializeOnly = true;
    else if (arg === '--json') args.json = true;
    else if (arg.startsWith('--')) {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) return { error: `missing value for ${arg}` };
      args[arg.slice(2).replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase())] = value;
      index += 1;
    } else return { error: `unknown argument: ${arg}` };
  }
  return args;
}

function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.error) {
    process.stderr.write(`${args.error}\n`);
    return 2;
  }
  try {
    let report;
    if (args.prepareRun) {
      report = prepareRun({
        repoRoot: args.repoRoot,
        runDir: args.runDir,
        casesPath: args.cases,
        candidatePatchPath: args.candidatePatch,
        runId: args.runId,
        attemptId: args.attemptId,
      });
    } else if (args.materializeOnly) {
      const manifest = JSON.parse(fs.readFileSync(args.manifest, 'utf8'));
      report = materializeArmSource({
        repoRoot: args.repoRoot,
        runDir: args.runDir,
        manifest,
        arm: args.arm,
        destination: args.destination,
      });
    } else if (args.probeOnly) {
      report = runIsolationProbe({
        namespaceRoot: args.namespaceRoot,
        controlPath: args.controlPath,
        siblingPath: args.siblingPath,
        symlinkPath: args.symlinkPath,
        absolutePath: args.absolutePath,
      });
    } else if (args.runDir && args.manifest && args.repoRoot && args.cases
      && args.caseId && args.arm && args.repeat && args.orderPosition && args.sessionId) {
      const manifest = JSON.parse(fs.readFileSync(args.manifest, 'utf8'));
      const cases = JSON.parse(fs.readFileSync(args.cases, 'utf8'));
      report = runContractResetArm({
        repoRoot: args.repoRoot,
        runDir: args.runDir,
        manifest,
        cases,
        caseId: args.caseId,
        arm: args.arm,
        repeat: Number(args.repeat),
        orderPosition: Number(args.orderPosition),
        sessionId: args.sessionId,
      });
    } else {
      throw new Error('required arm run arguments are missing');
    }
    if (args.output) {
      const outputPath = path.resolve(args.runDir || process.cwd(), args.output);
      if (!isWithinRoot(outputPath, args.runDir || process.cwd())) {
        throw new Error(`output path escapes run directory: ${args.output}`);
      }
      writePrivateJson(outputPath, report);
    }
    if (args.runFactsOutput) {
      const manifest = JSON.parse(fs.readFileSync(args.manifest, 'utf8'));
      const factsPath = path.resolve(args.runDir, args.runFactsOutput);
      if (!isWithinRoot(factsPath, args.runDir)) {
        throw new Error(`run facts path escapes run directory: ${args.runFactsOutput}`);
      }
      writePrivateJson(factsPath, buildRunFacts(manifest, [report]));
    }
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return report.status === 'invalid' ? 1 : 0;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    return 2;
  }
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  buildIsolationTargets,
  buildRunProbePaths,
  buildMaterializationVerification,
  buildRunFacts,
  computeTreeHash,
  detectIsolationPrimitive,
  main,
  materializeArmSource,
  opaqueNamespaceId,
  prepareRun,
  prepareArmNamespace,
  runIsolationProbe,
  sha256,
};
