---
title: "feat: spec-plan 企业生产风险就绪度门(条件触发 + 评审硬闸)"
type: feat
status: active
date: 2026-06-26
spec_id: 2026-06-26-001-spec-plan-enterprise-readiness
origin: docs/项目审查/详细审查/2026-06-25-tech-design-doc-spec-plan-integration-report.md
plan_depth: deep
---

# feat: spec-plan 企业生产风险就绪度门(条件触发 + 评审硬闸)

## Summary

把《技术方案设计文档》调研报告的核心能力——"风险识别 + 详细设计触发 + 评审硬闸 + 企业级附录"——以**条件触发 + 附录化 + deepening 加权**的方式吸收进 `spec-plan`,让它从"高质量技术计划器 + agent handoff 优化器"升级为额外携带"企业生产风险就绪度门"。新增能力默认对轻量/常规计划完全静默,只在命中资金/安全/权限/数据迁移/高并发/定时任务/灰度回滚等高风险场景时触发更深设计要求与硬闸检查,**不扩大 core template、不写死组织规则、不破坏 plan-only 边界**。

---

## Decision Brief

- **推荐方案:** 新增一个条件化 reference `references/enterprise-plan-review.md`(触发矩阵 + 硬闸 rubric + 非目标),在 `SKILL.md` 加一条轻量原则与一个触发指针,在 `deepening-workflow.md` 把企业风险触发器接入既有 risk-bonus 评分与已映射的 specialist agents,在 `plan-template.md` 仅把企业附录作为 Deep 可选扩展类型。core template 一行不动。
- **关键决策:** 企业能力是"评分加权 + 条件附录",不是"默认章节";硬闸是"plan-time 决策完整性闸"(缺失则进 Open Questions 或阻断 handoff),不是脚本化语义判断;组织禁用技术清单做成 project policy hook,缺省不硬编码。
- **验证重点:** `spec-plan-contracts.test.js` 增加新 reference 的存在性/source-ref 安全/runtime 投影断言;`output-quality-cases.json` 增量覆盖报告 7.4 的 8 类风险场景与"轻量 CRUD 不膨胀"反例;`spec-first init` 后确认 Claude/Codex 双宿主 runtime mirror 同步。
- **最大风险 / 边界:** 最大风险是企业附录滑向"所有 plan 都填满的大模板",违反 right-size artifact。边界:轻量计划必须证明零附录;硬闸只产 plan-time 决策或显式待确认,不伪称已执行 review/测试。

---

## Problem Frame

调研报告(`docs/项目审查/详细审查/2026-06-25-tech-design-doc-spec-plan-integration-report.md`,源文 https://mp.weixin.qq.com/s/ira0bcNuYUILk_X4zy7R0g)分析了一篇企业级《技术方案设计文档》评审模板,结论是:该模板的价值不在"模板项多",而在它把"方案完整性"转成了**可审查的工程机制**——触发规则(什么模块必须详细设计)、硬闸机制(资金/权限未设计、PRD 未覆盖、缺灰度回滚可直接否决)、参数化要求(重试次数、超时关系、批次、TP99、回滚阈值)、专项模板(定时任务、数据迁移、接口兼容)。

`spec-plan` 当前已具备高质量 planning artifact 骨架(problem frame、requirements trace、file/test paths、decisions with rationale、test scenarios、dependency/sequencing),且 `deepening-workflow.md` 已是 risk-weighted scoring pass。**缺口不是章节,而是一套企业高风险场景下的条件化触发规则 + 评审硬闸语义**:当前高风险计划可以用泛泛的 "handle errors / add monitoring / consider rollback" 蒙混过关,而不被要求给出具体 plan-time 决策。

本方案目标:补足这层"企业生产风险就绪度",同时严格守住 `spec-plan` 的三条边界(不变实现脚本、不变巨型模板、不写死组织规范)。

---

## Requirements

- R1. 新增企业风险**触发矩阵**:枚举资金/账务/支付、认证/授权/权限/审计/敏感数据、高 QPS/大数据量/长耗时、跨服务 RPC/MQ/异步事件、状态机/补偿/死状态、DDL/数据迁移/不可逆变更/缓存一致性、后台定时任务、灰度/回滚/功能开关八类硬触发信号。
- R2. 命中触发后,相关章节必须给出**足够的 plan-time 信息**,或显式落入 `Open Questions` / `Deferred to Implementation` 边界;不允许用泛泛风险描述带过。
- R3. 定义**评审硬闸**(hard gates):PRD 功能点未覆盖且无解释、资金/安全/权限未详细设计、数据迁移无回滚/备份、高风险上线无 feature flag/回滚条件、重试设计无最终失败处理——命中则触发 deepening 或阻断 handoff(进 Open Questions 或显式 blocker),**不是脚本化否决**。
- R4. 对 PRD-grade origin 提供可选的 **Requirements Coverage Matrix**(origin item → plan section/U-ID → coverage),`not covered` 且无解释时进 Open Questions 或阻断 handoff。
- R5. 把企业风险触发器接入 `deepening-workflow.md` 既有 risk-bonus 评分与已映射 specialist agents(api-contract / security / data-integrity / data-migration / deployment-verification / performance),不重复造 agent。
- R6. core plan template **零改动**;企业附录(Enterprise Risk / API Contract / Data Migration & Rollback / Scheduled Job Appendix)只作为 Deep plan 可选扩展类型登记。
- R7. 组织特定规则(如集团禁用技术清单)做成 **project policy hook**:repo 提供则读取应用,缺省不硬编码;`spec-plan` 不内置任何组织清单。
- R8. 轻量/常规计划(简单 bugfix、轻量 refactor、常规 UI、CRUD)默认**完全不触发**企业附录,保持 right-size artifact 与高信噪比。
- R9. 验证:`spec-plan-contracts.test.js` 覆盖新 reference 的存在性、source-ref 安全、Claude/Codex runtime 投影;`output-quality-cases.json` 增量覆盖报告 7.4 的 8 类高风险场景 + 1 类轻量反例。
- R10.(外部对标收敛增量,来源见 Sources)enterprise reference 的 Review Rubric 额外纳入 3 句、且**不新建任何 specialist**:① **高风险 KTD 显式 trade-off**(选了什么 / 牺牲什么 / 为何在 goals 下可接受;deepening `:41/:201` 已部分兜底,本句强化生成期提示,不改 core template);② **privacy 显式声明**——个人数据流(含**非 DB**:日志/埋点/第三方传输/客户端采集)触及时,plan-time 声明保留/最小化/合规边界,deepening 时 DB 侧复用 `spec-data-integrity-guardian`(已含 GDPR/CCPA)、访问/传输侧复用 `spec-security-sentinel`;③ **数据/ML 改动**触发 schema 演化 / 回填 / 离在线一致性检查,复用 `spec-data-migration-expert` + `spec-data-integrity-guardian`,ML 特有(特征/模型版本、训练-服务偏斜)低频高专,列为 **explicit opt-in**、不进默认机制。

**Origin actors:** 无(origin 是调研报告,非 brainstorm requirements doc,无 A/F/AE IDs)
**Origin flows:** 无
**Origin acceptance examples:** 无

> 说明:本 plan 的 origin 是审查报告而非带 `spec_id` 的 requirements doc,故生成 plan-local `spec_id`,origin 身份未继承(弱 trace)。

---

## Assumptions

- A1. 假设维护者认可"企业能力 = 条件触发 + 附录 + deepening 加权"而非"core template 扩章"的吸收路径(与报告 0 节、6.1 P0 一致,也与本仓 right-size artifact / Light contract 原则一致)。如维护者更倾向更激进的默认章节化,需回到 brainstorm 重议产品形态。
- A2. 假设 project policy hook 采用"repo 内可选 policy 文件,存在则读取"的轻量约定即可,无需新增 CLI 子命令或 schema;具体 policy 文件路径与格式作为实现期可延后细化的开放项(见 Open Questions)。

---

## Scope Boundaries

- 不修改 `spec-plan` 的 plan-only 安全边界:handoff 前只研究/决策/写 plan,不进实现。
- 不把企业模板 12 章变成 core template 默认章节。
- 不写死任何组织特定禁用技术清单或集团合规规则。
- 不新增可执行 eval runner(`spec-plan` 现状无 `scripts/run-evals.js`,evals 是 maintainer-only review fixtures);企业 eval 落成 `output-quality-cases.json` 增量。
- 不把硬闸做成脚本化语义判决;脚本只校验 reference 存在性与 JSON shape,LLM 仍负责风险语义判断。
- 不新建 specialist agent;复用 `deepening-workflow.md` 已映射的现有 6 个 specialist。

### Deferred to Follow-Up Work

- project policy hook 的具体文件路径、schema 与 CLI 集成:本 plan 只确立"hook 概念 + reference 占位",落地细节延后到单独 plan(避免本次范围蔓延)。
- 报告 P2"接入 `planning-flow.md` 的 planning-depth assessment(高风险→Deep)"的深度自动化:本 plan 先做触发矩阵与 deepening 加权(P0/P1),planning-flow 的 depth 联动作为 U6 轻量接入,完整自动化延后。

---

## Completion Criteria

- 新增 `references/enterprise-plan-review.md` 且被 `SKILL.md` 与 `deepening-workflow.md` 引用,被 `spec-plan-contracts.test.js` 断言存在与 source-ref 安全。
- `plan-template.md` 的 Deep 扩展列表登记企业附录类型,core template diff 为零。
- `output-quality-cases.json` 增量 case 通过 `spec-plan-contracts.test.js` 的 shape/uniqueness/declared-coverage 校验,且每个 case 标注 `missing_evidence`。
- `spec-first init` 后 Claude(`.claude/spec-first/workflows/spec-plan/`)与 Codex(`.agents/skills/spec-plan/`)runtime mirror 含新 reference,投影断言通过。
- `CHANGELOG.md` 按仓库格式记录本次 source 变更。

---

## Direct Evidence Readiness

- target_repo: `.`(spec-first 本仓,单仓)
- evidence_sources: direct source reads(SKILL.md / 4 个 references / 2 个 eval JSON / contract test), `ls`, `rg`, agents 目录枚举
- source_refs: `skills/spec-plan/SKILL.md`, `skills/spec-plan/references/deepening-workflow.md`, `skills/spec-plan/references/plan-template.md`, `skills/spec-plan/references/planning-flow.md`, `skills/spec-plan/evals/output-quality-cases.json`, `skills/spec-plan/evals/README.md`, `tests/unit/spec-plan-contracts.test.js`, `agents/`
- current_revision: branch `leo-2026-06-25-work-update`,version 1.12.0
- worktree_status: `docs/plans/2026-06-25-004-...md` 有未提交修改(与本 plan 无关)
- confidence: high(改动面与现状均已直读核实)
- limitations: 未实跑修改后的 `spec-plan` 行为(plan-only);specialist agent 内部能力未逐一读 profile,仅核实存在性与映射

---

## Direct Evidence

- repo_scope: `skills/spec-plan/**`, `agents/**`, `tests/unit/spec-plan-contracts.test.js`, `CHANGELOG.md`
- source_reads_completed: SKILL.md(全文)、deepening-workflow.md(全文)、plan-template.md(全文)、planning-flow.md(全文)、output-quality-cases.json(全文)、evals/README.md(全文)、调研报告(全文)、CHANGELOG 头部、developer profile
- source_reads_required: 实现期需读 `references/plan-sections.md`、`references/governance-boundaries.md`、`tests/unit/spec-plan-contracts.test.js`(全文)以精确放置断言
- commands_or_tools_used: `ls`, `rg`(specialist 存在性 / deepening 映射 / CHANGELOG plan 跟踪 / 测试锚点)
- impact_on_plan: 两处事实核实直接改变了方案分级(见 Key Technical Decisions KTD2)
- key_findings:
  1. 报告点名的 6 个 specialist agent(api-contract-reviewer / security-sentinel / data-integrity-guardian / performance-oracle / data-migration-expert / deployment-verification-agent)**全部已存在(`agents/*.agent.md`)且已被 `deepening-workflow.md:128-141` 映射**。报告 P3 把"接入 specialist mapping"列为"中期才做"低估了现状——真正缺口是"触发这些 agent 的企业风险触发矩阵 + 硬闸语义",不是 agent 本身。
  2. `spec-plan` **没有** `scripts/run-evals.js`(不同于 `spec-prd`);evals 是 maintainer-only review fixtures,只受 `spec-plan-contracts.test.js` 做 JSON shape / source-ref / case-id 唯一性校验。报告 7.4"新增 eval suite"应落成 `output-quality-cases.json` 增量,而非新建 runner。
  3. `deepening-workflow.md` 已是 risk-weighted scoring(trigger count + risk bonus + critical-section bonus),且 5.3.2 已有"高风险 1+ point 触发"。企业触发器是对既有 risk-bonus 的扩充,不是新机制。
  4. `plan-template.md` 已有 System-Wide Impact(interaction graph / error propagation / state lifecycle / API surface parity / integration coverage)、Risks & Dependencies、Documentation / Operational Notes,以及 Deep 扩展(Risk Analysis / Phased Delivery / Operational Notes)。企业附录是 Deep 扩展的新登记项,与现有结构兼容。
  5. CHANGELOG 硬约束:任何 docs/plans source 变更都需追加条目(已大量先例),作者 `leokuang`,版本 `v1.12.0`。
- limitations: 未实跑行为;policy hook 具体形态未定(已落 Deferred);未读 specialist agent profile 全文

---

## Context & Research

### Relevant Code and Patterns

- `skills/spec-plan/SKILL.md` — 主 spine,Plan Quality Bar(:102-115)是新增"企业就绪度原则"的锚点;Phase 5.3 deepening gate(:406-433)是触发入口
- `skills/spec-plan/references/deepening-workflow.md` — 5.3.3 评分(:5-87)、5.3.4 section-to-agent 映射(:100-142)是企业触发器与硬闸的最佳集成点
- `skills/spec-plan/references/plan-template.md` — core template(:7-258)零改动;Deep 扩展(:260-308)登记企业附录
- `skills/spec-plan/references/planning-flow.md` — 0.6 Assess Plan Depth(:128-157)是企业风险联动 depth 的轻量接入点
- `tests/unit/spec-plan-contracts.test.js` — reference 集合断言(:38/56/119 等)、source-ref 安全、runtime 投影模式
- `skills/spec-plan/evals/output-quality-cases.json` + `README.md` — eval 增量的 shape 与 declared-coverage 契约

### Institutional Learnings

- 本仓既有结论(报告 5 节)与本方案一致:`spec-plan` 不应退化为 `writing-plans` 执行脚本,但可吸收"就绪度智能";本次新增的是"企业生产风险就绪度"这条演进线。
- `spec-prd` 近期落地的 producer-local closure-contract / readiness-lens(CHANGELOG v1.12.0 多条)给出了"声明 + checker 只校验自相矛盾,不脚本化语义判决"的可复用范式,本方案硬闸语义沿用该哲学。

### External References

- 业界对标(advisory,作为 reference 内容素材,不写死):AWS Well-Architected(可靠性/安全/性能/成本/运维卓越多支柱 review)、Google SRE production readiness review(PRR)、consumer-driven contract testing、example mapping / Three Amigos(验收对齐)。这些印证"按风险维度做 production readiness gate"是成熟实践,但 `spec-plan` 只取其"条件触发 + 决策完整性"内核,不引入具体厂商清单。

---

## Key Technical Decisions

- **KTD1 — 吸收形态 = 条件触发 + 附录 + deepening 加权,而非 core template 扩章。** 理由:守住 right-size artifact 与 Light contract;报告 0 节与 4.2 节明确反对"所有 plan 填满企业模板"。被拒方案:把 12 章塞进 core template(信噪比崩塌)。
- **KTD2 — specialist 接入提前到 P0/P1,而非报告的 P3。** 理由:6 个 specialist 已存在且已被 deepening 映射(Direct Evidence key_finding 1),真正缺口是触发语义。本方案只需在 enterprise reference 与 deepening 评分里把"企业风险触发器 → 已映射 specialist"的对应关系写清,无需等中期。
- **KTD3 — 硬闸 = plan-time 决策完整性闸,不是脚本化否决。** 理由:符合"Scripts prepare, LLM decides";脚本只校验 reference 存在与 JSON shape,风险是否真正闭合由 LLM 判断,未闭合则进 Open Questions 或显式 blocker。被拒方案:写脚本判定"是否覆盖资金风险"(脚本无法做语义判断,会制造假闸)。
- **KTD4 — 组织规则 = project policy hook,缺省不硬编码。** 理由:报告 4.2.1 与本仓"不内置集团规则"边界;通用 skill 不应携带任何组织清单。本 plan 只确立 hook 概念,具体形态 Deferred。
- **KTD5 — eval = `output-quality-cases.json` 增量,不新建 runner。** 理由:Direct Evidence key_finding 2,`spec-plan` 无 eval runner,新建会偏离现状架构;增量 case 受现有 contract test 校验即可。

---

## Open Questions

### Resolved During Planning

- 报告点名 specialist 是否需新建?— 已核实全部存在且已映射,无需新建(KTD2)。
- eval 是否需新建 runner?— 不需要,落 `output-quality-cases.json` 增量(KTD5)。
- 是否改 core template?— 不改,只登记 Deep 扩展(KTD1/R6)。

### Deferred to Implementation

- project policy hook 的具体文件路径(如 `.spec-first/policy/*.md` 或 repo 根 policy)、schema 与是否需要 CLI 读取:依赖实现期对既有 `src/cli/` policy/config 机制的直读,本 plan 不预判(A2 / Deferred to Follow-Up)。
- enterprise reference 的精确 section 编号与 SKILL.md 指针的措辞:依赖实现期读 `plan-sections.md` 与 `governance-boundaries.md` 现行 STOP-指针风格后对齐,避免与既有 reference 加载契约冲突。
- Requirements Coverage Matrix 放进 plan-template Deep 扩展还是只放 enterprise reference:依赖实现期权衡 PRD-grade origin 频率与模板噪声。

---

## High-Level Technical Design

> *本图示意吸收路径与各文件职责,是评审用的方向性指引,不是实现规范。实现 agent 应将其作为上下文,而非照抄的代码。*

```text
高风险信号(资金/权限/迁移/高并发/定时任务/灰度...)
        │
        ▼
┌─────────────────────────────────────────────┐
│ SKILL.md: Plan Quality Bar 后新增            │
│ "Enterprise / High-Risk Readiness" 轻量原则   │
│ + 一个指向 enterprise-plan-review.md 的指针    │
└───────────────┬─────────────────────────────┘
                │ 命中触发
                ▼
┌─────────────────────────────────────────────┐         ┌──────────────────────────────┐
│ references/enterprise-plan-review.md (新增)   │         │ plan-template.md (近零改动)     │
│  1. Trigger Matrix(8 类硬触发)               │ 登记附录 │  Deep 扩展列表 += 企业附录类型   │
│  2. Required Appendix by Trigger             │────────▶│  (core template 一行不动)       │
│  3. Hard Gates(5 条,缺失→OQ/阻断 handoff)    │         └──────────────────────────────┘
│  4. Review Rubric(覆盖/状态/契约/数据/容量/运维)│
│  5. Non-Goals(无组织清单/无实现代码/轻量不填)  │
└───────────────┬─────────────────────────────┘
                │ deepening 评分消费触发器
                ▼
┌─────────────────────────────────────────────┐
│ references/deepening-workflow.md             │
│  5.3.3 risk-bonus += 企业风险触发器             │
│  5.3.4 触发器 → 已映射 specialist(复用现有 6 个)│
└─────────────────────────────────────────────┘

校验侧:spec-plan-contracts.test.js(reference 存在/source-ref 安全/runtime 投影)
        + output-quality-cases.json(8 类高风险场景 + 1 类轻量反例)
```

---

## Implementation Units

### U1. 新增 enterprise-plan-review.md reference

**Goal:** 把企业风险触发矩阵、按触发器要求的附录、硬闸、评审 rubric、非目标固化为一个条件化 reference,作为企业能力的单一真相源。

**Requirements:** [R1, R2, R3, R7, R8, R10]

**Dependencies:** None

**Files:**
- Create: `skills/spec-plan/references/enterprise-plan-review.md`

**Approach:**
- 结构对齐报告 6.2:1) Trigger Matrix(8 类硬触发,逐条用本仓中文措辞);2) Required Appendix by Trigger(触发器 → 必需 plan 覆盖 → 建议落入的 plan section);3) Hard Gates(5 条,明确"缺失则进 Open Questions 或阻断 handoff",非脚本否决);4) Review Rubric(覆盖/状态与失败路径/API 与幂等/数据一致性与迁移/性能容量/可观测与上线);5) Non-Goals(无组织清单除非 repo policy 提供、无实现代码、轻量计划不强制)。
- 参数化要求落进 rubric:重试次数/退避/抖动/最终失败处理/与上游超时关系、灰度维度/观察周期/全量准出/回滚阈值/回滚步骤、DDL 锁表/回填策略/执行顺序/回滚路径/缓存一致性、定时任务触发/批次/幂等/并发/监控。
- **外部对标收敛 3 句(R10,来源见 Sources gap-analysis §6.4-6.5)写进 Review Rubric**:① 高风险 KTD 显式 trade-off(选了什么/牺牲什么/为何可接受);② privacy 显式声明含非 DB 个人数据流,复用 `spec-data-integrity-guardian`(GDPR/CCPA)+ `spec-security-sentinel`;③ 数据/ML 触发 schema 演化/回填/离在线一致性,复用 `spec-data-migration-expert`+`spec-data-integrity-guardian`,ML 特有列 explicit opt-in。三者均**不新建 specialist、不破 core template**。
- 措辞遵循 plan-only:rubric 产出的是 plan-time 决策或显式待确认,不得要求执行 review/测试。

**Patterns to follow:**
- `skills/spec-plan/references/governance-boundaries.md` 的 STOP-指针与边界声明风格
- `skills/spec-prd/` 近期 readiness-lens 的"声明 + 自相矛盾才阻断"哲学

**Test scenarios:**
- Integration: U7 contract test 断言该文件存在、被 SKILL 与 deepening 引用、source-ref 仅含 repo-relative source path → 通过
- Edge case: 文件含 8 类触发器 + 5 条硬闸的 canonical 锚点 token → U7 关键字断言命中
- Error path: 若 reference 内出现组织特定清单/实现代码措辞 → 评审应判失败(由 output-quality case 表达,非脚本)

**Verification:**
- 文件存在且结构完整;SKILL/deepening 指针可解析;无组织清单、无实现代码

---

### U2. SKILL.md 增企业就绪度原则与触发指针

**Goal:** 在主 spine 用最小篇幅声明企业就绪度原则,并指向 U1 的 reference,使高风险计划不能用泛泛风险描述带过。

**Requirements:** [R1, R2, R3, R8]

**Dependencies:** U1

**Files:**
- Modify: `skills/spec-plan/SKILL.md`

**Approach:**
- 在 `## Plan Quality Bar`(:102-115)后新增一条简短 `Enterprise / High-Risk Readiness` 原则:命中高风险信号时必须触发更深设计或显式 Open Questions/Deferred,不允许泛泛带过;轻量/常规计划默认不触发。
- 加一个轻量指针(对齐既有 STOP-指针风格):"高风险场景的触发矩阵、必需附录与硬闸 rubric 见 `skills/spec-plan/references/enterprise-plan-review.md`",但**不在 spine 复述**矩阵内容(保持 spine 为 hot-path orchestrator)。
- 不改 plan-only safety contract、不改 handoff 菜单。

**Patterns to follow:**
- SKILL.md 现有 STOP-指针(如 governance-boundaries / planning-flow 的引用方式)

**Test scenarios:**
- Integration: U7 断言 SKILL 含指向 `enterprise-plan-review.md` 的指针字符串 → 通过
- Edge case: 断言企业原则未把矩阵内容内联进 spine(spine 仍精简)→ 通过
- Happy path: 轻量计划场景下 SKILL 措辞明确"默认不触发" → output-quality 反例 case 验证不膨胀

**Verification:**
- spine 新增 ≤ 一小段 + 一个指针;矩阵不内联;plan-only 与 handoff 未变

---

### U3. deepening-workflow.md 接入企业风险触发器与硬闸

**Goal:** 把企业风险触发器接入既有 risk-bonus 评分,并把"触发器 → 已映射 specialist"的对应写清,使高风险计划在 5.3 自动获得更高 deepening 优先级与正确专家。

**Requirements:** [R3, R5]

**Dependencies:** U1

**Files:**
- Modify: `skills/spec-plan/references/deepening-workflow.md`

**Approach:**
- 5.3.3(:5-87):在 risk-bonus 逻辑补充企业风险触发器(资金/权限/迁移/高并发/定时任务/灰度等命中即 high-risk),并在 System-Wide Impact / Risks & Dependencies / Implementation Units 的 section checklist 补企业检查项(PRD coverage、state lifecycle 完整性、API contract 幂等、data migration 回滚、observability、rollout 准出)——引用 U1 reference,不重复展开全文。
- 5.3.4(:100-142):在已有 section-to-agent 映射上,显式标注"企业触发器 → 现有 specialist"对应(api-contract→`spec-api-contract-reviewer`、security/permission→`spec-security-sentinel`、migration→`spec-data-migration-expert`+`spec-data-integrity-guardian`、capacity→`spec-performance-oracle`、rollout→`spec-deployment-verification-agent`)。这些 agent 已被映射,本单元只补"企业触发器视角"的引用,不新增 agent。
- 保留 dispatch authorization / inline fallback 既有约束不变。

**Patterns to follow:**
- deepening-workflow.md 现有 section checklist 与 deterministic section-to-agent mapping 格式

**Test scenarios:**
- Integration: U7 断言 deepening 引用 `enterprise-plan-review.md` 且 specialist 名称仍为现存 agent → 通过
- Edge case: 企业触发器命中高风险但计划已充分 → 评分应快速退出(report passed),不强行 deepen
- Error path: 引用了不存在的 agent 名 → U7 断言失败(防虚构 agent)

**Verification:**
- risk-bonus 含企业触发器;映射 specialist 全部为现存 agent;无重复展开 reference 全文

---

### U4. plan-template.md 登记企业附录为 Deep 扩展

**Goal:** 在 Deep plan 扩展列表登记企业附录类型,core template 零改动,使高风险计划有标准附录槽位而轻量计划不受影响。

**Requirements:** [R6, R8]

**Dependencies:** U1

**Files:**
- Modify: `skills/spec-plan/references/plan-template.md`

**Approach:**
- 仅在 Deep 扩展区(:260-308)登记可选附录类型:`Enterprise Risk Appendix` / `API Contract Appendix` / `Data Migration & Rollback Appendix` / `Scheduled Job Appendix`,各给一行说明 + 指向 U1 reference 的触发条件。
- core template(:7-258)**一行不动**(U7 用 diff 断言保护)。
- 可选:在 Deep 扩展登记 `Requirements Coverage Matrix`(R4),或将其只留在 enterprise reference(见 Open Questions,实现期权衡)。

**Patterns to follow:**
- plan-template.md 现有 Deep 扩展登记格式(Alternative Approaches / Phased Delivery 等)

**Test scenarios:**
- Integration: U7 断言 core template 关键 section(`- **Surface coverage:**` 等已被测断言)未变 → 通过
- Edge case: Deep 扩展列表含企业附录类型 token → 关键字断言命中
- Happy path: 轻量计划渲染时不引入任何企业附录 → output-quality 反例验证

**Verification:**
- Deep 扩展新增 4 类附录登记;core template diff 为零;runtime 投影含更新后模板

---

### U5. 确立 project policy hook 概念占位

**Goal:** 在 enterprise reference 的 Non-Goals/Policy 段落确立"组织规则走 project policy hook、缺省不硬编码"的概念,具体落地 Deferred。

**Requirements:** [R7]

**Dependencies:** U1

**Files:**
- Modify: `skills/spec-plan/references/enterprise-plan-review.md`(U1 创建后补段)

**Approach:**
- 写明:技术选型合规/禁用技术清单等组织特定规则不内置;若当前 repo 提供 policy(路径/格式实现期定),则读取并应用,否则不硬编码,也不阻断计划。
- 明确这是 hook 概念占位,具体文件约定 Deferred 到后续 plan,避免本次范围蔓延。

**Patterns to follow:**
- 本仓"不内置集团规则"边界措辞

**Test scenarios:**
- Integration: U7 断言 reference 含 policy-hook 概念且不含任何具体组织清单 → 通过
- Error path: 出现写死的组织清单 → output-quality case 判失败

**Verification:**
- policy hook 概念在场;无硬编码组织规则;Deferred 明示

---

### U6. planning-flow.md 轻量联动 plan depth(可选)

**Goal:** 在 0.6 Assess Plan Depth 增加一句轻量联动:命中企业高风险触发器时倾向 Standard/Deep,使高风险不被轻量化误判。

**Requirements:** [R1, R2]

**Dependencies:** U1

**Files:**
- Modify: `skills/spec-plan/references/planning-flow.md`

**Approach:**
- 在 0.6(:128-157)depth 分类后加一句:高风险企业触发器(见 enterprise reference)是倾向 Standard/Deep 的 advisory 信号,LLM 仍决定最终 depth(不改 `task-governance-signals` 脚本契约)。
- 保持"helper prepares signals, LLM decides"边界;不新增脚本字段。

**Patterns to follow:**
- planning-flow.md 0.6 现有 advisory-then-LLM-decides 措辞

**Test scenarios:**
- Integration: U7(若覆盖 planning-flow 锚点)断言新增联动句存在且不改脚本契约 → 通过
- Edge case: 轻量 CRUD 命中无企业触发器 → depth 不被抬升

**Verification:**
- depth 联动为 advisory 一句;脚本契约未变

---

### U7. 测试与 eval 覆盖 + 双宿主 runtime 同步

**Goal:** 用 contract test 锁住新 reference 的存在性/安全/投影,用 eval 增量覆盖 8 类高风险场景 + 轻量反例,并经 `spec-first init` 同步双宿主 runtime。

**Requirements:** [R9]

**Dependencies:** U1, U2, U3, U4, U5, U6

**Files:**
- Modify: `tests/unit/spec-plan-contracts.test.js`
- Modify: `skills/spec-plan/evals/output-quality-cases.json`
- (生成物,不手改)`spec-first init` 刷新 `.claude/spec-first/workflows/spec-plan/**`、`.agents/skills/spec-plan/**`

**Approach:**
- contract test:把 `enterprise-plan-review.md` 加入 reference 集合断言(对照现有 deepening/plan-template/planning-flow 断言模式:存在性、source-ref 仅 repo-relative、Claude/Codex runtime 投影含该文件);断言 SKILL/deepening 含企业指针;断言 deepening 引用的 specialist 全为现存 agent;断言 core template 关键 section 未变。
- eval(`output-quality-cases.json`):按现有 schema(`input` / `input_files` / `baseline_risks` / `with_skill_expectations` / `objective_assertions` / `expected_outcome` / `evidence_status` / `missing_evidence`)增量 8 个高风险 case(权限接口、高 QPS 列表、跨服务 MQ 写、数据迁移、定时任务、灰度上线、PRD 覆盖缺口、API 契约变更)+ 1 个轻量反例(简单 CRUD 不触发企业附录、证明不膨胀)。每个 case 必须标注 `missing_evidence`(model execution / human adjudication)。
- 通过标准(报告 7.4):高风险场景不能只给泛泛 "handle errors / add monitoring / consider rollback",必须出现具体 plan-time 决策或显式待确认。
- runtime:source 改完跑 `spec-first init`,确认双宿主 mirror 同步;不手改 generated mirror。

**Patterns to follow:**
- `tests/unit/spec-plan-contracts.test.js` 现有 reference-set / source-ref / runtime-projection 断言
- `output-quality-cases.json` 现有 4 个 case 的字段结构与 `README.md` 契约

**Test scenarios:**
- Happy path: `npx jest tests/unit/spec-plan-contracts.test.js` 全绿
- Integration: `output-quality-cases.json` 通过 shape/uniqueness/declared-coverage 校验
- Edge case: 轻量反例 case 断言企业附录不出现
- Error path: 任一 eval case 缺 `missing_evidence` → contract test 失败

**Verification:**
- contract test 与 changelog-format test 全绿;eval 9 个新 case 校验通过;`spec-first init` 后双宿主 mirror 含新 reference;`git diff --check` 无问题

---

## System-Wide Impact

- **Interaction graph:** 改动集中在 `spec-plan` 的 SKILL + 4 个 reference + 1 个新 reference + contract test + eval;下游 `spec-write-tasks`/`spec-work`/`spec-doc-review` 消费的是 plan markdown,本方案不改 plan core 结构,故下游零破坏。
- **Error propagation:** 硬闸"未闭合"路径统一收敛到既有 `Open Questions` / handoff 阻断语义,不引入新失败通道。
- **State lifecycle risks:** 无持久状态;reference 加载契约扩充需与 contract test 同步,否则 runtime 投影断言会失败(已由 U7 覆盖)。
- **API surface parity:** 双宿主(Claude `/spec:plan` + Codex `$spec-plan`)必须同步;`spec-first init` 投影 + U7 投影断言保证 parity。
- **Surface coverage:** spec-plan source → in-scope;Claude runtime mirror → in-scope(init 投影);Codex runtime mirror → in-scope(init 投影);`spec-prd`/其他 workflow → out-of-scope: 本方案只动 spec-plan。
- **Integration coverage:** contract test 覆盖 reference 存在性与投影;eval 覆盖语义质量;实跑行为(LLM 是否真正触发企业附录)是 execution-time,deferred 到 fresh-source eval(host 支持 dispatch 时)。
- **Unchanged invariants:** plan-only safety contract、handoff 菜单、core plan template、`spec_id` 规则、U-ID 稳定性规则、`task-governance-signals` 脚本契约全部不变。

---

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| 企业附录滑向"所有 plan 填满"的大模板,违反 right-size | R8 + U2 明确"默认不触发";U7 专设轻量反例 case 证明不膨胀;附录只登记为 Deep 可选扩展 |
| 硬闸被误做成脚本化语义判决 | KTD3:脚本只校验存在性/shape,风险闭合由 LLM 判断,未闭合走 OQ/阻断;不写"判定是否覆盖资金风险"的脚本 |
| 引用了不存在或未来重命名的 specialist agent | U3/U7 断言映射 agent 全为现存 `agents/*.agent.md`;复用而非新建 |
| reference 加载契约扩充未同步 contract test → runtime 投影漂移 | U7 同步断言 + `spec-first init` 投影;source/runtime 边界纪律 |
| 把组织规则写死进通用 skill | R7/KTD4/U5:policy hook 概念占位,缺省不硬编码,具体形态 Deferred |
| 范围蔓延到 policy hook 完整实现 | Deferred to Follow-Up 明确切走;本 plan 只做 P0/P1 + 轻量 depth 联动 |

---

## Documentation / Operational Notes

- 用户可见行为变化(高风险计划会被要求更具体的 plan-time 决策),需评估是否更新 `README.md` / `README.zh-CN.md` / `docs/05-用户手册` 相关 spec-plan 章节(实现期判断)。
- CHANGELOG 必须追加条目(作者 leokuang、v1.12.0、`(user-visible)`)。
- runtime 变化涉及 Claude 与 Codex 双宿主,`spec-first init` 后需 doctor 复核。

---

## Alternative Approaches Considered

- **A. core template 扩章(报告反对的"大而全"形态):** 直接把 12 章塞进 core template。拒绝:信噪比崩塌,违反 right-size artifact 与 Light contract,轻量计划被拖重。
- **B. 新建独立 enterprise workflow / skill:** 把企业评审做成单独 workflow。拒绝:违反"只有公开 workflow 是用户入口"且企业风险本质是 planning 的一个 lens,拆出去会割裂 plan 闭环;条件附录 + deepening 加权已足够。
- **C. 脚本化硬闸(脚本判定风险是否覆盖):** 拒绝:脚本无法做语义判断,会制造假闸;违反"Scripts prepare, LLM decides"。
- **D. 按报告原 P0→P3 节奏(specialist 接入留到中期):** 拒绝:已核实 specialist 全部存在且已映射,提前到 P0/P1 成本极低收益明确(KTD2)。

---

## Phased Delivery

### Phase 1(P0,本 plan 核心)
- U1(enterprise reference)+ U2(SKILL 原则与指针)+ U3(deepening 触发器与硬闸)+ U7(测试/eval/runtime)。这是报告 7.3"最小可行改造"的完整闭环。

### Phase 2(P1)
- U4(plan-template Deep 附录登记)+ U5(policy hook 概念占位)+ U6(planning-flow depth 轻量联动)。

### 后续(Deferred,非本 plan)
- project policy hook 完整落地;planning-depth 深度自动化;Enterprise Readiness fresh-source eval(host 支持 dispatch 时)。

---

## Sources & References

- **Origin document:** `[docs/项目审查/详细审查/2026-06-25-tech-design-doc-spec-plan-integration-report.md](docs/项目审查/详细审查/2026-06-25-tech-design-doc-spec-plan-integration-report.md)`(源文 https://mp.weixin.qq.com/s/ira0bcNuYUILk_X4zy7R0g)
- Related code: `skills/spec-plan/SKILL.md`, `skills/spec-plan/references/{enterprise-plan-review(new),deepening-workflow,plan-template,planning-flow}.md`, `tests/unit/spec-plan-contracts.test.js`, `skills/spec-plan/evals/output-quality-cases.json`, `agents/*.agent.md`
- External docs(advisory,不写死):AWS Well-Architected Framework、Google SRE Production Readiness Review、consumer-driven contract testing、example mapping
- **外部对标收敛(R10 来源):** `[docs/项目审查/详细审查/2026-06-26-architect-workflow-vs-spec-plan-gap-analysis.md](docs/项目审查/详细审查/2026-06-26-architect-workflow-vs-spec-plan-gap-analysis.md)` — 以一手 Google "Design Docs at Google" + 业界实践对标顶尖架构师工作流,逐轮核实后将"4 个新方向"收敛为本 plan 的 3 句 rubric 增量(零新 agent / 零破 core template),并给出 privacy / data-ML 两个 specialist "不新建"的决策依据(见该文 §6.4-6.5)。
