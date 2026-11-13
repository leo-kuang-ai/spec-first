# Skill 深度分析报告：spec-prd

**分析者**：全量自主优化执行者（GLM-5.3 @ zcode）
**分析日期**：2026-11-04
**源码范围**：SKILL.md（347 行）+ 9 references（1910 行）+ evals（5 案例）+ scripts（check-prd-artifact.js / finalize-prd-artifact.js / check-glossary-drift.js）
**基线**：S 系列 post-fix（S03 修复在位：范围外停止语义 SKILL.md:202、CLI 支持集 SKILL.md:153；39 项测试通过，2026-11-02）

---

## Step 1: 源码结构与流程

```text
Phase 0 分类路由（route-out/bypass、create/refine/validate、profile、input_posture、split）
  → Phase 1 现状分析（Sanitization → 证据 → Requirement Analysis Gate → Product Expert Lens
      → Pre-PRD Clarification / Grill → Pre-Write Closure Gate 🔴 + Decision Card）
  → Phase 2 Change Delta 与领域语言（topology、glossary）
  → Phase 3 起草/精修/validate 报告/拆分
  → Phase 4 Readiness 与 Handoff 🔴（readiness lens + finalize/checker receipt + closeout 摘要）
```

**治理强度（四道确定性/半确定性门）**：4 Legal Stop Points（SKILL.md:200-210）、Pre-Write Closure Gate（L275-277）、Phase 4 Mandatory Gate（L325）、Failure-Mode Blacklist 七条带恢复动作（L212-224）。**确定性地板真实存在**：check-prd-artifact.js 以 reason_codes 阻断（如 `requirement_acceptance_trace_missing`、`open_oq_without_owner_closure`、`decision_card_path_mismatch`）。

## Step 2: 设计意图

- Brownfield WHAT 生产者：grill 无止境追问为默认，4 个合法停止点单点定义（其他 reference 引用不复述）。
- **消费者对账已双向闭环**：产出侧 R↔AE 追溯由 checker 机器强制（prd-output-template.md:71 `requirement_acceptance_trace_missing` fail-closed；readiness lens:94 traceability closure）；消费侧 spec-plan final-review 5.1 要求「origin R/F/AE 影响实现的每一项被引用或显式 deferred」。
- Owner fidelity 反模式防护（L291 不得软化/反转 owner 答案）+ Push-Right Brief + closure_disposition razor——超出一般 skill 的治理深度。

## Step 3: Phase 0 归因验证

**Phase 0 证据**：9 任务窗口内 spec-prd **零调用**（T01 WHAT 由 spec-brainstorm 产出 product_contract_source: spec-brainstorm；T04/T10 直写方案文档）。Phase 0 无任何阻力点归因 spec-prd。

**验证结论**：无需验证的黑盒归因（无实例）；对账镜头核查（本报告 Step 1-2）未发现 spec-plan 类缺口——**spec-prd 不存在 Phase 0.5 发现的两类对账缺口**，其确定性 floor 反而是四 skill 中最强的。

## Step 4: 问题清单与方案

| # | 问题 | 分类 | 频率 | 证据 | 方案 |
|---|---|---|---|---|---|
| P-PRD-1 | 窗口内零真实使用，行为效果无数据（S03 修复后真实场景未运行） | 数据缺口，非缺陷 | 0/9 | task-selection.md 全部 9 任务 | 不修改；列入增量追踪观察名单（后续 brownfield PRD 任务出现时优先追踪） |

**不提出修改**。理由：(a) 无频率证据支撑（0/9，评分公式 frequency=3 分封顶）；(b) S 系列 static+behavioral 审查刚完成收口；(c) 任何无证据的「增强」违反 S 系列 settled decision（不加通用框架）。

**归因影响**：无修正（Phase 0 未归因此 skill）。

---

**结论**：spec-prd 以当前形态为「无证据问题」skill；其 R↔AE 机器强制追溯可作为其他 skill 对账修复的参照模式（check-prd-artifact.js 的 reason_codes 模式）。
