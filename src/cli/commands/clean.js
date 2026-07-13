const fs = require('node:fs');
const path = require('node:path');

const {
  applyOperationPlan,
  buildRelativeOperation,
  isLegacyManagedState,
  mergeOperationPlans,
  planEmptyManagedRootCleanup,
  planManagedAssetRemoval,
  readState,
  readStateFileRaw,
  summarizeOperationPlan,
} = require('../state');
const { getAdapter } = require('../adapters');
const { formatInitGuidance } = require('../init-guidance');
const { removeManagedCodingGuidelinesBlock } = require('../coding-guidelines');
const { removeManagedBootstrapBlock } = require('../instruction-bootstrap');
const { removeManagedRuntimeToolsBlock } = require('../runtime-tools-index');
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

  const selectedPlatforms = ['claude', 'codex', 'cursor', 'kiro', 'qoder'].filter((platform) => parsed[platform]);
  const platformSelected = selectedPlatforms.length > 0;
  if (!platformSelected || parsed.unknown.length > 0) {
    console.error('Usage: spec-first clean (--claude|--codex|--cursor|--kiro|--qoder) [--dry-run]');
    console.error('   or: spec-first clean --workspace-graph [--repos a,b] [--dry-run]');
    return 2;
  }

  if (selectedPlatforms.length > 1) {
    console.error('Error: Cannot specify more than one host flag for clean');
    return 2;
  }

  const platform = selectedPlatforms[0];
  const adapter = getAdapter(platform);
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
    console.log('No spec-first managed project assets found.');
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
    printCleanSummary(platform, cleanPlan, { mode: 'dry-run' });
    return 0;
  }

  printCleanSummary(platform, cleanPlan, { mode: 'apply' });
  applyOperationPlan(projectRoot, mergeOperationPlans(cleanPlan.managedPlan, cleanPlan.runtimeCleanup));
  applyOperationPlan(projectRoot, planEmptyManagedRootCleanup(projectRoot, adapter));

  console.log(`Removed spec-first managed ${platformDisplayName(platform)} assets from the current project.`);
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

function parseCleanArgs(argv) {
  const parsed = {
    help: false,
    claude: false,
    codex: false,
    cursor: false,
    kiro: false,
    qoder: false,
    dryRun: false,
    workspaceOrphans: false,
    workspaceGraph: false,
    repos: [],
    confirm: false,
    unknown: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '-h' || arg === '--help') {
      parsed.help = true;
    } else if (arg === '--claude') {
      parsed.claude = true;
    } else if (arg === '--codex') {
      parsed.codex = true;
    } else if (arg === '--cursor') {
      parsed.cursor = true;
    } else if (arg === '--kiro') {
      parsed.kiro = true;
    } else if (arg === '--qoder') {
      parsed.qoder = true;
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

// Host-level counterpart of `spec-mcp-setup --workspace-graph-clean` (U6 / AE8).
// Cleans managed per-requirement workspace graph assets only; does not touch host
// runtime mirrors (those stay under clean --claude|--codex|...).
function runWorkspaceGraphCleanCommand(parsed, deps = {}) {
  if (parsed.unknown.length > 0) {
    console.error('Usage: spec-first clean --workspace-graph [--repos a,b] [--dry-run]');
    return 2;
  }
  if (parsed.claude || parsed.codex || parsed.cursor || parsed.kiro || parsed.qoder) {
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
  console.log(`  workspace .graphify removed: ${Boolean(result.workspace_graphify_removed)}`);
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
  for (const repo of status.repos || []) {
    if (repo.codegraph_present) {
      console.log(`  would remove: ${path.join(repo.git_root, '.codegraph')}`);
    }
    console.log(`  would strip managed exclude block in: ${repo.repo_id}`);
    console.log(`  would run: graphify hook uninstall (cwd=${repo.repo_id})`);
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
  return require('../../../skills/spec-mcp-setup/scripts/lib/workspace-graph-clean.cjs').runWorkspaceGraphClean;
}

function requireWorkspaceGraphStatus() {
  return require('../../../skills/spec-mcp-setup/scripts/lib/workspace-graph-status.cjs').runWorkspaceGraphStatus;
}

function runWorkspaceOrphansClean(parsed) {
  if (parsed.unknown.length > 0) {
    console.error('Usage: spec-first clean --workspace-orphans [--confirm]');
    return 2;
  }

  if (parsed.claude || parsed.codex || parsed.cursor || parsed.kiro || parsed.qoder) {
    console.error('Error: --workspace-orphans cannot be combined with host flags.');
    console.error('Workspace orphan cleanup is separate from runtime asset cleanup.');
    return 2;
  }

  const projectRoot = process.cwd();
  const quarantinePath = path.join(projectRoot, '.spec-first', 'workspace', 'parent-artifact-quarantine.json');
  if (!fs.existsSync(quarantinePath)) {
    console.error('No parent artifact quarantine found.');
    console.error('Run `spec-mcp-setup` from the parent workspace to generate workspace orphan evidence first.');
    return 1;
  }

  let payload;
  try {
    payload = JSON.parse(fs.readFileSync(quarantinePath, 'utf8'));
  } catch (error) {
    console.error(
      `Could not read parent artifact quarantine. ${error instanceof Error ? error.message : String(error)}`,
    );
    console.error('Rerun `spec-mcp-setup` from the parent workspace to regenerate the artifact.');
    return 1;
  }

  let entries;
  try {
    entries = validateWorkspaceOrphanQuarantine(payload);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error('Rerun `spec-mcp-setup` from the parent workspace to regenerate the artifact.');
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
    '  spec-first clean (--claude|--codex|--cursor|--kiro|--qoder) [--dry-run]',
    '  spec-first clean --workspace-orphans [--confirm]',
    '  spec-first clean --workspace-graph [--repos a,b] [--dry-run]',
    '',
    'Workspace orphan cleanup previews parent quarantine evidence by default; add --confirm to delete supported orphan paths.',
    'Workspace graph cleanup removes managed per-requirement graph assets (child .codegraph/, exclude block, graphify hooks, workspace .graphify/, routing markers) without touching host runtime mirrors.',
    '',
    '🔗 Repository:',
    '  https://github.com/sunrain520/spec-first',
  ].join('\n'));
}

function platformDisplayName(platform) {
  if (platform === 'claude') return 'Claude Code';
  if (platform === 'codex') return 'Codex';
  if (platform === 'cursor') return 'Cursor';
  if (platform === 'kiro') return 'Kiro';
  if (platform === 'qoder') return 'Qoder';
  return platform;
}

function buildCleanPlan(projectRoot, state, adapter) {
  return {
    managedPlan: planManagedAssetRemoval(projectRoot, state, adapter),
    runtimeCleanup: buildRuntimeCleanupPreview(projectRoot, adapter),
    emptyRootPlan: planEmptyManagedRootCleanup(projectRoot, adapter),
  };
}

function buildRuntimeCleanupPreview(projectRoot, adapter) {
  const operations = [
    buildRelativeOperation(
      fs.existsSync(path.join(projectRoot, adapter.instructionFile)) ? 'update_file' : 'remove_file',
      adapter.instructionFile,
      'managed_instruction_cleanup',
    ),
    buildRelativeOperation('remove_file', adapter.stateFile, 'managed_state_file'),
  ];

  const instructionPath = path.join(projectRoot, adapter.instructionFile);
  if (fs.existsSync(instructionPath)) {
    operations[0].contents = removeManagedCodingGuidelinesBlock(
      removeManagedRuntimeToolsBlock(
        removeManagedBootstrapBlock(fs.readFileSync(instructionPath, 'utf8')),
      ),
    );
  }

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
  };
}

function printCleanSummary(platform, cleanPlan, { mode }) {
  const dryRun = mode === 'dry-run';
  const removeCount =
    (cleanPlan.managedPlan.summary.remove_file || 0) +
    (cleanPlan.managedPlan.summary.remove_dir || 0) +
    (cleanPlan.runtimeCleanup.summary.remove_file || 0) +
    (cleanPlan.runtimeCleanup.summary.remove_dir || 0);
  const updateCount = cleanPlan.runtimeCleanup.summary.update_file || 0;
  const emptyRootCount = cleanPlan.emptyRootPlan.summary.remove_empty_root || 0;

  console.log(`${dryRun ? 'Dry run' : 'Apply'}: spec-first clean (${platform})`);
  console.log(`${dryRun ? 'Would remove' : 'Removing'} ${removeCount} managed path(s).`);
  for (const operation of cleanPlan.managedPlan.operations) {
    console.log(`  - ${operation.path}`);
  }
  for (const operation of cleanPlan.runtimeCleanup.operations.filter((entry) =>
    entry.kind === 'remove_file' || entry.kind === 'remove_dir'
  )) {
    console.log(`  - ${operation.path}`);
  }
  console.log(`${dryRun ? 'Would update' : 'Updating'} ${updateCount} managed file(s).`);
  for (const operation of cleanPlan.runtimeCleanup.operations.filter((entry) => entry.kind === 'update_file')) {
    console.log(`  - ${operation.path}`);
  }
  if (dryRun) {
    console.log(`Would remove ${emptyRootCount} empty managed root(s) after cleanup.`);
  } else {
    console.log('Empty managed roots are removed during cleanup.');
  }
  console.log(`Custom assets outside the spec-first managed set ${dryRun ? 'would remain' : 'are left'} untouched.`);
  if (dryRun) {
    console.log('No files were changed.');
  }
}

module.exports = {
  runClean,
  parseCleanArgs,
  runWorkspaceGraphCleanCommand,
};
