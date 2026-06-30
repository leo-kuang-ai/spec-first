---
doc_role: eval-fixture
artifact_kind: eval-sample
sample_category: app-design-source
synthetic_reason: "High-fidelity clarified requirements sample for spec-prd P2 behavior evaluation; not a planning origin."
target_surface: app
clarification_view: App
clarification_profile: frontend-ux-heavy
clarification_risk_tier: regulated
source_authority: mixed
readiness_authority: engineering-owned
---

<!-- prd:section=summary -->
## 样本概要

App 基金详情页需要在申购按钮前新增风险等级不匹配提示，设计稿已给出弹窗结构和两种按钮状态。

<!-- prd:section=change_delta -->
## 变更范围

| item | current | target | delta | evidence |
| --- | --- | --- | --- | --- |
| 申购入口 | 风险等级不足时直接拦截 | 展示设计稿弹窗并提供去测评入口 | replace | design:fund-risk-modal |
| 详情页信息 | 保持基金详情展示 | 不改行情/净值展示 | keep | source-candidate:fund-detail |

<!-- prd:section=requirements -->
## 需求

| id | priority | requirement | rationale/source |
| --- | --- | --- | --- |
| R-01 | P0 | 当客户风险等级低于基金风险等级且点击申购时，App 应展示风险不匹配弹窗。 | design:fund-risk-modal |
| R-02 | P0 | 当客户选择去测评时，App 应跳转到风险测评入口，并在返回后重新判断申购可用状态。 | owner-answer:risk-flow |
| R-03 | P1 | 当客户取消弹窗时，App 应留在基金详情页且不提交申购。 | design:fund-risk-modal |

<!-- prd:section=acceptance_examples -->
## 验收样例

AE-01（对应 R-01）
Given 客户风险等级低于基金风险等级
When 客户点击申购
Then 展示风险不匹配弹窗，包含风险说明、取消、去测评按钮。

AE-02（对应 R-03）
Given 弹窗已展示
When 客户点击取消
Then 弹窗关闭，申购请求不提交，基金详情页状态保持。

<!-- prd:section=scope_boundaries -->
## 范围边界

### In Scope

- 基金详情页申购前风险不匹配弹窗。
- 去测评入口跳转与返回后状态刷新。

### Out Of Scope

- 不修改风险测评题目。
- 不修改基金详情页净值、行情或交易规则。

<!-- prd:section=evidence_assumptions -->
## 证据与假设

| claim | tag | source / owner | note |
| --- | --- | --- | --- |
| 弹窗结构来自设计稿 | source-candidate | design:fund-risk-modal | 设计截图样本 |
| 测评入口由 owner 确认 | user-stated | owner-answer:risk-flow | |

## Interaction Analysis

| issue | finding | target |
| --- | --- | --- |
| hidden_assumption | 返回详情页后必须重新判断风险等级，否则按钮状态可能过期 | Acceptance Examples |
| missing_edge_case | 取消弹窗不得提交申购 | AE-02 |

<!-- prd:section=design_source_coverage -->
## Design Source Coverage

design_source_inventory:
- source_or_node: design:fund-risk-modal
  read_status: read
  PRD write target: Interaction Requirements | Acceptance Examples
  readiness consequence: modal layout and button states covered

design_sources_read:
- design:fund-risk-modal -> R-01 / R-03 / AE-01 / AE-02

design_sources_unread:
- none

design_source_coverage: read

<!-- prd:section=outstanding_questions -->
## 未决问题

| id | question | PRD write target | owner_status | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended_default/deferred_reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OQ-1 | 去测评入口是否复用现有风险测评首页？ | Requirements | answered | no | owner-answered | no | closed | 复用现有入口 |

<!-- prd:section=owner_decision_trace -->
## Owner 决策追踪

| question | owner_answer/source | chosen_answer | PRD write target | consequence | closure_state |
| --- | --- | --- | --- | --- | --- |
| OQ-1 | 产品 owner 确认复用现有风险测评首页 | 复用现有入口 | Requirements | plan 不需要新建测评入口 | closed |

<!-- prd:section=readiness_self_check -->
## Readiness Self-Check

write_mode: final-prd
clarification_evidence: asked-owner
preflight_sweep_closure: closed
decision_card_highest_risk_gap: 设计稿弹窗是否足以确定用户可见行为
decision_card_next_action: final-prd
decision_card_why_no_invention: 弹窗、按钮、取消、去测评和返回刷新均已闭合
readiness_outcome: ready-for-planning
can_enter_spec_plan: yes
handoff_context_slice: design:fund-risk-modal; owner-answer:risk-flow; R-01..R-03; AE-01..AE-02
