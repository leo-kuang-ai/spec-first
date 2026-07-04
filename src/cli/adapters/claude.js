const fs = require('node:fs');
const path = require('node:path');

const PlatformAdapter = require('./base');
const { formatInitGuidance } = require('../init-guidance');
const { rewriteSourceSkillRuntimePaths } = require('../skill-path-rewrite-markers');
const SESSION_START_TEMPLATE_PATH = path.join(__dirname, '..', '..', '..', 'templates', 'claude', 'hooks', 'session-start');
const SESSION_START_RELATIVE_PATH = '.claude/hooks/session-start';
const SPEC_PLAN_GUARD_TEMPLATE_PATH = path.join(__dirname, '..', '..', '..', 'templates', 'claude', 'hooks', 'spec-plan-guard');
const SPEC_PLAN_GUARD_RELATIVE_PATH = '.claude/hooks/spec-plan-guard';
const PRD_PREWRITE_GUARD_TEMPLATE_PATH = path.join(__dirname, '..', '..', '..', 'templates', 'claude', 'hooks', 'prd-prewrite-guard');
const PRD_PREWRITE_GUARD_RELATIVE_PATH = '.claude/hooks/prd-prewrite-guard';
const PRD_READINESS_GUARD_TEMPLATE_PATH = path.join(__dirname, '..', '..', '..', 'templates', 'claude', 'hooks', 'prd-readiness-guard');
const PRD_READINESS_GUARD_RELATIVE_PATH = '.claude/hooks/prd-readiness-guard';
const SESSION_START_CLI_PLACEHOLDER = '__SPEC_FIRST_CLI_PATH__';
const TRUSTED_SPEC_FIRST_CLI_PATH = path.join(__dirname, '..', '..', '..', 'bin', 'spec-first.js');
const MANAGED_HOOK_FILES = [
  {
    relativePath: SESSION_START_RELATIVE_PATH,
    displayName: 'SessionStart',
    render: renderSessionStartHookTemplate,
  },
  {
    relativePath: SPEC_PLAN_GUARD_RELATIVE_PATH,
    displayName: 'UserPromptExpansion spec-plan guard',
    render: renderSpecPlanGuardHookTemplate,
  },
  {
    relativePath: PRD_PREWRITE_GUARD_RELATIVE_PATH,
    displayName: 'PreToolUse PRD prewrite guard',
    render: renderPrdPrewriteGuardHookTemplate,
  },
  {
    relativePath: PRD_READINESS_GUARD_RELATIVE_PATH,
    displayName: 'Stop PRD readiness guard',
    render: renderPrdReadinessGuardHookTemplate,
  },
];

/**
 * Claude platform adapter
 */
class ClaudeAdapter extends PlatformAdapter {
  get id() {
    return 'claude';
  }

  get runtimeRoot() {
    return '.claude';
  }

  get managedRoot() {
    return '.claude/spec-first';
  }

  get commandRoot() {
    return '.claude/commands/spec';
  }

  get skillsRoot() {
    return '.claude/skills';
  }

  get workflowsRoot() {
    return '.claude/spec-first/workflows';
  }

  get agentsRoot() {
    return '.claude/agents';
  }

  get stateFile() {
    return '.claude/spec-first/state.json';
  }

  get instructionFile() {
    return 'CLAUDE.md';
  }

  renderCommandContent(_command, templateContent, context = {}) {
    if (typeof context.skillContent !== 'string') {
      return this.transformSkillContent(templateContent, context);
    }

    const { frontmatter } = splitMarkdownFrontmatter(templateContent);
    const { body } = splitMarkdownFrontmatter(context.skillContent);
    const merged = frontmatter
      ? `${frontmatter}\n\n${body}`
      : body;

    return this.transformSkillContent(merged, { ...context, isWorkflowSkill: true });
  }

  transformSkillContent(content, context = {}) {
    let transformed = rewriteCanonicalAgentNamesForSkills(content);
    if (isClaudeRuntimeSetupSurface(context)) {
      transformed = addClaudeSetupHostPin(transformed);
    }

    const runtimeSkillRoot = context.runtimeSkillRoot
      || (context.isWorkflowSkill ? `${this.workflowsRoot}/${context.skillName}` : '');
    return runtimeSkillRoot
      ? rewriteSourceSkillRuntimePaths(transformed, context.skillName, runtimeSkillRoot)
      : transformed;
  }

  transformAgentContent(content) {
    return rewriteCanonicalAgentNamesForExecution(content);
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
    const runtimeRoot = path.join(projectRoot, this.runtimeRoot);
    const skillsRoot = path.join(projectRoot, this.skillsRoot);
    const workflowsRoot = path.join(projectRoot, this.workflowsRoot);
    const agentsRoot = path.join(projectRoot, this.agentsRoot);

    const checks = inspectManagedHookFiles(projectRoot);

    if (!fs.existsSync(runtimeRoot) || !fs.existsSync(skillsRoot) || !fs.existsSync(agentsRoot)) {
      return checks;
    }

    const workflowFiles = fs.existsSync(workflowsRoot) ? listMarkdownFiles(workflowsRoot) : [];
    const skillFiles = [...listMarkdownFiles(skillsRoot), ...workflowFiles];
    const markdownFiles = [...skillFiles, ...listMarkdownFiles(agentsRoot)];

    const canonicalMatches = [];
    for (const filePath of skillFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (/\bce:[a-z-]+:[a-z-]+\b/.test(content)) {
        canonicalMatches.push(path.relative(projectRoot, filePath));
      }
    }

    if (canonicalMatches.length > 0) {
      checks.push({
        level: 'ERROR',
        name: 'Claude runtime agent references',
        message: `found canonical spec-first agent names in ${canonicalMatches.slice(0, 3).join(', ')}${canonicalMatches.length > 3 ? ', ...' : ''}`,
        fix: formatInitGuidance('claude', 'to regenerate runtime assets with Claude-compatible agent names'),
      });
    }

    const registeredAgentNames = collectRegisteredAgentNames(agentsRoot);
    const unresolvedTaskRefs = findTaskAgentRefs(markdownFiles)
      .filter((ref) => !registeredAgentNames.has(ref.agentName));

    if (unresolvedTaskRefs.length > 0) {
      const samples = unresolvedTaskRefs
        .slice(0, 3)
        .map((ref) => `${path.relative(projectRoot, ref.filePath)} -> ${ref.agentName}`);
      checks.push({
        level: 'ERROR',
        name: 'Claude Task agent references',
        message: `unresolved Task agent names: ${samples.join(', ')}${unresolvedTaskRefs.length > 3 ? ', ...' : ''}`,
        fix: formatInitGuidance('claude', 'after upgrading the CLI so runtime task references match installed agent names'),
      });
    }

    return checks;
  }

  planRuntimeFilesSync(projectRoot) {
    const operations = MANAGED_HOOK_FILES.map((hook) => {
      const targetPath = path.join(projectRoot, hook.relativePath);
      return {
        kind: fs.existsSync(targetPath) ? 'update_file' : 'write_file',
        path: hook.relativePath.replace(/\\/g, '/'),
        reason: 'managed_runtime_hook',
        contents: hook.render(),
        mode: 0o755,
      };
    });

    return {
      operations,
      summary: summarizeOperations(operations),
    };
  }

  planRuntimeFilesRemoval() {
    const operations = MANAGED_HOOK_FILES.map((hook) => ({
      kind: 'remove_file',
      path: hook.relativePath.replace(/\\/g, '/'),
      reason: 'managed_runtime_hook',
    }));

    return {
      operations,
      summary: summarizeOperations(operations),
    };
  }

  removeRuntimeFiles(projectRoot) {
    for (const hook of MANAGED_HOOK_FILES) {
      removeManagedFile(path.join(projectRoot, hook.relativePath), projectRoot);
    }
  }
}

module.exports = ClaudeAdapter;

function rewriteCanonicalAgentNamesForSkills(content) {
  return rewriteCanonicalAgentNamesForExecution(content).replace(
    /Use fully-qualified agent names inside Task calls\./g,
    'Use bare agent names inside Task calls.',
  );
}

function rewriteCanonicalAgentNamesForExecution(content) {
  return content;
}

function isClaudeRuntimeSetupSurface(context = {}) {
  return context.skillName === 'spec-mcp-setup' || context.commandName === 'mcp-setup';
}

function addClaudeSetupHostPin(content) {
  if (content.includes('## Claude Host Pin')) {
    return content;
  }

  return content.replace(/## Workflow Modes\n/, [
    '## Claude Host Pin',
    '',
    'When this generated Claude command or workflow Skill invokes `skills/spec-mcp-setup/scripts/*`, set `MCP_SETUP_HOST=claude` in the script environment. Treat `/spec:mcp-setup` and `/spec:runtime-setup` command entry as authoritative Claude host evidence; do not infer Kiro, Qoder, or Codex from PATH, existing runtime directories, or stale setup facts.',
    '',
    '## Workflow Modes',
    '',
  ].join('\n'));
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
  return results;
}

function collectRegisteredAgentNames(agentsRoot) {
  const names = new Set();

  for (const filePath of listMarkdownFiles(agentsRoot)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/^name:\s*(.+)$/m);
    if (match) {
      names.add(match[1].trim());
    }
  }

  return names;
}

function findTaskAgentRefs(filePaths) {
  const refs = [];

  for (const filePath of filePaths) {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.matchAll(/Task\s+([a-z0-9:-]+)\(/g);
    for (const match of matches) {
      refs.push({ filePath, agentName: match[1] });
    }
  }

  return refs;
}

function inspectManagedHookFiles(projectRoot) {
  return MANAGED_HOOK_FILES.map((hook) => inspectManagedHookFile(projectRoot, hook));
}

function inspectManagedHookFile(projectRoot, hook) {
  const targetPath = path.join(projectRoot, hook.relativePath);
  if (!fs.existsSync(targetPath)) {
    return {
      level: 'WARNING',
      name: hook.relativePath,
      message: 'missing',
      fix: formatInitGuidance('claude', `in this project to install the managed ${hook.displayName} hook`),
    };
  }

  const actual = fs.readFileSync(targetPath, 'utf8');
  const expected = hook.render();
  if (actual !== expected) {
    return {
      level: 'WARNING',
      name: hook.relativePath,
      message: 'drifted from bundled template',
      fix: formatInitGuidance('claude', `in this project to restore the managed ${hook.displayName} hook`),
    };
  }

  const mode = fs.statSync(targetPath).mode & 0o777;
  if ((mode & 0o111) !== 0o111) {
    return {
      level: 'WARNING',
      name: hook.relativePath,
      message: `managed ${hook.displayName} hook is not executable`,
      fix: formatInitGuidance('claude', `in this project to restore executable permissions for the managed ${hook.displayName} hook`),
    };
  }

  return {
    level: 'PASS',
    name: hook.relativePath,
    message: `managed ${hook.displayName} hook present`,
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

function renderSpecPlanGuardHookTemplate() {
  return fs.readFileSync(SPEC_PLAN_GUARD_TEMPLATE_PATH, 'utf8');
}

function renderPrdPrewriteGuardHookTemplate() {
  return fs.readFileSync(PRD_PREWRITE_GUARD_TEMPLATE_PATH, 'utf8');
}

function renderPrdReadinessGuardHookTemplate() {
  return fs.readFileSync(PRD_READINESS_GUARD_TEMPLATE_PATH, 'utf8');
}

function summarizeOperations(operations) {
  const summary = {};
  for (const operation of operations) {
    summary[operation.kind] = (summary[operation.kind] || 0) + 1;
  }
  return summary;
}

function removeManagedFile(filePath, projectRoot) {
  fs.rmSync(filePath, { force: true });
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

function splitMarkdownFrontmatter(content) {
  if (!content.startsWith('---\n')) {
    return {
      frontmatter: '',
      body: content.trimStart(),
    };
  }

  const closingIndex = content.indexOf('\n---\n', 4);
  if (closingIndex === -1) {
    return {
      frontmatter: '',
      body: content.trimStart(),
    };
  }

  return {
    frontmatter: content.slice(0, closingIndex + 5).trimEnd(),
    body: content.slice(closingIndex + 5).trimStart(),
  };
}
