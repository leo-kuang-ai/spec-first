# Spec-First 产物 ID 链路一致性深度代码审计报告

- 审计时间：2026-03-10
- 审计范围：以运行时代码为准，覆盖 `init → dispatcher/orchestrate → trace/matrix → todo-state → catchup/retry/watchdog → gate/validate` 主链路
- 审计方法：先建模，再按“ID 生成 → 传播 → 校验 → 持久化 → 恢复”逐段验证，再回看异常路径与守卫缺口
- 证据基线：本次额外执行了定向测试，`pnpm vitest run tests/unit/id-generator.test.ts tests/unit/init.test.ts tests/unit/audit-log.test.ts tests/unit/auto-loop.test.ts tests/unit/feature.test.ts tests/unit/format-validator.test.ts tests/unit/id-search.test.ts tests/unit/batch-executor/integration.test.ts`，结果 `8 files / 77 tests passed`

## 0. 审计计划

### 0.1 目标拆解

本次审计按两条 ID 主线并行展开：

1. **Feature ID 主线**：`FSREQ-*`
   - 生成：`init`
   - 传播：`.spec-first/current`、`stage-state.json`、registry、dispatcher/orchestrate
   - 校验：`resolveFeatureId`、gate/loadState
   - 持久化：目录名、`stage-state.json`、`.feat-registry.md`
   - 恢复：`recoverExistingFeature`、`recoverFromInitError`、catchup/current-feature 读取

2. **Artifact ID 主线**：`FR/DS/TASK/TC/RFC/...`
   - 生成：`id next` / `nextId`
   - 传播：`traceability-matrix.md`、`task_plan.md`、context pack、prompt、audit log、commit hook
   - 校验：`validateId`、`checkMatrix`、`validate format`、`gate sca`
   - 持久化：matrix、todo-state、audit log
   - 恢复：catchup、auto-loop resume、batch checkpoint、prompt assembly

### 0.2 执行顺序

1. 建立 ID 生命周期地图
2. 审计主流程：初始化、路由、追踪、状态推进
3. 审计异常路径：重试、恢复、并发、重复执行、文档/运行时偏差
4. 输出问题、证据、根因、影响、风险与修复建议

### 0.3 审计判定标准

重点判断以下 5 个维度是否成立：

- **一致性**：同一 ID 规则在不同模块是否同构
- **完整性**：生成后是否能完整传到后续阶段
- **健壮性**：异常/损坏/并发下是否仍可保持规则成立
- **幂等性**：重复执行是否不会重复写入/漂移
- **可恢复性**：中断后是否能从持久化状态准确恢复

---

## 1. ID 生命周期地图

## 1.1 Feature ID 生命周期

### 1.1.1 生成

- `src/core/process-engine/init.ts:79` `generateFeatureId()` 生成 `FSREQ-YYYYMMDD-FEAT-NNN`
- `src/core/process-engine/init.ts:57` `findNextFeatureSeq()` 通过扫描 `specs/` 目录决定序号
- `src/core/process-engine/init.ts:547` `resolveFeatureInitTargets()` 决定 `featureDir/tmpFeatureDir`

### 1.1.2 传播

- `src/core/process-engine/init.ts:625` 初始化写入 `specs/{featureId}/stage-state.json`
- `src/core/process-engine/init.ts:498` 写 `.spec-first/current`
- `src/core/process-engine/init.ts:164` / `src/core/process-engine/init.ts:186` 回填 `specs/.feat-registry.md`
- `src/core/process-engine/feature.ts:14` `currentFeature()` 从 `.spec-first/current` 读当前 Feature
- `src/core/process-engine/feature.ts:87` `resolveFeatureId()` 基于 `listFeatures()` 解析 exact/prefix/env
- `src/cli/commands/orchestrate.ts:34` `resolveFeatureOrCurrent()` 在 orchestrate 中读取显式参数或 `.spec-first/current`

### 1.1.3 校验

- `src/core/process-engine/init.ts:178` 防止同一 `FEAT` 映射到不同 `featureId`
- `src/core/process-engine/feature.ts:87` 校验 exact/prefix/env 是否能解析到存在 Feature
- `src/core/gate-engine/gate-evaluator.ts:324` 通过 `stage-state.json` 载入 gate 评估上下文

### 1.1.4 持久化

Feature ID 实际上被持久化在 4 个地方：

1. 目录名 `specs/{featureId}/`
2. `specs/{featureId}/stage-state.json` 内部字段 `featureId`
3. `.spec-first/current`
4. `specs/.feat-registry.md`

### 1.1.5 恢复

- `src/core/process-engine/init.ts:561` `recoverExistingFeature()`：目录已存在则视为幂等恢复
- `src/core/process-engine/init.ts:677` `recoverFromInitError()`：临时目录失败后尝试恢复既有 Feature
- `src/core/process-engine/init.ts:510` `restoreCurrentFeature()`：回滚 `.spec-first/current`
- `src/core/ai-orchestrator/catchup.ts:65` `catchup()`：基于 `featureId + stage-state + task_plan + findings` 恢复上下文

## 1.2 Artifact ID 生命周期

### 1.2.1 生成

- `src/core/trace-engine/id-generator.ts:28` `nextId()` 是 Artifact ID 真正的生成入口
- `src/core/trace-engine/id-generator.ts:61` `assembleId()` 生成 `FR/DS/TASK/TC/RFC/...`
- `src/core/trace-engine/id-validator.ts:8` `ID_PATTERNS` 是格式规则真源

### 1.2.2 传播

Artifact ID 会经过多条链路传播：

1. `traceability-matrix.md`
   - `src/core/trace-engine/id-generator.ts:112` `appendToMatrix()` 追加行
   - `src/core/trace-engine/matrix.ts:44` / `:141` 后续统一读取
2. `task_plan.md`
   - `src/core/process-engine/init.ts:303` 初始化骨架包含 `TASK-*`
   - `src/cli/commands/commit.ts:62`、`src/core/ai-orchestrator/catchup.ts:164`、`src/core/skill-runtime/prompt-assembler.ts:137`、`src/core/skill-runtime/hard-gate.ts:64` 都会再解析 TASK
3. runtime / context
   - `src/core/ai-orchestrator/context-pack.ts:261` `buildTaskContextPack()` 读取 `taskId`
   - `src/core/ai-orchestrator/context-pack.ts:338` `extractTaskTraces()` 从 matrix 反查 `FR/DS/API`
   - `src/core/skill-runtime/prompt-assembler.ts:154` 组装 prompt 时读取 `currentTask`
4. 状态与审计
   - `src/core/ai-orchestrator/todo-runner.ts:119` `todo-state.json`
   - `src/core/ai-orchestrator/audit-log.ts:57` `audit.jsonl`

### 1.2.3 校验

- `src/core/trace-engine/id-validator.ts:25` `validateId()`：只校验格式
- `src/core/validators/format-validator.ts:12` `validateFormat()`：格式/路径/字段
- `src/core/trace-engine/matrix.ts:53` `checkMatrix()`：孤儿、断链、V-Model
- `src/core/gate-engine/sca.ts:162`：只对 `FR/NFR` 做重复 ID 唯一性检查

### 1.2.4 持久化

Artifact ID 的核心持久化面：

- `traceability-matrix.md`
- `task_plan.md`
- `todo-state.json`
- `audit.jsonl`
- `gate-history.jsonl`

### 1.2.5 恢复

- `src/core/ai-orchestrator/todo-runner.ts:109` `loadTodoState()`：从 `todo-state.json` 恢复
- `src/core/ai-orchestrator/catchup.ts:65`：从 `task_plan/findings/stage-state` 恢复 current task/phase
- `src/core/skill-runtime/prompt-assembler.ts:154`：每次装配 prompt 都尝试重建当前上下文
- `src/core/ai-orchestrator/audit-log.ts:105`：审计链完整性验证

---

## 2. 主流程审计

## 2.1 初始化链路（Feature ID）

### 结论

`init` 的 **创建-落盘-回滚** 主链路整体相对完整：有 registry lock，有 current-feature 回滚，有幂等恢复分支。

### 证据

- `src/core/process-engine/init.ts:125` `withRegistryLock()` 用 `wx` 锁文件串行化 registry 更新
- `src/core/process-engine/init.ts:634` `commitFeatureInit()` 在锁内执行 rename / writeCurrentFeature / registerFeat
- `src/core/process-engine/init.ts:677` `recoverFromInitError()` 在异常后删除 tmp 并尝试恢复既有 feature
- `src/core/process-engine/init.ts:561` `recoverExistingFeature()` 在目录已存在时修复 registry/current

### 审计判断

- **一致性**：较好
- **完整性**：较好
- **健壮性**：对 init 自身较好
- **幂等性**：已显式考虑
- **可恢复性**：已显式考虑

### 保留风险

此链路的主要缺口不在 `init` 自身，而在后续运行时对 “目录名 / stage-state.featureId / current 指针” 三者一致性的持续校验缺失，见问题 F4。

## 2.2 Artifact ID 生成链路（`nextId` → matrix）

### 结论

生成链路的语法规则集中在 `id-validator`，但 **序号分配与持久化并不是原子事务**，因此并发与重复执行下不可靠。

### 证据

- `src/core/trace-engine/id-generator.ts:28` `nextId()`：`parseMatrixIds -> findNextSeq -> assembleId -> validateId -> appendToMatrix`
- `src/core/trace-engine/id-generator.ts:74` `findNextSeq()` 仅基于当前 matrix 扫描结果计算 max+1
- `src/core/trace-engine/id-generator.ts:112` `appendToMatrix()` 直接在文件末尾追加，没有锁、没有去重、没有 compare-and-swap
- `src/cli/commands/id.ts:41` `handleNext()` 直接调用 `nextId()`，没有任何 feature resolve / 并发保护 / 幂等令牌

### 审计判断

- **一致性**：格式规则一致，但序号规则缺少全局并发一致性
- **完整性**：单线程下可用
- **健壮性**：并发下脆弱
- **幂等性**：差；重放会重复分配新号或重复写同号
- **可恢复性**：依赖人工修 matrix

## 2.3 Matrix / Gate / Validate 主守卫

### 结论

现有守卫能发现部分“缺链”，但 **无法系统发现全类型重复、写入冲突、状态文件 schema 漂移**。

### 证据

- `src/core/trace-engine/matrix.ts:53` `checkMatrix()` 只检查 orphan / broken chain / V-Model
- `src/cli/commands/validate.ts:52` `handleMatrixValidation()` 仅包装 `checkMatrix()`
- `src/core/validators/format-validator.ts:57` `validateIdFormat()` 只检查多余连字符，不校验重复、不校验上下游关系
- `src/core/gate-engine/sca.ts:162` 只检查 `FR/NFR ID` 唯一性；并未覆盖 `DS/TASK/TC/RFC/...`

### 审计判断

- **一致性**：守卫边界与真实写入边界不一致
- **完整性**：只能覆盖部分 ID 异常
- **健壮性**：面对重复写入和 schema 偏差无力
- **幂等性**：无保障
- **可恢复性**：只能发现部分问题，不能自愈

## 2.4 Orchestrate / Catchup / Prompt 主流程

### 结论

`orchestrate` 主循环本身没有发现“无上限无限自旋”，因为有 `maxIterations` 上界；但其周边恢复链高度依赖 `task_plan.md` 与 `todo-state.json` 的解析，而这两处规则并不统一。

### 证据

- `src/core/ai-orchestrator/auto-loop.ts:97` `runAutoLoop()` 使用 `while (state.iteration < state.maxIterations && !state.halted)`
- `src/core/ai-orchestrator/todo-runner.ts:207` `advanceTodoIteration()` 在超出 `maxIterations` 时显式 `halted=true`
- `src/core/ai-orchestrator/catchup.ts:164` 当前 TASK 通过扫描 `task_plan.md` 文本判断
- `src/core/skill-runtime/prompt-assembler.ts:137` prompt 装配也重新扫描 `task_plan.md`

### 审计判断

- **无限循环风险**：主循环未见真正无上限死循环
- **假恢复风险**：高；因为恢复依赖的状态文件/任务解析规则碎片化
- **状态漂移风险**：高；见 F1、F2、F5

---

## 3. 异常路径与边界场景审计

## 3.1 并发生成 / 重复执行

### 观察

- `Feature ID` 初始化有 lock
- `Artifact ID` 生成无 lock
- `audit log` hash 链写入无 lock
- `matrix` 行追加无去重

### 结论

项目在“Feature 初始化”上考虑了并发，但在“Artifact ID / audit chain / matrix append”上没有等价保护，导致 **链路前半段可靠，后半段脆弱**。

## 3.2 重试 / 恢复 / resume

### 观察

- `retry-controller` 定义了分类、budget、backoff、状态注入：`src/core/ai-orchestrator/retry-controller.ts:123`、`src/core/ai-orchestrator/retry-controller.ts:174`
- 但 `runAutoLoop()` 主路径中没有调用这些函数：`src/core/ai-orchestrator/auto-loop.ts:97`
- 全库调用点搜索显示，`makeRetryDecision` / `applyRetryToState` 仅出现在测试中：`tests/e2e/auto-loop-scenarios.test.ts:137`、`tests/unit/retry-controller.test.ts:172`

### 结论

当前代码库中“重试控制器”更像 **孤立能力**，而非主流程真实防线。也就是说：

- 不会形成真正“受控重试”
- 也不会真正执行 backoff / retry budget / failure 注入策略
- catchup 里展示的 retry 预算摘要容易成为“看起来存在、实际上没有运行”的假状态

## 3.3 Watchdog / heartbeat

### 观察

- `src/core/ai-orchestrator/watchdog.ts:82` `runWatchdogCheck()` 会优先检查 `task_timeout` 和 `heartbeat_stalled`
- `src/core/ai-orchestrator/auto-loop.ts:145` 仅在 executor 返回后才更新 heartbeat 并检查 watchdog

### 结论

watchdog 本身已接入主循环，但其可靠性建立在 `todo-state` schema 正确、`runtime.autoLoop` 在场、`currentTaskId/taskStartedAt` 未被其他路径覆盖之上；一旦 F1 的 schema collision 发生，watchdog 语义也会失真。

## 3.4 文档链路 vs 运行时代码

### 观察

- 文档声明：`/Users/kuang/.codex/skills/spec-first/orchestrate/references/skill-mapping.md:81` 写明“所有子 Skill 继承 orchestrate 的 featureId”
- 运行时实际：`src/core/skill-runtime/dispatcher.ts:188`、`src/core/skill-runtime/prompt-assembler.ts:154` 主要依赖 `.spec-first/current` 与本地 prompt assembly；没有看到将 `orchestrateArgs.featureId` 强绑定传播到后续 skill runtime context 的机制

### 结论

这里存在 **“文档层承诺强于运行时硬约束”** 的偏差：当前更像“提示性继承”，不是“硬绑定继承”。风险见 F6（观察项）。

---

## 4. 核心问题清单

## F1. `todo-state.json` 被两套不兼容 schema 复用，导致恢复链断裂

- **风险等级**：CRITICAL
- **影响维度**：一致性 / 健壮性 / 可恢复性 / 幂等性

### 证据

- `src/core/ai-orchestrator/todo-runner.ts:52` 定义 `TodoRunnerState`（含 `iteration/maxIterations/runtime/items`）
- `src/core/ai-orchestrator/todo-runner.ts:119` `saveTodoState()` 将其落盘到 `specs/{featureId}/todo-state.json`
- `src/core/batch-executor/checkpoint.ts:7` 定义另一套 `CheckpointState`（含 `currentLayer/completedTasks/failedTasks/layerResults`）
- `src/core/batch-executor/checkpoint.ts:18` `saveCheckpoint()` 也写入 **同一个** `specs/{featureId}/todo-state.json`
- `src/core/ai-orchestrator/auto-loop.ts:104` `runAutoLoop()` 读取该文件并假设返回的是 `TodoRunnerState`
- `src/core/ai-orchestrator/todo-runner.ts:109` `loadTodoState()` 仅做 JSON parse，不做 schema guard
- `src/core/ai-orchestrator/todo-runner.ts:156` `pickReadyTodos()` 直接访问 `state.items.filter(...)`

### 问题机制

这不是“同一 schema 的不同 writer”，而是 **两套不同状态机写进同一文件路径**：

- auto-loop 认为 `todo-state.json` 是 `TodoRunnerState`
- batch-executor 认为 `todo-state.json` 是 `CheckpointState`

一旦 batch-executor 写入后再进入 orchestrate/auto-loop，后者会在读取同一文件时得到一份“字段存在但语义不兼容”的对象，后续访问 `state.items` / `state.iteration` / `runtime.autoLoop` 时会出现假恢复、错误 halt，甚至直接异常。

### 根因

- 缺少状态文件 **schema/version/discriminator**
- 缺少统一的 todo/checkpoint 存储抽象
- `loadTodoState()` 没有类型守卫，直接相信 JSON 形状

### 影响范围

- `orchestrate --auto/--resume`
- catchup 对 todo-state 的摘要展示
- watchdog / retry / heartbeat 相关逻辑
- batch executor 与 orchestrator 混用场景

### 为什么现有 gate / validate / trace / runtime 没发现

- gate / validate / trace 都不校验 `todo-state.json` schema
- `loadTodoState()` 没做 `readJsonChecked`
- 测试只分别验证两条链路，各自通过；没有“batch 执行后再 orchestrate resume”的交叉测试

### 修复建议

1. **立即拆分文件名**：
   - auto-loop 保留 `todo-state.json`
   - batch executor 改为 `batch-checkpoint.json`
2. 为两种状态都增加 `kind/version` 字段
3. `loadTodoState()` 改为严格 schema guard；读到错误 schema 直接报错，不要静默继续
4. 增加交叉测试：`batch checkpoint -> orchestrate resume`、`orchestrate state -> batch load`

## F2. `TASK` 解析规则碎片化，主流程对同一 `task_plan.md` 读取结果可能不同

- **风险等级**：HIGH
- **影响维度**：一致性 / 完整性 / 可恢复性

### 证据

- **canonical 模板**：`src/core/process-engine/init.ts:303` `skeletonTaskPlan()` 生成的是 **Markdown 表格**
- **batch executor 解析**：`src/cli/commands/batch-test.ts:63` `parseTaskPlan()` 却只接受 `- [ ] TASK-...:` 这种 **checkbox 列表**
- **commit 推断当前 TASK**：`src/cli/commands/commit.ts:62` 只找字符串 `In Progress`，正则 `/TASK-[\w-]+/`
- **catchup**：`src/core/ai-orchestrator/catchup.ts:164` 匹配 `In Progress` 或 `进行中`，正则 `/TASK-\S+/`
- **prompt assembler**：`src/core/skill-runtime/prompt-assembler.ts:137` 匹配 `in_progress` / `in progress`
- **hard gate**：`src/core/skill-runtime/hard-gate.ts:64` 接受 `in_progress / in progress / 进行中`
- **hook installer shell**：`src/core/tool-integration/hook-installer.ts:105` 用 `grep "In Progress"` 从表格取 TASK
- **状态归一化函数存在但未接线**：`src/core/ai-orchestrator/todo-runner.ts:82` `normalizeTodoStatus()`；全库实际调用仅在测试里出现

### 问题机制

当前并不存在“唯一 TASK parser”，而是多个模块各自用正则/文本扫描读取 `task_plan.md`。结果是：

- 同一个 `task_plan.md`，`hard-gate` 可能能识别当前 TASK，`commit` 却识别不到
- batch executor 使用的 parser 与初始化模板不兼容，极易直接解析出 **0 个 TASK**
- `catchup` / `prompt` / `commit hook` 对状态词支持集合不一致，导致 current task 漂移

### 根因

- 缺少统一的 `task_plan` AST/parser
- 缺少“task_plan canonical format contract”落地实现
- 已存在的状态归一化能力没有进入真实调用链

### 影响范围

- `commit` 前缀自动补全
- current task 推断
- catchup 恢复
- prompt runtime context
- batch execution / 并发调度

### 为什么现有 gate / validate / trace / runtime 没发现

- 没有任何一个 gate 会验证“所有消费者对同一 task_plan 的解析结果一致”
- 各模块测试是 **局部正确**，不是 **跨模块一致**
- `validate format` 不检查 task_plan 的可解析性一致性

### 修复建议

1. 抽出统一 `parseTaskPlan()`（返回结构化 AST），所有模块只依赖这一处
2. 将状态词统一走 `normalizeTodoStatus()`
3. 定义单一 canonical task_plan 格式；如果决定用表格，就删除 checkbox parser
4. 增加一致性测试：同一 fixture 由 `commit/catchup/prompt/hard-gate/batch-test` 共同解析，结果必须一致

## F3. `nextId()` 非原子且非幂等，并发/重试下可重复分配同一 Artifact ID

- **风险等级**：HIGH
- **影响维度**：一致性 / 健壮性 / 幂等性

### 证据

- `src/core/trace-engine/id-generator.ts:28` `nextId()` 先读 matrix，再算序号，再写 matrix
- `src/core/trace-engine/id-generator.ts:74` `findNextSeq()` 只看当前已有最大值
- `src/core/trace-engine/id-generator.ts:112` `appendToMatrix()` 直接盲追加新行
- `src/cli/commands/id.ts:41` `handleNext()` 每次调用都直接落盘，没有幂等 key

### 问题机制

这是典型 TOCTOU：

1. 调用 A / B 同时读取 matrix
2. 都看到当前最大序号为 `N`
3. 都生成 `N+1`
4. 都 append 同一 ID

即使没有并发，重复执行也不是幂等：`id next` 是“边算边写”的副作用命令，没有请求幂等键，也没有“如果相同业务动作已申请过则返回旧 ID”的机制。

### 根因

- 缺少 per-feature/per-type 的 ID allocation lock
- 缺少 allocation ledger / 幂等 key
- matrix 被直接当作“既是展示层又是分配真源”使用

### 影响范围

- `FR/DS/TASK/TC/RFC/...` 全部受影响
- 对于非 FR 类型，重复写入甚至可能完全绕过现有 SCA 检测

### 为什么现有 gate / validate / trace / runtime 没发现

- `src/core/gate-engine/sca.ts:162` 只检查 `FR/NFR` 唯一性
- `src/core/trace-engine/matrix.ts:53` `checkMatrix()` 不做重复 ID 检测
- `src/core/validators/format-validator.ts:57` 只检查连字符格式

### 修复建议

1. 将 ID 分配改为“锁 + ledger”或“锁 + compare-and-swap”
2. 把 `traceability-matrix.md` 降级为 projection，不要直接承担分配真源职责
3. 扩展唯一性检测到全部 ID 类型，不仅 FR
4. 为 `id next` 增加幂等参数（如 `--request-key`）或显式 dry-run / commit 两阶段

## F4. Feature ID 解析规则不统一，且未校验“目录名 == stage-state.featureId”

- **风险等级**：MEDIUM
- **影响维度**：一致性 / 可恢复性

### 证据

- `src/core/process-engine/feature.ts:36` `listFeatures()` 遍历目录后，输出的 `featureId` 取自 `stage-state.json` 内部字段，而不是目录名
- `src/core/process-engine/feature.ts:87` `resolveFeatureId()` 基于 `listFeatures()` 结果做 exact/prefix/env 解析
- `src/core/process-engine/feature.ts:27` `getFeatureState()` 却按 **目录路径** `specs/{featureId}/stage-state.json` 读取
- `src/cli/commands/id.ts:41` / `:99` / `:131` `id next/search/list` 又没有复用 `resolveFeatureId()`，要求调用方直接给出可访问目录的 featureId

### 问题机制

当前 Feature 实际上有至少 3 个身份来源：

1. 目录名
2. `stage-state.json.featureId`
3. `.spec-first/current`

系统没有全局 invariant 去断言三者相等。于是：

- 列表/解析可能以 `stage-state.json.featureId` 为准
- 读写状态可能以目录名为准
- 个别 CLI 又要求“可直接拼路径”的 feature 参数

一旦发生手工修复、拷贝目录、错误恢复或局部文件漂移，就可能出现“能 resolve 但读不到”或“目录正确但展示为另一个 featureId”的状态错乱。

### 为什么现有 gate / validate / trace / runtime 没发现

- 没有任何守卫校验目录名与 `stage-state.featureId`
- `id` 命令族没有统一接入 `resolveFeatureId()`
- 测试覆盖了各自 happy path，没有覆盖“目录名/状态文件内容不一致”场景

### 修复建议

1. 在 feature load/list 阶段强校验：目录名必须等于 `state.featureId`
2. 所有接受 feature 参数的 CLI 统一走 `resolveFeatureId()`
3. 对 `.spec-first/current` 增加 resolve + existence 校验，不要把原始字符串直接下沉到路径拼接
4. 增加 doctor/gate 项：`FEATURE_ID_TRIPLE_CONSISTENCY`

## F5. `retry-controller` 没有接入 auto-loop 主路径，重试/backoff/budget 保护实际上未生效

- **风险等级**：HIGH
- **影响维度**：健壮性 / 可恢复性

### 证据

- `src/core/ai-orchestrator/retry-controller.ts:123` `makeRetryDecision()` 定义了分类、budget、backoff
- `src/core/ai-orchestrator/retry-controller.ts:174` `applyRetryToState()` 定义了状态注入
- `src/core/ai-orchestrator/auto-loop.ts:97` `runAutoLoop()` 主路径没有调用上述任一函数
- 仓库内实际调用仅见测试：`tests/e2e/auto-loop-scenarios.test.ts:137`、`tests/unit/retry-controller.test.ts:172`

### 问题机制

当前运行时表面上“拥有 retry controller”，但 auto-loop 失败分支实际上只会：

- 标记 `blocked`
- 根据 `stop_on_blocked` 决定 halt 或继续

并不会：

- 执行 `makeRetryDecision`
- 写回 retry budget
- 执行 backoff
- 更新 regenerateCount / totalRetryDurationMs

因此 catchup 中展示的 retry 预算与 runtime 的真实执行策略并不闭环。

### 为什么现有 gate / validate / trace / runtime 没发现

- retry controller 的测试是孤立单测，不是主链路集成测试
- auto-loop happy path 测试通过，不代表 retry path 真接线
- gate/validate 都不检查“声明存在的 runtime 保护是否已接入主路径”

### 修复建议

1. 在 `runAutoLoop()` 的失败分支显式接入 `makeRetryDecision()`
2. 将 retry 结果写回 `TodoRunnerState.runtime.autoLoop.retry`
3. 对 `task_timeout` / `heartbeat_stalled` / executor failure 区分是否可重试
4. 增加集成测试：真实 auto-loop 触发 retry/backoff/budget 用尽路径

## F6. 审计 hash 链对并发写入不安全，且损坏行会被静默跳过

- **风险等级**：MEDIUM
- **影响维度**：完整性 / 健壮性 / 可恢复性

### 证据

- `src/core/ai-orchestrator/audit-log.ts:57` `writeAuditLog()` 先 `getLastHash()`，再 `appendJsonl()`，中间没有锁
- `src/shared/fs-utils.ts:66` `appendJsonl()` 是直接 append，不是“读最新 prevHash + 锁内追加”的事务
- `src/core/ai-orchestrator/audit-log.ts:80` `readAuditLog()` 解析失败的行会被 `catch { /* skip corrupted line */ }` 静默跳过
- `src/core/ai-orchestrator/audit-log.ts:105` `verifyAuditChain()` 仅验证“被保留下来的记录”

### 问题机制

- 并发写时，两个 writer 可能拿到相同 `prevHash`，造成链分叉
- 如果文件中有损坏行，`readAuditLog()` 会直接丢弃，`verifyAuditChain()` 可能在“删掉坏行后的剩余链”上继续返回 valid，形成 **假阳性**

### 为什么现有 gate / validate / trace / runtime 没发现

- tests 只覆盖顺序写入：`tests/unit/audit-log.test.ts:32`
- 没有并发 audit 写测试，也没有损坏行测试
- runtime 不会在关键路径自动调用 `verifyAuditChain()` 阻断后续行为

### 修复建议

1. 为 audit log 增加 per-feature file lock
2. `readAuditLog()` 不要静默吞损坏行，至少要返回 `corruptedLineCount`
3. `verifyAuditChain()` 遇到损坏行必须失败，而不是基于过滤后的记录继续验证
4. 将 audit chain 校验接入 doctor / catchup / orchestrate resume 前置检查

---

## 5. 文档与运行时偏差（观察项）

## O1. 文档承诺“orchestrate 的 featureId 会继承到子 skill”，但运行时没看到强绑定

- **风险等级**：LOW-MEDIUM
- **证据**：
  - 文档：`/Users/kuang/.codex/skills/spec-first/orchestrate/references/skill-mapping.md:81`
  - 运行时：`src/core/skill-runtime/dispatcher.ts:188`、`src/core/skill-runtime/prompt-assembler.ts:154`

### 判断

当前实现更像“依赖 `.spec-first/current` 的隐式上下文”，不是“由 orchestrate 调用参数强绑定传播”。这会在多 feature 并行、人工切换 current、工作树切换时放大上下文漂移风险。

### 建议

- 如果文档要保留该承诺，运行时必须把 `featureId` 作为显式上下文参数向下传递
- 否则文档应降级表述为“默认读取当前 Feature 指针”

---

## 6. 总体结论

### 6.1 总体评级

- **Feature ID 主链**：中等可靠
- **Artifact ID 主链**：局部可靠、全链路不可靠
- **恢复链**：存在结构性断点
- **幂等性**：`init` 较好；`nextId` / audit / task parser 链较弱

### 6.2 最需要优先修复的 3 个问题

1. **F1：拆分 `todo-state.json` 的双 schema 冲突**
2. **F2：统一 `task_plan.md` parser，消灭多套 TASK 解析规则**
3. **F3：为 `nextId` 增加原子分配与全类型唯一性校验**

### 6.3 关于用户重点关心的“死循环 / 无限重试 / 自旋 / 卡死”

- **未发现** 当前主循环存在真正无上限的无限 retry / 无限自旋；`auto-loop` 受 `maxIterations` 保护：`src/core/ai-orchestrator/auto-loop.ts:97`、`src/core/ai-orchestrator/todo-runner.ts:207`
- **但发现**：
  - retry controller 没接入主路径（F5）
  - todo-state schema collision 会让恢复与 watchdog 语义失真（F1）
  - task/currentTask 解析碎片化会制造“看起来能恢复，实际上恢复错对象”的假恢复（F2）

### 6.4 建议的修复顺序

1. 状态文件命名与 schema 收敛（F1）
2. task_plan 统一 parser + parser contract tests（F2）
3. ID allocator 原子化 + duplicate guard 扩展到全部类型（F3）
4. feature triple-consistency guard（F4）
5. retry 接线 + audit lock（F5/F6）

---

## 7. 附：本次审计涉及的关键代码入口

- Feature ID 生成：`src/core/process-engine/init.ts:79`
- Feature 恢复：`src/core/process-engine/init.ts:561`
- Feature 解析：`src/core/process-engine/feature.ts:87`
- Artifact ID 生成：`src/core/trace-engine/id-generator.ts:28`
- Matrix 校验：`src/core/trace-engine/matrix.ts:53`
- Gate 汇总：`src/core/gate-engine/gate-evaluator.ts:324`
- Todo 状态：`src/core/ai-orchestrator/todo-runner.ts:52`
- Auto-loop：`src/core/ai-orchestrator/auto-loop.ts:97`
- Retry 控制：`src/core/ai-orchestrator/retry-controller.ts:123`
- Watchdog：`src/core/ai-orchestrator/watchdog.ts:82`
- Catchup：`src/core/ai-orchestrator/catchup.ts:65`
- Prompt assembly：`src/core/skill-runtime/prompt-assembler.ts:154`
- Dispatcher：`src/core/skill-runtime/dispatcher.ts:218`
- Audit log：`src/core/ai-orchestrator/audit-log.ts:57`

