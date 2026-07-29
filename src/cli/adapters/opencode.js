'use strict';

const fs = require('node:fs');
const path = require('node:path');

const PlatformAdapter = require('./base');
const { formatInitGuidance } = require('../init-guidance');
const { rewriteSourceSkillRuntimePaths } = require('../skill-path-rewrite-markers');
const {
  contentHasUnexpectedRuntimePathReferences,
  rewritePreservingHostComparativeConfigPaths,
} = require('./host-comparative-config-paths');
const { isRuntimeSetupSurface } = require('../runtime-setup-identity');

class OpenCodeAdapter extends PlatformAdapter {
  get id() {
    return 'opencode';
  }

  get runtimeRoot() {
    return '.opencode';
  }

  get managedRoot() {
    return '.opencode/spec-first';
  }

  get commandRoot() {
    return '.opencode/commands/spec';
  }

  get skillsRoot() {
    return '.opencode/skills';
  }

  get workflowsRoot() {
    return '.opencode/skills';
  }

  get agentsRoot() {
    return '.opencode/agents';
  }

  get stateFile() {
    return '.opencode/spec-first/state.json';
  }

  get instructionFile() {
    return 'AGENTS.md';
  }

  get supportsAgents() {
    return false;
  }

  get supportState() {
    return 'preview';
  }

  get evidenceClaim() {
    return 'generated_runtime_preview';
  }

  renderCommandContent(_command, templateContent, context = {}) {
    if (typeof context.skillContent !== 'string') {
      return this.transformSkillContent(templateContent, context);
    }

    const { frontmatter } = splitMarkdownFrontmatter(templateContent);
    const { body } = splitMarkdownFrontmatter(context.skillContent);
    const merged = frontmatter
      ? `---\n${frontmatter}\n---\n\n${body.trimStart()}`
      : body;
    return this.transformSkillContent(merged, { ...context, isWorkflowSkill: true });
  }

  transformSkillContent(content, context = {}) {
    const isEntrypoint = typeof context.relativePath !== 'string'
      || context.relativePath.replace(/\\/g, '/') === 'SKILL.md';
    let transformed = isEntrypoint
      ? rewritePreservingHostComparativeConfigPaths(content, context, rewriteSharedPaths)
      : content;
    if (isEntrypoint && isRuntimeSetupSurface(context)) {
      transformed = addOpenCodeSetupHostPin(transformed);
    }
    const runtimeSkillRoot = context.runtimeSkillRoot
      || (context.isWorkflowSkill ? `${this.workflowsRoot}/${context.skillName}` : '');
    return runtimeSkillRoot
      ? rewriteSourceSkillRuntimePaths(transformed, context.skillName, runtimeSkillRoot)
      : transformed;
  }

  inspect(projectRoot) {
    return {
      platform: this.id,
      runtimeExists: fs.existsSync(path.join(projectRoot, this.runtimeRoot)),
      commands: fs.existsSync(path.join(projectRoot, this.commandRoot)),
      skills: fs.existsSync(path.join(projectRoot, this.skillsRoot)),
      agents: false,
      state: fs.existsSync(path.join(projectRoot, this.stateFile)),
    };
  }

  inspectRuntimeFiles(projectRoot) {
    const checks = [{
      level: 'WARNING',
      name: 'OpenCode generated-runtime preview',
      message: 'OpenCode command and skill loader behavior is not verified for the installed runtime version.',
      drift: false,
      degradedByDesign: true,
      reasonCode: 'opencode_generated_runtime_loader_unverified',
      fix: 'Run the version-matched OpenCode host journey before promoting beyond generated-runtime preview.',
    }];
    const runtimeRoot = path.join(projectRoot, this.runtimeRoot);
    const commandRoot = path.join(projectRoot, this.commandRoot);
    const skillsRoot = path.join(projectRoot, this.skillsRoot);
    const agentsRoot = path.join(projectRoot, this.agentsRoot);

    if (!fs.existsSync(runtimeRoot)) {
      checks.push({
        level: 'WARNING',
        name: this.runtimeRoot,
        message: 'OpenCode managed runtime root is missing.',
        reasonCode: 'opencode_runtime_root_missing',
        fix: formatInitGuidance('opencode', 'in this project to generate OpenCode preview runtime assets'),
      });
      return checks;
    }

    const commandsExist = fs.existsSync(commandRoot);
    const skillsExist = fs.existsSync(skillsRoot);
    if (!commandsExist || !skillsExist) {
      checks.push({
        level: 'WARNING',
        name: 'OpenCode command/skill projection',
        message: `OpenCode runtime projection is partial: commands=${commandsExist}, skills=${skillsExist}.`,
        reasonCode: 'opencode_runtime_projection_partial',
        fix: formatInitGuidance('opencode', 'in this project to regenerate both OpenCode command and skill entrypoints'),
      });
    }

    if (fs.existsSync(agentsRoot)) {
      checks.push({
        level: 'WARNING',
        name: this.agentsRoot,
        message: 'OpenCode preview does not project bundled agent profiles.',
        reasonCode: 'opencode_bundled_agents_unsupported',
        fix: formatInitGuidance('opencode', 'in this project to remove unsupported bundled OpenCode agent profiles'),
      });
    }

    if (skillsExist) {
      checks.push(...inspectOpenCodeSkillFiles(projectRoot, skillsRoot));
    }
    checks.push(...inspectOpenCodeSkillCollisions(projectRoot));
    return checks;
  }
}

function rewriteSharedPaths(content) {
  const rewritten = String(content || '')
    .replace(/\.claude\/commands\/spec\/([a-z-]+)\.md/g, '.opencode/commands/spec/$1.md')
    .replace(/\.claude\/commands\/spec-([a-z-]+)\.md/g, '.opencode/commands/spec/$1.md')
    .replace(/\.codex\/commands\/spec\/([a-z-]+)\.md/g, '.opencode/commands/spec/$1.md')
    .replace(/\.kiro\/commands\/spec\/([a-z-]+)\.md/g, '.opencode/commands/spec/$1.md')
    .replace(/\.qoder\/commands\/spec-([a-z-]+)\.md/g, '.opencode/commands/spec/$1.md')
    .replace(/\.claude\/spec-first\/workflows\//g, '.opencode/skills/')
    .replace(/\.claude\/skills\//g, '.opencode/skills/')
    .replace(/\.codex\/skills\//g, '.opencode/skills/')
    .replace(/\.agents\/skills\//g, '.opencode/skills/')
    .replace(/\.cursor\/skills\//g, '.opencode/skills/')
    .replace(/\.kiro\/skills\//g, '.opencode/skills/')
    .replace(/\.qoder\/skills\//g, '.opencode/skills/')
    .replace(/\.claude\/agents\//g, '.opencode/agents/')
    .replace(/\.codex\/agents\//g, '.opencode/agents/')
    .replace(/\.cursor\/agents\//g, '.opencode/agents/')
    .replace(/\.kiro\/agents\//g, '.opencode/agents/')
    .replace(/\.qoder\/agents\//g, '.opencode/agents/')
    .replace(/\.cursor\/spec-first\//g, '.opencode/spec-first/')
    .replace(/\.kiro\/spec-first\//g, '.opencode/spec-first/')
    .replace(/\.qoder\/spec-first\//g, '.opencode/spec-first/')
    .replace(/spec-first\s+init\s+--codex/g, 'spec-first init --opencode')
    .replace(/spec-first\s+clean\s+--codex/g, 'spec-first clean --opencode');
  return rewriteOpenCodeRuntimeContextSections(rewritten);
}

function rewriteOpenCodeRuntimeContextSections(content) {
  return content
    .replace(
      /generated mirrors \([^)\n]*\)/g,
      'generated mirrors (`.opencode/commands/spec/**`, `.opencode/skills/**`, `.opencode/spec-first/**`)',
    )
    .replace(
      /generated mirrors（[^）\n]*）/g,
      'generated mirrors（`.opencode/commands/spec/**`、`.opencode/skills/**`、`.opencode/spec-first/**`）',
    )
    .replace(
      /Cursor-native `[^`]+` \/ `[^`]+`, Kiro-native `[^`]+`, and Qoder-native `[^`]+` (?:remain|are) advisory input only when explicitly named\./g,
      'Host-native advisory paths from other runtimes are not default context unless explicitly named.',
    )
    .replace(
      /Cursor-native `[^`]+` \/ `[^`]+`、Kiro-native `[^`]+` 与 Qoder-native `[^`]+` 只有显式点名时作为 advisory input。/g,
      '其他宿主原生 advisory artifact 只有显式点名时作为 advisory input。',
    );
}

function addOpenCodeSetupHostPin(content) {
  if (content.includes('## OpenCode Host Pin')) {
    return content;
  }
  return content.replace(/## Workflow Modes\n/, [
    '## OpenCode Host Pin',
    '',
    'When this generated OpenCode `spec-runtime-setup` runtime surface invokes `skills/spec-runtime-setup/scripts/*`, set `MCP_SETUP_HOST=opencode` in the script environment. Do not infer host authority from PATH.',
    '',
    '## Workflow Modes',
    '',
  ].join('\n'));
}

function splitMarkdownFrontmatter(content) {
  if (!String(content || '').startsWith('---\n')) {
    return { frontmatter: '', body: String(content || '') };
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

function inspectOpenCodeSkillCollisions(projectRoot) {
  const roots = [
    { label: '.opencode/skills', path: path.join(projectRoot, '.opencode', 'skills') },
    { label: '.agents/skills', path: path.join(projectRoot, '.agents', 'skills') },
    { label: '.claude/skills', path: path.join(projectRoot, '.claude', 'skills') },
  ];
  const bySkill = new Map();
  for (const root of roots) {
    for (const skillName of listSkillNames(root.path)) {
      const entries = bySkill.get(skillName) || [];
      entries.push(root.label);
      bySkill.set(skillName, entries);
    }
  }

  return [...bySkill.entries()]
    .filter(([, entries]) => entries.length > 1)
    .map(([skillName, entries]) => ({
      level: 'WARNING',
      name: `OpenCode duplicate skill discovery: ${skillName}`,
      message: `same-name skill found in OpenCode-compatible roots: ${entries.join(', ')}; loader precedence is unverified`,
      drift: false,
      degradedByDesign: true,
      reasonCode: 'opencode_external_skill_precedence_unverified',
      fix: 'Remove or rename unmanaged duplicates only after confirming which root the installed OpenCode version loads.',
    }));
}

function inspectOpenCodeSkillFiles(projectRoot, skillsRoot) {
  return listSkillNames(skillsRoot).map((skillName) => {
    const skillPath = path.join(skillsRoot, skillName, 'SKILL.md');
    const content = fs.readFileSync(skillPath, 'utf8');
    const { frontmatter } = splitMarkdownFrontmatter(content);
    const fields = parseSimpleFrontmatterFields(frontmatter);
    const issues = [];
    if (fields.name !== skillName) {
      issues.push(`name does not match folder (${fields.name || '<missing>'})`);
    }
    if (!fields.description) {
      issues.push('missing description');
    }
    if (skillName === 'spec-runtime-setup' && !content.includes('MCP_SETUP_HOST=opencode')) {
      issues.push('missing OpenCode MCP_SETUP_HOST pin');
    }
    if (contentHasUnexpectedRuntimePathReferences('opencode', content, { skillName })) {
      issues.push('contains non-OpenCode runtime path references');
    }

    const name = path.relative(projectRoot, skillPath).replace(/\\/g, '/');
    return issues.length === 0
      ? {
        level: 'PASS',
        name,
        message: 'OpenCode skill frontmatter and runtime paths are valid',
      }
      : {
        level: 'WARNING',
        name,
        message: issues.join('; '),
        fix: formatInitGuidance('opencode', 'in this project to regenerate OpenCode skill runtime assets'),
      };
  });
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

function listSkillNames(rootPath) {
  let entries;
  try {
    entries = fs.readdirSync(rootPath, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((skillName) => fs.existsSync(path.join(rootPath, skillName, 'SKILL.md')));
}

module.exports = OpenCodeAdapter;
