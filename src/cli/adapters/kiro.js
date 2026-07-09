const fs = require('node:fs');
const path = require('node:path');

const PlatformAdapter = require('./base');
const {
  buildHostNativePointer,
  inspectHostNativePointer,
  planHostNativePointerRemoval,
  planHostNativePointerSync,
} = require('./host-native-pointer');
const { formatInitGuidance } = require('../init-guidance');
const { rewriteSourceSkillRuntimePaths } = require('../skill-path-rewrite-markers');

const KIRO_STEERING_POINTER_PATH = '.kiro/steering/spec-first.md';
const KIRO_AGENT_READ_TOOLS = ['read'];
const KIRO_UNREWRITTEN_PATH_PATTERNS = [
  /\.claude\/commands\/spec\/[a-z-]+\.md/,
  /\.claude\/commands\/spec-\*\.md/,
  /\.claude\/spec-first\/workflows\//,
  /\.claude\/skills\//,
  /\.claude\/agents\//,
  /\.codex\/commands\/spec\/[a-z-]+\.md/,
  /\.codex\/commands\/spec-\*\.md/,
  /\.codex\/skills\//,
  /\.codex\/agents\//,
  /\.agents\/skills\//,
  /\.cursor\/skills\//,
  /\.cursor\/spec-first\//,
  /\.cursor\/mcp\.json/,
  /\.qoder\/commands\/spec-[a-z-]+\.md/,
  /\.qoder\/commands\/spec-\*\.md/,
  /\.qoder\/commands\/spec\//,
  /\.qoder\/skills\//,
  /\.qoder\/agents\//,
  /\.qoder\/spec-first\//,
  /\.qoder\/settings\.local\.json/,
];

class KiroAdapter extends PlatformAdapter {
  get id() {
    return 'kiro';
  }

  get runtimeRoot() {
    return '.kiro';
  }

  get managedRoot() {
    return '.kiro/spec-first';
  }

  get hasCommands() {
    return false;
  }

  get commandRoot() {
    return '.kiro/commands/spec';
  }

  get skillsRoot() {
    return '.kiro/skills';
  }

  get workflowsRoot() {
    return '.kiro/skills';
  }

  get agentsRoot() {
    return '.kiro/agents';
  }

  get stateFile() {
    return '.kiro/spec-first/state.json';
  }

  get instructionFile() {
    return 'AGENTS.md';
  }

  transformSkillContent(content, context = {}) {
    let transformed = rewriteSkillName(
      rewriteSharedPaths(content),
      kiroRuntimeSkillName(context),
    );
    if (isKiroRuntimeSetupSurface(context)) {
      transformed = addKiroSetupHostPin(transformed);
    }
    const runtimeSkillRoot = context.runtimeSkillRoot
      || (context.isWorkflowSkill ? `${this.workflowsRoot}/${context.skillName}` : '');
    return runtimeSkillRoot
      ? rewriteSourceSkillRuntimePaths(transformed, context.skillName, runtimeSkillRoot)
      : transformed;
  }

  transformAgentContent(content) {
    const { frontmatter, body } = splitMarkdownFrontmatter(content);
    const fields = parseSimpleFrontmatterFields(frontmatter);
    const name = normalizeKiroName(fields.name || fields.agent || 'spec-first-agent');
    const description = sanitizeFrontmatterScalar(fields.description || `spec-first agent ${name}`);
    const transformedBody = rewriteSharedPaths(body || content);

    return [
      '---',
      `name: ${name}`,
      `description: ${JSON.stringify(description)}`,
      `tools: [${KIRO_AGENT_READ_TOOLS.map((tool) => JSON.stringify(tool)).join(', ')}]`,
      '---',
      '',
      transformedBody.trimStart(),
    ].join('\n');
  }

  inspect(projectRoot) {
    const runtimeDir = path.join(projectRoot, this.runtimeRoot);
    const skillsDir = path.join(projectRoot, this.skillsRoot);
    const agentsDir = path.join(projectRoot, this.agentsRoot);
    const stateFilePath = path.join(projectRoot, this.stateFile);

    return {
      platform: this.id,
      runtimeExists: fs.existsSync(runtimeDir),
      commands: false,
      skills: fs.existsSync(skillsDir),
      agents: fs.existsSync(agentsDir),
      state: fs.existsSync(stateFilePath),
    };
  }

  inspectRuntimeFiles(projectRoot) {
    const checks = [];
    const skillsRoot = path.join(projectRoot, this.skillsRoot);
    const agentsRoot = path.join(projectRoot, this.agentsRoot);

    if (fs.existsSync(path.join(projectRoot, this.commandRoot))) {
      checks.push({
        level: 'WARNING',
        name: this.commandRoot,
        message: 'unexpected Kiro command runtime directory present; Kiro P0 uses generated spec-* workflow runtime assets, not generated command files',
        fix: formatInitGuidance('kiro', 'in this project to refresh Kiro spec-* runtime assets'),
      });
    }

    if (fs.existsSync(skillsRoot)) {
      checks.push(...inspectKiroSkillNames(projectRoot, skillsRoot));
    }
    if (fs.existsSync(agentsRoot)) {
      checks.push(...inspectKiroAgentFrontmatter(projectRoot, agentsRoot));
    }
    checks.push(inspectHostNativePointer(projectRoot, KIRO_STEERING_POINTER_PATH, {
      hostId: this.id,
      hostLabel: 'Kiro',
    }));

    return checks.length > 0
      ? checks
      : [{
        level: 'PASS',
        name: 'Kiro runtime shape',
        message: 'no Kiro-specific runtime drift detected',
      }];
  }

  planRuntimeFilesSync(projectRoot) {
    return planHostNativePointerSync(
      projectRoot,
      KIRO_STEERING_POINTER_PATH,
      buildHostNativePointer({
        hostLabel: 'Kiro',
        initCommand: 'spec-first init --kiro',
      }),
    );
  }

  planRuntimeFilesRemoval(projectRoot) {
    return planHostNativePointerRemoval(projectRoot, KIRO_STEERING_POINTER_PATH);
  }
}

module.exports = KiroAdapter;
module.exports.KIRO_STEERING_POINTER_PATH = KIRO_STEERING_POINTER_PATH;
module.exports.KIRO_AGENT_READ_TOOLS = KIRO_AGENT_READ_TOOLS;
module.exports.normalizeKiroName = normalizeKiroName;

function rewriteSharedPaths(content) {
  const rewritten = content
    .replace(/\.claude\/commands\/spec\/([a-z-]+)\.md/g, (_match, commandName) => {
      return `.kiro/skills/spec-${commandName}/SKILL.md`;
    })
    .replace(/\.claude\/commands\/spec-\*\.md/g, '.kiro/skills/**')
    .replace(/\.codex\/commands\/spec\/([a-z-]+)\.md/g, (_match, commandName) => {
      return `.kiro/skills/spec-${commandName}/SKILL.md`;
    })
    .replace(/\.codex\/commands\/spec-\*\.md/g, '.kiro/skills/**')
    .replace(/\.cursor\/skills\//g, '.kiro/skills/')
    .replace(/\.cursor\/spec-first\//g, '.kiro/spec-first/')
    .replace(/\.cursor\/mcp\.json/g, '.kiro/settings/mcp.json')
    .replace(/\.qoder\/commands\/spec\/([a-z-]+)\.md/g, (_match, commandName) => {
      return `.kiro/skills/spec-${commandName}/SKILL.md`;
    })
    .replace(/\.qoder\/commands\/spec-([a-z-]+)\.md/g, (_match, commandName) => {
      return `.kiro/skills/spec-${commandName}/SKILL.md`;
    })
    .replace(/\.qoder\/commands\/spec-\*\.md/g, '.kiro/skills/**')
    .replace(/\.qoder\/commands\/spec\/\*\*/g, '.kiro/skills/**')
    .replace(/\.claude\/spec-first\/workflows\//g, '.kiro/skills/')
    .replace(/\.claude\/skills\//g, '.kiro/skills/')
    .replace(/\.codex\/skills\//g, '.kiro/skills/')
    .replace(/\.agents\/skills\//g, '.kiro/skills/')
    .replace(/\.qoder\/skills\//g, '.kiro/skills/')
    .replace(/\.claude\/agents\//g, '.kiro/agents/')
    .replace(/\.codex\/agents\//g, '.kiro/agents/')
    .replace(/\.cursor\/agents\//g, '.kiro/agents/')
    .replace(/\.qoder\/agents\//g, '.kiro/agents/')
    .replace(/\.qoder\/spec-first\//g, '.kiro/spec-first/')
    .replace(/\.qoder\/settings\.local\.json/g, '.kiro/settings/mcp.json')
    .replace(/spec-first\s+init\s+--codex/g, 'spec-first init --kiro')
    .replace(/spec-first\s+clean\s+--codex/g, 'spec-first clean --kiro')
    .replace(/\$spec-\*/g, '`spec-*`')
    .replace(/\$spec-mcp-setup/g, '`spec-mcp-setup`');
  return rewriteKiroRuntimeContextSections(rewriteUsingSpecFirstKiroSections(rewritten));
}

function rewriteUsingSpecFirstKiroSections(content) {
  return content
    .replace(
      /- Claude Code installs it as `\.kiro\/skills\/using-spec-first\/SKILL\.md`[\s\S]*?\n- Codex installs it as `\.kiro\/skills\/using-spec-first\/SKILL\.md`.*?\n/,
      '- Kiro installs it as `.kiro/skills/using-spec-first/SKILL.md` and also reads the managed block in `AGENTS.md`; its generated runtime exposes the same `spec-*` workflow names as the user entrypoint surface.\n',
    )
    .replace(
      /Runtime copies under .*? are generated mirrors\. Repair stale or missing runtime guidance with `spec-first init` after choosing the target host; do not hand-edit generated mirrors as the source of truth\. Cursor-native `\.cursor\/rules\/\*\*` \/ `\.cursor\/agents\/\*\*`, Kiro-native `\.kiro\/specs\/\*\*`, and Qoder-native `\.qoder\/rules\/\*\*` remain advisory input only when explicitly named\./,
      'Runtime copies under `.kiro/skills/`, `.kiro/agents/`, `.kiro/spec-first/`, and spec-first managed `.kiro/settings/` are generated runtime or host-local config outputs for this host. Repair stale or missing runtime guidance with `spec-first init --kiro`, and do not hand-edit generated mirrors as the source of truth. Kiro-native `.kiro/specs/**` remains advisory input only when explicitly named.',
    )
    .replace(
      /Ordinary context routing follows `docs\/contracts\/context-governance\.md`: `\.spec-first\/audits\/\*\*`, `\.spec-first\/governance\/\*\*`, and generated mirrors \(.*?\) are excluded from default workflow context\. Route to setup\/update\/runtime-drift\/audit\/governance-health workflows, or require a precise user-named path, before treating those directories as evidence\. Cursor-native `\.cursor\/rules\/\*\*` \/ `\.cursor\/agents\/\*\*`, Kiro-native `\.kiro\/specs\/\*\*`, and Qoder-native `\.qoder\/rules\/\*\*` remain advisory input only when explicitly named\./,
      'Ordinary context routing follows `docs/contracts/context-governance.md`: `.spec-first/audits/**`, `.spec-first/governance/**`, and generated mirrors (`.kiro/skills/**`, `.kiro/agents/**`, `.kiro/spec-first/**`, `.kiro/settings/**`) are excluded from default workflow context. Route to setup/update/runtime-drift/audit/governance-health workflows, or require a precise user-named path, before treating those directories as evidence. Kiro-native `.kiro/specs/**` remains advisory input only when explicitly named.',
    );
}

function rewriteKiroRuntimeContextSections(content) {
  return content
    .replace(
      /generated mirrors \([^)\n]*\)/g,
      'generated mirrors (`.kiro/skills/**`, `.kiro/agents/**`, `.kiro/spec-first/**`, `.kiro/settings/**`)',
    )
    .replace(
      /generated mirrors（[^）\n]*）/g,
      'generated mirrors（`.kiro/skills/**`、`.kiro/agents/**`、`.kiro/spec-first/**`、`.kiro/settings/**`）',
    )
    .replace(
      /Cursor-native `\.cursor\/rules\/\*\*` \/ `\.cursor\/agents\/\*\*`, Kiro-native `\.kiro\/specs\/\*\*`, and Qoder-native `\.qoder\/rules\/\*\*` (?:remain|are) advisory input only when explicitly named\./g,
      'Kiro-native `.kiro/specs/**` remains advisory input only when explicitly named.',
    )
    .replace(
      /Cursor-native `\.cursor\/rules\/\*\*` \/ `\.kiro\/agents\/\*\*`, Kiro-native `\.kiro\/specs\/\*\*`, and Qoder-native `\.qoder\/rules\/\*\*` (?:remain|are) advisory input only when explicitly named\./g,
      'Kiro-native `.kiro/specs/**` remains advisory input only when explicitly named.',
    )
    .replace(
      /Cursor-native `\.cursor\/rules\/\*\*` \/ `\.cursor\/agents\/\*\*`、Kiro-native `\.kiro\/specs\/\*\*` 与 Qoder-native `\.qoder\/rules\/\*\*` 只有显式点名时作为 advisory input。/g,
      'Kiro-native `.kiro/specs/**` 只有显式点名时作为 advisory input。',
    );
}

function rewriteSkillName(content, skillName) {
  if (!skillName) {
    return content;
  }

  return content.replace(/^name:\s*.+$/m, `name: ${skillName}`);
}

function kiroRuntimeSkillName(context = {}) {
  return normalizeKiroName(context.skillName);
}

function isKiroRuntimeSetupSurface(context = {}) {
  return context.skillName === 'spec-mcp-setup';
}

function addKiroSetupHostPin(content) {
  if (content.includes('## Kiro Host Pin')) {
    return content;
  }

  return content.replace(/## Workflow Modes\n/, [
    '## Kiro Host Pin',
    '',
    'When this generated Kiro `spec-mcp-setup` runtime surface invokes `skills/spec-mcp-setup/scripts/*`, set `MCP_SETUP_HOST=kiro` in the script environment. Do not rely on automatic host detection from PATH, because Claude Code, Codex, Cursor, Kiro, and Qoder CLIs can coexist on the same machine.',
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

function normalizeKiroName(value) {
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
    .trim();
}

function inspectKiroSkillNames(projectRoot, skillsRoot) {
  return listSkillDirs(skillsRoot)
    .flatMap((skillDir) => {
      const skillPath = path.join(skillsRoot, skillDir, 'SKILL.md');
      if (!fs.existsSync(skillPath)) return [];
      const { frontmatter } = splitMarkdownFrontmatter(fs.readFileSync(skillPath, 'utf8'));
      const fields = parseSimpleFrontmatterFields(frontmatter);
      const relativePath = path.relative(projectRoot, skillPath).replace(/\\/g, '/');
      const issues = [];
      if (fields.name !== skillDir) issues.push(`name does not match folder (${fields.name || '<missing>'})`);
      if (String(fields.name || '').length > 64) issues.push('name exceeds 64 characters');
      if (KIRO_UNREWRITTEN_PATH_PATTERNS.some((pattern) => pattern.test(fs.readFileSync(skillPath, 'utf8')))) {
        issues.push('contains non-Kiro runtime path references');
      }
      return issues.length === 0
        ? [{
          level: 'PASS',
          name: relativePath,
          message: 'Kiro skill frontmatter is valid',
        }]
        : [{
          level: 'WARNING',
          name: relativePath,
          message: issues.join('; '),
          fix: formatInitGuidance('kiro', 'in this project to regenerate Kiro skill runtime assets'),
        }];
    });
}

function inspectKiroAgentFrontmatter(projectRoot, agentsRoot) {
  return listMarkdownFiles(agentsRoot)
    .filter((filePath) => filePath.endsWith('.agent.md'))
    .flatMap((agentPath) => {
      const content = fs.readFileSync(agentPath, 'utf8');
      const { frontmatter } = splitMarkdownFrontmatter(content);
      const fields = parseSimpleFrontmatterFields(frontmatter);
      const relativePath = path.relative(projectRoot, agentPath).replace(/\\/g, '/');
      const issues = [];
      if (!fields.name) issues.push('missing name');
      if (!fields.description) issues.push('missing description');
      if (!/^tools:\s*\[\s*"read"\s*\]/m.test(frontmatter)) issues.push('tools must default to ["read"]');
      if (/^model:/m.test(frontmatter)) issues.push('model must be omitted by default');
      if (/\b(Read|Grep|Glob|Bash)\b/.test(frontmatter)) issues.push('leaks Claude/Codex tool names');
      return issues.length === 0
        ? [{
          level: 'PASS',
          name: relativePath,
          message: 'Kiro agent frontmatter is valid with read-only default tools',
        }]
        : [{
          level: 'WARNING',
          name: relativePath,
          message: issues.join('; '),
          fix: formatInitGuidance('kiro', 'in this project to regenerate Kiro agent runtime assets'),
        }];
    });
}

function listSkillDirs(rootPath) {
  return fs.readdirSync(rootPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

function listMarkdownFiles(rootPath) {
  const results = [];

  function walk(currentPath) {
    for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
      const entryPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        walk(entryPath);
        continue;
      }
      if (entry.isFile() && entry.name.endsWith('.md')) {
        results.push(entryPath);
      }
    }
  }

  walk(rootPath);
  return results.sort((left, right) => left.localeCompare(right));
}
