# ZCode SessionStart 激活真机验证与 10 轮测评

- 日期：2026-09-05
- 结论：**SessionStart hook 真机激活 confirmed**（registry 已随本证据从 `degraded: zcode_activation_unverified` 升级为 `confirmed`）；10 轮 × 6 项激活链测评 60/60 全绿、零 flake。
- 变更基础：commit `a8482f46`（feat(cli): zcode 接入为第七受支持宿主），PR #46。

## 1. 真机激活证据（升级依据）

前一会话在本仓库执行 `spec-first init --zcode` 安装 managed hook 后，用户重启 ZCode 客户端/新开会话。新会话启动时 ZCode 客户端按 `.zcode/config.json` 的 `hooks.events.SessionStart` 配置执行了 `node .zcode/hooks/session-start`，并把 hook 的 stdout JSON 中的 `additionalContext` 注入会话上下文。会话注入原文（逐字）：

```text
SessionStart hook additional context:
#1
[spec-first] using-spec-first SessionStart injection
Workflow entry governance is active in this repo's AGENTS.md (`spec-first:lang` managed block): route substantial work through a public spec-* workflow before non-trivial or risky edits, and in a parent multi-repo workspace keep writes within an explicit target_repo.
Full routing policy: .agents/skills/using-spec-first/SKILL.md.
```

该内容与 `templates/zcode/hooks/session-start` 的 installed 分支输出逐字一致（含 `spec-first:lang` 锚点措辞与路由策略指针），仓库内无其他产物会生成该文本。激活链的每个环节由此得到证实：

1. ZCode 客户端读取 workspace `.zcode/config.json`（`hooks.enabled: true` 生效）；
2. `SessionStart` 事件在会话启动时触发；
3. `node .zcode/hooks/session-start` 以可执行方式运行成功（cwd 语义下相对路径命令有效）；
4. 严格 JSON 输出（顶层仅 `hookSpecificOutput`）被客户端解析；
5. `additionalContext` 内容完整注入会话。

## 2. 10 轮激活链测评

- 方法：每轮在仓库工作区内新建隔离沙箱（独立 git 仓库 + 独立 `HOME`），执行 6 项检查后销毁；共 10 轮。判定全部脚本化（JSON 解析 + 内容断言）。
- 环境：macOS (arm64, darwin 25.5.0)、Node v22.22.3、spec-first v1.15.1（工作区 HEAD `a8482f46` + 本次 registry 升级改动）。
- 原始结果：`docs/validation/zcode-host-activation/activation-eval-results.jsonl`（每轮一行 JSON 布尔记录）。

| 检查项 | 内容 | 通过 |
|---|---|---|
| c1_init | 隔离沙箱 `init --zcode` exit 0 且宿主 ready | 10/10 |
| c2_hook_injection | 直接执行 hook（stdin `{}`），输出合法 JSON、`hookEventName=SessionStart`、治理指针（`spec-first:lang`）注入 | 10/10 |
| c3_missing_guidance | `AGENTS.md` 缺失时输出恢复指引（choose ZCode） | 10/10 |
| c4_env_resolution | 外部 cwd + `ZCODE_PROJECT_DIR` 环境变量解析项目根并正确注入 | 10/10 |
| c5_idempotent | 二次 `init --zcode` 幂等：managed entry 恰 1 条、无 `current_runtime_drift` | 10/10 |
| c6_doctor | `doctor --zcode --json`：hook 检查与 config 检查均 PASS | 10/10 |

**完全通过轮数：10/10；总判定 60/60；零 flake、零重试。**

测评过程中的一个判定脚本缺陷（汇总器以字符串 `'true'` 比较 JSON 布尔值导致首报 0/10）已在归档前修正——原始结果文件为机器写入的布尔记录，重算即得上述结论；该缺陷属评测工具层，不涉及被测对象。

## 3. 随证据落地的状态升级

- `src/cli/adapters/platform-registry.js`：zcode `sessionStart` `degraded: zcode_activation_unverified` → `confirmed`。
- `src/cli/zcode-settings.js`：config 检查的 installed+enabled 分支从 degraded-by-design 改为 installed（doctor 显示 PASS，注明 live 验证日期与本文件引用）。
- `src/cli/adapters/zcode.js`：`evidenceClaim` 更新为 `skills_discovery_and_session_start_live_verified`。
- `src/cli/commands/init-project-plan.js`：移除「activation not yet verified」的 init 警告（前提已不成立）；`zcode_config_write_skipped` 与 `zcode_hooks_disabled_by_user` 诊断保留。
- 测试同步：`tests/unit/zcode-settings.test.js` 断言更新为 PASS 形态。

## 4. 剩余边界（诚实声明）

- **MCP setup 写入路径仍未真机验证**：`hosts.zcode` 的 registry 契约（workspace `.zcode/config.json` 的嵌套 `mcp.servers`）与 surface binding 修复已由单测与 `MCP_SETUP_HOST=zcode` 模块级验证覆盖，但「真实 ZCode 会话中运行 `spec-runtime-setup` 完成 MCP 写入并被客户端连接」尚未发生。`supportState` 因此维持 `preview`。
- 真机证据来自单台机器（macOS arm64 + ZCode 桌面 3.10.x）；Windows/其他版本的 hook 行为未采样。
- hook 命令为 cwd 相对的 `node .zcode/hooks/session-start`；c4 证明 `ZCODE_PROJECT_DIR` 路径可用，但客户端若以非项目根 cwd 且不注入该变量执行 hook，则注入会静默失效——该形态未观测到，留作 doctor `zcode_hooks_disabled`/缺失诊断的覆盖范围。
