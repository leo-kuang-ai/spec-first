# Phase 1：文档质量 & 架构设计评审

> 评审日期：2026-03-16 | 目标：13-项目认知 First Skill 项目认知编译器

---

## Phase 1A：文档质量分析

### 🔴 Critical（3 项）

#### C-01 · Project Cognition Gate 判定规则存在根本性歧义
- **位置**：文档1 § Writeback 闭环 + 文档2 T14/T15/T16
- **问题**：
  1. `must_update`（稳定API契约变化）与 `must_not_update`（临时workaround）存在逻辑重叠，无冲突时的优先级裁决机制
  2. "最小证据门槛"中的"重复性"未定义度量标准（同Feature内？跨Feature？几个Sprint？）
- **影响**：T15 实现者将自行解释，产生行为不一致
- **建议**：
  1. 增加优先级排序：`must_not_update > must_update > should_update`，冲突时降级为 `needs_decision`
  2. 定义"重复性"：同一逻辑在 ≥2 个不同 Feature 中独立出现
  3. T14 验收标准中加入边界案例测试（如 API 紧急 workaround）

#### C-02 · 任务拆解遗漏关键设计点：Context Slice 生成机制
- **位置**：文档1 § 四层输出架构（Context Slices）vs 文档2 T01-T20
- **问题**：Context Slices 是四层架构的第三层、七大缺口之一，但 20 个任务中**无一任务直接负责实现 Context Slice 的生成逻辑**（按Stage/Role/TaskType 裁切算法、Slice Schema、缓存/失效策略）
- **影响**：Phase 1 完成后该层能力空白，架构失去重要一层
- **建议**：新增 T10.5（或拆分T10）——Context Slice 生成器（1.5d，P1）
  ```
  输入：stage-state.json + role 参数 + task-type 参数
  输出：context-slice.json（裁切后的上下文包）
  验收：stage=04_implement + role=developer 生成的 slice 不包含 PRD 全文
  ```

#### C-03 · `canonical truth` 与 `runtime truth` 概念边界未定义
- **位置**：文档1 § 核心原则 + § Writeback 闭环
- **问题**：文档用 `runtime truth first` 描述原则，又用 `写回 canonical truth` 描述 Writeback，但两者关系从未被明确定义，产生两种截然不同的架构解读：
  - 解读A：canonical truth = runtime truth（JSON 文件），docs 是投影
  - 解读B：canonical truth 是独立知识层，runtime truth 是执行时状态
- **影响**：T13-T17 的实现架构因解读不同而完全不同
- **建议**：在文档1开头增加术语表，明确三个核心概念的定义与关系

---

### 🟠 High（5 项）

#### H-01 · 消费契约分级与任务 Input 定义不对等
- **位置**：文档1 § 消费契约分级 vs 文档2 各任务
- **问题**：文档1定义了 required/optional/fallback 三级，文档2各任务 Input 混用"必须有"/"若存在"，未引用分级体系，未说明缺失时的降级行为
- **建议**：文档2每个任务的 Input 字段统一标注消费级别

#### H-02 · 关键路径遗漏多条强依赖
- **位置**：文档2 § 关键路径
- **问题**：已标关键路径 `T01→T04→T10→T11→T12→T14→T15→T16→T17` 遗漏：
  - T13 强依赖 T07（cognition diff analyzer 需要 change-map schema）
  - T11 强依赖 T05（skill consumption 需要 conventions schema）
  - T16 强依赖 T02（writeback 目标路径依赖双轨收敛结论）
- **建议**：补充修正关键路径：`T01→T02→T04→T05→T07→T10→T11→T12→T13→T14→T15→T16→T17`

#### H-03 · 工作量估算系统性偏乐观
- **位置**：文档2 § 各任务工作量
- **问题**：总计 24d 明显偏低，重估后应为 30-34d（含 20% 集成风险缓冲）
  | 任务 | 文档估算 | 评审判断 |
  |------|---------|---------|
  | T04 FirstSteering Schema | 0.5d | 1-1.5d |
  | T13 Cognition Diff Analyzer | 1d | 2-3d |
  | T15 Gate Engine 实现 | 1.5d | 2.5d |
  | T17 Projection Auto-refresh | 1d | 1.5-2d |
- **建议**：增加风险缓冲系数，T13 建议拆分为 T13a + T13b

#### H-04 · 缺少回滚策略与数据损坏恢复机制
- **位置**：文档1/文档2 均缺失
- **问题**：Writeback 将自动修改 canonical truth，但无说明：写入失败如何回滚、Gate 误判如何撤销、多 Feature 并发 Writeback 的冲突决策
- **建议**：增加"数据安全约束"章节，规定原子写入、快照机制、并发策略

#### H-05 · 20 个任务无合规 TASK ID，追溯链断裂
- **位置**：文档2 T01-T20 全部任务
- **问题**：使用 `T01-T20` 格式，不符合 Spec-First `TASK-{FEAT}-{NNN}` 规范，导致 C6（TASK已实现）、C8（TASK有上游）覆盖率无法计算，Gate 追溯校验将失败
- **建议**：执行 `spec-first id generate TASK --feature COGCOMP` 生成合规 ID，并为每个 TASK 标注上游 FR ID

---

### 🟡 Medium（5 项）

| ID | 问题 | 建议 |
|----|------|------|
| M-01 | `FirstSteering` 接口缺少版本控制字段（schemaVersion/generatedAt/derivedFrom） | 补充完整 interface 定义 |
| M-02 | 存量项目迁移路径无明确指导（旧 first.json 字段如何映射到新四层架构） | 在 T01/T02 补充迁移矩阵 |
| M-03 | 多 Agent 并行写回冲突处理不足（两个 Feature 同时 wrap_up） | T16 增加并发测试用例，规定字段级 merge + conflict log 策略 |
| M-04 | 缺"非目标"章节，范围边界不清（first 是否替代 Gate？是否支持非 TS 项目？） | 增加明确的 Non-Goals 章节 |
| M-05 | onboarding/orchestrate skill 升级任务缺失于 T11/T12 | 补充两个 skill 的改造任务或明确降级到 Phase 3 |

### 🟢 Low（4 项）

| ID | 问题 |
|----|------|
| L-01 | 缺成功指标（KPI）定义（如：上下文加载时间减少 X%） |
| L-02 | TASK 上游 FR ID 缺失，C8 覆盖率为 0% |
| L-03 | stage-views（Project Facts 第4项）与 Context Slices（第三层）区别不清 |
| L-04 | T18-T20 的 P2/P3 内部顺序未说明 |

---

## Phase 1B：架构设计评审

### 🔴 Critical（2 项）

#### A-C01 · entry-guide / change-map / reboot-guide 三者职责严重重叠
- **位置**：新增 6 个 Runtime Schema 定义
- **问题**：三者本质回答同一问题——"面对某类任务，从哪里开始、读什么、改什么"，区别仅在切面（变更类型 vs 任务类别 vs 冷启动状态）
  - 三份 JSON 独立维护，任何项目结构变更必须同步三处，极易产生不一致漂移
  - 11 个 Skill 消费时需要交叉引用，增加 context-resolver 的 fan-out 复杂度
- **建议**：合并为单一 `orientation.json`，以 `taskCategory` 为主键，内嵌冷启动和变更维度
  ```ts
  interface FirstOrientation {
    coldStart: { whereToStart, currentCriticalAreas, verifyChecklist }
    taskGuides: Array<{ taskCategory, changeType, readFirst, thenRead,
                        avoidEntry, likelyModules, likelyTests, riskPoints, relatedFlows }>
  }
  ```
  将新增模块从 8 个压缩为 6 个，消除三个独立模块。

#### A-C02 · `first → skill → wrap_up → first(writeback)` 存在收敛性不确定的循环更新风险
- **位置**：整体 Writeback 闭环架构
- **问题**：当 wrap_up 被多次调用（CI 重跑），每次执行都可能触发 writeback；若 writeback 改变了影响下次 wrap_up 行为的字段（如 critical-flows.verificationHooks），则产生振荡风险
- **建议**：
  1. **幂等保证**：project-cognition-updates.jsonl 每条记录增加 `contentHash`（SHA-256），writeback 前检查相同 contentHash 是否已存在
  2. **Epoch 隔离**：Skill 执行阶段（T11-T16）store 处于 readOnly 快照模式，writeback（T17）在所有 Skill 执行完成后才解除并写入

---

### 🟠 High（5 项）

#### A-H01 · context-resolver.ts 将承担过多职责
- **建议**：引入独立 `CognitionLoader` 模块，专门负责加载+降级+裁切，context-resolver 只做组装调用

#### A-H02 · T10 作为枢纽同时是读写端，无 Epoch 边界
- **建议**：引入 RuntimeStoreEpoch 隔离（参考 MVCC），Skill 执行期间 readOnly，writeback 后解除

#### A-H03 · project-cognition-updates.jsonl 并发写入安全性不足
- **建议**：使用串行写入队列（链式 Promise）+ 多进程原子写入（临时文件 + rename）

#### A-H04 · conventions extractor 自动归纳技术可行性存疑
- **建议**：分层处理——Layer1（机器归纳候选：import/命名/测试结构）+ Layer2（人工确认 recommendedConvention），在 schema 中增加 `source` 字段区分 `machine-inferred / human-confirmed / human-authored`

#### A-H05 · skill-runtime/ 引入后将有 19 个文件，需子目录分层
- **建议**：按职责分三个子目录：
  ```
  skill-runtime/
    ├── cognition/       # 认知资产层（steering/conventions/orientation/critical-flows/loader）
    ├── writeback/       # 写回审计层（classifier/writer/diff-analyzer）
    └── projection/      # 文档投影层（doc-projection/artifact-mapping）
  ```

---

### 🟡 Medium（7 项）

| ID | 问题 | 建议 |
|----|------|------|
| A-M01 | 11个Skill并发消费时无一致性快照保证 | orchestrate 批次开始时 Pin 认知快照版本 |
| A-M02 | "runtime truth first" 无编辑防护，手动编辑MD会被静默覆盖 | MD文件头部 hash 标记 + 反向校验 |
| A-M03 | needs_decision 人工裁决超时未处理 | TTL 配置 + onTimeout 策略（建议默认 block_stage_advance） |
| A-M04 | should_update 候选列表积压无清理策略 | 候选有效期（30d）+ hash失效 + dismiss CLI |
| A-M05 | 单个 schema 生成失败无隔离机制 | Promise.allSettled + 降级契约（required 记录警告/optional 静默） |
| A-M06 | "Project Cognition Gate" 命名与 gate-engine 语义冲突 | 改名 `CognitionUpdateClassifier`，明确是分类决策器非质量门禁 |
| A-M07 | T19 大项目分片仅声称预留但无接口迹可循 | 在 CognitionLoadOptions 预留 scope 字段 + 注释标记 |

---

## 跨 Phase 关键上下文（供 Phase 2 参考）

以下问题将影响安全性与性能评审的关注重点：

1. **数据完整性风险**：canonical truth 无回滚机制 + 无并发写入保护（A-H03, H-04）
2. **循环更新风险**：wrap_up 闭环的收敛性不确定（A-C02）
3. **资源消耗问题**：11 个 skill 同时消费认知层、conventions extractor 全量扫描存量代码（A-H04）
4. **规范合规风险**：TASK ID 体系断裂，Gate 校验将失败（H-05）
5. **积压风险**：should_update 候选列表、needs_decision 记录无清理机制（A-M03, A-M04）
