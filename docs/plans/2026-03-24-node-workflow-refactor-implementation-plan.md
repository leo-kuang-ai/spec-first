# Spec-First Node Workflow Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将当前 `spec-first` 从 `gate / trace / matrix / ID` 驱动的流程运行时，重构为以 `FeatureState + transition + skill checklist + readiness-check + safety-guard` 为核心的节点化工作流。

**Architecture:** 先替换共享状态契约与流转核心，再分离 `skill checklist / readiness-check / safety-guard` 三层职责，随后重写 `task_plan` 解析与 `status / orchestrate / stage` CLI，最后删除旧 gate/id/links 能力并补齐节点化 E2E 测试。实现过程中不做向下兼容，不保留旧 `StageState`、`gate-history`、`document-links.yaml` 的运行时语义。

**Tech Stack:** TypeScript, Node.js, Vitest, Markdown docs, Spec-First CLI runtime

---

### Task 1: 重定义共享状态类型为 `FeatureState / NodeState`

**Files:**
- Modify: `src/shared/types.ts`
- Modify: `src/core/process-engine/feature.ts`
- Modify: `src/core/skill-runtime/dispatcher.ts`
- Modify: `src/cli/commands/status.ts`
- Modify: `src/core/skill-runtime/prompt-assembler.ts`
- Modify: `src/core/ai-orchestrator/catchup.ts`
- Test: `tests/unit/stage-machine.test.ts`
- Create: `tests/unit/feature-state.test.ts`

**Step 1: 写失败测试，锁定新的状态结构**

新增 `tests/unit/feature-state.test.ts`，锁定以下事实：

```ts
import { describe, expect, it } from 'vitest';
import { Stage } from '../../src/shared/types.js';
import type { FeatureState } from '../../src/shared/types.js';

describe('FeatureState', () => {
  it('stores node-based runtime truth', () => {
    const state: FeatureState = {
      featureId: 'FSREQ-20260324-NODE-001',
      currentStage: Stage.PLAN,
      terminal: false,
      nodes: {
        [Stage.PLAN]: {
          status: 'in_progress',
          checklistStatus: 'partial',
          canMarkDone: false,
          summary: 'task table drafted',
        },
      },
      createdAt: '2026-03-24T00:00:00.000Z',
      updatedAt: '2026-03-24T00:00:00.000Z',
    };

    expect(state.nodes[Stage.PLAN]?.status).toBe('in_progress');
  });
});
```

**Step 2: 运行测试确认当前类型不满足**

Run:
```bash
pnpm -s vitest run tests/unit/feature-state.test.ts tests/unit/stage-machine.test.ts
```

Expected:
- `FeatureState` 或 `NodeState` 类型缺失
- 现有 `StageState` 相关断言与新模型不兼容

**Step 3: 在 `src/shared/types.ts` 引入新状态契约**

加入最小实现：

```ts
export type NodeStatus = 'todo' | 'in_progress' | 'done' | 'blocked' | 'skipped';
export type ChecklistStatus = 'complete' | 'partial' | 'empty';

export interface NodeState {
  status: NodeStatus;
  startedAt?: string;
  completedAt?: string;
  summary?: string;
  checklistStatus?: ChecklistStatus;
  canMarkDone?: boolean;
}

export interface FeatureState {
  featureId: string;
  currentStage: Stage;
  terminal: boolean;
  nodes: Partial<Record<Stage, NodeState>>;
  createdAt: string;
  updatedAt: string;
}
```

直接切换到新运行态契约，不再为旧 `StageState / StageStatus / StageHistoryEntry` 保留兼容导出。

**Step 4: 更新新旧消费方到 `FeatureState` 读取**

这一任务除了 `feature.ts` 之外，还要同步修补当前直接依赖 `StageState` 的主路径消费者，避免在 Task 1 结束后留下大面积编译断裂。

最小改动先把：

- `getFeatureState`
- `listFeatures`
- `readValidatedFeatureState`
- `dispatcher.ts` 中的运行态读取
- `status.ts` 中的运行态状态读取（仅切换数据源，不在本任务完成最终节点化展示）
- `prompt-assembler.ts` 中的运行态上下文组装
- `catchup.ts` 中的特性恢复状态读取

改为优先读 `FeatureState`。

**Step 5: 再跑测试确认通过**

Run:
```bash
pnpm -s vitest run tests/unit/feature-state.test.ts tests/unit/stage-machine.test.ts
```

Expected:
- 新状态结构测试通过
- `stage-machine` 现有顺序测试仍通过

**Step 6: Commit**

```bash
git add src/shared/types.ts src/core/process-engine/feature.ts src/core/skill-runtime/dispatcher.ts src/cli/commands/status.ts src/core/skill-runtime/prompt-assembler.ts src/core/ai-orchestrator/catchup.ts tests/unit/feature-state.test.ts tests/unit/stage-machine.test.ts
git commit -m "refactor: introduce node-based feature state"
```

---

### Task 2: 用 `transition` 替代 `advance` 的 gate 推进链

**Files:**
- Create: `src/core/process-engine/transition.ts`
- Modify: `src/core/process-engine/stage-machine.ts`
- Modify: `src/core/process-engine/advance.ts`
- Modify: `src/cli/commands/stage.ts`
- Test: `tests/unit/stage-machine.test.ts`
- Create: `tests/unit/transition.test.ts`

**Step 1: 为 `transition` 写失败测试**

新增 `tests/unit/transition.test.ts`：

```ts
import { describe, expect, it } from 'vitest';
import { Stage } from '../../src/shared/types.js';
import { applyTransition } from '../../src/core/process-engine/transition.js';

describe('applyTransition', () => {
  it('moves currentStage when readiness is satisfied', () => {
    const result = applyTransition(
      {
        featureId: 'FSREQ-20260324-NODE-001',
        currentStage: Stage.SPECIFY,
        terminal: false,
        nodes: {
          [Stage.SPECIFY]: { status: 'done', checklistStatus: 'complete', canMarkDone: true },
        },
        createdAt: '2026-03-24T00:00:00.000Z',
        updatedAt: '2026-03-24T00:00:00.000Z',
      },
      Stage.DESIGN
    );

    expect(result.currentStage).toBe(Stage.DESIGN);
  });
});
```

**Step 2: 运行测试确认失败**

Run:
```bash
pnpm -s vitest run tests/unit/transition.test.ts tests/unit/stage-machine.test.ts
```

Expected:
- `transition.ts` 不存在
- 旧 `advance.ts` 仍绑定 gate/dependency 语义

**Step 3: 创建 `transition.ts` 最小实现**

```ts
import { Stage, type FeatureState } from '../../shared/types.js';
import { assertTransitionAllowed, isTerminal } from './stage-machine.js';

export function applyTransition(
  state: FeatureState,
  targetStage: Stage
): FeatureState {
  assertTransitionAllowed(state.currentStage, targetStage);
  return {
    ...state,
    currentStage: targetStage,
    terminal: isTerminal(targetStage),
    updatedAt: new Date().toISOString(),
  };
}
```

**Step 4: 把 `stage advance` 改成委托 `transition`**

- `src/cli/commands/stage.ts` 保留入口，内部先切到 `transition`
- `src/core/process-engine/advance.ts` 改成内部薄包装或 `@deprecated` shim，仅用于代码组织过渡，不保留任何对外兼容语义
- 删除里面的 `evaluateGate`、`checkDependencies`、`gate-history.jsonl` 主路径依赖

**Step 5: 再跑测试**

Run:
```bash
pnpm -s vitest run tests/unit/transition.test.ts tests/unit/stage-machine.test.ts
```

Expected:
- `transition` 通过
- 旧 gate 语义不再是推进前置

**Step 6: Commit**

```bash
git add src/core/process-engine/transition.ts src/core/process-engine/stage-machine.ts src/core/process-engine/advance.ts src/cli/commands/stage.ts tests/unit/transition.test.ts tests/unit/stage-machine.test.ts
git commit -m "refactor: replace gate advance with transition"
```

---

### Task 3: 实现 `readiness-check`，替代 gate + dependency 合成

**Files:**
- Create: `src/core/process-engine/readiness-check.ts`
- Modify: `src/cli/commands/orchestrate.ts`
- Modify: `src/core/process-engine/next-step-decider.ts`
- Create: `tests/unit/readiness-check.test.ts`
- Modify: `tests/unit/orchestrate-stage-integration.test.ts`

**Step 1: 为 `readiness-check` 写失败测试**

新增 `tests/unit/readiness-check.test.ts`：

```ts
import { describe, expect, it } from 'vitest';
import { Stage } from '../../src/shared/types.js';
import { checkReadiness } from '../../src/core/process-engine/readiness-check.js';

describe('checkReadiness', () => {
  it('returns READY_TO_ADVANCE when previous node is done and artifacts exist', () => {
    const result = checkReadiness({
      currentStage: Stage.SPECIFY,
      targetStage: Stage.DESIGN,
      nodes: { [Stage.SPECIFY]: { status: 'done' } },
      artifacts: ['spec.md'],
      terminal: false,
    });

    expect(result.decision).toBe('READY_TO_ADVANCE');
    expect(result.targetStage).toBe(Stage.DESIGN);
  });
});
```

**Step 2: 运行测试确认失败**

Run:
```bash
pnpm -s vitest run tests/unit/readiness-check.test.ts tests/unit/orchestrate-stage-integration.test.ts
```

Expected:
- `readiness-check.ts` 缺失
- `orchestrate` 仍依赖 `evaluateGate` / `checkDependencies`

**Step 3: 创建 `readiness-check.ts`**

最小实现包含：

```ts
export interface ReadinessCheckInput {
  currentStage: Stage;
  targetStage: Stage;
  nodes: Partial<Record<Stage, NodeState>>;
  artifacts: string[];
  terminal: boolean;
}

export interface ReadinessCheckResult {
  decision: 'READY_TO_WORK' | 'READY_TO_ADVANCE' | 'BLOCKED';
  currentStage: Stage;
  targetStage: Stage;
  checks: {
    previousNodeComplete: boolean;
    requiredArtifactsExist: boolean;
    noActiveWork: boolean;
    notTerminal: boolean;
    warnings: string[];
  };
}

export function checkReadiness(input: ReadinessCheckInput): ReadinessCheckResult;
```

并内置 `STAGE_ARTIFACT_REQUIREMENTS`。

**Step 4: 改 `orchestrate.ts` 与 `next-step-decider.ts`**

- `orchestrate` 改成调用 `checkReadiness`
- 删除 `evaluateGate` 参与决策的主路径
- 决策输出只保留 `READY_TO_WORK / READY_TO_ADVANCE / BLOCKED`

**Step 5: 再跑测试**

Run:
```bash
pnpm -s vitest run tests/unit/readiness-check.test.ts tests/unit/orchestrate-stage-integration.test.ts
```

Expected:
- `orchestrate` 输出 readiness 决策
- 不再打印 gate 阻断语义

**Step 6: Commit**

```bash
git add src/core/process-engine/readiness-check.ts src/core/process-engine/next-step-decider.ts src/cli/commands/orchestrate.ts tests/unit/readiness-check.test.ts tests/unit/orchestrate-stage-integration.test.ts
git commit -m "refactor: add readiness-check orchestration flow"
```

---

### Task 4: 拆分 `hard-gate` 为 `skill-checklist` 与 `safety-guard`

**Files:**
- Create: `src/core/skill-runtime/skill-checklist.ts`
- Create: `src/core/skill-runtime/safety-guard.ts`
- Modify: `src/core/skill-runtime/dispatcher.ts`
- Modify: `src/core/skill-runtime/hard-gate.ts`
- Create: `tests/unit/skill-checklist.test.ts`
- Create: `tests/unit/safety-guard.test.ts`
- Modify: `tests/unit/hard-gate.test.ts`

**Step 1: 写失败测试，锁定三层分离**

新增断言：

- skill 可以在非当前阶段独立运行，但会收到 checklist context
- safety 只输出 notice，不抛流程阻断异常
- `orchestrate` 才能收到 readiness notice

**Step 2: 运行测试确认失败**

Run:
```bash
pnpm -s vitest run tests/unit/hard-gate.test.ts tests/unit/dispatcher-first-runtime.test.ts
```

Expected:
- 当前 `evaluateSkillHardGate` 仍直接 `BLOCKED`
- dispatcher 仍注入 hard-gate 阻断语义

**Step 3: 创建新模块**

`src/core/skill-runtime/skill-checklist.ts`

```ts
export interface ChecklistItem {
  id: string;
  description: string;
  status: 'pass' | 'fail' | 'skip';
  detail?: string;
}

export interface SkillChecklistResult {
  skillName: string;
  stage: Stage;
  checks: ChecklistItem[];
  overallStatus: 'complete' | 'partial' | 'empty';
  canMarkDone: boolean;
}
```

`src/core/skill-runtime/safety-guard.ts`

```ts
export interface SafetyAssessment {
  level: 'safe' | 'warning' | 'dangerous';
  signals: string[];
  recommendedActions?: string[];
}
```

**Step 4: 改 dispatcher**

- 删除 `HardGateBlockedError` 主路径使用
- 注入顺序固定为：
  1. `safety-guard`
  2. `skill-checklist`
  3. `readiness-check`（仅 orchestrate + flow）

**Step 5: 把 `hard-gate.ts` 改成兼容 shim**

- 保留文件，导出 `@deprecated` 的内部 shim
- 移除阶段匹配强阻断逻辑
- 仅保留到 `safety-guard` 的最小内部适配，便于渐进删除；不重新暴露旧 gate 阻断接口或用户可见入口

**Step 6: 再跑测试**

Run:
```bash
pnpm -s vitest run tests/unit/skill-checklist.test.ts tests/unit/safety-guard.test.ts tests/unit/hard-gate.test.ts tests/unit/dispatcher-first-runtime.test.ts
```

Expected:
- skill 不再因阶段不匹配被 hard block
- safety 只给 warning/notice

**Step 7: Commit**

```bash
git add src/core/skill-runtime/skill-checklist.ts src/core/skill-runtime/safety-guard.ts src/core/skill-runtime/dispatcher.ts src/core/skill-runtime/hard-gate.ts tests/unit/skill-checklist.test.ts tests/unit/safety-guard.test.ts tests/unit/hard-gate.test.ts
git commit -m "refactor: split hard gate into checklist and safety guard"
```

---

### Task 5: 重写 `task_plan` 解析器，支持新表格 Schema

**Files:**
- Modify: `src/core/task-plan/parser.ts`
- Modify: `tests/unit/task-plan-parser.test.ts`
- Modify: `src/cli/commands/status.ts`
- Modify: `src/cli/commands/commit.ts`
- Modify: `src/core/skill-runtime/prompt-assembler.ts`
- Modify: `src/core/ai-orchestrator/catchup.ts`

**Step 1: 先写失败测试，锁定新表格**

把测试改成新格式：

```ts
const plan = parseTaskPlanContent([
  '| title | status | summary | next_step |',
  '|---|---|---|---|',
  '| 初始化工程与上下文 | done | 已完成基础目录与依赖准备 | - |',
  '| 重构 API 接口 | in_progress | 正在收口响应结构 | 完成响应模型与调用方适配 |',
  '| 冒烟验证 | blocked | 等待接口结构稳定 | 完成 API 改造后恢复 |',
].join('\n'));

expect(plan.currentTaskTitle).toBe('重构 API 接口');
expect(plan.stats.blocked).toBe(1);
```

**Step 2: 运行测试确认当前解析器失败**

Run:
```bash
pnpm -s vitest run tests/unit/task-plan-parser.test.ts tests/unit/stage-viewer.test.ts
```

Expected:
- 当前解析器仍要求 `Task ID`
- 仍解析 `depends_on` / `traces`

**Step 3: 改 `parser.ts`**

最小改造：

- 删除 `ParsedTaskPlanTask.id`
- 改成 `title + status + summary + next_step`
- `ParsedTaskStatus` 改为 `'todo' | 'in_progress' | 'done' | 'blocked'`
- 去掉 `dependsOn / traces`
- 删除 `getCurrentTaskId`，改为 `getCurrentTaskTitle`

目标结构：

```ts
export interface ParsedTaskPlan {
  tasks: ParsedTaskPlanTask[];
  currentTaskTitle?: string;
  stats: {
    total: number;
    todo: number;
    inProgress: number;
    done: number;
    blocked: number;
  };
}

export interface ParsedTaskPlanTask {
  title: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  summary?: string;
  next_step?: string;
  owner?: string;
  notes?: string;
}
```

**Step 4: 同步修复现有消费方**

- `status.ts`：删除 `complete/pending` 旧映射，直接统计 `todo / in_progress / done / blocked`
- `commit.ts`：移除 `TASK ID` 推断与校验，不再生成 `[TASK-...]` commit 前缀
- `prompt-assembler.ts`：将 `currentTask` 从 `TASK ID` 改为当前任务标题或 `N/A`
- `catchup.ts`：继续读取统计信息，但不再依赖任务 ID 语义
- parser 输出正式暴露 `currentTaskTitle + stats`，避免由调用方各自推断

**Step 5: 再跑测试**

Run:
```bash
pnpm -s vitest run tests/unit/task-plan-parser.test.ts tests/unit/stage-viewer.test.ts tests/unit/orchestrate-stage-integration.test.ts
```

Expected:
- `task_plan.md` 新表格格式可解析
- 最多一个 `in_progress` 的约束可被测试锁住

**Step 6: Commit**

```bash
git add src/core/task-plan/parser.ts src/cli/commands/status.ts src/cli/commands/commit.ts src/core/skill-runtime/prompt-assembler.ts src/core/ai-orchestrator/catchup.ts tests/unit/task-plan-parser.test.ts
git commit -m "refactor: parse task plan table without task ids"
```

---

### Task 6: 重写 `status / orchestrate / stage` CLI 为节点化输出

**Files:**
- Modify: `src/cli/commands/status.ts`
- Modify: `src/cli/commands/orchestrate.ts`
- Create: `src/cli/commands/transition.ts`
- Modify: `src/cli/commands/stage.ts`
- Modify: `src/cli/index.ts`
- Modify: `src/cli/router.ts`
- Test: `tests/unit/orchestrate-stage-integration.test.ts`
- Create: `tests/unit/status-node-runtime.test.ts`
- Modify: `tests/e2e/core-flow.test.ts`

**Step 1: 先写失败测试**

覆盖以下行为：

- `status` 读取 `FeatureState.nodes[currentStage]`
- `orchestrate` 遇到 `BLOCKED` 时打印恢复执行建议
- `stage` 帮助和输出改用 `transition` 术语

**Step 2: 运行测试确认失败**

Run:
```bash
pnpm -s vitest run tests/unit/orchestrate-stage-integration.test.ts tests/e2e/core-flow.test.ts
```

Expected:
- 仍输出旧 `stageStatus` / `Gate` / `stage advance`

**Step 3: 改 CLI 输出**

- `status.ts`：展示 `currentStage`、当前节点 `summary`、节点级/任务级 blocked
- `orchestrate.ts`：输出 `READY_TO_WORK / READY_TO_ADVANCE / BLOCKED` 和 next actions
- `transition.ts`：作为唯一节点推进命令入口
- `stage.ts`：移除 `advance` 主路径语义，不再承担正式推进入口
- `router.ts`：删除 `confirm-policy` 对 gate 的显式绑定说明

这里要和 Task 1 保持边界一致：

- Task 1 只完成 `status.ts` 的运行态读取切换
- Task 6 才完成 `status.ts` 的节点化展示、blocked 引导与术语收口

**Step 4: 再跑测试**

Run:
```bash
pnpm -s vitest run tests/unit/orchestrate-stage-integration.test.ts tests/unit/status-node-runtime.test.ts tests/e2e/core-flow.test.ts
```

Expected:
- CLI 输出不再依赖 gate/id/matrix 术语
- blocked 场景会给出恢复步骤

**Step 5: Commit**

```bash
git add src/cli/commands/status.ts src/cli/commands/orchestrate.ts src/cli/commands/transition.ts src/cli/commands/stage.ts src/cli/index.ts src/cli/router.ts tests/unit/orchestrate-stage-integration.test.ts tests/unit/status-node-runtime.test.ts tests/e2e/core-flow.test.ts
git commit -m "refactor: align cli with node workflow runtime"
```

---

### Task 7: 删除旧 gate / id / links CLI 与对应测试

**Files:**
- Modify: `src/cli/index.ts`
- Modify: `src/shared/skill-commands.ts`
- Delete: `src/cli/commands/gate.ts`
- Delete: `src/cli/commands/id.ts`
- Delete: `src/cli/commands/trace.ts`
- Delete: `src/cli/commands/docs-links.ts`
- Delete: `tests/e2e/gate-cli.test.ts`
- Delete: `tests/unit/gate-evaluator.test.ts`
- Delete: `tests/unit/id-validator.test.ts`
- Delete: `tests/unit/trace-context.test.ts`

**Step 1: 先更新命令注册与帮助文本**

- 从 `src/cli/index.ts` 和 `src/shared/skill-commands.ts` 中移除 gate/id/trace/links 主入口
- 保留 `metrics` 仅当它已并入 `status` 的最小统计输出，否则一并移出主流程

**Step 2: 运行测试确认失败**

Run:
```bash
pnpm -s vitest run tests/e2e/core-flow.test.ts tests/unit/skill-commands.test.ts tests/unit/cli-metrics-doctor.test.ts
```

Expected:
- 旧命令入口仍在注册或帮助文本中暴露

**Step 3: 删除旧命令与删除类测试**

- 删除 `gate.ts / id.ts / trace.ts / docs-links.ts`
- 删除围绕 gate evaluator、id validator、trace context、gate CLI 的删除类测试
- 保留 `metrics.ts` 仅当它已收敛为 `status` 的内部依赖，否则同步退场

**Step 4: 再跑定向测试**

Run:
```bash
pnpm -s vitest run tests/e2e/core-flow.test.ts tests/unit/skill-commands.test.ts tests/unit/cli-metrics-doctor.test.ts
```

Expected:
- 帮助文本与命令注册中不再出现 gate/id/trace/links 主路径入口

**Step 5: Commit**

```bash
git add -A src/cli/index.ts src/shared/skill-commands.ts src/cli/commands/gate.ts src/cli/commands/id.ts src/cli/commands/trace.ts src/cli/commands/docs-links.ts src/cli/commands/metrics.ts tests/e2e/gate-cli.test.ts tests/unit/gate-evaluator.test.ts tests/unit/id-validator.test.ts tests/unit/trace-context.test.ts
git commit -m "refactor: remove legacy gate and trace entrypoints"
```

---

### Task 8: 建立节点化主流程 E2E 与最终回归

**Files:**
- Create: `tests/e2e/node-workflow.test.ts`
- Modify: `tests/e2e/core-flow.test.ts`
- Modify: `tests/integration/first-cli-real-flow.test.ts`
- Read: `docs/01-需求文档/逐个skill优化/链路优化/2026-03-24-spec-first-节点化重构PRD.md`

**Step 1: 写新的 E2E 流程测试**

覆盖六类主线：

1. happy path：`00_init -> 08_done`
2. blocked / resume：节点 blocked 后恢复为 `in_progress`
3. standalone：可以修订文档但不推进 `currentStage`
4. readiness 决策：单独覆盖 `READY_TO_WORK / READY_TO_ADVANCE / BLOCKED`
5. skipped：`skipped` 节点在记录 skip reason 后可继续推进
6. cancelled：任意非终态节点可进入 `09_cancelled`

E2E 测试骨架：

```ts
it('advances by checklist and readiness instead of gate', async () => {
  // 初始化 FeatureState
  // 写 spec.md / design.md / task_plan.md
  // 调 orchestrate -> READY_TO_ADVANCE
  // 调 transition -> 下一节点
  // 断言无 gate-history/document-links 依赖
});
```

**Step 2: 运行定向 E2E，确认失败**

Run:
```bash
pnpm -s vitest run tests/e2e/node-workflow.test.ts tests/e2e/core-flow.test.ts tests/integration/first-cli-real-flow.test.ts
```

Expected:
- 旧 gate flow 假设失效
- 新节点化主流程还未完全打通

**Step 3: 修补剩余遗漏**

只补让 E2E 通过所必需的最小代码：

- 缺失的状态写回
- CLI 提示不一致
- task parser 边界
- orchestrate blocked 恢复文案
- `READY_TO_WORK` 的决策提示与断言

**Step 4: 运行最终回归**

Run:
```bash
pnpm -s vitest run tests/unit/feature-state.test.ts tests/unit/transition.test.ts tests/unit/readiness-check.test.ts tests/unit/skill-checklist.test.ts tests/unit/safety-guard.test.ts tests/unit/task-plan-parser.test.ts tests/unit/orchestrate-stage-integration.test.ts tests/e2e/node-workflow.test.ts tests/e2e/core-flow.test.ts tests/integration/first-cli-real-flow.test.ts
```

Expected:
- 节点化核心测试全部通过

**Step 5: 全量类型检查与测试**

Run:
```bash
pnpm typecheck
pnpm test
```

Expected:
- typecheck 通过
- 全量测试通过或仅剩已知、已记录的待删旧测试

**Step 6: Commit**

```bash
git add tests/e2e/node-workflow.test.ts tests/e2e/core-flow.test.ts tests/integration/first-cli-real-flow.test.ts
git commit -m "test: cover node workflow end to end"
```

---

### Task 9: 同步文档与模板，完成交付收口

**Files:**
- Modify: `docs/01-需求文档/逐个skill优化/链路优化/2026-03-24-spec-first-节点化重构PRD.md`
- Modify: `README.md`
- Modify: `README-CN.md`
- Modify: `skills/spec-first/03-spec/SKILL.md`
- Modify: `skills/spec-first/04-design/SKILL.md`
- Modify: `skills/spec-first/06-task/SKILL.md`
- Modify: `skills/spec-first/07-code/SKILL.md`
- Modify: `skills/spec-first/10-archive/SKILL.md`
- Modify: `skills/spec-first/12-verify/SKILL.md`
- Modify: `skills/spec-first/13-orchestrate/SKILL.md`
- Modify: `skills/spec-first/14-status/SKILL.md`
- Modify: `skills/spec-first/README.md`
- Modify: `templates/init/stage-state.json.hbs`
- Delete: `templates/docs/document-links.yaml.hbs`
- Read: `src/cli/commands/status.ts`
- Read: `src/cli/commands/orchestrate.ts`
- Read: `src/core/task-plan/parser.ts`

**Step 1: 对照代码更新文档事实**

把以下事实与实现对齐：

- `transition` 命令名
- `FeatureState / NodeState`
- `task_plan.md` 表格 Schema
- `blocked` 的任务级/节点级边界
- `status / orchestrate` 的输出职责
- skill 文档中的节点化术语
- `stage-state.json` 模板与 `document-links` 模板退场

**Step 2: 运行最小文档校验**

Run:
```bash
pnpm -s vitest run tests/unit/first-skill-docs.test.ts tests/unit/spec-skill-docs.test.ts tests/unit/design-skill-docs.test.ts tests/unit/task-skill-docs.test.ts tests/unit/verify-skill-docs.test.ts tests/unit/archive-skill-docs.test.ts tests/unit/orchestrate-skill-docs.test.ts tests/unit/status-skill-docs.test.ts
```

Expected:
- 文档和运行时术语一致

**Step 3: Commit**

```bash
git add -A docs/01-需求文档/逐个skill优化/链路优化/2026-03-24-spec-first-节点化重构PRD.md README.md README-CN.md skills/spec-first/03-spec/SKILL.md skills/spec-first/04-design/SKILL.md skills/spec-first/06-task/SKILL.md skills/spec-first/07-code/SKILL.md skills/spec-first/10-archive/SKILL.md skills/spec-first/12-verify/SKILL.md skills/spec-first/13-orchestrate/SKILL.md skills/spec-first/14-status/SKILL.md skills/spec-first/README.md templates/init/stage-state.json.hbs templates/docs/document-links.yaml.hbs
git commit -m "docs: align docs with node workflow runtime"
```
