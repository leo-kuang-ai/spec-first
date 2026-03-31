const fs = require('node:fs');
const path = require('node:path');

const PlatformAdapter = require('./base');

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

  get agentsRoot() {
    return '.claude/agents';
  }

  get stateFile() {
    return '.claude/spec-first/state.json';
  }

  get developerFile() {
    return '.claude/spec-first/.developer';
  }

  transformSkillContent(content) {
    // Transform spec-first:namespace:name to namespace:name
    return content.replace(/\bspec-first:([a-z-]+):([a-z-]+)\b/g, '$1:$2');
  }

  transformAgentContent(content) {
    // Same transformation for agents
    return content.replace(/\bspec-first:([a-z-]+):([a-z-]+)\b/g, '$1:$2');
  }

  inspect(projectRoot) {
    const runtimeDir = path.join(projectRoot, this.runtimeRoot);
    const commandDir = path.join(projectRoot, this.commandRoot);
    const skillsDir = path.join(projectRoot, this.skillsRoot);
    const agentsDir = path.join(projectRoot, this.agentsRoot);
    const stateFilePath = path.join(projectRoot, this.stateFile);
    const developerFilePath = path.join(projectRoot, this.developerFile);

    return {
      platform: this.id,
      runtimeExists: fs.existsSync(runtimeDir),
      commands: fs.existsSync(commandDir),
      skills: fs.existsSync(skillsDir),
      agents: fs.existsSync(agentsDir),
      state: fs.existsSync(stateFilePath),
      developer: fs.existsSync(developerFilePath),
    };
  }
}

module.exports = ClaudeAdapter;
