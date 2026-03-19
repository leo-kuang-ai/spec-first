# Architecture Review Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 对 `spec-first` 仓库执行一次架构级多视角审查，覆盖系统设计、端到端流程、skill/CLI 契约、近期代码变更与运行态一致性，并输出可执行审查报告。

**Architecture:** 审查分为三条并行线：流程/状态线、追踪/覆盖率线、Skill/编排线。每条线先做证据采样，再做一致性与健壮性判断，最后合并为单份结论报告，并按严重度排序给出修复建议。

**Tech Stack:** Node.js 20, TypeScript, Vitest, Markdown-based specs, Skill runtime, CLI process engine

---

### Task 1: 建立审查范围与证据入口

**Files:**
- Modify: `docs/plans/2026-03-06-architecture-review-execution-plan.md`
- Create: `docs/04-审查报告/2026-03-06-架构与流程多agent审查报告.md`
- Read: `README.md`
- Read: `docs/first/architecture.md`
- Read: `package.json`

**Step 1: 读取仓库与当前 Feature 入口**

Run: `sed -n '1,240p' README.md`
Expected: 能确认产品定位、双层架构和主流程定义

**Step 2: 读取活动 Feature 与运行态**

Run: `sed -n '1,220p' .spec-first/current && sed -n '1,260p' specs/FSREQ-20260306-DASHBOARD-001/stage-state.json`
Expected: 能确认当前 Feature、阶段状态、历史流转和是否存在跳阶段/强制推进痕迹

**Step 3: 建立三条并行审查线**

- 流程/状态线：`src/core/process-engine/*`, `src/cli/commands/stage.ts`, `specs/*/stage-state.json`
- 追踪/覆盖率线：`src/core/trace-engine/*`, `src/core/gate-engine/*`, `tests/unit/coverage.test.ts`
- Skill/编排线：`skills/spec-first/*`, `src/core/skill-runtime/*`, `src/core/tool-integration/*`

**Step 4: 初始化审查报告骨架**

在 `docs/04-审查报告/2026-03-06-架构与流程多agent审查报告.md` 中创建：
- 审查目标
- 审查范围
- 审查方法
- Findings
- 风险与建议

### Task 2: 审查流程/状态线

**Files:**
- Read: `src/core/process-engine/advance.ts`
- Read: `src/core/process-engine/stage-machine.ts`
- Read: `src/cli/commands/stage.ts`
- Read: `specs/FSREQ-20260306-DASHBOARD-001/stage-state.json`
- Read: `specs/FSREQ-20260306-DASHBOARD-001/gate-history.jsonl`

**Step 1: 检查阶段推进守卫**

Run: `sed -n '1,260p' src/core/process-engine/advance.ts`
Expected: 明确 `--force`、依赖检查、Gate 评估、终态写回的行为

**Step 2: 对比运行态文件与推进历史**

Run: `rg -n "FORCE_SKIPPED|currentStage|current_stage|terminal" specs/FSREQ-20260306-DASHBOARD-001 -S`
Expected: 能识别是否存在状态双写、历史与现态不一致、流程绕过证据

**Step 3: 形成流程类 finding**

标准：
- Gate 被强制跳过是否仍允许闭环完成
- 终态文件是否仍保留非权威字段
- stage current / hard gate 是否可能读取到错误阶段

### Task 3: 审查追踪/覆盖率线

**Files:**
- Read: `src/core/trace-engine/coverage.ts`
- Read: `src/core/trace-engine/matrix.ts`
- Read: `src/core/trace-engine/trace-context.ts`
- Read: `src/core/trace-engine/ratio.ts`
- Read: `src/core/gate-engine/gate-evaluator.ts`
- Read: `src/core/gate-engine/sca.ts`
- Test: `tests/unit/coverage.test.ts`
- Test: `tests/unit/trace-context.test.ts`
- Test: `tests/unit/trace-ratio.test.ts`

**Step 1: 阅读近期 trace 重构差异**

Run: `git diff -- src/core/trace-engine/coverage.ts src/core/trace-engine/matrix.ts src/core/gate-engine/gate-evaluator.ts src/core/gate-engine/sca.ts src/core/trace-engine/trace-context.ts src/core/trace-engine/ratio.ts`
Expected: 明确改动是否仅做抽象复用，还是改变了覆盖率语义

**Step 2: 运行聚焦测试**

Run: `npx vitest run tests/unit/coverage.test.ts tests/unit/trace-context.test.ts tests/unit/trace-ratio.test.ts tests/unit/gate-evaluator.test.ts tests/unit/advance.test.ts`
Expected: 记录通过/失败；若失败，提取失败点进入审查报告

**Step 3: 判定是否存在指标语义回归**

重点：
- `pct()` 的零分母语义是否与已有规则、文档、测试一致
- `createTraceContext()` 是否只做缓存复用，还是引入筛选遗漏
- Gate/SCA 是否仍以同一追踪语义解释 FR/DS/TASK/TC

### Task 4: 审查 Skill/编排线

**Files:**
- Read: `skills/spec-first/08-code-review/SKILL.md`
- Read: `skills/spec-first/13-orchestrate/SKILL.md`
- Read: `skills/spec-first/SHARED.md`
- Read: `src/core/skill-runtime/dispatcher.ts`
- Read: `src/core/skill-runtime/hard-gate.ts`
- Read: `src/core/tool-integration/session-hook-managed.ts`

**Step 1: 检查 Skill 文本与运行时契约**

Run: `sed -n '1,260p' skills/spec-first/08-code-review/SKILL.md && sed -n '1,260p' skills/spec-first/13-orchestrate/SKILL.md`
Expected: 明确 code-review/orchestrate 对阶段、证据、用户确认的约束

**Step 2: 检查 dispatcher/hard gate 对这些约束的实现程度**

Run: `sed -n '1,260p' src/core/skill-runtime/dispatcher.ts && sed -n '240,360p' src/core/skill-runtime/hard-gate.ts`
Expected: 能判断 skill 约束是“文本声明”还是“代码强制”

**Step 3: 形成 skill 体系 finding**

标准：
- 文本要求与运行时行为不一致
- skill 允许/默认的路径与流程守卫冲突
- “先合规后质量”“先 verify 再 advance”等铁律是否真被执行

### Task 5: 汇总并产出审查报告

**Files:**
- Modify: `docs/04-审查报告/2026-03-06-架构与流程多agent审查报告.md`

**Step 1: 先写 Findings，按严重度排序**

格式：
- CRITICAL/HIGH/MEDIUM
- 结论
- 证据
- 影响
- 建议

**Step 2: 再写开放问题与系统级建议**

内容：
- 是否建议阻断当前流程
- 哪些问题属于设计缺口，哪些是实现缺陷，哪些是运行态污染
- 建议的修复优先级

**Step 3: 写入验证证据**

包含：
- 已运行命令
- 命令结果
- 未运行项及原因

**Step 4: 输出最终结论**

要求：
- 先 findings 后总结
- 明确指出流程是否顺畅、系统是否健壮、质量是否达标
- 不得基于陈旧证据宣称通过
