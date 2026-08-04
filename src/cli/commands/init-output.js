
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { getAdapter, getSupportedPlatforms } = require('../adapters');
const { getInitMessages } = require('../init-i18n');
const {
  BrandColors,
  colorize,
  renderFullArt,
  renderWordmark,
} = require('../brand');
const {
  hostDisplayName,
  hostEntrypointLabel,
  hostMcpSetupCommand,
  formatInitHostFlagsForExample,
  initPlatformLabel,
} = require('./init-args');
const { findGitRoot } = require('./init-workspace');
const { printInitDiagnostics } = require('./init-diagnostics');
const { buildRuntimeUntrackSummary } = require('./init-result');
const { mergeStringArrays } = require('./init-project-plan');

const MAX_PREVIEW_PATH_SAMPLES_PER_GROUP = 8;
const MAX_PREVIEW_DETAIL_LINES = 100;

const DESTRUCTIVE_OPERATION_ORDER = Object.freeze({
  remove_file: 0,
  remove_dir: 1,
  prune_command: 2,
  runtime_untrack: 3,
});

const CRITICAL_WRITE_REASON_ORDER = Object.freeze({
  managed_instruction_file: 0,
  managed_gitignore_policy: 1,
  bootstrap_changelog: 2,
  managed_state_file: 3,
  managed_runtime_hook: 4,
  managed_claude_hook_matchers: 4,
  managed_host_native_pointer: 5,
});

function resolveInitBannerRoot(root) {
  return findGitRoot(root) || root;
}

function printInitBrandBanner({ root, version, useColor }) {
  const banner = hasAnyManagedState(root)
    ? renderWordmark(version, { useColor })
    : renderFullArt(version, { useColor }).trimEnd();
  console.log(banner);
}

function hasAnyManagedState(root) {
  return getSupportedPlatforms().some((platform) => (
    fs.existsSync(path.join(root, getAdapter(platform).stateFile))
  ));
}

function printInitPreview(plan, options = {}) {
  printInitPreviews([plan], options);
}

function printInitPreviews(plans, options = {}) {
  const {
    effectiveGlobalDeveloperWrite = null,
    lang = 'en',
    useColor = false,
    userLanguageSyncPlan = null,
  } = options;
  const messages = getInitMessages(lang);
  const normalizedPlans = Array.isArray(plans) ? plans.filter(Boolean) : [];
  const groups = collectInitPreviewGroups(normalizedPlans);
  const view = options.view || 'detailed';

  if (view === 'summary') {
    printInitSummaryPreview(groups, {
      effectiveGlobalDeveloperWrite,
      messages,
      userLanguageSyncPlan,
      useColor,
    });
    console.log(messages.previewAwaitingConfirmation);
    return;
  }

  printInitPreviewRunContext(normalizedPlans, messages);
  console.log(messages.previewCoverage(
    new Set(groups.map((group) => group.targetRoot)).size,
    new Set(groups.map((group) => group.platform)).size,
    groups.length,
    MAX_PREVIEW_DETAIL_LINES,
  ));
  printGlobalDeveloperWritePreview(effectiveGlobalDeveloperWrite, messages);
  printPreviewResetDisclosure(groups.map((group) => group.resetReason), messages);

  const preview = buildBoundedMutationPreview(groups);
  printBoundedMutationPreview(preview, messages, { useColor });
  printUserLanguageSyncPreview(userLanguageSyncPlan, {
    lang,
    globalDeveloperPath: effectiveGlobalDeveloperWrite
      ? (effectiveGlobalDeveloperWrite.resolvedPath || effectiveGlobalDeveloperWrite.globalPath)
      : '',
  });
  console.log(messages.previewNoFilesChanged);
}

function printInitSummaryPreview(groups, options = {}) {
  const {
    effectiveGlobalDeveloperWrite = null,
    messages = getInitMessages('en'),
    userLanguageSyncPlan = null,
    useColor = false,
  } = options;
  const summary = buildInitSummaryPreview(groups);
  console.log(messages.previewSelectedHosts(
    summary.platforms.map((platform) => initPlatformLabel(platform)).join(', '),
  ));
  console.log(messages.previewSummaryCoverage(summary.targetCount, summary.platforms.length));
  printGlobalDeveloperWriteSummaryPreview(effectiveGlobalDeveloperWrite, messages);
  printPreviewResetDisclosure(summary.resetReasons, messages);
  if (summary.destructiveTotal > 0) {
    console.log(messages.previewSummaryDestructive(
      formatPreviewCount(summary.destructiveTotal, BrandColors.remove, useColor),
      summary.destructiveGroupCount,
    ));
    console.log(messages.previewSummaryDestructiveDetails);
  }
  for (const host of summary.hosts) {
    console.log(messages.previewHostSummary(
      initPlatformLabel(host.platform),
      formatPreviewCount(host.destructive, BrandColors.remove, useColor),
      formatPreviewCount(host.critical, BrandColors.write, useColor),
      formatPreviewCount(host.generated, BrandColors.write, useColor),
    ));
  }
  printUserLanguageSyncSummaryPreview(userLanguageSyncPlan, messages);
}

function buildInitSummaryPreview(groups) {
  const normalizedGroups = addDestructiveTotals(groups);
  const hostMap = new Map();
  for (const group of normalizedGroups) {
    const current = hostMap.get(group.platform) || {
      platform: group.platform,
      destructive: 0,
      critical: 0,
      generated: 0,
    };
    current.destructive += group.destructiveTotal;
    current.critical += group.criticalWrites.length;
    current.generated += group.generatedTotal;
    hostMap.set(group.platform, current);
  }

  const destructiveGroups = normalizedGroups.filter((group) => group.destructiveTotal > 0);
  const destructiveTotal = destructiveGroups.reduce(
    (total, group) => total + group.destructiveTotal,
    0,
  );
  return {
    platforms: [...hostMap.keys()],
    hosts: [...hostMap.values()],
    targetCount: new Set(normalizedGroups.map((group) => group.targetRoot)).size,
    destructiveTotal,
    destructiveGroupCount: destructiveGroups.length,
    resetReasons: normalizedGroups.map((group) => group.resetReason),
  };
}

function addDestructiveTotals(groups) {
  return groups.map((group) => ({
    ...group,
    destructiveTotal: group.destructive.length
      + Math.max(0, group.runtimeUntrackCount - group.destructive
        .filter((operation) => operation.kind === 'runtime_untrack').length),
  }));
}

function printGlobalDeveloperWriteSummaryPreview(globalWrite, messages) {
  if (!globalWrite || !globalWrite.developer) {
    return;
  }
  console.log(messages.previewSummaryGlobalDeveloper(
    globalWrite.action || 'preserve',
    globalWrite.resolvedPath || globalWrite.globalPath,
    globalWrite.developer.name,
    globalWrite.developer.lang,
  ));
}

function printUserLanguageSyncSummaryPreview(plan, messages) {
  if (!plan || plan.mode === 'skipped') {
    return;
  }
  const operations = [
    ...(Array.isArray(plan.operations) ? plan.operations : []),
    ...(plan.profileOperation ? [plan.profileOperation] : []),
  ];
  const changes = operations.filter((operation) => (
    !['noop', 'preserve'].includes(operation.action)
  ));
  if (changes.length === 0) {
    console.log(messages.previewSummaryLanguageReady);
    return;
  }
  console.log(messages.previewSummaryLanguageChanges(changes.length));
  for (const operation of changes) {
    console.log(`  - ${operation.host || 'profile'}: ${operation.action} · ${operation.displayPath || operation.globalPath || ''}`);
  }
}

function printInitPreviewRunContext(plans, messages) {
  if (plans.length > 1) {
    console.log(messages.previewSelectedHosts(
      plans.map((plan) => initPlatformLabel(plan.platform)).join(', '),
    ));
  }

  for (const plan of plans) {
    if (plan.mode !== 'all-repos') {
      console.log(messages.previewDryRunHeader(plan.platform));
      continue;
    }
    console.log(`Workspace preview: spec-first init (${plan.platform})`);
    console.log(`  workspace_root: ${plan.workspaceRoot}`);
    console.log(`  selection_source: ${plan.selectionSource}`);
    console.log(`  child_repos: ${Array.isArray(plan.childPlans) ? plan.childPlans.length : 0}`);
    console.log('Parent workspace bootstrap:');
  }
}

function collectInitPreviewGroups(plans) {
  const groups = [];
  for (const plan of plans) {
    if (plan.mode !== 'all-repos') {
      groups.push(buildInitPreviewGroup({
        platform: plan.platform,
        targetKind: 'project',
        targetLabel: plan.projectRoot,
        targetRoot: plan.projectRoot,
        projectPlan: plan,
      }));
      continue;
    }

    groups.push(buildInitPreviewGroup({
      platform: plan.platform,
      targetKind: 'parent',
      targetLabel: 'parent-workspace',
      targetRoot: plan.workspaceRoot,
      projectPlan: plan.parentPlan,
    }));
    for (const entry of Array.isArray(plan.childPlans) ? plan.childPlans : []) {
      const candidate = entry && entry.candidate ? entry.candidate : {};
      const projectPlan = entry && entry.plan ? entry.plan : entry;
      groups.push(buildInitPreviewGroup({
        platform: plan.platform,
        targetKind: 'child',
        targetLabel: candidate.workspace_relative_path || projectPlan.projectRoot,
        targetRoot: projectPlan.projectRoot || candidate.git_root,
        projectPlan,
      }));
    }
  }
  return groups;
}

function buildInitPreviewGroup({ platform, targetKind, targetLabel, targetRoot, projectPlan }) {
  const operationPlan = projectPlan && projectPlan.operationPlan
    ? projectPlan.operationPlan
    : { operations: [] };
  const operations = Array.isArray(operationPlan.operations) ? operationPlan.operations : [];
  const destructiveCandidates = operations
    .filter((operation) => Object.prototype.hasOwnProperty.call(
      DESTRUCTIVE_OPERATION_ORDER,
      operation.kind,
    ));
  const targetRootExists = Boolean(targetRoot && fs.existsSync(targetRoot));
  const destructive = destructiveCandidates
    .filter((operation) => (
      !targetRootExists || fs.existsSync(path.resolve(targetRoot, operation.path))
    ))
    .map((operation) => ({ kind: operation.kind, path: operation.path }))
    .sort((left, right) => DESTRUCTIVE_OPERATION_ORDER[left.kind]
      - DESTRUCTIVE_OPERATION_ORDER[right.kind]);
  const runtimeUntrack = buildRuntimeUntrackSummary(
    projectPlan && projectPlan.untrackDiagnostic,
  );
  destructive.push(...runtimeUntrack.sample_paths.map((samplePath) => ({
    kind: 'runtime_untrack',
    path: samplePath,
  })));

  const writeOperations = operations.filter((operation) => (
    operation.kind === 'write_file' || operation.kind === 'update_file'
  ));
  const criticalWrites = writeOperations
    .filter(isCriticalPreviewWrite)
    .map((operation) => ({ kind: operation.kind, path: operation.path, reason: operation.reason }))
    .sort((left, right) => criticalWriteOrder(left) - criticalWriteOrder(right));
  const criticalKeys = new Set(criticalWrites.map(previewOperationKey));
  const generatedSamples = [];
  let generatedTotal = 0;
  for (const operation of operations) {
    const isWrite = operation.kind === 'write_file' || operation.kind === 'update_file';
    if (
      operation.kind !== 'ensure_dir'
      && (!isWrite || criticalKeys.has(previewOperationKey(operation)))
    ) {
      continue;
    }
    generatedTotal += 1;
    if (generatedSamples.length < MAX_PREVIEW_PATH_SAMPLES_PER_GROUP) {
      generatedSamples.push({
        kind: operation.kind,
        path: operation.path,
        reason: operation.reason,
      });
    }
  }

  return {
    id: `${platform}|${targetKind}|${targetRoot}`,
    platform,
    targetKind,
    targetLabel,
    targetRoot,
    destructive,
    criticalWrites,
    generatedSamples,
    generatedTotal,
    resetReason: resolvePreviewResetReason(projectPlan),
    runtimeUntrackCount: runtimeUntrack.count,
  };
}

function resolvePreviewResetReason(projectPlan = {}) {
  if (projectPlan.legacyStateDetected) {
    return 'legacy';
  }
  return projectPlan.destructiveResetReason === 'current_runtime_drift'
    ? 'current_runtime_drift'
    : null;
}

function printPreviewResetDisclosure(reasons, messages) {
  const resetReasons = new Set((Array.isArray(reasons) ? reasons : [reasons]).filter(Boolean));
  if (resetReasons.has('legacy')) {
    console.log(messages.previewHardResetLegacy);
  }
  if (resetReasons.has('current_runtime_drift')) {
    console.log(messages.previewHardResetDrift);
  }
  if (resetReasons.size > 0) {
    console.log(messages.previewDestructiveReset);
  }
}

function isCriticalPreviewWrite(operation) {
  if (Object.prototype.hasOwnProperty.call(CRITICAL_WRITE_REASON_ORDER, operation.reason)) {
    return true;
  }
  const operationPath = typeof operation.path === 'string' ? operation.path : '';
  return operationPath === 'AGENTS.md'
    || operationPath === 'CLAUDE.md'
    || operationPath === '.gitignore'
    || operationPath === 'CHANGELOG.md'
    || operationPath.endsWith('/state.json')
    || operationPath.includes('/hooks/')
    || operationPath.endsWith('/hooks.json')
    || /\/settings(?:\.local)?\.json$/.test(operationPath);
}

function criticalWriteOrder(operation) {
  if (Object.prototype.hasOwnProperty.call(CRITICAL_WRITE_REASON_ORDER, operation.reason)) {
    return CRITICAL_WRITE_REASON_ORDER[operation.reason];
  }
  return Object.keys(CRITICAL_WRITE_REASON_ORDER).length;
}

function previewOperationKey(operation) {
  return `${operation.kind}|${operation.path}|${operation.reason || ''}`;
}

function buildBoundedMutationPreview(groups) {
  const groupDetails = addDestructiveTotals(groups);
  const phaseDefinitions = [
    { key: 'destructive', rows: (group) => group.destructive },
    { key: 'critical', rows: (group) => group.criticalWrites },
    { key: 'generated', rows: (group) => group.generatedSamples },
  ];
  const blocks = [];
  const shownGroupIds = new Set();
  const shownTargetRoots = new Set();
  let remainingDetailLines = MAX_PREVIEW_DETAIL_LINES;
  let displayedPathCount = 0;

  for (const phase of phaseDefinitions) {
    for (const group of groupDetails) {
      const rows = phase.rows(group);
      if (rows.length === 0 || remainingDetailLines < 2) {
        continue;
      }
      const displayedRows = rows.slice(0, remainingDetailLines - 1);
      blocks.push({
        phase: phase.key,
        group,
        rows: displayedRows,
        generatedOmitted: phase.key === 'generated'
          ? group.generatedTotal - displayedRows.length
          : 0,
      });
      remainingDetailLines -= displayedRows.length + 1;
      displayedPathCount += displayedRows.length;
      shownGroupIds.add(group.id);
      shownTargetRoots.add(group.targetRoot);
    }
  }

  const totalPathCount = groupDetails.reduce((total, group) => (
    total + group.destructiveTotal + group.criticalWrites.length + group.generatedTotal
  ), 0);
  const detailBearingGroups = groupDetails.filter((group) => (
    group.destructiveTotal + group.criticalWrites.length + group.generatedTotal > 0
  ));
  const omittedGroups = detailBearingGroups.filter((group) => !shownGroupIds.has(group.id));
  const detailBearingTargetRoots = new Set(detailBearingGroups.map((group) => group.targetRoot));

  return {
    blocks,
    phaseTotals: {
      destructive: groupDetails.reduce((total, group) => total + group.destructiveTotal, 0),
      critical: groupDetails.reduce((total, group) => total + group.criticalWrites.length, 0),
      generated: groupDetails.reduce((total, group) => total + group.generatedTotal, 0),
    },
    omittedTargets: [...detailBearingTargetRoots]
      .filter((targetRoot) => !shownTargetRoots.has(targetRoot)).length,
    omittedTargetHostGroups: omittedGroups.length,
    omittedPaths: totalPathCount - displayedPathCount,
  };
}

function printBoundedMutationPreview(preview, messages, options = {}) {
  const useColor = options.useColor === true;
  const phases = [
    ['destructive', messages.previewDestructivePaths(
      formatPreviewCount(preview.phaseTotals.destructive, BrandColors.remove, useColor),
    )],
    ['critical', messages.previewCriticalWritePaths(
      formatPreviewCount(preview.phaseTotals.critical, BrandColors.write, useColor),
    )],
    ['generated', messages.previewGeneratedPaths(
      formatPreviewCount(preview.phaseTotals.generated, BrandColors.write, useColor),
    )],
  ];
  for (const [phase, heading] of phases) {
    if (preview.phaseTotals[phase] === 0) {
      continue;
    }
    console.log(heading);
    for (const block of preview.blocks.filter((entry) => entry.phase === phase)) {
      console.log(messages.previewTargetDetail(
        block.group.platform,
        block.group.targetKind,
        block.group.targetLabel,
        block.group.targetRoot,
        block.group.resetReason || 'none',
      ));
      for (const row of block.rows) {
        console.log(`  - ${colorize(row.kind, previewOperationColor(row.kind), useColor)}: ${row.path}`);
      }
      if (block.generatedOmitted > 0) {
        console.log(`  generated_paths_omitted: ${block.generatedOmitted}`);
      }
    }
  }
  console.log(messages.previewOmittedCoverage(
    preview.omittedTargets,
    preview.omittedTargetHostGroups,
    preview.omittedPaths,
  ));
}

function previewOperationColor(kind) {
  if (kind === 'runtime_untrack') {
    return BrandColors.untrack;
  }
  if (Object.prototype.hasOwnProperty.call(DESTRUCTIVE_OPERATION_ORDER, kind)) {
    return BrandColors.remove;
  }
  return BrandColors.write;
}

function printGlobalDeveloperWritePreview(globalWrite, messages) {
  if (!globalWrite || !globalWrite.developer) {
    return;
  }
  const action = globalWrite.action || 'preserve';
  console.log(messages.previewGlobalDeveloperHeader);
  console.log(`  action: ${action}`);
  console.log(`  path: ${globalWrite.resolvedPath || globalWrite.globalPath}`);
  console.log(`  name: ${globalWrite.developer.name}`);
  console.log(`  lang: ${globalWrite.developer.lang}`);
  console.log(`  effect: ${action === 'preserve' ? 'no-op' : 'write'}`);
}

function printWorkspaceInitApplySuccess(plan, result) {
  const summary = result.workspace_summary || {};
  const counts = summary.counts || {};
  console.log(`Workspace init summary: ${summary.overall_status || 'unknown'} (${counts.ready || 0}/${counts.total || 0} ready)`);
  if (result.exit_code === 0) {
    const paths = Array.isArray(result.workspace_summary_paths) && result.workspace_summary_paths.length > 0
      ? result.workspace_summary_paths
      : ['.spec-first/workspace/init-summary.json'];
    console.log(`🧭 Wrote parent advisory summary: ${paths.join(', ')}`);
  }
}

function printInitApplySummaries(plans, results, options = {}) {
  const normalizedPlans = Array.isArray(plans) ? plans.filter(Boolean) : [];
  const normalizedResults = Array.isArray(results) ? results : [];
  const messages = getInitMessages(options.lang || 'zh');
  const readyCount = normalizedPlans.reduce((count, _plan, index) => (
    normalizedResults[index] && normalizedResults[index].exit_code === 0 ? count + 1 : count
  ), 0);
  console.log(readyCount === normalizedPlans.length
    ? messages.applyRunSummary(readyCount, normalizedPlans.length)
    : messages.applyRunFailureSummary(readyCount, normalizedPlans.length));

  let runtimeUntrackCount = 0;
  const runtimeUntrackSamples = [];
  for (const [index, plan] of normalizedPlans.entries()) {
    const result = normalizedResults[index] || { exit_code: 1 };
    const status = result.exit_code === 0 ? messages.applyStatusReady : messages.applyStatusFailed;
    const details = buildInitApplyHostDetails(plan, result, messages);
    console.log(messages.applyHostSummary(
      initPlatformLabel(plan.platform),
      status,
      details.join(' · '),
    ));
    runtimeUntrackCount += Number(result.runtime_untrack && result.runtime_untrack.count) || 0;
    for (const samplePath of result.runtime_untrack && Array.isArray(result.runtime_untrack.sample_paths)
      ? result.runtime_untrack.sample_paths
      : []) {
      if (runtimeUntrackSamples.length >= 3) {
        break;
      }
      if (runtimeUntrackSamples.includes(samplePath)) {
        continue;
      }
      runtimeUntrackSamples.push(samplePath);
    }
  }

  const hasGitignoreChange = normalizedPlans.some((plan) => (
    plan.writePlan && Array.isArray(plan.writePlan.operations)
      && plan.writePlan.operations.some((operation) => operation.reason === 'managed_gitignore_policy')
  ));
  if (hasGitignoreChange) {
    console.log(messages.applyGitignoreCompact);
  }
  if (normalizedPlans.some((plan) => plan.changelogCreated)) {
    console.log(messages.applyChangelogCompact);
  }

  const globalWrite = options.globalDeveloperWriteResult;
  if (globalWrite && globalWrite.developer) {
    console.log(messages.applyProfileCompact(
      globalWrite.action || globalWrite.status || 'preserve',
      globalWrite.resolvedPath || globalWrite.globalPath,
      globalWrite.developer.name,
      globalWrite.developer.lang,
    ));
  }
  const languageSync = options.userLanguageSyncResult;
  if (languageSync && languageSync.status !== 'skipped') {
    console.log(messages.applyLanguageCompact(
      languageSync.status,
      languageSync.reason_code || 'none',
    ));
    for (const operation of Array.isArray(languageSync.operations) ? languageSync.operations : []) {
      if (!operation.error) {
        continue;
      }
      console.log(messages.applyLanguageIssue(
        operation.host || 'unknown',
        operation.displayPath || '',
        operation.error,
      ));
    }
    if (languageSync.profileOperation && languageSync.profileOperation.error) {
      console.log(messages.applyLanguageIssue(
        'profile',
        languageSync.profileOperation.displayPath
          || languageSync.profileOperation.globalPath
          || '',
        languageSync.profileOperation.error,
      ));
    }
  }
  if (runtimeUntrackCount > 0) {
    console.log(messages.applyRuntimeUntrackCompact(runtimeUntrackCount));
    for (const samplePath of runtimeUntrackSamples) {
      console.log(messages.applyRuntimeUntrackSample(samplePath));
    }
  }

  printInitTopologyHandoffs(normalizedPlans, normalizedResults, options.lang || 'zh');
}

function printInitTopologyHandoffs(plans, results, lang = 'zh') {
  for (const [index, plan] of plans.entries()) {
    const result = results[index] || {};
    if (plan.mode === 'all-repos') {
      printAllReposInitHandoff(plan, result, lang);
      continue;
    }
    if (plan.gitRootTopology === 'multi-repo-workspace') {
      printParentOnlyInitHandoff(plan, lang);
    }
  }
}

function printParentOnlyInitHandoff(plan, lang) {
  const hostFlags = formatInitHostFlagsForExample([plan.platform]);
  if (lang === 'en') {
    console.log('Child repo projections: pending (not covered by this init).');
    console.log(`  All children: spec-first init ${hostFlags} --all-repos -y`);
    console.log(`  One child: spec-first init ${hostFlags} --repo <child-path> -y`);
    return;
  }

  console.log('子仓 runtime projection：pending（本次 init 未覆盖）。');
  console.log(`  所有子仓：spec-first init ${hostFlags} --all-repos -y`);
  console.log(`  单个子仓：spec-first init ${hostFlags} --repo <child-path> -y`);
}

function printAllReposInitHandoff(plan, result, lang) {
  const summary = result.workspace_summary || {};
  const counts = summary.counts || {};
  const children = Array.isArray(summary.results) ? summary.results : [];
  const allChildrenReady = Number(counts.total) > 0
    && Number(counts.ready) === Number(counts.total)
    && summary.parent_host_runtime
    && summary.parent_host_runtime.overall_status === 'ready'
    && result.exit_code === 0;

  if (allChildrenReady) {
    if (lang === 'en') {
      console.log(`Child repo projections are ready for ${initPlatformLabel(plan.platform)}. Next: run spec-runtime-setup.`);
    } else {
      console.log(`所有子仓 runtime projection 已为 ${initPlatformLabel(plan.platform)} 就绪。下一步：运行 spec-runtime-setup。`);
    }
    return;
  }

  const failedChild = children.find((child) => child && (
    child.exit_code !== 0 || child.overall_status === 'action-required'
  ));
  const hostFlags = formatInitHostFlagsForExample([plan.platform]);
  if (failedChild) {
    const childPath = failedChild.workspace_relative_path || failedChild.repo_label || '<child-path>';
    if (lang === 'en') {
      console.log('Child repo projection is incomplete. Repair the affected child first:');
      console.log(`  spec-first init ${hostFlags} --repo ${childPath} -y`);
    } else {
      console.log('子仓 runtime projection 未完成。请先修复受影响的子仓：');
      console.log(`  spec-first init ${hostFlags} --repo ${childPath} -y`);
    }
    return;
  }

  if (lang === 'en') {
    console.log('All-repos bootstrap is incomplete. Repair the workspace projection first:');
    console.log(`  spec-first init ${hostFlags} --all-repos -y`);
  } else {
    console.log('all-repos bootstrap 未完成。请先修复 workspace projection：');
    console.log(`  spec-first init ${hostFlags} --all-repos -y`);
  }
}

function buildInitApplyHostDetails(plan, result, messages) {
  if (plan.mode === 'all-repos') {
    const counts = result.workspace_summary && result.workspace_summary.counts
      ? result.workspace_summary.counts
      : {};
    const details = [messages.applyWorkspaceCount(counts.ready || 0, counts.total || 0)];
    if (result.exit_code !== 0) {
      details.push(...collectWorkspaceApplyFailureDetails(result));
    }
    return details;
  }

  const adapter = getAdapter(plan.platform);
  const synced = plan.syncedAssets || {
    commands: [],
    skills: [],
    workflowSkills: [],
    internalSkills: [],
    agents: [],
  };
  const commands = Array.isArray(synced.commands) ? synced.commands : [];
  const directSkills = Array.isArray(synced.skills) ? synced.skills : [];
  const workflowSkills = Array.isArray(synced.workflowSkills) ? synced.workflowSkills : [];
  const internalSkills = Array.isArray(synced.internalSkills) ? synced.internalSkills : [];
  const agents = Array.isArray(synced.agents) ? synced.agents : [];
  const agentSupportFiles = Array.isArray(synced.agentSupportFiles)
    ? synced.agentSupportFiles
    : [];
  const details = [];
  if (adapter.hasCommands && commands.length > 0) {
    details.push(messages.applyCommandsCount(commands.length));
  }
  const skills = adapter.workflowsRoot === adapter.skillsRoot
    ? mergeStringArrays(directSkills, workflowSkills, internalSkills)
    : mergeStringArrays(directSkills, internalSkills);
  if (skills.length > 0) {
    details.push(messages.applySkillsCount(skills.length));
  }
  if (agents.length > 0) {
    details.push(messages.applyAgentsCount(agents.length));
  }
  if (agentSupportFiles.length > 0) {
    details.push(messages.applyAgentSupportCount(agentSupportFiles.length));
  }
  if (
    result.exit_code === 0
    && (
    plan.platform === 'claude'
    || (plan.platform === 'codex' && !hasInitDiagnostic(plan, 'codex_home_hook_write_skipped'))
    )
  ) {
    details.push(messages.applyHookUpdated);
  } else if (plan.platform === 'codex' && hasInitDiagnostic(plan, 'codex_home_hook_write_skipped')) {
    details.push(messages.applyHookSkippedCompact);
  }
  if (result.exit_code !== 0 && result.error) {
    details.push(String(result.error));
  }
  return details;
}

function collectWorkspaceApplyFailureDetails(result) {
  const summary = result.workspace_summary || {};
  const details = [];
  if (result.error) {
    details.push(String(result.error));
  }
  if (summary.reason_code) {
    details.push(summary.reason_code);
  }
  const failedEntry = [summary.parent_host_runtime, ...(summary.results || [])]
    .find((entry) => entry && entry.exit_code !== 0);
  if (failedEntry && failedEntry.reason_code && failedEntry.reason_code !== summary.reason_code) {
    details.push(failedEntry.reason_code);
  }
  if (failedEntry && failedEntry.diagnostic) {
    details.push(String(failedEntry.diagnostic));
  }
  return [...new Set(details)];
}

function printInitApplySuccess(plan, result, options = {}) {
  const adapter = getAdapter(plan.platform);
  const messages = getInitMessages((plan.developer && plan.developer.lang) || 'zh');
  if (plan.platform === 'claude') {
    console.log(messages.applyInstalledClaudeHook);
  } else if (plan.platform === 'codex') {
    console.log(hasInitDiagnostic(plan, 'codex_home_hook_write_skipped')
      ? messages.applySkippedCodexHook
      : messages.applyInstalledCodexHook);
  }
  const synced = plan.syncedAssets || {
    commands: [],
    skills: [],
    workflowSkills: [],
    internalSkills: [],
    agents: [],
    agentSupportFiles: [],
  };
  const written = synced.commands.map((command) => command.filename);
  const skillNames = adapter.workflowsRoot === adapter.skillsRoot
    ? mergeStringArrays(synced.skills, synced.workflowSkills, synced.internalSkills)
    : mergeStringArrays(synced.skills, synced.internalSkills);
  const agentPaths = synced.agents;
  const agentSupportFiles = synced.agentSupportFiles || [];

  if (adapter.hasCommands) {
    console.log(messages.applyGeneratedCommands(written.length, path.relative(plan.projectRoot, plan.commandDir)));
  }
  console.log(messages.applyGeneratedSkills(skillNames.length, adapter.skillsRoot));
  console.log(messages.applyGeneratedAgents(agentPaths.length, adapter.agentsRoot));
  if (agentSupportFiles.length > 0) {
    console.log(messages.applyGeneratedAgentSupport(agentSupportFiles.length, adapter.agentsRoot));
  }
  const gitignoreOperation = plan.writePlan.operations.find((operation) => operation.reason === 'managed_gitignore_policy');
  if (gitignoreOperation) {
    console.log(gitignoreOperation.gitignoreStatus === 'added'
      ? messages.applyGitignoreAdded
      : messages.applyGitignoreUpdated);
  }
  const runtimeUntrack = result.runtime_untrack;
  printRuntimeUntrackApplySummary(runtimeUntrack, messages);
  if (plan.changelogCreated && !options.suppressChangelogCreated) {
    console.log(messages.applyBootstrappedChangelog);
  }

  if (options.showDiagnostics !== false) {
    printInitDiagnostics(plan, { lang: (plan.developer && plan.developer.lang) || 'zh' });
  }

  if (options.showNextSteps !== false) {
    console.log('');
    printInitNextSteps(plan.platform, (plan.developer && plan.developer.lang) || 'zh');
  }
}

function printGlobalDeveloperWriteSummary(globalWrite, messages = getInitMessages('zh')) {
  if (!globalWrite || !globalWrite.developer) {
    return;
  }
  const action = globalWrite.action;
  if (action === 'create') {
    console.log(messages.applyDeveloperProfileCreate);
  } else if (action === 'overwrite') {
    console.log(messages.applyDeveloperProfileOverwrite);
  } else {
    console.log(messages.applyDeveloperProfilePreserve);
  }
  console.log(`  📍 path: ${globalWrite.resolvedPath || globalWrite.globalPath}`);
  console.log(`  👤 name: ${globalWrite.developer.name}`);
  console.log(`  🈯 lang: ${globalWrite.developer.lang}`);
  if (globalWrite.developer.initializedAt) {
    console.log(`  ⏱ initialized_at: ${globalWrite.developer.initializedAt}`);
  }
  if (globalWrite.developer.version) {
    console.log(`  🔖 version: ${globalWrite.developer.version}`);
  }
}

function printUserLanguageSyncPreview(plan, options = {}) {
  if (!plan || plan.mode === 'skipped') {
    return;
  }
  const messages = getInitMessages(options.lang || 'zh');
  console.log('');
  console.log(messages.previewUserLanguageSyncHeader);
  printUserLanguageSyncDetails(plan);
  if (plan.profileOperation) {
    printUserLanguageProfileOperation(plan.profileOperation, {
      globalDeveloperPath: options.globalDeveloperPath,
    });
  }
  console.log(messages.previewUserLanguageSyncDryRun);
}

function printUserLanguageSyncApplySummary(result, options = {}) {
  if (!result || result.status === 'skipped') {
    return;
  }
  const messages = getInitMessages(options.lang || 'zh');
  console.log('');
  console.log(messages.applyUserLanguageSyncHeader(result.status, result.reason_code || 'none'));
  printUserLanguageSyncDetails(result);
  if (result.profileOperation) {
    printUserLanguageProfileOperation(result.profileOperation);
  }
}

function printUserLanguageSyncDetails(planOrResult) {
  const operations = Array.isArray(planOrResult.operations) ? planOrResult.operations : [];
  for (const operation of operations) {
    console.log(`  - ${operation.host}: ${operation.action} (${operation.status})`);
    console.log(`    path: ${operation.displayPath}`);
    if (operation.reason) {
      console.log(`    reason_code: ${operation.reason}`);
    }
    if (operation.overrideDisplayPath) {
      console.log(`    override_path: ${operation.overrideDisplayPath}`);
    }
    if (operation.error) {
      console.log(`    error: ${operation.error}`);
    }
  }
}

function printUserLanguageProfileOperation(operation, options = {}) {
  console.log(`  - profile: ${operation.action} (${operation.status})`);
  console.log(`    path: ${options.globalDeveloperPath || operation.globalPath}`);
  console.log(`    sync_user_language: ${operation.value}`);
  if (operation.reason) {
    console.log(`    reason_code: ${operation.reason}`);
  }
  if (operation.error) {
    console.log(`    error: ${operation.error}`);
  }
}

function hasInitDiagnostic(plan, code) {
  return Array.isArray(plan && plan.diagnostics)
    && plan.diagnostics.some((diagnostic) => diagnostic && diagnostic.code === code);
}

function printInitNextSteps(platform, lang = 'zh') {
  const hostDisplay = hostDisplayName(platform);
  const entryKind = hostEntrypointLabel(platform);
  const mcpSetupCommand = hostMcpSetupCommand(platform);

  // 检测是否首次项目（.spec-first/workflows是否存在）
  const fs = require('fs');
  const path = require('path');
  const workflowHistoryExists = fs.existsSync(path.join(process.cwd(), '.spec-first', 'workflows'));

  if (lang === 'en') {
    console.log('Setup complete. Next steps:');
    console.log(`  1. Restart ${hostDisplay} or open a new session so it loads the generated ${entryKind}.`);

    if (!workflowHistoryExists) {
      // 首次项目：直接给出快速上手的workflow建议
      console.log('  2. Quick start workflow guide:');
      console.log('     • spec-first prd     → Define requirements and product decisions');
      console.log('     • spec-first plan    → Generate implementation plan');
      console.log('     • spec-first work    → Execute planned changes');
      console.log(`  3. For stronger readiness, run ${mcpSetupCommand} to install and verify the required MCP/helper runtime.`);
      console.log('  4. Then choose the workflow by user intent. Project guidance comes from AGENTS.md, CLAUDE.md, docs/contracts, direct source evidence, tests, and logs.');
    } else {
      // 有执行历史：维持原有的generic提示
      console.log(`  2. Start with the matching ${entryKind} for lightweight docs, small fixes, first trials, plan, work, review, or debug.`);
      console.log(`  3. For stronger readiness, run ${mcpSetupCommand} to install and verify the required MCP/helper runtime.`);
      console.log('  4. Then choose the workflow by user intent. Project guidance comes from AGENTS.md, CLAUDE.md, docs/contracts, direct source evidence, tests, and logs.');
    }
    return;
  }

  console.log('初始化完成。下一步:');
  console.log(`  1. 重启 ${hostDisplay} 或新开会话，让宿主加载刚生成的 ${entryKind}。`);

  if (!workflowHistoryExists) {
    // 首次项目：直接给出快速上手的workflow建议
    console.log('  2. 快速上手流程指南:');
    console.log('     • spec-first prd     → 定义需求与产品决策');
    console.log('     • spec-first plan    → 生成实施计划');
    console.log('     • spec-first work    → 执行计划变更');
    console.log(`  3. 需要更完整的 readiness 时，运行 ${mcpSetupCommand} 安装并验证必装 MCP/helper runtime。`);
    console.log('  4. 然后按用户意图选择 workflow；项目指导来自 AGENTS.md、CLAUDE.md、docs/contracts、直接源码证据、测试和日志。');
  } else {
    // 有执行历史：维持原有的generic提示
    console.log(`  2. docs、小修复、首次试用、plan、work、review 或 debug，可直接启动匹配的 ${entryKind}。`);
    console.log(`  3. 需要更完整的 readiness 时，运行 ${mcpSetupCommand} 安装并验证必装 MCP/helper runtime。`);
    console.log('  4. 然后按用户意图选择 workflow；项目指导来自 AGENTS.md、CLAUDE.md、docs/contracts、直接源码证据、测试和日志。');
  }
}

function printInitNextStepsForPlatforms(platforms, lang = 'zh') {
  const uniquePlatforms = [...new Set(platforms)];
  if (uniquePlatforms.length === 1) {
    printInitNextSteps(uniquePlatforms[0], lang);
    return;
  }

  // 检测是否首次项目（.spec-first/workflows是否存在）
  const fs = require('fs');
  const path = require('path');
  const workflowHistoryExists = fs.existsSync(path.join(process.cwd(), '.spec-first', 'workflows'));

  if (lang === 'en') {
    console.log('Setup complete. Next steps:');
    console.log(`  1. Restart ${uniquePlatforms.map(hostDisplayName).join(', ')} or open new sessions so each host loads the generated entrypoints.`);

    if (!workflowHistoryExists) {
      // 首次项目：直接给出快速上手的workflow建议
      console.log('  2. Quick start workflow guide:');
      console.log('     • spec-first prd     → Define requirements and product decisions');
      console.log('     • spec-first plan    → Generate implementation plan');
      console.log('     • spec-first work    → Execute planned changes');
      console.log('  3. For stronger readiness, run the matching MCP setup workflow in the host you plan to use.');
      console.log('  4. Then choose the workflow by user intent: brainstorm/plan/work/review/debug.');
    } else {
      // 有执行历史：维持原有的generic提示
      console.log('  2. Use the matching spec-* workflow entrypoint for lightweight docs, small fixes, first trials, plan, work, review, or debug.');
      console.log('  3. For stronger readiness, run the matching MCP setup workflow in the host you plan to use.');
      console.log('  4. Then choose the workflow by user intent: brainstorm/plan/work/review/debug.');
    }
    return;
  }

  console.log('初始化完成。下一步:');
  console.log(`  1. 重启 ${uniquePlatforms.map(hostDisplayName).join('、')} 或分别新开会话，让宿主加载刚生成的入口。`);

  if (!workflowHistoryExists) {
    // 首次项目：直接给出快速上手的workflow建议
    console.log('  2. 快速上手流程指南:');
    console.log('     • spec-first prd     → 定义需求与产品决策');
    console.log('     • spec-first plan    → 生成实施计划');
    console.log('     • spec-first work    → 执行计划变更');
    console.log('  3. 需要更完整的 readiness 时，在计划使用的宿主里运行匹配的 MCP setup workflow。');
    console.log('  4. 然后按用户意图进入 brainstorm/plan/work/review/debug 等 workflow。');
  } else {
    // 有执行历史：维持原有的generic提示
    console.log('  2. docs、小修复、首次试用、plan、work、review 或 debug，可在对应宿主启动同名 spec-* workflow 入口。');
    console.log('  3. 需要更完整的 readiness 时，在计划使用的宿主里运行匹配的 MCP setup workflow。');
    console.log('  4. 然后按用户意图进入 brainstorm/plan/work/review/debug 等 workflow。');
  }
}

function printHelp() {
  console.log([
    '🚀 spec-first init',
    '',
    '📘 Usage:',
    '  spec-first init [--claude] [--codex] [--cursor] [--kiro] [--qoder] [--opencode] [-y] [--all-repos|--repo <path>] [-u <name>] [--lang <zh|en>] [--sync-user-language|--no-sync-user-language]',
    '',
    'Host selection:',
    '  spec-first init                         Select one or more host runtimes interactively',
    '  spec-first init --codex                 Initialize only Codex after the remaining prompts',
    '  spec-first init --cursor                Initialize only Cursor preview runtime after the remaining prompts',
    '  spec-first init --kiro                  Initialize only Kiro after the remaining prompts',
    '  spec-first init --qoder                 Initialize only Qoder after the remaining prompts',
    '  spec-first init --opencode               Initialize only OpenCode preview runtime after the remaining prompts',
    '  spec-first init --claude --codex --cursor --kiro --qoder --opencode Initialize all supported hosts',
    '  spec-first init -y -u <name> --lang zh  Skip prompts and initialize default hosts (Claude Code + Codex; Cursor/Kiro/Qoder/OpenCode require explicit flags)',
    '  spec-first init --cursor -y -u <name> --lang zh',
    '  spec-first init --qoder -y -u <name> --lang zh',
    '  spec-first init --opencode -y -u <name> --lang zh',
    '',
    'Interactive steps:',
    '  1. Select Claude Code, Codex, Cursor, Kiro, Qoder, and/or OpenCode',
    '  2. Confirm developer name (reuse the existing global profile when present)',
    '  3. Choose response language',
    '  4. Choose workspace target when child Git repos are detected',
    '  5. Preview write/reset operations',
    '  6. Confirm or cancel',
    '',
    'Workspace targeting:',
    '  In a parent workspace with child Git repos, init defaults to bootstrapping the parent workspace root.',
    '  The parent bootstrap includes its instruction file, .gitignore, a missing CHANGELOG.md, and selected host runtime/state.',
    '  spec-first init -y -u <name> --lang zh                 Initialize the parent workspace bootstrap only.',
    '  spec-first init --repo <path> -y -u <name> --lang zh   Initialize one child repo from a parent workspace.',
    '  spec-first init --all-repos -y -u <name> --lang zh     Initialize the parent workspace and every child Git repo.',
    '  Child repo truth stays in each child repo; use --repo or --all-repos only when those repos are independent agent roots.',
    '',
    'Non-interactive usage:',
    '  Use -y/--yes to skip prompts. Without -y, init requires an interactive terminal and exits 2 in CI/non-TTY environments.',
    '  Fresh machines without a global developer profile or git user.name must pass -u <name>.',
    '  Explicit --claude/--codex/--cursor/--kiro/--qoder/--opencode flags override the default host set.',
    '  Use --dry-run to preview writes without changing runtime assets.',
    '  Use --sync-user-language to opt in to user-level language sync; use --no-sync-user-language to disable it and remove spec-first user-language blocks from supported hosts.',
    '',
    '➡️ After successful init:',
    '  Claude: restart Claude Code. For lightweight work, start the matching spec-* workflow; for enhanced readiness, run spec-runtime-setup, then route by user intent.',
    '  Codex: restart Codex. For lightweight work, start the matching spec-* workflow; for enhanced readiness, run spec-runtime-setup, then route by user intent.',
    '  Cursor: restart Cursor. For lightweight work, start the matching spec-* workflow; for enhanced readiness, run spec-runtime-setup. Cursor remains generated-runtime preview until local loader evidence is recorded.',
    '  Kiro: restart Kiro. For lightweight work, start the matching spec-* workflow; for enhanced readiness, run spec-runtime-setup, then route by user intent.',
    '  Qoder: restart Qoder or run /commands reload, /skills reload, and /agents reload. For enhanced readiness, run spec-runtime-setup.',
    '  OpenCode: restart OpenCode so it reloads generated commands and skills. Support remains generated-runtime preview until version-matched loader evidence is recorded.',
    '',
    '🔗 Repository:',
    '  https://github.com/sunrain520/spec-first',
  ].join('\n'));
}

function printInitDryRun({
  platform,
  plan,
  untrackDiagnostic,
  legacyStateDetected,
  destructiveResetReason = '',
  maxEntries = Infinity,
  showPathSamples = true,
  lang = 'en',
  useColor = false,
}) {
  const messages = getInitMessages(lang);
  console.log(messages.previewDryRunHeader(platform));
  printPreviewResetDisclosure([
    resolvePreviewResetReason({ legacyStateDetected, destructiveResetReason }),
  ], messages);

  const pruneCount = plan.summary.prune_command || 0;
  const removeCount = (plan.summary.remove_file || 0) + (plan.summary.remove_dir || 0);
  const ensureCount = plan.summary.ensure_dir || 0;
  const writeCount = (plan.summary.write_file || 0) + (plan.summary.update_file || 0);

  console.log(messages.previewWouldRemove(formatPreviewCount(removeCount, BrandColors.remove, useColor)));
  if (pruneCount > 0) {
    console.log(messages.previewWouldPrune(
      formatPreviewCount(pruneCount, BrandColors.remove, useColor),
      previewListSuffix(showPathSamples, lang),
    ));
    if (showPathSamples) {
      printOperationPathSample(
        plan.operations.filter((entry) => entry.kind === 'prune_command'),
        maxEntries,
        { lang },
      );
    }
  }

  if (ensureCount > 0) {
    console.log(messages.previewWouldEnsureDir(
      formatPreviewCount(ensureCount, BrandColors.write, useColor),
      previewListSuffix(showPathSamples, lang),
    ));
    if (showPathSamples) {
      printOperationPathSample(
        plan.operations.filter((entry) => entry.kind === 'ensure_dir'),
        maxEntries,
        { lang },
      );
    }
  }

  if (writeCount > 0) {
    console.log(messages.previewWouldWrite(
      formatPreviewCount(writeCount, BrandColors.write, useColor),
      previewListSuffix(showPathSamples, lang),
    ));
    if (showPathSamples) {
      printOperationPathSample(
        plan.operations.filter((entry) => entry.kind === 'write_file' || entry.kind === 'update_file'),
        maxEntries,
        { lang },
      );
    }
  }
  printRuntimeUntrackDryRunSummary(untrackDiagnostic, { lang, useColor });
  console.log(messages.previewNoFilesChanged);
}

function formatPreviewCount(count, colorCode, useColor) {
  const text = String(count);
  return count > 0 ? colorize(text, colorCode, useColor) : text;
}

function previewListSuffix(showPathSamples, lang) {
  if (showPathSamples) {
    return ':';
  }
  return lang === 'zh' ? '。' : '.';
}

function printOperationPathSample(operations, maxEntries = Infinity, options = {}) {
  const messages = getInitMessages(options.lang || 'en');
  const limit = Number.isFinite(maxEntries) && maxEntries >= 0 ? Math.floor(maxEntries) : operations.length;
  for (const operation of operations.slice(0, limit)) {
    console.log(`  - ${operation.path}`);
  }
  const omitted = operations.length - Math.min(limit, operations.length);
  if (omitted > 0) {
    console.log(messages.previewOmittedPaths(omitted));
  }
}

function printRuntimeUntrackDryRunSummary(untrackDiagnostic = buildRuntimeUntrackSummary(), options = {}) {
  const lang = options.lang || 'en';
  const useColor = options.useColor === true;
  const messages = getInitMessages(lang);
  const summary = buildRuntimeUntrackSummary(untrackDiagnostic);
  if (summary.count > 0) {
    console.log(messages.previewWouldUntrack(formatPreviewCount(summary.count, BrandColors.untrack, useColor)));
    for (const samplePath of summary.sample_paths) {
      console.log(`  - ${samplePath}`);
    }
    return;
  }

  if (summary.reason_code === 'none-tracked') {
    console.log(messages.previewNoRuntimeUntrack);
    return;
  }

  console.log(messages.previewRuntimeUntrackCheck(summary.reason_code));
  if (summary.diagnostic) {
    console.log(messages.previewRuntimeUntrackDiagnostic(summary.diagnostic));
  }
}

function printRuntimeUntrackApplySummary(summary = buildRuntimeUntrackSummary(), messages = getInitMessages('zh')) {
  if (summary.count > 0) {
    console.log(messages.applyRuntimeUntracked(summary.count));
    return;
  }

  if (summary.reason_code === 'none-tracked') {
    console.log(messages.applyRuntimeUntrackNone);
    return;
  }

  console.log(messages.applyRuntimeUntrackSkipped(summary.reason_code));
}

module.exports = {
  MAX_PREVIEW_DETAIL_LINES,
  MAX_PREVIEW_PATH_SAMPLES_PER_GROUP,
  hasAnyManagedState,
  hasInitDiagnostic,
  printGlobalDeveloperWriteSummary,
  printHelp,
  printInitApplySummaries,
  printInitApplySuccess,
  printInitBrandBanner,
  printInitDryRun,
  printInitNextSteps,
  printInitNextStepsForPlatforms,
  printInitPreview,
  printInitPreviews,
  printRuntimeUntrackApplySummary,
  printRuntimeUntrackDryRunSummary,
  printUserLanguageProfileOperation,
  printUserLanguageSyncApplySummary,
  printUserLanguageSyncDetails,
  printUserLanguageSyncPreview,
  printWorkspaceInitApplySuccess,
  resolveInitBannerRoot,
};
