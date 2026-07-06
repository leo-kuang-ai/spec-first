/**
 * Base class for platform adapters
 * Each platform (Claude, Codex, etc.) implements this interface
 */
class PlatformAdapter {
  /**
   * Platform identifier (e.g., 'claude', 'codex')
   */
  get id() {
    throw new Error('Not implemented: id');
  }

  /**
   * Runtime root directory (e.g., '.claude', '.codex')
   */
  get runtimeRoot() {
    throw new Error('Not implemented: runtimeRoot');
  }

  /**
   * Managed root directory for spec-first state
   */
  get managedRoot() {
    throw new Error('Not implemented: managedRoot');
  }

  /**
   * Commands directory path
   */
  get commandRoot() {
    throw new Error('Not implemented: commandRoot');
  }

  /**
   * Whether this platform installs bundled command entrypoints.
   * Platforms like Codex can rely on skill discovery only.
   */
  get hasCommands() {
    return true;
  }

  /**
   * Whether this platform installs bundled agent profiles.
   * Preview hosts can opt out until their native agent/subagent surface is proven.
   */
  get supportsAgents() {
    return true;
  }

  /**
   * Skills directory path (user-visible standalone skills only)
   */
  get skillsRoot() {
    throw new Error('Not implemented: skillsRoot');
  }

  /**
   * Workflows directory path (command-backing skill specs; not exposed as slash commands)
   */
  get workflowsRoot() {
    throw new Error('Not implemented: workflowsRoot');
  }

  /**
   * Agents directory path
   */
  get agentsRoot() {
    throw new Error('Not implemented: agentsRoot');
  }

  /**
   * State file path
   */
  get stateFile() {
    throw new Error('Not implemented: stateFile');
  }

  /**
   * Repo-root instruction file written by spec-first init (e.g., CLAUDE.md, AGENTS.md).
   * Used by lang-policy.js to locate the file that governs AI assistant behavior.
   */
  get instructionFile() {
    throw new Error('Not implemented: instructionFile');
  }

  /**
   * Map a bundled command definition to the runtime filename for this platform.
   * @param {{ filename: string }} command
   * @returns {string}
   */
  commandFilename(command) {
    return command.filename;
  }

  /**
   * Render command content for platform-specific runtime
   * @param {object} _command - Bundled command definition
   * @param {string} templateContent - Bundled command template content
   * @param {{ skillName?: string, skillContent?: string, commandName?: string }} [context]
   * @returns {string}
   */
  renderCommandContent(_command, templateContent, context = {}) {
    return this.transformSkillContent(templateContent, context);
  }

  /**
   * Transform skill content for platform-specific runtime
   * @param {string} content - Original skill content
   * @param {{ skillName?: string }} [_context] - Optional asset context
   * @returns {string} Transformed content
   */
  transformSkillContent(content, _context = {}) {
    return content;
  }

  /**
   * Transform agent content for platform-specific runtime
   * @param {string} content - Original agent content
   * @returns {string} Transformed content
   */
  transformAgentContent(content) {
    return content;
  }

  /**
   * Inspect platform runtime assets
   * @param {string} projectRoot - Project root directory
   * @returns {object} Inspection result
   */
  inspect(projectRoot) {
    throw new Error('Not implemented: inspect');
  }

  /**
   * Plan any additional platform-specific runtime file sync operations.
   * @param {string} projectRoot
   * @param {object} _options
   * @returns {{ operations: object[], summary: object }}
   */
  planRuntimeFilesSync(_projectRoot, _options = {}) {
    return {
      operations: [],
      summary: {},
    };
  }

  /**
   * Plan any additional platform-specific runtime removal operations.
   * @param {string} _projectRoot
   * @param {object} _options
   * @returns {{ operations: object[], summary: object }}
   */
  planRuntimeFilesRemoval(_projectRoot, _options = {}) {
    return {
      operations: [],
      summary: {},
    };
  }

  /**
   * Inspect any additional platform-specific runtime files.
   * @param {string} projectRoot
   * @returns {Array<{ level: string, name: string, message: string, fix?: string }>}
   */
  inspectRuntimeFiles(projectRoot) {
    return [];
  }

  /**
   * Remove any additional platform-specific runtime files.
   * @param {string} projectRoot
   */
  removeRuntimeFiles(projectRoot) {}
}

module.exports = PlatformAdapter;
