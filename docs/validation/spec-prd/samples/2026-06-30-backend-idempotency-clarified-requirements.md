---
doc_role: eval-fixture
artifact_kind: eval-sample
sample_category: backend
synthetic_reason: "High-fidelity clarified requirements sample for spec-prd P2 behavior evaluation; not a planning origin."
target_surface: backend
clarification_view: Backend/Java
clarification_profile: backend-contract-heavy
clarification_risk_tier: regulated
source_authority: mixed
readiness_authority: engineering-owned
---

<!-- prd:section=summary -->
## 样本概要

后台出金审核通过后需要保证重复回调或重复点击不会产生重复扣款、重复冻结或重复审计记录。

<!-- prd:section=change_delta -->
## 变更范围

| item | current | target | delta | evidence |
| --- | --- | --- | --- | --- |
| 出金审核通过 | 已有人工审核动作 | 明确幂等与重复触发结果 | extend | owner-answer:withdrawal |
| 审计 | 已记录审核结论 | 重复触发只保留一次业务结果并记录重复尝试 | extend | owner-answer:audit |

<!-- prd:section=requirements -->
## 需求

| id | priority | requirement | rationale/source |
| --- | --- | --- | --- |
| R-01 | P0 | 当同一出金单已审核通过后再次收到通过动作，系统应返回已处理结果，不重复扣款或冻结。 | owner-answer:withdrawal |
| R-02 | P0 | 当第三方回调超时后重试，系统应保持出金单最终状态一致，并让运营可见最近一次处理结果。 | source-candidate:withdrawal-callback |
| R-03 | P0 | 当重复通过被识别时，系统应记录重复尝试审计，但不得新增第二条成功业务记录。 | owner-answer:audit |

<!-- prd:section=acceptance_examples -->
## 验收样例

AE-01（对应 R-01）
Given 出金单 W-1 已审核通过
When 同一操作被重复提交
Then 系统展示已处理结果，资金状态不重复变化。

AE-02（对应 R-02）
Given 第三方回调第一次超时但后台已完成处理
When 第三方再次回调同一出金单
Then 出金单保持成功状态，运营可见最近一次处理时间。

<!-- prd:section=scope_boundaries -->
## 范围边界

### In Scope

- 出金审核通过动作的业务幂等、重复尝试审计、运营可见结果。

### Out Of Scope

- 不设计幂等键、数据库唯一约束或事务实现。
- 不改变出金审核流程节点。

<!-- prd:section=evidence_assumptions -->
## 证据与假设

| claim | tag | source / owner | note |
| --- | --- | --- | --- |
| 重复通过不得重复扣款 | user-stated | owner-answer:withdrawal | 资金安全边界 |
| 当前回调实现需规划前复读 | source-candidate | withdrawal-callback | Planning Recheck |

## Requirements Quality Rubric

| rubric | result |
| --- | --- |
| Necessary | 资金安全和审计可追溯需要 |
| Single | 每条需求只描述一个可验收行为 |
| Unambiguous | 重复触发的用户/运营可见结果明确 |
| Complete | 覆盖人工重复提交和第三方重试 |
| Feasible | HOW 留给 spec-plan |
| Verifiable | AE-01 / AE-02 可验证 |
| WHAT not HOW | 不写幂等键或事务方案 |

## Planning Recheck

| item | why recheck | required before | blocks planning? |
| --- | --- | --- | --- |
| withdrawal-callback | 当前回调语义为 source-candidate | spec-plan 选择 HOW 前 | no |

<!-- prd:section=outstanding_questions -->
## 未决问题

| id | question | PRD write target | owner_status | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended_default/deferred_reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OQ-1 | 重复尝试审计是否运营可见？ | Requirements | answered | no | owner-answered | no | closed | 可见最近一次重复尝试 |

<!-- prd:section=owner_decision_trace -->
## Owner 决策追踪

| question | owner_answer/source | chosen_answer | PRD write target | consequence | closure_state |
| --- | --- | --- | --- | --- | --- |
| OQ-1 | 运营 owner 确认可见最近一次重复尝试 | 可见最近一次重复尝试 | Requirements | plan 保留审计可见性 | closed |

<!-- prd:section=readiness_self_check -->
## Readiness Self-Check

write_mode: final-prd
clarification_evidence: asked-owner
preflight_sweep_closure: closed
decision_card_highest_risk_gap: 重复触发是否会让 plan 发明资金状态语义
decision_card_next_action: final-prd
decision_card_why_no_invention: 重复提交、回调重试、审计可见性已闭合；HOW 留给 plan
readiness_outcome: ready-for-planning
can_enter_spec_plan: yes
handoff_context_slice: R-01..R-03; AE-01..AE-02; withdrawal-callback planning recheck
