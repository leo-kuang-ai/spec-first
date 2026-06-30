---
doc_role: eval-fixture
artifact_kind: eval-sample
sample_category: mixed-multi-source
synthetic_reason: "High-fidelity clarified requirements sample for spec-prd P2 behavior evaluation; not a planning origin."
target_surface: mixed
clarification_view: Mixed
clarification_profile: ai-executable-product-clarification
clarification_risk_tier: high
source_authority: mixed
readiness_authority: engineering-owned
---

<!-- prd:section=summary -->
## 样本概要

Admin 配置的港股风险揭示文案需要同步到 App 和 H5 交易确认页，Backend 负责提供当前有效版本，旧版本客户端不得展示空白。

<!-- prd:section=change_delta -->
## 变更范围

| surface | current | target | consistency | evidence |
| --- | --- | --- | --- | --- |
| Admin | 手工维护文案 | 成为文案 source-of-truth | must-match | owner-answer:content |
| Backend | 无统一版本语义 | 提供当前有效版本 | must-match | source-candidate:content-service |
| App | 本地文案 | 读取当前有效版本，失败用最近缓存并标识 | may-differ during degraded | owner-answer:degraded |
| H5/PC | 本地文案 | 与 App 一致展示 | must-match | owner-answer:content |

<!-- prd:section=requirements -->
## 需求

| id | priority | requirement | rationale/source |
| --- | --- | --- | --- |
| R-01 | P0 | 当合规在 Admin 发布港股风险揭示文案后，App 和 H5 应展示同一当前有效版本。 | owner-answer:content |
| R-02 | P0 | 当 Backend 暂时不可用时，App 可展示最近缓存版本，但必须标识更新时间并不得展示空白。 | owner-answer:degraded |
| R-03 | P0 | 当文案版本回滚时，App/H5 应在下一次刷新后展示回滚后的当前有效版本。 | owner-answer:rollback |

<!-- prd:section=acceptance_examples -->
## 验收样例

AE-01（对应 R-01）
Given Admin 发布版本 V3 风险揭示文案
When App 和 H5 打开港股交易确认页
Then 两端展示 V3 文案和相同确认动作。

AE-02（对应 R-02）
Given Backend 文案服务不可用且 App 有 V2 缓存
When 客户打开港股交易确认页
Then App 展示 V2 缓存和更新时间提示，不展示空白。

<!-- prd:section=scope_boundaries -->
## 范围边界

### In Scope

- Admin source-of-truth、Backend 当前版本、App/H5 展示一致性、不可用降级和回滚感知。

### Out Of Scope

- 不设计文案存储 schema。
- 不改变交易确认页其它字段。
- 不覆盖非港股风险揭示。

<!-- prd:section=evidence_assumptions -->
## 证据与假设

| claim | tag | source / owner | note |
| --- | --- | --- | --- |
| Admin 是文案 source-of-truth | user-stated | owner-answer:content | |
| Backend 现状需要规划前复读 | source-candidate | content-service | Planning Recheck |

## Source-Of-Truth Resolution

| item | current source-of-truth | target source-of-truth | consumers | conflict rule |
| --- | --- | --- | --- | --- |
| 港股风险揭示文案 | App/H5 本地 | Admin 发布版本，经 Backend 暴露当前有效版本 | App/H5 | Admin 发布版本为准 |

## Cross-Surface Consistency

| scenario | App | H5/PC | Admin | Backend visible result | must match |
| --- | --- | --- | --- | --- | --- |
| 正常 | V3 | V3 | V3 current | current=V3 | yes |
| Backend 不可用 | V2 cached + timestamp | 错误页或缓存策略待确认 | V3 current | unavailable | no, degraded explicit |
| 回滚 | refreshed rollback version | refreshed rollback version | rollback current | current=rollback | yes |

## Planning Recheck

| item | why recheck | required before | blocks planning? |
| --- | --- | --- | --- |
| content-service | Backend 当前版本语义是 source-candidate | spec-plan HOW 前 | no |

<!-- prd:section=outstanding_questions -->
## 未决问题

| id | question | PRD write target | owner_status | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended_default/deferred_reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OQ-1 | H5 在 Backend 不可用时是否允许缓存展示？ | Acceptance Examples | answered | no | owner-answered | no | closed | 不允许缓存，展示错误页 |

<!-- prd:section=owner_decision_trace -->
## Owner 决策追踪

| question | owner_answer/source | chosen_answer | PRD write target | consequence | closure_state |
| --- | --- | --- | --- | --- | --- |
| OQ-1 | H5 owner 确认不可用时展示错误页 | H5 不缓存 | Acceptance Examples | plan 不需要为 H5 设计缓存 fallback | closed |

<!-- prd:section=readiness_self_check -->
## Readiness Self-Check

write_mode: final-prd
clarification_evidence: asked-owner
preflight_sweep_closure: closed
decision_card_highest_risk_gap: Admin/Backend/App/H5 source-of-truth 冲突
decision_card_next_action: final-prd
decision_card_why_no_invention: source-of-truth、正常展示、degraded、回滚和 H5 差异已闭合
readiness_outcome: ready-for-planning
can_enter_spec_plan: yes
downstream_sync_impact: App/H5/Backend/Admin existing plans unknown; record downstream_sync_unknown if no current artifacts are found.
handoff_context_slice: source-of-truth table; cross-surface consistency; R-01..R-03; AE-01..AE-02; content-service planning recheck
