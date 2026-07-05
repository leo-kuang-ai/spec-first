---
date: 2026-04-29
topic: startup-version-update-reminder
spec_id: 2026-04-29-001-startup-version-update-reminder
---

# 宿主启动版本更新提醒

## Problem Frame

`spec-first` 已有 CLI 级版本提醒：用户运行 `spec-first doctor/init/clean` 时可以发现 npm 上存在新版本。但用户打开 Claude Code 或 Codex 后，可能直接使用 `spec-*` 或 `spec-*` workflow，而不会先运行 CLI 命令，因此旧版本 runtime 可能继续工作很久，用户不知道已有修复或能力更新。

这个需求要解决的是：用户进入 Claude/Codex 会话时，能低噪音地知道 `spec-first` 是否有新版本，并被引导到正确的升级流程。它不应该在启动时自动修改环境，也不应该让版本检查成为会话启动的可靠性风险。

---

## Actors

- A1. 使用者：打开 Claude Code 或 Codex 并使用 spec-first workflow 的人。
- A2. 宿主启动面：Claude Code 的 SessionStart 或 Codex 的会话指令加载面，负责展示提醒。
- A3. spec-first update workflow：`spec-update` 或 `spec-update`，负责解释当前宿主的升级路径。

---

## Key Flows

- F1. 启动时发现新版本
  - **Trigger:** 用户打开 Claude Code 或 Codex 会话。
  - **Actors:** A1, A2, A3
  - **Steps:** 启动面执行非阻塞版本检查；发现当前版本落后于最新版本；向用户展示当前版本、最新版本和宿主对应 update workflow；用户自行决定是否运行升级。
  - **Outcome:** 用户知道有新版本，但环境不会被自动修改。
  - **Covered by:** R1, R2, R3, R4, R7

- F2. 检查失败或网络不可用
  - **Trigger:** 用户打开会话，但远端版本查询失败、超时或不可用。
  - **Actors:** A1, A2
  - **Steps:** 启动面尝试检查；检查失败；失败被静默处理或降级为不打扰状态。
  - **Outcome:** 会话照常启动，不出现错误堆栈或阻塞。
  - **Covered by:** R5, R6

---

## Requirements

**启动检测**

- R1. 当用户打开 Claude Code 或 Codex 会话时，spec-first 应尝试检测当前已加载版本是否落后于最新可用版本。
- R2. 检测必须是非阻塞的辅助能力；无论成功、失败或超时，都不能阻止宿主会话启动。
- R3. 检测结果只用于提醒，不得在启动时自动执行 `claude plugin update`、`npm install -g`、`spec-first init` 或其他会改变本机/项目状态的命令。

**提醒与引导**

- R4. 发现新版本时，提示必须包含当前版本、最新版本、当前宿主对应的 update workflow 入口，以及一句明确的“由用户决定是否升级”的引导。
- R5. 检查失败、网络不可用、权限不足或 registry/API 异常时，不应向用户展示错误堆栈，不应要求用户立即处理。
- R6. 提醒应默认低噪音：同一工作区或同一安装上下文中，最多每 24 小时展示一次同类更新提醒，除非用户主动运行 update workflow。
- R7. Claude 与 Codex 的提示必须使用各自宿主语言：Claude 引导 `spec-update`，Codex 引导 `spec-update`。

**升级决策边界**

- R8. 自动升级不是默认行为；升级必须由用户显式触发，并由现有 `spec-update` workflow 解释和执行宿主对应路径。
- R9. update workflow 仍然负责区分 Claude plugin 更新、Codex npm CLI 更新、runtime assets refresh 和重启宿主等后续动作。
- R10. 启动提醒不得复制完整升级逻辑；它只提供事实和入口，避免形成第二套升级真相源。

---

## Acceptance Examples

- AE1. **Covers R1, R4, R7.** Given 用户打开 Codex，且本地 spec-first CLI/runtime 版本落后于 npm 最新版本，when 启动检测成功，then 用户看到一条短提示，包含当前版本、最新版本和 `spec-update`。
- AE2. **Covers R1, R4, R7.** Given 用户打开 Claude Code，且 marketplace 缓存版本落后于上游版本，when 启动检测成功，then 用户看到一条短提示，包含当前版本、最新版本和 `spec-update`。
- AE3. **Covers R2, R5.** Given 用户离线打开宿主，when 版本查询失败，then 会话正常启动，且不会显示 npm/gh/API 错误堆栈。
- AE4. **Covers R3, R8.** Given 检测发现新版本，when 用户没有显式运行 update workflow，then 系统不会自动安装、更新 plugin、刷新 runtime assets 或重启宿主。

---

## Success Criteria

- 旧版本用户在打开 Claude/Codex 后能自然发现有新版本，而不必先运行 `spec-first doctor`。
- 用户清楚知道下一步该运行 `spec-update` 还是 `spec-update`。
- 启动提醒不会自动改变本机环境、项目 runtime assets 或宿主 plugin 状态。
- 网络失败和版本查询失败不会降低 Claude/Codex 启动可靠性。
- 规划和实现不需要再发明“自动升级还是用户决策”的产品边界。

---

## Scope Boundaries

- 不实现启动时自动升级。
- 不在启动提示里复制 `spec-update` 的完整升级步骤。
- 不要求每次打开宿主都重复提示；默认采用 24 小时低频提醒。
- 不把版本检查失败变成可见错误或健康检查失败。
- 不要求 Codex 和 Claude 使用完全相同的技术触发面；只要求用户体验和边界一致。

---

## Key Decisions

- 自动检测、用户决策：脚本负责提供版本事实，用户通过 update workflow 决定是否改变环境。
- 启动提醒只做入口引导：真正升级路径仍由 `spec-update` 作为单一升级真相源承载。
- 默认 24 小时频控：打开宿主是高频动作，提醒必须降低噪音。
- 失败静默：版本更新提醒是辅助信息，不应影响会话可用性。

---

## Dependencies / Assumptions

- 当前代码库已有 CLI 级 `version-reminder` 与 `spec-update` workflow，可作为行为和文案基础。
- Claude 侧已有 SessionStart hook 注入能力；Codex 侧启动触发能力需要在 planning 中基于宿主实际可用面确认。
- 最新版本来源可以沿用现有 `spec-update` 对 Claude/Codex 的来源划分，避免混用 Claude plugin cache 与 npm CLI 事实。

---

## Outstanding Questions

### Deferred to Planning

- [Affects R1, R7][Technical] Codex 侧应通过 AGENTS.md 启动指令、runtime skill 提醒，还是其他宿主支持的启动面实现低噪音检测？
- [Affects R6][Technical] 24 小时频控状态应存放在用户级 host state、项目级 state，还是按宿主分开记录？
- [Affects R1, R4][Technical] Claude 侧启动检测应直接扩展现有 SessionStart hook，还是复用一个共享 helper 以避免和 CLI reminder 逻辑分叉？

---

## Next Steps

-> 当前宿主的 `spec-plan` 入口，用这份 requirements doc 规划实现。
