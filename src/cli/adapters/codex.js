const fs = require('node:fs');
const path = require('node:path');

const PlatformAdapter = require('./base');
const { formatInitGuidance } = require('../init-guidance');
const {
  isHostComparativeRuntimeSkill,
} = require('../host-comparative-workflows');
const { rewriteSourceSkillRuntimePaths } = require('../skill-path-rewrite-markers');
const { listBundledAgentNames, listBundledSkills } = require('../plugin');
const { isCodexHomeProjectRoot, effectiveCodexHome } = require('../helpers/global-config-dir');
const { isRuntimeSetupSurface } = require('../runtime-setup-identity');
const SESSION_START_TEMPLATE_PATH = path.join(__dirname, '..', '..', '..', 'templates', 'codex', 'hooks', 'session-start');
const SESSION_START_CMD_TEMPLATE_PATH = path.join(__dirname, '..', '..', '..', 'templates', 'codex', 'hooks', 'session-start.cmd');
const HOOKS_JSON_TEMPLATE_PATH = path.join(__dirname, '..', '..', '..', 'templates', 'codex', 'hooks', 'hooks.json');
const SESSION_START_RELATIVE_PATH = '.codex/hooks/session-start';
const SESSION_START_CMD_RELATIVE_PATH = '.codex/hooks/session-start.cmd';
// Codex project 层 hook 配置发现路径为 `<projectRoot>/.codex/hooks.json`
// (codex-rs hooks discovery 用 config_folder.join("hooks.json"),config_folder = .codex/;
//  带 hooks/ 子目录的 hooks/hooks.json 仅用于 plugin 层,不适用于 project 层)。
const HOOKS_JSON_RELATIVE_PATH = '.codex/hooks.json';
const SESSION_START_CLI_PLACEHOLDER = '__SPEC_FIRST_CLI_PATH__';
const SESSION_START_COMMAND_PLACEHOLDER = '__CODEX_SESSION_START_COMMAND__';
const SESSION_START_COMMAND_WINDOWS_PLACEHOLDER = '__CODEX_SESSION_START_COMMAND_WINDOWS__';
const SESSION_START_NODE_PLACEHOLDER = '__CODEX_SESSION_START_NODE__';
const TRUSTED_SPEC_FIRST_CLI_PATH = path.join(__dirname, '..', '..', '..', 'bin', 'spec-first.js');

/**
 * Codex platform adapter
 *
 * Codex support is project-scoped:
 * - user-visible workflow entrypoints are discovered from `.agents/skills/`
 * - `.codex/commands/spec/` is treated as a legacy compatibility layer cleanup target only
 * - reusable reviewer/research agent profiles live in `.codex/agents/`
 * - spec-first state remains under `.codex/spec-first/`
 */
class CodexAdapter extends PlatformAdapter {
  get id() {
    return 'codex';
  }

  get runtimeRoot() {
    return '.codex';
  }

  get managedRoot() {
    return '.codex/spec-first';
  }

  get hasCommands() {
    return false;
  }

  get commandRoot() {
    return '.codex/commands/spec';
  }

  get skillsRoot() {
    return '.agents/skills';
  }

  get workflowsRoot() {
    return '.agents/skills';
  }

  get agentsRoot() {
    return '.codex/agents';
  }

  get stateFile() {
    return '.codex/spec-first/state.json';
  }

  get instructionFile() {
    return 'AGENTS.md';
  }

  get legacyCommandRoot() {
    return '.codex/spec-first/commands';
  }

  get legacyCodexSkillsRoot() {
    return '.codex/skills';
  }

  get legacyMarketplaceRoot() {
    return '.agents/plugins';
  }

  get legacyPluginRoot() {
    return 'plugins/spec';
  }

  get legacyPluginRootAlt() {
    return 'plugins/spec-first';
  }

  transformSkillContent(content, context = {}) {
    const isEntrypoint = isSkillEntrypointContext(context);
    const sharedPathContent = !isEntrypoint || shouldPreserveHostComparativeRuntimeProse(context)
      ? content
      : rewriteSharedPaths(content);
    let transformed = transformCodexContent(sharedPathContent);
    if (isEntrypoint) {
      transformed = rewriteSkillName(transformed, codexRuntimeSkillName(context));
    }
    if (isEntrypoint && isCodexRuntimeSetupSurface(context)) {
      transformed = addCodexSetupHostPin(transformed);
    }
    const runtimeSkillRoot = context.runtimeSkillRoot
      || (context.isWorkflowSkill ? `${this.workflowsRoot}/${context.skillName}` : '');
    const withRuntimePaths = runtimeSkillRoot
      ? rewriteSourceSkillRuntimePaths(transformed, context.skillName, runtimeSkillRoot)
      : transformed;
    return context.skillName === 'using-spec-first'
      ? preserveUsingSpecFirstHostInstallNotes(withRuntimePaths)
      : withRuntimePaths;
  }

  transformAgentContent(content) {
    return transformCodexContent(rewriteSharedPaths(content));
  }

  inspect(projectRoot) {
    const runtimeDir = path.join(projectRoot, this.runtimeRoot);
    const commandDir = path.join(projectRoot, this.commandRoot);
    const skillsDir = path.join(projectRoot, this.skillsRoot);
    const agentsDir = path.join(projectRoot, this.agentsRoot);
    const stateFilePath = path.join(projectRoot, this.stateFile);

    return {
      platform: this.id,
      runtimeExists: fs.existsSync(runtimeDir),
      commands: this.hasCommands ? fs.existsSync(commandDir) : false,
      skills: fs.existsSync(skillsDir),
      agents: fs.existsSync(agentsDir),
      state: fs.existsSync(stateFilePath),
    };
  }

  planRuntimeFilesSync(projectRoot) {
    // Skip SessionStart hook writes when this projectRoot's .codex IS the Codex global hook
    // directory (CODEX_HOME). Writing hooks there registers a global SessionStart that fires
    // for every project, double-injecting alongside each project's own hook. skills/agents/
    // AGENTS.md still install; only the hook write is skipped.
    const skipHookWrite = isCodexHomeProjectRoot(projectRoot);
    const operations = [
      ...buildRuntimeCleanupOperations(this),
      ...(skipHookWrite ? [] : buildRuntimeHookWriteOperations(projectRoot)),
    ];

    return {
      operations,
      summary: summarizeOperations(operations),
      skippedHookWrite: skipHookWrite,
    };
  }

  planRuntimeFilesRemoval(projectRoot) {
    const operations = [
      ...buildRuntimeCleanupOperations(this),
      {
        kind: 'remove_file',
        path: SESSION_START_RELATIVE_PATH.replace(/\\/g, '/'),
        reason: 'managed_runtime_hook',
      },
      {
        kind: 'remove_file',
        path: SESSION_START_CMD_RELATIVE_PATH.replace(/\\/g, '/'),
        reason: 'managed_runtime_hook',
      },
    ];
    const renderedHooksJson = renderHooksJsonRemoval(projectRoot);
    operations.push(renderedHooksJson.existsAfter
      ? {
        kind: 'update_file',
        path: HOOKS_JSON_RELATIVE_PATH.replace(/\\/g, '/'),
        reason: 'managed_runtime_hook',
        contents: renderedHooksJson.contents,
      }
      : {
        kind: 'remove_file',
        path: HOOKS_JSON_RELATIVE_PATH.replace(/\\/g, '/'),
        reason: 'managed_runtime_hook',
      });
    return {
      operations,
      summary: summarizeOperations(operations),
    };
  }

  inspectRuntimeFiles(projectRoot) {
    if (isCodexHomeProjectRoot(projectRoot)) {
      return [
        inspectSkippedCodexHomeHook(SESSION_START_RELATIVE_PATH),
        inspectSkippedCodexHomeHook(SESSION_START_CMD_RELATIVE_PATH),
        inspectSkippedCodexHomeHook(HOOKS_JSON_RELATIVE_PATH),
      ];
    }

    return [
      inspectSessionStartHook(projectRoot),
      inspectSessionStartCommandHook(projectRoot),
      inspectHooksJson(projectRoot),
    ];
  }

  removeRuntimeFiles(projectRoot) {
    removeManagedDirectory(path.join(projectRoot, this.commandRoot), projectRoot);
    removeManagedDirectory(path.join(projectRoot, this.legacyCommandRoot), projectRoot);
    removeLegacyCodexSpecFirstSkills(projectRoot, this);
    removeManagedFile(path.join(projectRoot, SESSION_START_RELATIVE_PATH), projectRoot);
    removeManagedFile(path.join(projectRoot, SESSION_START_CMD_RELATIVE_PATH), projectRoot);
    removeManagedHooksJson(projectRoot);
  }
}

module.exports = CodexAdapter;
module.exports.detectGlobalCodexHookPollution = detectGlobalCodexHookPollution;

function rewriteSharedPaths(content) {
  const rewritten = content
    .replace(/\.claude\/commands\/spec\/([a-z-]+)\.md/g, (_match, commandName) => {
      return `.agents/skills/spec-${commandName}/SKILL.md`;
    })
    .replace(/\.codex\/commands\/spec\/([a-z-]+)\.md/g, (_match, commandName) => {
      return `.agents/skills/spec-${commandName}/SKILL.md`;
    })
    .replace(/\.claude\/spec-first\/workflows\//g, '.agents/skills/')
    .replace(/\.claude\/skills\//g, '.agents/skills/')
    .replace(/\.codex\/skills\//g, '.agents/skills/')
    .replace(/\.claude\/agents\//g, '.codex/agents/')
    .replace(/\.codex\/agents\//g, '.codex/agents/')
    .replace(
      /(spec-first\s+(?:init|clean)\s+--codex\s+#\s*)Claude 运行时/g,
      '$1Codex 运行时',
    )
    .replace(
      /(spec-first\s+(?:init|clean)\s+--codex\s+#\s*)Claude runtime/gi,
      '$1Codex runtime',
    )
    .replace(
      /^(spec-first\s+(?:init|clean)\s+--codex\s+#\s*Codex 运行时)\n(?:spec-first\s+(?:init|clean)\s+--codex\s+#\s*Codex 运行时)$/gm,
      '$1',
    )
    .replace(
      /^(spec-first\s+(?:init|clean)\s+--codex\s+#\s*Codex runtime)\n(?:spec-first\s+(?:init|clean)\s+--codex\s+#\s*Codex runtime)$/gm,
      '$1',
    );
  return rewriteCodexRuntimeContextSections(rewritten);
}

function rewriteCodexRuntimeContextSections(content) {
  return content
    .replace(
      /generated mirrors \([^)\n]*\)/g,
      'generated mirrors (`.codex/**`, `.agents/skills/**`)',
    )
    .replace(
      /generated mirrors（[^）\n]*）/g,
      'generated mirrors（`.codex/**`、`.agents/skills/**`）',
    )
    .replace(
      /Cursor-native `\.cursor\/rules\/\*\*` \/ `\.cursor\/agents\/\*\*`, Kiro-native `\.kiro\/specs\/\*\*`, and Qoder-native `\.qoder\/rules\/\*\*` (?:remain|are) advisory input only when explicitly named\./g,
      'Host-native advisory paths from other runtimes are not default context unless explicitly named.',
    )
    .replace(
      /Cursor-native `\.cursor\/rules\/\*\*` \/ `\.cursor\/agents\/\*\*`、Kiro-native `\.kiro\/specs\/\*\*` 与 Qoder-native `\.qoder\/rules\/\*\*` 只有显式点名时作为 advisory input。/g,
      '其他宿主原生 advisory artifact 只有显式点名时作为 advisory input。',
    );
}

function shouldPreserveHostComparativeRuntimeProse(context = {}) {
  return context.isWorkflowSkill && isHostComparativeRuntimeSkill(context.skillName);
}

function isCodexRuntimeSetupSurface(context = {}) {
  return isRuntimeSetupSurface(context);
}

function isSkillEntrypointContext(context = {}) {
  return typeof context.relativePath !== 'string'
    || context.relativePath.replace(/\\/g, '/') === 'SKILL.md';
}

function addCodexSetupHostPin(content) {
  if (content.includes('## Codex Host Pin')) {
    return content;
  }

  return content.replace(/## Workflow Modes\n/, [
    '## Codex Host Pin',
    '',
    'When this generated Codex Skill invokes `skills/spec-runtime-setup/scripts/*`, set `MCP_SETUP_HOST=codex` in the script environment. Do not rely on automatic host detection from PATH, because Claude Code, Codex, Kiro, Qoder, and Cursor CLIs can coexist on the same machine.',
    '',
    '## Workflow Modes',
    '',
  ].join('\n'));
}

function preserveUsingSpecFirstHostInstallNotes(content) {
  return content.replace(
    'Claude Code installs it as `.agents/skills/using-spec-first/SKILL.md`',
    'Claude Code installs it as `.claude/skills/using-spec-first/SKILL.md`',
  );
}

function transformCodexContent(content) {
  let transformed = content;

  transformed = transformed.replace(
    bundledAgentReferencePattern(),
    (_match, agentName) => `\`.codex/agents/${agentName}.agent.md\``,
  );

  return transformed;
}

// 用已注册 agent 名集合(确定性事实源)而非启发式后缀白名单做反引号引用重写,
// 避免新增 agent 用了白名单外后缀时在 Codex runtime 静默漏重写。
let bundledAgentReferencePatternCache = null;
function bundledAgentReferencePattern() {
  if (bundledAgentReferencePatternCache === null) {
    // 长名优先,避免互为前缀的 agent 名发生短匹配截断。
    const names = listBundledAgentNames()
      .slice()
      .sort((a, b) => b.length - a.length)
      .map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    // 空集合时退化为永不匹配的正则,避免 `(${''})` => `\`()\`` 误吞所有反引号对(含代码围栏)。
    bundledAgentReferencePatternCache = names.length === 0
      ? /(?!)/g
      : new RegExp(`\`(${names.join('|')})\``, 'g');
  }
  return bundledAgentReferencePatternCache;
}

function rewriteSkillName(content, skillName) {
  if (!skillName) {
    return content;
  }

  return content.replace(/^name:\s*.+$/m, `name: ${skillName}`);
}

function buildRuntimeHookWriteOperations(projectRoot) {
  const sessionStartTarget = path.join(projectRoot, SESSION_START_RELATIVE_PATH);
  const sessionStartCommandTarget = path.join(projectRoot, SESSION_START_CMD_RELATIVE_PATH);
  const hooksJsonTarget = path.join(projectRoot, HOOKS_JSON_RELATIVE_PATH);
  return [
    {
      kind: fs.existsSync(sessionStartTarget) ? 'update_file' : 'write_file',
      path: SESSION_START_RELATIVE_PATH.replace(/\\/g, '/'),
      reason: 'managed_runtime_hook',
      contents: renderSessionStartHookTemplate(),
      mode: 0o755,
    },
    {
      kind: fs.existsSync(sessionStartCommandTarget) ? 'update_file' : 'write_file',
      path: SESSION_START_CMD_RELATIVE_PATH.replace(/\\/g, '/'),
      reason: 'managed_runtime_hook',
      contents: renderSessionStartCommandHookTemplate(),
      mode: 0o755,
    },
    {
      kind: fs.existsSync(hooksJsonTarget) ? 'update_file' : 'write_file',
      path: HOOKS_JSON_RELATIVE_PATH.replace(/\\/g, '/'),
      reason: 'managed_runtime_hook',
      contents: renderHooksJsonTemplate(projectRoot),
    },
  ];
}

function inspectSessionStartHook(projectRoot) {
  const targetPath = path.join(projectRoot, SESSION_START_RELATIVE_PATH);
  if (!fs.existsSync(targetPath)) {
    return {
      level: 'WARNING',
      name: SESSION_START_RELATIVE_PATH,
      message: 'missing',
      fix: formatInitGuidance('codex', 'in this project to install the managed SessionStart hook'),
    };
  }

  const actual = fs.readFileSync(targetPath, 'utf8');
  const expected = renderSessionStartHookTemplate();
  if (actual !== expected) {
    return {
      level: 'WARNING',
      name: SESSION_START_RELATIVE_PATH,
      message: 'drifted from bundled template',
      fix: formatInitGuidance('codex', 'in this project to restore the managed SessionStart hook'),
    };
  }

  return {
    level: 'PASS',
    name: SESSION_START_RELATIVE_PATH,
    message: 'managed SessionStart hook present',
  };
}

function inspectSessionStartCommandHook(projectRoot) {
  const targetPath = path.join(projectRoot, SESSION_START_CMD_RELATIVE_PATH);
  if (!fs.existsSync(targetPath)) {
    return {
      level: 'WARNING',
      name: SESSION_START_CMD_RELATIVE_PATH,
      // Annotate as Windows-only: this wrapper is exercised only when Codex runs on Windows,
      // so on macOS/Linux a missing wrapper is advisory, not a functional break.
      message: 'missing (Windows hook wrapper; only required when Codex runs on Windows)',
      fix: formatInitGuidance('codex', 'in this project to install the managed Windows SessionStart hook wrapper'),
    };
  }

  const actual = fs.readFileSync(targetPath, 'utf8');
  const expected = renderSessionStartCommandHookTemplate();
  if (actual !== expected) {
    return {
      level: 'WARNING',
      name: SESSION_START_CMD_RELATIVE_PATH,
      message: 'drifted from bundled template',
      fix: formatInitGuidance('codex', 'in this project to restore the managed Windows SessionStart hook wrapper'),
    };
  }

  return {
    level: 'PASS',
    name: SESSION_START_CMD_RELATIVE_PATH,
    message: 'managed Windows SessionStart hook wrapper present',
  };
}

function inspectHooksJson(projectRoot) {
  const targetPath = path.join(projectRoot, HOOKS_JSON_RELATIVE_PATH);
  if (!fs.existsSync(targetPath)) {
    return {
      level: 'WARNING',
      name: HOOKS_JSON_RELATIVE_PATH,
      message: 'missing',
      fix: formatInitGuidance('codex', 'in this project to install the managed SessionStart hook config'),
    };
  }

  const actual = readJsonFile(targetPath);
  if (!actual.ok) {
    return {
      level: 'WARNING',
      name: HOOKS_JSON_RELATIVE_PATH,
      message: 'invalid JSON',
      fix: formatInitGuidance('codex', 'in this project to restore the managed SessionStart hook config'),
    };
  }

  if (!hasManagedSessionStartHook(actual.value, projectRoot)) {
    // Distinguish "a managed entry exists but is outdated" from "no managed entry at all".
    // An outdated entry is the common upgrade case: a baked node path / project path / host
    // changed, so the stored command no longer equals the current expected command. The hook
    // genuinely will not launch as-is, so this stays a WARNING (not a false PASS), but the
    // message and fix tell the user re-init will refresh it rather than implying it is absent.
    const outdated = hasOutdatedManagedSessionStartHook(actual.value, projectRoot);
    return {
      level: 'WARNING',
      name: HOOKS_JSON_RELATIVE_PATH,
      message: outdated
        ? 'managed SessionStart hook config is outdated (run init to refresh after a node/project/host change)'
        : 'missing managed SessionStart hook config',
      fix: formatInitGuidance('codex', outdated
        ? 'in this project to refresh the outdated managed SessionStart hook config'
        : 'in this project to restore the managed SessionStart hook config'),
    };
  }

  return {
    level: 'PASS',
    name: HOOKS_JSON_RELATIVE_PATH,
    message: 'managed SessionStart hook config present',
  };
}

function inspectSkippedCodexHomeHook(relativePath) {
  return {
    level: 'PASS',
    name: relativePath,
    message: 'managed SessionStart hook intentionally skipped because project .codex is CODEX_HOME',
  };
}

function renderSessionStartHookTemplate() {
  const template = fs.readFileSync(SESSION_START_TEMPLATE_PATH, 'utf8');
  // Function replacement: a string replacement would interpret $&/$`/$'/$$/$n in the
  // baked path (e.g. an install dir containing `$&`), corrupting the generated hook.
  return template.replace(
    JSON.stringify(SESSION_START_CLI_PLACEHOLDER),
    () => JSON.stringify(TRUSTED_SPEC_FIRST_CLI_PATH),
  );
}

function renderSessionStartCommandHookTemplate() {
  // Function replacement: keep $&/$$ in the node path literal instead of letting
  // String.prototype.replace treat them as replacement patterns.
  return fs.readFileSync(SESSION_START_CMD_TEMPLATE_PATH, 'utf8').replace(
    SESSION_START_NODE_PLACEHOLDER,
    () => escapeBatchFileLiteral(process.execPath),
  );
}

function renderHooksJsonTemplate(projectRoot) {
  // Function replacements: a string replacement would interpret $&/$`/$'/$$/$n in a
  // projectRoot containing those sequences, corrupting the generated hooks.json.
  const template = fs.readFileSync(HOOKS_JSON_TEMPLATE_PATH, 'utf8')
    .replace(
      JSON.stringify(SESSION_START_COMMAND_PLACEHOLDER),
      () => JSON.stringify(formatSessionStartCommand(projectRoot)),
    )
    .replace(
      JSON.stringify(SESSION_START_COMMAND_WINDOWS_PLACEHOLDER),
      () => JSON.stringify(formatWindowsSessionStartCommand(projectRoot)),
    );
  const managed = JSON.parse(template);
  const existingPath = path.join(projectRoot, HOOKS_JSON_RELATIVE_PATH);
  const existing = readJsonFile(existingPath);
  return `${JSON.stringify(mergeHooksJson(existing.ok ? existing.value : null, managed, projectRoot), null, 2)}\n`;
}

function renderHooksJsonRemoval(projectRoot) {
  const existingPath = path.join(projectRoot, HOOKS_JSON_RELATIVE_PATH);
  const existing = readJsonFile(existingPath);
  if (!existing.ok || !isPlainObject(existing.value)) {
    return { existsAfter: false, contents: '' };
  }

  const cleaned = removeManagedHooksJsonEntries(existing.value, projectRoot);
  // Removing the file once no managed hook entries remain would also discard unrelated top-level
  // keys the user keeps in .codex/hooks.json. Keep it whenever anything user-owned survives.
  const hasUserTopLevelKeys = Object.keys(cleaned).some((key) => key !== 'hooks');
  return hasAnyHookEntries(cleaned) || hasUserTopLevelKeys
    ? { existsAfter: true, contents: `${JSON.stringify(cleaned, null, 2)}\n` }
    : { existsAfter: false, contents: '' };
}

function removeManagedHooksJson(projectRoot) {
  const target = path.join(projectRoot, HOOKS_JSON_RELATIVE_PATH);
  if (!fs.existsSync(target)) return;
  const rendered = renderHooksJsonRemoval(projectRoot);
  if (rendered.existsAfter) {
    fs.writeFileSync(target, rendered.contents, 'utf8');
    return;
  }
  removeManagedFile(target, projectRoot);
}

function removeManagedHooksJsonEntries(hooksJson, projectRoot) {
  const cleaned = { ...hooksJson };
  const hooks = isPlainObject(hooksJson.hooks) ? hooksJson.hooks : {};
  cleaned.hooks = {};
  for (const [eventName, entries] of Object.entries(hooks)) {
    if (!Array.isArray(entries)) continue;
    const remaining = stripManagedSessionStartHooksFromEntries(entries, projectRoot);
    if (remaining.length > 0) {
      cleaned.hooks[eventName] = remaining;
    }
  }
  return cleaned;
}

function hasAnyHookEntries(hooksJson) {
  const hooks = isPlainObject(hooksJson && hooksJson.hooks) ? hooksJson.hooks : {};
  return Object.values(hooks).some((entries) => Array.isArray(entries) && entries.length > 0);
}

function buildLegacyCodexSpecFirstSkillCleanupOperations(adapter) {
  return legacyCodexSpecFirstSkillNames()
    .map((skillName) => `${adapter.legacyCodexSkillsRoot}/${skillName}`)
    .map((relativePath) => ({
      kind: 'remove_dir',
      path: relativePath.replace(/\\/g, '/'),
      reason: 'legacy_codex_spec_first_skill_cleanup',
    }));
}

function removeLegacyCodexSpecFirstSkills(projectRoot, adapter) {
  for (const skillName of legacyCodexSpecFirstSkillNames()) {
    removeManagedDirectory(path.join(projectRoot, adapter.legacyCodexSkillsRoot, skillName), projectRoot);
  }
}

// Only spec-first's own namespace is removable here. A legacy Codex layout also installed
// unprefixed copies (`plan`, `work`, `debug`, ...), but those names are indistinguishable from a
// user's own skills, so they are left in place rather than deleted by name.
function legacyCodexSpecFirstSkillNames() {
  const names = new Set();
  for (const skillName of listBundledSkills()) {
    if (skillName === 'graphify') continue;
    names.add(skillName);
  }
  return [...names].filter((name) => name !== 'graphify').sort();
}

function summarizeOperations(operations) {
  return operations.reduce((summary, operation) => {
    summary[operation.kind] = (summary[operation.kind] || 0) + 1;
    return summary;
  }, {});
}

function removeManagedFile(filePath, projectRoot) {
  fs.rmSync(filePath, { force: true });
  removeEmptyParents(path.dirname(filePath), projectRoot);
}

function codexRuntimeSkillName(context = {}) {
  return context.skillName;
}

function buildRuntimeCleanupOperations(adapter) {
  const operations = [
    adapter.commandRoot,
    adapter.legacyCommandRoot,
  ].map((relativePath) => ({
    kind: 'remove_dir',
    path: relativePath,
    reason: 'managed_runtime_cleanup',
  }));

  operations.push(...buildLegacyCodexSpecFirstSkillCleanupOperations(adapter));
  return operations;
}

// `.agents/plugins` and `plugins/spec*` were historical compatibility locations, but no emitted
// marker or state file distinguishes a former spec-first install from a user's plugin with a
// coincidentally similar name. They are therefore mixed-ownership surfaces: preserve them and
// let the owner remove them explicitly. Only `.codex/**` paths have path-level ownership proof.

function readJsonFile(filePath) {
  try {
    return { ok: true, value: JSON.parse(fs.readFileSync(filePath, 'utf8')) };
  } catch (error) {
    return { ok: false, error };
  }
}

function mergeHooksJson(existing, managed, projectRoot) {
  const merged = isPlainObject(existing) ? { ...existing } : {};
  const existingHooks = isPlainObject(existing && existing.hooks) ? existing.hooks : {};
  const managedHooks = isPlainObject(managed && managed.hooks) ? managed.hooks : {};
  merged.hooks = { ...existingHooks };

  for (const [eventName, managedEntries] of Object.entries(managedHooks)) {
    const existingEntries = Array.isArray(existingHooks[eventName]) ? existingHooks[eventName] : [];
    merged.hooks[eventName] = [
      ...stripManagedSessionStartHooksFromEntries(existingEntries, projectRoot),
      ...managedEntries,
    ];
  }

  return merged;
}

function hasManagedSessionStartHook(hooksJson, projectRoot) {
  return managedSessionStartEntries(hooksJson)
    .some((entry) => isCurrentManagedSessionStartEntry(entry, projectRoot));
}

// Detect whether the Codex global hook directory (CODEX_HOME) carries a spec-first-managed
// SessionStart hook. When it does, that global hook fires for EVERY project alongside the
// project's own hook -> per-session double injection. Matching uses isManagedSessionStartHook,
// which is stale-tolerant: the global entry is typically a bare home-rooted path written by a
// prior `init` in the home/CODEX_HOME directory, so it never equals the current project's
// exact command. Read-only; never mutates.
function detectGlobalCodexHookPollution() {
  const codexHome = effectiveCodexHome();
  const hooksJsonPath = path.join(codexHome, 'hooks.json');
  if (!fs.existsSync(hooksJsonPath)) {
    return { polluted: false, codexHome, hooksJsonPath };
  }
  const parsed = readJsonFile(hooksJsonPath);
  if (!parsed.ok) {
    return { polluted: false, codexHome, hooksJsonPath, invalidJson: true };
  }
  // Use stale-tolerant managed-path matching here: any spec-first SessionStart command stored
  // in CODEX_HOME/hooks.json is global pollution, even if it points at a prior project path.
  const polluted = managedSessionStartEntries(parsed.value).some((entry) => (
    Array.isArray(entry.hooks)
    && entry.hooks.some((hook) => isManagedSessionStartHook(hook, codexHome))
  ));
  return { polluted, codexHome, hooksJsonPath };
}

// A managed SessionStart entry is present (matched loosely by the managed path/shape) but is
// not the current exact entry -- i.e. it was written by a prior init under a different node
// path, project path, or host. Used to give doctor an "outdated" message instead of "missing".
function hasOutdatedManagedSessionStartHook(hooksJson, projectRoot) {
  return managedSessionStartEntries(hooksJson).some((entry) => (
    Array.isArray(entry.hooks)
    && entry.hooks.some((hook) => isManagedSessionStartHook(hook, projectRoot))
    && !isCurrentManagedSessionStartEntry(entry, projectRoot)
  ));
}

function managedSessionStartEntries(hooksJson) {
  return hooksJson
    && hooksJson.hooks
    && Array.isArray(hooksJson.hooks.SessionStart)
    ? hooksJson.hooks.SessionStart
    : [];
}

function formatSessionStartCommand(projectRoot) {
  return [
    shellQuote(process.execPath),
    shellQuote(normalizeSessionStartCommandPath(projectRoot)),
  ].join(' ');
}

function formatWindowsSessionStartCommand(projectRoot) {
  return windowsCommandQuote(path.join(projectRoot, SESSION_START_CMD_RELATIVE_PATH));
}

function normalizeSessionStartCommandPath(projectRoot) {
  return path.join(projectRoot, SESSION_START_RELATIVE_PATH).replace(/\\/g, '/');
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, "'\\''")}'`;
}

function windowsCommandQuote(value) {
  // Codex itself runs commandWindows through the platform shell (Windows: cmd.exe /C),
  // so commandWindows should be the command body only, not a nested "cmd.exe /c".
  // This value is consumed on a cmd command line, not inside a batch-file body: do not
  // apply % -> %% here. Batch-body escaping lives in escapeBatchFileLiteral.
  return `"${String(value).replace(/"/g, '\\"')}"`;
}

function escapeBatchFileLiteral(value) {
  return String(value).replace(/%/g, '%%');
}

function isManagedSessionStartHook(hook, projectRoot) {
  if (!hook || hook.type !== 'command') {
    return false;
  }
  const expectedCommands = new Set([
    formatSessionStartCommand(projectRoot),
    formatWindowsSessionStartCommand(projectRoot),
  ]);
  return managedSessionStartCommandFields(hook).some((command) => (
    expectedCommands.has(command)
    || isStaleManagedSessionStartCommand(command)
  ));
}

// A managed SessionStart command left by a prior init/machine (different node path,
// project path, or host) that should be cleaned on refresh. Matches only when the managed
// session-start path is the INVOKED program -- optionally behind a `bash`, legacy
// `cmd.exe /d /c`, or quoted-interpreter (node) prefix -- NOT when the path appears as an
// argument inside a larger user command. This mirrors the Claude exact/prefix removal
// contract so a user wrapper like `my-wrapper bash .codex/hooks/session-start && echo`
// is preserved on Codex too.
function isStaleManagedSessionStartCommand(command) {
  const normalized = String(command).replace(/\\/g, '/');
  if (!normalized.includes(SESSION_START_RELATIVE_PATH)) {
    return false;
  }
  const program = normalized
    .replace(/^bash\s+/, '')
    .replace(/^cmd\.exe\s+\/d\s+\/c\s+/, '')
    .replace(/^(["'])[^"']*\1\s+/, '');
  // After the optional interpreter prefix, the managed path must be the program token:
  // - no other token may precede it (front anchor), so a leading user command does not match;
  // - it must END the token, optionally as the `.cmd` Windows wrapper, followed by end /
  //   whitespace / closing quote (back anchor), so a user's own program that merely begins
  //   with the managed path (e.g. `.codex/hooks/session-start-custom.sh`, `session-start.bak`)
  //   is NOT misclassified as spec-first-managed.
  const pathPattern = SESSION_START_RELATIVE_PATH.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // A quoted program is a single token, so its interior may contain spaces -- installation paths
  // like `/Users/me/My Projects/repo` are common, and a whitespace-free prefix class silently
  // fails to recognize them, leaving stale entries to accumulate on every refresh. An unquoted
  // program still ends at the first whitespace, where a space means the managed path is an
  // argument rather than the invoked program.
  const quotedProgram = new RegExp(`^(["'])[^"']*${pathPattern}(\\.cmd)?\\1`);
  const bareProgram = new RegExp(`^[^"'\\s]*${pathPattern}(\\.cmd)?(["'\\s]|$)`);
  return quotedProgram.test(program) || bareProgram.test(program);
}

// Strip managed hooks at HOOK granularity (mirror Claude removeManagedHookEntries): only
// remove the managed hook object(s) from each entry, and drop an entry only when nothing
// else remains. This preserves a user hook co-located in the same SessionStart entry.
function stripManagedSessionStartHooksFromEntries(entries, projectRoot) {
  const preserved = [];
  for (const entry of entries) {
    if (!entry || !Array.isArray(entry.hooks)) {
      preserved.push(entry);
      continue;
    }
    const remainingHooks = entry.hooks.filter((hook) => !isManagedSessionStartHook(hook, projectRoot));
    if (remainingHooks.length === entry.hooks.length) {
      // Nothing managed here (covers a user entry that arrived with an empty hooks array).
      preserved.push(entry);
      continue;
    }
    if (remainingHooks.length === 0) {
      // Entry held only managed hooks -> drop it.
      continue;
    }
    preserved.push({ ...entry, hooks: remainingHooks });
  }
  return preserved;
}

function isCurrentManagedSessionStartEntry(entry, projectRoot) {
  const expectedCommand = formatSessionStartCommand(projectRoot);
  const expectedWindowsCommand = formatWindowsSessionStartCommand(projectRoot);
  return Boolean(entry && Array.isArray(entry.hooks) && entry.hooks.some((hook) => (
    hook
      && hook.type === 'command'
      && hook.command === expectedCommand
      && hook.commandWindows === expectedWindowsCommand
  )));
}

function managedSessionStartCommandFields(hook) {
  return [hook.command, hook.commandWindows, hook.command_windows]
    .filter((command) => typeof command === 'string');
}

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function removeManagedDirectory(directoryPath, projectRoot) {
  fs.rmSync(directoryPath, { recursive: true, force: true });
  removeEmptyParents(path.dirname(directoryPath), projectRoot);
}

function removeEmptyParents(startPath, stopRoot) {
  let current = startPath;
  while (current.startsWith(stopRoot) && current !== stopRoot) {
    if (!fs.existsSync(current)) {
      current = path.dirname(current);
      continue;
    }

    if (fs.readdirSync(current).length > 0) {
      break;
    }

    fs.rmdirSync(current);
    current = path.dirname(current);
  }
}
