---
name: spec-brainstorm
description: "Discover WHAT for a selected feature/problem before PRD or planning when behavior, scope, users, success criteria, or handoff context remain unresolved. Do not use for open-ended ideation, brownfield PRD authoring/refinement/validation, clear HOW planning/task compilation, implementation/debug/review/setup, generated runtime mirror fixes, factual answers, or cleanup."
argument-hint: "[feature/problem]"
---

# Brainstorm a Feature or Improvement

## Purpose

Clarify WHAT before requirements/planning; planning defines HOW. Create `docs/brainstorms/` only for durable handoff.

## Workflow Contract Summary

### When To Use
Use when the user has a selected or user-framed problem, feature, or improvement and behavior/scope/users/success/planning handoff context remain unresolved; planning would otherwise invent WHAT to build.

### When Not To Use
Do not use for open-ended idea generation, brownfield PRD authoring/refinement/validation, clear implementation planning, execution/debug/review/setup, single-document cleanup/summarization, or narrow factual answers.

### Inputs
Feature/problem, context, optional brainstorm doc, one-question decisions.

### Outputs
Requirements doc or brief alignment summary.

### Artifacts
`docs/brainstorms/`; generated runtime mirrors are not source.

### Failure Modes
Missing feature, unresolved choice, universal flow, or wrong workflow.

### Workflow
Assess, ask, synthesize, capture, hand off.

### Downstream Consumers
`spec-plan`, owners, reviewers, work/review flows.

## Near-Neighbor Exit Cues

Stop before Phase 1 when another route fits: idea_generation->ideation; brownfield_prd->PRD; clear_plan_request->plan; doc_review/code_review->review; debug_request->debug; execution_ready->work; direct_cleanup->direct.

## Route-Out Shape

Wrong-entry cases return a compact chat-consumable shape for the user or parent entry router, not a schema-validated artifact:

```text
status: not_applicable | handoff | degraded
reason_code: idea_generation | brownfield_prd | clear_plan_request | execution_ready | debug_request | doc_review | direct_cleanup | missing_feature_description | insufficient_evidence
recommended_next_action: <current-host entrypoint or direct action>
limitation: <why brainstorm should not continue>
source_refs: <repo-relative paths when source evidence was read>
```

## Examples As Context

`evals/routing-cases.json` records positive WHAT-discovery triggers and near-neighbor route-out examples. It is not a deterministic router or semantic proof.

## Scenario Capability

Follows `docs/contracts/workflows/scenario-capability-matrix.md` (default).
Overrides: none

## Capability-Class Evidence Boundary

Follows `docs/contracts/project-graph-consumption.md`: `capability-class` candidates (`code-graph`, `project-graph`) are advisory. Check `readiness_status`; the WHAT must come from user dialogue and source confirmation, never the candidate. Record `provider_untrusted`, never-block, separate `lifecycle.fallback_used`, and fall back to direct source reads.

## Reference Routing

Refs: `references/interaction-rules.md`; `references/context-and-evidence.md`; `references/discovery-flow.md`; `references/approach-exploration.md`; `references/synthesis-summary.md`; `references/brainstorm-sections.md`, `references/requirements-capture.md`, and `references/markdown-rendering.md` for Phase 3 canonical markdown requirements capture. HTML is an optional sidecar only; do not replace markdown without focused downstream consumer tests. Phase 4: `references/handoff.md`; governance: `references/evaluation-governance.md`.

## Feature Description

<feature_description> #$ARGUMENTS </feature_description>

If empty, ask for the feature/problem/improvement; stop until answered.

## Execution Flow

Flow: 0 `references/discovery-flow.md`; 1 interaction/context/discovery; 2 `references/approach-exploration.md`; 2.5 Phase 2.5: Synthesis Summary: Read `references/synthesis-summary.md`; 3 Phase 3 refs; 4 `references/handoff.md`.
