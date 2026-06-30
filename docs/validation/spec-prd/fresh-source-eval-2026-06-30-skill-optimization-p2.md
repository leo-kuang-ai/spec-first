# Fresh-Source Eval: spec-prd Skill Optimization P2

```yaml
fresh_source_eval:
  schema_version: fresh-source-eval-record.v1
  producer: spec-work
  freshness: current-worktree
  authority_level: advisory
  reason_code: fresh-source-eval-single-agent-fallback
  consumer: spec-prd optimization closeout and future P2 comparison
  status: passed
  dispatch_boundary:
    reviewer_dispatch: not_used
    reason_code: dispatch_authorization_missing
    fallback: single-orchestrator read-only review over current source and sample files
  source_paths:
    - skills/spec-prd/SKILL.md
    - skills/spec-prd/references/prd-output-template.md
    - skills/spec-prd/references/prd-readiness-lens.md
    - skills/spec-prd/evals/examples.json
    - docs/validation/spec-prd/samples/2026-06-30-admin-export-clarified-requirements.md
    - docs/validation/spec-prd/samples/2026-06-30-app-design-source-clarified-requirements.md
    - docs/validation/spec-prd/samples/2026-06-30-backend-idempotency-clarified-requirements.md
    - docs/validation/spec-prd/samples/2026-06-30-cli-verify-receipt-clarified-requirements.md
    - docs/validation/spec-prd/samples/2026-06-30-mixed-source-of-truth-clarified-requirements.md
  runtime_paths_checked: []
  generated_runtime_mirrors: not_used_as_source
  p0_findings: []
  p1_findings: []
  p2_findings:
    - "Future dispatched reviewer/judge eval should rerun these samples once Codex reviewer dispatch is explicitly authorized."
    - "Samples are synthetic high-fidelity fixtures, not production PRD outcomes."
```

## Scope

This report closes the P2 evidence lane for the 2026-06-30 spec-prd specialization work by adding five high-fidelity clarified-requirements samples and reviewing whether the new P1/P2 lenses expose the intended behavior:

| sample category | sample file | primary lens |
| --- | --- | --- |
| Admin | `docs/validation/spec-prd/samples/2026-06-30-admin-export-clarified-requirements.md` | permissions, export, audit, supporting evidence |
| App + design source | `docs/validation/spec-prd/samples/2026-06-30-app-design-source-clarified-requirements.md` | design source coverage, interaction analysis |
| Backend | `docs/validation/spec-prd/samples/2026-06-30-backend-idempotency-clarified-requirements.md` | idempotency, transaction-visible product outcome, planning recheck |
| CLI / workflow | `docs/validation/spec-prd/samples/2026-06-30-cli-verify-receipt-clarified-requirements.md` | command contract, receipt verification, Codex degraded boundary |
| Mixed multi-source | `docs/validation/spec-prd/samples/2026-06-30-mixed-source-of-truth-clarified-requirements.md` | source-of-truth, cross-surface consistency, downstream sync impact |

The samples live under `docs/validation/spec-prd/samples/` with `doc_role: eval-fixture` and `artifact_kind: eval-sample`. They intentionally do not live under `docs/brainstorms/*-requirements.md`, so ordinary `spec-plan` requirements discovery should not treat them as planning candidates.

## Review Result

Single-agent read-only review found no P0/P1 findings in the sample set.

The samples collectively exercise the load-bearing new behavior:

- pure localized headings can carry `<!-- prd:section=... -->` identity;
- machine-owned safety sections remain present in final-ready shaped samples;
- full Coverage Pack rows are present only where they reduce planning invention;
- Requirements Quality Rubric is used as review vocabulary, not a scorecard;
- `clarification_risk_tier`, `clarification_budget`, and `review_gate_mode` affect review depth, not checker blocking;
- interaction analysis catches hidden assumptions and missing edge cases;
- supporting evidence refs distinguish product-owned, owner-owned, source-candidate, and design-source inputs;
- handoff context slice carries confirmed WHAT, owner decisions, recheck items, and degraded facts without listing implementation tasks;
- Codex degraded path is visible through `codex_prd_guard: not_available`.

## Effect Metrics

No historical baseline exists for these metrics in this repository. The table records first-run sample values and marks missing baseline honestly.

| metric | baseline | first sample value | note |
| --- | --- | --- | --- |
| `plan_what_questions_count` | baseline_unavailable | 0 expected from reviewed samples | Each sample has closed R/AE/scope/OQ residue or explicit Planning Recheck for HOW/source freshness. |
| `plan_invented_what_findings_count` | baseline_unavailable | 0 observed in read-only review | No sample asks planning to invent actor, acceptance, scope, source-of-truth, or degraded behavior. |
| `localized_heading_false_block_count` | baseline_unavailable | 0 expected | Samples use section-id identity for localized headings. |
| `ready_clarification_p0_p1_review_findings_count` | baseline_unavailable | 0 | Single-agent report-only review found no P0/P1. |
| `owner_gap_leaked_to_plan_count` | baseline_unavailable | 0 | Owner-owned gaps are closed through Owner Decision Trace. |
| `traceability_gap_count` | baseline_unavailable | 0 | Every sample has R/AE trace or Planning Recheck for non-WHAT source freshness. |
| `right_size_mismatch_count` | baseline_unavailable | 0 | Sample depth matches risk tier and surface. |
| `interaction_gap_count` | baseline_unavailable | 0 | App sample explicitly records interaction hidden assumption and edge case. |
| `context_slice_followup_questions_count` | baseline_unavailable | 0 expected | Each sample includes a compact handoff context slice. |

## Comparison Eval

Blind comparison posture: compare the old compact skeleton expectation against the new specialized samples.

| dimension | old skeleton likely risk | new sample behavior |
| --- | --- | --- |
| Admin export | Permissions/export/audit could be scattered across prose | Dedicated evidence refs, audit requirement, permission negative acceptance |
| App + design | Design source could be treated as background | `Design Source Coverage` binds design ref to R/AE and readiness consequence |
| Backend | Idempotency could drift into HOW | Product-level repeated-trigger outcome is explicit; idempotency mechanism left to planning |
| CLI/workflow | `--check-only` could be mistaken as consumer pass | Sample explicitly separates producer preview from consumer `--verify-receipt` |
| Mixed | Source-of-truth could be invented by planning | Source-of-truth and cross-surface consistency tables define WHAT boundary |

Right-size comparison:

- `compact` is appropriate only for low-risk source-resolved increments.
- `standard` fits ordinary Admin/App/Backend samples.
- `deep` is justified for regulated, mixed-source, design-source, CLI receipt, and money/trading-sensitive samples.

Interaction/context-slice comparison:

- Interaction Analysis catches at least one hidden assumption in the App sample.
- Mixed sample prevents cross-surface source-of-truth invention.
- Context slices are concise enough for downstream planning intake and do not include implementation file lists.

## Limitations

- The samples are synthetic high-fidelity fixtures, not production user PRDs.
- Reviewer dispatch was not used because this Codex request did not explicitly authorize subagents/persona dispatch for this fresh-source eval; this report uses the documented single-agent report-only fallback.
- The report is advisory behavior evidence. Deterministic correctness remains covered by focused unit/contract tests and `run-evals.js --json`.
