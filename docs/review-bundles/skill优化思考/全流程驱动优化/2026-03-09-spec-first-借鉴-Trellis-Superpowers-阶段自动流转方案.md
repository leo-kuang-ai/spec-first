# Spec-First 借鉴 Trellis / Superpowers 的阶段自动流转方案

> **生成时间**: 2026-03-09
> **目标**: 评估 `Trellis` 与 `Superpowers` 中可借鉴的“阶段自动流转”机制，并落为 `spec-first` 的产品方案与技术方案
> **范围**: 只讨论 `spec-first` 自身如何演进，不讨论把 `Trellis` 或 `Superpowers` 完整集成进来
> **方法**: 对照真实仓库文档与真实代码实现，避免把“自动注入 / 自动触发 / 自动推进”混为一谈

---

## 1. 结论摘要

### 1.1 总判断

- `Trellis` **不具备真正的阶段自动流转**，但很适合借鉴它的 **前后置钩子、上下文注入、检查闭环、会话记忆**。
- `Superpowers` **具备条件触发式流程自动激活能力**，但它不是持久化的阶段状态机；更适合借鉴它的 **按条件自动进入下一流程**。
- `spec-first` 当前已经具备 **阶段状态机、Gate、AI hooks、task auto-loop、orchestrate 编排** 等底座；最优路径不是重写，而是把现有能力升级为：
  - **阶段状态真相源**
  - **阶段前后 hook**
  - **条件驱动的 next-step 决策器**
  - **默认建议、可选自动推进、局部自动执行**

### 1.2 最重要结论

`spec-first` 最值得借鉴的不是“完整框架”，而是下面两类机制：

1. **来自 Trellis 的阶段内治理机制**
   - before-dev 上下文注入
   - check-* 阶段后检查
   - finish-work 收口
   - record-session 记忆落盘

2. **来自 Superpowers 的条件触发机制**
   - 设计批准后自动进入规划
   - 计划存在后自动进入执行
   - 执行完成后自动进入验证/收尾

### 1.3 推荐落地方向

把 `spec-first` 演进成：

> **状态机主控 + Hook 驱动 + 条件决策 + 分级自动化**

其中：

- `spec-first` 继续做 **唯一阶段真相源**
- 自动化优先覆盖 **阶段前后检查** 与 **下一步建议**
- 真正的自动推进先落在 `03_plan → 04_implement → 05_verify`
- `01_specify → 02_design`、`02_design → 03_plan` 仍保留人工确认

---

## 2. 真实基线证据

### 2.1 Trellis 的真实能力边界

`Trellis` 明确强调的是自动注入、会话持久化、并行 worktree，而不是产品阶段状态机：

- `/Users/kuang/xiaobu/Trellis/README.md:39`
- `/Users/kuang/xiaobu/Trellis/README.md:43`
- `/Users/kuang/xiaobu/Trellis/README.md:85`
- `/Users/kuang/xiaobu/Trellis/README.md:111`
- `/Users/kuang/xiaobu/Trellis/README.md:119`

`Trellis` 的工作流主要以显式命令驱动，而不是根据阶段状态自动推进：

- `/Users/kuang/xiaobu/Trellis/src/templates/opencode/commands/trellis/onboard.md:109`
- `/Users/kuang/xiaobu/Trellis/src/templates/opencode/commands/trellis/onboard.md:129`
- `/Users/kuang/xiaobu/Trellis/src/templates/opencode/commands/trellis/onboard.md:148`
- `/Users/kuang/xiaobu/Trellis/src/templates/opencode/commands/trellis/onboard.md:183`
- `/Users/kuang/xiaobu/Trellis/src/templates/opencode/commands/trellis/onboard.md:196`
- `/Users/kuang/xiaobu/Trellis/src/templates/opencode/commands/trellis/onboard.md:212`
- `/Users/kuang/xiaobu/Trellis/src/templates/opencode/commands/trellis/onboard.md:218`

### 2.2 Superpowers 的真实能力边界

`Superpowers` 明确支持“任务语义触发 skill 自动激活”，但它本质上是流程纪律框架，不是 feature 阶段状态机：

- `/Users/kuang/xiaobu/superpowers/README.md:76`
- `/Users/kuang/xiaobu/superpowers/README.md:78`
- `/Users/kuang/xiaobu/superpowers/README.md:80`
- `/Users/kuang/xiaobu/superpowers/README.md:82`
- `/Users/kuang/xiaobu/superpowers/README.md:84`
- `/Users/kuang/xiaobu/superpowers/README.md:86`
- `/Users/kuang/xiaobu/superpowers/README.md:92`
- `/Users/kuang/xiaobu/superpowers/README.md:94`

### 2.3 Spec-First 当前已有底座

`spec-first` 已经具备完整的主阶段枚举和合法流转校验：

- `src/shared/types.ts:7`
- `src/core/process-engine/stage-machine.ts:8`

`spec-first` 已经具备 Gate 驱动的阶段推进：

- `src/core/process-engine/advance.ts:102`
- `src/core/process-engine/advance.ts:124`
- `src/core/process-engine/advance.ts:135`
- `src/core/process-engine/advance.ts:174`

`spec-first` 已经具备 AI runtime hooks：

- `src/core/tool-integration/ai-runtime-hook.ts:38`
- `src/core/tool-integration/ai-runtime-hook.ts:41`
- `src/core/tool-integration/ai-runtime-hook.ts:53`
- `src/core/tool-integration/ai-runtime-hook.ts:63`

`spec-first` 已经具备 task 级 auto-loop：

- `src/core/ai-orchestrator/auto-loop.ts:95`
- `src/core/ai-orchestrator/auto-loop.ts:110`
- `src/core/ai-orchestrator/auto-loop.ts:166`
- `src/core/ai-orchestrator/auto-loop.ts:206`

`spec-first` 已经具备扩展 hook 的入口：

- `src/core/process-engine/extensions.ts:15`
- `src/core/process-engine/extensions.ts:61`

---

## 3. 对 Trellis 的借鉴判断

### 3.1 可借鉴点

#### A. 阶段前置上下文注入

Trellis 的 `/trellis:before-frontend-dev` / `/trellis:before-backend-dev` 本质是：

- 在进入某类工作前加载项目规范
- 把“项目特定知识”重新注入到当前工作上下文

对于 `spec-first`，应对应为：

- `before-spec`
- `before-design`
- `before-task`
- `before-code`
- `before-verify`

每个 before hook 负责：

- 装配当前阶段最小上下文包
- 注入上一阶段关键产物
- 输出当前 `background_input_status`
- 检查当前阶段是否缺依赖文档

#### B. 阶段后置检查

Trellis 的 `check-*` 很适合借鉴成 `spec-first` 每阶段完成后的标准动作：

- 写完 spec 后：跑 spec-review / matrix 初始化 / findings 更新
- 写完 design 后：跑契约一致性 / context sync / findings 更新
- 写完 task 后：跑覆盖率 / orphan / todo-state 生成
- 写完 code 后：跑 matrix check / 进度同步 / 当前 TASK 状态检查
- 写完 verify 后：跑 gate / coverage / waiver 检查

#### C. 收口动作

Trellis 的 `finish-work` 和 `record-session` 说明：

- 自动化不能只做“开始”，还要做“结束”
- 阶段完成后必须把结论写回外部记忆

这和 `spec-first` 的 `findings.md`、`traceability-matrix.md`、`todo-state.json` 非常契合。

### 3.2 不建议借鉴点

- 不建议把 `spec-first` 改造成以 slash command 为中心的会话框架
- 不建议让阶段推进依赖“人记得执行哪个命令”
- 不建议让阶段状态只存在会话里，而不落到 `stage-state.json`

### 3.3 对应结论

Trellis 最适合作为 `spec-first` 的 **阶段 hook 设计参考**，不适合作为 **阶段状态机参考**。

---

## 4. 对 Superpowers 的借鉴判断

### 4.1 可借鉴点

#### A. 条件触发式自动激活

Superpowers 的强项不是“记录阶段”，而是：

- 当上下文满足某种条件时
- 自动切换到下一类 skill 或流程

这对 `spec-first` 的借鉴价值很高。可以转成：

- `spec` 已完成且 review pass → 建议 / 准备 `design`
- `design` 已完成且 gate pass → 建议 / 准备 `task`
- `task` 已完成且 todo-state 已生成 → 自动进入 `code`
- `code` 全部 TASK done → 建议 / 条件触发 `verify`

#### B. 强制流程守卫

Superpowers 的流程不是“可选建议”，而是“按条件进入下一流程”。

`spec-first` 可以借鉴为：

- 没有 spec 通过，不允许进入 design
- 没有 design 通过，不允许进入 task
- 没有 task plan，不允许自动进入 code auto-loop
- gate 失败，不允许 advance

#### C. 推荐分级自动化

Superpowers 的经验说明：

- 自动化不一定等于全自动推进
- 可以先自动做判断，再自动做推荐，最后才考虑自动执行

这对 `spec-first` 很重要。

### 4.2 不建议借鉴点

- 不建议直接把 `brainstorming → writing-plans → executing-plans` 原样映射到 `spec-first`
- 不建议让 `spec-first` 变成通用 skill 编排框架
- 不建议用“会话上下文触发”取代“文件状态真相源”

### 4.3 对应结论

Superpowers 最适合作为 `spec-first` 的 **next-step 决策器设计参考**，不适合作为 **阶段持久化设计参考**。

---

## 5. Spec-First 的目标产品形态

### 5.1 目标定位

`spec-first` 的目标不是“集成 Trellis/Superpowers”，而是保留自己的优势：

- 有真实 feature 目录
- 有真实阶段状态文件
- 有真实 Gate 与追踪矩阵
- 有真实 CLI 命令体系

在此基础上新增：

- **阶段子状态**
- **阶段 before/after hooks**
- **自动 next-step 建议**
- **局部可选 auto-advance**

### 5.2 推荐工作模式

建议把自动化分成 4 档：

#### Mode A: Suggest

- 只做检查
- 只输出下一条建议命令
- 不自动推进阶段

适合默认模式。

#### Mode B: Assisted

- 自动执行阶段后检查
- 自动生成下一步建议
- 用户确认后再 `stage advance`

适合大多数团队。

#### Mode C: Auto-Advance

- Gate 通过后自动执行 `stage advance`
- 但不自动跑下一阶段 skill

适合流程已经稳定的团队。

#### Mode D: Auto-Run

- 自动 advance
- 自动进入下一阶段 skill
- 自动执行阶段内 hook

仅建议用于 `03_plan → 04_implement → 05_verify` 这一段。

### 5.3 人工 / 自动边界

#### 必须保留人工确认

- `01_specify` 的需求结论
- `02_design` 的技术方案确认
- `07_release` 与 `08_done` 的最终业务确认

#### 适合自动化

- 阶段前上下文准备
- 阶段后文档一致性检查
- Gate / matrix / coverage 证据收集
- 下一步命令生成
- `task/code` 阶段内的执行循环

---

## 6. 推荐的阶段自动流转设计

### 6.1 主阶段保持不变

继续使用现有主阶段：

- `00_init`
- `01_specify`
- `02_design`
- `03_plan`
- `04_implement`
- `05_verify`
- `06_wrap_up`
- `07_release`
- `08_done`
- `09_cancelled`

对应实现已存在：

- `src/shared/types.ts:7`
- `src/core/process-engine/stage-machine.ts:8`

### 6.2 新增阶段子状态

建议给 `stage-state.json` 增加以下子状态：

- `drafting`
- `awaiting_review`
- `review_failed`
- `ready_to_advance`
- `advanced`

作用：

- 主阶段表示“当前业务阶段”
- 子状态表示“当前是否允许自动建议 / 自动推进”

### 6.3 新增阶段自动化策略字段

建议在 `stage-state.json` 中增加：

- `autoAdvancePolicy`: `suggest | assisted | auto_advance | auto_run`
- `stageStatus`
- `lastVerifiedAt`
- `lastSuggestedCommand`
- `approvals`

其中 `approvals` 至少要覆盖：

- `specApproved`
- `designApproved`
- `releaseApproved`

### 6.4 核心规则

#### 规则 1：`spec → design`

- 默认不自动推进
- 自动动作仅包括：
  - `spec-review`
  - findings 更新
  - 建议执行 `/spec-first:design`

#### 规则 2：`design → task`

- 默认 Assisted
- 自动动作包括：
  - design 后检查
  - context sync
  - 如果 gate pass，则标记 `ready_to_advance`
  - 建议执行 `/spec-first:task`

#### 规则 3：`task → code`

- 最适合自动推进
- 自动动作包括：
  - task 覆盖率检查
  - orphan 检查
  - `todo-state.json` 生成
  - 条件满足时自动进入 `04_implement`

#### 规则 4：`code → verify`

- 可以做条件自动推进
- 前提：
  - 所有 TASK 都是 `done`
  - 无 blocked
  - matrix check 通过
  - 实现阶段 gate 通过

#### 规则 5：`verify → wrap_up / release`

- 仅建议，不默认自动推进
- 理由：离交付越近，越需要人工承担业务责任

---

## 7. 直接落到代码的技术方案

### 7.1 扩展 `StageState`

当前 `StageState` 定义见 `src/shared/types.ts:61`。

建议新增字段：

```ts
stageStatus?: 'drafting' | 'awaiting_review' | 'review_failed' | 'ready_to_advance' | 'advanced';
autoAdvancePolicy?: 'suggest' | 'assisted' | 'auto_advance' | 'auto_run';
lastVerifiedAt?: string;
lastSuggestedCommand?: string;
approvals?: {
  specApproved?: boolean;
  designApproved?: boolean;
  releaseApproved?: boolean;
};
```

设计原因：

- 不破坏当前主阶段状态机
- 只在状态层补齐自动流转所需信息

### 7.2 新增阶段 hook 抽象

在现有 AI hook 之外，再补一层 **阶段 hook**：

- `beforeStageEnter(stage)`
- `afterStageWrite(stage)`
- `beforeStageAdvance(stage)`
- `afterStageAdvance(stage)`

建议新增模块：

- `src/core/process-engine/stage-hooks.ts`

职责建议：

#### `beforeStageEnter`

- 读取当前 feature 与阶段
- 装配本阶段上下文包
- 输出 `background_input_status`
- 检查依赖文档是否存在

#### `afterStageWrite`

- 执行阶段一致性检查
- 更新 `findings.md`
- 必要时更新 `traceability-matrix.md`
- 生成下一步建议

#### `beforeStageAdvance`

- 执行 gate / matrix / coverage / dependency check
- 写入证据
- 决定是否允许 advance

#### `afterStageAdvance`

- 更新历史
- 准备下阶段建议命令
- 在需要时执行 context sync

### 7.3 新增下一步决策器

建议新增：

- `src/core/process-engine/next-step-decider.ts`

输出动作建议：

- `BLOCKED`
- `SUGGEST_NEXT`
- `READY_TO_ADVANCE`
- `AUTO_ADVANCE`
- `AUTO_RUN_NEXT_SKILL`

决策输入：

- `currentStage`
- `stageStatus`
- `autoAdvancePolicy`
- `gateStatus`
- `dependencyCheck`
- `matrixStatus`
- `approvals`
- `todo-state`

这是本轮最值得落地的核心模块，因为它正好承接了 Superpowers 的“条件触发式自动激活”能力。

### 7.4 复用现有 AI hooks，不重做一套宿主集成

当前 AI hooks 已存在，见 `src/core/tool-integration/ai-runtime-hook.ts:38`。

因此建议：

- **不重写 Claude hooks 体系**
- 在当前 hooks 基础上，补阶段化脚本

建议增加的托管脚本：

- `.spec-first/hooks/before-spec.sh`
- `.spec-first/hooks/after-spec-check.sh`
- `.spec-first/hooks/before-design.sh`
- `.spec-first/hooks/after-design-check.sh`
- `.spec-first/hooks/before-task.sh`
- `.spec-first/hooks/after-task-check.sh`
- `.spec-first/hooks/before-code.sh`
- `.spec-first/hooks/after-code-check.sh`
- `.spec-first/hooks/before-verify.sh`
- `.spec-first/hooks/after-verify-check.sh`

### 7.5 命令层建议

在现有 `spec-first stage current|advance|cancel` 基础上，建议新增：

- `spec-first stage suggest <featureId>`
- `spec-first stage enter <featureId>`
- `spec-first stage auto-advance <featureId>`
- `spec-first flow next <featureId>`

建议职责：

#### `stage suggest`

- 只输出当前阶段下一步建议
- 不修改状态

#### `stage enter`

- 执行当前阶段的 `beforeStageEnter`
- 输出该阶段最小上下文摘要

#### `stage auto-advance`

- 仅在策略允许且证据齐全时自动调用 `advance()`

#### `flow next`

- 一次性完成：
  - 当前状态检查
  - 阶段后检查
  - next-step 决策
  - 打印下一条命令

### 7.6 Skill 层接入建议

#### `03-spec`

- 完成后自动执行 `spec-review`
- 自动更新 findings
- 输出 `background_input_status`
- Gate 通过后标记 `ready_to_advance`
- 默认只建议 `/spec-first:design`

#### `04-design`

- 进入前自动注入 spec / matrix / constraints
- 完成后执行 design 一致性检查
- `advance()` 后继续复用当前已存在的 `context sync`，见 `src/core/process-engine/advance.ts:193`

#### `06-task`

- 完成后自动跑覆盖率 / orphan 检查
- 自动生成或刷新 `todo-state.json`
- 允许进入 `auto_run`

#### `07-code`

- 进入前复用当前 task-context 机制，见 `src/core/tool-integration/ai-runtime-hook-scripts.ts:17`
- 写完后复用 matrix check 与 progress sync，见 `src/core/tool-integration/ai-runtime-hook.ts:53`、`src/core/tool-integration/ai-runtime-hook.ts:58`
- 所有任务完成时，自动建议或自动触发 verify

#### `12-verify`

- 完成后自动跑 gate / coverage / matrix
- 如果全部 PASS，则标记 `ready_to_advance`
- 默认建议 `/spec-first:archive` 或后续 release / done 流程

---

## 8. 推荐实施顺序

### Phase 1：最小可用版

目标：先把“自动建议”做起来，不直接全自动推进。

实施项：

1. 扩展 `StageState`
2. 新增 `next-step-decider.ts`
3. 新增 `spec-first stage suggest`
4. 给 `spec/design/task/code/verify` 增加 after-check + 建议输出

### Phase 2：半自动推进版

目标：把 `task → code → verify` 串起来。

实施项：

1. 新增 `stage auto-advance`
2. 把 `03_plan → 04_implement` 改为 Assisted / Auto-Advance 可配
3. 把 `04_implement` 与当前 `auto-loop` 真正衔接起来

### Phase 3：完整阶段 hook 版

目标：把 before/after hooks 统一抽象，成为所有 stage 的标准机制。

实施项：

1. 新增 `stage-hooks.ts`
2. 托管更多 `.spec-first/hooks/*.sh`
3. 让 `flow next` 成为统一入口

---

## 9. 不应做的事

### 9.1 不应把 `spec-first` 变成 Trellis

- 不要以 slash command 为中心
- 不要让阶段推进依赖会话记忆
- 不要弱化 `stage-state.json` 的真相源地位

### 9.2 不应把 `spec-first` 变成 Superpowers

- 不要做成通用 skill 框架
- 不要让“是否进入下一步”只依赖 prompt 语义
- 不要用 skill 自动匹配替代阶段文件与 gate 证据

### 9.3 不应一开始就做全自动

不建议第一版就自动推进：

- `01_specify → 02_design`
- `02_design → 03_plan`
- `05_verify → 06_wrap_up`
- `07_release → 08_done`

这些节点仍应保留人工确认。

---

## 10. 最终建议

### 10.1 产品层建议

`spec-first` 的最优演进方向是：

> **把“阶段状态机”做稳，把“阶段自动流转”做成有边界的增量能力。**

先实现：

- 阶段后检查自动化
- 下一步建议自动化
- `task/code` 段半自动推进

后实现：

- 阶段 hook 统一机制
- 条件触发式 auto-advance

### 10.2 技术层建议

优先落地的 4 个点：

1. 扩展 `StageState`
2. 新增 `next-step-decider.ts`
3. 新增 `stage suggest` / `flow next`
4. 复用现有 hooks 做阶段 after-check

### 10.3 一句话结论

- **Trellis 借鉴 hook 与收口**
- **Superpowers 借鉴条件触发**
- **Spec-First 自己负责阶段状态机与证据治理**

这三者结合起来，才是最适合 `spec-first` 的“阶段自动流转”最佳实践。
