const fs = require('node:fs');
const path = require('node:path');

const PlatformAdapter = require('./base');
const { formatInitGuidance } = require('../init-guidance');
const { rewriteSourceSkillRuntimePaths } = require('../skill-path-rewrite-markers');

const QODER_AGENT_BASE_TOOLS = ['Read', 'Grep', 'Glob'];
const QODER_AGENT_WEB_TOOLS = ['WebFetch', 'WebSearch'];
const QODER_UNREWRITTEN_PATH_PATTERNS = [
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
];

class QoderAdapter extends PlatformAdapter {
  get id() {
    return 'qoder';
  }

  get runtimeRoot() {
    return '.qoder';
  }

  get managedRoot() {
    return '.qoder/spec-first';
  }

  get commandRoot() {
    return '.qoder/commands';
  }

  commandFilename(command) {
    return `spec-${command.name}.md`;
  }

  get skillsRoot() {
    return '.qoder/skills';
  }

  get workflowsRoot() {
    return '.qoder/skills';
  }

  get agentsRoot() {
    return '.qoder/agents';
  }

  get stateFile() {
    return '.qoder/spec-first/state.json';
  }

  get instructionFile() {
    return 'AGENTS.md';
  }

  renderCommandContent(command, templateContent, context = {}) {
    if (typeof context.skillContent !== 'string') {
      return this.transformSkillContent(templateContent, context);
    }

    const { body } = splitMarkdownFrontmatter(context.skillContent);
    const description = sanitizeFrontmatterScalar(command.description || context.skillName || command.name);
    const commandDisplayName = path.basename(command.filename || command.name || '', '.md') || command.name;
    const qoderCommand = [
      '---',
      `name: ${normalizeQoderName(commandDisplayName)}`,
      `description: ${JSON.stringify(description)}`,
      '---',
      '',
      body,
    ].join('\n');

    return this.transformSkillContent(qoderCommand, {
      ...context,
      isWorkflowSkill: true,
      runtimeName: commandDisplayName,
    });
  }

  transformSkillContent(content, context = {}) {
    let transformed = rewriteSkillName(
      rewriteSharedPaths(content),
      qoderRuntimeSkillName(context),
    );
    if (isQoderRuntimeSetupSurface(context)) {
      transformed = addQoderSetupHostPin(transformed);
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
    const name = normalizeQoderName(fields.name || fields.agent || 'spec-first-agent');
    const description = sanitizeFrontmatterScalar(fields.description || `spec-first agent ${name}`);
    const transformedBody = rewriteSharedPaths(body || content);
    const tools = qoderAgentTools(fields.tools || '', body);

    return [
      '---',
      `name: ${name}`,
      `description: ${JSON.stringify(description)}`,
      `tools: [${tools.join(', ')}]`,
      '---',
      '',
      transformedBody.trimStart(),
    ].join('\n');
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
      commands: fs.existsSync(commandDir),
      skills: fs.existsSync(skillsDir),
      agents: fs.existsSync(agentsDir),
      state: fs.existsSync(stateFilePath),
    };
  }

  inspectRuntimeFiles(projectRoot) {
    const checks = [];
    const commandRoot = path.join(projectRoot, this.commandRoot);
    const skillsRoot = path.join(projectRoot, this.skillsRoot);
    const agentsRoot = path.join(projectRoot, this.agentsRoot);

    if (fs.existsSync(commandRoot)) {
      checks.push(...inspectQoderCommandFiles(projectRoot, commandRoot));
    }
    if (fs.existsSync(skillsRoot)) {
      checks.push(...inspectQoderSkillNames(projectRoot, skillsRoot));
    }
    if (fs.existsSync(agentsRoot)) {
      checks.push(...inspectQoderAgentFrontmatter(projectRoot, agentsRoot));
    }

    return checks.length > 0
      ? checks
      : [{
        level: 'PASS',
        name: 'Qoder runtime shape',
        message: 'no Qoder-specific runtime drift detected',
      }];
  }

  planRuntimeFilesRemoval() {
    const operations = [{
      kind: 'remove_dir',
      path: '.qoder/commands/spec',
      reason: 'retired_runtime_command_namespace',
    }];

    return {
      operations,
      summary: summarizeOperations(operations),
    };
  }
}

module.exports = QoderAdapter;
module.exports.QODER_AGENT_BASE_TOOLS = QODER_AGENT_BASE_TOOLS;
module.exports.normalizeQoderName = normalizeQoderName;

function rewriteSharedPaths(content) {
  const rewritten = content
    .replace(/\.claude\/commands\/spec\/([a-z-]+)\.md/g, (_match, commandName) => {
      return `.qoder/commands/spec-${commandName}.md`;
    })
    .replace(/\.claude\/commands\/spec-([a-z-]+)\.md/g, (_match, commandName) => {
      return `.qoder/commands/spec-${commandName}.md`;
    })
    .replace(/\.codex\/commands\/spec\/([a-z-]+)\.md/g, (_match, commandName) => {
      return `.qoder/commands/spec-${commandName}.md`;
    })
    .replace(/\.kiro\/commands\/spec\/([a-z-]+)\.md/g, (_match, commandName) => {
      return `.qoder/commands/spec-${commandName}.md`;
    })
    .replace(/\.claude\/spec-first\/workflows\//g, '.qoder/skills/')
    .replace(/\.claude\/skills\//g, '.qoder/skills/')
    .replace(/\.codex\/skills\//g, '.qoder/skills/')
    .replace(/\.agents\/skills\//g, '.qoder/skills/')
    .replace(/\.kiro\/skills\//g, '.qoder/skills/')
    .replace(/\.claude\/agents\//g, '.qoder/agents/')
    .replace(/\.codex\/agents\//g, '.qoder/agents/')
    .replace(/\.kiro\/agents\//g, '.qoder/agents/')
    .replace(/\.kiro\/spec-first\//g, '.qoder/spec-first/')
    .replace(/\$HOME\/\.kiro\/settings\/mcp\.json/g, '$HOME/.qoder/settings.json')
    .replace(/~\/\.kiro\/settings\/mcp\.json/g, '~/.qoder/settings.json')
    .replace(/\.kiro\/settings\/mcp\.json/g, '.qoder/settings.local.json')
    .replace(/\.kiro\/settings\/\*\*/g, '.qoder/settings.local.json')
    .replace(/spec-first managed \.kiro\/settings\//g, 'Qoder local .qoder/settings.local.json')
    .replace(/spec-first\s+init\s+--codex/g, 'spec-first init --qoder')
    .replace(/spec-first\s+clean\s+--codex/g, 'spec-first clean --qoder')
    .replace(/\$spec-\*/g, 'Qoder project commands or Skills')
    .replace(/\$spec-mcp-setup/g, 'Qoder project command `spec-mcp-setup` or Skill `spec-mcp-setup`')
    .replace(/Kiro Agent Skills/g, 'Qoder project commands or Skills')
    .replace(/Kiro Agent Skill `spec-mcp-setup`/g, 'Qoder project command `spec-mcp-setup` or Skill `spec-mcp-setup`');

  return rewritten;
}

function isQoderRuntimeSetupSurface(context = {}) {
  return context.skillName === 'spec-mcp-setup'
    || context.commandName === 'mcp-setup'
    || context.runtimeName === 'spec-mcp-setup';
}

function addQoderSetupHostPin(content) {
  if (content.includes('## Qoder Host Pin')) {
    return content;
  }

  return content.replace(/## Workflow Modes\n/, [
    '## Qoder Host Pin',
    '',
    'When this generated Qoder command or Skill invokes `skills/spec-mcp-setup/scripts/*`, set `MCP_SETUP_HOST=qoder` in the script environment. Do not rely on automatic host detection from PATH, because Claude Code, Codex, and Qoder CLIs can coexist on the same machine.',
    '',
    '## Workflow Modes',
    '',
  ].join('\n'));
}

function rewriteSkillName(content, skillName) {
  if (!skillName) {
    return content;
  }

  return content.replace(/^name:\s*.+$/m, `name: ${skillName}`);
}

function qoderRuntimeSkillName(context = {}) {
  return normalizeQoderName(context.runtimeName || context.skillName);
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

function normalizeQoderName(value) {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return normalized || 'spec-first';
}

function summarizeOperations(operations) {
  const summary = {};
  for (const operation of operations) {
    summary[operation.kind] = (summary[operation.kind] || 0) + 1;
  }
  return summary;
}

function sanitizeFrontmatterScalar(value) {
  return String(value || '')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 1024);
}

function qoderAgentTools(rawTools, body = '') {
  const tools = [...QODER_AGENT_BASE_TOOLS];
  const sourceTools = parseQoderTools(rawTools);
  const source = `${String(rawTools || '')}\n${String(body || '')}`;
  if (sourceTools.includes('WebFetch') || /\bWebFetch\b/.test(source) || /\bweb-fetch\b/i.test(source)) {
    tools.push('WebFetch');
  }
  if (sourceTools.includes('WebSearch') || /\bWebSearch\b/.test(source) || /\bweb-search\b/i.test(source)) {
    tools.push('WebSearch');
  }
  for (const tool of sourceTools) {
    if (/^mcp__[A-Za-z0-9_-]+__(?:\*|[A-Za-z0-9_-]+)$/.test(tool)) {
      tools.push(tool);
    }
  }
  return [...new Set(tools)];
}

function inspectQoderCommandFiles(projectRoot, commandRoot) {
  return listMarkdownFiles(commandRoot)
    .flatMap((commandPath) => {
      const content = fs.readFileSync(commandPath, 'utf8');
      const { frontmatter } = splitMarkdownFrontmatter(content);
      const fields = parseSimpleFrontmatterFields(frontmatter);
      const relativePath = path.relative(projectRoot, commandPath).replace(/\\/g, '/');
      const issues = [];
      if (!fields.name) issues.push('missing name');
      if (!fields.description) issues.push('missing description');
      if (String(fields.name || '').length > 64) issues.push('name exceeds 64 characters');
      if (QODER_UNREWRITTEN_PATH_PATTERNS.some((pattern) => pattern.test(content))) {
        issues.push('contains non-Qoder runtime path references');
      }
      return issues.length === 0
        ? [{
          level: 'PASS',
          name: relativePath,
          message: 'Qoder command frontmatter is valid',
        }]
        : [{
          level: 'WARNING',
          name: relativePath,
          message: issues.join('; '),
          fix: formatInitGuidance('qoder', 'in this project to regenerate Qoder command runtime assets'),
        }];
    });
}

function inspectQoderSkillNames(projectRoot, skillsRoot) {
  return listSkillDirs(skillsRoot)
    .flatMap((skillDir) => {
      const skillPath = path.join(skillsRoot, skillDir, 'SKILL.md');
      if (!fs.existsSync(skillPath)) return [];
      const content = fs.readFileSync(skillPath, 'utf8');
      const { frontmatter } = splitMarkdownFrontmatter(content);
      const fields = parseSimpleFrontmatterFields(frontmatter);
      const relativePath = path.relative(projectRoot, skillPath).replace(/\\/g, '/');
      const issues = [];
      if (fields.name !== skillDir) issues.push(`name does not match folder (${fields.name || '<missing>'})`);
      if (String(fields.name || '').length > 64) issues.push('name exceeds 64 characters');
      if (!fields.description) issues.push('missing description');
      if (QODER_UNREWRITTEN_PATH_PATTERNS.some((pattern) => pattern.test(content))) {
        issues.push('contains non-Qoder runtime path references');
      }
      return issues.length === 0
        ? [{
          level: 'PASS',
          name: relativePath,
          message: 'Qoder skill frontmatter is valid',
        }]
        : [{
          level: 'WARNING',
          name: relativePath,
          message: issues.join('; '),
          fix: formatInitGuidance('qoder', 'in this project to regenerate Qoder skill runtime assets'),
        }];
    });
}

function inspectQoderAgentFrontmatter(projectRoot, agentsRoot) {
  return listMarkdownFiles(agentsRoot)
    .filter((filePath) => filePath.endsWith('.agent.md'))
    .flatMap((agentPath) => {
      const content = fs.readFileSync(agentPath, 'utf8');
      const { frontmatter } = splitMarkdownFrontmatter(content);
      const fields = parseSimpleFrontmatterFields(frontmatter);
      const relativePath = path.relative(projectRoot, agentPath).replace(/\\/g, '/');
      const tools = parseQoderTools(fields.tools);
      const issues = [];
      if (!fields.name) issues.push('missing name');
      if (!fields.description) issues.push('missing description');
      for (const requiredTool of QODER_AGENT_BASE_TOOLS) {
        if (!tools.includes(requiredTool)) issues.push(`missing ${requiredTool} tool`);
      }
      for (const deniedTool of ['Write', 'Edit', 'Bash', 'Agent']) {
        if (tools.includes(deniedTool)) issues.push(`must not default to ${deniedTool}`);
      }
      if (/^model:/m.test(frontmatter)) issues.push('model must be omitted by default');
      if (/\btools:\s*\[\s*"read"\s*\]/m.test(frontmatter)) issues.push('uses Kiro read tool syntax');
      return issues.length === 0
        ? [{
          level: 'PASS',
          name: relativePath,
          message: 'Qoder agent frontmatter is valid with read/search default tools',
        }]
        : [{
          level: 'WARNING',
          name: relativePath,
          message: issues.join('; '),
          fix: formatInitGuidance('qoder', 'in this project to regenerate Qoder agent runtime assets'),
        }];
    });
}

function parseQoderTools(value) {
  return String(value || '')
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .split(',')
    .map((entry) => entry.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean);
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
