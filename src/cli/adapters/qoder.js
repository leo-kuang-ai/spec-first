const fs = require('node:fs');
const path = require('node:path');

const PointerBasedAdapter = require('./pointer-based-adapter');
const { formatInitGuidance } = require('../init-guidance');
const { planRetiredCommandNamespaceRemoval } = require('../state');
const {
  MANAGED_HOOK_DEFINITIONS,
  SETTINGS_RELATIVE_PATH,
  inspectManagedQoderHooks,
  renderManagedQoderHooksCleanup,
  renderManagedQoderHooksRemoval,
} = require('../qoder-settings');
const { rewriteSourceSkillRuntimePaths } = require('../skill-path-rewrite-markers');
const {
  contentHasUnexpectedRuntimePathReferences,
  rewritePreservingHostComparativeConfigPaths,
} = require('./host-comparative-config-paths');
const { isRuntimeSetupSurface } = require('../runtime-setup-identity');
const {
  formatFrontmatterScalar,
  parseFrontmatterScalars,
  splitMarkdownFrontmatter,
} = require('../helpers/markdown-frontmatter');

const QODER_RULE_POINTER_PATH = '.qoder/rules/spec-first.md';
const QODER_POINTER_FRONTMATTER = [
  '---',
  'trigger: always_on',
  '---',
].join('\n');
const QODER_HOOK_TEMPLATE_ROOT = path.join(__dirname, '..', '..', '..', 'templates', 'qoder', 'hooks');
const MANAGED_QODER_HOOK_FILES = MANAGED_HOOK_DEFINITIONS.map((definition) => ({
  relativePath: definition.hookPath,
  displayName: definition.displayName,
  render: definition.templateName === 'session-start'
    ? renderSessionStartHookTemplate
    : () => fs.readFileSync(path.join(QODER_HOOK_TEMPLATE_ROOT, definition.templateName), 'utf8'),
}));
const QODER_AGENT_BASE_TOOLS = ['Read', 'Grep', 'Glob'];
const QODER_AGENT_WEB_TOOLS = ['WebFetch', 'WebSearch'];

class QoderAdapter extends PointerBasedAdapter {
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

  get pointerPath() {
    return QODER_RULE_POINTER_PATH;
  }

  get pointerHostLabel() {
    return 'Qoder';
  }

  get pointerFrontmatter() {
    return QODER_POINTER_FRONTMATTER;
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
      `description: ${formatFrontmatterScalar(description)}`,
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
    const isEntrypoint = isSkillEntrypointContext(context);
    let transformed = isEntrypoint
      ? rewritePreservingHostComparativeConfigPaths(content, context, rewriteSharedPaths)
      : content;
    if (isEntrypoint) {
      transformed = rewriteSkillName(transformed, qoderRuntimeSkillName(context));
    }
    if (isEntrypoint && isQoderRuntimeSetupSurface(context)) {
      transformed = addQoderSetupHostPin(transformed);
    }
    if (isEntrypoint && isQoderPrdRuntimeSurface(context)) {
      transformed = addQoderPrdDegradedEnforcement(transformed);
    }
    const runtimeSkillRoot = context.runtimeSkillRoot
      || (context.isWorkflowSkill ? `${this.workflowsRoot}/${context.skillName}` : '');
    return runtimeSkillRoot
      ? rewriteSourceSkillRuntimePaths(transformed, context.skillName, runtimeSkillRoot)
      : transformed;
  }

  transformAgentContent(content) {
    const { frontmatter, body } = splitMarkdownFrontmatter(content);
    const fields = parseFrontmatterScalars(frontmatter);
    const name = normalizeQoderName(fields.name || fields.agent || 'spec-first-agent');
    const description = sanitizeFrontmatterScalar(fields.description || `spec-first agent ${name}`);
    const transformedBody = rewriteSharedPaths(body || content);
    const tools = qoderAgentTools(fields.tools || '', body);

    return [
      '---',
      `name: ${name}`,
      `description: ${formatFrontmatterScalar(description)}`,
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
    checks.push(this.inspectPointerRuntime(projectRoot));
    checks.push(...inspectManagedQoderHookFiles(projectRoot));
    checks.push(...inspectManagedQoderHooks(projectRoot).map(qoderHookStatusToRuntimeCheck));

    return checks.length > 0
      ? checks
      : [{
        level: 'PASS',
        name: 'Qoder runtime shape',
        message: 'no Qoder-specific runtime drift detected',
      }];
  }

  planRuntimeFilesSync(projectRoot) {
    const pointerPlan = this.planPointerRuntimeFilesSync(projectRoot);
    const operations = [
      ...pointerPlan.operations,
      ...buildManagedQoderHookWriteOperations(projectRoot),
      ...buildRenderedQoderSettingsOperations(
        projectRoot,
        renderManagedQoderHooksCleanup(projectRoot),
        'managed_qoder_hook_settings_cleanup',
      ),
    ];

    return {
      operations,
      summary: summarizeOperations(operations),
      diagnostics: pointerPlan.diagnostics || [],
    };
  }

  planRuntimeFilesRemoval(projectRoot) {
    const retiredCommands = planRetiredCommandNamespaceRemoval(
      projectRoot,
      '.qoder/commands/spec',
    );
    const operations = [
      ...retiredCommands.operations,
      ...this.planPointerRuntimeFilesRemoval(projectRoot).operations,
      ...MANAGED_QODER_HOOK_FILES.map((hook) => ({
        kind: 'remove_file',
        path: hook.relativePath.replace(/\\/g, '/'),
        reason: 'managed_runtime_hook',
      })),
      ...buildRenderedQoderSettingsOperations(
        projectRoot,
        renderManagedQoderHooksRemoval(projectRoot),
        'managed_qoder_hook_settings_cleanup',
      ),
    ];

    return {
      operations,
      summary: summarizeOperations(operations),
    };
  }

  removeRuntimeFiles(projectRoot) {
    for (const hook of MANAGED_QODER_HOOK_FILES) {
      removeManagedQoderHookFile(path.join(projectRoot, hook.relativePath), projectRoot);
    }
  }
}

module.exports = QoderAdapter;
module.exports.QODER_RULE_POINTER_PATH = QODER_RULE_POINTER_PATH;
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
    .replace(/\.claude\/commands\/spec-\*\.md/g, '.qoder/commands/spec-*.md')
    .replace(/\.codex\/commands\/spec\/([a-z-]+)\.md/g, (_match, commandName) => {
      return `.qoder/commands/spec-${commandName}.md`;
    })
    .replace(/\.codex\/commands\/spec-\*\.md/g, '.qoder/commands/spec-*.md')
    .replace(/\.cursor\/skills\/spec-([a-z-]+)\/SKILL\.md/g, (_match, commandName) => {
      return `.qoder/commands/spec-${commandName}.md`;
    })
    .replace(/\.cursor\/skills\/\*\*/g, '.qoder/commands/spec-*.md')
    .replace(/\.cursor\/skills\//g, '.qoder/skills/')
    .replace(/\.cursor\/spec-first\//g, '.qoder/spec-first/')
    .replace(/\.cursor\/mcp\.json/g, '.qoder/settings.local.json')
    .replace(/\.kiro\/commands\/spec\/([a-z-]+)\.md/g, (_match, commandName) => {
      return `.qoder/commands/spec-${commandName}.md`;
    })
    .replace(/\.kiro\/commands\/spec-\*\.md/g, '.qoder/commands/spec-*.md')
    .replace(/\.kiro\/commands\/spec\/\*\*/g, '.qoder/commands/spec-*.md')
    .replace(/\.claude\/spec-first\/workflows\//g, '.qoder/skills/')
    .replace(/\.claude\/skills\//g, '.qoder/skills/')
    .replace(/\.codex\/skills\//g, '.qoder/skills/')
    .replace(/\.agents\/skills\//g, '.qoder/skills/')
    .replace(/\.kiro\/skills\//g, '.qoder/skills/')
    .replace(/\.claude\/agents\//g, '.qoder/agents/')
    .replace(/\.codex\/agents\//g, '.qoder/agents/')
    .replace(/\.cursor\/agents\//g, '.qoder/agents/')
    .replace(/\.kiro\/agents\//g, '.qoder/agents/')
    .replace(/\.kiro\/spec-first\//g, '.qoder/spec-first/')
    .replace(/\$HOME\/\.kiro\/settings\/mcp\.json/g, '$HOME/.qoder/settings.json')
    .replace(/~\/\.kiro\/settings\/mcp\.json/g, '~/.qoder/settings.json')
    .replace(/\.kiro\/settings\/mcp\.json/g, '.qoder/settings.local.json')
    .replace(/\.kiro\/settings\/\*\*/g, '.qoder/settings.local.json')
    .replace(/spec-first managed \.kiro\/settings\//g, 'Qoder local .qoder/settings.local.json')
    .replace(/spec-first\s+init\s+--codex/g, 'spec-first init --qoder')
    .replace(/spec-first\s+clean\s+--codex/g, 'spec-first clean --qoder')
    .replace(/\$spec-\*/g, '`spec-*`')
    .replace(/\$spec-runtime-setup/g, '`spec-runtime-setup`')
    .replace(/Kiro Agent\s+Skills/g, '`spec-*`')

  return rewriteQoderRuntimeContextSections(rewriteUsingSpecFirstQoderSections(rewritten));
}

function rewriteUsingSpecFirstQoderSections(content) {
  return content
    .replace(
      /- Claude Code installs it as `\.qoder\/skills\/using-spec-first\/SKILL\.md`[\s\S]*?\n- Codex installs it as `\.qoder\/skills\/using-spec-first\/SKILL\.md`.*?\n/,
      '- Qoder installs it as `.qoder/skills/using-spec-first/SKILL.md` and also reads the managed block in `AGENTS.md`; its generated runtime exposes the same `spec-*` workflow names as the user entrypoint surface.\n',
    )
    .replace(
      /Runtime copies under .*? are generated mirrors\. Repair stale or missing runtime guidance with `spec-first init` after choosing the target host; do not hand-edit generated mirrors as the source of truth\. Cursor-native `\.cursor\/rules\/\*\*` \/ `\.cursor\/agents\/\*\*`, Kiro-native `\.kiro\/specs\/\*\*`, and Qoder-native `\.qoder\/rules\/\*\*` remain advisory input only when explicitly named\./,
      'Runtime copies under `.qoder/commands/spec-*.md`, `.qoder/commands/spec/` (retired legacy namespace), `.qoder/skills/`, `.qoder/agents/`, `.qoder/spec-first/`, spec-first managed `.qoder/hooks/session-start`, `.qoder/hooks/prd-prewrite-guard`, `.qoder/hooks/prd-readiness-guard`, and `.qoder/settings.local.json` are generated runtime, managed hook outputs, or host-local config outputs for this host. Repair stale or missing runtime guidance with `spec-first init --qoder`, and do not hand-edit generated mirrors as the source of truth. Qoder-native `.qoder/rules/**` remain advisory input only when explicitly named.',
    )
    .replace(
      /Ordinary context routing follows `docs\/contracts\/context-governance\.md`: `\.spec-first\/audits\/\*\*`, `\.spec-first\/governance\/\*\*`, and generated mirrors \(.*?\) are excluded from default workflow context\. Route to setup\/update\/runtime-drift\/audit\/governance-health workflows, or require a precise user-named path, before treating those directories as evidence\. Cursor-native `\.cursor\/rules\/\*\*` \/ `\.cursor\/agents\/\*\*`, Kiro-native `\.kiro\/specs\/\*\*`, and Qoder-native `\.qoder\/rules\/\*\*` remain advisory input only when explicitly named\./,
      'Ordinary context routing follows `docs/contracts/context-governance.md`: `.spec-first/audits/**`, `.spec-first/governance/**`, and generated mirrors (`.qoder/commands/spec-*.md`, `.qoder/commands/spec/**`, `.qoder/skills/**`, `.qoder/agents/**`, `.qoder/spec-first/**`, spec-first managed `.qoder/hooks/session-start`, `.qoder/hooks/prd-prewrite-guard`, `.qoder/hooks/prd-readiness-guard`, `.qoder/settings.local.json`) are excluded from default workflow context. Route to setup/update/runtime-drift/audit/governance-health workflows, or require a precise user-named path, before treating those directories as evidence. Qoder-native `.qoder/rules/**` remain advisory input only when explicitly named.',
    );
}

function rewriteQoderRuntimeContextSections(content) {
  return content
    .replace(
      /generated mirrors \([^)\n]*\)/g,
      'generated mirrors (`.qoder/commands/spec-*.md`, `.qoder/commands/spec/**`, `.qoder/skills/**`, `.qoder/agents/**`, `.qoder/spec-first/**`, `.qoder/hooks/session-start`, `.qoder/hooks/prd-prewrite-guard`, `.qoder/hooks/prd-readiness-guard`, `.qoder/settings.local.json`)',
    )
    .replace(
      /generated mirrors（[^）\n]*）/g,
      'generated mirrors（`.qoder/commands/spec-*.md`、`.qoder/commands/spec/**`、`.qoder/skills/**`、`.qoder/agents/**`、`.qoder/spec-first/**`、`.qoder/hooks/session-start`、`.qoder/hooks/prd-prewrite-guard`、`.qoder/hooks/prd-readiness-guard`、`.qoder/settings.local.json`）',
    )
    .replace(
      /Cursor-native `\.cursor\/rules\/\*\*` \/ `\.cursor\/agents\/\*\*`, Kiro-native `\.kiro\/specs\/\*\*`, and Qoder-native `\.qoder\/rules\/\*\*` (?:remain|are) advisory input only when explicitly named\./g,
      'Qoder-native `.qoder/rules/**` remains advisory input only when explicitly named.',
    )
    .replace(
      /Cursor-native `\.cursor\/rules\/\*\*` \/ `\.qoder\/agents\/\*\*`, Kiro-native `\.kiro\/specs\/\*\*`, and Qoder-native `\.qoder\/rules\/\*\*` (?:remain|are) advisory input only when explicitly named\./g,
      'Qoder-native `.qoder/rules/**` remains advisory input only when explicitly named.',
    )
    .replace(
      /Cursor-native `\.cursor\/rules\/\*\*` \/ `\.cursor\/agents\/\*\*`、Kiro-native `\.kiro\/specs\/\*\*` 与 Qoder-native `\.qoder\/rules\/\*\*` 只有显式点名时作为 advisory input。/g,
      'Qoder-native `.qoder/rules/**` 只有显式点名时作为 advisory input。',
    );
}

function isQoderRuntimeSetupSurface(context = {}) {
  return isRuntimeSetupSurface(context);
}

function isSkillEntrypointContext(context = {}) {
  return typeof context.relativePath !== 'string'
    || context.relativePath.replace(/\\/g, '/') === 'SKILL.md';
}

function addQoderSetupHostPin(content) {
  if (content.includes('## Qoder Host Pin')) {
    return content;
  }

  return content.replace(/## Workflow Modes\n/, [
    '## Qoder Host Pin',
    '',
    'When this generated Qoder `spec-runtime-setup` runtime surface invokes `skills/spec-runtime-setup/scripts/*`, set `MCP_SETUP_HOST=qoder` in the script environment. Do not rely on automatic host detection from PATH, because Claude Code, Codex, and Qoder CLIs can coexist on the same machine.',
    '',
    '## Workflow Modes',
    '',
  ].join('\n'));
}

function isQoderPrdRuntimeSurface(context = {}) {
  return context.skillName === 'spec-prd'
    || context.commandName === 'prd'
    || context.runtimeName === 'spec-prd';
}

function addQoderPrdDegradedEnforcement(content) {
  if (content.includes('Qoder degraded enforcement boundary:')) {
    return content;
  }

  return content.replace(
    /^Codex degraded enforcement boundary:.*$/m,
    'Qoder degraded enforcement boundary: record `reason_code: qoder_hook_activation_unverified` in closeout when relevant. The qodercli 1.0.41 settings/exec protocol is confirmed, but authenticated event execution and shared IDE loader safety are not; `.qoder/settings.json` entries are therefore intentionally omitted and all three managed hook scripts remain inactive (SessionStart, PreToolUse, and Stop). Treat the Pre-Write Closure Gate and PRD closeout guard as loud conventions, not hard protection. Before `spec-prd` claims readiness, run the producer-local finalize command from the loaded `spec-prd` skill root. Do not imply equal protection with Claude or present generated scripts as activated hooks.',
  );
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

function buildManagedQoderHookWriteOperations(projectRoot) {
  return MANAGED_QODER_HOOK_FILES.map((hook) => {
    const targetPath = path.join(projectRoot, hook.relativePath);
    return {
      kind: fs.existsSync(targetPath) ? 'update_file' : 'write_file',
      path: hook.relativePath.replace(/\\/g, '/'),
      reason: 'managed_runtime_hook',
      contents: hook.render(),
      mode: 0o755,
    };
  });
}

function renderSessionStartHookTemplate() {
  return fs.readFileSync(path.join(QODER_HOOK_TEMPLATE_ROOT, 'session-start'), 'utf8');
}

function buildRenderedQoderSettingsOperations(projectRoot, rendered, reason) {
  if (!rendered) {
    return [];
  }
  const relativePath = path.relative(projectRoot, rendered.filePath).replace(/\\/g, '/');
  return [rendered.existsAfter
    ? {
      kind: fs.existsSync(rendered.filePath) ? 'update_file' : 'write_file',
      path: relativePath,
      reason,
      contents: rendered.contents,
    }
    : {
      kind: 'remove_file',
      path: relativePath,
      reason,
    }];
}

function inspectManagedQoderHookFiles(projectRoot) {
  return MANAGED_QODER_HOOK_FILES.map((hook) => {
    const targetPath = path.join(projectRoot, hook.relativePath);
    let actual;
    try {
      actual = fs.readFileSync(targetPath, 'utf8');
    } catch (error) {
      if (!error || error.code !== 'ENOENT') {
        throw error;
      }
      return {
        level: 'WARNING',
        name: hook.relativePath,
        message: `managed Qoder ${hook.displayName} hook script is missing`,
        fix: formatInitGuidance('qoder', `in this project to write ${hook.relativePath}`),
      };
    }

    const expected = hook.render();
    if (actual !== expected) {
      return {
        level: 'WARNING',
        name: hook.relativePath,
        message: `managed Qoder ${hook.displayName} hook script drifted from the bundled template`,
        fix: formatInitGuidance('qoder', `in this project to refresh ${hook.relativePath}`),
      };
    }

    if (process.platform !== 'win32') {
      const mode = fs.statSync(targetPath).mode & 0o777;
      if ((mode & 0o111) === 0) {
        return {
          level: 'WARNING',
          name: hook.relativePath,
          message: `managed Qoder ${hook.displayName} hook script is not executable`,
          fix: formatInitGuidance('qoder', `in this project to restore executable mode on ${hook.relativePath}`),
        };
      }
    }

    return {
      level: 'PASS',
      name: hook.relativePath,
      message: `managed Qoder ${hook.displayName} hook script is installed`,
    };
  });
}

function qoderHookStatusToRuntimeCheck(status) {
  const name = `${SETTINGS_RELATIVE_PATH} ${status.eventName}`;
  if (status.drift) {
    return {
      level: 'WARNING',
      name,
      message: status.message,
      drift: true,
      reasonCode: status.reasonCode,
      fix: formatInitGuidance('qoder', 'to remove managed Qoder hook settings entries that were activated without verified execution evidence'),
    };
  }

  return {
    level: 'WARNING',
    name,
    message: status.message,
    drift: false,
    degradedByDesign: status.degradedByDesign === true,
    disposition: status.degradedByDesign === true ? 'known_limitation' : undefined,
    reasonCode: status.reasonCode,
  };
}

function removeManagedQoderHookFile(filePath, projectRoot) {
  try {
    fs.rmSync(filePath, { force: true });
  } catch {
    return;
  }
  removeEmptyParents(path.dirname(filePath), projectRoot);
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
      const fields = parseFrontmatterScalars(frontmatter);
      const relativePath = path.relative(projectRoot, commandPath).replace(/\\/g, '/');
      const issues = [];
      if (!fields.name) issues.push('missing name');
      if (!fields.description) issues.push('missing description');
      if (String(fields.name || '').length > 64) issues.push('name exceeds 64 characters');
      if (contentHasUnexpectedRuntimePathReferences('qoder', content, {
        skillName: path.basename(commandPath, '.md'),
      })) {
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
          fix: formatInitGuidance('qoder', 'in this project to regenerate Qoder spec-* runtime assets'),
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
      const fields = parseFrontmatterScalars(frontmatter);
      const relativePath = path.relative(projectRoot, skillPath).replace(/\\/g, '/');
      const issues = [];
      if (fields.name !== skillDir) issues.push(`name does not match folder (${fields.name || '<missing>'})`);
      if (String(fields.name || '').length > 64) issues.push('name exceeds 64 characters');
      if (!fields.description) issues.push('missing description');
      if (contentHasUnexpectedRuntimePathReferences('qoder', content, { skillName: skillDir })) {
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
      const fields = parseFrontmatterScalars(frontmatter);
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
