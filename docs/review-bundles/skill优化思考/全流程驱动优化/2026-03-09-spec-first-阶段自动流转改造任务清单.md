# Spec-First 阶段自动流转改造任务清单

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** 在不引入外部框架的前提下，让 `spec-first` 具备“阶段前后 hook + 条件驱动 next-step + 局部自动推进”的能力，并优先打通 `03_plan → 04_implement → 05_verify`。

**Architecture:** 保留 `spec-first` 现有 `stage-state.json + Gate + CLI + skill` 体系不变，在其上补四层能力：`StageState` 自动化元数据、共享背景解析器、阶段 hook 注册表、next-step 决策器。默认模式先做 `suggest/assisted`，只在任务与实现阶段开放 `auto_advance/auto_run`。

**Tech Stack:** Node.js 20、TypeScript 5.x、Vitest、现有 `spec-first` CLI / Gate / AI Hook 体系。

---

## 实施原则

- 不重做主阶段状态机，继续复用 `src/shared/types.ts` 与 `src/core/process-engine/stage-machine.ts`
- 不把 `spec-first` 改造成 `Trellis` / `Superpowers` 风格的通用流程框架
- 不在第一版自动推进 `01_specify → 02_design`、`02_design → 03_plan`、`05_verify → 06_wrap_up`
- 第一版优先交付：
  - `stage suggest`
  - 阶段 before/after hook 抽象
  - 共享 background guidance
  - `03_plan → 04_implement`、`04_implement → 05_verify` 的受控自动化
- 先补测试，再落实现；每一批都保留独立可验证的落地结果

---

## 范围与非目标

### 本轮范围

- 扩展 `StageState` 承载自动流转元数据
- 抽共享背景解析器，避免只给 `orchestrate` 特判
- 增加 `stage suggest` / `stage enter` / `stage auto-advance`
- 增加阶段 hook 抽象与托管脚本
- 打通 `task/code` 阶段局部自动化
- 同步 skill 文档与单测

### 明确非目标

- 不集成 `Trellis` 仓库代码
- 不集成 `Superpowers` 仓库代码
- 不新增新的主阶段
- 不做发布阶段的全自动收口
- 不让会话上下文替代 `stage-state.json` 作为真相源

---

## P0 / P1 / P2 拆分

### P0

- 扩展 `StageState` 自动化元数据
- 共享背景解析器 + consumer runtime notice
- `next-step-decider`
- `stage suggest`

### P1

- `stage-hooks` 抽象
- `stage enter`
- `task/code` 阶段受控自动推进
- skill 文档与 tests 同步

### P2

- `flow next` 统一入口
- 更细的 release / wrap_up 建议策略
- 扩展 hook 与 doctor/status 可视化联动

---

## Task 1：扩展 StageState 自动化元数据

**优先级：P0**

**Files:**
- Modify: `src/shared/types.ts`
- Modify: `src/shared/validators.ts`
- Modify: `src/core/process-engine/init.ts`
- Modify: `src/core/process-engine/advance.ts`
- Modify: `src/core/process-engine/feature.ts`
- Test: `tests/unit/init.test.ts`
- Test: `tests/unit/advance.test.ts`
- Test: `tests/unit/feature.test.ts`

**目标：** 在不破坏现有状态机的前提下，为自动流转提供最小必要状态字段。

**实施步骤：**
1. 在 `src/shared/types.ts` 的 `StageState` 中新增：
   - `stageStatus?: 'drafting' | 'awaiting_review' | 'review_failed' | 'ready_to_advance' | 'advanced'`
   - `autoAdvancePolicy?: 'suggest' | 'assisted' | 'auto_advance' | 'auto_run'`
   - `lastVerifiedAt?: string`
   - `lastSuggestedCommand?: string`
   - `approvals?: { specApproved?: boolean; designApproved?: boolean; releaseApproved?: boolean }`
2. 保持 `src/shared/validators.ts` 的 guard 最小兼容，不因旧 state 文件缺新字段而报错。
3. 在 `src/core/process-engine/init.ts` 中写入默认值：
   - `stageStatus='drafting'`
   - `autoAdvancePolicy='suggest'`
4. 在 `src/core/process-engine/advance.ts` 的 `sanitizeStageState()` 中保留新增字段，避免推进后被丢弃。
5. 仅在必要时调整 `src/core/process-engine/feature.ts` 的摘要读取逻辑，不要把所有新字段都暴露给 feature list。

**验证命令：**
- `pnpm vitest run tests/unit/init.test.ts tests/unit/advance.test.ts tests/unit/feature.test.ts`

**完成标准：**
- 新建 feature 的 `stage-state.json` 带默认自动化字段
- 旧 state 文件仍可读取
- `advance()` 不会丢失新增字段

---

## Task 2：抽共享背景解析器

**优先级：P0**

**Files:**
- Create: `src/core/skill-runtime/background-context.ts`
- Modify: `src/core/skill-runtime/dispatcher.ts`
- Reuse: `src/core/skill-runtime/first-context.ts`
- Test: `tests/unit/skill-runtime.test.ts`
- Test: `tests/unit/dispatcher-first-runtime.test.ts`
- Create Test: `tests/unit/background-context.test.ts`

**目标：** 把只服务于 `orchestrate` 的背景治理逻辑抽成公共能力，供 `spec/design/code/verify` 复用。

**实施步骤：**
1. 在 `src/core/skill-runtime/background-context.ts` 中封装统一接口，例如：
   - `resolveBackgroundContext(projectRoot, skillName)`
2. 复用已有能力：
   - `detectBackgroundInputStatus()`
   - `resolveOrchestrateDependencyStrength()` 的同类逻辑
   - 高风险信号评估逻辑
3. 为不同 skill 映射 `primaryView`：
   - `spec -> spec-view`
   - `design -> design-view`
   - `code -> code-view`
   - `verify -> verify-view`
   - `orchestrate -> governance guidance`
4. 输出统一字段：
   - `backgroundStatus`
   - `dependencyStrength`
   - `riskCategory`
   - `riskSignals`
   - `primaryView`
   - `recommendedAction`
   - `warning`
5. 保证未定位当前 feature、stage-state 缺失、runtime 缺失时都能稳定降级为 `undefined` 或 `blind`，不要抛出不必要异常。

**验证命令：**
- `pnpm vitest run tests/unit/skill-runtime.test.ts tests/unit/dispatcher-first-runtime.test.ts tests/unit/background-context.test.ts`

**完成标准：**
- 背景判定逻辑不再只存在 `orchestrate` 分支
- 不同 consumer skill 可以拿到统一结构的背景上下文

---

## Task 3：为核心 consumer skill 注入统一 runtime notice

**优先级：P0**

**Files:**
- Modify: `src/core/skill-runtime/dispatcher.ts`
- Optionally Create: `src/core/skill-runtime/background-runtime-notice.ts`
- Test: `tests/unit/skill-runtime.test.ts`
- Test: `tests/unit/spec-skill-docs.test.ts`
- Test: `tests/unit/design-skill-docs.test.ts`
- Test: `tests/unit/code-skill-docs.test.ts`
- Test: `tests/unit/verify-skill-docs.test.ts`

**目标：** 让 `03-spec`、`04-design`、`07-code`、`12-verify` 像 `orchestrate` 一样，在 runtime 加载时得到统一的背景 notice。

**实施步骤：**
1. 不继续在 `dispatcher.ts` 里增加多个散乱的 `if (skillName === ...)`，统一抽成一个 helper。
2. 为以下 skill 注入 runtime notice：
   - `spec`
   - `design`
   - `code`
   - `verify`
3. notice 最少包括：
   - `background_status`
   - `primary_view`
   - `recommended_action`
   - `warning`
4. 对 `orchestrate` 保持现有行为兼容，不回归已有测试。

**验证命令：**
- `pnpm vitest run tests/unit/skill-runtime.test.ts tests/unit/spec-skill-docs.test.ts tests/unit/design-skill-docs.test.ts tests/unit/code-skill-docs.test.ts tests/unit/verify-skill-docs.test.ts`

**完成标准：**
- 核心 consumer skill 不再只靠文档声明“应读取 stage-view”
- runtime 层真实注入已落地

---

## Task 4：新增 next-step 决策器

**优先级：P0**

**Files:**
- Create: `src/core/process-engine/next-step-decider.ts`
- Modify: `src/core/process-engine/advance.ts`
- Modify: `src/core/process-engine/dependency-checker.ts`
- Create Test: `tests/unit/next-step-decider.test.ts`

**目标：** 用文件状态、Gate、matrix、approval、todo-state 共同决定下一步是阻塞、建议、可推进还是自动运行。

**实施步骤：**
1. 定义决策输出类型：
   - `BLOCKED`
   - `SUGGEST_NEXT`
   - `READY_TO_ADVANCE`
   - `AUTO_ADVANCE`
   - `AUTO_RUN_NEXT_SKILL`
2. 决策输入至少覆盖：
   - `currentStage`
   - `stageStatus`
   - `autoAdvancePolicy`
   - `gateStatus`
   - `dependencyCheck`
   - `approvals`
   - `todoState`
3. 第一版优先支持：
   - `01_specify → 02_design` 返回 `SUGGEST_NEXT`
   - `02_design → 03_plan` 返回 `SUGGEST_NEXT` 或 `READY_TO_ADVANCE`
   - `03_plan → 04_implement` 支持 `AUTO_ADVANCE`
   - `04_implement → 05_verify` 支持 `AUTO_ADVANCE` / `AUTO_RUN_NEXT_SKILL`
4. 不把 `release/done` 自动推进纳入第一版。

**验证命令：**
- `pnpm vitest run tests/unit/next-step-decider.test.ts tests/unit/advance.test.ts`

**完成标准：**
- 有统一决策入口
- 决策不再分散在 skill 文档、CLI 文案、人工判断中

---

## Task 5：新增 `stage suggest`

**优先级：P0**

**Files:**
- Modify: `src/cli/commands/stage.ts`
- Modify: `src/cli/index.ts`
- Test: `tests/unit/cli-init-stage.test.ts`
- Optionally Create Test: `tests/unit/stage-suggest.test.ts`

**目标：** 给研发一个零风险入口，先让系统给出“现在应该做什么”，而不是直接自动推进。

**实施步骤：**
1. 给 `stage` 增加 `suggest` 子命令：
   - `spec-first stage suggest <featureId>`
2. 调用 `next-step-decider` 输出：
   - 当前阶段
   - 当前子状态
   - 建议动作
   - 建议命令
   - 阻塞原因（如有）
3. 更新 `src/cli/index.ts` 中 `stage` 命令说明，使帮助信息包含 `suggest`。
4. 保持 `current/advance/cancel` 完全兼容。

**验证命令：**
- `pnpm vitest run tests/unit/cli-init-stage.test.ts tests/unit/stage-suggest.test.ts`

**完成标准：**
- 用户可以先用 `stage suggest` 看系统建议
- 这条命令不会修改任何状态文件

---

## Task 6：新增阶段 hook 抽象与 `stage enter`

**优先级：P1**

**Files:**
- Create: `src/core/process-engine/stage-hooks.ts`
- Modify: `src/cli/commands/stage.ts`
- Modify: `src/core/tool-integration/ai-runtime-hook.ts`
- Modify: `src/core/tool-integration/ai-runtime-hook-scripts.ts`
- Test: `tests/unit/ai-runtime-hook.test.ts`
- Test: `tests/unit/task-context-hook.test.ts`
- Create Test: `tests/unit/stage-hooks.test.ts`

**目标：** 把 Trellis 式的 before/after 阶段治理机制，落成 `spec-first` 内部标准抽象。

**实施步骤：**
1. 在 `src/core/process-engine/stage-hooks.ts` 定义：
   - `beforeStageEnter(stage)`
   - `afterStageWrite(stage)`
   - `beforeStageAdvance(stage)`
   - `afterStageAdvance(stage)`
2. 第一版不要把所有 hook 都直接挂 Claude runtime；先让 CLI 和 orchestrate 显式调用。
3. 新增 `stage enter`：
   - `spec-first stage enter <featureId>`
   - 作用是执行当前阶段的 `beforeStageEnter`
4. 在 `.spec-first/hooks/` 中补更多托管脚本骨架，但保持 idempotent：
   - `before-spec.sh`
   - `after-spec-check.sh`
   - `before-design.sh`
   - `after-design-check.sh`
   - `before-task.sh`
   - `after-task-check.sh`
   - `before-code.sh`
   - `after-code-check.sh`
   - `before-verify.sh`
   - `after-verify-check.sh`
5. 不要删除现有 `task-context.sh` / `progress-sync.sh` / `stop-guard.sh`，而是复用并扩展。

**验证命令：**
- `pnpm vitest run tests/unit/ai-runtime-hook.test.ts tests/unit/task-context-hook.test.ts tests/unit/stage-hooks.test.ts`

**完成标准：**
- 已形成统一的阶段 hook 抽象
- `stage enter` 能输出当前阶段上下文准备结果

---

## Task 7：把 `task/code` 阶段受控自动化打通

**优先级：P1**

**Files:**
- Modify: `src/core/ai-orchestrator/auto-loop.ts`
- Modify: `src/core/process-engine/next-step-decider.ts`
- Modify: `src/cli/commands/stage.ts`
- Modify: `src/core/tool-integration/ai-runtime-hook.ts`
- Test: `tests/unit/ai-orchestrator.test.ts`
- Test: `tests/unit/todo-status-normalize.test.ts`
- Create Test: `tests/unit/stage-auto-advance.test.ts`

**目标：** 先让 `03_plan → 04_implement → 05_verify` 这一段具备真正可用的半自动流转能力。

**实施步骤：**
1. 当 `03_plan` 下的 `task_plan.md`、`todo-state.json`、matrix/gate 条件满足时：
   - `next-step-decider` 返回 `AUTO_ADVANCE`
2. 当 `04_implement` 下所有 TASK `done`、无 blocked、matrix check 通过时：
   - 返回 `AUTO_ADVANCE` 或 `AUTO_RUN_NEXT_SKILL`
3. 将 `auto-loop` 的完成状态与 `next-step-decider` 联动，而不是只停留在 todo 层。
4. 对 blocked / timeout 情况，必须显式降级回 `BLOCKED`，不得偷偷推进阶段。

**验证命令：**
- `pnpm vitest run tests/unit/ai-orchestrator.test.ts tests/unit/todo-status-normalize.test.ts tests/unit/stage-auto-advance.test.ts`

**完成标准：**
- `task/code` 阶段形成稳定的受控自动化闭环
- blocked 状态会硬阻断，不会误推进

---

## Task 8：同步核心 skill 文档

**优先级：P1**

**Files:**
- Modify: `skills/spec-first/03-spec/SKILL.md`
- Modify: `skills/spec-first/04-design/SKILL.md`
- Modify: `skills/spec-first/06-task/SKILL.md`
- Modify: `skills/spec-first/07-code/SKILL.md`
- Modify: `skills/spec-first/12-verify/SKILL.md`
- Modify: `skills/spec-first/13-orchestrate/SKILL.md`
- Modify: `skills/spec-first/README.md`
- Test: `tests/unit/spec-skill-docs.test.ts`
- Test: `tests/unit/design-skill-docs.test.ts`
- Test: `tests/unit/code-skill-docs.test.ts`
- Test: `tests/unit/verify-skill-docs.test.ts`

**目标：** 让 skill 文档和真实运行时能力对齐，避免文档先说有自动流转，代码却没有。

**实施步骤：**
1. 在 `03-spec` 中明确：
   - after-check 自动执行
   - 默认只建议进入 `design`
2. 在 `04-design` 中明确：
   - design 后检查与 context sync
   - 默认 Assisted
3. 在 `06-task` 中明确：
   - todo-state 生成是进入 auto-run 的前提
4. 在 `07-code` 中明确：
   - task-context / matrix / progress sync / stop guard 的关系
5. 在 `12-verify` 中明确：
   - verify 后允许 `ready_to_advance`
6. 在 `13-orchestrate` 中补充：
   - `stage suggest` / `stage enter` / `auto-advance` 的协作关系
7. 更新 `skills/spec-first/README.md` 的阶段说明和推荐入口。

**验证命令：**
- `pnpm vitest run tests/unit/spec-skill-docs.test.ts tests/unit/design-skill-docs.test.ts tests/unit/code-skill-docs.test.ts tests/unit/verify-skill-docs.test.ts`

**完成标准：**
- 技能文档与代码行为一致
- 核心阶段 skill 都说明了 before/after check 与自动化边界

---

## Task 9：新增 `flow next` 统一入口（可选）

**优先级：P2**

**Files:**
- Create: `src/cli/commands/flow.ts`
- Modify: `src/cli/index.ts`
- Modify: `src/cli/router.ts`
- Test: `tests/unit/flow.test.ts`

**目标：** 给团队一个统一入口，一次性完成“状态检查 → 阶段 hook → next-step 建议”。

**实施步骤：**
1. 增加顶层命令：`spec-first flow next <featureId>`
2. 内部顺序：
   - 加载当前状态
   - 执行 `beforeStageEnter` 或 `afterStageWrite` 的必要动作
   - 调用 `next-step-decider`
   - 输出下一条命令
3. 第一版只做 orchestrator shell，不要在这里重复实现业务逻辑。

**验证命令：**
- `pnpm vitest run tests/unit/flow.test.ts`

**完成标准：**
- 新人只需要记住 `flow next`
- 具体阶段规则仍由 `stage` / `hook` / `decider` 管理

---

## Task 10：文档与观测收口

**优先级：P2**

**Files:**
- Modify: `README.md`
- Modify: `src/cli/commands/stage.ts`
- Modify: `src/cli/commands/doctor.ts`
- Modify: `skills/spec-first/14-status/SKILL.md`
- Modify: `skills/spec-first/15-doctor/SKILL.md`
- Test: `tests/unit/status-skill-docs.test.ts`
- Test: `tests/unit/cli-metrics-doctor.test.ts`

**目标：** 把阶段自动流转状态暴露出来，让用户和维护者都能观察到“系统为什么建议这一步”。

**实施步骤：**
1. 在根 `README.md` 增加阶段自动流转能力说明。
2. 在 `stage current` 输出中新增：
   - `stageStatus`
   - `autoAdvancePolicy`
   - `lastSuggestedCommand`
3. 在 `doctor` / `status` 相关输出中补可视化字段：
   - 当前是否支持 auto-advance
   - 当前缺了哪些前提
4. 确保文档与 CLI 输出使用同一套术语。

**验证命令：**
- `pnpm vitest run tests/unit/cli-metrics-doctor.test.ts tests/unit/status-skill-docs.test.ts`

**完成标准：**
- 用户能看到自动流转状态与阻塞原因
- 文档和 CLI 术语一致

---

## 推荐执行顺序

### 第 1 批

1. Task 1：扩展 `StageState`
2. Task 2：共享背景解析器
3. Task 3：consumer runtime notice
4. Task 4：`next-step-decider`
5. Task 5：`stage suggest`

### 第 2 批

6. Task 6：`stage-hooks` + `stage enter`
7. Task 7：`task/code` 受控自动化
8. Task 8：skill 文档同步

### 第 3 批

9. Task 9：`flow next`
10. Task 10：文档与可观测性收口

---

## 每批回归建议

### Batch 1 回归

- `pnpm vitest run tests/unit/init.test.ts tests/unit/advance.test.ts tests/unit/feature.test.ts tests/unit/skill-runtime.test.ts tests/unit/dispatcher-first-runtime.test.ts tests/unit/next-step-decider.test.ts tests/unit/cli-init-stage.test.ts tests/unit/stage-suggest.test.ts`

### Batch 2 回归

- `pnpm vitest run tests/unit/ai-runtime-hook.test.ts tests/unit/task-context-hook.test.ts tests/unit/stage-hooks.test.ts tests/unit/ai-orchestrator.test.ts tests/unit/todo-status-normalize.test.ts tests/unit/stage-auto-advance.test.ts tests/unit/spec-skill-docs.test.ts tests/unit/design-skill-docs.test.ts tests/unit/code-skill-docs.test.ts tests/unit/verify-skill-docs.test.ts`

### Batch 3 回归

- `pnpm vitest run tests/unit/flow.test.ts tests/unit/cli-metrics-doctor.test.ts tests/unit/status-skill-docs.test.ts`

---

## 风险提示

- `StageState` 加字段后，要小心 `sanitizeStageState()` 漏字段导致推进时丢状态
- `dispatcher.ts` 现在已经较复杂，继续堆分支会恶化维护成本；务必抽 helper
- `auto-loop` 和 `stage advance` 联动时，要防止“任务完成但 Gate 未过却推进”的假阳性
- `stage enter` 与宿主 runtime hook 的职责边界要明确，第一版优先 CLI 主导，避免宿主配置过重

---

## 最后建议

如果只做一版最小可用改造，建议只做：

1. Task 1
2. Task 2
3. Task 3
4. Task 4
5. Task 5

这样就已经能让 `spec-first` 从“静态阶段框架”升级为“会建议下一步的阶段框架”，而且对现有用户最安全。

如果要继续做第二版，再补：

6. Task 6
7. Task 7
8. Task 8

这样 `task/code` 的半自动流转就能真正落地。
