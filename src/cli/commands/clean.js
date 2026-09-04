const fs = require('node:fs');
const path = require('node:path');

const {
  applyOperationPlan,
  buildRelativeOperation,
  isLegacyManagedState,
  mergeOperationPlans,
  planEmptyManagedRootCleanup,
  hasSharedSkillsRootConsumer,
  planManagedAssetRemoval,
  readState,
  readStateFileRaw,
  summarizeOperationPlan,
} = require('../state');
const { getAdapter, getPlatformDisplayName, getSupportedPlatforms } = require('../adapters');
const { resolveUserLanguage } = require('../cli-lang');

// 用户旅程文案双语；usage/help、legacy state 与 workspace-graph 等技术诊断输出保留英文。
const CLEAN_MESSAGES = {
  zh: {
    noAssets: '未发现 spec-first 受管的项目 assets。',
    dryRunLabel: '演练: spec-first clean',
    applyLabel: '执行: spec-first clean',
    wouldRemove: (count) => `将移除 ${count} 个受管 path。`,
    removing: (count) => `正在移除 ${count} 个受管 path。`,
    wouldUpdate: (count) => `将更新 ${count} 个受管文件。`,
    updating: (count) => `正在更新 ${count} 个受管文件。`,
    wouldRemoveEmptyRoots: (count) => `之后将移除 ${count} 个空的受管根目录。`,
    removingEmptyRoots: '清理过程中会移除空的受管根目录。',
    customAssetsWould: '受管集合之外的自定义 assets 将保持不变。',
    customAssetsDid: '受管集合之外的自定义 assets 已保持不变。',
    noChanges: '未修改任何文件。',
    removed: (display) => `已从当前项目移除 spec-first 受管的 ${display} assets。`,
  },
  en: {
    noAssets: 'No spec-first managed project assets found.',
    dryRunLabel: 'Dry run: spec-first clean',
    applyLabel: 'Apply: spec-first clean',
    wouldRemove: (count) => `Would remove ${count} managed path(s).`,
    removing: (count) => `Removing ${count} managed path(s).`,
    wouldUpdate: (count) => `Would update ${count} managed file(s).`,
    updating: (count) => `Updating ${count} managed file(s).`,
    wouldRemoveEmptyRoots: (count) => `Would remove ${count} empty managed root(s) after cleanup.`,
    removingEmptyRoots: 'Empty managed roots are removed during cleanup.',
    customAssetsWould: 'Custom assets outside the spec-first managed set would remain untouched.',
    customAssetsDid: 'Custom assets outside the spec-first managed set are left untouched.',
    noChanges: 'No files were changed.',
    removed: (display) => `Removed spec-first managed ${display} assets from the current project.`,
  },
};
const { formatInitGuidance } = require('../init-guidance');
const { removeManagedCodingGuidelinesBlock } = require('../coding-guidelines');
const { removeManagedBootstrapBlock } = require('../instruction-bootstrap');
const { removeManagedRuntimeToolsBlock } = require('../runtime-tools-index');
const {
  LANG_END,
  LANG_START,
  removeMarkerBlock,
} = require('../lang-policy');
const {
  renderManagedClaudeHooksRemoval,
  validateClaudeSettingsFile,
} = require('../claude-settings');

function runClean(argv, deps = {}) {
  const args = [...argv];
  const parsed = parseCleanArgs(args);

  if (parsed.help) {
    printHelp();
    return 0;
  }

  if (parsed.workspaceOrphans) {
    return runWorkspaceOrphansClean(parsed);
  }

  if (parsed.workspaceGraph) {
    return runWorkspaceGraphCleanCommand(parsed, deps);
  }

  if (parsed.confirm) {
    console.error('Error: --confirm is only valid with --workspace-orphans.');
    return 2;
  }

  const selectedPlatforms = selectedHostPlatforms(parsed);
  const platformSelected = selectedPlatforms.length > 0;
  if (!platformSelected || parsed.unknown.length > 0) {
    console.error('Usage: spec-first clean (--claude|--codex|--cursor|--kiro|--qoder|--opencode|--zcode) [--dry-run]');
    console.error('   or: spec-first clean --workspace-graph [--repos a,b] [--dry-run]');
    return 2;
  }

  if (selectedPlatforms.length > 1) {
    console.error('Error: Cannot specify more than one host flag for clean');
    return 2;
  }

  const platform = selectedPlatforms[0];
  const adapter = getAdapter(platform);
  const messages = CLEAN_MESSAGES[
    (deps.resolveLang || resolveUserLanguage)() === 'en' ? 'en' : 'zh'
  ];
  const projectRoot = process.cwd();
  let state;
  try {
    state = readState(projectRoot, adapter);
  } catch (error) {
    const rawState = tryReadRawManagedState(projectRoot, adapter);
    if (isLegacyManagedState(rawState)) {
      console.error('Detected legacy spec-first managed state. `clean` does not migrate legacy installs.');
      console.error(
        formatInitGuidance(adapter, 'before rerunning clean so spec-first can perform a managed hard reset and rebuild the current runtime'),
      );
      console.error(
        `If you still want to remove current managed assets afterward, rerun \`spec-first clean --${adapter.id}\`.`,
      );
      return 1;
    }

    console.error(
      `Could not read spec-first managed asset state. ${error instanceof Error ? error.message : String(error)}`,
    );
    console.error(
      `${formatInitGuidance(adapter, 'to regenerate the state file').replace(/\.$/, '')}, then retry \`spec-first clean --${adapter.id}\`.`,
    );
    return 1;
  }

  if (!state) {
    console.log(messages.noAssets);
    return 0;
  }

  if (platform === 'claude') {
    try {
      validateClaudeSettingsFile(projectRoot);
    } catch (error) {
      console.error(
        `Could not read Claude settings before clean. ${error instanceof Error ? error.message : String(error)}`,
      );
      console.error(
        'Fix `.claude/settings.json` so it contains valid JSON, then rerun `spec-first clean --claude`.',
      );
      return 1;
    }
  }

  const cleanPlan = buildCleanPlan(projectRoot, state, adapter);
  if (parsed.dryRun) {
    printCleanSummary(platform, cleanPlan, { mode: 'dry-run', messages });
    return 0;
  }

  printCleanSummary(platform, cleanPlan, { mode: 'apply', messages });
  applyOperationPlan(projectRoot, mergeOperationPlans(cleanPlan.managedPlan, cleanPlan.runtimeCleanup));
  applyOperationPlan(projectRoot, planEmptyManagedRootCleanup(projectRoot, adapter));

  console.log(messages.removed(getPlatformDisplayName(platform)));
  console.log('Custom assets outside the spec-first managed set were left untouched.');
  return 0;
}

function tryReadRawManagedState(projectRoot, adapter) {
  try {
    return readStateFileRaw(projectRoot, adapter);
  } catch (_error) {
    return null;
  }
}

// 宿主 flag 集合从 registry 派生：新增宿主时 clean 的解析面随 getSupportedPlatforms() 自动扩展。
const CLEAN_HOST_FLAGS = new Map(getSupportedPlatforms().map((platform) => [`--${platform}`, platform]));

function parseCleanArgs(argv) {
  const parsed = {
    dryRun: false,
    workspaceOrphans: false,
    workspaceGraph: false,
    repos: [],
    confirm: false,
    unknown: [],
  };
  for (const platform of getSupportedPlatforms()) {
    parsed[platform] = false;
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '-h' || arg === '--help') {
      parsed.help = true;
    } else if (CLEAN_HOST_FLAGS.has(arg)) {
      parsed[CLEAN_HOST_FLAGS.get(arg)] = true;
    } else if (arg === '--dry-run') {
      parsed.dryRun = true;
    } else if (arg === '--workspace-orphans') {
      parsed.workspaceOrphans = true;
    } else if (arg === '--workspace-graph') {
      parsed.workspaceGraph = true;
    } else if (arg === '--confirm') {
      parsed.confirm = true;
    } else if (arg === '--repos' || arg.startsWith('--repos=')) {
      let value = null;
      if (arg.startsWith('--repos=')) {
        value = arg.slice('--repos='.length);
      } else {
        value = argv[index + 1];
        if (value !== undefined && !String(value).startsWith('--')) {
          index += 1;
        } else {
          value = null;
        }
      }
      if (!value) {
        parsed.unknown.push(arg);
      } else {
        const selected = String(value).split(',').map((entry) => entry.trim()).filter(Boolean);
        parsed.repos.push(...selected);
      }
    } else {
      parsed.unknown.push(arg);
    }
  }

  return parsed;
}

// Host-level counterpart of `spec-runtime-setup --workspace-graph-clean` (U6 / AE8).
// Cleans managed per-requirement workspace graph assets only; does not touch host
// runtime mirrors (those stay under clean --claude|--codex|...).
function runWorkspaceGraphCleanCommand(parsed, deps = {}) {
  if (parsed.unknown.length > 0) {
    console.error('Usage: spec-first clean --workspace-graph [--repos a,b] [--dry-run]');
    return 2;
  }
  if (selectedHostPlatforms(parsed).length > 0) {
    console.error('Error: --workspace-graph cannot be combined with host flags.');
    console.error('Workspace graph cleanup is separate from host runtime asset cleanup.');
    return 2;
  }
  if (parsed.confirm) {
    console.error('Error: --confirm is only valid with --workspace-orphans.');
    return 2;
  }

  const projectRoot = deps.cwd || process.cwd();
  const runStatus = deps.runWorkspaceGraphStatus || requireWorkspaceGraphStatus();
  const runCleanGraph = deps.runWorkspaceGraphClean || requireWorkspaceGraphClean();
  const exec = deps.workspaceExec;

  if (parsed.dryRun) {
    const status = runStatus({
      cwd: projectRoot,
      repos: parsed.repos,
      allowDiscovery: parsed.repos.length === 0,
    });
    printWorkspaceGraphCleanPreview(status);
    return 0;
  }

  const result = runCleanGraph({
    cwd: projectRoot,
    repos: parsed.repos,
    allowDiscovery: parsed.repos.length === 0,
    exec,
  });

  if (result.status === 'skipped') {
    console.log(`Workspace graph clean skipped (${result.reason_code || result.topology}).`);
    console.log('This mode only applies to a non-Git multi-repo requirement parent folder.');
    return 0;
  }

  if (result.status === 'needs-confirmation') {
    const pending = Array.isArray(result.pending_confirm) ? result.pending_confirm : [];
    console.log(`Workspace graph clean: ${result.status}`);
    console.log(`  pending_confirm: ${pending.join(', ') || 'discovered repos'}`);
    if (pending.length > 0) {
      console.log(`  confirm: spec-first clean --workspace-graph --repos ${pending.join(',')}`);
    }
    return 2;
  }

  console.log(`Workspace graph clean: ${result.status}`);
  console.log(`  root: ${result.workspace_root}`);
  for (const repo of result.repos || []) {
    console.log(
      `  child ${repo.repo_id}: codegraph_removed=${repo.codegraph_removed}`
        + ` exclude_removed=${repo.exclude_removed}`
        + ` hook=${repo.hook_uninstalled}`,
    );
  }
  console.log(`  workspace graphify-out removed: ${Boolean(result.workspace_graphify_removed)}`);
  if (result.routing && Array.isArray(result.routing.entries)) {
    for (const entry of result.routing.entries) {
      console.log(`  routing ${entry.entry_file}: ${entry.status}`);
    }
  }
  if (result.codegraph_daemon_action) {
    console.log(`  daemon: ${result.codegraph_daemon_action}`);
  }
  return result.status === 'complete' || result.status === 'skipped' ? 0 : 1;
}

function printWorkspaceGraphCleanPreview(status) {
  console.log('Dry run: spec-first clean --workspace-graph');
  if (status.status === 'skipped') {
    console.log(`Would skip (${status.reason_code || status.topology}).`);
    return;
  }
  console.log(`  root: ${status.workspace_root}`);
  const explicitRefresh = status.workspace && status.workspace.refresh_mode === 'explicit';
  for (const repo of status.repos || []) {
    if (repo.codegraph_present) {
      console.log(`  would remove: ${path.join(repo.git_root, '.codegraph')}`);
    }
    console.log(`  would strip managed exclude block in: ${repo.repo_id}`);
    if (!explicitRefresh) {
      console.log(`  would run: graphify hook uninstall (cwd=${repo.repo_id})`);
    }
  }
  if (status.workspace && status.workspace.graphify_present) {
    console.log(`  would remove: ${status.workspace.graphify_dir}`);
  }
  for (const entry of (status.routing && status.routing.entries) || []) {
    if (entry.has_routing_block) {
      console.log(`  would strip routing block from: ${entry.entry_file}`);
    }
  }
  console.log('No files were changed.');
}

function requireWorkspaceGraphClean() {
  return require('../../../skills/spec-runtime-setup/scripts/lib/workspace-graph-clean.cjs').runWorkspaceGraphClean;
}

function requireWorkspaceGraphStatus() {
  return require('../../../skills/spec-runtime-setup/scripts/lib/workspace-graph-status.cjs').runWorkspaceGraphStatus;
}

function runWorkspaceOrphansClean(parsed) {
  if (parsed.unknown.length > 0) {
    console.error('Usage: spec-first clean --workspace-orphans [--confirm]');
    return 2;
  }

  if (selectedHostPlatforms(parsed).length > 0) {
    console.error('Error: --workspace-orphans cannot be combined with host flags.');
    console.error('Workspace orphan cleanup is separate from runtime asset cleanup.');
    return 2;
  }

  const projectRoot = process.cwd();
  const quarantinePath = path.join(projectRoot, '.spec-first', 'workspace', 'parent-artifact-quarantine.json');
  if (!fs.existsSync(quarantinePath)) {
    console.error('No parent artifact quarantine found.');
    console.error('Run `spec-runtime-setup` from the parent workspace to generate workspace orphan evidence first.');
    return 1;
  }

  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(quarantinePath, 'utf8'));
  } catch (error) {
    console.error(
      `Could not read parent artifact quarantine. ${error instanceof Error ? error.message : String(error)}`,
    );
    console.error('Rerun `spec-runtime-setup` from the parent workspace to regenerate the artifact.');
    return 1;
  }

  let entries;
  try {
    entries = validateWorkspaceOrphanQuarantine(payload);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error('Rerun `spec-runtime-setup` from the parent workspace to regenerate the artifact.');
    return 1;
  }

  printWorkspaceOrphanPreview(entries);
  if (!parsed.confirm) {
    console.log('Run `spec-first clean --workspace-orphans --confirm` to delete listed paths.');
    console.log('No files were changed.');
    return 0;
  }

  let deletionPlan;
  try {
    deletionPlan = buildWorkspaceOrphanDeletionPlan(projectRoot, entries);
    validateWorkspaceOrphanDeletionPlan(projectRoot, deletionPlan.operations);
  } catch (error) {
    console.error(`Workspace orphan cleanup aborted. ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }

  if (deletionPlan.operations.length === 0) {
    console.log('No existing quarantined workspace orphan artifacts to delete.');
    if (deletionPlan.skippedMissing.length > 0) {
      console.log(`Skipped ${deletionPlan.skippedMissing.length} already missing path(s).`);
    }
    console.log('No files were changed.');
    return 0;
  }

  try {
    applyOperationPlan(projectRoot, deletionPlan);
  } catch (error) {
    console.error(`Workspace orphan cleanup failed. ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }

  console.log(`Deleted ${deletionPlan.operations.length} workspace orphan path(s).`);
  if (deletionPlan.skippedMissing.length > 0) {
    console.log(`Skipped ${deletionPlan.skippedMissing.length} already missing path(s).`);
  }
  return 0;
}

function validateWorkspaceOrphanQuarantine(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid parent artifact quarantine: expected JSON object.');
  }
  if (payload.schema_version !== 'parent-artifact-quarantine.v1') {
    throw new Error('Invalid parent artifact quarantine: schema_version must be parent-artifact-quarantine.v1.');
  }
  if (!Array.isArray(payload.quarantined_paths)) {
    throw new Error('Invalid parent artifact quarantine: quarantined_paths must be an array.');
  }
  for (const entry of payload.quarantined_paths) {
    if (!entry || typeof entry !== 'object') {
      throw new Error('Invalid parent artifact quarantine: each quarantined path must be an object.');
    }
    if (typeof entry.path !== 'string' || entry.path.length === 0) {
      throw new Error('Invalid parent artifact quarantine: each path must be a non-empty string.');
    }
    if (path.isAbsolute(entry.path) || entry.path.includes('\\') || entry.path.split('/').includes('..')) {
      throw new Error('Invalid parent artifact quarantine: paths must be POSIX repo-relative paths.');
    }
    if (!isAllowedWorkspaceOrphanPath(entry.path)) {
      throw new Error('Invalid parent artifact quarantine: path is outside supported workspace orphan cleanup targets.');
    }
    if (typeof entry.reason_code !== 'string' || entry.reason_code.length === 0) {
      throw new Error('Invalid parent artifact quarantine: each reason_code must be a non-empty string.');
    }
  }
  return payload.quarantined_paths;
}

function printWorkspaceOrphanPreview(entries) {
  console.log('Parent workspace orphan artifact preview:');
  console.log(`Source: ${path.posix.join('.spec-first', 'workspace', 'parent-artifact-quarantine.json')}`);
  if (entries.length === 0) {
    console.log('No quarantined workspace orphan artifacts were reported.');
    return;
  }

  for (const entry of entries) {
    console.log(`  - ${entry.path} (${entry.reason_code})`);
  }
}

function buildWorkspaceOrphanDeletionPlan(projectRoot, entries) {
  const operations = [];
  const skippedMissing = [];
  const seen = new Set();

  for (const entry of entries) {
    if (seen.has(entry.path)) {
      continue;
    }
    seen.add(entry.path);

    const targetPath = path.resolve(projectRoot, entry.path);
    if (!fs.existsSync(targetPath)) {
      skippedMissing.push(entry.path);
      continue;
    }

    const stat = fs.lstatSync(targetPath);
    operations.push(
      buildRelativeOperation(
        stat.isDirectory() && !stat.isSymbolicLink() ? 'remove_dir' : 'remove_file',
        entry.path,
        `workspace_orphan:${entry.reason_code}`,
      ),
    );
  }

  return {
    operations,
    skippedMissing,
    summary: summarizeOperationPlan(operations),
  };
}

function validateWorkspaceOrphanDeletionPlan(projectRoot, operations) {
  const projectRootResolved = path.resolve(projectRoot);
  const projectRootReal = fs.realpathSync.native(projectRootResolved);

  for (const operation of operations) {
    const targetPath = path.resolve(projectRoot, operation.path || '');
    if (!isPathWithin(targetPath, projectRootResolved)) {
      throw new Error(`Unsafe workspace orphan cleanup path outside project root: ${operation.path}`);
    }
    if (targetPath === projectRootResolved) {
      throw new Error(`Unsafe workspace orphan cleanup path targets project root: ${operation.path}`);
    }

    const nearest = nearestExistingPath(targetPath);
    const nearestReal = fs.realpathSync.native(nearest);
    if (!isPathWithin(nearestReal, projectRootReal)) {
      throw new Error(`Unsafe workspace orphan cleanup path escapes project root through symlink: ${operation.path}`);
    }
  }
}

function isAllowedWorkspaceOrphanPath(entryPath) {
  const normalized = String(entryPath || '').replace(/\/+$/, '');
  return normalized === '.spec-first/config/tool-facts.json'
    || normalized === '.spec-first/config/runtime-capabilities.json';
}

function nearestExistingPath(targetPath) {
  let current = path.resolve(targetPath);
  while (true) {
    if (fs.existsSync(current)) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return current;
    }
    current = parent;
  }
}

function isPathWithin(childPath, parentPath) {
  const relative = path.relative(parentPath, childPath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function printHelp() {
  console.log([
    '🧹 spec-first clean',
    '',
    '📘 Usage:',
    '  spec-first clean (--claude|--codex|--cursor|--kiro|--qoder|--opencode|--zcode) [--dry-run]',
    '  spec-first clean --workspace-orphans [--confirm]',
    '  spec-first clean --workspace-graph [--repos a,b] [--dry-run]',
    '',
    'Workspace orphan cleanup previews parent quarantine evidence by default; add --confirm to delete supported orphan paths.',
    'Workspace graph cleanup removes managed per-requirement graph assets (child .codegraph/, exclude block, graphify hooks, workspace graphify-out/, routing markers) without touching host runtime mirrors.',
    '',
    '🔗 Repository:',
    '  https://github.com/sunrain520/spec-first',
  ].join('\n'));
}

function selectedHostPlatforms(parsed) {
  return getSupportedPlatforms().filter((platform) => parsed[platform]);
}

function buildCleanPlan(projectRoot, state, adapter) {
  return {
    managedPlan: planManagedAssetRemoval(projectRoot, state, adapter),
    runtimeCleanup: buildRuntimeCleanupPreview(projectRoot, adapter),
    emptyRootPlan: planEmptyManagedRootCleanup(projectRoot, adapter),
  };
}

function buildRuntimeCleanupPreview(projectRoot, adapter) {
  const sharedConsumers = classifySharedInstructionConsumers(projectRoot, adapter);
  const preservingConsumers = sharedConsumers.filter((consumer) => consumer.status !== 'confirmed_absent');
  const operations = [];
  const diagnostics = buildSharedInstructionDiagnostics(adapter, preservingConsumers);
  if (hasSharedSkillsRootConsumer(projectRoot, adapter)) {
    diagnostics.push({
      level: 'info',
      code: 'shared_skills_consumer_present',
      message: `Preserved the shared ${adapter.skillsRoot}/ projection consumed by another installed host; only host-specific assets were removed.`,
    });
  }

  const instructionPath = path.join(projectRoot, adapter.instructionFile);
  if (preservingConsumers.length === 0) {
    const instructionOperation = buildRelativeOperation(
      fs.existsSync(instructionPath) ? 'update_file' : 'remove_file',
      adapter.instructionFile,
      'managed_instruction_cleanup',
    );
    if (fs.existsSync(instructionPath)) {
      instructionOperation.contents = removeManagedInstructionBlocks(
        fs.readFileSync(instructionPath, 'utf8'),
      );
    }
    operations.push(instructionOperation);
  }

  operations.push(buildRelativeOperation('remove_file', adapter.stateFile, 'managed_state_file'));

  if (adapter.id === 'claude') {
    const rendered = renderManagedClaudeHooksRemoval(projectRoot);
    operations.push(
      rendered && rendered.existsAfter
        ? buildRelativeOperation(
          'update_file',
          '.claude/settings.json',
          'managed_claude_hook_matcher_cleanup',
          { contents: rendered.contents },
        )
        : buildRelativeOperation(
          'remove_file',
          '.claude/settings.json',
          'managed_claude_hook_matcher_cleanup',
        ),
    );
  }
  operations.push(...adapter.planRuntimeFilesRemoval(projectRoot).operations);

  return {
    operations,
    summary: summarizeOperationPlan(operations),
    diagnostics,
  };
}

function classifySharedInstructionConsumers(projectRoot, adapter) {
  return getSupportedPlatforms()
    .filter((platform) => platform !== adapter.id)
    .map((platform) => getAdapter(platform))
    .filter((candidate) => candidate.instructionFile === adapter.instructionFile)
    .map((candidate) => classifyInstructionConsumer(projectRoot, candidate));
}

function classifyInstructionConsumer(projectRoot, adapter) {
  const statePath = path.join(projectRoot, adapter.stateFile);
  if (!fs.existsSync(statePath)) {
    if (hasManagedRuntimeSurface(projectRoot, adapter)) {
      return {
        platform: adapter.id,
        status: 'uncertain',
        reasonCode: 'managed_state_missing_with_runtime',
      };
    }
    return { platform: adapter.id, status: 'confirmed_absent' };
  }

  try {
    const state = readState(projectRoot, adapter);
    if (!state || state.platform !== adapter.id) {
      return {
        platform: adapter.id,
        status: 'uncertain',
        reasonCode: 'managed_state_platform_mismatch',
      };
    }
    return { platform: adapter.id, status: 'present' };
  } catch (_error) {
    return {
      platform: adapter.id,
      status: 'uncertain',
      reasonCode: 'managed_state_unreadable',
    };
  }
}

function hasManagedRuntimeSurface(projectRoot, adapter) {
  return [...new Set([
    adapter.managedRoot,
    adapter.commandRoot,
    adapter.skillsRoot,
    adapter.workflowsRoot,
    adapter.agentsRoot,
  ].filter(Boolean))].some((relativePath) => fs.existsSync(path.join(projectRoot, relativePath)));
}

function buildSharedInstructionDiagnostics(adapter, consumers) {
  const present = consumers.filter((consumer) => consumer.status === 'present');
  const uncertain = consumers.filter((consumer) => consumer.status === 'uncertain');
  const diagnostics = [];

  if (present.length > 0) {
    diagnostics.push({
      code: 'shared_instruction_consumer_present',
      message: `Preserved ${adapter.instructionFile}: confirmed managed consumer(s) remain: ${present.map((consumer) => consumer.platform).join(', ')}.`,
    });
  }
  if (uncertain.length > 0) {
    diagnostics.push({
      code: 'shared_instruction_consumer_uncertain',
      message: `Preserved ${adapter.instructionFile}: consumer ownership is uncertain for ${uncertain.map((consumer) => `${consumer.platform} (${consumer.reasonCode})`).join(', ')}.`,
    });
  }

  return diagnostics;
}

function removeManagedInstructionBlocks(existing) {
  return removeMarkerBlock(
    removeManagedCodingGuidelinesBlock(
      removeManagedRuntimeToolsBlock(
        removeManagedBootstrapBlock(existing),
      ),
    ),
    LANG_START,
    LANG_END,
  );
}

function printCleanSummary(platform, cleanPlan, { mode, messages = CLEAN_MESSAGES.en }) {
  const dryRun = mode === 'dry-run';
  const removeCount =
    (cleanPlan.managedPlan.summary.remove_file || 0) +
    (cleanPlan.managedPlan.summary.remove_dir || 0) +
    (cleanPlan.runtimeCleanup.summary.remove_file || 0) +
    (cleanPlan.runtimeCleanup.summary.remove_dir || 0);
  const updateCount = cleanPlan.runtimeCleanup.summary.update_file || 0;
  const emptyRootCount = cleanPlan.emptyRootPlan.summary.remove_empty_root || 0;

  console.log(`${dryRun ? messages.dryRunLabel : messages.applyLabel} (${platform})`);
  console.log(dryRun ? messages.wouldRemove(removeCount) : messages.removing(removeCount));
  for (const operation of cleanPlan.managedPlan.operations) {
    console.log(`  - ${operation.path}`);
  }
  for (const operation of cleanPlan.runtimeCleanup.operations.filter((entry) =>
    entry.kind === 'remove_file' || entry.kind === 'remove_dir'
  )) {
    console.log(`  - ${operation.path}`);
  }
  console.log(dryRun ? messages.wouldUpdate(updateCount) : messages.updating(updateCount));
  for (const operation of cleanPlan.runtimeCleanup.operations.filter((entry) => entry.kind === 'update_file')) {
    console.log(`  - ${operation.path}`);
  }
  for (const diagnostic of cleanPlan.runtimeCleanup.diagnostics || []) {
    console.log(`[${diagnostic.code}] ${diagnostic.message}`);
  }
  if (dryRun) {
    console.log(messages.wouldRemoveEmptyRoots(emptyRootCount));
  } else {
    console.log(messages.removingEmptyRoots);
  }
  console.log(dryRun ? messages.customAssetsWould : messages.customAssetsDid);
  if (dryRun) {
    console.log(messages.noChanges);
  }
}

module.exports = {
  runClean,
  parseCleanArgs,
  runWorkspaceGraphCleanCommand,
};
