'use strict';

const fs = require('node:fs');
const path = require('node:path');

const CodexAdapter = require('./codex');
const { formatInitGuidance } = require('../init-guidance');
const {
  ZCODE_CONFIG_RELATIVE_PATH,
  ZCODE_SESSION_START_RELATIVE_PATH,
  inspectManagedZcodeConfig,
  renderManagedZcodeConfig,
  renderManagedZcodeConfigRemoval,
} = require('../zcode-settings');

const SESSION_START_TEMPLATE_PATH = path.join(__dirname, '..', '..', '..', 'templates', 'zcode', 'hooks', 'session-start');

/**
 * ZCode platform adapter
 *
 * ZCode is an AGENTS.md-ecosystem native host: it discovers workflow skills from
 * the shared `.agents/skills/` projection (the same surface Codex consumes) and
 * reads the shared `AGENTS.md` instruction file, so skill content transforms and
 * the shared-surface cleanup contract reuse the Codex pipeline verbatim.
 * ZCode-specific state lives under `.zcode/spec-first/`, and the SessionStart
 * hook is registered through the `.zcode/config.json` managed slice
 * (`hooks.events.SessionStart` + `hooks.enabled`), not a hooks.json file.
 */
class ZcodeAdapter extends CodexAdapter {
  get id() {
    return 'zcode';
  }

  get runtimeRoot() {
    return '.zcode';
  }

  get managedRoot() {
    return '.zcode/spec-first';
  }

  get commandRoot() {
    return '.zcode/commands/spec';
  }

  get agentsRoot() {
    return '.zcode/agents';
  }

  get stateFile() {
    return '.zcode/spec-first/state.json';
  }

  get supportsAgents() {
    return false;
  }

  get supportState() {
    return 'preview';
  }

  get evidenceClaim() {
    return 'skills_discovery_and_session_start_live_verified';
  }

  planRuntimeFilesSync(projectRoot) {
    const operations = [];

    const sessionStartTarget = path.join(projectRoot, ZCODE_SESSION_START_RELATIVE_PATH);
    operations.push({
      kind: fs.existsSync(sessionStartTarget) ? 'update_file' : 'write_file',
      path: ZCODE_SESSION_START_RELATIVE_PATH.replace(/\\/g, '/'),
      reason: 'managed_runtime_hook',
      contents: this.renderSessionStartHookTemplate(),
      mode: 0o755,
    });

    const rendered = renderManagedZcodeConfig(projectRoot);
    // A corrupt user-owned config is never overwritten; the drift surfaces via
    // inspectRuntimeFiles/doctor instead of failing the whole init.
    const skippedConfigWrite = Boolean(rendered.blocked);
    if (!skippedConfigWrite) {
      operations.push({
        kind: fs.existsSync(rendered.filePath) ? 'update_file' : 'write_file',
        path: ZCODE_CONFIG_RELATIVE_PATH.replace(/\\/g, '/'),
        reason: 'managed_runtime_hook',
        contents: rendered.contents,
      });
    }

    return {
      operations,
      summary: summarizeOperations(operations),
      skippedConfigWrite,
      configWriteBlockReason: skippedConfigWrite ? rendered.message : null,
      hooksDisabledByUser: Boolean(rendered.hooksDisabledByUser),
    };
  }

  planRuntimeFilesRemoval(projectRoot) {
    const operations = [
      {
        kind: 'remove_file',
        path: ZCODE_SESSION_START_RELATIVE_PATH.replace(/\\/g, '/'),
        reason: 'managed_runtime_hook',
      },
    ];

    const rendered = renderManagedZcodeConfigRemoval(projectRoot);
    if (rendered) {
      operations.push(rendered.existsAfter
        ? {
          kind: 'update_file',
          path: ZCODE_CONFIG_RELATIVE_PATH.replace(/\\/g, '/'),
          reason: 'managed_runtime_hook',
          contents: rendered.contents,
        }
        : {
          kind: 'remove_file',
          path: ZCODE_CONFIG_RELATIVE_PATH.replace(/\\/g, '/'),
          reason: 'managed_runtime_hook',
        });
    }

    return {
      operations,
      summary: summarizeOperations(operations),
    };
  }

  inspectRuntimeFiles(projectRoot) {
    return [
      this.inspectSessionStartHook(projectRoot),
      ...inspectManagedZcodeConfig(projectRoot).map((status) => ({
        level: status.status === 'installed' ? 'PASS' : 'WARNING',
        drift: status.drift,
        degradedByDesign: status.degradedByDesign,
        reasonCode: status.reasonCode,
        name: ZCODE_CONFIG_RELATIVE_PATH,
        message: status.message,
        ...(status.status === 'installed' ? {} : {
          fix: formatInitGuidance('zcode', 'in this project to restore the managed SessionStart hook config'),
        }),
      })),
    ];
  }

  removeRuntimeFiles(projectRoot) {
    fs.rmSync(path.join(projectRoot, ZCODE_SESSION_START_RELATIVE_PATH), { force: true });

    const rendered = renderManagedZcodeConfigRemoval(projectRoot);
    if (!rendered) {
      return;
    }
    if (rendered.existsAfter) {
      fs.writeFileSync(rendered.filePath, rendered.contents, 'utf8');
    } else {
      fs.rmSync(rendered.filePath, { force: true });
    }
  }

  renderSessionStartHookTemplate() {
    return fs.readFileSync(SESSION_START_TEMPLATE_PATH, 'utf8');
  }

  inspectSessionStartHook(projectRoot) {
    const targetPath = path.join(projectRoot, ZCODE_SESSION_START_RELATIVE_PATH);
    if (!fs.existsSync(targetPath)) {
      return {
        level: 'WARNING',
        name: ZCODE_SESSION_START_RELATIVE_PATH,
        message: 'missing',
        fix: formatInitGuidance('zcode', 'in this project to install the managed SessionStart hook'),
      };
    }

    const actual = fs.readFileSync(targetPath, 'utf8');
    const expected = this.renderSessionStartHookTemplate();
    if (actual !== expected) {
      return {
        level: 'WARNING',
        name: ZCODE_SESSION_START_RELATIVE_PATH,
        message: 'drifted from bundled template',
        fix: formatInitGuidance('zcode', 'in this project to restore the managed SessionStart hook'),
      };
    }

    return {
      level: 'PASS',
      name: ZCODE_SESSION_START_RELATIVE_PATH,
      message: 'managed SessionStart hook present',
    };
  }
}

function summarizeOperations(operations) {
  return operations.reduce((summary, operation) => {
    summary[operation.kind] = (summary[operation.kind] || 0) + 1;
    return summary;
  }, {});
}

module.exports = ZcodeAdapter;
