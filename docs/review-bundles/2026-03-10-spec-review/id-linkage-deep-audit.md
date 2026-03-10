# spec-first 项目深度代码审计报告：产物 ID 链路一致性

- 审计日期：2026-03-10
- 审计范围：以运行时代码为准，围绕 `ID 生成 → 传播 → 校验 → 持久化 → 恢复`
- 审计重点：`init/spec/design/task/orchestrate/trace/matrix/stage/advance/retry/watchdog/dispatcher`
- 审计方法：先建模，再验证，再给结论；README 不作为判据，文档只用于识别“文档/代码分裂”

## 一、审计计划

### Step 1：建立代码入口清单
- ID 生成入口：`src/core/process-engine/init.ts:55`、`src/core/trace-engine/id-generator.ts:23`
- ID 校验入口：`src/core/trace-engine/id-validator.ts:7`
- ID 解析/矩阵入口：`src/core/trace-engine/matrix.ts:44`
- 覆盖率/门禁入口：`src/core/trace-engine/coverage.ts:15`、`src/core/gate-engine/gate-evaluator.ts:1`
- 编排与恢复入口：`src/cli/commands/orchestrate.ts:1`、`src/core/ai-orchestrator/auto-loop.ts:99`、`src/core/ai-orchestrator/todo-runner.ts:179`
- 阶段推进入口：`src/core/process-engine/advance.ts:107`

### Step 2：建立 ID 生命周期地图
- 先区分 `Feature ID`、`矩阵行 ID`、`编排任务 ID` 三类标识
- 再逐个映射其生成、传播、校验、持久化、恢复锚点

### Step 3：审计主流程
- `init → spec → design → task → code/verify → stage advance`
- 核查每个阶段产物与下一阶段消费规则是否一致

### Step 4：审计异常路径与边界场景
- `trace fix`
- `orchestrate --auto / retry / watchdog / auto-advance`
- 重复执行、恢复执行、并发执行、状态文件损坏/漂移

### Step 5：输出问题清单
- 每个问题给出：现象、证据、根因、影响范围、风险等级、修复建议
- 同时解释：为什么现有 `gate / validate / trace / runtime` 没能发现或阻断它

## 二、ID 生命周期地图

## 2.1 Feature ID（Feature 主键）

### 规则源头
- 生成规则：`FSREQ-YYYYMMDD-FEAT-NNN`，见 `src/core/process-engine/init.ts:80`
- FEAT 唯一性注册：`.feat-registry.md` + `.feat-registry.lock`，见 `src/core/process-engine/init.ts:95`、`src/core/process-engine/init.ts:126`

### 生命周期
1. **生成**：`generateFeatureId()` 扫描 `specs/` 目录后生成新序号，`src/core/process-engine/init.ts:57`
2. **传播**：写入目录名、`stage-state.json`、`.spec-first/current`，见 `src/core/process-engine/init.ts:624`、`src/core/process-engine/init.ts:663`
3. **校验**：`feature.ts` 在列举 Feature 时会比对目录名与 `stage-state.featureId`，见 `src/core/process-engine/feature.ts:14`
4. **持久化**：`specs/<featureId>/` 目录、`stage-state.json`、`.feat-registry.md`
5. **恢复**：`init` 通过临时目录 + 注册表锁 + current 快照回滚，见 `src/core/process-engine/init.ts:635`

### 审计结论
- `Feature ID` 这一层是当前项目里最稳的一层：有锁、有临时目录、有回滚。
- 但后续 `stage-state` 的读取 guard 过弱，会削弱它的恢复可信度，详见问题 F-06。

## 2.2 矩阵行 ID（FR/DS/TASK/TC/REQ…）

### 规则源头
- `id-validator` 只承认：`Feature/FR/DS/TASK/REQ/SYS/ARCH/MOD/ATP/STP/ITP/UTP/TC(level)/RFC`，见 `src/core/trace-engine/id-validator.ts:8`
- `TC` 只能是 `TC-(UT|IT|E2E|ST)-<ABBR>-NNN`，见 `src/core/trace-engine/id-validator.ts:21`
- 运行时不存在 `AC` 类型，`src/shared/types.ts:22`

### 生命周期
1. **生成**：`nextId()` 在 `.matrix.lock` 下扫描矩阵已有 ID 生成下一号，见 `src/core/trace-engine/id-generator.ts:23`
2. **传播**：写入 `traceability-matrix.md`，下游由 `matrix.ts / coverage.ts / gate-evaluator.ts` 解析消费
3. **校验**：`validateId()` 只做正则匹配；`parseMatrixContent()` 不拒绝非法 ID，而是回退成 `Feature`，见 `src/core/trace-engine/matrix.ts:153`
4. **持久化**：`specs/<featureId>/traceability-matrix.md`
5. **恢复**：无真正恢复机制；只靠重新解析 matrix。若写入非法 ID，会被静默降级。

### 审计结论
- 这一层是全链路最薄弱的点：**规则源分裂**、**校验不闭环**、**非法值会静默混入**。

## 2.3 编排任务 ID（todo-state / auto-loop）

### 规则源头
- `TodoItem.id` 只是字符串，没有绑定 trace ID 类型体系，见 `src/core/ai-orchestrator/todo-runner.ts:15`

### 生命周期
1. **生成**：由任务拆解或恢复逻辑生成（不受 `validateId()` 约束）
2. **传播**：`todo-state.json` → `auto-loop` → `audit-log`
3. **校验**：只校验 schema，不校验与矩阵 ID 的映射关系，见 `src/core/ai-orchestrator/todo-runner.ts:56`
4. **持久化**：`todo-state.json`
5. **恢复**：`loadTodoState()` 读取；`saveTodoState()` 原子 rename 防止半写，但无并发锁，见 `src/core/ai-orchestrator/todo-runner.ts:204`

### 审计结论
- 编排任务 ID 与矩阵 trace ID 没有硬绑定，恢复时只能保证“文件不坏”，不能保证“语义不漂移”。

## 2.4 first runtime 产物链路

### 事实
- `.spec-first/runtime/first/*.json` 才是真源；`docs/first/*` 只是投影视图，见 `src/core/skill-runtime/first-doc-projection.ts:369`
- `first` 这条链路本身并不使用统一的 trace ID 体系，而是以文件路径和 runtime asset path 作为锚点，见 `src/core/skill-runtime/first-artifact-mapping.ts:13`

### 审计结论
- `first` 运行时的“文档链路/运行时链路”分层是清晰的；问题不在这里。
- 本次 ID 链路主风险，集中在 `specs/<featureId>/traceability-matrix.md` 与 `todo-state.json/stage-state.json`。

## 三、主流程审计

## 3.1 init：Feature ID 生成与初始持久化

### 观察
- `init` 有注册表锁和临时目录提交：`src/core/process-engine/init.ts:126`、`src/core/process-engine/init.ts:635`
- 初始 matrix 仅写表头，不生成任何 trace 行：`src/core/process-engine/init.ts:628`

### 结论
- `init` 本身具备较好的幂等性与可恢复性。
- 问题不是出在 Feature ID 生成，而是出在后续 skill 阶段对 matrix ID 规则的理解分裂。

## 3.2 spec：规则源开始分裂

### 运行时代码事实
- 运行时 ID 引擎不承认 `AC-*`，也不承认无 level 的 `TC-*`，见 `src/core/trace-engine/id-validator.ts:8`

### spec skill 事实
- `spec` skill 明确要求写 `AC-<ABBR>-<FRSEQ>-<NN>`，见 `skills/spec-first/03-spec/SKILL.md:174`
- 同一个 skill 又要求 PRD upstream 使用 `REQ`，禁止 `REQ-PRD`，见 `skills/spec-first/03-spec/SKILL.md:101`
- `id-types-and-status.md` 也明确说“不存在 `REQ-PRD` 类型”，见 `skills/spec-first/03-spec/references/id-types-and-status.md:20`
- `id-types-and-status.md` 声称 matrix 状态是 `Planned/InProgress/Completed/Verified/Blocked`，见 `skills/spec-first/03-spec/references/id-types-and-status.md:24`

### 与 runtime 冲突点
- runtime matrix 状态只承认 `Planned/Implemented/Verified/Accepted/Deferred/Cancelled/Exception`，见 `src/core/trace-engine/matrix.ts:11`
- runtime `checkMatrix()` 却反过来硬编码 `REQ-PRD-*` 才算 FR 的合法上游，见 `src/core/trace-engine/matrix.ts:72`

### 结论
- `spec` 阶段就是规则分裂的源头之一：**ID 类型、上游命名、状态枚举**三处都与 runtime 不一致。

## 3.3 matrix / coverage / gate：消费侧继续放大偏差

### 观察
- `parseMatrixContent()` 对非法 ID 不报错，直接 `validation.type ?? 'Feature'`，见 `src/core/trace-engine/matrix.ts:159`
- `parseRefList()` 对 upstream/downstream 引用不做任何 ID 合法性检查，见 `src/core/trace-engine/matrix.ts:179`
- `C5 Test Coverage (AC)` 实际与 `C4` 完全相同，仍旧只按 FR→TC 计算，见 `src/core/trace-engine/coverage.ts:80`
- CLI 和文档却持续把 C5 当作 AC 覆盖率展示，见 `src/cli/commands/metrics.ts:17`

### 结论
- 消费链没有把源头偏差拦下来，而是把它“吞掉”后继续运行，最终形成“系统能跑，但结论不可信”。

## 3.4 stage advance：推进逻辑依赖了脆弱状态文件

### 观察
- `advance()` 读取 `stage-state.json` 时仅使用 `isStageState()`，而该 guard 只检查 `currentStage` 是字符串，见 `src/shared/validators.ts:11`
- `advance()` 的 `loadState()` 并不校验 `stage-state.featureId` 是否与路径中的 featureId 一致，见 `src/core/process-engine/advance.ts:57`
- `saveState()` 无文件锁，仅普通写回，见 `src/core/process-engine/advance.ts:99`

### 结论
- 阶段推进依赖的恢复锚点不够强；一旦 `stage-state.json` 半逻辑损坏或被并发覆盖，推进链路可能继续运行但绑定错 feature 语义。

## 四、异常路径与边界场景审计

## 4.1 trace fix：修复逻辑会把非 ID 数据写进 ID 链

### 代码事实
- `trace fix` 发现 TASK 没有 downstream 时，会写入 `src/core/**/<task-id>.ts` 这种文件路径占位符，见 `src/cli/commands/trace.ts:51`

### 结论
- downstream 列原本承载的是“引用关系”，修复器却注入文件路径文本，属于**链路语义污染**。
- 因为 `parseRefList()` 不校验引用是否为合法 ID，这种污染不会被及时发现。

## 4.2 retry / watchdog：有“退避决策”，没有真正退避

### 代码事实
- `retry-controller` 计算了 `backoffMs`，见 `src/core/ai-orchestrator/retry-controller.ts:161`
- `auto-loop` 在失败后仅记录 `retry scheduled (xxxms)` 并把任务改回 `pending`，随后直接 `continue`，没有 `sleep/await`，见 `src/core/ai-orchestrator/auto-loop.ts:199`
- `pickReadyTodos()` 会立即再次捞起 `pending` 且依赖满足的任务，见 `src/core/ai-orchestrator/todo-runner.ts:243`

### 结论
- 这里存在**伪退避**：日志声称已退避，实际没有等待。
- 在临时错误持续发生时，系统会快速自旋到 `maxIterations` 或 `retry_budget_exhausted`。
- watchdog 也抓不住这种情况，因为它只在 executor 返回后检查超时/心跳，见 `src/core/ai-orchestrator/auto-loop.ts:143`。

## 4.3 todo-state 并发恢复：原子写，非串行写

### 代码事实
- `saveTodoState()` 采用 tmp + rename，能防文件损坏，见 `src/core/ai-orchestrator/todo-runner.ts:204`
- 但全链路没有为 `todo-state.json` 加锁；仓库唯一显式文件锁只用在 `.feat-registry` 和 `.matrix.lock`，见 `src/core/process-engine/init.ts:126`、`src/core/trace-engine/id-generator.ts:23`

### 结论
- 同一个 feature 若并发启动两个 orchestrate / auto-loop，会出现最后写入者覆盖前者状态的风险。
- 这会造成任务状态漂移、重复执行、阻塞原因丢失、恢复点错乱。

## 4.4 stage advance 并发：读改写无 CAS

### 代码事实
- `advance()` 是典型 read-modify-write，但没有锁/CAS/version 检查，见 `src/core/process-engine/advance.ts:57`、`src/core/process-engine/advance.ts:99`

### 结论
- 并发 `stage advance` 会出现：重复 gate、history 丢项/覆盖、日志与状态脱节。
- 这不是“文件损坏”，而是“状态语义竞争”。

## 五、真实样本验证

## 5.1 样本 A：`FSREQ-20260310-HOMEPERF-001`

### 样本事实
- matrix 中存在 `AC-*` 行与无 level 的 `TC-*` 引用，见 `specs/FSREQ-20260310-HOMEPERF-001/traceability-matrix.md:8`
- spec 也按 `AC-*` 书写验收标准，见 `specs/FSREQ-20260310-HOMEPERF-001/spec.md:14`
- FR upstream 使用 `REQ-PERF-*`，见 `specs/FSREQ-20260310-HOMEPERF-001/traceability-matrix.md:3`

### 运行验证
- `node dist/cli/index.js id validate AC-HOMEPERF-001-01` → `无效：未知 ID 格式`
- `node dist/cli/index.js id validate TC-HOMEPERF-001` → `无效：未知 ID 格式`
- `node dist/cli/index.js validate matrix FSREQ-20260310-HOMEPERF-001` → 所有 FR 都被报 `missing REQ-PRD-*, TASK, TC mapping`
- `node dist/cli/index.js trace validate FSREQ-20260310-HOMEPERF-001` → `C3=0.0%, C8=100.0%`

### 说明
- 这不是单个 feature 填错，而是运行时规则与产物生成规则已经脱钩。

## 5.2 样本 B：`FSREQ-20260309-HOMEPAGE-001`

### 样本事实
- FR 上游使用 `REQ-PRD-*`，见 `specs/FSREQ-20260309-HOMEPAGE-001/traceability-matrix.md:12`
- 但 TC 仍然写成无 level 的 `TC-VIS-001`，见 `specs/FSREQ-20260309-HOMEPAGE-001/traceability-matrix.md:24`

### 运行验证
- `node dist/cli/index.js id validate TC-VIS-001` → `无效：未知 ID 格式`
- `node dist/cli/index.js validate matrix FSREQ-20260309-HOMEPAGE-001` → 4 个 FR 全部 `missing TC mapping`

### 说明
- 即使 REQ 上游满足 `REQ-PRD-*`，只要 TC 格式与 runtime 不一致，链路仍断。

## 六、问题清单

## F-01 规则源分裂：spec skill 产物规范与 runtime ID 引擎不一致
- 风险等级：**CRITICAL**
- 维度：一致性 / 完整性 / 可恢复性
- 现象：`spec` 阶段鼓励生成 `AC-*`、无 level 的 `TC-*`、`REQ` upstream；runtime 只认 `TC-<LEVEL>-...`，且 `checkMatrix` 反过来要求 `REQ-PRD-*`
- 证据：`skills/spec-first/03-spec/SKILL.md:101`、`skills/spec-first/03-spec/SKILL.md:174`、`skills/spec-first/03-spec/references/id-types-and-status.md:20`、`src/core/trace-engine/id-validator.ts:8`、`src/core/trace-engine/matrix.ts:72`
- 根因：没有单一 ID 契约源；skill prompt、引用文档、runtime parser、gate checker 分别维护各自规则
- 影响范围：`spec → matrix → validate → metrics → verify → stage advance`
- 为什么现有 gate/validate/trace 没发现：它们本身就建立在分裂规则上，彼此互相放大偏差
- 修复建议：
  1. 建立单一 `id-contract.ts/json-schema`，由 skill 文档和 runtime 共享生成
  2. 明确是否正式支持 `AC`；若支持，则把 `AC` 纳入 `IdType`、validator、matrix、coverage、gate
  3. 统一 `REQ` 与 `REQ-PRD-*` 约定，不能再一处禁止、一处强依赖
  4. 统一 TC 规范；要么强制所有样本迁移到 `TC-<LEVEL>-...`，要么 runtime 同步兼容旧格式并出迁移告警

## F-02 非法 ID 被静默降级为 `Feature`，导致断链/漏链被吞掉
- 风险等级：**CRITICAL**
- 维度：完整性 / 健壮性 / 可恢复性
- 现象：matrix 中非法 ID 不报错，而是被当作 `Feature` 类型继续进入下游
- 证据：`src/core/trace-engine/matrix.ts:153`
- 根因：`parseMatrixContent()` 只调用 `validateId()`，但对 `!valid` 不抛错，直接 `validation.type ?? 'Feature'`
- 影响范围：所有基于 `parseMatrix()` 的能力：`checkMatrix/getCoverage/gate/trace`
- 为什么现有 gate/validate/trace 没发现：
  - `checkMatrix()` 只按 type 做链路判断，不单独报告非法 ID
  - `coverage()` 只统计被识别为 FR/DS/TASK/TC 的行，非法行直接消失
  - `trace validate` 只看 C3/C8，更看不到非法 AC/TC 行
- 修复建议：
  1. `parseMatrixContent()` 对非法 ID 直接抛错，或至少记录 `invalidRows`
  2. `MatrixCheckResult` 增加 `invalidIds/invalidRefs`
  3. gate / validate / trace 把 `invalidIds > 0` 视为阻断项

## F-03 引用字段无校验，`trace fix` 会把文件路径写进链路字段
- 风险等级：**HIGH**
- 维度：完整性 / 健壮性 / 幂等性
- 现象：downstream/upstream 列允许任意字符串；`trace fix` 用文件路径伪造 downstream
- 证据：`src/core/trace-engine/matrix.ts:179`、`src/cli/commands/trace.ts:51`
- 根因：矩阵引用列缺少“只允许合法 ID / 合法路径类型”的 schema；修复器把“实现文件路径”与“trace 引用”混成同一列
- 影响范围：`trace fix`、任何依赖 downstream/upstream 的 lineage 计算
- 为什么现有 gate/validate/trace 没发现：`parseRefList()` 只是 split 字符串，没有 ref type 校验
- 修复建议：
  1. 将 `upstream/downstream` 限定为 trace ID 列，代码文件路径另开列或另建 artifact map
  2. `trace fix` 禁止写占位路径；只能补合法 ID，补不了就报错
  3. 新增 `validate refs`：逐个检查引用是否存在、是否类型允许

## F-04 `validate format` 既漏报真问题，又误报重复 ID
- 风险等级：**HIGH**
- 维度：健壮性 / 可恢复性
- 现象：
  - 对非法 `AC-*`/简化 `TC-*` 基本不报
  - 会把正常被引用的 FR 当成“重复 ID”
- 证据：`src/core/validators/format-validator.ts:59`
- 运行验证：`node dist/cli/index.js validate format FSREQ-20260310-HOMEPERF-001` 报 `重复 ID：FR-HOMEPERF-001...005`，但这些 FR 在 ID 列只出现一次，真正重复是引用列命中
- 根因：重复检测正则扫描整个 Markdown 表格所有单元格，而不是仅第一列 ID 列
- 影响范围：`validate format`、`spec` 阶段 Step 8、自助修复决策
- 为什么现有 gate/validate/trace 没发现：validate 本身就是误报源；误报掩盖了真正的 ID 合法性问题
- 修复建议：
  1. 重复检测改为基于 `parseMarkdownTable()` 的第一列
  2. 对非法 ID 单独列出，不得 `continue`
  3. 把状态枚举也接入 format validator，别只检查连字符

## F-05 C5 名称是“AC 覆盖率”，实现却仍是 FR 覆盖率
- 风险等级：**HIGH**
- 维度：一致性 / 完整性
- 现象：CLI/skill/docs 都把 C5 解释为 AC coverage，但实现与 C4 完全同值
- 证据：`src/cli/commands/metrics.ts:17`、`src/core/trace-engine/coverage.ts:80`
- 根因：runtime 类型系统没有 `AC`，所以根本没有 AC 级对象可计算；但指标命名和 gate 叙事已经前置承诺了 AC 级验证
- 影响范围：`metrics/status/verify/gate 文档承诺`
- 为什么现有 gate/validate/trace 没发现：系统把“未实现的 AC 模型”伪装成“已实现的 C5 指标”
- 修复建议：
  1. 如果短期不支持 AC：把 C5 文案改成“预留 / 暂未实现”，不要继续作为验收口径
  2. 如果要支持 AC：将 AC 正式建模进 matrix/types/validator/coverage/gate
  3. 增加单测：当只有 FR→TC 而没有 AC→TC 时，C4 与 C5 必须不同

## F-06 `stage-state` 恢复校验过弱，且 `advance` 无并发保护
- 风险等级：**HIGH**
- 维度：可恢复性 / 健壮性 / 幂等性
- 现象：`stage-state.json` 只要有 `currentStage` 字符串就被视为合法；`advance` 无锁读改写
- 证据：`src/shared/validators.ts:11`、`src/core/process-engine/advance.ts:57`、`src/core/process-engine/advance.ts:99`
- 根因：状态文件只做“最小 shape 检查”，没有 featureId/path 一致性、history 数组结构、版本号或 CAS 保护
- 影响范围：`gate/orchestrate/stage advance/恢复执行`
- 为什么现有 gate/validate/trace/runtime 没发现：所有这些模块都默认 `stage-state` 是真源，但没有足够强的 guard
- 修复建议：
  1. 强化 `isStageState()`：校验 `featureId/currentStage/history/createdAt/updatedAt/terminal`
  2. `advance()` 读取后校验 `state.featureId === featureId`
  3. 为 `stage-state` 加锁或 CAS/version 字段，避免并发推进覆盖

## F-07 auto-loop 伪退避 + 无锁 todo-state，存在自旋和状态漂移风险
- 风险等级：**HIGH**
- 维度：健壮性 / 幂等性 / 可恢复性
- 现象：
  - 失败任务被记录为“已安排 backoff”，但没有真正等待
  - `todo-state.json` 虽原子写，但没有互斥锁
- 证据：`src/core/ai-orchestrator/retry-controller.ts:161`、`src/core/ai-orchestrator/auto-loop.ts:199`、`src/core/ai-orchestrator/todo-runner.ts:204`
- 根因：把“逻辑 backoff”当成“执行 backoff”；只解决文件损坏，没有解决并发状态覆盖
- 影响范围：`orchestrate --auto`、`retry`、`watchdog`、恢复执行
- 为什么现有 watchdog/runtime 没发现：
  - watchdog 只监控执行期超时，不监控“快速失败-快速重试”自旋
  - retry budget 只是账面累计，没有物理等待
- 修复建议：
  1. 引入真实 `await sleep(backoffMs)` 或 `nextRetryAt` 字段，并在 `pickReadyTodos()` 过滤未到时任务
  2. 为 `todo-state.json` 引入 feature 级锁
  3. 把连续相同失败 fingerprint 接入 blocked 判定，避免空转到 `maxIterations`

## F-08 文档链路与运行时代码多处不一致，误导人工修复路径
- 风险等级：**MEDIUM**
- 维度：一致性 / 可恢复性
- 现象：
  - 文档说 `matrix update` 需要 `--yes`，CLI 实现并无该参数
  - 文档状态值 `InProgress/Completed/Blocked` 与 runtime 状态值 `Implemented/Accepted/...` 不同
- 证据：`skills/spec-first/03-spec/references/id-types-and-status.md:24`、`src/cli/commands/matrix.ts:69`、`src/core/trace-engine/matrix.ts:11`
- 根因：文档契约未由 runtime 自动导出，长期漂移
- 影响范围：人工修复、skill 执行、模型提示词
- 为什么现有 gate/validate/trace/runtime 没发现：文档不参与自动一致性校验
- 修复建议：
  1. 将 CLI/状态枚举从 runtime 源码自动生成到 references 文档
  2. 对 skill references 建立 snapshot 测试，防止再次分裂

## 七、为什么现有 gate / validate / trace / runtime 没能及时发现这些问题

### 1. gate 站在错误前提上
- `checkMatrix()` 自己硬编码 `REQ-PRD-*`，与 spec skill 的 `REQ` 规则冲突，见 `src/core/trace-engine/matrix.ts:72`
- 所以 gate 不是“纠错器”，而是“另一套规则执行器”

### 2. validate 既不严格，也不准确
- 它不把非法 ID 当阻断项
- 它会误把引用列中的合法 ID 当重复项，见 `src/core/validators/format-validator.ts:78`

### 3. trace 只看 C3/C8，且修复器会写错数据
- `trace validate` 只看两个指标，见 `src/cli/commands/trace.ts:82`
- `trace fix` 甚至会往链路列写入路径字符串，见 `src/cli/commands/trace.ts:53`

### 4. runtime parser 采用“吞错继续跑”策略
- `parseMatrixContent()` 把非法 ID 降级为 `Feature`，见 `src/core/trace-engine/matrix.ts:160`
- 这让系统偏向“继续运行”，而不是“及早失败”

### 5. 恢复逻辑只防文件坏，不防语义漂移
- `todo-state` 防半写，不防并发覆盖
- `stage-state` 防 JSON 语法错，不防 feature 语义错

## 八、总体风险评估

- 总体结论：**当前项目的产物 ID 链路不可靠，问题已不是“个别 feature 数据脏”，而是“规则源与消费链整体分裂”**。
- 最危险的组合：
  1. `spec skill` 继续生成 `AC-*` / 简化 `TC-*`
  2. `matrix parser` 静默吞错
  3. `validate/gate` 给出误导性结果
  4. `orchestrate/retry` 在错误状态上继续自旋
- 风险等级：**CRITICAL**

## 九、修复优先级建议

### P0（必须先做）
1. 建立单一 ID 契约源：统一 `IdType / MatrixStatus / 引用规则`
2. `parseMatrixContent()` 改为 fail-fast，不再把非法 ID 降级为 `Feature`
3. 停止 `trace fix` 向 trace 列写文件路径
4. 实现真实 backoff + todo-state 锁

### P1（紧随其后）
5. 把 AC 正式建模，或删除所有 runtime/文档中对 C5=AC coverage 的正式承诺
6. 强化 `stage-state` guard 与 `advance` 并发保护
7. 重写 `validate format` 的 ID/重复检测逻辑

### P2（收口治理）
8. 从 runtime 自动生成 skill references，消灭 `REQ/REQ-PRD`、状态枚举、CLI 参数漂移
9. 为真实样本仓库补迁移脚本：批量修复 `AC-*` / `TC-*` / matrix 引用格式

## 十、建议的最小修复顺序

1. 先冻结 ID 契约（代码单源）
2. 再修 parser/validator（让错误显性化）
3. 再修样本与 skill 模板（让生成侧回到统一规则）
4. 最后修 orchestrate 恢复/重试（避免在脏数据上继续自旋）

