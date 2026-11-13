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
 * ZCode 平台 adapter
 *
 * ZCode 是 AGENTS.md 生态原生宿主：从共享 `.agents/skills/` 投影发现 workflow
 * skills（与 Codex 消费同一面），读取共享 `AGENTS.md` 指令文件，因此 skill 内容
 * transform 与共享面清理契约原样复用 Codex 管线。ZCode 专属 state 位于
 * `.zcode/spec-first/`；SessionStart hook 经 `.zcode/config.json` 受管 slice
 * （`hooks.events.SessionStart` + `hooks.enabled`）注册，而非 hooks.json 文件。
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
    // hasCommands=false 使其不参与写路径；收在受管命名空间内，避免 clean 的
    // 无守卫 commandRoot 存在性探针把用户自有的 .zcode/commands/ 误判为已安装。
    return '.zcode/spec-first/commands';
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
    // 用户自有的损坏 config 永不被覆盖；drift 经 inspectRuntimeFiles/doctor
    // 浮出，而不是让整个 init 失败。
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
