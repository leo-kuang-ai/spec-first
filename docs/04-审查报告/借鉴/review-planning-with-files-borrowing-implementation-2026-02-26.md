# Spec-First 对《Planning-with-Files 可借鉴要素分析》实现完成度审查报告（复审终版）

- 初审日期: 2026-02-26
- 复审日期: 2026-02-26
- 审查对象文档: `docs/01需求文档/v2/优势借鉴分析/Spec-First 可借鉴 Planning-with-Files 的要素分析.md`
- 审查范围: 文档列出的 11 项可借鉴机制在当前代码与 Skill 体系中的落地状态
- 复审结论: **已全部完成**（11 项完成，0 项部分完成，0 项未启动）

## 一、本轮新增闭环修复（本次复审）

### A. Session Recovery 从“提示”升级为“可自动恢复”
- 状态: **已完成**
- 证据:
  - `src/core/tool-integration/session-hook.ts` 已按 `catchup.trigger` 执行 `auto|prompt|off`
  - `tests/unit/session-hook.test.ts` 已覆盖 `TRIGGER` 分支与 catchup 执行命令注入

### B. 3-Strike Error Protocol 增加运行时硬机制
- 状态: **已完成**
- 证据:
  - `src/core/skill-runtime/phase-machine.ts` 已实现 3 次修订上限触发强制升级错误
  - `tests/unit/skill-runtime.test.ts` 已新增 3-strike 触发断言

### C. PreToolUse 注意力刷新覆盖与粒度增强
- 状态: **已完成**
- 证据:
  - `src/core/tool-integration/ai-runtime-hook.ts` 已扩展写操作 matcher（含 multi_edit 等）
  - `task-context.sh` 已增加 `Current Stage` 与 `Open TASKs` 输出
  - `tests/unit/ai-runtime-hook.test.ts`、`tests/unit/task-context-hook.test.ts` 已覆盖

### D. KV-Cache 稳定性检查接入可选硬门禁
- 状态: **已完成**
- 证据:
  - `src/shared/config-schema.ts` 新增 `runtime.kv_cache_hard_gate`
  - `src/core/skill-runtime/dispatcher.ts` 在 `loadSkill()` 中接入稳定性检查并支持硬阻断
  - `tests/unit/skill-runtime.test.ts`、`tests/unit/config-schema.test.ts` 已覆盖

### E. “文件系统即外部记忆”跨 Skill 统一约束补齐
- 状态: **已完成**
- 证据:
  - `skills/spec-first/AGENTS.md` 已新增全 Skill 统一约束
  - `skills/spec-first/04-design/SKILL.md`
  - `skills/spec-first/06-task/SKILL.md`
  - `skills/spec-first/12-verify/SKILL.md`
  - `skills/spec-first/13-orchestrate/SKILL.md`

## 二、11 项对照结果（复审终版）

| # | 要素 | 状态 | 判定说明 |
|---|---|---|---|
| 1 | PreToolUse Hook 注意力操控 | 完成 | Hook 覆盖写操作增强，task-context 粒度提升 |
| 2 | 文件系统即外部记忆（Read/Write 决策矩阵） | 完成 | 全局 AGENTS + 多 Skill 统一落盘约束 |
| 3 | 2-Action Rule 强制持久化 | 完成 | 已覆盖 `spec/research/code` 且补齐跨 Skill 执行约束 |
| 4 | Stop Hook 完成度守门 | 完成 | `stop-guard.sh` 阻断未完成 TASK 结束 |
| 5 | 3-Strike Error Protocol | 完成 | phase-machine 已有运行时强制升级机制 |
| 6 | 5-Question Reboot Test | 完成 | catchup CLI 结构化输出 + 缺失项去重 |
| 7 | Session Recovery 自动恢复 | 完成 | SessionStart 支持 `catchup.trigger=auto` 自动恢复 |
| 8 | KV-Cache 优化原则 | 完成 | 稳定性检查已接入 runtime，可配置硬门禁 |
| 9 | PostToolUse Hook 进度同步 | 完成 | 进度同步提醒脚本已落地并验证 |
| 10 | Context Reduction 分层压缩 | 完成 | `sliceContext` 已接入 context-pack |
| 11 | 与 Claude Code Plan Mode 协同 | 完成 | `plan/spec/design` 协同条款已补齐 |

## 三、复审验证记录

执行并通过的测试：
- `pnpm -s vitest run tests/unit/session-hook.test.ts tests/unit/ai-runtime-hook.test.ts tests/unit/task-context-hook.test.ts tests/unit/skill-runtime.test.ts tests/unit/config-schema.test.ts tests/unit/init.test.ts tests/unit/update-scaffold.test.ts tests/unit/progress-sync-hook.test.ts --reporter=dot`
- `pnpm -s vitest run tests/unit/cli-metrics-doctor.test.ts --reporter=dot`
- `pnpm -s tsc --noEmit`

关键复审断言：
- SessionStart 已包含 `catchup.trigger` 分支决策与自动恢复执行路径
- 3-strike 在运行时第 3 次连续修订时触发硬阻断并要求升级
- PreToolUse 刷新输出包含阶段与未完成任务计数
- KV 不稳定模板在 `kv_cache_hard_gate=true` 时会阻断加载

## 四、附：关键证据文件

- `src/core/tool-integration/session-hook.ts`
- `src/core/tool-integration/ai-runtime-hook.ts`
- `src/core/skill-runtime/phase-machine.ts`
- `src/core/skill-runtime/dispatcher.ts`
- `src/shared/config-schema.ts`
- `skills/spec-first/AGENTS.md`
- `skills/spec-first/04-design/SKILL.md`
- `skills/spec-first/06-task/SKILL.md`
- `skills/spec-first/12-verify/SKILL.md`
- `skills/spec-first/13-orchestrate/SKILL.md`
- `tests/unit/session-hook.test.ts`
- `tests/unit/ai-runtime-hook.test.ts`
- `tests/unit/task-context-hook.test.ts`
- `tests/unit/skill-runtime.test.ts`
- `tests/unit/config-schema.test.ts`
