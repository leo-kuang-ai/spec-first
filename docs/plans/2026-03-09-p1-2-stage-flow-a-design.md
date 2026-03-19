# P1-2 03_plan→04_implement→05_verify 方案A设计文档

**目标**
- 在不引入新的真实执行链的前提下，打通 `03_plan -> 04_implement -> 05_verify` 的受控半自动流转。
- 保持现有职责分离：`next-step-decider` 负责决策，`orchestrate` 负责协调，`advance()` 负责推进，`auto-loop` 只负责 todo 循环。

**范围**
- 本方案只覆盖阶段判定、协调、阻塞降级、hooks 同步点和测试收口。
- 本方案不引入 `task/code/verify` 的统一真实执行器，不启用 `AUTO_RUN_NEXT_SKILL`，不扩展到 `06_wrap_up` 以后阶段。

**现状基线**
- `orchestrate` CLI 已能在 auto-loop 后调用 `next-step-decider`，并在 `--auto-advance` 下执行 `advance()`，见 `src/cli/commands/orchestrate.ts`。
- `auto-loop` 已明确只返回 todo 执行状态，不负责阶段推进，见 `src/core/ai-orchestrator/auto-loop.ts`。
- `task/code/verify` 已存在 runtime notice 注入，见 `src/core/skill-runtime/dispatcher.ts`。
- `next-step-decider` 已有统一决策入口，但对 `03_plan/04_implement/05_verify` 的规则仍较粗，且保留了 `AUTO_RUN_NEXT_SKILL` 分支。

## 1. 设计原则

1. **状态闭环优先**
   - 先解决“能否安全推进阶段”的问题，再考虑“是否自动执行下一 skill”。
2. **最小增量改动**
   - 基于现有 `orchestrate` / `next-step-decider` / `auto-loop` 演进，不重构为新框架。
3. **统一阻塞口径**
   - `blocked / timeout / retry exhausted / gate failed / dependency failed` 一律降级为 `BLOCKED`。
4. **默认只建议**
   - 未显式启用 `--auto-advance` 时，只输出建议，不执行推进。
5. **hooks 只做同步器**
   - hooks 失败记 warning，不直接成为阶段推进依据。

## 2. 架构分层

### 2.1 决策层：`next-step-decider`
输入：
- `currentStage`
- `stageStatus`
- `autoAdvancePolicy`
- `gateStatus`
- `dependencyCheck`
- `todoState`
- `autoLoopStatus`（新增）

输出：
- `BLOCKED`
- `SUGGEST_NEXT`
- `READY_TO_ADVANCE`
- `AUTO_ADVANCE`

约束：
- 只读，不写状态。
- 不直接调用 hooks、不执行 `advance()`。
- `AUTO_RUN_NEXT_SKILL` 在本方案中不启用。

### 2.2 协调层：`orchestrate`
执行顺序：
1. 解析参数 `--auto / --resume / --auto-advance`
2. 若为 `--auto`，执行 `auto-loop`
3. 记录 `autoLoopStatus`
4. 调用现有同步 hooks（轻量，不阻断）
5. 读取 `stage-state.json` 与 `todo-state.json`
6. 调用 `decideNextStep()`
7. 根据决策打印建议，或在 `--auto-advance` 下执行 `advance()`

### 2.3 执行层
- 保持现状：todo executor / 人工执行 / 既有 skill runtime。
- 本方案不新增 `task/code/verify` 的真实执行桥。

### 2.4 同步层：hooks
- 仅在两个时机接入：
  - `before_decide`
  - `after_advance`
- 只调用现有 `task-context.sh`、`progress-sync.sh`。
- 失败记 warning，不改变决策结果。

## 3. 阶段判定规则

### 3.1 `03_plan -> 04_implement`
- `BLOCKED`
  - `autoLoopStatus` 非 `all_done`
  - todo 存在 `blocked`
  - Gate 不通过
  - dependency check 不通过
- `SUGGEST_NEXT`
  - `stageStatus !== ready_to_advance`
  - 或存在 pending / in_progress todo
- `READY_TO_ADVANCE`
  - `stageStatus === ready_to_advance`
  - Gate 通过
  - dependency check 通过
  - todo 全部完成或该阶段无 todo
- `AUTO_ADVANCE`
  - 满足 `READY_TO_ADVANCE`
  - 且 `autoAdvancePolicy === auto_advance`

### 3.2 `04_implement -> 05_verify`
- `BLOCKED`
  - 任一 TASK 非 `done`
  - 存在 `blocked / timeout / retry exhausted`
  - Gate 不通过
  - dependency check 不通过
- `SUGGEST_NEXT`
  - todo 尚未全部完成
  - 或阶段仍非 `ready_to_advance`
- `READY_TO_ADVANCE`
  - 所有 TASK done
  - 无阻塞
  - Gate 通过
  - dependency check 通过
- `AUTO_ADVANCE`
  - 满足 `READY_TO_ADVANCE`
  - 且 `autoAdvancePolicy === auto_advance`

### 3.3 `05_verify -> ready_to_advance`
- `BLOCKED`
  - 验证任务未完成
  - Gate 不通过
  - 存在阻塞
- `SUGGEST_NEXT`
  - 报告 / 证据 / 验收记录未齐
- `READY_TO_ADVANCE`
  - 验收通过
  - 所有必要证据齐备
- 本轮不自动打通 `06_wrap_up` 以后阶段。

## 4. 接口建议

### 4.1 `next-step-decider` 输入增强
建议新增：

```ts
interface NextStepDecisionInput {
  featureId?: string;
  currentStage: Stage;
  stageStatus?: StageStatus;
  autoAdvancePolicy?: AutoAdvancePolicy;
  gateStatus?: DeciderGateStatus;
  dependencyCheck?: DependencyCheckResult;
  todoState?: Pick<TodoRunnerState, 'halted' | 'haltReason' | 'items'>;
  autoLoopStatus?: 'all_done' | 'has_blocked' | 'timeout' | 'no_state_file' | 'max_iterations' | 'incomplete';
}
```

### 4.2 `next-step-decider` 输出增强
建议保留现有结构，仅新增 `reasonCodes`：

```ts
interface NextStepDecision {
  decision: NextStepDecisionType;
  currentStage: Stage;
  nextStage?: Stage;
  suggestedCommand?: string;
  reasons: string[];
  reasonCodes?: string[];
}
```

推荐 code：
- `AUTO_LOOP_NOT_DONE`
- `TODO_BLOCKED`
- `TODO_PENDING`
- `GATE_FAILED`
- `DEPENDENCY_FAILED`
- `STAGE_NOT_READY`

### 4.3 `stageStatus` 语义收口
- `drafting`
- `awaiting_review`
- `review_failed`
- `ready_to_advance`
- `advanced`（仅短暂事件态，不建议长期驻留）

建议：`advance()` 成功后，下一阶段直接回到 `drafting`。

## 5. 错误处理

### 硬阻断
- `autoLoopStatus !== all_done`
- Gate fail
- dependency fail
- todo blocked

### 软降级
- hooks 执行失败
- todo-state 缺失但当前阶段不依赖 todo

### 仅建议
- `stageStatus !== ready_to_advance`
- 未启用 `--auto-advance`

## 6. 测试策略

新增 / 更新测试：
- `tests/unit/next-step-decider.test.ts`
- `tests/unit/orchestrate-stage-integration.test.ts`
- `tests/unit/stage-flow-03-05.test.ts`

重点场景：
1. `03_plan` 满足条件 -> `READY_TO_ADVANCE`
2. `04_implement` 存在 blocked -> `BLOCKED`
3. `autoLoopStatus=all_done` 但 Gate fail -> `BLOCKED`
4. `todo pending` -> `SUGGEST_NEXT`
5. `--auto-advance` 仅在安全条件满足时调用 `advance()`
6. 默认模式永远只建议，不推进

## 7. 非目标

- 不实现 `AUTO_RUN_NEXT_SKILL`
- 不新增统一 skill executor
- 不迁移 runtime notice 架构
- 不扩展到 `06_wrap_up/07_release/08_done`

## 8. 预期收益

- `03_plan -> 04_implement -> 05_verify` 的推进规则集中化
- 有阻塞时绝不误推进
- todo 层状态与阶段层状态形成稳定映射
- 在不大改架构的前提下，为后续是否走 B 方案保留升级空间
