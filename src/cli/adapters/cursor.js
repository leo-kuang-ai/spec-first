const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const PlatformAdapter = require('./base');
const { formatInitGuidance } = require('../init-guidance');
const { rewriteSourceSkillRuntimePaths } = require('../skill-path-rewrite-markers');
const { readState } = require('../state');

const CURSOR_ALLOWED_FRONTMATTER_FIELDS = new Set([
  'name',
  'description',
  'paths',
  'disable-model-invocation',
  'metadata',
]);
const CURSOR_UNREWRITTEN_PATH_PATTERNS = [
  /\.claude\/commands\/spec\/[a-z-]+\.md/,
  /\.claude\/commands\/spec-[a-z-]+\.md/,
  /\.claude\/spec-first\/workflows\//,
  /\.claude\/skills\//,
  /\.claude\/agents\//,
  /\.codex\/commands\/spec\/[a-z-]+\.md/,
  /\.codex\/skills\//,
  /\.codex\/agents\//,
  /\.agents\/skills\//,
  /\.kiro\/commands\/spec\/[a-z-]+\.md/,
  /\.kiro\/skills\//,
  /\.kiro\/agents\//,
  /\.kiro\/spec-first\//,
  /\.kiro\/settings\//,
  /\.qoder\/commands\/spec\/[a-z-]+\.md/,
  /\.qoder\/commands\/spec-[a-z-]+\.md/,
  /\.qoder\/skills\//,
  /\.qoder\/agents\//,
  /\.qoder\/spec-first\//,
  /\.qoder\/settings(?:\.local)?\.json/,
];
const CURSOR_NESTED_SCAN_SKIP_DIRS = new Set([
  '.git',
  '.spec-first',
  '.claude',
  '.codex',
  '.cursor',
  '.kiro',
  '.qoder',
  'node_modules',
  'vendor',
]);
const CURSOR_NESTED_SCAN_MAX_DEPTH = 4;
const CURSOR_NESTED_SCAN_MAX_DIRECTORIES = 400;
const CURSOR_NESTED_SCAN_MAX_MS = 500;

class CursorAdapter extends PlatformAdapter {
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

  transformSkillContent(content, context = {}) {
    let transformed = normalizeCursorSkillFrontmatter(
      rewriteSharedPaths(content),
      context,
    );
    if (isCursorRuntimeSetupSurface(context)) {
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
      fix: 'Open Cursor Skills UI or run a current Cursor CLI/user journey to record loader evidence before promoting beyond generated-runtime preview.',
    });

    if (fs.existsSync(commandRoot)) {
      checks.push({
        level: 'WARNING',
        name: this.commandRoot,
        message: 'unexpected Cursor command runtime directory present; Cursor P0 uses Agent Skills, not generated commands',
        fix: formatInitGuidance('cursor', 'in this project to refresh Cursor Agent Skill runtime assets'),
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
module.exports.normalizeCursorName = normalizeCursorName;
module.exports.inspectCursorDuplicateSkillRoots = inspectCursorDuplicateSkillRoots;

function rewriteSharedPaths(content) {
  return content
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
    .replace(/\.qoder\/commands\/spec\/([a-z-]+)\.md/g, (_match, commandName) => {
      return `.cursor/skills/spec-${commandName}/SKILL.md`;
    })
    .replace(/\.qoder\/commands\/spec-([a-z-]+)\.md/g, (_match, commandName) => {
      return `.cursor/skills/spec-${commandName}/SKILL.md`;
    })
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
    .replace(/\$spec-\*/g, 'Cursor Agent Skills')
    .replace(/\/spec:\*/g, 'Cursor Agent Skills')
    .replace(/\$spec-mcp-setup/g, 'Cursor Agent Skill `spec-mcp-setup`')
    .replace(/\/spec:mcp-setup/g, 'Cursor Agent Skill `spec-mcp-setup`')
    .replace(/Kiro Agent Skills/g, 'Cursor Agent Skills')
    .replace(/Kiro Agent Skill `spec-mcp-setup`/g, 'Cursor Agent Skill `spec-mcp-setup`')
    .replace(/Qoder project commands or Skills/g, 'Cursor Agent Skills')
    .replace(/Qoder project command `(?:\/spec:mcp-setup|spec-mcp-setup)` or Skill `spec-mcp-setup`/g, 'Cursor Agent Skill `spec-mcp-setup`');
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
  if (context.isWorkflowSkill || fields['disable-model-invocation'] === 'true') {
    lines.push('disable-model-invocation: true');
  }
  if (fields.metadata) {
    lines.push(`metadata: ${fields.metadata}`);
  }
  lines.push('---', '');
  return `${lines.join('\n')}${body.trimStart()}`;
}

function isCursorRuntimeSetupSurface(context = {}) {
  return context.skillName === 'spec-mcp-setup';
}

function addCursorSetupHostPin(content) {
  if (content.includes('## Cursor Host Pin')) {
    return content;
  }

  return content.replace(/## Workflow Modes\n/, [
    '## Cursor Host Pin',
    '',
    'When this generated Cursor Agent Skill invokes `skills/spec-mcp-setup/scripts/*`, set `MCP_SETUP_HOST=cursor` in the script environment. Do not rely on automatic host detection from PATH, because Claude Code, Codex, Kiro, Qoder, and Cursor CLIs can coexist on the same machine.',
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
      if (skillDir === 'spec-mcp-setup' && !content.includes('MCP_SETUP_HOST=cursor')) {
        issues.push('missing Cursor MCP_SETUP_HOST pin');
      }
      if (CURSOR_UNREWRITTEN_PATH_PATTERNS.some((pattern) => pattern.test(content))) {
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
  return String(skillName || '').startsWith('spec-');
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
  for (const [skillName, entries] of bySkill.entries()) {
    if (entries.length < 2) continue;
    const allManaged = entries.every((entry) => entry.managed);
    const identical = new Set(entries.map((entry) => normalizeContentForComparison(entry.content))).size === 1;
    if (allManaged && identical) {
      continue;
    }

    checks.push({
      level: 'WARNING',
      name: `Cursor duplicate skill discovery: ${skillName}`,
      message: `same-name skill found in Cursor-compatible roots: ${entries.map((entry) => entry.displayPath).join(', ')}; precedence is unverified and at least one root is unmanaged or divergent`,
      fix: 'Remove or rename unmanaged duplicate skills, or rerun spec-first init for managed roots that should match current source.',
    });
  }

  if (duplicateRoots.limitWarnings.length > 0) {
    checks.push({
      level: 'WARNING',
      name: 'Cursor nested skill root scan',
      message: `nested_roots_not_fully_enumerated (${duplicateRoots.limitWarnings.join(', ')})`,
      fix: 'Inspect nested workspace Cursor skill roots manually if duplicate discovery behavior matters for this project.',
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
    roots: [...roots, ...nested.roots],
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

  function walk(currentPath, depth) {
    if (stopped) return;
    if (Date.now() - startedAt > CURSOR_NESTED_SCAN_MAX_MS) {
      stopped = true;
      limitWarnings.push('max-duration');
      return;
    }
    if (depth > CURSOR_NESTED_SCAN_MAX_DEPTH) {
      return;
    }
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
      if (depth === CURSOR_NESTED_SCAN_MAX_DEPTH) {
        limitWarnings.push('max-depth');
        continue;
      }
      walk(childPath, depth + 1);
    }
  }

  walk(projectRoot, 0);
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
  const rootPath = root.relativePath;
  if (rootPath === '.cursor/skills') {
    return stateListsSkill(projectRoot, cursorAdapter, skillName);
  }
  if (rootPath === '.agents/skills') {
    return stateListsSkill(projectRoot, adapterForState('codex'), skillName);
  }
  if (rootPath === '.claude/skills') {
    return stateListsSkill(projectRoot, adapterForState('claude'), skillName);
  }
  if (rootPath === '.codex/skills') {
    return stateListsSkill(projectRoot, adapterForState('codex'), skillName);
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

function stateListsSkill(projectRoot, adapter, skillName) {
  try {
    const state = readState(projectRoot, adapter);
    if (!state) return false;
    return state.skills.includes(skillName) || state.workflowSkills.includes(skillName);
  } catch {
    return false;
  }
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
