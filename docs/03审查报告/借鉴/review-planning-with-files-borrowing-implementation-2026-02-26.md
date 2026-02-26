# Spec-First 对《Planning-with-Files 可借鉴要素分析》实现完成度审查报告

- 审查日期: 2026-02-26
- 审查对象文档: `docs/01需求文档/v2/优势借鉴分析/Spec-First 可借鉴 Planning-with-Files 的要素分析.md`
- 审查范围: 文档列出的 11 项可借鉴机制在当前代码与 Skill 体系中的落地状态
- 审查结论: **未全部完成**（1 项完成，8 项部分完成，2 项未完成）

## 一、主要发现（按严重度）

### P0-1: 2-Action Rule 未按文档要求落在 `spec/research`
- 结论: **部分完成（偏离落地目标）**
- 影响: 研究/规格阶段无法形成“每 2 次关键动作即落盘”的强制节奏，仍可能出现信息丢失。
- 证据:
  - 文档映射要求位于 `/spec-first:research + /spec-first:spec`（见原文映射表 #3）。
  - `skills/spec-first/07-code/SKILL.md` 已有 2-Action Rule。
  - `skills/spec-first/03-spec/SKILL.md` 未见 2-Action Rule。
  - `skills/spec-first/05-research/SKILL.md` 未见 2-Action Rule。

### P0-2: 5-Question Reboot Test 仅有规则文本，未在 catchup 实现中执行
- 结论: **部分完成**
- 影响: 恢复质量无法被程序化验证，仍依赖人工主观判断。
- 证据:
  - `skills/spec-first/02-catchup/SKILL.md` 明确要求 5 问。
  - `src/core/ai-orchestrator/catchup.ts` 当前只输出阶段/任务/进度/缺失文件摘要，无 5 问结构化输出与校验。

### P1-1: Context Reduction 分层压缩未接入主流程
- 结论: **未完成**
- 影响: Context Pack 构建虽有基础分层引用，但缺少“近期保留 FULL、历史压缩 COMPACT”的策略闭环。
- 证据:
  - `src/core/ai-orchestrator/context-slicing.ts` 定义了 `sliceContext()`，但未被其他模块调用。
  - `src/core/ai-orchestrator/context-pack.ts` 未接入 slicing 逻辑。

### P1-2: PostToolUse 当前是 matrix 检查，不是“进度同步提醒”
- 结论: **部分完成**
- 影响: 能做一致性诊断，但不能直接提醒“是否应更新 task_plan 状态”。
- 证据:
  - `src/core/tool-integration/ai-runtime-hook.ts` 的 `PostToolUse` 调用 `npx spec-first matrix check "$FEAT"`。

### P1-3: Session Recovery 为“自动提示”，非“自动恢复”
- 结论: **部分完成**
- 影响: 启动时可提示 catchup，但未做到跨会话未同步消息自动分析。
- 证据:
  - `src/core/tool-integration/session-hook.ts` 仅在检测 `.spec-first/current` 时 echo 提示执行 `spec-first ai catchup`。

### P1-4: Plan Mode 协同主要停留在 plan skill 文案
- 结论: **部分完成**
- 影响: 规则存在，但 `spec/design` 未形成对 Plan Mode 的明确协同入口与落盘约束。
- 证据:
  - `skills/spec-first/11-plan/SKILL.md` 包含“Plan Mode 协同”章节。
  - `skills/spec-first/03-spec/SKILL.md`、`skills/spec-first/04-design/SKILL.md` 未见对应集成条款。

### P2-1: PreToolUse 刷新范围与内容弱于目标形态
- 结论: **部分完成**
- 影响: 已有注意力刷新，但覆盖操作类型和输出信息粒度仍偏窄。
- 证据:
  - `src/core/tool-integration/ai-runtime-hook.ts` matcher 为 `write|edit|create`。
  - `task-context.sh` 仅输出当前 in_progress TASK 简要信息。

### P2-2: KV-Cache 优化未见专项落地
- 结论: **未完成**
- 影响: 缺少显式前缀稳定策略与相关守卫，缓存命中优化不可验证。
- 证据:
  - 未检索到 KV-Cache 专项实现或规则落地点。
  - `src/core/skill-runtime/prompt-assembler.ts` 包含 `DATE_ISO` 动态占位符，不利于前缀稳定。

## 二、11 项对照结果

| # | 要素 | 状态 | 判定说明 |
|---|---|---|---|
| 1 | PreToolUse Hook 注意力操控 | 部分完成 | 已有 Hook + task-context 脚本，但刷新范围/内容低于文档目标 |
| 2 | 文件系统即外部记忆（Read/Write 决策矩阵） | 部分完成 | `code` skill 有矩阵；未形成跨 skill 统一执行约束 |
| 3 | 2-Action Rule 强制持久化 | 部分完成 | 只在 `code` skill 落地，`spec/research` 缺失 |
| 4 | Stop Hook 完成度守门 | 完成 | `stop-guard.sh` 已阻断未完成 TASK 的会话结束 |
| 5 | 3-Strike Error Protocol | 部分完成 | `code` skill 文案已落地；缺少程序化计数/强制升级机制 |
| 6 | 5-Question Reboot Test | 部分完成 | `catchup` skill 文案有要求，CLI 实现未执行 5 问校验 |
| 7 | Session Recovery 自动恢复 | 部分完成 | SessionStart 自动提示已实现，自动恢复未实现 |
| 8 | KV-Cache 优化原则 | 未完成 | 未见独立落地机制 |
| 9 | PostToolUse Hook 进度同步 | 部分完成 | 当前为 matrix check，不是进度提醒型 prompt/hook |
| 10 | Context Reduction 分层压缩 | 未完成 | slicing 未接入 context-pack 主流程 |
| 11 | 与 Claude Code Plan Mode 协同 | 部分完成 | plan 中有规则，spec/design 未形成协同落地 |

## 三、验证记录

执行并通过的测试：
- `pnpm -s vitest run tests/unit/ai-runtime-hook.test.ts tests/unit/session-hook.test.ts`
- `pnpm -s vitest run tests/unit/ai-orchestrator.test.ts`
- `pnpm -s vitest run tests/unit/task-context-hook.test.ts tests/unit/stop-guard-hook.test.ts`

结果摘要：
- Hook 注册、SessionStart、Stop Guard、Catchup/ContextPack 现有行为可运行。
- 但“可运行”不等于“完全满足分析文档目标”，关键缺口见上一节。

## 四、建议修复顺序

1. P0：把 2-Action Rule 补到 `03-spec` 与 `05-research`，并定义最小落盘字段（当前结论/证据路径/下一步）。
2. P0：在 `catchup.ts` 输出中增加 5-Question 结构化答案与缺口标记。
3. P1：将 `sliceContext()` 接入 `buildContextPack()` 输出链路，形成可观察降级级别。
4. P1：把 PostToolUse 从“仅 matrix check”升级为“matrix check + 进度同步提醒”。
5. P2：补充 KV-Cache 稳定性规则（静态前缀约束、动态字段外置策略）。

## 五、附：关键证据文件

- `src/core/tool-integration/ai-runtime-hook.ts`
- `src/core/tool-integration/session-hook.ts`
- `src/core/ai-orchestrator/catchup.ts`
- `src/core/ai-orchestrator/context-pack.ts`
- `src/core/ai-orchestrator/context-slicing.ts`
- `skills/spec-first/02-catchup/SKILL.md`
- `skills/spec-first/03-spec/SKILL.md`
- `skills/spec-first/04-design/SKILL.md`
- `skills/spec-first/05-research/SKILL.md`
- `skills/spec-first/07-code/SKILL.md`
- `skills/spec-first/11-plan/SKILL.md`
