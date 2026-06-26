---
title: "refactor: spec-plan 升级为顶尖架构师级技术方案生成器(合并升级方案)"
type: refactor
status: active
date: 2026-06-26
spec_id: 2026-06-26-002-spec-plan-architect-grade-upgrade
origin: docs/项目审查/详细审查/2026-06-26-architect-workflow-vs-spec-plan-gap-analysis.md
plan_depth: deep
related_plans:
  - docs/plans/2026-06-26-001-feat-spec-plan-enterprise-readiness-plan.md
---

# refactor: spec-plan 升级为顶尖架构师级技术方案生成器(合并升级方案)

> 本文档同时是「升级技术方案」与「好技术方案的范例」——采用 Google design-doc anatomy(Context/Scope → Goals/Non-goals → Actual Design → Alternatives → Cross-cutting → Lifecycle)叠加 spec-plan 自身 plan-template,以身作则示范它要让 spec-plan 产出的方案长什么样。

## Summary

把分散在两份前序文档的结论——方案 001(企业生产风险就绪度门)与 gap-analysis 诊断(顶尖架构师 7 动作工作流 + G1-G4 缺口 + specialist 建/不建决策 + eval 判据)——合并为**一份可执行的 spec-plan 升级技术方案**。核心命题经前序 gap-analysis 多轮核实已收敛:spec-plan 的架构轴(work-nature 选 medium + risk/surface 触发 specialist + plan-depth right-sizing)已业界顶尖,**升级 = 把已有能力在高风险场景"显式触发",而非新增能力**。落地形态是 1 个新 reference + deepening 评分扩展 + 3 句 enterprise rubric + eval 增量,**零新 agent、零破 core template、零打破 plan-only 边界**。

---

## 维护者决策摘要(TL;DR)

- **做什么**:在 `spec-plan` 增一个条件化 `enterprise-plan-review.md` reference(触发矩阵 + 硬闸 + Review Rubric),把企业风险触发器接入既有 deepening risk-bonus 与已映射 specialist;Review Rubric 纳入 3 句(高风险 KTD 显式 trade-off / privacy 含非 DB 个人数据流 / 数据 ML 触发检查)。
- **不做什么**:不新建任何 specialist(privacy 复用 data-integrity-guardian+security-sentinel;data/ML 复用 migration-expert+integrity-guardian,ML 特有列 explicit opt-in);不改 core plan template;不加"研发端"分类轴(现行 medium+specialist 轴更优);不脚本化语义判决。
- **凭什么**:对照一手 Google "Design Docs at Google" 标准 + RFC/ADR/arc42/C4/AWS Well-Architected 旁证,逐项核实 spec-plan 现状,4 个候选方向(A/B/C/D)经 4 轮证伪/降级到"3 句 rubric"。
- **怎么交付**:3 个 workstream(WS1 企业就绪度=001 / WS2 横切+trade-off rubric / WS3 eval+验证),分 P0/P1/P2,详见 §Phased Delivery。

---

## Context & Scope(背景与范围,客观事实)

`spec-plan` 是 spec-first 链路(Codebase→Spec→Plan→Tasks→Code→Review→Knowledge)的 HOW 层:planning-only、decision-first、portable artifact,不写实现代码、不跑测试、不进执行;`spec-brainstorm` 定 WHAT、`spec-plan` 定 HOW、`spec-work` 执行。现状能力已含:problem frame、requirements trace(origin A/F/AE)、Direct Evidence、KTD、U-ID 稳定的 implementation units、test scenarios、System-Wide Impact、Risks、deepening(risk-weighted scoring + specialist 派发)、handoff 阻断、Lightweight/Standard/Deep right-sizing。

两份前序产物:
- `docs/plans/2026-06-26-001-...-plan.md`:企业生产风险就绪度门(条件触发 + 附录 + deepening 加权),已含 R10 三句 rubric。
- `docs/项目审查/详细审查/2026-06-26-architect-workflow-vs-spec-plan-gap-analysis.md`:架构师 7 动作工作流对标、G1-G4 缺口、specialist 决策、§9 eval 判据、TL;DR。

本文档范围:把上述合并成单一升级技术方案,补齐"为什么这样升级"的 trade-off 论证与分阶段交付,使其可直接进入 `spec-work` 执行。

---

## Goals / Non-goals

### Goals

- G-1. 让 spec-plan 在**高风险场景**自动要求"具体 plan-time 决策或显式待确认",杜绝泛泛 `handle errors / add monitoring / consider rollback`。
- G-2. 让 spec-plan 产出的方案在 trade-off 表达、横切关注点(security/privacy/observability)、验收判据上**对齐顶尖架构师 design doc 标准**。
- G-3. 全部升级守住三条边界:不变实现脚本、不变巨型模板、不写死组织规范;复用不新建。
- G-4. 升级可被确定性测试锚定(reference 存在性/source-ref/runtime 投影)+ eval 语义判据覆盖。

### Non-goals(显式排除)

- N-1. **不**把 spec-plan 变成"技术方案全量模板"(报告反对的大而全 12 章形态)。
- N-2. **不**新增 agent / specialist(privacy、data/ML 均复用现有)。
- N-3. **不**为不同研发端做模板分叉;不引入"研发端"作为新分类轴。
- N-4. **不**破坏 plan-only:升级只影响"plan 要包含什么",不让 spec-plan 执行 review/测试/代码。
- N-5. **不**脚本化语义判决:脚本只校验存在性/shape,风险闭合由 LLM 判断。
- N-6. **不**内置任何组织特定禁用技术清单(走 project policy hook,缺省不硬编码)。

---

## 顶尖架构师工作流对齐(本升级的理论基座)

源自 gap-analysis §1,顶尖架构师由需求输出技术方案是 7 个思维动作(非填模板),逐一对齐现状与本升级的处理:

| # | 架构师动作 | spec-plan 现状 | 本升级动作 |
|---|---|---|---|
| 1 | 重构问题(context/facts 分离,goals/非负向 non-goals) | ✓ 强 | 不动 |
| 2 | 解空间定界(degree of constraint) | △ 有 plan-depth/Output Structure 但无显式定形维度 | 仅 HLD 3.4 加一句 greenfield"先立规则收敛"(低优先,可选) |
| 3 | 方案选择以 trade-off 为中心 | △ KTD 生成期提示弱(deepening 已兜底) | WS2:enterprise rubric 加"高风险 KTD 显式 trade-off" |
| 4 | Alternatives considered | ✓ 强 | 不动 |
| 5 | Cross-cutting(security/privacy/observability,尽早 engage) | △→✗ privacy 几乎空白 | WS2:privacy/observability 作显式触发器 + rubric 声明 |
| 6 | right-sizing + 何时不写 | ✓✓ 极强 | 不动(WS 全部条件触发,守 right-size) |
| 7 | lifecycle(活文档,尽早 senior review) | ✓ deepening/status/handoff/doc-review | 不动 |

> 结论:7 动作中 5 项已对齐或更强,升级集中在动作 3(trade-off)和动作 5(横切尤其 privacy),即 WS2。

---

## Actual Design(升级设计:overview → workstream)

### Overview

```text
高风险信号(资金/权限/迁移/高并发/定时任务/灰度/个人数据/数据ML...)
        │
        ▼  [SKILL.md Plan Quality Bar 后:Enterprise/High-Risk Readiness 原则 + 指针]
        ▼
┌────────────────────────────────────────────────┐
│ references/enterprise-plan-review.md (新增, WS1) │
│  1 Trigger Matrix(8 类风险 + 研发端 lens 行)     │
│  2 Required Appendix by Trigger                  │
│  3 Hard Gates(缺失→OQ/阻断 handoff,非脚本否决)   │
│  4 Review Rubric ← WS2 注入 3 句:                │
│     · 高风险 KTD 显式 trade-off                    │
│     · privacy 显式声明(含非 DB 个人数据流)         │
│     · 数据/ML 触发 schema 演化/回填/一致性          │
│  5 Non-Goals(policy hook / 无组织清单 / 轻量不填) │
└───────────────┬──────────────────────────────────┘
                │ deepening 评分消费(WS1)
                ▼  [deepening-workflow.md 5.3.3 risk-bonus += 企业触发器]
                ▼  [5.3.4 触发器→已映射 specialist:复用 deepening 现有 specialist,不新增]
                ▼
┌────────────────────────────────────────────────┐
│ 验证(WS3):spec-plan-contracts.test.js          │
│  + output-quality-cases.json(8 高风险+1 反例)    │
│  + §9 通过/不通过判据 → objective_assertions      │
└────────────────────────────────────────────────┘
plan-template.md:仅 Deep 扩展登记企业附录类型,core template 零改动
```

### Workstream 分解

本升级按"已裁决"分层,而非平铺缺口。**WS1 即方案 001**(不重复其 7 个实现单元,引用之);WS2/WS3 是本文档新增的合并层。

#### WS1 — 企业生产风险就绪度门(= 方案 001,纳入)

- 内容:新增 `enterprise-plan-review.md`(触发矩阵 + 硬闸 + rubric + 非目标)、SKILL 原则与指针、deepening 触发器与已映射 specialist、plan-template Deep 附录登记、policy hook 占位、planning-flow depth 轻量联动、contract test + eval + 双宿主 runtime。
- 状态:已有完整 plan(001 的 U1-U7),本文档不复制,作为 WS1 直接引用 `docs/plans/2026-06-26-001-...-plan.md`。
- 与本文档关系:001 是 WS1 的权威实现规格;002 提供 WS1/WS2/WS3 的统一 trade-off 论证与排期。

#### WS2 — 横切关注点 + trade-off rubric(本文档新增合并层)

对应 G1(trade-off)+ G2(cross-cutting/privacy),落地为 enterprise Review Rubric 的 3 句(已在 001 R10 登记,本文档补足设计论证):

- **WS2-a 高风险 KTD 显式 trade-off**:高风险决策的 KTD 必须表达"选了什么 / 牺牲什么 / 为何在 goals 下可接受"。deepening `:41`(rationale 缺 tradeoffs)/`:201`(record real tradeoff)已兜底,本句强化**生成期**提示,不改 core template。
- **WS2-b privacy 显式声明**:个人数据流(含**非 DB**:日志/埋点/第三方传输/客户端采集)触及时,plan-time 声明保留/最小化/合规边界。deepening 时 DB 侧复用 `spec-data-integrity-guardian`(已含 GDPR/CCPA),访问/传输侧复用 `spec-security-sentinel`。
- **WS2-c 数据/ML 触发检查**:数据改动触发 schema 演化/回填/离在线一致性检查,复用 `spec-data-migration-expert`+`spec-data-integrity-guardian`;ML 特有(特征/模型版本、训练-服务偏斜)低频高专,列 **explicit opt-in**。

##### WS2 rubric 论证详表(正例 / 反例 / 边界 —— 供实现者照写 enterprise-plan-review.md)

| 句 | 正例(通过) | 反例(判失败) | 边界(不要做) |
|---|---|---|---|
| **WS2-a trade-off** | "选 outbox 模式而非双写:牺牲了一次额外写入与最终一致延迟(~秒级),换来跨服务不丢消息;在 goals(订单不丢)下可接受。" | "用 outbox 模式。理由:可靠。"(只有决策+形容词,无牺牲项) | 不要求**所有** KTD 写 trade-off,仅高风险/Standard+ 的 load-bearing 决策;轻量计划不触发 |
| **WS2-b privacy** | "用户行为埋点经 Kafka 流到数仓:含设备 ID(个人数据),plan-time 声明保留 90 天、传输 TLS、数仓侧脱敏;合规边界=不跨境。访问侧 deepening 派 security-sentinel。" | 方案处理用户手机号/位置但全文无任何保留/最小化/合规字样,也无 Deferred | 不替代真实合规评审;不要求 plan 内放真实 PII;DB 侧复用 data-integrity-guardian、非 DB 侧复用 security-sentinel,**不新建 privacy specialist** |
| **WS2-c 数据/ML** | "新增 user_tier 列 + 历史回填:plan-time 给分批回填(每批 1w 行)、回滚=保留旧列双写一周、离在线一致(特征服务与训练快照对齐口径)。" | "做个数据迁移+上线模型。"(无回填策略/无一致性口径) | ML 特有(特征版本/模型版本/训练-服务偏斜)**仅 explicit opt-in**,默认不进 rubric;数据侧复用现有两 specialist,不新建 data/ML specialist |

> 三句的统一边界(防膨胀):均为**条件触发**(命中高风险信号才要求),产出**plan-time 决策或显式 Deferred**(不要求执行 review/测试),且**复用现有 specialist**(零新建)。轻量/常规计划完全不触发——由 WS3 轻量反例 case 守护(对应 N-1/N-4/N-2)。

#### WS3 — eval 判据 + 验证(本文档新增合并层)

对应 gap-analysis §9,把 001 U7 的 8 类高风险 eval 从"列场景"推进到"可判定判据":

- 8 类场景(权限接口/高QPS/MQ写/数据迁移/定时任务/灰度/PRD覆盖缺口/API契约)+ 1 类轻量反例,各有"通过(具体决策/参数/显式 Deferred)vs 不通过(泛泛带过/静默省略)"判据,转写为 `objective_assertions`。
- 沿用现有 eval schema,落地须标注 `missing_evidence`,LLM/reviewer 语义判定,不脚本化。

##### WS3 eval case 草样(贴合 `output-quality-cases.json` v1 schema —— 供实现者直接照抄)

> schema_version `spec-first.spec-plan-output-quality-cases.v1`,字段:`id`/`input`/`input_files`/`baseline_risks`/`with_skill_expectations`/`objective_assertions`/`expected_outcome`/`evidence_status`/`missing_evidence`。下列 2 个为示范(高风险正向 + 轻量反例),其余 7 个按 §9 判据表同构补全。

```json
{
  "id": "highrisk-permission-api-requires-concrete-authz",
  "input": "Plan adding a permission-gated admin API endpoint that exposes user records.",
  "input_files": [
    { "path": "skills/spec-plan/references/enterprise-plan-review.md", "evidence": "file-backed fixture" }
  ],
  "baseline_risks": [
    "Plan says 'add permission check' without naming role/resource/action or audit point.",
    "Plan treats authz as a one-liner and never states the exploit surface it closes."
  ],
  "with_skill_expectations": [
    "Plan names the authz model (role/resource/action), the enforcement point, and the audit landing.",
    "Privacy of exposed user records is stated (retention/minimization) or explicitly Deferred.",
    "High-risk KTD shows trade-off: what was given up and why acceptable under goals."
  ],
  "objective_assertions": [
    "An authz subject/resource/action triple appears, not just 'add permission check'.",
    "If personal data is exposed, a retention/minimization/compliance line or explicit Deferred is present.",
    "The enterprise rubric trigger for security/permission is reflected without scripted verdict."
  ],
  "expected_outcome": "A high-quality plan turns a permission endpoint into concrete plan-time authz + privacy decisions, not a vague 'add permission check'.",
  "evidence_status": "file-backed fixture",
  "missing_evidence": ["model execution evidence", "human adjudication"]
}
```

```json
{
  "id": "lightweight-crud-stays-lean-no-enterprise-appendix",
  "input": "Plan a small CRUD change: add an optional 'nickname' field to an existing profile form.",
  "input_files": [
    { "path": "skills/spec-plan/references/plan-template.md", "evidence": "file-backed fixture" }
  ],
  "baseline_risks": [
    "Enterprise appendix or cross-cutting sections get injected into a trivial CRUD plan (template bloat).",
    "Lightweight plan is forced through high-risk rubric it does not need."
  ],
  "with_skill_expectations": [
    "Plan stays lightweight: no enterprise risk appendix, no privacy/observability section.",
    "No high-risk trigger fires; the plan reads as a compact 2-4 unit change."
  ],
  "objective_assertions": [
    "No Enterprise Risk / API Contract / Data Migration / Scheduled Job appendix appears.",
    "No privacy or rollout-gate section is added for a non-personal, non-risky field.",
    "Plan depth stays Lightweight; right-size is preserved (guards N-1)."
  ],
  "expected_outcome": "A high-quality plan keeps trivial CRUD lean and proves the enterprise rubric does not bloat low-risk work.",
  "evidence_status": "file-backed fixture",
  "missing_evidence": ["model execution evidence", "human adjudication"]
}
```

> 实现期提醒:其余 7 个 case(高QPS/MQ写/数据迁移/定时任务/灰度/PRD覆盖缺口/API契约)按 §9 判据表"通过列→`objective_assertions`、不通过列→`baseline_risks`"同构补全;每个 case 必含 `missing_evidence`(`README.md` 契约);`source_refs` 仅 repo-relative source path;case id 唯一。

---

## Alternatives Considered(为什么不是别的形态)

- **Alt-1 core template 扩章(企业 12 章默认化)**:拒绝。信噪比崩塌,违反 right-size + Light contract,轻量计划被拖重(N-1)。
- **Alt-2 独立 enterprise/architect workflow**:拒绝。企业风险/架构质量是 planning 的 lens,拆出去割裂 plan 闭环;只有公开 workflow 是用户入口。
- **Alt-3 新建 privacy / data-ML specialist**:拒绝(现在)。privacy 能力已部分在 data-integrity-guardian;data/ML 数据侧已覆盖,ML 特有低频。新建成本(profile+映射+双宿主投影+测试+会话缓存)与收益不匹配,违反 80/20(N-2)。
- **Alt-4 "研发端"作为新分类轴**:拒绝。前端/后端/基础设施/库SDK 全已被现行 medium 表 + specialist 映射覆盖;研发端只是 work-nature 的相关变量,加轴制造冗余(N-3)。
- **Alt-5 脚本化硬闸(脚本判定风险是否覆盖)**:拒绝。脚本无法做语义判断会制造假闸,违反 Scripts-prepare-LLM-decides(N-5)。

---

## Cross-cutting Concerns(本升级自身的横切影响)

- **Security/Privacy**:升级新增的是"要求 plan 声明 privacy",不处理真实个人数据,无新数据敞口;reference 内不得出现真实 PII 或组织清单。
- **双宿主 parity**:Claude(`/spec:plan`)+ Codex(`$spec-plan`)必须同步,`spec-first init` 投影 + contract test 投影断言保证。
- **Runtime/source 边界**:只改 source(skills/),不手改 `.claude/`/`.codex/`/`.agents/skills/` mirror;drift 用 `spec-first init` 修。
- **向后兼容**:core template 零改动 + 全部条件触发,存量轻量/常规 plan 行为不变(可由 WS3 轻量反例 case 守护)。

---

## Lifecycle(本升级与产物的生命周期 —— 补全 Google anatomy 第 7 节)

> 对应架构师动作 7(活文档)。Google design-doc anatomy 的 Lifecycle = 创建/迭代 → 评审 → 实现 → 维护;本节交代 002 自身与升级产物如何走完这条线。

- **创建/迭代**:002 由 loop 多轮迭代成型(见 §Loop 进度);WS1 规格在 001,WS2/WS3 论证在本文档。
- **评审**:本升级进入实现前应走 `spec-doc-review`(对 002+001)或维护者一次 senior review;高风险 rubric 改动建议尽早让维护者确认裁决(TL;DR 表)。这与 Google "尽早 senior review" 一致。
- **实现**:按 Phased Delivery(P0=001 核心 → P1=WS2 rubric+001 附录 → P2=WS3 eval),经 `spec-work` 执行;每阶段 `spec-first init` 同步双宿主 + contract test 守护。
- **维护**:升级后 `enterprise-plan-review.md` 是活 reference——新风险类型/新 specialist 出现时增量更新触发矩阵与映射;eval case 随真实失败形态增补。spec-plan 自身的 deepening/status/handoff/doc-review 生命周期机制不变(故对齐表标"不动")。
- **状态机**:本 plan frontmatter `status: active`;P0 落地后可转 `partially-shipped`,WS1/2/3 全落地且 init+test 通过后转 `completed`。

---

## 反思与一致性审查(loop 第 4 轮)

第 4 轮通读全文做反思性审查,发现并修正 5 点(诚实记录,体现"反思"环节):

1. **[已修正] Lifecycle anatomy 缺节**:文档声称采用含 Lifecycle 的 Google anatomy,但原稿无 Lifecycle 章节(动作 7 标"不动"却没交代产物生命周期)。已补 §Lifecycle。
2. **[已修正] 图中"复用现有 6+2 个"无出处**:gap-analysis 只确认"复用 deepening 已映射 specialist",未给"6+2"数字。已改为"复用 deepening 现有 specialist,不新增"。
3. **[本节澄清] 动作 2 口径**:对齐表"仅 HLD 3.4 加一句 greenfield"应与 gap-analysis §6.3 一致——C 已降级为"可不做",仅最低优先可选。以诊断为准,002 不强推动作 2。
4. **[本节澄清]"7 轮核实"指代**:Summary/TL;DR 的"7 轮核实"指 **gap-analysis 形成过程的 loop 轮次**,非本文档 002 的迭代轮次(002 自身轮次见 §Loop 进度)。两者是不同 loop,不可混淆。
5. **[确认无误] 三文档交叉引用**:001↔gap-analysis↔002 的路径与口径经核实一致(001 含 R10+gap-analysis 出处;002 Sources 指向两者;无 Create 文件冲突)。

> 审查结论:除上述措辞/补节外,002 无内部逻辑矛盾;三 workstream 与 gap-analysis 的 G1-G4/specialist 决策/§9 判据一一对应;Non-goals 与 Alternatives 闭合。文档可进入 `spec-doc-review` 或实现。

---

## Implementation Units(本文档合并层的执行单元;WS1 见 001)

> WS1 的实现单元在 001(U1-U7),此处不重复。下列 U 仅覆盖 WS2/WS3 合并层中、001 尚未独立成单元的部分。

### U1. 在 enterprise reference 的 Review Rubric 落实 WS2 三句(合并论证版)

**Goal:** 把 WS2-a/b/c 的设计论证(非仅 R10 的一行登记)写进 `enterprise-plan-review.md` 的 Review Rubric,含每句的"通过/不通过"语义与复用 specialist 映射。

**Requirements:** [G-1, G-2, G-3]

**Dependencies:** 001 U1(reference 先存在)

**Files:**
- Modify: `skills/spec-plan/references/enterprise-plan-review.md`(001 U1 创建后)

**Approach:**
- trade-off 句:给正例(决策+牺牲+可接受理由)与反例(只有决策+理由)。
- privacy 句:明确"非 DB 个人数据流"清单(日志/埋点/第三方传输/客户端采集),复用 data-integrity-guardian + security-sentinel。
- 数据/ML 句:数据侧复用两 specialist;ML 特有标 explicit opt-in,不进默认。
- 全部 plan-only 措辞:产出 plan-time 决策或显式 Deferred,不要求执行。

**Test scenarios:**
- Integration: WS3 contract test 断言 rubric 含三句 canonical 锚点 → 通过
- Error path: rubric 出现"执行 review/跑测试"措辞或组织清单 → 评审判失败

**Verification:** rubric 三句在场、含正反例、复用 specialist 为现存 agent、无 plan-only 违例

### U2. WS3 eval 判据落地到 output-quality-cases.json(合并层)

**Goal:** 把 gap-analysis §9 的 8+1 判据转写为符合现有 schema 的 eval case 设计,供 001 U7 实现期直接采用。

**Requirements:** [G-1, G-4]

**Dependencies:** U1, 001 U7

**Files:**
- Modify(实现期): `skills/spec-plan/evals/output-quality-cases.json`
- Modify(实现期): `tests/unit/spec-plan-contracts.test.js`

**Approach:**
- 每个 case 含 `input`/`input_files`/`baseline_risks`/`with_skill_expectations`/`objective_assertions`/`expected_outcome`/`evidence_status`/`missing_evidence`。
- objective_assertions 直接来自 §9 判据表"通过列"。
- 轻量反例 case 断言"无企业附录/横切提示"(守 N-1)。

**Test scenarios:**
- Happy path: `output-quality-cases.json` 通过 shape/uniqueness/declared-coverage 校验
- Error path: 任一 case 缺 `missing_evidence` → contract test 失败

**Verification:** 9 个新 case 校验通过;轻量反例守护不膨胀

> 注:U2 与 001 U7 高度重叠——若 001 先落地,U2 退化为"把 §9 判据并入 U7 的 eval 设计",不重复建文件。

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| 002 与 001 内容重复/冲突 | 002 不复制 001 实现单元,WS1 引用 001;U1/U2 标注与 001 U1/U7 的重叠与退化关系 |
| WS2 三句滑向"所有 plan 必填" | 全部条件触发 + 轻量反例 case(WS3)守护;rubric 明确轻量不填 |
| privacy/ML 误判为"需新建 specialist" | Alternatives Alt-3 + 复用映射写死在 rubric;ML 特有显式 opt-in |
| 双宿主 runtime 投影漂移 | contract test 投影断言 + `spec-first init` |
| 与并发 spec-prd 工作线在 CHANGELOG/settings 冲突 | 只动 docs/plans/002 + 诊断;CHANGELOG 重读再写;不碰 .claude/settings.json |

---

## Phased Delivery

- **P0(WS1 核心)**:执行 001 的 U1+U2+U3+U7(enterprise reference + SKILL 指针 + deepening 触发器 + 测试/eval/runtime)。这是最小可行升级。
- **P1(WS2 合并层)**:本文档 U1(Review Rubric 三句论证版)+ 001 U4/U5/U6(Deep 附录登记 + policy hook 占位 + planning-flow depth 联动)。
- **P2(WS3 + 可选)**:本文档 U2(eval 判据并入 U7)+ gap-analysis §9 全量判据 + 动作 2 的 greenfield 一句(最低优先,可不做)。
- **Deferred**:project policy hook 完整落地;ML 特有 specialist(explicit opt-in,取决于真实频次);Enterprise Readiness fresh-source eval(host 支持 dispatch 时)。

---

## Open Questions

### Resolved During Planning

- 是否新建 specialist?— 否(Alt-3,4 轮核实)。
- 是否加研发端轴?— 否(Alt-4)。
- 是否破 core template?— 否(WS2 全落 rubric/deepening)。

### Deferred to Implementation

- 002 与 001 落地顺序:建议先 001(P0)再 002 合并层,避免 U1/U2 与 001 U1/U7 重复建文件。
- ML 特有 specialist 的真实频次:需用户/使用数据判断,默认不做。
- project policy hook 文件路径/schema:依赖实现期读 `src/cli/` 既有 config 机制。

---

## Sources & References

- **Origin(诊断)**:`[docs/项目审查/详细审查/2026-06-26-architect-workflow-vs-spec-plan-gap-analysis.md](docs/项目审查/详细审查/2026-06-26-architect-workflow-vs-spec-plan-gap-analysis.md)`
- **WS1 权威实现规格**:`[docs/plans/2026-06-26-001-feat-spec-plan-enterprise-readiness-plan.md](docs/plans/2026-06-26-001-feat-spec-plan-enterprise-readiness-plan.md)`
- 一手:Malte Ubl, "Design Docs at Google", https://www.industrialempathy.com/posts/design-docs-at-google/
- 旁证(内部知识):IETF/Rust/React RFC、ADR(Nygard)、arc42、C4、AWS Well-Architected、Google SRE PRR、"Scaling Engineering Teams via RFCs"(Pragmatic Engineer)
- 现状 source:`skills/spec-plan/SKILL.md`、`skills/spec-plan/references/{plan-template,deepening-workflow,planning-flow}.md`、`agents/*.agent.md`、`tests/unit/spec-plan-contracts.test.js`

---

## Loop 进度(本文档的迭代轨迹)

> 注:本节是 002 自身的 loop 迭代轨迹;Summary/TL;DR 提到的"7 轮核实"指更早 gap-analysis 形成过程的另一组 loop 轮次,二者不同。

- **第 1 轮**:产出 002 完整骨架与全部承重章节(合并 001 + gap-analysis,Google design-doc anatomy)。
- **第 2 轮**:深化 WS2 rubric 论证详表(trade-off/privacy/数据ML 各配正反例+边界);核实 002↔001 边界(U1 Modify 依赖 001 U1、U2 退化并入 001 U7)。
- **第 3 轮**:深化 WS3 eval case 草样(2 个贴合 schema、json 校验合法、可照抄)。
- **第 4 轮**:反思性全文审查,补 §Lifecycle 与 §反思一致性审查,修正"6+2 specialist"等 5 点。
- 后续:边际递减时诚实收尾;实现交由 `spec-work` 按 Phased Delivery 执行。
