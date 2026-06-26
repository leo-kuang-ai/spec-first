# 《技术方案设计文档》对 spec-first `spec-plan` 的集成借鉴报告

> 生成时间：2026-06-25 17:10:45  
> 研究对象：微信公众号文章《技术方案设计文档》（原创：语霖，公众号：语霖 爱语霖爱生活，2026-06-15）  
> 目标项目：`spec-first`  
> 目标 skill：`skills/spec-plan/`
> 输出定位：可落地改造建议，供后续进入 `$spec-plan` / `$spec-work` 形成源码改造计划。

---

## 0. 结论先行

这篇《技术方案设计文档》不应该被原样搬进 `spec-plan` 的主模板。它是一份强企业评审场景下的“详细技术方案全量模板”，覆盖 PRD 对齐、详细设计判断、状态机、异常兜底、接口契约、数据模型、事务一致性、性能容量、定时任务、可观测性、灰度回滚、验收标准、技术选型合规等完整治理项。

`spec-plan` 当前的定位则是 planning-only、decision-first、portable plan artifact：它负责把明确目标或需求转成可评审、可移交、可执行的 HOW plan，但明确不写实现代码、不运行测试、不把计划变成执行脚本。主仓 `spec-plan/SKILL.md` 已经把边界写得很清楚：`spec-brainstorm` 定义 WHAT，`spec-plan` 定义 HOW，`spec-work` 执行计划；并在 Plan-Only Safety Contract 中要求 plan 写完后必须 handoff，不得进入执行。

因此最优集成方式不是“扩大主模板”，而是三层吸收：

1. **把文章的模块详细设计判断规则吸收为 `Enterprise / High-Risk Plan Trigger`**：只有涉及资金、安全、权限、高 QPS、大数据量、跨系统调用、定时任务、复杂状态机、不可逆数据变更等高风险场景时，才触发企业级详细设计附录。
2. **把文章的检查项吸收进 `deepening-workflow.md` 的风险加权质量门**：当前 deepening 已按 Requirements、KTD、Implementation Units、System-Wide Impact、Risks & Dependencies 等章节评分，正适合新增企业级触发器与 hard-gate 风险项。
3. **新增一个独立 reference，而不是污染 core plan template**：建议新增 `skills/spec-plan/references/enterprise-plan-review.md`，作为条件化附录/审查 rubric，由 `plan-template.md` 只保留轻量入口，避免每份 plan 都被企业模板拖重。

一句话：

> `spec-plan` 应吸收这篇文章的“风险识别、详细设计触发、评审硬闸、企业级附录能力”，但不应吸收它的“所有项目一律填满的大而全模板形态”。

---

## 1. 项目概述：文章讲的不是“写文档”，而是“用文档建立技术评审硬闸”

### 1.1 文章核心内容

根据对微信公众号文章的抓取，文章标题为《技术方案设计文档》，作者/公众号信息为“原创 语霖 / 语霖 爱语霖爱生活”，发布时间为 2026-06-15 19:35（北京）。文章主体不是普通技术方案写作指南，而是一份企业内技术方案评审模板。

它的结构可压缩为 12 个治理域：

1. **文档组织与前置约定**：1 份架构设计文档 + N 份模块详细设计附录；明确 PRD 与详细设计边界。
2. **模块详细设计判断规则**：复杂业务逻辑、资金/安全/权限、性能敏感接口、多系统交互、后台定时任务必须详细设计；简单 CRUD / 纯 UI 可不做。
3. **PRD 逐项对应检查**：功能点编号/名称要映射到方案章节，出现未覆盖且无合理解释直接不予通过。
4. **业务逻辑闭环与边界**：前置条件、后置通知、状态机、异常路径、降级、重试参数、防雪崩。
5. **技术实现设计核心交付物**：时序图、核心处理逻辑、数据变更明细。
6. **接口契约与 API 设计**：协议语义、入参/出参、错误码、幂等、性能要求、权限、安全注解、版本兼容。
7. **数据模型与存储设计**：DDL 风险、索引、生命周期、迁移、ER 图、缓存一致性。
8. **事务与分布式一致性**：本地事务边界、MQ 补偿、消费幂等、高并发防重插入。
9. **性能、容量与防重**：资源消耗、批量控制、防重提交、性能影响评估、专项优化。
10. **后台定时任务专项设计**：触发、执行、数据量、失败重试、幂等、并发、监控。
11. **可观测性与可运维性**：日志、TraceId、监控大盘、功能开关、灰度。
12. **迭代计划与验收 / 技术选型与合规**：里程碑、验收标准、交付物、回滚、禁用技术、新依赖审批。

### 1.2 文章真正有价值的地方

文章的价值不在模板项多，而在它把“方案完整性”转成了可审查的工程机制：

- **触发规则**：什么模块必须做详细设计，什么模块不需要。
- **硬闸机制**：资金/安全/权限未详细设计、PRD 功能点未覆盖、缺灰度回滚等可直接否决。
- **跨层覆盖**：从 PRD、接口、数据、事务、性能、任务、运维、上线到验收全链路覆盖。
- **参数化要求**：重试次数、超时时间、批次大小、QPS、TP99、回滚阈值等必须具体化。
- **专项模板**：定时任务、数据迁移、接口兼容、安全防护等高风险场景独立展开。

这正好补足 `spec-plan` 当前偏“通用规划与执行就绪”而非“企业生产风险硬闸”的一层能力。

---

## 2. 架构分析：`spec-plan` 现状与文章模板不是同一层产物

### 2.1 `spec-plan` 当前定位

主仓 `spec-plan/SKILL.md` 明确说明：

- `spec-plan` 的目的，是把 clear goal、requirements artifact、bug、project 或 existing plan 转成 evidence-grounded HOW plan（`skills/spec-plan/SKILL.md:8-18`）。
- `spec-brainstorm` 定义 WHAT，`spec-plan` 定义 HOW，`spec-work` 执行 plan（`skills/spec-plan/SKILL.md:14`）。
- plan-only 边界要求：handoff 前只能研究、决策、写/更新 plan artifact，不能修改代码、不能运行实现 workflow、不能进入 task compilation 或 code edits（`skills/spec-plan/SKILL.md:20-26`）。
- 核心原则包括：requirements as source of truth、decisions not code、research before structuring、right-size artifact、separate planning from execution discovery、keep plan portable（`skills/spec-plan/SKILL.md:91-100`）。
- Plan Quality Bar 已要求 problem frame、requirements traceability、repo-relative file paths、test file paths、decisions with rationale、patterns、test scenarios、dependencies and sequencing（`skills/spec-plan/SKILL.md:102-115`）。

这说明 `spec-plan` 已经具备高质量 planning artifact 的基本骨架。

### 2.2 当前 plan 模板已有的能力

`plan-template.md` 已包含：

- Summary / Decision Brief / Problem Frame / Requirements / Assumptions / Scope Boundaries / Completion Criteria。
- Direct Evidence Readiness / Direct Evidence，用于披露实际读过或验证过的证据。
- Context & Research / Key Technical Decisions / Open Questions。
- Output Structure / High-Level Technical Design / Implementation Units。
- System-Wide Impact / Risks & Dependencies / Documentation / Operational Notes / Sources & References。

其中与文章模板最接近的部分是：

- `High-Level Technical Design`：可承载 API surface、multi-component integration、complex data flow、state-heavy lifecycle 等图示或伪代码（`skills/spec-plan/references/plan-template.md:167-176`）。
- `Implementation Units`：已要求目标、需求映射、依赖、文件、方法、模式、测试场景、验证结果（`skills/spec-plan/references/plan-template.md:179-216`）。
- `System-Wide Impact`：已覆盖 interaction graph、error propagation、state lifecycle risks、API surface parity、integration coverage、unchanged invariants（`skills/spec-plan/references/plan-template.md:219-235`）。
- `Risks & Dependencies` 与 `Documentation / Operational Notes`：可承载 rollout、monitoring、migration、support impacts（`skills/spec-plan/references/plan-template.md:238-249`）。

也就是说，`spec-plan` 不是缺“章节”，而是缺少一套企业高风险场景下的**条件化触发规则与硬闸审查 rubric**。

### 2.3 当前 deepening 机制是最佳集成点

`deepening-workflow.md` 已经是 risk-weighted scoring pass：对各章节计算 trigger count、risk bonus、critical-section bonus；对高风险章节可用 1+ point 触发 deepening；并选择 top 2-5 sections 强化（`skills/spec-plan/references/deepening-workflow.md:5-18`）。

它已有检查项包括：

- Requirements：需求是否模糊、是否未传递到 implementation units、origin IDs 是否保留（`deepening-workflow.md:26-32`）。
- Key Technical Decisions：是否缺 rationale、tradeoffs、scope/requirements 连接（`deepening-workflow.md:39-44`）。
- High-Level Technical Design：是否缺图、是否 wrong medium、是否写成 implementation code（`deepening-workflow.md:51-60`）。
- Implementation Units：路径、测试、依赖、test scenarios、verification、U-ID 稳定性（`deepening-workflow.md:62-73`）。
- System-Wide Impact：接口、错误传播、状态生命周期、缓存/数据完整性、integration coverage（`deepening-workflow.md:74-79`）。
- Risks & Dependencies / Operational Notes：rollout、monitoring、migration、support、安全、隐私、性能、数据风险（`deepening-workflow.md:80-85`）。

这与文章的企业级检查项高度重合。因此，文章最适合被吸收进 deepening，而不是变成主模板默认章节。

---

## 3. 对照矩阵：文章机制如何映射到 `spec-plan`

| 文章机制 | 当前 `spec-plan` 对应点 | 差距 | 建议集成方式 |
|---|---|---|---|
| 1 份架构文档 + N 份详细设计附录 | `High-Level Technical Design` + `Implementation Units` | 没有“哪些模块必须附录”的判断规则 | 新增 `Enterprise Detail Appendix Trigger` |
| 模块详细设计判断规则 | `Right-size the artifact`、planning-depth | 规则较抽象，未枚举资金/权限/高 QPS/定时任务等硬触发 | 加入 `planning-flow` 或新 reference 的触发表 |
| PRD 功能点逐项对应 | Requirements trace、origin actors/flows/AE | 已有 trace，但未有“未覆盖一票否决”强约束 | 对 PRD-grade origin 增加 coverage matrix gate |
| 状态机与死状态检查 | High-Level Technical Design 可用 state diagram | 未明确“多状态必须状态机” | deepening 中 state-heavy lifecycle 触发 state diagram |
| 异常路径、降级、重试、防雪崩 | System-Wide Impact / Risks | 已覆盖 failure propagation，但缺参数化要求 | 企业附录要求重试参数、超时关系、最终失败处理 |
| 时序图 | High-Level Technical Design 支持 Mermaid sequence | 已支持但未要求“正常 + 异常 + 边界” | 多系统交互触发 sequence diagram checklist |
| 数据变更明细与事务归属 | System-Wide Impact / Data risks | 未要求表操作清单、事务归属 | 数据变更触发 Data Change Appendix |
| 接口契约、错误码、幂等、权限 | API surface parity / test scenarios | 未形成 API contract 细表 | API 变更触发 Contract Checklist，必要时交给 contract reviewer |
| DDL、索引、迁移、缓存一致性 | Risks / Operational Notes | 有风险项但不够硬 | 数据变更触发 Migration + Rollback gate |
| MQ、本地事务、分布式一致性 | State lifecycle risks / data integrity | 未显式覆盖 MQ 补偿和消费幂等 | 新增 consistency probe |
| 性能容量、批量控制、N+1 | performance risk | 已能按需加 performance specialist，但模板未提醒 | 高 QPS/大数据量触发 Capacity Appendix |
| 定时任务专项设计 | events/jobs surface | 未有定时任务专属字段 | 新增 Scheduled Job Appendix |
| 日志、TraceId、监控大盘 | Operational Notes | 有 monitoring 但不够具体 | Rollout/Observability checklist 参数化 |
| 功能开关、灰度、回滚 | Operational/Rollout Notes | deep plan extension 有 rollout，但不是 hard gate | 高风险计划必须灰度/回滚，缺失进入 Open Questions 或阻断 |
| 里程碑、验收、交付物 | Completion Criteria / Test scenarios | 缺“交付物清单”和“灰度全量准出条件” | Deep plan optional extension，而非每个 plan 必填 |
| 禁用技术、依赖审批 | Key Technical Decisions / dependencies | spec-first 不应内置某集团规则 | 设计成 project policy hook，不写死集团清单 |

---

## 4. 关键差异：哪些应该吸收，哪些不应该直接吸收

### 4.1 应该吸收的 8 类能力

#### 4.1.1 详细设计触发器

文章最值得吸收的是“不是所有模块都详细设计，但某些模块必须详细设计”。这与 `spec-plan` 的 right-size artifact 完全一致。

建议新增触发器：

- 涉及资金、账务、支付、权益、计费、结算。
- 涉及认证、授权、权限、审计、安全边界、敏感数据。
- 涉及高 QPS、批量处理、大数据量、长耗时任务。
- 涉及跨服务 RPC、MQ、异步事件、跨仓/跨端联动。
- 涉及状态机、多分支业务规则、补偿流程、死状态风险。
- 涉及数据库 DDL、数据迁移、缓存变更、不可逆变更。
- 涉及后台定时任务、重试、并发分片、积压处理。
- 涉及灰度、回滚、功能开关、上线准出。

触发后 plan 不一定变长，但必须在相关章节给出足够信息，或明确 Open Questions / Deferred to Implementation 的边界。

#### 4.1.2 PRD / Requirements 覆盖矩阵

`spec-plan` 已经有 requirements trace，但文章的 A1 功能点逐项对应检查更强：每个 PRD 功能点都要能映射到方案章节，否则不能通过。

建议对 PRD-grade origins 引入：

```markdown
### Requirements Coverage Matrix

| Origin item | Plan section / U-ID | Coverage | Notes |
|---|---|---|---|
| R1 / F1 / AE1 | U1, U3 | covered | ... |
| R2 | Open Questions | partial | needs product decision |
```

如果出现 `not covered` 且无解释，应触发 deepening 或阻断 handoff。

#### 4.1.3 状态机与异常路径硬闸

当前 `High-Level Technical Design` 已支持 state diagram，但未明确“多状态时必填”。建议加入：

- state-heavy lifecycle → 必须有状态流转或文字等价物。
- 每个 terminal / failure / retry state 必须说明推进、恢复或人工处理路径。
- 明确避免 dead state。
- 异常路径至少覆盖外部依赖超时、业务错误、DB/MQ 失败、并发冲突。

#### 4.1.4 降级、重试、防雪崩参数化

文章对重试参数的要求非常具体，尤其是“重试总时长 ≤ 上游超时时间的 80%”。这类规则可作为 plan-time 风险检查，而不是实现细节。

建议在高风险计划的 Risks / Operational Notes 中要求：

- 最大重试次数。
- 重试间隔与退避策略。
- 是否随机抖动。
- 最终失败处理：DLQ、人工介入、告警、丢弃及理由。
- 与上游超时时间的关系。
- 恢复后的补偿策略。

#### 4.1.5 API Contract 与幂等设计

`spec-plan` 已有 API surface parity，但文章补足了企业级 API 细节：GET/POST 语义、入参校验、出参分页、错误码、权限注解、版本兼容、幂等键。

建议做成条件化 `API Contract Appendix`，在计划改变 API / schema / event contract 时触发。

关键要求：

- 新增/变更接口的调用方、路径、语义、副作用。
- 入参边界和校验策略。
- 出参空值语义、分页元数据、错误码。
- 幂等键与重复调用返回策略。
- 权限/角色/审计要求。
- 向前兼容策略。

#### 4.1.6 数据变更、迁移、回滚

文章的数据模型部分对 `spec-plan` 很有启发：新增表/字段、索引、数据迁移、不可逆操作、缓存一致性都必须在方案阶段暴露。

建议新增数据变更触发项：

- DDL 是否锁表，当前数据量与预估耗时。
- 是否需要回填，回填策略是一次性、分批还是懒迁移。
- DDL 执行顺序与回滚路径。
- 是否包含不可逆操作；如果有，必须备份和恢复流程。
- 缓存 key / TTL / 预热 / 失效 / 双删 / binlog 刷新策略。

#### 4.1.7 定时任务专项模板

后台定时任务是文章中很完整的专项模板，也是 `spec-plan` 当前较弱的条件化场景。

建议新增 `Scheduled Job Appendix`：

- 触发方式：cron / event / manual / hybrid。
- 单次处理量、批次大小、峰值、预计耗时。
- 幂等判断依据。
- 并发控制：是否多实例，分片、锁、TTL。
- 失败重试与最终失败处理。
- 监控：成功率、耗时、未按时启动、积压、重试耗尽。

#### 4.1.8 灰度、功能开关、回滚准出

`spec-plan` 已有 Operational / Rollout Notes，但文章把灰度和回滚提升为一票否决项。建议高风险计划必须回答：

- 是否需要 feature flag。
- 灰度维度：白名单、比例、区域、租户、商户、用户组。
- 观察周期和全量准出条件。
- 回滚触发阈值：错误率、TP99、核心业务指标下降。
- 回滚步骤：切流、配置回滚、数据库/数据回退、验证。
- 不可回滚变更的风险承认与备份恢复。

### 4.2 不应直接吸收的 5 类内容

#### 4.2.1 不应把集团禁用技术清单写死进 `spec-plan`

文章中有“伊利集团特定规则”的技术选型合规章节。这类内容不适合写进通用 `spec-plan`。正确方式是做 project policy hook：如果当前 repo 有组织级 policy，则读取并应用；没有则不硬编码。

#### 4.2.2 不应让所有 plan 都填满企业模板

`spec-plan` 的强项是 right-size artifact。简单 bugfix、轻量 refactor、常规 UI 调整如果都填 12 章，会显著降低 plan 信噪比。

#### 4.2.3 不应把验收标准重复从 PRD 复制到 plan

文章强调 PRD 定义“做什么”，详细设计定义“怎么做”，这点反而提醒 `spec-plan`：不要把 PRD 原文搬进 plan。应该保留 trace 和覆盖矩阵，而不是重复用户故事和验收文案。

#### 4.2.4 不应把实现细节写成代码级方案

`spec-plan` 可以写 directional pseudo-code / diagram，但不能变成精确实现代码。这与既有 `Decisions, not code` 原则一致。

#### 4.2.5 不应把所有运维项变成固定章节

监控、灰度、回滚、容量、迁移都应根据风险触发。默认放在 `Documentation / Operational Notes` 或企业附录中，避免主模板臃肿。

---

## 5. 知识链收束：与既有 spec-plan 演进判断保持一致

此前已有两份关于 `writing-plans` 与 `spec-plan` 的分析文档，结论与本次一致：

- `spec-plan` 不应退化成 `writing-plans` 那种执行脚本模式，但可以吸收执行就绪度、低上下文执行者适配、task 粒度校准、计划可执行性自检。
- `spec-plan` 更像高级技术规划器，`writing-plans` 更像执行前工单编译器；前者偏决策/设计/研究层，后者更靠近执行层。

这次文章带来的新增启发，是把 `spec-plan` 的演进从“执行就绪度”进一步扩展到“企业生产风险就绪度”：

```text
已有演进线：
spec-plan = durable decision artifact
          + execution-readiness intelligence

本次新增线：
spec-plan = durable decision artifact
          + execution-readiness intelligence
          + enterprise-risk design gate
```

更具体地说：

- `writing-plans` 视角帮助 `spec-plan` 问：“下游 agent 能不能少补脑、少跑偏？”
- 《技术方案设计文档》视角帮助 `spec-plan` 问：“这个方案过生产评审会不会漏掉资金/权限/数据/回滚/容量这些硬风险？”

这两个方向可以兼容：前者优化 handoff 成功率，后者优化企业级上线可信度。

---

## 6. 分级建议：从最小改造到完整企业级 plan 能力

### 6.1 P0：先做条件触发规则，不改主模板大结构

**目标**：最小成本吸收文章最关键能力。

建议修改：

1. `skills/spec-plan/SKILL.md`
   - 在 Plan Quality Bar 后新增 `Enterprise / High-Risk Readiness` 简短原则。
   - 强调高风险场景必须触发更深设计，不允许用泛泛风险描述带过。

2. `skills/spec-plan/references/deepening-workflow.md`
   - 在 risk bonus 逻辑中新增企业风险触发器。
   - 在 System-Wide Impact、Risks & Dependencies、Implementation Units 检查项中补充：PRD coverage、state lifecycle、API contract、data migration、idempotency、rollback、observability。

3. `skills/spec-plan/references/plan-template.md`
   - 不新增 12 个固定章节。
   - 只在 Deep plan extensions 列表中增加 `Enterprise Risk Appendix` / `API Contract Appendix` / `Data Migration & Rollback Appendix` / `Scheduled Job Appendix` 等可选项。

### 6.2 P1：新增独立企业评审 reference

建议新增文件：

```text
skills/spec-plan/references/enterprise-plan-review.md
```

建议内容结构：

```markdown
# Enterprise Plan Review Reference

## 1. Trigger Matrix
- complex business logic / state lifecycle
- finance / security / permissions
- high QPS / large data volume
- cross-service RPC / MQ / async events
- scheduled jobs
- data migration / irreversible change
- API contract / compatibility
- rollout / rollback / feature flag

## 2. Required Appendix by Trigger
| Trigger | Required plan coverage | Suggested section |
|---|---|---|

## 3. Hard Gates
- PRD item not covered without explanation
- finance/security/permission without detailed design
- data migration without rollback/backup strategy
- high-risk rollout without feature flag or rollback condition
- retry design without final failure handling

## 4. Review Rubric
- requirements coverage
- state and failure path completeness
- API and idempotency
- data consistency and migration
- performance and capacity
- observability and rollout

## 5. Non-Goals
- no organization-specific forbidden technology list unless repo policy supplies it
- no implementation code
- no mandatory full template for lightweight plans
```

### 6.3 P2：把企业风险能力接入 plan-depth 判断

如果后续继续改造，可把企业风险触发器接入 `planning-flow.md` 的 planning-depth assessment：

- Lightweight：常规、小范围、低风险；不触发企业附录。
- Standard：跨模块/API/数据/测试影响；触发局部风险检查。
- Deep：资金/权限/安全/迁移/高并发/定时任务/灰度回滚；触发企业评审附录。

这样可避免主模板变重，同时让高风险计划不会被轻量化误判。

### 6.4 P3：与 specialist reviewer 联动

`deepening-workflow.md` 已经有 section-to-agent mapping，例如 System-Wide Impact 可加 `spec-performance-oracle`、`spec-security-sentinel`、`spec-data-integrity-guardian`；Risks & Dependencies 可加 data migration、deployment verification、performance 等专家（`deepening-workflow.md:126-142`）。

建议后续增强：

- API contract trigger → `spec-api-contract-reviewer`。
- Security/permission trigger → `spec-security-sentinel`。
- Data migration trigger → `spec-data-migration-expert` + `spec-data-integrity-guardian`。
- High QPS / capacity trigger → `spec-performance-oracle`。
- Rollout/rollback trigger → `spec-deployment-verification-agent`。

注意：这些仍应是 plan-time review/deepening，不进入 implementation。

---

## 7. 推荐落地修改清单

### 7.1 建议修改文件

```text
skills/spec-plan/SKILL.md
skills/spec-plan/references/plan-template.md
skills/spec-plan/references/deepening-workflow.md
skills/spec-plan/references/planning-flow.md
```

### 7.2 建议新增文件

```text
skills/spec-plan/references/enterprise-plan-review.md
```

### 7.3 最小可行改造方案

最小可行版本只做三件事：

1. 新增 `enterprise-plan-review.md`。
2. 在 `deepening-workflow.md` 增加企业风险触发器和 hard-gate 检查项。
3. 在 `plan-template.md` 的 Deep plan extensions 增加企业风险附录类型，但不改 core template。

### 7.4 验证方式

建议新增或更新 `spec-plan` eval 用例，覆盖：

1. **轻量 CRUD**：不触发企业附录，证明不会模板膨胀。
2. **权限接口**：必须触发权限、安全、审计、幂等检查。
3. **高 QPS 列表接口**：触发性能、索引、缓存、分页、限流检查。
4. **跨服务 MQ 写操作**：触发事务、补偿、消费幂等、失败重试。
5. **数据迁移**：触发 DDL 风险、回填策略、回滚/备份。
6. **定时任务**：触发专项模板，包括批次、幂等、并发、监控。
7. **高风险灰度上线**：触发 feature flag、灰度、回滚阈值。
8. **PRD 覆盖缺口**：存在未覆盖功能点时进入 Open Questions 或阻断 handoff。

通过标准：高风险场景不能只给出泛泛 “handle errors / add monitoring / consider rollback”；必须出现具体 plan-time 决策或明确待确认问题。

---

## 8. 最终建议

本次文章对 `spec-plan` 的最大启发，可以概括为：

> 让 `spec-plan` 不只问“实现者能不能照着开始”，还要问“这份方案能不能经得住企业生产评审”。

但落地时必须守住 `spec-plan` 的三个边界：

1. **不把 plan 变成实现脚本**：继续保持 decisions-first、planning-only。
2. **不把主模板变成巨型表格**：企业模板应条件触发、附录化、deepening 化。
3. **不写死组织特定规范**：集团禁用技术清单等应变成 project policy hook。

推荐优先级：

- **立即做**：新增企业风险触发器与 hard gate rubric。
- **短期做**：新增 `enterprise-plan-review.md` reference。
- **中期做**：接入 planning-depth 与 specialist reviewer mapping。
- **长期做**：形成 `spec-plan` 的 Enterprise Readiness eval suite。

如果执行这条路线，`spec-plan` 会从当前的“高质量技术计划器 + 执行就绪度优化器”，进一步升级为：

> **高质量技术计划器 + agent handoff optimizer + enterprise production readiness gate**。
