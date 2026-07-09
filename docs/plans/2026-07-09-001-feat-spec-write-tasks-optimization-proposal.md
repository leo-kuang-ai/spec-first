---
title: "feat: spec-write-tasks 任务拆分质量优化方案"
type: feat
status: draft
date: 2026-07-09
spec_id: 2026-07-09-001-spec-write-tasks-optimization
plan_depth: deep
---

# spec-write-tasks 任务拆分质量优化方案

## Summary

本方案基于对 `spec-write-tasks` skill 的深度审查、`spec-plan` 的实现分析、以及业界任务拆分最佳实践（INVEST 原则、垂直切片、AI Agent Task Decomposition 策略）的综合思考，提出 12 项优化建议。核心目标是：让 spec-write-tasks 从"能拆任务"进化到"拆出高质量、可验证、可并行、风险可控的任务"，同时保持 spec-first 的核心哲学——scripts enforce deterministic invariants, LLM decides semantic adequacy。

---

## 审查现状

### 当前优势

1. **清晰的职责边界** — 明确定位为 spec-plan 和 spec-work 之间的 optional derived layer，不执行代码、不发明 scope
2. **强确定性验证** — CLI 验证 identity/freshness/structure，LLM 判断语义质量，分工清晰
3. **五条分支决策树** — compile/skip/return-to-plan/draft-only/validate-only 覆盖完整
4. **良好的 Task Quality Guide** — done_signal / stop_if / context_refs / review_gate 的好坏示例
5. **Source Plan SoT 原则** — 任务包永远是 derived，不替代计划
6. **Vertical Slice 意识** — 明确反对 horizontal slicing smell
7. **Large Unit Fan-Out 指导** — 允许 one-to-many 映射

### 发现的优化空间

| 维度 | 当前状态 | 改进方向 |
| --- | --- | --- |
| Compile/Skip 决策 | 依赖模糊的"太大或依赖复杂"判断 | 量化复杂度信号驱动决策 |
| 任务粒度 | 静态规则，不区分执行者 | 适配 AI executor vs 人类 executor 的认知差异 |
| 风险排序 | 仅在 review_gate 中体现 | 缺少 risk-first wave ordering 的显式策略 |
| 反馈环密度 | 有 vertical slice 原则但缺定量指导 | 明确每个 task 应有独立反馈循环 |
| 认知负载预算 | 无 | 应限制单任务 context 载入量 |
| 依赖图分析 | 仅检查引用存在、same-wave overlap | 缺少关键路径识别、并行度优化 |
| 探索性任务 | 无一等支持 | 缺少 spike/exploration task 类型 |
| 自检闭环 | quality analyzer 是后置独立工具 | 应在编译流程中内置 pre-emit 质量扫描 |
| Spec-plan 衔接 | 依赖 executor 读 focused sections | 缺少结构化 readiness 评估协议 |
| 估算信号 | 无 | 缺少相对规模/工作量信号辅助 wave 规划 |
| 跨切面关注点 | 无专门策略 | logging/config/i18n 等横切任务缺少拆分指导 |
| 任务间状态传递 | 仅通过 dependencies 隐含 | 缺少 artifact handoff 显式声明 |

---

## 优化方案

### O1. 结构化 Compile/Skip 决策框架

**问题：** 当前判断"是否值得生成 task pack"仅依赖模糊描述（"plan is too large or dependent for direct execution"），缺少可操作的决策信号。

**方案：** 引入基于 source plan 结构的复杂度信号方向矩阵（信号强度分 strong/moderate/weak，具体阈值需按项目校准）：

```yaml
compile_signals:
  strong_compile:  # 任何一个 strong signal 即倾向 compile
    - implementation_units 数量多（参考：项目最近 10 个 plan 中 compile 决策的下限）
    - 存在跨模块/目录的依赖链
    - 存在多个共享 contract surface（公共 API/schema/contract 变更）
    - 存在多个 plan 中标记为高风险的 unit
  moderate_compile:  # 需要 >= 2 个 moderate signal
    - unit 数量中等 AND 存在 wave-worthy 并行机会
    - test scenarios 总量大
    - 涉及文件数多
    - plan_depth == "deep"
  skip_signals:  # 任何一个 skip signal 且无 strong_compile
    - unit 数量少 AND 涉及文件数少
    - plan_depth == "lightweight"
    - 单模块内部变更 AND 无共享 contract
```

**校准原则：** 上述信号是方向性指引，不是硬编码阈值。团队应根据最近 5-10 个 plan 的实际 compile/skip 决策分布来校准具体数字。数字仅作为团队共识的记录，不应被自动化消费。

**与 `task-governance-signals.v1` 的关系：** O1 信号矩阵读取 source plan 的结构化数据（U-IDs、files、dependencies），是 plan-intrinsic evidence。`task-governance-signals.v1` 是外部 governance helper，提供 cross-check advisory signal，可能因缺少 `--input` 或上下文不可读而 degraded。两者都是 advisory input，O1 更直接、更稳定；当 governance helper degraded 时，O1 信号矩阵仍然可用。不要把 governance helper 的 `candidate_level` 当作 compile/skip gate。

**与 spec-plan 的衔接：** spec-plan 在 Phase 3 已产出 U-IDs、files、dependencies、test scenarios 等结构化数据。spec-write-tasks 应消费这些结构，而非重新从自然语言推导。可在 Task Quality Guide 中新增 "Plan Readiness Signals" 小节。

**保持边界：** 信号矩阵是 advisory LLM input，不是硬 gate。最终 compile/skip 仍由 LLM 结合上下文判断。

---

### O2. INVEST 原则映射到 Task Card 验证

**问题：** 业界 INVEST 原则（Independent, Negotiable, Valuable, Estimable, Small, Testable）是任务质量的黄金标准，但当前 Task Quality Guide 仅隐含覆盖了部分维度。

**方案：** 在 Task Quality Guide 中新增 INVEST 对照表，将其映射到现有字段：

| INVEST | 映射到现有字段 | 验证方式 |
| --- | --- | --- |
| **Independent** | `dependencies` 应最小化；优先 DAG 宽度而非深度 | 检查是否存在不必要的串行链 |
| **Negotiable** | `goal` 描述意图而非具体实现步骤 | goal 不应包含具体代码路径或命令 |
| **Valuable** | `source_unit` / `requirement_refs` 确保追溯到用户价值 | 无 source anchor 的任务应质疑其存在价值 |
| **Estimable** | `files` + `test_focus` 使范围可估算 | 文件列表过长(>7)或 test_focus 模糊说明粒度不当 |
| **Small** | 单任务应在一个 feedback loop 内完成 | 若需要超过 5 个 subtask 才能执行，应拆分 |
| **Testable** | `done_signal` 必须可观察 | 已有 bad smell 检测 |

**实施方式：** 在 quality analyzer advisory 输出中增加 INVEST 维度的 soft signals，不作为 validator gate。

---

### O3. 认知负载预算 (Cognitive Load Budget)

**问题：** AI executor 的 context window 和人类的工作记忆都有限。当前没有机制评估单任务的"认知载入成本"。

**方案：** 为每个 task 引入 advisory `context_budget` 评估维度：

**认知负载因子：**
- `files` 数量 × 文件平均复杂度权重
- `context_refs` 引用的外部文档数
- `dependencies` 中需要理解的前置产物
- `stop_if` 条件的判断复杂度

**经验法则（写入 Task Quality Guide）：**
- 单任务理想 files ≤ 5，超过 7 时应考虑拆分
- context_refs 理想 ≤ 4，超过 6 说明任务边界可能太模糊
- 依赖链深度（从根到叶）理想 ≤ 3 层

**对 AI executor 的特殊考量：**
- AI executor 的可用 context window 有限且因模型/provider 而异，task pack 应确保单任务启动时载入 plan sections + context_refs + target files 不超过 executor 可用 context 的 50%
- entry_hint 在 AI executor 场景下应更精确地指向文件和行范围，减少无效 context 载入

**保持边界：** 这是 quality guide 的 advisory 指导，不进入 deterministic validator。

---

### O4. Risk-First Wave Ordering 策略

**问题：** 当前 wave 规划仅基于依赖关系和文件重叠，缺少基于风险的主动排序策略。

**方案：** 在 Task Pack Schema 的 "Execution Waves" 部分补充 risk-first ordering 原则：

**核心策略：** 在满足依赖约束的前提下，将高不确定性 / 高风险任务排在早期 wave：

1. **Unknown-first** — 涉及未验证假设的任务优先（对应 plan 中的 implementation-time unknowns）
2. **Contract-first** — 定义被多个下游任务消费的 interface/schema/contract 的任务优先
3. **Integration-first** — 跨模块集成点优先于模块内部实现
4. **Irreversible-first** — 对公共 API、数据 schema 等难以回退的变更优先验证
5. **Walking Skeleton / Thin Slice first** — Wave 1 优先包含一条最小端到端路径（从输入到输出的最薄完整切片），验证架构假设后再在后续 wave 中加宽各层

**与 spec-plan 的衔接：** spec-plan Phase 3.5 已产出 Dependencies（U-ID 引用）和 Test scenarios。spec-write-tasks 应利用这些信息识别"哪些 U-ID 是被多个其他 U-ID 依赖的关键路径节点"。

**Wave Planning Checklist（新增到 Task Quality Guide）：**
- Wave 1 应覆盖所有 foundation/contract tasks
- Wave 1-2 应覆盖所有 `review_gate: required` tasks
- 每个 wave 应有至少一个独立可验证的 feedback loop
- 最后一个 wave 通常是 docs/changelog/polish tasks

---

### O5. 探索性任务 (Spike Tasks) 一等支持

**问题：** 当某个 implementation unit 的实现路径存在真正不确定性时，当前只能通过 `risk_note` 和 `stop_if` 隐式处理，缺少显式的 spike/exploration task 类型。

**方案：** 在 Task Pack Schema 和 Task Quality Guide 中支持 spike task 模式：

**Spike Task 特征：**
- `goal` 是回答一个具体问题，而非交付实现
- `done_signal` 是产出决策或证据文档，而非代码变更
- `stop_if` 通常是"答案确认后立即停止，实现属于后续 task"
- 依赖它的 task 应标记为 conditional（spike 结论可能改变后续 task 的方向）

**示例 Task Card：**
```yaml
- T001
  source_unit: U2
  goal: 验证 WebSocket 库 X 是否满足并发连接数要求（>10K）
  dependencies: []
  files:
    - docs/spikes/websocket-library-benchmark.md
  test_focus: 产出负载测试结果和选型结论
  done_signal: spike 文档包含性能数据和推荐方案
  stop_if: 测试发现根本性限制，需返回 spec-plan 重新选型
  wave: 1
  task_type: spike  # 新增 advisory 字段
```

**保持边界：** `task_type` 作为 advisory quality field（类似 `review_gate`），deterministic validator 仅做 enum 校验（`spike` | `implementation` | `integration` | `docs`），不做语义判断。

---

### O6. 依赖图分析增强

**问题：** 当前 validator 仅检查 dependencies 是否引用存在的 task_id，缺少结构性分析。

**方案：** 在 advisory quality analyzer 中增加 DAG 分析：

**Advisory 分析维度：**
1. **环检测** — 识别循环依赖（属于结构性图约束，与 "dependencies point to existing tasks" 同类，是 deterministic lint 可检查的 structural invariant，不属于语义质量判断）
2. **关键路径识别** — 标记 longest dependency chain，提醒若此路径上任何 task 延迟会影响整体
3. **并行度评估** — 计算 `max_parallel_width = max(wave_task_count)`，若 DAG 宽度远小于任务数，提示可能存在不必要的串行约束
4. **孤立任务检测** — 无依赖且不被依赖的任务应审视是否遗漏了关联
5. **瓶颈节点检测** — 被 3+ 下游任务依赖的节点应标记为 `review_gate: required` 候选

**推荐规则（写入 Task Quality Guide）：**
- 关键路径长度 > 任务总数的 60% 时，应审视是否过度串行化
- 单个 task 被 3+ 其他 task 依赖时，建议标记 `review_gate: required`
- Wave 数量 > 5 时，建议审视是否可以合并某些低风险串行任务

**实施路径：** 扩展现有 `scripts/spec-write-tasks/analyze-task-pack-quality.js`，新增 DAG topology 分析。

---

### O7. Artifact Handoff 显式声明

**问题：** 当多个任务需要传递中间产物（如 T001 定义的 schema 被 T003 实现的 API 消费）时，当前仅通过 `dependencies` 隐含传递关系，executor 可能不清楚具体交接物。

**方案：** 在 Task Quality Guide 的 "Dependency and Wave Rules" 小节补充 artifact handoff 的写作指导（prose best-practice），而非新增 schema fields：

**写作指导（advisory，不新增字段）：**
- 当 task A 的主要产出被 task B 显式依赖时，在 task A 的 `done_signal` 中命名该产出（如 "schema file exists and passes validation"），在 task B 的 `context_refs` 中引用该产出路径
- 在 `goal` 或 `notes` 中用一句话说明该 task 产出的关键 artifact 是什么，以及哪些下游 task 会消费它
- 对于复杂的多产物 task，可在 `notes` 中列出 produces/consumes 关系作为 executor 指引

**不引入 `produces` / `consumes` 新字段的原因：**
- 字段增殖带来维护成本，且对 deterministic lint 无实质帮助（消费关系是语义判断）
- 当前 `dependencies` + `done_signal` + `context_refs` 组合已足以表达交接关系
- 如果 executor 需要理解 artifact 关系，通过 `goal` 和 `notes` 的自然语言已足够清晰

**保持边界：** 不新增 schema fields，写作指导作为 Task Quality Guide 的 advisory section。

---

### O8. 自适应粒度策略 (Adaptive Granularity)

**问题：** AI executor 和人类 executor 对任务粒度的最优点不同。AI executor 可以快速切换上下文但容易 drift；人类 executor 需要更大的自主空间但认知负载有限。

**方案：** 在 Task Quality Guide 中新增 executor-aware granularity guidance：

**AI Executor 优化：**
- 更细粒度（每 task 1-3 files），因为 AI 不需要"热身时间"
- `stop_if` 更严格和具体，防止 scope drift（AI 的主要风险）
- `entry_hint` 精确到文件+函数级别
- `context_refs` 应包含完整的 relevant interface/type 文件，减少 AI 需要自行搜索的步骤
- `done_signal` 倾向于可自动验证的信号（tests pass, lint clean, type check pass）

**Human Executor 优化：**
- 更大粒度（每 task 3-7 files），减少 context switch 成本
- `goal` 更多解释 WHY，给予实现自由度
- `entry_hint` 提供思考路径而非精确位置
- `done_signal` 可以包含 review-based signal
- `notes` 提供更多 trade-off 背景

**触发方式：** 不新增硬字段。spec-write-tasks 根据调用上下文（是否来自 spec-lfg 等自动化流程、是否有 `executor: ai` 提示）调整粒度倾向。默认粒度适配 AI executor（因为 spec-work 是主要下游消费者）。

**当前限制：** 目前不存在运行时 executor type 检测协议。粒度差异仅作为 Task Quality Guide 的写作参考，由 LLM 在编译时根据调用链上下文（spec-lfg 自动化 vs 用户手动调用）自行推断。如果未来需要精确切换，应由调用方在 invocation context 中传入 `executor_hint` advisory field，而非 spec-write-tasks 自行猜测。

---

### O9. Pre-Compilation Readiness Assessment

**问题：** 当前流程是直接从 source plan 编译 task pack，缺少结构化的"编译前准备度评估"，导致 return-to-plan 的发现可能偏晚。

**方案：** 在 compile 分支的开始阶段增加一个轻量 readiness check，聚焦于 **task-compilation-specific structural readiness**（即 source plan 的结构是否足以支撑 task 拆分），而非重复 spec-plan 已保证的上游职责：

**与 spec-plan 的职责划分：**
- spec-plan Phase 0.5 已负责 product blockers / unresolved scope
- spec-plan Phase 0.7 / 5.1.5 已做 scoping synthesis confirmation
- spec-plan Phase 5.3 已执行 confidence check and deepening
- 因此 O9 **不检查** scope closure、TBD resolution、open question resolution（这些是 spec-plan 的 exit gate）

**Task-Compilation Readiness Checklist：**

```markdown
## Plan Readiness for Task Compilation

1. Compilability Structure（task pack 可编译的最低结构要求）
   - [ ] 每个 U-ID 有明确的 files 列表（否则无法分配 task 文件边界）
   - [ ] 每个 feature-bearing unit 有 test scenarios（否则无法生成 done_signal）
   - [ ] Dependencies 在 U-ID 间已声明（否则无法规划 waves）
   - [ ] 每个 unit 有 done criteria / Verification 字段

2. Boundary Safety（已被 deterministic lint 部分覆盖，这里前置检查避免编译浪费）
   - [ ] 无 generated runtime mirror paths 在 files 中
   - [ ] 若 parent workspace，target_repo 已声明
```

**注意：** Identity（spec_id、source_plan_hash）已由 deterministic lint 强制。此 checklist 仅作为 LLM 在开始编译前的 advisory quick-scan，减少编译后才发现 return-to-plan 的浪费。

**失败处理：** 如果 checklist 中 "Compilability Structure" 有多项缺失（>50% 的 units 无 files 或无 test scenarios），倾向走 `return-to-plan` 或 `draft-only`。单项缺失时在 Orientation Evidence 中记录 limitation 并继续编译。

---

### O10. Post-Compilation 质量自检

**问题：** 当前 quality analyzer 是独立工具，编译流程中没有 built-in 的 pre-emit 质量扫描。compiler 可能生成一个通过 deterministic validation 但语义质量低的 task pack。

**方案：** 在 compile 分支的最后步骤（写入 task pack 后、生成 envelope 前）增加一个轻量自检步骤：

**Self-Review Checklist（LLM 内部执行，不外部化为脚本）：**

1. **Coverage Check** — 每个 source unit 至少被一个 task 引用？遗漏的 unit 是否有合理原因？
2. **Granularity Check** — 是否有 task 的 files > 7？是否有 task 的 goal 包含 "and" / 多个不相关动词？
3. **Feedback Loop Check** — 每个 task 是否有独立的 verification 路径（不需要后续 task 才能验证）？
4. **Dependency Minimalism** — 是否有 task 的 dependencies 可以移除而不影响正确执行顺序？
5. **Done Signal Observability** — 每个 done_signal 是否可被自动化或 diff 验证（而非主观判断）？
6. **Stop Signal Specificity** — 每个 stop_if 是否命名了具体的 scope expansion 条件？

**输出：** 如果自检发现问题，在 envelope 的 `orientation.limitations` 中记录，但不阻断 handoff（保持 "gate the exits, not the thinking" 原则）。严重问题可以降级 `next_action` 为 `review-task-pack`。

---

### O11. 跨切面关注点拆分策略

**问题：** 横切关注点（error handling, logging, i18n, config, observability）在多个 task 中重复出现时，缺少明确的拆分策略。

**方案：** 在 Task Quality Guide 中新增 "Cross-Cutting Concerns" 小节：

**策略矩阵：**

| 模式 | 适用场景 | 示例 |
| --- | --- | --- |
| **Foundation Task** | 横切基础设施需要先建立，其他 task 都消费 | 建立统一 error handling middleware，后续 task 使用 |
| **Inline** | 横切变更量小且与主逻辑紧耦合 | 在每个 API endpoint task 中各自加 logging |
| **Polish Task** | 横切变更独立于核心逻辑，可最后统一添加 | i18n 字符串提取、observability 指标注册 |
| **Deferred** | 横切需求超出当前 plan scope | 复杂的分布式 tracing 基础设施 |

**决策规则：**
- 如果横切变更被 >= 3 个 task 依赖 → Foundation Task (Wave 1)
- 如果横切变更仅影响单个 task 的内部实现 → Inline
- 如果横切变更不阻塞其他 task 的 done_signal → Polish Task (Last Wave)
- 如果横切变更需要架构决策 → Deferred (return-to-plan 或 scope boundary)

---

### O12. Spec-Plan → Spec-Write-Tasks 衔接协议增强

**问题：** spec-plan 产出的 artifact 没有显式的 "task-compilation readiness" 信号。spec-write-tasks 需要自行判断 plan 是否 task-ready，这个判断目前不够结构化。

**方案：** 建议在 spec-plan 的输出 artifact 中增加 optional advisory metadata，帮助 spec-write-tasks 快速评估：

**Advisory Plan Metadata（写入 plan frontmatter 或尾部）：**

```yaml
# Advisory — consumed by spec-write-tasks, not by spec-work
task_compilation_hints:
  recommended_action: compile | skip | user-decide
  reason: "5 units with cross-module deps; parallel opportunities in U2-U4"
  complexity_signals:
    unit_count: 5
    max_dependency_depth: 3
    shared_contracts: [src/contracts/api.ts, src/schemas/event.schema.json]
    risk_rated_units: [U3, U5]
```

**保持边界：**
- 这是 spec-plan 的 optional advisory output，不是必填字段
- spec-write-tasks 仍然可以独立做 compile/skip 决策
- 不修改 spec-plan 的 core workflow，仅在 Phase 5.2 write 时 optional 附加
- 实施优先级低，可作为 follow-up 在两个 skill 协同优化时实现

---

## 实施优先级

| 优先级 | 优化项 | 价值/风险 | 实施复杂度 |
| --- | --- | --- | --- |
| P0 | O1 Compile/Skip 决策框架 | 高 — 直接影响是否应该编译 | 低 — 仅修改 Task Quality Guide |
| P0 | O4 Risk-First Wave Ordering | 高 — 影响执行顺序质量 | 低 — 仅修改 Task Quality Guide + Schema |
| P0 | O9 Pre-Compilation Readiness | 高 — 前置发现 return-to-plan 条件 | 低 — 修改 SKILL.md workflow |
| P1 | O2 INVEST 映射 | 中 — 提供系统性质量框架 | 低 — 修改 Task Quality Guide |
| P1 | O3 认知负载预算 | 中 — 改善 AI executor 体验 | 低 — 修改 Task Quality Guide |
| P1 | O6 依赖图分析增强 | 中 — 发现结构性问题 | 中 — 扩展 analyzer 脚本 |
| P1 | O10 Post-Compilation 自检 | 中 — 提升输出质量 | 低 — 修改 SKILL.md workflow |
| P1 | O11 跨切面策略 | 中 — 解决常见拆分困惑 | 低 — 修改 Task Quality Guide |
| P2 | O5 Spike Tasks | 低频但有价值 | 低 — Schema + Guide 变更 |
| P2 | O7 Artifact Handoff | 低频但有价值 | 低 — Guide prose 变更 |
| P2 | O8 自适应粒度 | 中期价值 | 中 — 需要 executor detection |
| P3 | O12 Plan 衔接协议 | 长期价值 | 中 — 需跨 skill 协同 |

---

## 应用纪律

并非所有 task compilation 都需要应用全部 12 项优化。根据 plan 复杂度和风险选择适当层次：

| 层次 | 适用场景 | 应用的优化项 |
| --- | --- | --- |
| **Lightweight** | plan_depth == lightweight、单模块、无跨依赖 | 仅 O1 skip signal → 跳过编译 |
| **Standard** | 多数常规 plan（plan_depth == standard/deep，3-8 units） | O1 + O2 + O4 + O9 + O10 |
| **Deep** | 大型复杂 plan（>8 units、跨模块、有 spike 需求） | 全部 12 项 |

**当不应该编译 task pack 时：**
- plan 足够简单，直接交 spec-work 执行效率更高
- plan 本身就是一个 single-task 层次（如纯文档改动、单文件 bugfix）
- 编译 task pack 的维护成本超过其带来的编排价值

---

## 与业界最佳实践的对标

### INVEST 原则对标

| 原则 | spec-write-tasks 当前覆盖 | 差距 |
| --- | --- | --- |
| Independent | dependencies 字段 + wave 隔离 | 缺少显式独立性验证 |
| Negotiable | goal 描述意图 | 已满足 |
| Valuable | source_unit / requirement_refs 追溯 | 已满足 |
| Estimable | files + test_focus 限定范围 | 缺少规模信号 |
| Small | Granularity Guide | 缺少量化阈值 |
| Testable | done_signal | 已满足（有 bad smell 检测） |

### Vertical Slicing 对标

spec-write-tasks 已明确反对 horizontal slicing（Task Quality Guide "Horizontal slicing smell"），并推荐 vertical tracer bullets。这与业界共识一致。Walking Skeleton / Thin Slice 原则已通过 O4 纳入 risk-first wave ordering 策略（Wave 1 优先包含最小端到端路径）。

### AI Agent Task Decomposition 对标

对比 AI Agent 领域的 task decomposition 研究：
- **Sequential vs Parallel** — spec-write-tasks 通过 wave + parallelizable 支持，但缺少自动优化建议
- **Recursive Decomposition** — spec-write-tasks 的 Large Unit Fan-Out 部分覆盖，但没有递归拆分能力
- **Adaptive Re-planning** — spec-write-tasks 通过 stop_if + return-to-plan 支持，设计良好
- **Tool-Aware Decomposition** — spec-write-tasks 不考虑 executor 可用工具，可通过 O8 自适应粒度改善

---

## 风险与边界

### 绝对不做

1. **不把语义质量硬编码为 validator gate** — 所有新增分析都是 advisory，不阻断 handoff
2. **不新增 workflow state machine** — spec-write-tasks 保持 stateless single-pass
3. **不改变 source/runtime 边界** — 新增指导都在 source skills 中
4. **不让 spec-write-tasks 变成 orchestrator** — 仍然是 single-decision + single-artifact
5. **不新增必填字段** — 所有新增字段都是 advisory quality fields
6. **不改 scorer/auditor** — 优化目标是真实任务拆分质量，不是审计分数

### 需要注意

- O12 涉及跨 skill 协同，需要 spec-plan 的 maintainer 同步评审
- O6 扩展 analyzer 时必须保持其 advisory-only 定位（`cannot_override_validator` invariant）
- O8 自适应粒度的 executor detection 可能依赖调用方传入 hint，不能自行推测

---

## 验证策略

1. **现有测试不退化** — `npm run test:unit` 通过，spec-write-tasks 相关 tests 全绿
2. **Quality Guide 变更后的 fresh-source eval** — 使用当前 Task Quality Guide 和示例 plan 执行一次 task compilation，验证输出质量是否改善
3. **Analyzer 扩展后的 fixture 验证** — 扩展 `tests/fixtures/spec-write-tasks/` 覆盖新增 advisory signals
4. **Backward Compatibility** — 所有优化都是增量的，不改变现有 task pack 的 validity

---

## 落地映射

各优化项对应的具体文件/小节修改点：

| 优化项 | 目标文件 | 变更类型 |
| --- | --- | --- |
| O1 | `skills/spec-write-tasks/references/task-quality-guide.md` 新增 "Plan Readiness Signals" 小节 | Guide 新增 section |
| O2 | `skills/spec-write-tasks/references/task-quality-guide.md` 新增 "INVEST Mapping" 小节 | Guide 新增 section |
| O3 | `skills/spec-write-tasks/references/task-quality-guide.md` "Granularity Rules" 后追加 context budget 经验法则 | Guide 扩展 |
| O4 | `skills/spec-write-tasks/references/task-quality-guide.md` "Dependency and Wave Rules" 后追加 wave planning checklist | Guide 扩展 |
| O5 | `skills/spec-write-tasks/references/task-pack-schema.md` quality fields 新增 `task_type` enum + Guide spike 模式说明 | Schema + Guide |
| O6 | `scripts/spec-write-tasks/analyze-task-pack-quality.js` 新增 DAG topology 分析 | Script 扩展 |
| O7 | `skills/spec-write-tasks/references/task-quality-guide.md` "Dependency and Wave Rules" 追加 artifact handoff 写作指导 | Guide 扩展 |
| O8 | `skills/spec-write-tasks/references/task-quality-guide.md` "Granularity Rules" 追加 executor-aware 指导 | Guide 扩展 |
| O9 | `skills/spec-write-tasks/SKILL.md` compile 分支开头插入 readiness quick-scan 步骤 | SKILL workflow |
| O10 | `skills/spec-write-tasks/SKILL.md` compile 分支末尾插入 self-review 步骤 | SKILL workflow |
| O11 | `skills/spec-write-tasks/references/task-quality-guide.md` 新增 "Cross-Cutting Concerns" 小节 | Guide 新增 section |
| O12 | `skills/spec-plan/SKILL.md` Phase 5.2 optional + `task-quality-guide.md` 交叉引用 | 跨 skill 协同 |

---

## 总结

spec-write-tasks 当前已是一个设计良好的 skill，其核心架构（source plan SoT、deterministic + semantic 分工、five-branch decision tree）无需大改。本方案的 12 项优化聚焦于：

1. **决策质量提升** — 通过结构化信号框架（O1, O9）让 compile/skip 决策更精准
2. **任务质量提升** — 通过 INVEST 映射、认知负载预算、风险排序（O2, O3, O4）让产出的 task 更可执行
3. **覆盖面补全** — 通过 spike tasks、跨切面策略、artifact handoff（O5, O7, O11）处理当前缺少指导的场景
4. **闭环自检** — 通过 pre-compilation readiness 和 post-compilation self-review（O9, O10）在编译流程中内置质量反馈
5. **生态协同** — 通过 plan 衔接协议（O12）和自适应粒度（O8）改善上下游协作

所有优化都遵循 spec-first 的核心哲学：scripts enforce deterministic invariants, LLM decides semantic adequacy above that floor。
