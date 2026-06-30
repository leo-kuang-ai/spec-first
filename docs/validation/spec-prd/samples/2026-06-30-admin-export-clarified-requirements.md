---
doc_role: eval-fixture
artifact_kind: eval-sample
sample_category: admin
synthetic_reason: "High-fidelity clarified requirements sample for spec-prd P2 behavior evaluation; not a planning origin."
target_surface: admin
clarification_view: Admin
clarification_profile: ai-executable-product-clarification
clarification_risk_tier: regulated
source_authority: product-owned
readiness_authority: engineering-owned
---

<!-- prd:section=summary -->
## 样本概要

运营后台需要新增客户适当性复核记录导出能力，供合规在抽查时按时间、展业地和复核结论下载已脱敏记录。

<!-- prd:section=change_delta -->
## 变更范围

| item | current | target | delta | evidence |
| --- | --- | --- | --- | --- |
| 复核列表 | 可筛选客户复核记录 | 增加导出入口 | extend | product-prd:admin-export |
| 敏感字段 | 页面按权限脱敏展示 | 导出沿用脱敏口径 | keep | owner-answer:compliance |
| 审计 | 记录页面操作 | 导出也必须留痕 | extend | owner-answer:audit |

<!-- prd:section=requirements -->
## 需求

| id | priority | requirement | rationale/source |
| --- | --- | --- | --- |
| R-01 | P0 | 当合规角色在复核列表选择时间范围、展业地和结论后，系统应允许导出符合条件的脱敏记录。 | product-prd:admin-export |
| R-02 | P0 | 当普通运营角色访问导出入口时，系统应隐藏导出按钮并保留列表查询能力。 | owner-answer:permission |
| R-03 | P0 | 当导出任务创建、完成、失败或下载时，系统应记录操作者、筛选条件、记录数和结果。 | owner-answer:audit |

<!-- prd:section=acceptance_examples -->
## 验收样例

AE-01（对应 R-01）
Given 合规角色筛选 2026-06-01 到 2026-06-30 的香港客户复核通过记录
When 点击导出并确认
Then 系统创建导出任务，文件仅包含脱敏证件号和手机号，并记录导出审计。

AE-02（对应 R-02）
Given 普通运营角色进入同一列表
When 页面加载完成
Then 不展示导出按钮，且直接访问导出下载链接时返回无权限结果。

<!-- prd:section=scope_boundaries -->
## 范围边界

### In Scope

- 复核列表的导出入口、权限差异、脱敏规则、审计记录。

### Out Of Scope

- 不新增复核状态。
- 不改变列表筛选条件。
- 不设计导出任务队列实现。

<!-- prd:section=evidence_assumptions -->
## 证据与假设

| claim | tag | source / owner | note |
| --- | --- | --- | --- |
| 导出字段必须脱敏 | user-stated | owner-answer:compliance | 合规确认 |
| 导出任务必须留痕 | user-stated | owner-answer:audit | 审计要求 |

## Engineering Clarification Coverage Pack

| coverage_item | status | source_tag | evidence_ref | deferred_owner | deferred_unblock_condition |
| --- | --- | --- | --- | --- | --- |
| source_authority | filled | user-stated | product-prd:admin-export | | |
| current_state | filled | source-candidate | admin-list-current | engineering | 规划前复读现有权限实现 |
| change_delta | filled | user-stated | owner-answer:scope | | |
| requirements_acceptance | filled | user-stated | R-01..R-03 / AE-01..AE-02 | | |
| owner_oq_trace | filled | user-stated | OQ-1 / Trace-1 | | |
| evidence_refs | filled | mixed | product-prd:admin-export; owner-answer:compliance | | |
| regression_guard | filled | user-stated | Scope Boundaries | | |
| supporting_evidence_refs | filled | mixed | supporting-evidence table | | |

## Supporting Evidence Refs

| ref_id | source_type | authority | freshness | consumed_by | notes |
| --- | --- | --- | --- | --- | --- |
| product-prd:admin-export | product-prd | product-owned | current sample | R-01 | Product input |
| owner-answer:compliance | owner-answer | product-owned | current sample | R-01 / AE-01 | Desensitization rule |
| admin-list-current | source-code | engineering-owned | source-candidate | Planning Recheck | Must re-read before HOW |

<!-- prd:section=outstanding_questions -->
## 未决问题

| id | question | PRD write target | owner_status | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended_default/deferred_reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OQ-1 | 导出文件有效期按 24 小时还是 7 天？ | Release / Operation Readiness | answered | no | owner-answered | no | closed | 24 小时 |

<!-- prd:section=owner_decision_trace -->
## Owner 决策追踪

| question | owner_answer/source | chosen_answer | PRD write target | consequence | closure_state |
| --- | --- | --- | --- | --- | --- |
| OQ-1 | 合规 owner 回答 24 小时 | 24 小时 | Release / Operation Readiness | 导出文件过期后需重新创建任务 | closed |

<!-- prd:section=readiness_self_check -->
## Readiness Self-Check

write_mode: final-prd
clarification_evidence: asked-owner
preflight_sweep_closure: closed
decision_card_highest_risk_gap: 导出权限与脱敏是否足以防止敏感数据泄漏
decision_card_next_action: final-prd
decision_card_why_no_invention: 权限、脱敏、审计、有效期均已闭合
readiness_outcome: ready-for-planning
can_enter_spec_plan: yes
handoff_context_slice: R-01..R-03, AE-01..AE-02, product-prd:admin-export, owner-answer:compliance, admin-list-current planning recheck
