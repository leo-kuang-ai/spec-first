
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const {
  buildFilteredAssetSet,
  inspectInstalledAssets,
  listBundledAgentSupportFiles,
  listBundledAgents,
  listBundledSkills,
  loadPluginManifest,
  planBundledAssetSync,
} = require('../plugin');
const {
  getGlobalDeveloperPath,
  readDeveloperFile,
  resolveChangelogAuthor,
  resolveDeveloperIdentity,
} = require('../developer');
const {
  buildFileWriteOperation,
  buildState,
  isLegacyManagedState,
  mergeOperationPlans,
  planCommandNamespacePrune,
  planHardResetManagedAssets,
  planObsoleteManagedAssetRemoval,
  planRetiredRuntimeAssetPrune,
  readState,
  readStateFileRaw,
  summarizeOperationPlan,
} = require('../state');
const { planRuntimeUntrack } = require('../runtime-untrack');
const { detectGlobalCodexHookPollution } = require('../adapters/codex');
const { applyManagedBlock, buildManagedBlock } = require('../lang-policy');
const { removeManagedCodingGuidelinesBlock } = require('../coding-guidelines');
const { buildInitialChangelog, formatChangelogTimestamp } = require('../changelog');
const { applySpecFirstGitignoreBlock } = require('../gitignore-policy');
const {
  inspectInstructionBootstrap,
  removeManagedBootstrapBlock,
} = require('../instruction-bootstrap');
const { removeManagedRuntimeToolsBlock } = require('../runtime-tools-index');
const {
  getClaudeSettingsPath,
  inspectManagedClaudeHooks,
  renderManagedClaudeHooksUpsert,
  validateClaudeSettingsFile,
} = require('../claude-settings');
const { resolveSelectedHosts } = require('./init-args');
const { canonicalizeExistingPath } = require('./init-paths');
const { buildRuntimeUntrackSummary } = require('./init-result');

function buildProjectInitPlan({
  projectRoot,
  platform,
  adapter,
  name = '',
  user = '',
  lang = '',
  platforms = [],
  gitRootTopology = 'single-repo',
  dryRun = false,
  globalProfileConfirmed = false,
}) {
  const normalizedRoot = canonicalizeExistingPath(projectRoot);
  const errors = [];
  const diagnostics = [];
  const bundledAgentPaths = listBundledAgents();
  const bundledAgentSupportFiles = listBundledAgentSupportFiles();

  if (platform === 'claude') {
    const duplicateBareNames = findDuplicateClaudeAgentNames(bundledAgentPaths);
    if (duplicateBareNames.length > 0) {
      errors.push({
        code: 'duplicate_claude_agent_names',
        message: `Error: Claude runtime requires unique bare agent names, but found duplicates: ${duplicateBareNames.join(', ')}`,
      });
      return buildErroredProjectInitPlan({
        projectRoot: normalizedRoot,
        platform,
        adapter,
        dryRun,
        gitRootTopology,
        errors,
        diagnostics,
      });
    }
  }
  if (platform === 'cursor') {
    diagnostics.push({
      level: 'warn',
      code: 'cursor_generated_runtime_preview',
      message: 'Warning: Cursor support is generated-runtime preview. Local Cursor skill discovery/invocation is not verified on this machine, so generated skills may not load.',
    });
  }

  const commandDir = adapter.hasCommands ? path.join(normalizedRoot, adapter.commandRoot) : '';
  let previousState = null;
  let legacyStateDetected = false;
  let rawManagedState = null;
  let destructiveResetPlan = null;
  let destructiveResetReason = '';
  try {
    previousState = readState(normalizedRoot, adapter);
  } catch (error) {
    rawManagedState = tryReadRawManagedState(normalizedRoot, adapter);
    if (isLegacyManagedState(rawManagedState)) {
      legacyStateDetected = true;
    } else {
      diagnostics.push({
        level: 'warn',
        code: 'managed_state_unreadable',
        message: `Warning: could not read existing spec-first state; continuing with a fresh sync. (${error instanceof Error ? error.message : String(error)})`,
      });
    }
  }
  const manifest = loadPluginManifest();
  const filteredAssetSet = buildFilteredAssetSet(adapter.id);
  const runtimeCommands = adapter.hasCommands
    ? filteredAssetSet.commands.map((command) => ({
      ...command,
      filename: adapter.commandFilename(command),
    }))
    : [];
  let developer;
  try {
    developer = resolveDeveloperIdentity(normalizedRoot, {
      user: user || name,
      lang,
    });
    // 持久化用户本次勾选的 host 列表(数据源是勾选列表,非磁盘 runtime 状态,R2)。
    developer = { ...developer, hosts: resolveSelectedHosts(platforms) };
  } catch (error) {
    errors.push({
      code: 'developer_identity_unresolved',
      message: error instanceof Error ? error.message : String(error),
    });
    return buildErroredProjectInitPlan({
      projectRoot: normalizedRoot,
      platform,
      adapter,
      dryRun,
      gitRootTopology,
      errors,
      diagnostics,
    });
  }

  const commandSkillNames = new Set(manifest.commands.map((cmd) => cmd.skill));
  const assetSync = planBundledAssetSync(normalizedRoot, adapter, filteredAssetSet);
  const runtimeSyncPlan = adapter.planRuntimeFilesSync(normalizedRoot, { manifest, filteredAssetSet });
  if (runtimeSyncPlan && runtimeSyncPlan.skippedHookWrite) {
    diagnostics.push({
      level: 'warn',
      code: 'codex_home_hook_write_skipped',
      message: 'This directory\'s .codex is the Codex global hook location (CODEX_HOME). '
        + 'Skipping SessionStart hook install here to avoid double-injecting into every project. '
        + 'skills/AGENTS.md were still installed. Run init inside an actual project to install the project hook.',
    });
  } else if (platform === 'codex') {
    // High-touch existing-pollution bridge (U2b): a normal project init is a frequent action,
    // so surface a pre-existing global SessionStart pollution here instead of waiting for the
    // user to remember to run doctor. Read-only advisory; never auto-deletes.
    try {
      const pollution = detectGlobalCodexHookPollution();
      if (pollution && pollution.polluted) {
        diagnostics.push({
          level: 'warn',
          code: 'codex_global_hook_pollution_detected',
          message: `A spec-first SessionStart hook exists in the Codex global hook location (${pollution.hooksJsonPath}); `
            + 'it double-injects into every project. Run `spec-first doctor --codex` for details, or remove that entry / '
            + `run \`spec-first clean --codex\` in ${pollution.codexHome}.`,
        });
      }
    } catch {
      // Advisory only; never block init on detection failure.
    }
  }
  const previewState = buildState(manifest.version, {
    ...assetSync.syncedAssets,
    platform,
  });

  if (platform === 'claude') {
    try {
      validateClaudeSettingsFile(normalizedRoot);
    } catch (error) {
      errors.push({
        code: 'invalid_claude_settings_json',
        message: `Could not read Claude settings before init. ${error instanceof Error ? error.message : String(error)}`,
      });
      errors.push({
        code: 'invalid_claude_settings_fix',
        message: 'Fix `.claude/settings.json` so it contains valid JSON, then rerun `spec-first init` and choose Claude Code when prompted.',
      });
      return buildErroredProjectInitPlan({
        projectRoot: normalizedRoot,
        platform,
        adapter,
        dryRun,
        gitRootTopology,
        errors,
        diagnostics,
      });
    }
  }

  if (legacyStateDetected) {
    diagnostics.push({
      level: 'warn',
      code: 'legacy_state_detected',
      message: 'Detected legacy spec-first state; performing managed hard reset before re-init.',
    });
    const legacyResetState = buildLegacyHardResetState({
      adapter,
      rawManagedState,
      runtimeCommands,
      bundledSkillNames: listBundledSkills(),
      commandSkillNames: [...commandSkillNames],
      bundledAgentPaths,
      bundledAgentSupportFiles,
    });
    destructiveResetPlan = planHardResetManagedAssets(normalizedRoot, legacyResetState, adapter);
    destructiveResetReason = 'legacy_state_detected';
    previousState = null;
  } else if (previousState) {
    const currentRuntimeDrift = inspectCurrentRuntimeDrift(normalizedRoot, adapter);
    if (currentRuntimeDrift.detected) {
      diagnostics.push({
        level: 'warn',
        code: 'current_runtime_drift',
        message: `Detected current spec-first runtime drift; performing managed hard reset before re-init. (${currentRuntimeDrift.reasons.join(', ')})`,
        reasons: currentRuntimeDrift.reasons,
      });
      destructiveResetPlan = planHardResetManagedAssets(normalizedRoot, previousState, adapter);
      destructiveResetReason = 'current_runtime_drift';
      previousState = null;
    }
  }

  const preSyncPlan = mergeOperationPlans(
    planObsoleteManagedAssetRemoval(normalizedRoot, previousState, previewState, adapter),
    planCommandNamespacePrune(normalizedRoot, previewState.commands, adapter),
    planRetiredRuntimeAssetPrune(normalizedRoot, adapter),
    planLegacyDeveloperProfileCleanup(normalizedRoot),
  );
  const initWritePlan = buildInitWritePlan({
    projectRoot: normalizedRoot,
    adapter,
    developer,
    nextState: previewState,
    platform,
    assetPlan: assetSync.plan,
    runtimePlan: runtimeSyncPlan,
    gitRootTopology,
  });

  const operationPlan = mergeOperationPlans(destructiveResetPlan, preSyncPlan, initWritePlan.plan);
  const globalDeveloperWrite = resolveGlobalDeveloperWriteAction(developer, {
    explicitName: !!user || !!name,
    explicitLang: !!lang,
    confirmedOverwrite: !!globalProfileConfirmed,
  });
  return {
    schema_version: 'spec-first-init-plan.v1',
    mode: 'single-repo',
    projectRoot: normalizedRoot,
    platform,
    gitRootTopology,
    dryRun: Boolean(dryRun),
    adapterId: adapter.id,
    commandDir,
    developer,
    previousState,
    previewState,
    destructiveResetPlan,
    destructiveResetReason,
    legacyStateDetected,
    preSyncPlan,
    writePlan: initWritePlan.plan,
    operationPlan,
    untrackDiagnostic: initWritePlan.untrackDiagnostic,
    syncedAssets: assetSync.syncedAssets,
    changelogCreated: !fs.existsSync(path.join(normalizedRoot, 'CHANGELOG.md')),
    diagnostics,
    errors,
    summary: operationPlan.summary,
    globalDeveloperWrite,
  };
}

function buildErroredProjectInitPlan({
  projectRoot,
  platform,
  adapter,
  dryRun = false,
  gitRootTopology = 'single-repo',
  errors = [],
  diagnostics = [],
}) {
  const emptyPlan = mergeOperationPlans();
  return {
    schema_version: 'spec-first-init-plan.v1',
    mode: 'single-repo',
    projectRoot,
    platform,
    gitRootTopology,
    dryRun: Boolean(dryRun),
    adapterId: adapter.id,
    commandDir: adapter.hasCommands ? path.join(projectRoot, adapter.commandRoot) : '',
    developer: null,
    previousState: null,
    previewState: null,
    destructiveResetPlan: null,
    destructiveResetReason: '',
    legacyStateDetected: false,
    preSyncPlan: emptyPlan,
    writePlan: emptyPlan,
    operationPlan: emptyPlan,
    untrackDiagnostic: buildRuntimeUntrackSummary(),
    syncedAssets: {
      commands: [],
      skills: [],
      workflowSkills: [],
      internalSkills: [],
      agents: [],
      agentSupportFiles: [],
    },
    changelogCreated: false,
    diagnostics,
    errors,
    summary: emptyPlan.summary,
  };
}

function tryReadRawManagedState(projectRoot, adapter) {
  try {
    return readStateFileRaw(projectRoot, adapter);
  } catch (_error) {
    return null;
  }
}

function inspectCurrentRuntimeDrift(projectRoot, adapter) {
  const reasons = [];
  const installedAssets = inspectInstalledAssets(projectRoot, adapter);
  for (const key of ['commands', 'skills', 'agents', 'agentSupportFiles']) {
    const status = installedAssets[key] || {};
    if (Array.isArray(status.missing) && status.missing.length > 0) {
      reasons.push(`${key}_missing`);
    }
    if (Array.isArray(status.drifted) && status.drifted.length > 0) {
      reasons.push(`${key}_drifted`);
    }
  }

  const bootstrapStatus = inspectInstructionBootstrap(projectRoot, adapter);
  if (bootstrapStatus.status !== 'installed') {
    reasons.push(`bootstrap_${bootstrapStatus.status}`);
  }

  for (const check of adapter.inspectRuntimeFiles(projectRoot)) {
    if (check.level !== 'PASS' && !(check.degradedByDesign === true && check.drift === false)) {
      reasons.push(`runtime_file_${String(check.name || 'unknown').replace(/[^a-z0-9]+/gi, '_').toLowerCase()}`);
    }
  }

  if (adapter.id === 'claude') {
    for (const settingsStatus of inspectManagedClaudeHooks(projectRoot)) {
      if (settingsStatus.status !== 'installed') {
        const eventName = String(settingsStatus.eventName || 'unknown')
          .replace(/[^a-z0-9]+/gi, '_')
          .toLowerCase();
        reasons.push(`claude_settings_${eventName}_${settingsStatus.status}`);
      }
    }
  }

  return {
    detected: reasons.length > 0,
    reasons: [...new Set(reasons)],
  };
}

function buildLegacyHardResetState({
  adapter,
  rawManagedState,
  runtimeCommands,
  bundledSkillNames,
  commandSkillNames,
  bundledAgentPaths,
  bundledAgentSupportFiles,
}) {
  const rawState = rawManagedState && typeof rawManagedState === 'object' ? rawManagedState : {};
  const legacyTrackedSkills = mergeStringArrays(rawState.skills, rawState.workflowSkills);

  return {
    commands: mergeStringArrays(
      rawState.commands,
      runtimeCommands.map((command) => command.filename),
    ),
    skills: adapter.workflowsRoot === adapter.skillsRoot
      ? mergeStringArrays(bundledSkillNames, legacyTrackedSkills)
      : mergeStringArrays(bundledSkillNames, rawState.skills),
    workflowSkills: adapter.workflowsRoot === adapter.skillsRoot
      ? []
      : mergeStringArrays(commandSkillNames, rawState.workflowSkills),
    agents: mergeStringArrays(rawState.agents, bundledAgentPaths),
    agentSupportFiles: mergeStringArrays(rawState.agentSupportFiles, bundledAgentSupportFiles),
  };
}

function mergeStringArrays(...values) {
  return [...new Set(values.flatMap((value) => (
    Array.isArray(value)
      ? value.filter((entry) => typeof entry === 'string' && entry.length > 0)
      : []
  )))].sort((a, b) => a.localeCompare(b));
}

const LEGACY_PROJECT_DEVELOPER_PATHS = [
  '.claude/spec-first/.developer',
  '.codex/spec-first/.developer',
];

function planLegacyDeveloperProfileCleanup(projectRoot) {
  const operations = [];
  for (const relativePath of LEGACY_PROJECT_DEVELOPER_PATHS) {
    const absolutePath = path.join(projectRoot, relativePath);
    if (fs.existsSync(absolutePath)) {
      operations.push({
        kind: 'remove_file',
        path: relativePath,
        reason: 'legacy_project_developer_profile',
      });
    }
  }
  return {
    operations,
    summary: summarizeOperationPlan(operations),
  };
}

function readLegacyProjectDeveloperFiles(projectRoot) {
  const records = [];
  for (const relativePath of LEGACY_PROJECT_DEVELOPER_PATHS) {
    const absolutePath = path.join(projectRoot, relativePath);
    const developer = readDeveloperFile(absolutePath);
    if (developer && developer.name) {
      records.push({ relativePath, developer });
    }
  }
  return records;
}

function resolveGlobalDeveloperWriteAction(developer, options = {}) {
  const globalPath = getGlobalDeveloperPath();
  const existing = readDeveloperFile(globalPath);
  if (!existing || !existing.name) {
    return {
      action: 'create',
      developer: preserveSyncUserLanguage(developer, existing),
      globalPath: normalizeOperationPathLike(GLOBAL_DEVELOPER_RELATIVE_DISPLAY),
    };
  }
  // 空列表视为"本次未表达 host 选择",不应抹掉既有记录(例如 dryRun、
  // 异常路径或编程式调用未传 platforms);此时沿用既有 hosts。
  const nextHosts = Array.isArray(developer.hosts) ? developer.hosts : [];
  const effectiveHosts = nextHosts.length > 0 ? nextHosts : existing.hosts;
  if (options.confirmedOverwrite || options.explicitName || options.explicitLang) {
    // profile 已存在(上方已排除 create),initialized_at 语义是"首次初始化时间",
    // re-install 改名/改语言不应刷新它;与下方 host-change 分支保持一致,只刷新
    // name/lang/version 与 hosts,保留既有 initialized_at。
    return {
      action: 'overwrite',
      developer: preserveSyncUserLanguage(
        { ...developer, initializedAt: existing.initializedAt, hosts: effectiveHosts },
        existing,
      ),
      globalPath: normalizeOperationPathLike(GLOBAL_DEVELOPER_RELATIVE_DISPLAY),
    };
  }
  // name/lang 未变是最常见的重装路径。此处若 host 选择变化仍需落盘,
  // 否则用户改动的 host 选择会被静默丢弃。仅更新 hosts,保留既有
  // name/lang/initialized_at/version,避免无谓抖动。
  // 此处用 nextHosts 而非 effectiveHosts:仅当本次有实际勾选才覆写,
  // 空选择走下方 preserve,不应借 fallback 误触发覆写。
  if (nextHosts.length > 0 && !sameHosts(existing.hosts, nextHosts)) {
    return {
      action: 'overwrite',
      developer: { ...existing, hosts: nextHosts },
      globalPath: normalizeOperationPathLike(GLOBAL_DEVELOPER_RELATIVE_DISPLAY),
    };
  }
  return {
    action: 'preserve',
    developer: existing,
    globalPath: normalizeOperationPathLike(GLOBAL_DEVELOPER_RELATIVE_DISPLAY),
  };
}

function preserveSyncUserLanguage(developer, existing) {
  if (
    existing &&
    typeof existing.syncUserLanguage === 'boolean' &&
    (!developer || typeof developer.syncUserLanguage !== 'boolean')
  ) {
    return {
      ...(developer || {}),
      syncUserLanguage: existing.syncUserLanguage,
    };
  }
  return developer;
}

// 比较两个 host 集合是否相同。内部各自排序,不依赖调用方传入已排序数组,
// 使比较对输入顺序鲁棒(集合语义,而非序列语义)。
function sameHosts(left, right) {
  const a = (Array.isArray(left) ? [...left] : []).sort((x, y) => x.localeCompare(y));
  const b = (Array.isArray(right) ? [...right] : []).sort((x, y) => x.localeCompare(y));
  if (a.length !== b.length) {
    return false;
  }
  return a.every((value, index) => value === b[index]);
}

function normalizeOperationPathLike(value) {
  return String(value || '').replace(/\\/g, '/');
}

const GLOBAL_DEVELOPER_RELATIVE_DISPLAY = path.join('~', '.spec-first', '.developer');

function findDuplicateClaudeAgentNames(agentPaths) {
  const seen = new Set();
  const duplicates = new Set();

  for (const agentPath of agentPaths) {
    const bareName = path.basename(agentPath, '.md');
    if (seen.has(bareName)) {
      duplicates.add(bareName);
      continue;
    }
    seen.add(bareName);
  }

  return [...duplicates].sort();
}

function buildInitWritePlan({
  projectRoot,
  adapter,
  developer,
  nextState,
  platform,
  assetPlan,
  runtimePlan,
  gitRootTopology = 'single-repo',
}) {
  const untrackPlan = buildInitUntrackPlan(projectRoot);
  const plan = mergeOperationPlans(
    assetPlan,
    runtimePlan || buildInitRuntimePreviewPlan(projectRoot, adapter),
    buildInitGitignorePlan(projectRoot),
    buildInitMetadataPlan({ projectRoot, adapter, developer, nextState, platform, gitRootTopology }),
    untrackPlan.plan,
  );
  return {
    plan,
    untrackDiagnostic: untrackPlan.diagnostic,
  };
}

function buildInitRuntimePreviewPlan(projectRoot, adapter) {
  return adapter.planRuntimeFilesSync(projectRoot);
}

function buildInitGitignorePlan(projectRoot) {
  const gitignorePath = path.join(projectRoot, '.gitignore');
  const existingGitignore = fs.existsSync(gitignorePath)
    ? fs.readFileSync(gitignorePath, 'utf8')
    : '';
  const gitignoreResult = applySpecFirstGitignoreBlock(existingGitignore);

  if (gitignoreResult.status === 'already-current') {
    return {
      operations: [],
      summary: summarizeOperationPlan([]),
    };
  }

  const operation = buildFileWriteOperation(
    projectRoot,
    gitignorePath,
    gitignoreResult.content,
    'managed_gitignore_policy',
  );
  operation.gitignoreStatus = gitignoreResult.status;

  return {
    operations: [operation],
    summary: summarizeOperationPlan([operation]),
  };
}

function buildInitUntrackPlan(projectRoot) {
  const diagnostic = planRuntimeUntrack({ projectRoot });
  const plan = {
    operations: diagnostic.operations,
    summary: summarizeOperationPlan(diagnostic.operations),
  };
  return {
    plan,
    diagnostic: {
      count: diagnostic.count,
      reason_code: diagnostic.reason_code,
      sample_paths: diagnostic.sample_paths,
      diagnostic: diagnostic.diagnostic,
    },
  };
}

function buildInitMetadataPlan({
  projectRoot,
  adapter,
  developer,
  nextState,
  platform,
  gitRootTopology = 'single-repo',
}) {
  const operations = [];
  const instructionPath = path.join(projectRoot, adapter.instructionFile);
  const existingInstruction = fs.existsSync(instructionPath)
    ? fs.readFileSync(instructionPath, 'utf8')
    : '';
  const instructionWithoutLegacyRuntimeTools = removeManagedRuntimeToolsBlock(existingInstruction);
  const instructionWithoutLegacyCodingGuidelines = removeManagedCodingGuidelinesBlock(
    instructionWithoutLegacyRuntimeTools,
  );
  const instructionWithoutLegacyBootstrap = removeManagedBootstrapBlock(
    instructionWithoutLegacyCodingGuidelines,
  );
  const instructionWithLang = applyManagedBlock(
    instructionWithoutLegacyBootstrap,
    buildManagedBlock(developer.lang),
  );
  operations.push(buildPlanFileOperation(
    projectRoot,
    adapter.instructionFile,
    instructionWithLang,
    'managed_instruction_file',
  ));

  operations.push(buildPlanFileOperation(
    projectRoot,
    adapter.stateFile,
    `${JSON.stringify(nextState, null, 2)}\n`,
    'managed_state_file',
  ));

  const changelogPath = path.join(projectRoot, 'CHANGELOG.md');
  if (!fs.existsSync(changelogPath)) {
    const changelogAuthor = resolveChangelogAuthor(projectRoot, {
      platform,
    });
    operations.push(buildPlanFileOperation(
      projectRoot,
      'CHANGELOG.md',
      buildInitialChangelog(formatChangelogTimestamp(new Date()), changelogAuthor.name || developer.name, developer.version),
      'bootstrap_changelog',
    ));
  }

  if (platform === 'claude') {
    const rendered = renderManagedClaudeHooksUpsert(projectRoot);
    operations.push(buildPlanFileOperation(
      projectRoot,
      path.relative(projectRoot, getClaudeSettingsPath(projectRoot)),
      rendered.contents,
      'managed_claude_hook_matchers',
    ));
  }

  return {
    operations,
    summary: summarizeOperationPlan(operations),
  };
}

function buildPlanFileOperation(projectRoot, relativePath, contents, reason) {
  const absolutePath = path.join(projectRoot, relativePath);
  return buildFileWriteOperation(projectRoot, absolutePath, contents, reason);
}

module.exports = {
  buildInitWritePlan,
  buildProjectInitPlan,
  buildRuntimeUntrackSummary,
  findDuplicateClaudeAgentNames,
  inspectCurrentRuntimeDrift,
  mergeStringArrays,
  readLegacyProjectDeveloperFiles,
  resolveGlobalDeveloperWriteAction,
};
