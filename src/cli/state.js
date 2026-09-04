const fs = require('node:fs');
const path = require('node:path');
const { writeFileAtomic } = require('./atomic-write');

const REQUIRED_MANAGED_STATE_ARRAY_FIELDS = [
  'commands',
  'skills',
  'workflowSkills',
  'agents',
  'agentSupportFiles',
];
const WINDOWS_RESERVED_PATH_NAMES = new Set([
  'CON',
  'PRN',
  'AUX',
  'NUL',
  'COM1',
  'COM2',
  'COM3',
  'COM4',
  'COM5',
  'COM6',
  'COM7',
  'COM8',
  'COM9',
  'LPT1',
  'LPT2',
  'LPT3',
  'LPT4',
  'LPT5',
  'LPT6',
  'LPT7',
  'LPT8',
  'LPT9',
]);
const RETIRED_STANDARDS_SKILL = ['spec', 'standards'].join('-');
const RETIRED_COMMAND_FILENAMES = [
  'app-consistency-audit.md',
  'bootstrap.md',
  'brainstorm.md',
  'code-review.md',
  'compound-refresh.md',
  'compound.md',
  'debug.md',
  'doc-review.md',
  'dogfood.md',
  'graph-bootstrap.md',
  'ideate.md',
  'mcp-setup.md',
  'optimize.md',
  'plan.md',
  'polish-beta.md',
  'polish.md',
  'pr-description.md',
  'prd.md',
  'release-notes.md',
  'review.md',
  'runtime-setup.md',
  'sessions.md',
  'setup.md',
  'skill-audit.md',
  'slack-research.md',
  'standards.md',
  'update.md',
  'work-beta.md',
  'work.md',
  'write-skill.md',
];
const RETIRED_COMMAND_NAMESPACE_ROOTS = {
  claude: '.claude/commands/spec',
  qoder: '.qoder/commands/spec',
  opencode: '.opencode/commands/spec',
};
const RETIRED_COMMON_RUNTIME_ASSET_PATHS = [
  { kind: 'remove_dir', path: '.spec-first/standards' },
];
const RETIRED_RUNTIME_ASSET_PATHS = {
  claude: [
    { kind: 'remove_dir', path: `.claude/spec-first/workflows/${RETIRED_STANDARDS_SKILL}` },
    { kind: 'remove_dir', path: `.claude/skills/${RETIRED_STANDARDS_SKILL}` },
  ],
  codex: [
    { kind: 'remove_dir', path: `.agents/skills/${RETIRED_STANDARDS_SKILL}` },
    { kind: 'remove_file', path: '.codex/commands/spec/standards.md' },
  ],
};

function getStateFilePath(projectRoot, adapter) {
  return path.join(projectRoot, adapter.stateFile);
}

function readState(projectRoot, adapter) {
  const statePath = getStateFilePath(projectRoot, adapter);
  if (!fs.existsSync(statePath)) {
    return null;
  }

  const parsed = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  validateManagedStateShape(parsed, adapter);
  return normalizeState(parsed);
}

function readStateFileRaw(projectRoot, adapter) {
  const statePath = getStateFilePath(projectRoot, adapter);
  if (!fs.existsSync(statePath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(statePath, 'utf8'));
}

function writeState(projectRoot, nextState, adapter) {
  const statePath = getStateFilePath(projectRoot, adapter);
  const normalized = normalizeState(nextState);
  validateManagedStateShape(normalized, adapter);
  writeFileAtomic(statePath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
}

function clearState(projectRoot, adapter) {
  const statePath = getStateFilePath(projectRoot, adapter);
  fs.rmSync(statePath, { force: true });
  removeEmptyParents(path.dirname(statePath), projectRoot);
}

function buildState(manifestVersion, syncedAssets) {
  return normalizeState({
    manifestVersion,
    platform: syncedAssets.platform || '',
    commands: syncedAssets.commands.map((entry) => entry.filename),
    skills: normalizeStringArray([
      ...(Array.isArray(syncedAssets.skills) ? syncedAssets.skills : []),
      ...(Array.isArray(syncedAssets.internalSkills) ? syncedAssets.internalSkills : []),
    ]),
    workflowSkills: syncedAssets.workflowSkills,
    agents: syncedAssets.agents,
    agentSupportFiles: syncedAssets.agentSupportFiles,
  });
}

function normalizeState(raw) {
  const safe = raw && typeof raw === 'object' ? raw : {};
  return {
    manifestVersion: typeof safe.manifestVersion === 'string' ? safe.manifestVersion : '',
    platform: typeof safe.platform === 'string' ? safe.platform : '',
    commands: normalizeStringArray(safe.commands),
    skills: normalizeStringArray(safe.skills),
    workflowSkills: normalizeStringArray(safe.workflowSkills),
    agents: normalizeStringArray(safe.agents),
    agentSupportFiles: normalizeStringArray(safe.agentSupportFiles),
  };
}

function validateManagedStateShape(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Invalid managed state: expected a JSON object');
  }

  if (typeof raw.manifestVersion !== 'string' || raw.manifestVersion.length === 0) {
    throw new Error('Invalid managed state: missing required string field "manifestVersion"');
  }

  for (const field of REQUIRED_MANAGED_STATE_ARRAY_FIELDS) {
    if (!(field in raw)) {
      throw new Error(`Invalid managed state: missing required array field "${field}"`);
    }

    if (!Array.isArray(raw[field])) {
      throw new Error(`Invalid managed state: field "${field}" must be an array`);
    }

    const invalidEntry = raw[field].find((entry) => typeof entry !== 'string' || entry.length === 0);
    if (invalidEntry !== undefined) {
      throw new Error(`Invalid managed state: field "${field}" must contain only non-empty strings`);
    }

    const unsafeEntry = raw[field].find((entry) => !isSafeManagedStatePath(entry, {
      allowNested: field === 'agents' || field === 'agentSupportFiles',
    }));
    if (unsafeEntry !== undefined) {
      throw new Error(`Invalid managed state: field "${field}" contains unsafe path entry "${unsafeEntry}"`);
    }
  }
}

function isSafeManagedStatePath(value, options = {}) {
  if (typeof value !== 'string') return false;
  if (value.length === 0 || value.trim() !== value) return false;
  if (value.includes('\0')) return false;
  if (path.isAbsolute(value) || /^[a-zA-Z]:/.test(value)) return false;
  if (value.includes('\\')) return false;

  const normalized = normalizeOperationPath(value);
  if (normalized === '.' || normalized === '..') return false;
  if (!options.allowNested && normalized.includes('/')) return false;

  const segments = normalized.split('/');
  for (const segment of segments) {
    if (!isSafeManagedStatePathSegment(segment)) {
      return false;
    }
  }

  return true;
}

function isSafeManagedStatePathSegment(segment) {
  if (!segment || segment === '.' || segment === '..') return false;
  if (/[<>:"|?*\x00]/.test(segment)) return false;
  if (/[. ]$/.test(segment)) return false;

  const windowsBaseName = segment.split('.')[0].toUpperCase();
  return !WINDOWS_RESERVED_PATH_NAMES.has(windowsBaseName);
}

function isLegacyManagedState(raw) {
  return !!raw && typeof raw === 'object' && !Array.isArray(raw) && (
    REQUIRED_MANAGED_STATE_ARRAY_FIELDS.some((field) => !Array.isArray(raw[field]))
  );
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.filter((entry) => typeof entry === 'string' && entry.length > 0))].sort(
    (a, b) => a.localeCompare(b),
  );
}

function buildEmptyOperationPlan() {
  return {
    operations: [],
    summary: {},
  };
}

function normalizeOperationPath(filePath) {
  return String(filePath || '').replace(/\\/g, '/');
}

function mergeOperationPlans(...plans) {
  const merged = buildEmptyOperationPlan();
  const seen = new Set();

  for (const plan of plans) {
    if (!plan || !Array.isArray(plan.operations)) {
      continue;
    }

    for (const operation of plan.operations) {
      const key = `${operation.kind}:${operation.path}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      merged.operations.push({ ...operation });
    }
  }

  merged.summary = summarizeOperations(merged.operations);
  return merged;
}

function summarizeOperations(operations) {
  const summary = {};
  for (const operation of operations) {
    summary[operation.kind] = (summary[operation.kind] || 0) + 1;
  }
  return summary;
}

function summarizeOperationPlan(operations) {
  return summarizeOperations(operations);
}

function buildRelativeOperation(kind, relativePath, reason, extra = {}) {
  return {
    kind,
    path: normalizeOperationPath(relativePath),
    reason,
    ...extra,
  };
}

function buildOperation(kind, absolutePath, projectRoot, reason) {
  return buildRelativeOperation(kind, toRelativeProjectPath(absolutePath, projectRoot), reason);
}

function toRelativeProjectPath(absolutePath, projectRoot) {
  const relative = path.relative(projectRoot, absolutePath);
  return normalizeOperationPath(relative.length > 0 ? relative : '.');
}

function buildFileWriteOperation(projectRoot, absolutePath, contents, reason, mode, encoding) {
  const extra = { contents };
  if (typeof mode === 'number') {
    extra.mode = mode;
  }
  if (encoding) {
    extra.encoding = encoding;
  }

  return buildRelativeOperation(
    fs.existsSync(absolutePath) ? 'update_file' : 'write_file',
    toRelativeProjectPath(absolutePath, projectRoot),
    reason,
    extra,
  );
}

function planManagedAssetRemoval(projectRoot, managedState, adapter) {
  const state = normalizeState(managedState);
  validateManagedStateShape({
    ...state,
    manifestVersion: state.manifestVersion || 'normalized',
  }, adapter);
  const operations = [];
  // Shared skills roots (e.g. `.agents/skills/` consumed by both Codex and
  // ZCode) must survive a per-host clean/hard-reset while another host's state
  // still claims the same projection; AGENTS.md has the same guard via the
  // instruction-file consumer classification in clean.js.
  const preserveSharedSkills = hasSharedSkillsRootConsumer(projectRoot, adapter);

  for (const commandFile of state.commands) {
    operations.push(
      buildOperation(
        'remove_file',
        path.join(projectRoot, adapter.commandRoot, commandFile),
        projectRoot,
        'managed_command',
      ),
    );
  }

  if (!preserveSharedSkills) {
    for (const skillName of state.skills) {
      operations.push(
        buildOperation(
          'remove_dir',
          path.join(projectRoot, adapter.skillsRoot, skillName),
          projectRoot,
          'managed_skill',
        ),
      );
    }

    for (const skillName of state.workflowSkills) {
      operations.push(
        buildOperation(
          'remove_dir',
          path.join(projectRoot, adapter.workflowsRoot, skillName),
          projectRoot,
          'managed_workflow_skill',
        ),
      );
    }
  }

  for (const agentPath of state.agents) {
    operations.push(
      buildOperation(
        'remove_file',
        path.join(projectRoot, adapter.agentsRoot, agentPath),
        projectRoot,
        'managed_agent',
      ),
    );
  }

  for (const supportPath of state.agentSupportFiles) {
    operations.push(
      buildOperation(
        'remove_file',
        path.join(projectRoot, adapter.agentsRoot, supportPath),
        projectRoot,
        'managed_agent_support_file',
      ),
    );
  }

  return {
    operations,
    summary: summarizeOperations(operations),
    skippedSharedSkills: preserveSharedSkills,
  };
}

function removeManagedAssets(projectRoot, managedState, adapter) {
  applyOperationPlan(projectRoot, planManagedAssetRemoval(projectRoot, managedState, adapter));
}

// True when another supported host's managed state still claims the same
// skillsRoot projection (e.g. Codex and ZCode both consume `.agents/skills/`).
// Lazy require: adapters depend on this module, so a top-level import would cycle.
function hasSharedSkillsRootConsumer(projectRoot, adapter) {
  const { getSupportedPlatforms, getAdapter } = require('./adapters');
  return getSupportedPlatforms().some((platform) => {
    if (platform === adapter.id) {
      return false;
    }
    let candidate;
    try {
      candidate = getAdapter(platform);
    } catch (_error) {
      return false;
    }
    if (candidate.skillsRoot !== adapter.skillsRoot) {
      return false;
    }
    try {
      const candidateState = readState(projectRoot, candidate);
      return Boolean(candidateState && candidateState.platform === candidate.id);
    } catch (_error) {
      return false;
    }
  });
}

function planHardResetManagedAssets(projectRoot, managedState, adapter) {
  return planManagedAssetRemoval(projectRoot, managedState, adapter);
}

function hardResetManagedAssets(projectRoot, managedState, adapter) {
  applyOperationPlan(projectRoot, planHardResetManagedAssets(projectRoot, managedState, adapter));
}

function planObsoleteManagedAssetRemoval(projectRoot, previousState, nextState, adapter) {
  const previous = normalizeState(previousState);
  const next = normalizeState(nextState);
  validateManagedStateShape({
    ...previous,
    manifestVersion: previous.manifestVersion || 'normalized',
  }, adapter);
  validateManagedStateShape({
    ...next,
    manifestVersion: next.manifestVersion || 'normalized',
  }, adapter);
  const operations = [];

  for (const commandFile of previous.commands.filter((entry) => !next.commands.includes(entry))) {
    operations.push(
      buildOperation(
        'remove_file',
        path.join(projectRoot, adapter.commandRoot, commandFile),
        projectRoot,
        'obsolete_managed_command',
      ),
    );
  }

  for (const skillName of previous.skills.filter((entry) => !next.skills.includes(entry))) {
    operations.push(
      buildOperation(
        'remove_dir',
        path.join(projectRoot, adapter.skillsRoot, skillName),
        projectRoot,
        'obsolete_managed_skill',
      ),
    );
  }

  for (const skillName of previous.workflowSkills.filter((entry) => !next.workflowSkills.includes(entry))) {
    operations.push(
      buildOperation(
        'remove_dir',
        path.join(projectRoot, adapter.workflowsRoot, skillName),
        projectRoot,
        'obsolete_workflow_skill',
      ),
    );
  }

  for (const agentPath of previous.agents.filter((entry) => !next.agents.includes(entry))) {
    operations.push(
      buildOperation(
        'remove_file',
        path.join(projectRoot, adapter.agentsRoot, agentPath),
        projectRoot,
        'obsolete_managed_agent',
      ),
    );
  }

  for (const supportPath of previous.agentSupportFiles.filter((entry) => !next.agentSupportFiles.includes(entry))) {
    operations.push(
      buildOperation(
        'remove_file',
        path.join(projectRoot, adapter.agentsRoot, supportPath),
        projectRoot,
        'obsolete_managed_agent_support_file',
      ),
    );
  }

  return {
    operations,
    summary: summarizeOperations(operations),
  };
}

function removeObsoleteManagedAssets(projectRoot, previousState, nextState, adapter) {
  applyOperationPlan(projectRoot, planObsoleteManagedAssetRemoval(projectRoot, previousState, nextState, adapter));
}

function planRetiredRuntimeAssetPrune(projectRoot, adapter) {
  const retiredPaths = [
    ...RETIRED_COMMON_RUNTIME_ASSET_PATHS,
    ...(RETIRED_RUNTIME_ASSET_PATHS[adapter.id] || []),
  ];
  const operations = [];

  for (const retiredPath of retiredPaths) {
    const absolutePath = path.join(projectRoot, retiredPath.path);
    if (!fs.existsSync(absolutePath)) {
      continue;
    }

    operations.push(
      buildOperation(
        retiredPath.kind,
        absolutePath,
        projectRoot,
        'retired_runtime_asset',
      ),
    );
  }

  const retiredCommandRoot = RETIRED_COMMAND_NAMESPACE_ROOTS[adapter.id];
  if (retiredCommandRoot) {
    operations.push(...planRetiredCommandNamespaceRemoval(
      projectRoot,
      retiredCommandRoot,
      'retired_runtime_asset',
    ).operations);
  }

  return {
    operations,
    summary: summarizeOperations(operations),
  };
}

function planRetiredCommandNamespaceRemoval(
  projectRoot,
  namespaceRoot,
  reason = 'retired_runtime_command_namespace',
) {
  const operations = [];
  const removableEntries = new Set();
  for (const filename of RETIRED_COMMAND_FILENAMES) {
    const absolutePath = path.join(projectRoot, namespaceRoot, filename);
    if (!fs.existsSync(absolutePath) || !fs.lstatSync(absolutePath).isFile()) {
      continue;
    }
    operations.push(buildOperation('remove_file', absolutePath, projectRoot, reason));
    removableEntries.add(filename);
  }

  const absoluteRoot = path.join(projectRoot, namespaceRoot);
  const rootBecomesEmpty = fs.existsSync(absoluteRoot)
    && fs.readdirSync(absoluteRoot).every((entry) => removableEntries.has(entry));
  if (rootBecomesEmpty) {
    operations.push(buildOperation('remove_empty_root', absoluteRoot, projectRoot, reason));
  }

  return {
    operations,
    summary: summarizeOperations(operations),
  };
}

function planEmptyManagedRootCleanup(projectRoot, adapter) {
  const relativePaths = [adapter.skillsRoot];
  if (adapter.hasCommands) {
    relativePaths.unshift(adapter.commandRoot);
  }
  if (adapter.supportsAgents !== false) {
    relativePaths.push(adapter.agentsRoot);
  }
  const preserveSharedSkillsRoot = hasSharedSkillsRootConsumer(projectRoot, adapter);

  const operations = [];
  for (const relativePath of relativePaths) {
    if (relativePath === adapter.skillsRoot && preserveSharedSkillsRoot) {
      continue;
    }
    const absolutePath = path.join(projectRoot, relativePath);
    if (!fs.existsSync(absolutePath)) {
      continue;
    }

    if (fs.readdirSync(absolutePath).length === 0) {
      operations.push(
        buildOperation(
          'remove_empty_root',
          absolutePath,
          projectRoot,
          'empty_managed_root',
        ),
      );
    }
  }

  return {
    operations,
    summary: summarizeOperations(operations),
  };
}

function applyOperationPlan(projectRoot, plan) {
  if (!plan || !Array.isArray(plan.operations)) {
    return {};
  }

  const projectRootReal = fs.realpathSync.native(path.resolve(projectRoot));
  for (const operation of plan.operations) {
    const targetPath = resolveOperationTarget(projectRoot, operation);
    assertOperationTargetContained(projectRootReal, targetPath, operation);

    if (operation.kind === 'ensure_dir') {
      ensureDirectory(targetPath);
      assertOperationTargetContained(projectRootReal, targetPath, operation);
      continue;
    }

    if (operation.kind === 'write_file' || operation.kind === 'update_file') {
      writeManagedFile(targetPath, operation.contents, operation.mode, operation.encoding);
      assertOperationTargetContained(projectRootReal, targetPath, operation);
      continue;
    }

    if (operation.kind === 'remove_file') {
      removeFile(targetPath, projectRoot);
      continue;
    }

    if (operation.kind === 'remove_dir') {
      removeDirectory(targetPath, projectRoot);
      continue;
    }

    if (operation.kind === 'remove_empty_root') {
      removeEmptyRoot(targetPath, projectRoot);
      continue;
    }

  }

  return {};
}

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function writeManagedFile(filePath, contents, mode, encoding) {
  if (encoding === 'buffer' && Buffer.isBuffer(contents)) {
    writeFileAtomic(filePath, contents);
  } else {
    writeFileAtomic(filePath, contents || '', 'utf8');
  }
  if (typeof mode === 'number') {
    fs.chmodSync(filePath, mode);
  }
}

function resolveOperationTarget(projectRoot, operation) {
  const targetPath = path.resolve(projectRoot, operation.path || '');
  const projectRootResolved = path.resolve(projectRoot);
  if (!isPathWithin(targetPath, projectRootResolved)) {
    throw new Error(`Unsafe operation path outside project root: ${operation.path}`);
  }
  if (
    targetPath === projectRootResolved &&
    ['remove_file', 'remove_dir', 'remove_empty_root'].includes(operation.kind)
  ) {
    throw new Error(`Unsafe operation path targets project root: ${operation.path}`);
  }
  return targetPath;
}

function assertOperationTargetContained(projectRootReal, targetPath, operation) {
  const nearest = nearestExistingPath(targetPath);
  const nearestReal = fs.realpathSync.native(nearest);
  if (!isPathWithin(nearestReal, projectRootReal)) {
    throw new Error(`Unsafe operation path escapes project root through symlink: ${operation.path}`);
  }
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

function removeEmptyRoot(directoryPath, projectRoot) {
  if (!fs.existsSync(directoryPath)) {
    return;
  }

  if (fs.readdirSync(directoryPath).length > 0) {
    return;
  }

  fs.rmdirSync(directoryPath);
  removeEmptyParents(path.dirname(directoryPath), projectRoot);
}

function removeFile(filePath, projectRoot) {
  fs.rmSync(filePath, { force: true });
  removeEmptyParents(path.dirname(filePath), projectRoot);
}

function removeDirectory(directoryPath, projectRoot) {
  fs.rmSync(directoryPath, { recursive: true, force: true });
  removeEmptyParents(path.dirname(directoryPath), projectRoot);
}

function removeEmptyParents(startPath, stopRoot) {
  // path.resolve 统一分隔符，path.relative 做包含性判断（比 startsWith 更健壮，
  // 避免 Windows 下大小写不一致或混用分隔符导致的误判）
  const stopResolved = path.resolve(stopRoot);
  let current = path.resolve(startPath);
  while (current !== stopResolved) {
    const rel = path.relative(stopResolved, current);
    if (!rel || rel.startsWith('..')) break;

    if (!fs.existsSync(current)) {
      current = path.dirname(current);
      continue;
    }

    const entries = fs.readdirSync(current);
    if (entries.length > 0) break;

    fs.rmdirSync(current);
    current = path.dirname(current);
  }
}

module.exports = {
  applyOperationPlan,
  buildEmptyOperationPlan,
  buildFileWriteOperation,
  buildRelativeOperation,
  buildState,
  clearState,
  getStateFilePath,
  hardResetManagedAssets,
  isLegacyManagedState,
  mergeOperationPlans,
  normalizeOperationPath,
  planEmptyManagedRootCleanup,
  hasSharedSkillsRootConsumer,
  planHardResetManagedAssets,
  planManagedAssetRemoval,
  planObsoleteManagedAssetRemoval,
  planRetiredCommandNamespaceRemoval,
  planRetiredRuntimeAssetPrune,
  readStateFileRaw,
  readState,
  removeManagedAssets,
  removeObsoleteManagedAssets,
  summarizeOperationPlan,
  writeState,
};
