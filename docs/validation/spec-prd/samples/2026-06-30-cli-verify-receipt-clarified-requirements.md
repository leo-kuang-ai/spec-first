---
doc_role: eval-fixture
artifact_kind: eval-sample
sample_category: cli-workflow
synthetic_reason: "High-fidelity clarified requirements sample for spec-prd P2 behavior evaluation; not a planning origin."
target_surface: cli
clarification_view: CLI/DevTool
clarification_profile: export-output-heavy
clarification_risk_tier: high
source_authority: engineering-owned
readiness_authority: engineering-owned
---

<!-- prd:section=summary -->
## 样本概要

`spec-plan` 需要在消费 PRD-grade origin 前运行只读 receipt 复验，避免把 self-claimed-ready 的 PRD 当 confirmed source。

<!-- prd:section=change_delta -->
## 变更范围

| item | current | target | delta | evidence |
| --- | --- | --- | --- | --- |
| `--check-only` | producer closeout preview | 不作为 consumer pass signal | keep | source:finalize |
| `--verify-receipt` | 不存在 | 新增只读复验模式 | extend | plan:prd-optimization |
| Codex hook | 无 Stop hook | 声明 degraded, 仍要求 handoff discipline | extend | host-boundary |

<!-- prd:section=requirements -->
## 需求

| id | priority | requirement | rationale/source |
| --- | --- | --- | --- |
| R-01 | P0 | 当 `spec-plan` 遇到 `artifact_kind: prd-requirements` 且 `can_enter_spec_plan: yes` 时，应运行 `--verify-receipt` 或等价只读复验。 | plan:prd-optimization |
| R-02 | P0 | 当 receipt 缺失、过期、缺 inputs 或有 blocker 时，`spec-plan` 不得把 origin R/AE/Scope 当 confirmed。 | plan:prd-optimization |
| R-03 | P0 | 当 Codex 无 hook 强制时，closeout 应声明 `codex_prd_guard: not_available`。 | host-boundary |

<!-- prd:section=acceptance_examples -->
## 验收样例

AE-01（对应 R-01）
Given PRD origin 有当前 receipt 和 inputs hash
When `spec-plan` 运行 `--verify-receipt`
Then exit 0 且 `origin_verification_status=verified`。

AE-02（对应 R-02）
Given PRD origin 是合法 checkpoint 且 `should_block_closeout=false`
When `spec-plan` 运行 `--verify-receipt`
Then exit 非 0 且不得标记为 verified。

<!-- prd:section=scope_boundaries -->
## 范围边界

### In Scope

- 只读 receipt 复验、exit code、origin verification status、Codex degraded 声明。

### Out Of Scope

- 不复制 `spec-prd` readiness lens 到 `spec-plan`。
- 不为 Codex 新增不存在的 hook primitive。

<!-- prd:section=evidence_assumptions -->
## 证据与假设

| claim | tag | source / owner | note |
| --- | --- | --- | --- |
| `--check-only` 不能作为 consumer pass signal | confirmed-source | source:finalize | 现有 checkpoint closeout 语义 |
| Codex 无等价 Stop hook | user-stated | host-boundary | degraded |

## CLI / DevTool Contract

| output | consumer | stability | failure/degraded signal |
| --- | --- | --- | --- |
| exit code | `spec-plan` | contract | non-zero for unverified/degraded |
| JSON stdout | workflow | contract | `origin_verification_status` |
| reason_codes | human/workflow | advisory facts | `input_side_recheck_degraded`, blockers |

<!-- prd:section=outstanding_questions -->
## 未决问题

| id | question | PRD write target | owner_status | blocks_planning | closure_disposition | planning_would_invent_what | closure_state | recommended_default/deferred_reason |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OQ-1 | degraded 缺 inputs 是否可 exit 0？ | Requirements | answered | no | owner-answered | no | closed | 不可，必须非 0 |

<!-- prd:section=owner_decision_trace -->
## Owner 决策追踪

| question | owner_answer/source | chosen_answer | PRD write target | consequence | closure_state |
| --- | --- | --- | --- | --- | --- |
| OQ-1 | workflow owner 确认 degraded 必须非 0 | degraded exit 非 0 | Requirements | consumer 不会静默放行 | closed |

<!-- prd:section=readiness_self_check -->
## Readiness Self-Check

write_mode: final-prd
clarification_evidence: asked-owner
preflight_sweep_closure: closed
decision_card_highest_risk_gap: consumer 是否会把 checkpoint 或 degraded 当 verified
decision_card_next_action: final-prd
decision_card_why_no_invention: exit code、status、degraded、checkpoint 语义已闭合
readiness_outcome: ready-for-planning
can_enter_spec_plan: yes
codex_prd_guard: not_available
handoff_context_slice: R-01..R-03; AE-01..AE-02; source:finalize; host-boundary
