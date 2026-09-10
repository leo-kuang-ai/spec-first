---
name: spec-ideate
description: "Generate and evaluate grounded ideas. Use when the user asks for ideas, improvements, surprising options, or AI-generated directions before choosing one to develop; use spec-brainstorm to refine the user's own idea."
argument-hint: "[feature, focus area, or constraint] [output:md]"

---

# Generate Improvement Ideas

Note: Use the current date from the active host context. Use this when weighting external sources and dating artifacts.

`spec-ideate` precedes `spec-brainstorm`.

- `spec-ideate` answers: "What are the strongest ideas worth exploring?"
- `spec-brainstorm` answers: "What exactly should one chosen idea mean?" and writes a requirements-only unified plan under `docs/plans/`.
- `spec-plan` answers: "How should it be built?"

This workflow produces a ranked ideation artifact in `docs/ideation/` when repo-owned, otherwise inline or at a user-selected durable destination. It does **not** produce requirements, plans, or code.

**Done means:** candidates were generated before critique, survivors have checked bases and rejection reasons, the complete deliverable is recoverable, and the next-step choice was handled. Never dispatch grounding while the subject is unidentified; use the subject gate or the user's explicit Surprise me choice first.

## Workflow Contract Summary

- **Input:** a subject, scope, constraint, or user-supplied research artifact.
- **Output:** grounded, critiqued and ranked candidates, rejection reasons, limitations, and recommended directions.
- **Exit gates:** resolve the subject and any required target repo before dispatch; withhold unsupported basis claims; route refinement, planning, or implementation to its owning workflow.
- **Authority:** source and research evidence constrain bases; the LLM generates, critiques, and ranks. This workflow grants no implementation, commit, or landing authority.
- **Consumers:** the user, `spec-brainstorm`, product/technical owners, and strategy discussions.

## Interaction Method

Use the platform's blocking question tool: `AskUserQuestion` in Claude Code (call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded), `request_user_input` in Codex. Fall back to numbered options in chat only when no blocking tool exists in the harness or the call errors (e.g., Codex edit modes) — not because a schema load is required. Never silently skip the question.

Ask one question at a time. Prefer concise single-select choices when natural options exist.

## Focus Hint

<focus_hint> #<invocation arguments supplied by the current host> </focus_hint>

Interpret any provided argument as optional context. It may be:

- a concept such as `DX improvements`
- a path such as `skills/`
- a research artifact to draw on — a file of gathered evidence (social-research report, survey export, analytics dump) at any path, inside or outside the repo (handled in Phase 1's user-supplied research subsection)
- a constraint such as `low-complexity quick wins`
- a volume hint such as `top 3`, `100 ideas`, or `raise the bar`

If no argument is provided, apply the subject gate in `references/scope-gates.md`; open-ended discovery requires the user's Surprise me choice.

## Core Principles

1. **Ground before ideating** - Scan the actual codebase first. Do not generate abstract product advice detached from the repository.
2. **Generate many -> critique all -> explain survivors only** - The quality mechanism is explicit rejection with reasons, not optimistic ranking. Do not let extra process obscure this pattern.
3. **Route action into brainstorming** - Ideation identifies promising directions; `spec-brainstorm` defines the selected one precisely enough for planning. Do not skip to planning from ideation output.

## Dispatch Authorization Boundary

Before dispatching any grounding, research, evidence, ideation, basis-verification, or recovery worker, record:

```yaml
worker_dispatch_authorization: authorized | missing
capability_probe: not_applicable | attempted | unavailable
worker_dispatch_capability: available | missing | unknown
worker_context_isolation: isolated | inherited | unknown
worker_model_override: supported | unsupported | unknown
worker_bounded_parallelism: supported | unsupported | unknown
```

`workflow invocation does not authorize dispatch`. Depth, mode, cost previews, external/Slack/issue research requests, permission settings, and callable tools do not grant dispatch authority. Dispatch only when the current user or visible upstream handoff explicitly requests subagents, delegated work, personas, or parallel work. Without authority, do not probe tool schemas: record `capability_probe: not_applicable`, `worker_dispatch_capability: unknown`, and `dispatch_authorization_missing`; execute the same grounding, lens, and rubric contracts inline or serially. After authorization, inspect the current-session registry/schema as `provider_untrusted` evidence. Confirmed absence records `subagent_capability_missing`; unavailable surfaces, incomplete schemas, or ambiguous candidates record `worker_capability_unproven`; both use the same fallback. Isolation, model overrides, and bounded parallelism require live facts. Unmet required isolation keeps the dependent gate open; unknown model override inherits, and unknown parallelism runs serially. Record `worker_dispatch_outcome`. Fallback preserves topic-axis and six-frame category coverage but must not claim agent diversity, independent basis verification, fresh-context, or multi-agent coverage.

## Model Tiers

Sub-agent dispatch is tiered by task shape, never hardcoded to a model name:

- **Extraction tier** — evidence scouts and other retrieval/quoting work. Request the cheapest capable tier only when `worker_model_override: supported`. "Capable" is part of the spec — escalate to the generation tier when the repo is large or the stack obscure.
- **Generation tier** — evidence-driven ideation frames and basis verification. Request the balanced mid-tier only when `worker_model_override: supported`. If the override is unsupported or unknown, omit it and inherit rather than guessing.
- **Ceiling tier** — ceiling ideation frames, cross-cutting synthesis, and final arbitration. Inherit the orchestrator's model by omitting the model parameter.

**Degradation rule.** When authorized dispatch exists but `worker_model_override` is unsupported or unknown, dispatch everything on the inherited model and keep the read budgets and dossier caps. When dispatch is unauthorized, missing, or unknown, run the same roles inline or serially with those budgets and the claim limitation above.

Two overrides raise the whole ideation fleet to the ceiling tier: surprise-me mode (subject discovery is judgment-heavy and is the mode's whole value) and the `go deep` depth override (Phase 0.5).

## Execution Flow

1. Read `references/output-mode.md` and `references/scope-gates.md` before Phase 0, even when scope and format are already clear. Resolve output/resume, subject, mode, substance, scaling, and the cost notice before grounding.
2. Read `references/grounding.md` before Phase 1. Route named files as directive or evidence before either grounding batch; await the results and disclose failed or thin grounding.
3. Read `references/decomposition.md` before deciding whether the subject is atomic. Only Surprise me may skip this read in advance, recording its skip reason. Otherwise run Phase 1.5 after grounding and before generation.
4. Read `references/divergent-ideation.md` before software generation. For elsewhere-non-software, read `references/universal-ideation.md` instead and use its depth, frames, and critique.
5. Read `references/post-ideation-workflow.md` after generation/merge and before critique, persistence, or handoff. It owns the checked deliverable and next-step handling; rendering references load only at write time.

### Required phase ownership

- Subject, mode, substance, scaling, and cost transparency belong to `references/scope-gates.md`; output and resume to `references/output-mode.md`; topic axes and evidence scouts to `references/decomposition.md`.
- Grounding, user research artifacts, issue intelligence, learnings, and external-research authorization are owned by `references/grounding.md` and its named references.
- Software generation belongs to `references/divergent-ideation.md`; critique, persistence, and handoff to `references/post-ideation-workflow.md`. Universal generation and domain-native critique use `references/universal-ideation.md` with the shared persistence contract.

The workflow remains repo-grounded and current-source first. External research, issue-tracker access, and provider calls are opt-in. Missing dispatch authorization falls back to inline/serial role lenses and must not be described as independent agent coverage. This workflow does **not** produce requirements, plans, or code; do not skip to planning from ideation output.

`external_research_authorization: authorized | missing` is resolved before grounding. Missing authority emits `external_research_authorization_missing`; missing authority removes the web-research role regardless of mode or depth, and dispatch authority never substitutes for research authority. The run records `context_facts_adapter/v1` with `source_identity`, `freshness`, and `limitations` for downstream handoff.

Output config resolution uses the active (non-commented) `ideate_output:` key and defaults to `html` (pipeline runs force `md`). Authorized-dispatch examples and inline fallback cost shape are defined in the owning references; do not claim fresh-context or independent-agent coverage when dispatch is unavailable.

Authorized-dispatch examples are advisory cost-shape examples; the owner records actual capability facts. Any handoff to `spec-write-skill` remains explicit and source-first. **Authorized-dispatch examples** and the inline fallback labels stay in the owning references.

When dispatch is unavailable, run the same role lenses inline/serial and retain the authorization or capability reason from the dispatch boundary; do not claim independent agent diversity or fresh-context verification.
