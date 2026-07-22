const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PointerBasedAdapter = require('./pointer-based-adapter');
const { formatInitGuidance } = require('../init-guidance');
const { rewriteSourceSkillRuntimePaths } = require('../skill-path-rewrite-markers');
const { listBundledCommands } = require('../plugin-manifest');
const { readState } = require('../state');
const {
  contentHasUnexpectedRuntimePathReferences,
  rewritePreservingHostComparativeConfigPaths,
} = require('./host-comparative-config-paths');
const { isRuntimeSetupSurface } = require('../runtime-setup-identity');

const CURSOR_RULE_POINTER_PATH = '.cursor/rules/spec-first.mdc';
const CURSOR_ALLOWED_FRONTMATTER_FIELDS = new Set([
  'name',
  'description',
  'paths',
  'disable-model-invocation',
  'metadata',
]);
const CURSOR_NESTED_SCAN_SKIP_DIRS = new Set([
  '.git',
  '.agents',
  '.spec-first',
  '.claude',
  '.codex',
  '.cursor',
  '.kiro',
  '.qoder',
  'node_modules',
  'vendor',
]);
const CURSOR_NESTED_SCAN_MAX_DIRECTORIES = 1000;
const CURSOR_NESTED_SCAN_MAX_MS = 500;

class CursorAdapter extends PointerBasedAdapter {
  get id() {
    return 'cursor';
  }

  get runtimeRoot() {
    return '.cursor';
  }

  get managedRoot() {
    return '.cursor/spec-first';
  }

  get hasCommands() {
    return false;
  }

  get supportsAgents() {
    return false;
  }

  get commandRoot() {
    return '.cursor/commands/spec';
  }

  get skillsRoot() {
    return '.cursor/skills';
  }

  get workflowsRoot() {
    return '.cursor/skills';
  }

  get agentsRoot() {
    return '.cursor/agents';
  }

  get stateFile() {
    return '.cursor/spec-first/state.json';
  }

  get instructionFile() {
    return 'AGENTS.md';
  }

  get pointerPath() {
    return CURSOR_RULE_POINTER_PATH;
  }

  get pointerHostLabel() {
    return 'Cursor';
  }

  get pointerFrontmatter() {
    return [
      '---',
      'alwaysApply: true',
      '---',
    ].join('\n');
  }

  transformSkillContent(content, context = {}) {
    const isEntrypoint = isSkillEntrypointContext(context);
    let transformed = isEntrypoint
      ? rewritePreservingHostComparativeConfigPaths(content, context, rewriteSharedPaths)
      : content;
    if (isEntrypoint) {
      transformed = normalizeCursorSkillFrontmatter(transformed, context);
    }
    if (isEntrypoint && isCursorRuntimeSetupSurface(context)) {
      transformed = addCursorSetupHostPin(transformed);
    }
    const runtimeSkillRoot = context.runtimeSkillRoot
      || (context.isWorkflowSkill ? `${this.workflowsRoot}/${context.skillName}` : '');
    return runtimeSkillRoot
      ? rewriteSourceSkillRuntimePaths(transformed, context.skillName, runtimeSkillRoot)
      : transformed;
  }

  inspect(projectRoot) {
    const runtimeDir = path.join(projectRoot, this.runtimeRoot);
    const skillsDir = path.join(projectRoot, this.skillsRoot);
    const stateFilePath = path.join(projectRoot, this.stateFile);

    return {
      platform: this.id,
      runtimeExists: fs.existsSync(runtimeDir),
      commands: false,
      skills: fs.existsSync(skillsDir),
      agents: false,
      state: fs.existsSync(stateFilePath),
    };
  }

  inspectRuntimeFiles(projectRoot) {
    const checks = [];
    const commandRoot = path.join(projectRoot, this.commandRoot);
    const skillsRoot = path.join(projectRoot, this.skillsRoot);
    const agentsRoot = path.join(projectRoot, this.agentsRoot);

    checks.push({
      level: 'WARNING',
      name: 'Cursor generated-runtime preview',
      message: 'Cursor skill discovery/invocation is not verified on this machine; generated skills may not load.',
      drift: false,
      degradedByDesign: true,
      reasonCode: 'cursor_generated_runtime_loader_unverified',
      fix: 'Open Cursor runtime UI or run a current Cursor CLI/user journey to record loader evidence before promoting beyond generated-runtime preview.',
    });

    if (fs.existsSync(commandRoot)) {
      checks.push({
        level: 'WARNING',
        name: this.commandRoot,
        message: 'unexpected Cursor command runtime directory present; Cursor P0 uses generated spec-* workflow runtime assets, not generated command files',
        fix: formatInitGuidance('cursor', 'in this project to refresh Cursor spec-* runtime assets'),
      });
    }
    if (fs.existsSync(agentsRoot)) {
      checks.push({
        level: 'WARNING',
        name: this.agentsRoot,
        message: 'unexpected Cursor agents runtime directory present; Cursor P0 does not project spec-first agents',
        fix: formatInitGuidance('cursor', 'in this project to refresh Cursor preview runtime assets'),
      });
    }
    if (fs.existsSync(skillsRoot)) {
      checks.push(...inspectCursorSkillNames(projectRoot, skillsRoot));
    }
    checks.push(this.inspectPointerRuntime(projectRoot));
    checks.push(...inspectCursorDuplicateSkillRoots(projectRoot, this));

    return checks.length > 0
      ? checks
      : [{
        level: 'PASS',
        name: 'Cursor runtime shape',
        message: 'no Cursor-specific runtime drift detected',
      }];
  }

}

module.exports = CursorAdapter;
module.exports.CURSOR_RULE_POINTER_PATH = CURSOR_RULE_POINTER_PATH;
module.exports.normalizeCursorName = normalizeCursorName;
module.exports.inspectCursorDuplicateSkillRoots = inspectCursorDuplicateSkillRoots;

function rewriteSharedPaths(content) {
  const rewritten = content
    .replace(/\.claude\/commands\/spec\/([a-z-]+)\.md/g, (_match, commandName) => {
      return `.cursor/skills/spec-${commandName}/SKILL.md`;
    })
    .replace(/\.claude\/commands\/spec-([a-z-]+)\.md/g, (_match, commandName) => {
      return `.cursor/skills/spec-${commandName}/SKILL.md`;
    })
    .replace(/\.codex\/commands\/spec\/([a-z-]+)\.md/g, (_match, commandName) => {
      return `.cursor/skills/spec-${commandName}/SKILL.md`;
    })
    .replace(/\.kiro\/commands\/spec\/([a-z-]+)\.md/g, (_match, commandName) => {
      return `.cursor/skills/spec-${commandName}/SKILL.md`;
    })
    .replace(/\.kiro\/commands\/spec\/\*\*/g, '.cursor/skills/**')
    .replace(/\.kiro\/commands\/spec-\*\.md/g, '.cursor/skills/**')
    .replace(/\.qoder\/commands\/spec\/([a-z-]+)\.md/g, (_match, commandName) => {
      return `.cursor/skills/spec-${commandName}/SKILL.md`;
    })
    .replace(/\.qoder\/commands\/spec-([a-z-]+)\.md/g, (_match, commandName) => {
      return `.cursor/skills/spec-${commandName}/SKILL.md`;
    })
    .replace(/\.qoder\/commands\/spec-\*\.md/g, '.cursor/skills/**')
    .replace(/\.qoder\/commands\/spec\/\*\*/g, '.cursor/skills/**')
    .replace(/\.claude\/spec-first\/workflows\//g, '.cursor/skills/')
    .replace(/\.claude\/skills\//g, '.cursor/skills/')
    .replace(/\.codex\/skills\//g, '.cursor/skills/')
    .replace(/\.agents\/skills\//g, '.cursor/skills/')
    .replace(/\.kiro\/skills\//g, '.cursor/skills/')
    .replace(/\.qoder\/skills\//g, '.cursor/skills/')
    .replace(/\.claude\/agents\//g, '.cursor/agents/')
    .replace(/\.codex\/agents\//g, '.cursor/agents/')
    .replace(/\.kiro\/agents\//g, '.cursor/agents/')
    .replace(/\.qoder\/agents\//g, '.cursor/agents/')
    .replace(/\.kiro\/spec-first\//g, '.cursor/spec-first/')
    .replace(/\.qoder\/spec-first\//g, '.cursor/spec-first/')
    .replace(/\.kiro\/settings\/\*\*/g, '.cursor/mcp.json')
    .replace(/\$HOME\/\.kiro\/settings\/mcp\.json/g, '$HOME/.cursor/mcp.json')
    .replace(/~\/\.kiro\/settings\/mcp\.json/g, '~/.cursor/mcp.json')
    .replace(/\.kiro\/settings\/mcp\.json/g, '.cursor/mcp.json')
    .replace(/\.qoder\/settings\.local\.json/g, '.cursor/mcp.json')
    .replace(/~\/\.qoder\/settings\.json/g, '~/.cursor/mcp.json')
    .replace(/spec-first\s+init\s+--codex/g, 'spec-first init --cursor')
    .replace(/spec-first\s+clean\s+--codex/g, 'spec-first clean --cursor')
    .replace(/\$spec-\*/g, '`spec-*`')
    .replace(/\/spec:\*/g, '`spec-*`')
    .replace(/\$spec-runtime-setup/g, '`spec-runtime-setup`')
    .replace(/\/spec:runtime-setup/g, '`spec-runtime-setup`')
    .replace(/Kiro Agent\s+Skills/g, '`spec-*`')
    .replace(/Kiro Agent\s+Skill `spec-runtime-setup`/g, '`spec-runtime-setup`')
    .replace(/Qoder project (?:commands|entrypoints)\s+or\s+Skills/g, '`spec-*`')
    .replace(/Qoder `(?:\/spec:runtime-setup|spec-runtime-setup)` entrypoint/g, '`spec-runtime-setup`');
  return rewriteCursorRuntimeContextSections(rewriteUsingSpecFirstCursorSections(rewritten));
}

function rewriteUsingSpecFirstCursorSections(content) {
  return content
    .replace(
      /- Claude Code installs it as `\.cursor\/skills\/using-spec-first\/SKILL\.md`[\s\S]*?\n- Codex installs it as `\.cursor\/skills\/using-spec-first\/SKILL\.md`.*?\n/,
      '- Cursor installs it as `.cursor/skills/using-spec-first/SKILL.md` and also reads the managed block in `AGENTS.md`; its generated runtime remains a preview until loader evidence is recorded.\n',
    )
    .replace(
      /Runtime copies under .*? are generated mirrors\. Repair stale or missing runtime guidance with `spec-first init` after choosing the target host; do not hand-edit generated mirrors as the source of truth\. Cursor-native `\.cursor\/rules\/\*\*` \/ `\.cursor\/agents\/\*\*`, Kiro-native `\.kiro\/specs\/\*\*`, and Qoder-native `\.qoder\/rules\/\*\*` remain advisory input only when explicitly named\./,
      'Runtime copies under `.cursor/skills/`, `.cursor/spec-first/`, and `.cursor/mcp.json` are generated runtime or host-local config outputs for this host. Repair stale or missing runtime guidance with `spec-first init --cursor`, and do not hand-edit generated mirrors as the source of truth. Cursor-native `.cursor/rules/**` / `.cursor/agents/**` remain advisory input only when explicitly named.',
    )
    .replace(
      /Ordinary context routing follows `docs\/contracts\/context-governance\.md`: `\.spec-first\/audits\/\*\*`, `\.spec-first\/governance\/\*\*`, and generated mirrors \(.*?\) are excluded from default workflow context\. Route to setup\/update\/runtime-drift\/audit\/governance-health workflows, or require a precise user-named path, before treating those directories as evidence\. Cursor-native `\.cursor\/rules\/\*\*` \/ `\.cursor\/agents\/\*\*`, Kiro-native `\.kiro\/specs\/\*\*`, and Qoder-native `\.qoder\/rules\/\*\*` remain advisory input only when explicitly named\./,
      'Ordinary context routing follows `docs/contracts/context-governance.md`: `.spec-first/audits/**`, `.spec-first/governance/**`, and generated mirrors (`.cursor/skills/**`, `.cursor/spec-first/**`, `.cursor/mcp.json`) are excluded from default workflow context. Route to setup/update/runtime-drift/audit/governance-health workflows, or require a precise user-named path, before treating those directories as evidence. Cursor-native `.cursor/rules/**` / `.cursor/agents/**` remain advisory input only when explicitly named.',
    );
}

function rewriteCursorRuntimeContextSections(content) {
  return content
    .replace(
      /generated mirrors \([^)\n]*\)/g,
      'generated mirrors (`.cursor/skills/**`, `.cursor/spec-first/**`, `.cursor/mcp.json`)',
    )
    .replace(
      /generated mirrors（[^）\n]*）/g,
      'generated mirrors（`.cursor/skills/**`、`.cursor/spec-first/**`、`.cursor/mcp.json`）',
    )
    .replace(
      /Cursor-native `\.cursor\/rules\/\*\*` \/ `\.cursor\/agents\/\*\*`, Kiro-native `\.kiro\/specs\/\*\*`, and Qoder-native `\.qoder\/rules\/\*\*` (?:remain|are) advisory input only when explicitly named\./g,
      'Cursor-native `.cursor/rules/**` / `.cursor/agents/**` remain advisory input only when explicitly named.',
    )
    .replace(
      /Cursor-native `\.cursor\/rules\/\*\*` \/ `\.cursor\/agents\/\*\*`、Kiro-native `\.kiro\/specs\/\*\*` 与 Qoder-native `\.qoder\/rules\/\*\*` 只有显式点名时作为 advisory input。/g,
      'Cursor-native `.cursor/rules/**` / `.cursor/agents/**` 只有显式点名时作为 advisory input。',
    );
}

function normalizeCursorSkillFrontmatter(content, context = {}) {
  if (!content.startsWith('---\n')) {
    return content;
  }
  const { frontmatter, body } = splitMarkdownFrontmatter(content);
  if (!frontmatter) {
    return content;
  }

  const fields = parseSimpleFrontmatterFields(frontmatter);
  const name = normalizeCursorName(context.runtimeName || context.skillName || fields.name);
  const description = sanitizeFrontmatterScalar(fields.description || `spec-first skill ${name}`);
  const lines = [
    '---',
    `name: ${name}`,
    `description: ${JSON.stringify(description)}`,
  ];

  const pathsValue = fields.paths || fields.globs;
  if (pathsValue) {
    lines.push(`paths: ${pathsValue}`);
  }
  if (context.isWorkflowSkill || context.isInternalSkill || fields['disable-model-invocation'] === 'true') {
    lines.push('disable-model-invocation: true');
  }
  if (fields.metadata) {
    lines.push(`metadata: ${fields.metadata}`);
  }
  lines.push('---', '');
  return `${lines.join('\n')}${body.trimStart()}`;
}

function isCursorRuntimeSetupSurface(context = {}) {
  return isRuntimeSetupSurface(context);
}

function isSkillEntrypointContext(context = {}) {
  return typeof context.relativePath !== 'string'
    || context.relativePath.replace(/\\/g, '/') === 'SKILL.md';
}

function addCursorSetupHostPin(content) {
  if (content.includes('## Cursor Host Pin')) {
    return content;
  }

  return content.replace(/## Workflow Modes\n/, [
    '## Cursor Host Pin',
    '',
    'When this generated Cursor `spec-runtime-setup` runtime surface invokes `skills/spec-runtime-setup/scripts/*`, set `MCP_SETUP_HOST=cursor` in the script environment. Do not rely on automatic host detection from PATH, because Claude Code, Codex, Kiro, Qoder, and Cursor CLIs can coexist on the same machine.',
    '',
    '## Workflow Modes',
    '',
  ].join('\n'));
}

function splitMarkdownFrontmatter(content) {
  if (!content.startsWith('---\n')) {
    return { frontmatter: '', body: content };
  }

  const closingIndex = content.indexOf('\n---', 4);
  if (closingIndex === -1) {
    return { frontmatter: '', body: content };
  }

  return {
    frontmatter: content.slice(4, closingIndex),
    body: content.slice(closingIndex + 5),
  };
}

function parseSimpleFrontmatterFields(frontmatter) {
  const fields = {};

  for (const line of String(frontmatter || '').split('\n')) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    fields[match[1]] = unquoteFrontmatterScalar(match[2].trim());
  }

  return fields;
}

function unquoteFrontmatterScalar(value) {
  if (
    (value.startsWith('"') && value.endsWith('"'))
    || (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function normalizeCursorName(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_]+|[-_]+$/g, '')
    .slice(0, 64);
  return normalized || 'spec-first';
}

function sanitizeFrontmatterScalar(value) {
  return String(value || '')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1024);
}

function inspectCursorSkillNames(projectRoot, skillsRoot) {
  return listSkillDirs(skillsRoot)
    .flatMap((skillDir) => {
      const skillPath = path.join(skillsRoot, skillDir, 'SKILL.md');
      if (!fs.existsSync(skillPath)) return [];
      const content = fs.readFileSync(skillPath, 'utf8');
      const { frontmatter } = splitMarkdownFrontmatter(content);
      const fields = parseSimpleFrontmatterFields(frontmatter);
      const relativePath = path.relative(projectRoot, skillPath).replace(/\\/g, '/');
      const issues = [];
      const frontmatterKeys = listFrontmatterKeys(frontmatter);
      if (fields.name !== skillDir) issues.push(`name does not match folder (${fields.name || '<missing>'})`);
      if (!fields.description) issues.push('missing description');
      if (frontmatterKeys.some((field) => !CURSOR_ALLOWED_FRONTMATTER_FIELDS.has(field))) {
        issues.push('contains non-Cursor frontmatter fields');
      }
      if (fields.name && String(fields.name).length > 64) issues.push('name exceeds 64 characters');
      if (isPublicWorkflowSkillName(skillDir) && fields['disable-model-invocation'] !== 'true') {
        issues.push('workflow skill must set disable-model-invocation: true');
      }
      if ((skillDir === 'spec-runtime-setup') && !content.includes('MCP_SETUP_HOST=cursor')) {
        issues.push('missing Cursor MCP_SETUP_HOST pin');
      }
      if (contentHasUnexpectedRuntimePathReferences('cursor', content, { skillName: skillDir })) {
        issues.push('contains non-Cursor runtime path references');
      }
      return issues.length === 0
        ? [{
          level: 'PASS',
          name: relativePath,
          message: 'Cursor skill frontmatter is valid',
        }]
        : [{
          level: 'WARNING',
          name: relativePath,
          message: issues.join('; '),
          fix: formatInitGuidance('cursor', 'in this project to regenerate Cursor skill runtime assets'),
        }];
    });
}

function listFrontmatterKeys(frontmatter) {
  return String(frontmatter || '')
    .split('\n')
    .map((line) => {
      const match = line.match(/^([A-Za-z0-9_-]+):/);
      return match ? match[1] : '';
    })
    .filter(Boolean);
}

function isPublicWorkflowSkillName(skillName) {
  return governedWorkflowSkillNames().has(String(skillName || ''));
}

let governedWorkflowSkillNamesCache = null;
function governedWorkflowSkillNames() {
  if (governedWorkflowSkillNamesCache === null) {
    governedWorkflowSkillNamesCache = new Set(
      listBundledCommands().map((command) => command.skill),
    );
  }
  return governedWorkflowSkillNamesCache;
}

function inspectCursorDuplicateSkillRoots(projectRoot, adapter) {
  const duplicateRoots = collectCursorSkillRoots(projectRoot);
  const bySkill = new Map();
  for (const root of duplicateRoots.roots) {
    if (!fs.existsSync(root.absolutePath)) continue;
    for (const skillName of listSkillDirs(root.absolutePath)) {
      const skillPath = path.join(root.absolutePath, skillName, 'SKILL.md');
      if (!fs.existsSync(skillPath)) continue;
      const entries = bySkill.get(skillName) || [];
      entries.push({
        ...root,
        skillName,
        skillPath,
        content: fs.readFileSync(skillPath, 'utf8'),
        managed: isManagedSkillRoot(projectRoot, root, skillName, adapter),
      });
      bySkill.set(skillName, entries);
    }
  }

  const checks = [];
  const managedDivergentGroups = [];
  for (const [skillName, entries] of bySkill.entries()) {
    if (entries.length < 2) continue;
    const allManaged = entries.every((entry) => entry.managed);
    const identical = new Set(entries.map((entry) => normalizeContentForComparison(entry.content))).size === 1;
    if (allManaged && identical) {
      continue;
    }
    if (allManaged) {
      managedDivergentGroups.push({ skillName, entries });
      continue;
    }

    checks.push({
      level: 'WARNING',
      name: `Cursor duplicate skill discovery: ${skillName}`,
      message: `same-name skill found in Cursor-compatible roots: ${entries.map((entry) => entry.displayPath).join(', ')}; Cursor precedence is unverified and at least one entry is outside its current spec-first-managed runtime root`,
      fix: 'Remove or rename the unmanaged duplicate, or rerun spec-first init for the host that owns a stale compatibility path.',
      drift: false,
      reasonCode: 'cursor_external_skill_precedence_unverified',
    });
  }

  if (managedDivergentGroups.length > 0) {
    const rootCounts = countManagedProjectionRoots(managedDivergentGroups);
    checks.push({
      level: 'WARNING',
      name: 'Cursor managed skill projection precedence',
      message: `${managedDivergentGroups.length} same-name skill projection(s) are not byte-identical across Cursor-compatible managed roots: ${formatRootCounts(rootCounts)}; Cursor precedence is unverified and may select a non-Cursor host projection`,
      fix: 'Keep the managed host runtimes intact and verify that Cursor prioritizes .cursor/skills; do not delete other host projections to silence this warning.',
      drift: false,
      degradedByDesign: true,
      reasonCode: 'cursor_managed_projection_precedence_unverified',
    });
  }

  if (duplicateRoots.limitWarnings.length > 0) {
    checks.push({
      level: 'WARNING',
      name: 'Cursor nested skill root scan',
      message: `nested_roots_not_fully_enumerated (${duplicateRoots.limitWarnings.join(', ')})`,
      fix: 'Inspect nested workspace Cursor skill roots manually if duplicate discovery behavior matters for this project.',
      drift: false,
      reasonCode: 'cursor_nested_skill_roots_partial',
    });
  }

  return checks;
}

function collectCursorSkillRoots(projectRoot) {
  const home = process.env.HOME || os.homedir();
  const roots = [
    projectSkillRoot(projectRoot, '.cursor/skills', 'project'),
    projectSkillRoot(projectRoot, '.agents/skills', 'project_compat'),
    projectSkillRoot(projectRoot, '.claude/skills', 'project_compat'),
    projectSkillRoot(projectRoot, '.codex/skills', 'project_compat'),
    userSkillRoot(home, '.cursor/skills', 'user'),
    userSkillRoot(home, '.agents/skills', 'user_compat'),
    userSkillRoot(home, '.claude/skills', 'user_compat'),
    userSkillRoot(home, '.codex/skills', 'user_compat'),
  ];
  const nested = collectNestedCursorSkillRoots(projectRoot);
  return {
    roots: dedupeRoots([...roots, ...nested.roots]),
    limitWarnings: nested.limitWarnings,
  };
}

function projectSkillRoot(projectRoot, relativePath, scope) {
  return {
    absolutePath: path.join(projectRoot, relativePath),
    displayPath: relativePath,
    relativePath,
    scope,
  };
}

function userSkillRoot(home, relativePath, scope) {
  return {
    absolutePath: path.join(home, relativePath),
    displayPath: `~/${relativePath}`,
    relativePath,
    scope,
  };
}

function collectNestedCursorSkillRoots(projectRoot) {
  const roots = [];
  const limitWarnings = [];
  const startedAt = Date.now();
  let directoryCount = 0;
  let stopped = false;

  function stopForDurationBudget() {
    if (Date.now() - startedAt <= CURSOR_NESTED_SCAN_MAX_MS) {
      return false;
    }
    stopped = true;
    limitWarnings.push('max-duration');
    return true;
  }

  function walk(currentPath) {
    if (stopped || stopForDurationBudget()) return;
    directoryCount += 1;
    if (directoryCount > CURSOR_NESTED_SCAN_MAX_DIRECTORIES) {
      stopped = true;
      limitWarnings.push('max-directory-count');
      return;
    }

    let entries;
    try {
      entries = fs.readdirSync(currentPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (stopped || stopForDurationBudget()) break;
      if (!entry.isDirectory()) continue;
      if (entry.isSymbolicLink()) continue;
      if (CURSOR_NESTED_SCAN_SKIP_DIRS.has(entry.name)) continue;
      const childPath = path.join(currentPath, entry.name);
      for (const relativeRoot of ['.cursor/skills', '.agents/skills']) {
        const candidate = path.join(childPath, relativeRoot);
        if (fs.existsSync(candidate)) {
          const displayPath = path.relative(projectRoot, candidate).replace(/\\/g, '/');
          roots.push({
            absolutePath: candidate,
            displayPath,
            relativePath: displayPath,
            scope: 'nested_project',
          });
        }
      }
      walk(childPath);
      if (stopped) break;
    }
  }

  walk(projectRoot);
  return {
    roots: dedupeRoots(roots),
    limitWarnings: [...new Set(limitWarnings)],
  };
}

function dedupeRoots(roots) {
  const seen = new Set();
  return roots.filter((root) => {
    const key = path.resolve(root.absolutePath);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isManagedSkillRoot(projectRoot, root, skillName, cursorAdapter) {
  if (root.scope !== 'project' && root.scope !== 'project_compat') {
    return false;
  }

  const rootPath = root.relativePath;
  if (rootPath === '.cursor/skills') {
    return stateListsSkill(projectRoot, cursorAdapter, skillName, ['skills', 'workflowSkills']);
  }
  if (rootPath === '.agents/skills') {
    return stateListsSkill(projectRoot, adapterForState('codex'), skillName, ['skills', 'workflowSkills']);
  }
  if (rootPath === '.claude/skills') {
    return stateListsSkill(projectRoot, adapterForState('claude'), skillName, ['skills']);
  }
  return false;
}

function adapterForState(platform) {
  const stateFiles = {
    claude: '.claude/spec-first/state.json',
    codex: '.codex/spec-first/state.json',
  };
  return {
    id: platform,
    stateFile: stateFiles[platform],
  };
}

function stateListsSkill(projectRoot, adapter, skillName, fields) {
  try {
    const state = readState(projectRoot, adapter);
    if (!state) return false;
    return fields.some((field) => state[field].includes(skillName));
  } catch {
    return false;
  }
}

function countManagedProjectionRoots(groups) {
  const counts = new Map();
  for (const group of groups) {
    for (const entry of group.entries) {
      counts.set(entry.displayPath, (counts.get(entry.displayPath) || 0) + 1);
    }
  }
  return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right));
}

function formatRootCounts(rootCounts) {
  return rootCounts
    .map(([rootPath, count]) => `${rootPath} (${count})`)
    .join(', ');
}

function normalizeContentForComparison(content) {
  return String(content || '').replace(/\r\n/g, '\n').trim();
}

function listSkillDirs(rootPath) {
  return fs.readdirSync(rootPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}
