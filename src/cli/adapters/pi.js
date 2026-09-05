'use strict';

const CodexAdapter = require('./codex');

/**
 * Pi 平台 adapter
 *
 * Pi 是 AGENTS.md 生态原生宿主：项目级 skills 从共享 `.agents/skills/` 投影发现
 * （官方文档化的一级发现来源，从工作目录向上搜索至 git 根），启动时加载共享
 * `AGENTS.md` 指令文件，因此 skill 内容 transform 与共享面清理契约原样复用
 * Codex 管线。Pi 的专属 runtime 面只有 `.pi/spec-first/` 下的 state file，
 * 由共享 init 计划逻辑写入——绝不经 adapter lifecycle：四个 lifecycle 方法
 * 全部显式 no-op 覆盖，避免继承 CodexAdapter 的 `.codex/` hook/config 副作用。
 * Pi 以项目信任门控项目级 `.agents/skills`（`/trust` 或一次性 `pi -a`）；
 * init 输出与 doctor 负责引导这一激活步骤。
 */
class PiAdapter extends CodexAdapter {
  get id() {
    return 'pi';
  }

  get runtimeRoot() {
    return '.pi';
  }

  get managedRoot() {
    return '.pi/spec-first';
  }

  get commandRoot() {
    // 只占据受管命名空间的占位值：基类要求非空，但 hasCommands=false 使其
    // 不参与任何写路径；clean 对 commandRoot 的无守卫存在性探针也不能把
    // 用户自有的 `.pi/prompts/` 误判为 spec-first 安装。
    return '.pi/spec-first/commands';
  }

  get agentsRoot() {
    return '.pi/agents';
  }

  get stateFile() {
    return '.pi/spec-first/state.json';
  }

  get supportsAgents() {
    return false;
  }

  get supportState() {
    return 'preview';
  }

  get evidenceClaim() {
    // 2026-09-05 对 pi 0.85.0 真机验证（RPC get_commands）：项目 skills 从共享
    // .agents/skills 投影发现（仓库根与嵌套子目录同构）；trust 门控确认
    // （-a 恰好解锁 38 个投影 skills，未信任时完全静默）。未真机验证项：
    // 模型中介 /skill: 调用与 AGENTS.md 注入（验证环境无 provider 凭据）。
    return 'skills_discovery_and_trust_live_verified';
  }

  get testedVersions() {
    return ['0.85.0'];
  }

  planRuntimeFilesSync() {
    // state file 由共享 init 计划逻辑写入；CodexAdapter 的实现会计划
    // `.codex/hooks/*` + `.codex/hooks.json` 写入，对 Pi 是错误的副作用面。
    return { operations: [], summary: {} };
  }

  planRuntimeFilesRemoval() {
    return { operations: [], summary: {} };
  }

  inspectRuntimeFiles() {
    return [];
  }

  removeRuntimeFiles() {
    // `.pi/spec-first/` 的移除由共享 managed-root 清理逻辑负责。
  }
}

module.exports = PiAdapter;
