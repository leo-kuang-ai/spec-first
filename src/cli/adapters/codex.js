const fs = require('node:fs');
const path = require('node:path');

const PlatformAdapter = require('./base');

/**
 * Codex platform adapter
 *
 * Codex support is project-scoped and mirrors the Trellis model:
 * - shared workflow skills live in `.agents/skills/`
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
    return '.codex/spec-first/commands';
  }

  get skillsRoot() {
    return '.agents/skills';
  }

  get agentsRoot() {
    return '.codex/agents';
  }

  get stateFile() {
    return '.codex/spec-first/state.json';
  }

  get developerFile() {
    return '.codex/spec-first/.developer';
  }

  get legacyCommandRoot() {
    return '.codex/commands/spec';
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
    return rewriteSkillName(
      transformCodexContent(rewriteSharedPaths(content)),
      context.skillName,
    );
  }

  transformAgentContent(content) {
    return transformCodexContent(rewriteSharedPaths(content));
  }

  inspect(projectRoot) {
    const runtimeDir = path.join(projectRoot, this.runtimeRoot);
    const skillsDir = path.join(projectRoot, this.skillsRoot);
    const agentsDir = path.join(projectRoot, this.agentsRoot);
    const stateFilePath = path.join(projectRoot, this.stateFile);
    const developerFilePath = path.join(projectRoot, this.developerFile);

    return {
      platform: this.id,
      runtimeExists: fs.existsSync(runtimeDir),
      commands: false,
      skills: fs.existsSync(skillsDir),
      agents: fs.existsSync(agentsDir),
      state: fs.existsSync(stateFilePath),
      developer: fs.existsSync(developerFilePath),
    };
  }

  syncRuntimeFiles(projectRoot) {
    this.removeRuntimeFiles(projectRoot);
    return [];
  }

  inspectRuntimeFiles() {
    return [];
  }

  removeRuntimeFiles(projectRoot) {
    removeManagedDirectory(path.join(projectRoot, this.legacyCommandRoot), projectRoot);
    removeManagedDirectory(path.join(projectRoot, this.legacyCodexSkillsRoot), projectRoot);
    removeManagedDirectory(path.join(projectRoot, this.legacyMarketplaceRoot), projectRoot);
    removeManagedDirectory(path.join(projectRoot, this.legacyPluginRoot), projectRoot);
    removeManagedDirectory(path.join(projectRoot, this.legacyPluginRootAlt), projectRoot);
  }
}

module.exports = CodexAdapter;

function rewriteSharedPaths(content) {
  return content
    .replace(/\.claude\/commands\/spec\/([a-z-]+)\.md/g, (_match, commandName) => {
      return `.agents/skills/spec-${commandName}/SKILL.md`;
    })
    .replace(/\.codex\/commands\/spec\/([a-z-]+)\.md/g, (_match, commandName) => {
      return `.agents/skills/spec-${commandName}/SKILL.md`;
    })
    .replace(/\.claude\/skills\//g, '.agents/skills/')
    .replace(/\.codex\/skills\//g, '.agents/skills/')
    .replace(/\.claude\/agents\//g, '.codex/agents/')
    .replace(/--claude\b/g, '--codex');
}

function transformCodexContent(content) {
  let transformed = content;

  transformed = transformed.replace(
    /^(\s*-?\s*)Task\s+spec-first:([a-z-]+):([a-z-]+)\(([^)]*)\)/gm,
    (_match, prefix, category, agentName, args) => {
      const summary = args.trim();
      const agentPath = codexAgentPath(category, agentName);
      return summary
        ? `${prefix}Read \`${agentPath}\` and apply that agent profile to: ${summary}`
        : `${prefix}Read \`${agentPath}\` and apply that agent profile`;
    },
  );

  transformed = transformed.replace(
    /`spec-first:([a-z-]+):([a-z-]+)`/g,
    (_match, category, agentName) => `\`${codexAgentPath(category, agentName)}\``,
  );

  transformed = transformed.replace(
    /\bspec-first:([a-z-]+):([a-z-]+)\b/g,
    (_match, category, agentName) => `\`${codexAgentPath(category, agentName)}\``,
  );

  transformed = transformed.replace(
    /@([a-z][a-z0-9-]*-(?:agent|reviewer|researcher|analyst|specialist|oracle|sentinel|guardian|strategist))/gi,
    (_match, agentName) => `\`${codexAgentPath('review', agentName)}\``,
  );

  return transformed;
}

function rewriteSkillName(content, skillName) {
  if (!skillName) {
    return content;
  }

  return content.replace(/^name:\s*.+$/m, `name: ${skillName}`);
}

function codexAgentPath(category, agentName) {
  return `.codex/agents/${category}/${agentName}.md`;
}

function removeManagedDirectory(directoryPath, projectRoot) {
  fs.rmSync(directoryPath, { recursive: true, force: true });
  removeEmptyParents(path.dirname(directoryPath), projectRoot);
}

function removeEmptyParents(startPath, stopRoot) {
  let current = startPath;
  while (current.startsWith(stopRoot + path.sep) && current !== stopRoot) {
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
