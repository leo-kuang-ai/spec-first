'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  assertContainedPath,
  ensureContainedDirectory,
  isPathWithin,
  reasonError,
} = require('./path-safety.cjs');
const {
  renderJson,
} = require('./renderer.cjs');

const CONFIRMED_SOURCES = new Set([
  'post-mutation-probe',
  'read-only-probe',
  'confirmed-local-state',
]);
const CANONICAL_HOSTS = new Set(['claude', 'codex', 'cursor', 'kiro', 'opencode', 'qoder']);

function collectSetupFacts(options = {}) {
  const registry = options.registry || {};
  const toolResults = resultMap(options.toolResults);
  const helperResults = resultMap(options.helperResults);
  const items = [];
  const tools = {};
  const helperTools = {};

  for (const entry of registry.tools || []) {
    const item = normalizeItem(entry, toolResults.get(entry.id), entry.category || 'mcp');
    items.push(item);
    tools[item.id] = item;
  }
  for (const entry of registry.helpers || []) {
    const item = normalizeItem(entry, helperResults.get(entry.id), entry.kind || 'helper');
    items.push(item);
    helperTools[item.id] = item;
  }

  const providerReadiness = (options.providerResults || []).map(normalizeProviderResult);
  const configuredDependencies = (options.configuredDependencies || []).map(normalizeConfiguredDependency);
  const generatedAt = (options.now || new Date()).toISOString();
  const repoRoot = path.resolve(options.repoRoot || process.cwd());
  const baselineReady = items
    .filter((item) => item.required && item.baseline_blocking)
    .every((item) => item.result === 'ready');
  const requiredMcpItems = items.filter((item) => item.kind === 'mcp' && item.required);
  const hostRuntimeReady = requiredMcpItems.every((item) =>
    item.result === 'ready'
    && ['ready', 'not-applicable', 'not-required', 'fallback-active'].includes(item.configured_status)
  );

  const toolFacts = {
    schema_version: 'tool-facts.v2',
    generated_at: generatedAt,
    repo_root: repoRoot,
    host: options.host || null,
    platform: options.platform || null,
    profile: options.profile || 'minimal',
    tools,
    helper_tools: helperTools,
    provider_readiness: providerReadiness,
    items,
    configured_dependencies: configuredDependencies,
    configured_scan_status: options.configuredScanStatus || 'unknown',
    schema_capabilities: [
      'items',
      'configured_dependencies',
      'tool-existence',
      'provider-readiness-generic',
    ],
    target: options.target || null,
    source: {
      repo_status: options.repoStatus || 'git-repo',
      authority_level: 'confirmed-local-state',
      reconciliation: 'post-mutation-probe-required',
    },
  };

  const runtimeCapabilities = {
    schema_version: 'runtime-capabilities.v1',
    generated_at: generatedAt,
    repo_root: repoRoot,
    host: options.host || null,
    direct_evidence: {
      bounded_source_reads: true,
      ripgrep: options.directEvidence && typeof options.directEvidence.ripgrep === 'boolean'
        ? options.directEvidence.ripgrep
        : commandReady(items, 'rg'),
      ast_grep: commandReady(items, 'ast-grep'),
      git_diff: options.directEvidence && typeof options.directEvidence.git_diff === 'boolean'
        ? options.directEvidence.git_diff
        : options.repoStatus !== 'not-git-repo',
      tests_and_logs: true,
    },
    setup_summary: {
      baseline_ready: baselineReady,
      host_runtime_ready: hostRuntimeReady,
      generated_runtime_manifest: options.generatedRuntimeManifest || {
        status: 'unknown',
        reason_code: 'generated-runtime-manifest-not-reported',
      },
      project_local_config: options.projectConfigStatus || null,
      provider_counts: countProviders(providerReadiness),
      reason_code: 'setup-facts-ready',
    },
  };
  if (options.hostLedgerPointer) {
    runtimeCapabilities.host_ledger_pointer = options.hostLedgerPointer;
  }
  if (Object.prototype.hasOwnProperty.call(options, 'hostPointerReconciliation')) {
    runtimeCapabilities.host_pointer_reconciliation = options.hostPointerReconciliation;
  }

  return { toolFacts, runtimeCapabilities };
}

function resultMap(results) {
  return new Map((results || []).map((entry) => [entry.id, entry]));
}

function normalizeItem(entry, observed = null, kind) {
  const source = observed || {};
  const required = entry.required !== false;
  const baselineBlocking = entry.baseline_blocking === undefined
    ? required
    : entry.baseline_blocking === true;
  const confirmed = source.verified === true && CONFIRMED_SOURCES.has(source.source);
  const observedStatus = source.status || 'unknown';
  const observedDependencyStatus = source.dependency_status || null;
  const configuredStatus = source.configured_status || source.host_config_status || 'not-applicable';
  const projectStatus = source.project_status || 'not-applicable';
  const dependencyReady = confirmed && (
    observedDependencyStatus === 'ready'
    || (observedDependencyStatus === null && observedStatus === 'ready')
  );
  let result;
  let reasonCode;
  if (observedStatus === 'skipped' || source.result === 'skipped') {
    result = 'skipped';
    reasonCode = source.reason_code || 'optional-skipped';
  } else if (configuredStatus === 'action-required') {
    result = 'action-required';
    reasonCode = source.reason_code || 'host-config-action-required';
  } else if (configuredStatus === 'precedence-blocked') {
    result = 'action-required';
    reasonCode = source.reason_code || 'host-config-precedence-blocked';
  } else if (configuredStatus === 'registry-args-drift') {
    result = 'degraded';
    reasonCode = 'host-config-version-drift';
  } else if (projectStatus === 'pending') {
    result = 'action-required';
    reasonCode = 'project-bootstrap-pending';
  } else if (projectStatus === 'failed') {
    result = 'action-required';
    reasonCode = 'project-bootstrap-failed';
  } else if (observedStatus === 'degraded') {
    result = 'degraded';
    reasonCode = source.reason_code || (baselineBlocking ? 'baseline-degraded' : 'optional-capability-degraded');
  } else if (dependencyReady) {
    result = 'ready';
    reasonCode = 'ready';
  } else if (observedStatus === 'ready') {
    result = 'degraded';
    reasonCode = 'unconfirmed-probe';
  } else if (observedStatus === 'missing' || observedStatus === 'failed' || observedStatus === 'blocked') {
    result = baselineBlocking ? 'action-required' : 'degraded';
    reasonCode = source.reason_code || (observedStatus === 'missing' ? 'missing_dependency' : `${observedStatus}-probe`);
  } else {
    result = baselineBlocking ? 'action-required' : 'degraded';
    reasonCode = source.reason_code || 'probe-not-run';
  }
  const installed = dependencyReady;
  return {
    ...source,
    id: entry.id,
    kind,
    profile: normalizeProfile(source.profile || entry.profile || firstProfile(entry.profiles)),
    required,
    setup_required: entry.setup_required === true,
    baseline_blocking: baselineBlocking,
    dependency_status: installed
      ? 'ready'
      : (observedDependencyStatus || (observedStatus === 'missing' ? 'missing' : 'unknown')),
    configured_status: configuredStatus,
    project_status: projectStatus,
    result,
    reason_code: reasonCode,
    installed,
    missing_dependency_reason: installed ? null : (source.missing_dependency_reason || reasonCode),
    next_action: source.next_action || installNextAction(entry),
    verification_source: confirmed ? source.source : null,
  };
}

function firstProfile(profiles) {
  if (!Array.isArray(profiles)) return 'minimal';
  return profiles.find((entry) => ['minimal', 'recommended', 'platform'].includes(entry)) || 'minimal';
}

function normalizeProfile(profile) {
  return ['minimal', 'recommended', 'platform'].includes(profile) ? profile : 'minimal';
}

function installNextAction(entry) {
  return entry.installation && entry.installation.next_action
    ? entry.installation.next_action
    : '';
}

function normalizeProviderResult(result) {
  const envelope = result && typeof result === 'object' ? result : {};
  const source = envelope.readiness && typeof envelope.readiness === 'object'
    ? envelope.readiness
    : envelope;
  const confirmed = envelope.verified === true && CONFIRMED_SOURCES.has(envelope.source);
  const readinessStatus = source.readiness_status === 'fresh' && !confirmed
    ? 'unknown'
    : (source.readiness_status || 'unknown');
  return {
    ...source,
    readiness_status: readinessStatus,
    limitations: source.readiness_status === 'fresh' && !confirmed
      ? [...(source.limitations || []), '该 probe 未经确认，因此未将 fresh readiness 提升为已确认状态。']
      : (source.limitations || []),
  };
}

function normalizeConfiguredDependency(entry) {
  const source = entry && typeof entry === 'object' ? entry : {};
  return {
    id: source.id || 'unknown',
    kind: source.kind || 'configured-command',
    source_path: source.source_path || '',
    command: source.command || '',
    args_shape: source.args_shape || '',
    declared_tool_id: source.declared_tool_id || null,
    declared_status: source.declared_status || 'unknown',
    dependency_status: source.dependency_status || 'unknown',
    configured_status: source.configured_status || 'not-checked',
    result: source.result || 'unknown',
    reason_code: source.reason_code || 'configured-dependency-unknown',
  };
}

function commandReady(items, id) {
  const item = items.find((entry) => entry.id === id);
  return item ? item.result === 'ready' : false;
}

function countProviders(items) {
  const counts = { fresh: 0, stale: 0, degraded: 0, unknown: 0, total: items.length };
  for (const item of items) {
    const key = Object.prototype.hasOwnProperty.call(counts, item.readiness_status)
      ? item.readiness_status
      : 'unknown';
    counts[key] += 1;
  }
  return counts;
}

function prepareHostReadinessLedger({
  repoRoot,
  homeDir,
  host,
  toolFacts = {},
  runtimeCapabilities = {},
  target,
  previousRuntimeCapabilities,
  now = new Date(),
} = {}) {
  if (!CANONICAL_HOSTS.has(host)) {
    throw reasonError('host-readiness-ledger-host-unsupported', `不支持的 setup host：${host || 'missing'}`);
  }
  const root = path.resolve(repoRoot || toolFacts.repo_root || runtimeCapabilities.repo_root || process.cwd());
  const home = path.resolve(homeDir || os.homedir());
  const ledgerPath = resolveHostReadinessLedgerPath({ homeDir: home, host });
  const generatedAt = runtimeCapabilities.generated_at || toolFacts.generated_at || now.toISOString();
  const resolvedTarget = target || toolFacts.target || null;
  const previousRuntime = previousRuntimeCapabilities === undefined
    ? readPreviousRuntimeCapabilities(root)
    : previousRuntimeCapabilities;
  const hostLedgerPointer = {
    host,
    path: ledgerPath,
    schema_version: 'v2',
  };
  const hostPointerReconciliation = buildHostPointerReconciliation({
    previousRuntimeCapabilities: previousRuntime,
    host,
    ledgerPath,
    now,
  });
  const setupSummary = {
    ...(runtimeCapabilities.setup_summary || {}),
    reason_code: 'setup-facts-ready',
  };
  const preparedRuntimeCapabilities = {
    ...runtimeCapabilities,
    setup_summary: setupSummary,
    host_ledger_pointer: hostLedgerPointer,
    host_pointer_reconciliation: hostPointerReconciliation,
  };
  const manifest = setupSummary.generated_runtime_manifest || {
    status: 'unknown',
    reason_code: 'generated-runtime-manifest-not-reported',
  };
  const manifestActionRequired = ['stale', 'missing'].includes(manifest.status);
  const targetReasonCode = resolvedTarget && typeof resolvedTarget.reason_code === 'string'
    ? resolvedTarget.reason_code
    : '';
  const reasonCode = manifestActionRequired
    ? 'generated-runtime-manifest-refresh-required'
    : targetReasonCode;
  const nextActions = collectLedgerNextActions(toolFacts, manifest);
  const factsPath = path.join(root, '.spec-first', 'config', 'tool-facts.json');
  const runtimePath = path.join(root, '.spec-first', 'config', 'runtime-capabilities.json');
  const hostLedger = {
    schema_version: 'v2',
    host,
    platform: toolFacts.platform || null,
    repo_root: root,
    repo_status: toolFacts.source && toolFacts.source.repo_status
      ? toolFacts.source.repo_status
      : 'git-repo',
    target: resolvedTarget,
    target_mode: resolvedTarget && resolvedTarget.mode ? resolvedTarget.mode : '',
    target_kind: resolvedTarget && resolvedTarget.target_kind ? resolvedTarget.target_kind : '',
    workspace_root: resolvedTarget && resolvedTarget.workspace_root ? resolvedTarget.workspace_root : null,
    selected_repo_root: resolvedTarget && resolvedTarget.selected_repo_root
      ? resolvedTarget.selected_repo_root
      : null,
    selected_folder_root: resolvedTarget && resolvedTarget.selected_folder_root
      ? resolvedTarget.selected_folder_root
      : null,
    target_root: resolvedTarget && resolvedTarget.target_root ? resolvedTarget.target_root : root,
    parent_workspace_advisory: parentWorkspaceAdvisory(resolvedTarget),
    target_candidate_count: resolvedTarget && Array.isArray(resolvedTarget.candidates)
      ? resolvedTarget.candidates.length
      : 0,
    target_candidates: resolvedTarget && Array.isArray(resolvedTarget.candidates)
      ? resolvedTarget.candidates
      : [],
    reason_code: reasonCode,
    host_ledger_pointer: hostLedgerPointer,
    host_pointer_reconciliation: hostPointerReconciliation,
    generated_runtime_manifest: manifest,
    tool_facts_status: 'ready',
    tool_facts_path: factsPath,
    runtime_capabilities_status: 'ready',
    runtime_capabilities_path: runtimePath,
    overall_status: setupSummary.baseline_ready === true && !manifestActionRequired
      ? 'ready'
      : 'action-required',
    baseline_ready: setupSummary.baseline_ready === true,
    host_runtime_ready: setupSummary.host_runtime_ready === true && !manifestActionRequired,
    completed_at: generatedAt,
    tools: toolFacts.tools || {},
    helper_tools: toolFacts.helper_tools || {},
    provider_readiness: toolFacts.provider_readiness || [],
    configured_dependencies: toolFacts.configured_dependencies || [],
    project_local_config: setupSummary.project_local_config || null,
    scenario_fingerprint_setup: preparedRuntimeCapabilities.scenario_fingerprint_setup || null,
    next_actions: nextActions,
  };
  return {
    hostLedgerPath: ledgerPath,
    hostLedger,
    hostLedgerPointer,
    hostPointerReconciliation,
    runtimeCapabilities: preparedRuntimeCapabilities,
  };
}

function resolveHostReadinessLedgerPath({ homeDir, host } = {}) {
  if (!CANONICAL_HOSTS.has(host)) {
    throw reasonError('host-readiness-ledger-host-unsupported', `不支持的 setup host：${host || 'missing'}`);
  }
  return path.join(path.resolve(homeDir || os.homedir()), `.${host}`, 'spec-first', 'host-setup.json');
}

function buildHostPointerReconciliation({
  previousRuntimeCapabilities,
  host,
  ledgerPath,
  now = new Date(),
} = {}) {
  const pointer = previousRuntimeCapabilities
    && previousRuntimeCapabilities.host_ledger_pointer
    && typeof previousRuntimeCapabilities.host_ledger_pointer === 'object'
    ? previousRuntimeCapabilities.host_ledger_pointer
    : null;
  const previousHost = pointer && typeof pointer.host === 'string' ? pointer.host : '';
  if (!previousHost || previousHost === host) return null;
  return {
    schema_version: 'host-pointer-reconciliation.v1',
    from_host: previousHost,
    to_host: host,
    from_marker_path: typeof pointer.path === 'string' ? pointer.path : '',
    to_marker_path: ledgerPath,
    reconciled_at: now.toISOString(),
    reason: '检测到上一次 setup 的 host marker 与当前 host authority 不一致',
  };
}

function readPreviousRuntimeCapabilities(repoRoot) {
  const runtimePath = path.join(repoRoot, '.spec-first', 'config', 'runtime-capabilities.json');
  try {
    assertContainedPath(repoRoot, runtimePath, { reasonCode: 'setup-facts-symlink-escape' });
  } catch (_error) {
    return null;
  }
  if (!fs.existsSync(runtimePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(runtimePath, 'utf8'));
  } catch (_error) {
    return null;
  }
}

function parentWorkspaceAdvisory(target) {
  if (!target || typeof target !== 'object') return null;
  const gitHealth = target.git_health || null;
  const gitStatus = gitHealth && gitHealth.status ? gitHealth.status : '';
  return {
    git_health: gitHealth,
    coverage_gap: target.coverage_gap || null,
    candidates_diagnostics: target.candidates_diagnostics || [],
    repair_action_available: gitStatus === 'broken-worktree',
    repair_command: gitStatus === 'broken-worktree' ? 'spec-first repair-worktree --dry-run' : null,
    diagnostic_action_available: gitStatus === 'corrupted-gitdir',
    diagnostic_command: gitStatus === 'corrupted-gitdir' ? 'git fsck' : null,
  };
}

function collectLedgerNextActions(toolFacts, manifest) {
  const actions = [];
  for (const item of toolFacts.items || []) {
    if (item.result !== 'ready' && item.next_action) actions.push(item.next_action);
  }
  for (const provider of toolFacts.provider_readiness || []) {
    for (const action of provider.next_actions || []) {
      if (action) actions.push(action);
    }
  }
  if (['stale', 'missing'].includes(manifest.status) && manifest.next_action) {
    actions.push(manifest.next_action);
  }
  return [...new Set(actions)];
}

function writeHostReadinessLedger({ homeDir, host, hostLedger, writer } = {}) {
  const home = path.resolve(homeDir || os.homedir());
  const ledgerPath = resolveHostReadinessLedgerPath({ homeDir: home, host });
  const write = writer || ((filePath, payload) => atomicWriteContained(home, filePath, payload, {
    reasonCode: 'host-readiness-ledger-symlink-escape',
  }));
  let previous = null;
  // `previous === null` also means "the ledger did not exist", so it cannot double as "no backup
  // taken yet". Track the capture explicitly: containment and payload validation throw before the
  // backup exists, and rolling back then would delete an existing ledger that was never written.
  let backupCaptured = false;
  try {
    assertContainedPath(home, ledgerPath, { reasonCode: 'host-readiness-ledger-symlink-escape' });
    if (!hostLedger || hostLedger.schema_version !== 'v2' || hostLedger.host !== host) {
      throw reasonError('host-readiness-ledger-invalid', 'Host readiness ledger payload 与所选 host 不匹配。');
    }
    previous = fs.existsSync(ledgerPath) ? fs.readFileSync(ledgerPath) : null;
    backupCaptured = true;
    write(ledgerPath, renderJson(hostLedger));
    return {
      status: 'ready',
      reason_code: 'host-readiness-ledger-written',
      complete: true,
      artifact_ref: ledgerPath,
    };
  } catch (error) {
    if (!writer && backupCaptured) {
      try {
        if (previous === null) fs.rmSync(ledgerPath, { force: true });
        else atomicWriteContained(home, ledgerPath, previous, {
          reasonCode: 'host-readiness-ledger-symlink-escape',
        });
      } catch (_restoreError) {
        // 恢复仅提供 best-effort 证据；失败结果仍是权威结果。
      }
    }
    return {
      status: 'failed',
      reason_code: 'host-readiness-ledger-write-failed',
      complete: false,
      artifact_ref: ledgerPath,
      diagnostic: String(error && error.message ? error.message : error).slice(0, 2000),
    };
  }
}

function writeSetupFacts({ repoRoot, toolFacts, runtimeCapabilities, writer } = {}) {
  const root = path.resolve(repoRoot || process.cwd());
  const configDir = path.join(root, '.spec-first', 'config');
  const toolFactsPath = path.join(configDir, 'tool-facts.json');
  const runtimePath = path.join(configDir, 'runtime-capabilities.json');
  const write = writer || ((filePath, payload) => atomicWriteContained(root, filePath, payload));
  const backups = new Map([
    [toolFactsPath, fs.existsSync(toolFactsPath) ? fs.readFileSync(toolFactsPath) : null],
    [runtimePath, fs.existsSync(runtimePath) ? fs.readFileSync(runtimePath) : null],
  ]);
  try {
    write(toolFactsPath, renderJson(toolFacts));
    write(runtimePath, renderJson(runtimeCapabilities));
    return {
      status: 'ready',
      reason_code: 'setup-facts-written',
      complete: true,
      artifact_refs: [toolFactsPath, runtimePath],
    };
  } catch (error) {
    if (!writer) restoreFiles(root, backups);
    return {
      status: 'failed',
      reason_code: 'setup-facts-write-failed',
      complete: false,
      artifact_refs: [toolFactsPath, runtimePath],
      diagnostic: String(error && error.message ? error.message : error).slice(0, 2000),
    };
  }
}

function atomicWriteContained(root, filePath, contents, options = {}) {
  const reasonCode = options.reasonCode || 'setup-facts-symlink-escape';
  const target = assertContainedPath(root, filePath, { reasonCode });
  const directory = ensureContainedDirectory(root, path.dirname(target), {
    reasonCode,
    mode: 0o700,
  });
  const mode = fs.existsSync(target) ? (fs.statSync(target).mode & 0o777) : 0o600;
  const tempPath = path.join(directory, `.${path.basename(target)}.${process.pid}.${crypto.randomBytes(6).toString('hex')}.tmp`);
  assertContainedPath(root, tempPath, { reasonCode });
  try {
    fs.writeFileSync(tempPath, contents, { encoding: 'utf8', mode });
    fs.chmodSync(tempPath, mode);
    assertContainedPath(root, target, { reasonCode });
    fs.renameSync(tempPath, target);
    fs.chmodSync(target, mode);
  } catch (error) {
    try { fs.rmSync(tempPath, { force: true }); } catch (_cleanupError) { /* 保留主错误 */ }
    throw error;
  }
}

function restoreFiles(root, backups) {
  for (const [filePath, contents] of backups.entries()) {
    try {
      if (contents === null) fs.rmSync(filePath, { force: true });
      else atomicWriteContained(root, filePath, contents);
    } catch (_error) {
      // 恢复仅提供 best-effort 证据；调用方仍会收到失败结果。
    }
  }
}

function readSetupSnapshot({ repoRoot } = {}) {
  const root = repoRoot ? path.resolve(repoRoot) : null;
  if (!root) return emptySnapshot('not-inside-git-repo');
  const factsPath = path.join(root, '.spec-first', 'config', 'tool-facts.json');
  const runtimePath = path.join(root, '.spec-first', 'config', 'runtime-capabilities.json');
  const facts = readJsonState(factsPath, 'setup-facts');
  const runtime = readJsonState(runtimePath, 'runtime-capabilities');
  const setupSummary = runtime.value && runtime.value.setup_summary && typeof runtime.value.setup_summary === 'object'
    ? runtime.value.setup_summary
    : {};
  return {
    schema_version: 'spec-runtime-setup-diagnostic-snapshot.v1',
    setup_facts_status: facts.status,
    setup_facts_reason_code: facts.reason_code,
    setup_facts_path: factsPath,
    runtime_capabilities_status: runtime.status,
    runtime_capabilities_reason_code: runtime.reason_code,
    runtime_capabilities_path: runtimePath,
    generated_at: facts.value ? facts.value.generated_at || null : null,
    generated_runtime_manifest: setupSummary.generated_runtime_manifest || {
      status: 'unknown',
      reason_code: runtime.status === 'missing'
        ? 'runtime-capabilities-missing'
        : 'generated-runtime-manifest-not-reported',
      next_action: 'spec-runtime-setup --verify-only',
    },
    baseline_ready: Object.prototype.hasOwnProperty.call(setupSummary, 'baseline_ready')
      ? setupSummary.baseline_ready
      : null,
    host_runtime_ready: Object.prototype.hasOwnProperty.call(setupSummary, 'host_runtime_ready')
      ? setupSummary.host_runtime_ready
      : null,
    provider_readiness: facts.value && Array.isArray(facts.value.provider_readiness)
      ? facts.value.provider_readiness
      : [],
    configured_dependencies: facts.value && Array.isArray(facts.value.configured_dependencies)
      ? facts.value.configured_dependencies
      : [],
  };
}

function readJsonState(filePath, artifactKind) {
  if (!fs.existsSync(filePath)) {
    return { status: 'missing', reason_code: `${artifactKind}-missing`, value: null };
  }
  try {
    return {
      status: 'ready',
      reason_code: `${artifactKind}-present`,
      value: JSON.parse(fs.readFileSync(filePath, 'utf8')),
    };
  } catch (error) {
    return {
      status: 'error',
      reason_code: `${artifactKind}-unreadable`,
      value: null,
      diagnostic: error.message,
    };
  }
}

function emptySnapshot(reasonCode) {
  return {
    schema_version: 'spec-runtime-setup-diagnostic-snapshot.v1',
    setup_facts_status: 'skip',
    setup_facts_reason_code: reasonCode,
    generated_runtime_manifest: { status: 'unknown', reason_code: reasonCode },
    baseline_ready: null,
    host_runtime_ready: null,
    provider_readiness: [],
    configured_dependencies: [],
  };
}

function buildParentArtifactQuarantine({
  workspaceRoot,
  indicators,
  homeDir = os.homedir(),
  now = new Date(),
} = {}) {
  const root = path.resolve(workspaceRoot || process.cwd());
  const explicitIndicators = Array.isArray(indicators) ? indicators : null;
  const normalized = explicitIndicators
    ? explicitIndicators.map((entry) => normalizeQuarantineIndicator(root, entry))
    : [
      inspectParentArtifact({
        root,
        relativePath: '.spec-first/config/tool-facts.json',
        defaultReason: 'parent-workspace-must-not-have-repo-local-setup-artifact',
        homeDir,
      }),
      inspectParentArtifact({
        root,
        relativePath: '.spec-first/config/runtime-capabilities.json',
        defaultReason: 'parent-workspace-must-not-have-repo-local-setup-artifact',
        homeDir,
      }),
    ].filter(Boolean);
  return {
    schema_version: 'parent-artifact-quarantine.v1',
    topology: 'multi-repo-workspace',
    advisory: true,
    authority_level: 'advisory',
    freshness: 'generated',
    generated_at: now.toISOString(),
    generated_by: 'spec-runtime-setup',
    consumers: [
      'spec-first clean --workspace-orphans',
      'LLM workflow 的 degraded-evidence 判断',
    ],
    quarantined_paths: normalized,
  };
}

function normalizeQuarantineIndicator(root, entry) {
  const source = entry && typeof entry === 'object' ? entry : { path: entry };
  const value = String(source.path || '');
  const absolute = path.resolve(root, value);
  const relative = isPathWithin(absolute, root)
    ? path.relative(root, absolute).split(path.sep).join('/')
    : value;
  return {
    path: relative,
    reason_code: source.reason_code || 'parent-repo-local-artifact',
    stale_indicator: source.stale_indicator || null,
    last_generated_at: source.last_generated_at || null,
    fingerprint_origin: source.fingerprint_origin || null,
  };
}

function inspectParentArtifact({ root, relativePath, defaultReason, homeDir }) {
  const artifactPath = path.join(root, relativePath);
  try {
    assertContainedPath(root, artifactPath, { reasonCode: 'workspace-summary-symlink-escape' });
  } catch (_error) {
    return {
      path: relativePath,
      reason_code: 'parent-artifact-symlink-escape',
      stale_indicator: relativePath,
      last_generated_at: null,
      fingerprint_origin: null,
    };
  }
  if (!fs.existsSync(artifactPath)) return null;

  let artifact = {};
  try {
    artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  } catch (_error) {
    // 只要存在即可进入 quarantine；无法读取的 metadata 保持 unknown。
  }
  const repoRoot = typeof artifact.repo_root === 'string' ? artifact.repo_root : '';
  const generatedAt = typeof artifact.generated_at === 'string' ? artifact.generated_at : null;
  const pointerPath = artifact.host_ledger_pointer
    && typeof artifact.host_ledger_pointer.path === 'string'
    ? artifact.host_ledger_pointer.path
    : '';
  let reasonCode = defaultReason;
  let staleIndicator = 'parent-workspace-repo-local-artifact-present';
  let fingerprintOrigin = repoRoot || null;

  if (isForeignAbsoluteStatFailure(repoRoot, homeDir)) {
    reasonCode = 'foreign-absolute-path-stat-failed';
    staleIndicator = repoRoot;
  } else if (isForeignAbsoluteStatFailure(pointerPath, homeDir)) {
    reasonCode = 'foreign-absolute-path-stat-failed';
    staleIndicator = pointerPath;
    fingerprintOrigin = pointerPath;
  } else if (repoRoot && path.resolve(repoRoot) !== root) {
    reasonCode = 'repo_root-mismatches-workspace-root';
    staleIndicator = repoRoot;
  }

  return {
    path: relativePath,
    reason_code: reasonCode,
    stale_indicator: staleIndicator,
    last_generated_at: generatedAt,
    fingerprint_origin: fingerprintOrigin,
  };
}

function isForeignAbsoluteStatFailure(candidate, homeDir) {
  if (!candidate || !path.isAbsolute(candidate) || fs.existsSync(candidate)) return false;
  const home = homeDir ? path.resolve(homeDir) : null;
  return !home || !isPathWithin(path.resolve(candidate), home);
}

module.exports = {
  buildParentArtifactQuarantine,
  collectSetupFacts,
  prepareHostReadinessLedger,
  readSetupSnapshot,
  writeHostReadinessLedger,
  writeSetupFacts,
};
