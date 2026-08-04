---
title: spec-first Skill 流转系统审查与验证方案
type: docs
date: 2026-07-17
doc_role: approach-plan
execution: knowledge-work
output_root: docs/项目审查/xxx/
review_method:
  - docs/10-prompt/结构化项目角色契约.md
  - docs/10-prompt/系统性项目审查方法.md
relates_to:
  - docs/项目审查/README.md
limitations:
  - 本文是系统性项目审查方法的 Skill 流转专项增量，不复制或替代上位审查方法。
  - 本文只定义审查方法、证据边界和产物合同，不包含已执行的测试、宿主验证或项目结论。
---

# spec-first Skill 流转系统审查与验证方案

## Goal Capsule

- **目标：** 判断 spec-first 的 Skill 之间是否形成必要、清晰、可验证、可恢复、可收敛的工程关系，并据此决定保留、修正、精简或退役哪些机制。
- **核心审查对象：** Skill 之间的 edge，而不是孤立 Skill 的 prose 质量。
- **推荐方法：** 在明确定义的 current-source 覆盖分母内完整盘点公开节点与显式关系，深审最高风险的约20%关系边，再用不超过6类代表性场景做语义与失败路径验证。
- **决策焦点：** route 是否选对入口、handoff 是否传递最小充分上下文、authority 是否保持、failure loop 是否产生新证据并收敛。
- **验证焦点：** current source、producer/consumer contract、focused tests、fresh-source 语义场景；真实宿主和 outcome 只在环境与授权允许时升级证据等级。
- **最大风险：** 把审查做成新的图谱、矩阵和报告体系，却没有回答“哪条关系不合理、为什么、如何最小修复”。

---

## 1. 第一性原理

### 1.1 Skill 节点本身不产生系统价值

一个 Skill 即使独立质量很高，如果：

- 用户无法稳定进入它；
- 上游没有提供它所需的输入；
- 下游不消费它的产物；
- 它越权改变 scope、authority 或 completion；
- 失败后没有恢复路径；
- 循环不产生新证据；

那么它仍不是有效 Harness 能力。

因此本次审查的最小不可约对象是：

~~~text
Edge = Trigger
     + Source Skill
     + Target Skill
     + Handoff Payload
     + Authority Boundary
     + Failure Behavior
     + Stop Condition
     + Evidence
~~~

### 1.2 合理关系必须同时满足七个问题

对每条关键关系只问：

1. **必要吗：** 删除这条关系会失去什么用户结果？
2. **选对了吗：** 为什么进入该 Skill，而不是相邻入口或 Direct Lane？
3. **唯一吗：** 是否存在重复 producer、重复状态或第二事实源？
4. **够用吗：** handoff 是否只携带下游决策所需的最小充分信息？
5. **守权吗：** derived artifact、review、provider 或 runtime facts 是否越过自己的 authority？
6. **可恢复吗：** 缺输入、失败、stale、degraded 或用户拒绝时，是否有明确下一步？
7. **会收敛吗：** 回路是否要求新证据并具有停止条件？

任一问题不成立只产生 finding 候选；严重度仍由用户影响、发生概率、可逆性和证据等级综合判断，不自动升级为 P1。

### 1.3 本方案只定义专项增量

以下内容直接复用现有上位基线，不在本文重写：

- 审查角色与使命；
- confirmed/advisory/degraded 证据纪律；
- source/runtime 排除边界；
- 历史 finding 增量裁决；
- 行业对标与项目综合报告通用格式；
- finding → plan → work → verification → closure 的闭环。

本文只补充“如何审查 Skill 流转关系”的专项方法，避免形成第二套系统审查 source of truth。

---

## 2. 范围与80/20策略

### 2.1 强制范围

- 全部 public workflow、standalone skill、internal-only helper 的入口分类；
- current source 中显式声明的 route、handoff、artifact consumer、return path 和 terminal outcome；
- using-spec-first 的入口选择与退出边界；
- requirements、plan、task pack、work、debug、review、closeout、knowledge 的 authority 转移；
- runtime-setup、provider readiness、多仓 target scope 与主 workflow 的关系；
- 与上述关系直接对应的 contracts、schemas、focused tests 和投射测试。

### 2.2 条件范围

仅当核心关系 finding 需要时扩展：

- 真实宿主 loader/invocation；
- 五宿主完整矩阵；
- 外部行业对标；
- 真实团队或 field outcome；
- 单个 Skill 内部实现质量；
- OSS、官网和企业采纳。

条件范围不可因为“全项目审查”四个字自动进入。缺少环境或授权时，只降低 claim ceiling，不阻断核心 Skill 关系审查。

### 2.3 默认不做

- 不逐 Skill 等量深读；
- 不推导所有理论上可能的 Skill 两两组合；
- 不把 generated runtime mirror 当作关系 source；
- 不建设新的 runtime routing registry 或强状态机；
- 不先创建大量审查文件再寻找内容；
- 不为凑完整度运行与关系 finding 无关的全量验证；
- 不在审查阶段直接修代码、Skill 或 runtime。

### 2.4 审查预算

采用固定的渐进覆盖：

覆盖分母在 Pass 1 开始时冻结为：current public/internal roster，加上 §3.1 列出的关系 source 中能够定位到 source ref 的 declared edge。未声明、仅推断或位于未纳入 source 的关系不计入“完整盘点”，必须作为 coverage limitation 单独披露，不能用未知分母声称全覆盖。

| 层级 | 默认覆盖 | 目的 |
| --- | --- | --- |
| 节点盘点 | 100% public/internal roster | 找孤儿、错误暴露和 ownership 漂移 |
| 显式关系盘点 | 冻结覆盖分母内100% declared edge | 建立事实图，不做语义臆测 |
| 深度关系审查 | 约20%最高风险 edge | 聚焦最大系统风险 |
| 语义场景 | 最多6类 | 验证相邻路由、失败和收敛 |
| 路线图 | P0全部保留；P1默认最多10项 | 防止整改队列失控 |
| 下一阶段动作 | 最多3项 | 强制80/20取舍 |

若超过预算，新增项进入附录或 deferred，不扩大默认主报告。

约20%是默认成本预算，不是跳过高风险 edge 的配额上限；若 authority-changing 或 exit-gate edge 超过该比例，风险地板优先，扩大深审范围并在报告中解释成本。

### 2.5 高风险 Edge 选择规则

满足任一条件即优先深审：

1. 高频主链 edge；
2. 改变 scope、authority 或 artifact canonicality；
3. 进入 mutation、verification、handoff、commit/landing 或 knowledge promotion 出口；
4. 涉及 failure/degraded、多仓、跨宿主或 context reset；
5. 历史 P0/P1 finding 所在 edge；
6. 缺少明确 consumer、测试或停止条件。

---

## 3. Source 与证据合同

### 3.1 Current source

关系事实按以下优先级回源：

1. skills/using-spec-first/references/public-route-map.md；
2. src/cli/contracts/dual-host-governance/skills-governance.json；
3. 各 skills/*/SKILL.md 的 Contract Summary、进入/退出和 handoff；
4. docs/contracts/workflows/ 下的 artifact 与 evidence contracts；
5. producer/consumer parser、schema 与 focused tests；
6. docs/05-用户手册/04-workflows-artifacts-map.md 作为用户侧辅助说明。

Graphify、CodeGraph、历史报告和 generated runtime 只提供候选导航或 drift 证据，不拥有关系真相。

### 3.2 Edge provenance

每条 edge 标记：

- **declared：** current source 明确声明；
- **observed：** test、parser、实际产物消费或 host run 证明；
- **inferred：** LLM 从多处 prose 推断，尚未回源确认；
- **historical：** 只存在于历史报告或已退役 source。

只有 declared/observed 可以进入 confirmed 关系图。Inferred edge 只能形成待核对 finding，不能被写成现行 contract。

### 3.3 Claim ceiling

| 证据 | 最高可声明 |
| --- | --- |
| README、Skill prose | 设计意图 |
| Current source + consumer | 关系存在 |
| Focused deterministic tests | 机械合同成立 |
| Fresh-source 语义场景 | 当前 source 在受控输入下做出预期判断 |
| Clean-session host invocation | 指定宿主当前可发现并执行 |
| 真实任务对比样本 | 指定场景下出现 outcome 信号 |

Source-level fresh evaluation 不证明宿主 loader；生成 runtime 不证明 invocation；测试绿灯不证明 field outcome。

---

## 4. 执行方法

### Pass 0：基线与历史裁决

记录 Git HEAD、dirty state、package version、public roster、最近审查与 active plan。优先裁决与路由、handoff、Prompt 成本、closeout、knowledge、runtime setup 相关的历史 P0/P1：

~~~text
RESOLVED
PARTIAL
OPEN
REGRESSED
SUPERSEDED
DEFERRED_WITH_TRIGGER
~~~

历史 finding 没有 current source 或新证据支撑时，不在本轮重新包装成新 finding。

### Pass 1：建立 Skill Graph

先盘点节点，再只记录 current source 明示的 edge。

#### Node record

~~~text
skill_id
entry_surface
primary_intent
input_contract
output_contract
side_effect_class
terminal_or_handoff
owner_source
~~~

#### Edge record

~~~text
edge_id
from_skill_or_intent
trigger
to_skill_or_terminal
handoff_artifact
artifact_authority
freshness_and_limitations
failure_behavior
required_new_evidence
stop_condition
source_refs
provenance
~~~

Edge ID 只用于本轮审查引用，不成为新的 durable workflow contract。

### Pass 2：深审关键关系

优先检查以下 edge family：

1. using-spec-first → Direct Lane / public workflow / standalone skill；
2. ideate → brainstorm；
3. brainstorm / prd → plan / doc-review；
4. plan → write-tasks / work / doc-review；
5. task pack → work；
6. work → plan repair / debug / code-review / closeout / compound；
7. code-review / debug → caller、work 或 terminal closeout；
8. compound → 后续 recall，compound-refresh → knowledge maintenance；
9. runtime-setup / provider facts → downstream workflow readiness；
10. lfg 与 internal helper → public workflow owner。

每条关系按七个第一性问题审查，并执行 subtraction test：

> 删除该 edge、字段、artifact 或单独文件后，核心用户结果是否真的受损？

没有真实 consumer、没有 authority 差异、没有失败语义的关系优先 Thin/Retire，而不是继续补文档。

### Pass 3：验证关系

#### 3.1 确定性验证

至少检查：

- public roster 与 route map 一致；
- internal-only helper 未进入用户路由面；
- route/reference 可达；
- producer 字段与 consumer parser/schema 对齐；
- plan/task identity、hash、readiness、review gate 和 lifecycle 转移有 focused tests；
- 必需 source references 能投射到声明支持的宿主。

验证从最窄命令开始：

~~~bash
npm run lint:skill-entrypoints
npm run typecheck
npm run test:eval-fixtures
~~~

随后只运行与存活 finding 对应的 focused unit/integration tests。只有关系影响面跨越完整 CLI、投射或发布面时，才升级到 smoke、integration、npm test、release 或 build。

#### 3.2 语义场景

最多保留6类，每类必须记录：

~~~text
input
expected_route
forbidden_route
required_artifact
next_owner
authority_boundary
failure_or_degraded_behavior
stop_condition
observed_result
evidence_level
~~~

默认场景：

1. 模糊想法、brownfield PRD、HOW 未定、可直接实施任务之间的相邻入口判别；
2. Product blocker、planning-owned HOW 与 implementation discovery 的回流；
3. requirements-only plan、implementation-ready plan、task pack 和 source drift；
4. failure/debug、diff/review、review-and-fix 与 work closeout；
5. provider degraded、多仓 target 不明确和授权缺失；
6. verified solution promotion、普通修复不沉淀、过期 learning refresh。

#### 3.3 Current-source、Fresh-source 与宿主

默认在当前主线程使用 current source 做串行语义复核，并记录 dispatch_authorization_missing。该结果只标记为 current-source inline review，不得称为 fresh-source、独立 persona 或 context isolation。

只有在用户授权 dispatch 且宿主支持隔离上下文时，才把 current source 注入全新只读上下文执行 fresh-source evaluation；结果仍只证明受控输入下的 source-level semantic behavior。

只有当目标 claim 涉及真实宿主行为且环境可用时，才在临时 Git repo 或隔离环境验证：

~~~text
source projection
runtime generated
loader discovered
workflow invoked
artifact produced
~~~

无法验证时标记 loader_unverified 或相应 limitation，不阻断 source/contract 层结论。

### Pass 4：对抗证伪

每个 P0/P1 候选必须回答：

1. 哪条 current source/test 能推翻它？
2. 如果保持现状，最可能出现的可观察损害是什么？
3. 删除相关机制是否比修补更简单？
4. 最小实验能否先验证，而不是直接建设完整方案？
5. 哪个事实出现时，应撤销 finding 或路线图建议？
6. 修复成本是否高于用户收益？

缺少反证、用户影响或 invalidation condition 的 finding 不进入主路线图。

### Pass 5：综合与闭环

能力决策统一使用角色契约姿态：

~~~text
Adopt
Experiment / Defer
Wrap
Build
Thin / Retire
~~~

reuse / extend / compose / new 仅用于架构实现姿态，不与投资决策 taxonomy 混用。

最终输出：

- P0：全部保留；
- P1：按用户影响、风险、证据和修复杠杆排序，默认最多10项进入行动队列；
- P2/P3：只进入附录或 deferred；
- 下一阶段只推荐3个最高杠杆动作；
- 每个行动项必须关联 finding、owner role、closure condition 和 invalidation condition。

---

## 5. 关系不变量

以下是不变量，不是自动 severity 规则：

1. 每个公开入口都有明确 primary intent；internal-only helper 不进入用户菜单。
2. using-spec-first 一次只选择一个入口并让出控制，不自动串行整条 workflow。
3. 每个非终态 edge 有明确 target、handoff 或可解释 terminal outcome。
4. Durable artifact 只有一个 canonical authority；derived artifact 不反向覆盖 source。
5. Route selection 不授权 mutation、verification claim、commit/landing 或 knowledge promotion。
6. Product blocker 回到需求 producer；implementation discovery 不静默改写产品 WHAT。
7. Review 默认 report-only；本地修复、commit 与 outward landing 分别授权。
8. Debug、review、optimize、refresh 回路必须要求新证据并具有停止条件。
9. Provider/runtime facts 只提供 readiness/advisory evidence，不成为 scope、root-cause 或 completion authority。
10. Knowledge promotion 保留 provenance、consumer、适用范围和 invalidation condition。

违反不变量时，先确认是否影响真实 edge 与用户结果，再语义定级。

---

## 6. 产物合同

唯一产物根目录：

~~~text
docs/项目审查/xxx/
~~~

xxx 是用户指定的审查批次目录段；执行前若提供具体名称，只替换该段。

默认只创建最小五个产物：

~~~text
docs/项目审查/xxx/
├── README.md
├── review-report.md
└── evidence/
    ├── skill-graph.md
    ├── edge-ledger.md
    └── validation.md
~~~

- **README.md：** 快照、索引、执行状态、claim ceiling 和 origin trace。
- **review-report.md：** 结论、P0/P1、决策姿态、最高杠杆三项和不做清单。
- **skill-graph.md：** Node inventory 与 confirmed declared/observed edge。
- **edge-ledger.md：** route、handoff、loop、authority、failure、stop condition 与 finding ref 的合并台账。
- **validation.md：** 实际命令、语义场景、结果、未执行项、限制和反证。

只有单文件超过可读预算、出现独立 consumer 或需要并行维护时，才拆分 route/handoff/loop、scenario 或 host 文件。目录存在不要求预先创建空文件。

后续经独立授权创建的 executable plan 仍以 docs/plans/ 为 canonical home；审查目录只保存 candidate、finding mapping 和链接。

---

## 7. Finding 合同

~~~text
finding_id
edge_id_or_scope
claim
severity
evidence_level
source_refs
counter_evidence
user_impact
root_cause
recommended_posture
closure_condition
invalidation_condition
status
origin_plan
~~~

进入主报告的 finding 必须：

- 能指向 current source 或实际验证；
- 说明可观察用户影响；
- 包含反证或说明未找到反证；
- 给出最小修复/实验/精简姿态；
- 定义 closure 与 invalidation；
- 不重复仍有效的历史 finding。

矩阵行若不能改变 finding、验证、决策或 claim ceiling，应从主产物删除。

---

## 8. 验收标准

- 100% public/internal roster 已盘点，暴露面与 current governance 对齐；
- 冻结覆盖分母内100% declared edge 已登记 provenance，coverage limitation 已披露，未把 inferred edge 写成 confirmed；
- 高风险 edge 选择依据可解释；约20%作为默认预算，所有 authority-changing 与 exit-gate 关系均受风险地板覆盖；
- 每条深审 edge 均回答必要性、路由、唯一 owner、handoff 充分性、authority、failure 和 convergence；
- 最多6类语义场景覆盖相邻入口、blocker 回流、artifact readiness、debug/review、degraded/multi-repo 和 knowledge；
- 没有未解释的孤儿节点/产物、重复 producer、隐式自动串联、authority inversion 或无停止条件循环；
- Current-source inline review、fresh-source evaluation、focused test、host invocation 与 outcome claim 没有混级；
- P0全部保留，P1行动队列受预算约束，下一阶段只推荐3项；
- 所有审查产物位于 docs/项目审查/xxx/，根 README.md 可导航；
- 未执行的宿主、外部研究和 outcome 验证明确降低 claim ceiling；
- 报告能够被后续 plan/work/verification 消费并追踪关闭。

---

## 9. 停止条件

出现以下任一情况，停止扩大审查范围并输出 limitation：

- 连续两轮检查没有产生新证据或改变 finding；
- 关系只能靠推断，无法在 current source 找到声明或 observed consumer；
- dirty worktree 无法区分本轮事实与并行改动；
- 需要真实宿主、外部访问、delegation 或 mutation，但未获得环境/授权；
- 发现开始变成单 Skill 内部重构，与 edge 合理性无关；
- 主报告 P1 超过预算但没有更高用户影响；
- 新产物不能改变决策或被明确 consumer 使用。

审查完成不等于整改授权；finding 只有在后续独立 plan、work 和 verification 闭环后才能关闭。
