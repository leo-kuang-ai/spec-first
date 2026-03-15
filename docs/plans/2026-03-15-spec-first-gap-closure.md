# Spec-First Gap Closure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 补齐 Spec-First 相对其他项目处于 `<=3 星` 的能力短板，优先提升自动化、持久记忆、易用性、多运行时、工具集成和 TDD 强制。

**Architecture:** 以现有 `stage + gate + skill` 体系为内核，不推翻 Spec-First 的阶段状态机，而是在其外层补充 `auto loop`、`memory`、`agent adapter`、`quick path` 和 `tool bridge`。优先做可以复用现有 CLI/状态文件/门禁机制的增量改造，避免引入第二套流程系统。

**Tech Stack:** TypeScript、Commander CLI、现有 Spec-First core/cli 模块、MCP/Playwright 适配、Markdown state/spec 文档。

---

## Scope

本计划覆盖 6 个低分维度：

1. 自动化程度
2. 持久记忆
3. 易用性
4. 多运行时
5. 工具集成
6. TDD 强制

不包含：

- 成本追踪
- Dashboard/预算控制
- 与当前 Gate/Trace 体系无关的大规模重构

---

## P0

### Task 1: 补强 Auto Loop

**Files:**
- Modify: `src/cli/commands/orchestrate.ts`
- Modify: `src/cli/index.ts`
- Create: `src/core/auto-loop/index.ts`
- Create: `src/core/auto-loop/derive-next-action.ts`
- Create: `src/core/auto-loop/auto-loop.types.ts`
- Test: `tests/cli/orchestrate-auto.test.ts`
- Test: `tests/core/auto-loop/index.test.ts`

**Step 1: Write the failing tests**

- 覆盖 `--auto` 在 gate 通过时自动推进到下一阶段。
- 覆盖 `gate` 未通过时自动暂停并输出阻断原因。
- 覆盖 `--resume` 会从当前状态继续，而不是重新初始化。

**Step 2: Run tests to verify they fail**

Run: `pnpm test -- orchestrate-auto auto-loop`

Expected: FAIL，提示自动循环调度逻辑缺失或行为不符。

**Step 3: Write minimal implementation**

- 把当前 `orchestrate` 的自动推进逻辑抽到 `src/core/auto-loop/index.ts`。
- 增加 `deriveNextAction()`，只做三件事：
  1. 读取当前 stage/state
  2. 检查 gate
  3. 选择 `run current skill / advance stage / stop`
- 保持基于现有 stage state 文件驱动，不引入第二套状态机。

**Step 4: Run tests to verify they pass**

Run: `pnpm test -- orchestrate-auto auto-loop`

Expected: PASS

**Step 5: Commit**

```bash
git add src/cli/commands/orchestrate.ts src/cli/index.ts src/core/auto-loop tests/cli/orchestrate-auto.test.ts tests/core/auto-loop/index.test.ts
git commit -m "feat: strengthen auto loop orchestration"
```

### Task 2: 引入超时监督骨架

**Files:**
- Create: `src/core/auto-loop/timeout-supervisor.ts`
- Modify: `src/core/auto-loop/index.ts`
- Test: `tests/core/auto-loop/timeout-supervisor.test.ts`

**Step 1: Write the failing tests**

- 覆盖 `soft` 警告。
- 覆盖 `idle` 停滞检测。
- 覆盖 `hard` 终止自动循环。

**Step 2: Run test to verify it fails**

Run: `pnpm test -- timeout-supervisor`

Expected: FAIL

**Step 3: Write minimal implementation**

- 先实现本地超时状态对象，不接成本、不接外部监控。
- 只提供 `shouldWarn / shouldPause / shouldStop` 三个判断。

**Step 4: Run test to verify it passes**

Run: `pnpm test -- timeout-supervisor`

Expected: PASS

**Step 5: Commit**

```bash
git add src/core/auto-loop/timeout-supervisor.ts src/core/auto-loop/index.ts tests/core/auto-loop/timeout-supervisor.test.ts
git commit -m "feat: add timeout supervision for auto loop"
```

### Task 3: 建立 Steering 项目记忆

**Files:**
- Create: `src/core/steering/index.ts`
- Create: `src/core/steering/load-steering.ts`
- Create: `src/core/steering/save-steering.ts`
- Modify: `src/cli/commands/init.ts`
- Modify: `src/cli/commands/orchestrate.ts`
- Test: `tests/core/steering/index.test.ts`

**Step 1: Write the failing tests**

- 初始化项目时生成最小 steering 结构。
- orchestrate 运行时能加载 steering。
- steering 缺失时回退为安全默认值。

**Step 2: Run test to verify it fails**

Run: `pnpm test -- steering`

Expected: FAIL

**Step 3: Write minimal implementation**

- 在 `.spec-first/` 下新增 steering 文档或状态文件。
- 初始只支持 `product / tech / structure / patterns` 四个字段。
- 在 orchestrate 入口把 steering 注入 skill 上下文。

**Step 4: Run test to verify it passes**

Run: `pnpm test -- steering`

Expected: PASS

**Step 5: Commit**

```bash
git add src/core/steering src/cli/commands/init.ts src/cli/commands/orchestrate.ts tests/core/steering/index.test.ts
git commit -m "feat: add steering project memory"
```

### Task 4: 增加 Quick 路径

**Files:**
- Create: `src/cli/commands/quick.ts`
- Modify: `src/cli/index.ts`
- Modify: `src/shared/types.ts`
- Test: `tests/cli/quick.test.ts`

**Step 1: Write the failing tests**

- Quick 命令可创建最小任务流。
- Quick 场景不要求完整 8-stage 流程。
- Quick 完成后仍可进入 verify 或 wrap-up。

**Step 2: Run test to verify it fails**

Run: `pnpm test -- quick`

Expected: FAIL

**Step 3: Write minimal implementation**

- 定义 `quick` 为受控短路径，不绕过 gate，只缩短前置产物要求。
- 支持 bugfix/config/docs 小改动。
- 输出明确提示：`quick mode is optimized path, not full feature flow`。

**Step 4: Run test to verify it passes**

Run: `pnpm test -- quick`

Expected: PASS

**Step 5: Commit**

```bash
git add src/cli/commands/quick.ts src/cli/index.ts src/shared/types.ts tests/cli/quick.test.ts
git commit -m "feat: add quick execution path"
```

### Task 5: 强制 TDD 最小门禁

**Files:**
- Modify: `src/core/gate-engine/condition-registry.ts`
- Modify: `src/cli/commands/gate.ts`
- Modify: `skills/spec-first/04-code/SKILL.md`
- Modify: `skills/spec-first/12-verify/SKILL.md`
- Test: `tests/core/gate-engine/tdd-gate.test.ts`

**Step 1: Write the failing tests**

- 在实现阶段无失败测试证据时 gate 不通过。
- 在 verify 阶段缺少测试执行证据时 gate 不通过。

**Step 2: Run test to verify it fails**

Run: `pnpm test -- tdd-gate`

Expected: FAIL

**Step 3: Write minimal implementation**

- 新增一个轻量 TDD 证据条件，不追求完美静态分析。
- 先基于阶段产物里的测试记录、命令记录、验收记录做硬门禁。
- skill 文案同步成 `先 RED，再实现，再 GREEN`。

**Step 4: Run test to verify it passes**

Run: `pnpm test -- tdd-gate`

Expected: PASS

**Step 5: Commit**

```bash
git add src/core/gate-engine/condition-registry.ts src/cli/commands/gate.ts skills/spec-first/04-code/SKILL.md skills/spec-first/12-verify/SKILL.md tests/core/gate-engine/tdd-gate.test.ts
git commit -m "feat: enforce minimal tdd gate"
```

---

## P1

### Task 6: 增加跨会话记忆接口

**Files:**
- Create: `src/core/memory/engram-client.ts`
- Create: `src/core/memory/memory.types.ts`
- Modify: `src/cli/commands/orchestrate.ts`
- Modify: `src/cli/commands/status.ts`
- Test: `tests/core/memory/engram-client.test.ts`

**Step 1: Write the failing tests**

- 记忆保存接口返回稳定结构。
- 记忆查询可按项目范围过滤。
- orchestrate 可读取最近记忆摘要。

**Step 2: Run test to verify it fails**

Run: `pnpm test -- engram memory`

Expected: FAIL

**Step 3: Write minimal implementation**

- 先做 provider interface，不强绑具体 MCP 服务。
- 支持 `save/search/listRecent`。
- status/orchestrate 只消费摘要，不把外部记忆耦进核心状态机。

**Step 4: Run test to verify it passes**

Run: `pnpm test -- engram memory`

Expected: PASS

**Step 5: Commit**

```bash
git add src/core/memory src/cli/commands/orchestrate.ts src/cli/commands/status.ts tests/core/memory/engram-client.test.ts
git commit -m "feat: add persistent memory interface"
```

### Task 7: 增加 Batch Discuss 交互

**Files:**
- Modify: `src/cli/commands/init.ts`
- Modify: `src/cli/commands/spec.ts`
- Create: `src/core/discovery/batch-prompts.ts`
- Test: `tests/cli/spec-batch.test.ts`

**Step 1: Write the failing tests**

- `--batch` 一次输出一组问题。
- 默认交互仍逐题执行。
- batch 模式产物格式不变。

**Step 2: Run test to verify it fails**

Run: `pnpm test -- spec-batch`

Expected: FAIL

**Step 3: Write minimal implementation**

- 把澄清问题按主题分组。
- `batch` 只改变提问方式，不改变 spec 结构。

**Step 4: Run test to verify it passes**

Run: `pnpm test -- spec-batch`

Expected: PASS

**Step 5: Commit**

```bash
git add src/cli/commands/init.ts src/cli/commands/spec.ts src/core/discovery/batch-prompts.ts tests/cli/spec-batch.test.ts
git commit -m "feat: add batch discussion mode"
```

### Task 8: 引入 Wave 并行调度

**Files:**
- Create: `src/core/batch-executor/wave-scheduler.ts`
- Modify: `src/cli/commands/orchestrate.ts`
- Test: `tests/core/batch-executor/wave-scheduler.test.ts`

**Step 1: Write the failing tests**

- 独立任务被分到同一 wave。
- 有依赖的任务被推迟到后续 wave。
- 执行失败时只阻塞当前 wave 后续推进。

**Step 2: Run test to verify it fails**

Run: `pnpm test -- wave-scheduler`

Expected: FAIL

**Step 3: Write minimal implementation**

- 基于 task dependency 拆 wave。
- 先支持 plan/task 层并行，不直接并行修改同一文件。

**Step 4: Run test to verify it passes**

Run: `pnpm test -- wave-scheduler`

Expected: PASS

**Step 5: Commit**

```bash
git add src/core/batch-executor/wave-scheduler.ts src/cli/commands/orchestrate.ts tests/core/batch-executor/wave-scheduler.test.ts
git commit -m "feat: add wave-based parallel scheduling"
```

### Task 9: 增强 Knowledge Capture

**Files:**
- Modify: `skills/spec-first/08-review/SKILL.md`
- Modify: `skills/spec-first/13-archive/SKILL.md`
- Create: `src/core/session/session-record.ts`
- Test: `tests/core/session/session-record.test.ts`

**Step 1: Write the failing tests**

- wrap-up/archive 可记录本次关键决策与失败模式。
- review 阶段可读最近一次相关复盘摘要。

**Step 2: Run test to verify it fails**

Run: `pnpm test -- session-record`

Expected: FAIL

**Step 3: Write minimal implementation**

- 增加 `record-session` 风格的轻量产物。
- 捕获 `decision / failure / follow-up / open-question` 四类信息。

**Step 4: Run test to verify it passes**

Run: `pnpm test -- session-record`

Expected: PASS

**Step 5: Commit**

```bash
git add skills/spec-first/08-review/SKILL.md skills/spec-first/13-archive/SKILL.md src/core/session/session-record.ts tests/core/session/session-record.test.ts
git commit -m "feat: capture session knowledge during review and archive"
```

---

## P2

### Task 10: 扩展多运行时适配层

**Files:**
- Create: `src/core/agents/adapter.ts`
- Create: `src/core/agents/opencode-adapter.ts`
- Create: `src/core/agents/gemini-adapter.ts`
- Create: `src/core/agents/cursor-adapter.ts`
- Modify: `src/cli/commands/setup.ts`
- Test: `tests/core/agents/adapter.test.ts`

**Step 1: Write the failing tests**

- 检测不同 agent 是否已安装。
- 检测 agent 是否支持 skills/MCP。
- setup 可按 agent 生成对应配置。

**Step 2: Run test to verify it fails**

Run: `pnpm test -- agents adapter`

Expected: FAIL

**Step 3: Write minimal implementation**

- 抽象公共 capability。
- 每个 adapter 只做检测和配置模板，不把执行层耦合进去。

**Step 4: Run test to verify it passes**

Run: `pnpm test -- agents adapter`

Expected: PASS

**Step 5: Commit**

```bash
git add src/core/agents src/cli/commands/setup.ts tests/core/agents/adapter.test.ts
git commit -m "feat: add multi-runtime agent adapters"
```

### Task 11: 浏览器工具集成

**Files:**
- Create: `src/core/tools/browser-tool.ts`
- Modify: `src/cli/commands/setup.ts`
- Modify: `skills/spec-first/04-code/SKILL.md`
- Test: `tests/core/tools/browser-tool.test.ts`

**Step 1: Write the failing tests**

- browser tool 可声明能力与依赖。
- setup 可为支持的 agent 注入浏览器工具配置。

**Step 2: Run test to verify it fails**

Run: `pnpm test -- browser-tool`

Expected: FAIL

**Step 3: Write minimal implementation**

- 先支持 Playwright/MCP 能力声明和配置注入。
- 暂不把浏览器逻辑写进核心 gate。

**Step 4: Run test to verify it passes**

Run: `pnpm test -- browser-tool`

Expected: PASS

**Step 5: Commit**

```bash
git add src/core/tools/browser-tool.ts src/cli/commands/setup.ts skills/spec-first/04-code/SKILL.md tests/core/tools/browser-tool.test.ts
git commit -m "feat: add browser tool integration"
```

### Task 12: 引入 Constitution 与 Delta Spec 能力

**Files:**
- Create: `docs/constitution.md`
- Modify: `src/core/gate-engine/condition-registry.ts`
- Modify: `src/cli/commands/spec.ts`
- Modify: `src/cli/commands/design.ts`
- Test: `tests/core/gate-engine/constitution-order.test.ts`

**Step 1: Write the failing tests**

- spec/design 与 constitution 冲突时 gate 阻断。
- spec 支持 `ADDED / MODIFIED / REMOVED` 变更语义。

**Step 2: Run test to verify it fails**

Run: `pnpm test -- constitution-order delta-spec`

Expected: FAIL

**Step 3: Write minimal implementation**

- 增加轻量权威层级，不做复杂策略引擎。
- 先把 delta operation 引入 spec 文档模板和校验规则。

**Step 4: Run test to verify it passes**

Run: `pnpm test -- constitution-order delta-spec`

Expected: PASS

**Step 5: Commit**

```bash
git add docs/constitution.md src/core/gate-engine/condition-registry.ts src/cli/commands/spec.ts src/cli/commands/design.ts tests/core/gate-engine/constitution-order.test.ts
git commit -m "feat: add constitution hierarchy and delta spec support"
```

---

## Suggested Sequence

1. 先做 `Task 1-5`
2. 再做 `Task 6-9`
3. 最后做 `Task 10-12`

原因：

- `Auto Loop + Quick + TDD Gate` 会最快改善实际体验
- `Steering + Memory` 会减少重复工作
- `Multi-runtime + Browser Tool` 更像平台化扩展，应该晚于核心闭环

## Verification

每个任务完成后至少执行：

```bash
pnpm test
pnpm lint
pnpm typecheck
```

如果仓库没有对应脚本，则退化为执行该任务对应的最小测试集合。

## Done Criteria

- Spec-First 可在无人连续确认的前提下完成更长的自动推进链路
- 小任务可通过 `quick` 短路径完成
- 项目级记忆与跨会话记忆可被稳定读取
- TDD 证据成为实现/验证阶段的硬门禁之一
- 适配层可清晰支持至少 `Claude Code + Codex + OpenCode + Gemini`
- 浏览器工具可通过配置注入而非手工散落接入

