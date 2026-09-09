---
name: spec-brainstorm
description: "Explore ideas into a requirements-only unified plan. Use to brainstorm, scope what to build, frame unfamiliar territory, or check product blindspots before planning. Not for settled implementation, debugging, or code review; use spec-pov for a verdict on adopting a named external candidate."
argument-hint: "[feature idea or problem to explore] [output:html]"
---

# Brainstorm a Feature or Improvement

Note: Use the current date from the active host context. Use this when weighting external sources and dating artifacts.

Brainstorming helps answer **WHAT** to build through collaborative dialogue. It precedes `spec-plan`, which enriches the same unified plan artifact with **HOW** to build it.

The durable output of this workflow is a **requirements-only unified plan**. In other workflows this might be called a lightweight PRD or feature brief. In spec-first, keep the workflow name `brainstorm`, but write the first version of the plan artifact under `docs/plans/` with `artifact_readiness: requirements-only` so planning does not need to invent product behavior, scope boundaries, or success criteria.

This skill does not implement code. It explores, clarifies, and documents decisions for later planning or execution. It also never delivers an adopt/switch/replace verdict on a named external candidate — that is `spec-pov`'s job (see `references/phase-0.md`, gate 0.1c); routing it out by name is mandatory even when no project context is visible.

## Workflow Contract Summary

- **Inputs:** unresolved product ideas, users, constraints, and traceable repository or external evidence.
- **Outputs:** a requirements-only unified plan with a Product Contract, scope, success criteria, open questions, and evidence limitations.
- **Hard exits:** unresolved product decisions, target repository or document ownership, unsupported claims, or work owned by planning, implementation, debugging, or review.
- **Authority:** the current user confirms product meaning; the LLM explores and synthesizes; scripts and providers supply advisory facts. This workflow does not authorize implementation, commits, or landing.
- **Consumers:** `spec-plan`, `spec-doc-review`, product owners, and downstream requirements reviewers.

## Dispatch Authorization Boundary

Before dispatching a grounding scout, claim verifier, Slack researcher, or repo profiler, record these independent run-local facts:

```yaml
worker_dispatch_authorization: authorized | missing
capability_probe: not_applicable | attempted | unavailable
worker_dispatch_capability: available | missing | unknown
worker_context_isolation: isolated | inherited | unknown
worker_model_override: supported | unsupported | unknown
worker_bounded_parallelism: supported | unsupported | unknown
```

`workflow invocation does not authorize dispatch`. Only an explicit current-user request or visible upstream handoff requesting subagents, delegated work, personas, or parallel work sets authorization to `authorized`. Tool visibility, permission settings, brainstorm tier, a source-search request, and invoking this skill do not authorize dispatch. Without authorization, do not probe tool schemas: set `capability_probe: not_applicable` and `worker_dispatch_capability: unknown`, work inline or serially, and record `dispatch_authorization_missing`. After authorization, inspect the current-session registry/schema only as `provider_untrusted` evidence. Confirmed absence records `subagent_capability_missing`; an unavailable surface, incomplete schema, or ambiguous candidate records `worker_capability_unproven`; both fall back inline or serially. Isolation, model overrides, and bounded parallelism require live facts. Unmet required isolation keeps its dependent gate open; unknown model support inherits, and unknown parallelism serializes. Record `worker_dispatch_outcome`. Inline fallback may retain the same evidence budget but cannot claim fresh-context, independent scout, or multi-agent coverage.

## Model Tiers

Worker model selection is tiered by task shape, never hardcoded to a host or model name. When dispatching the Phase 1.1 grounding scout, the Phase 2.6 claim verifier, or the opt-in Slack researcher, read `references/model-tiers.md` for the tier definitions (extraction / generation / ceiling) and the degradation rule when `worker_model_override` or dispatch capability is unavailable.

## Feature Description

<feature_description> #<invocation arguments supplied by the current host> </feature_description>

**If the feature description above is empty, ask the user:** "What would you like to explore? Please describe the feature, problem, or improvement you're thinking about."

Do not proceed until you have a feature description from the user.

## Execution Flow

Read each phase's reference before performing its work. Read conditional detail when relevant; do not load every reference at entry or execute a phase from this table alone.

| Trigger | Required read | Responsibility |
| --- | --- | --- |
| Before the first question, including non-software work | `references/interaction-rules.md` | Core principles, source lookup before questions, single current-user confirmation, question shape, and output economy. |
| Before scope questions or classifying carried decisions | `references/settled-decisions.md` | Settlement, directives, and the Product Contract decision owner. |
| Phase 0.0, before other phases | `references/output-mode.md` | Exclusive format, config precedence, token parsing, and pipeline override. |
| Phases 0.1-0.3 | `references/phase-0.md` | Resume, domain and verdict routing, scope, visual decisions, and unfamiliarity. |
| Phase 1 | `references/dialogue.md` | Current-tree grounding, private scratch, source-sensitive questions, decision-relevant vocabulary/code conflicts, pressure test, and dialogue exit. |
| Phases 2-2.6 | `references/approaches.md`; also `references/synthesis-summary.md` before synthesis | Approaches, scenario coverage, confirmation, and claim verification. |
| Phase 3 | `references/plan-write.md`, then `references/brainstorm-sections.md` and the selected rendering reference | Document need, Product Contract, durable recovery, and promotion candidates. |
| Phase 4 | `references/handoff.md` | Scope-aware options, format, downstream payload, and closing summary. |

Before asking scope questions, read `references/settled-decisions.md`. Carry settled product decisions forward without re-asking them; spend at most one in-pipeline challenge on an unexamined directive. The Product Contract's Key Decision entry is the single owner of each accepted product decision: annotate it there and reference it elsewhere instead of repeating it.

## Exit Boundaries

- `OUTPUT_FORMAT` is exclusive: Markdown or HTML, never both. LFG and any `disable-model-invocation` context force Markdown. Rendering references load at composition, not during dialogue.
- Write software artifacts to `docs/plans/YYYY-MM-DD-NNN-<type>-<topic>-plan.<md|html>` with `artifact_contract: spec-unified-plan/v1`, `artifact_readiness: requirements-only`, `product_contract_source: spec-brainstorm`, and `execution: code`. Only when `OUTPUT_FORMAT=md`, include `status: active`; HTML has no lifecycle metadata. Use a Goal Capsule plus Product Contract, without a Goal Launch Block or Reader Index. Non-software output does not use this contract.
- The current user is the sole product confirmer. Specialist evidence never supplies product approval. Preserve unresolved blockers when a decision needs unavailable evidence.
- Keep visual decisions conversation-native. Do not implement code or start a browser helper to settle them.
- Before declaring a document written or handing it off, apply the checks owned by `references/brainstorm-sections.md`. Preserve source refs, limitations, blockers, and the next question across pauses; scratch is not durable handoff evidence.
- Project-level vocabulary and ADR changes belong to later explicitly authorized maintenance. This workflow records qualified promotion candidates only.
