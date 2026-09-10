---
name: spec-pov
description: "Give a project-grounded verdict on an external candidate or change. Use to decide whether to adopt, switch, revisit, or compare a technology or approach, assess the impact of an external change, or get a second opinion. Not for neutral explanation or generating options."
argument-hint: "[the external thing to judge, plus any links] — or invoke bare mid-session for a second opinion"
---

# Form a Point of View

Return a decisive, **graded verdict** on something from the outside world — judged against *this project*, not in the abstract. The subject is the input in the current prompt or conversation. Stay read-only while forming and reconciling the POV; finish with the POV and its attribution, or an explicit blocker. Use the current host date when weighting source recency and dating artifacts.

## The one rule that is the whole moat

**Do not issue a verdict you did not earn against the project's own context.** The verdict must clear the project and external floors defined by `references/method.md`; neither conversation claims nor generic research substitutes for grounded evidence.

## Interaction Method

When a question is required, use the host's blocking question tool (`AskUserQuestion`, `request_user_input`, `ask_question`, or `ask_user`) one question at a time. Fall back to numbered chat options only when no blocking tool exists or the call errors; never silently skip the question.

## Dispatch Authorization Boundary

Before dispatching a repo profiler, project/precedent scout, or external researcher, record:

```yaml
worker_dispatch_authorization: authorized | missing
capability_probe: not_applicable | attempted | unavailable
worker_dispatch_capability: available | missing | unknown
worker_context_isolation: isolated | inherited | unknown
worker_model_override: supported | unsupported | unknown
worker_bounded_parallelism: supported | unsupported | unknown
worker_dispatch_outcome: <record the live result>
```

`workflow invocation does not authorize dispatch`. Dispatch is allowed only when the current user or a visible upstream handoff explicitly requests subagents, delegated work, personas, or parallel work. Without that authority, do not probe tool schemas; record `capability_probe: not_applicable` and `worker_dispatch_capability: unknown`, use bounded inline/serial grounding, and record `dispatch_authorization_missing`. Inline work **must not claim independent scout coverage**, fresh-context skepticism, or multi-agent evidence. With authority, use live facts for isolation, model override, parallelism, and provider receipts; degrade and record `worker_dispatch_outcome` when any are missing.

Capability discovery is `provider_untrusted` until confirmed. If no usable worker surface is found, record `subagent_capability_missing`; if the probe is unavailable or ambiguous, record `worker_capability_unproven` and keep the grounding path bounded inline/serial.

## Execution Flow

### Phase 0: Frame and Classify

**Read `references/intake.md` before any grounding.** It owns output mode, cold/warm framing, orientation, the selection escape hatch, approach-set freezing, product-design routing, and reversibility tiering. Read `references/boundaries.md` when fit is genuinely uncertain. An intent that routes out finishes at intake; a continuing POV proceeds with the settled subject, intent, and tier.

### Phase 1: Ground

**Read `references/grounding.md` before grounding.** It owns model tiers, the owner-only scratch fence, candidate-specific scout payloads, current project orientation, tier-sensitive lenses, capability gates, fallback semantics, and provenance buckets. Grounding returns bounded dossiers or inline observations; provider output remains advisory until its cited source is re-read.

### Phase 2: Verify

**Read `references/method.md` before reasoning.** It owns the Verify/Verdict steps, skeptic stance, subject-shape contract, tier sizing, and two-floor gate. A failed floor forbids a confident result and returns the failure result named there.

### Phase 3: Point of View

Form and freeze the independent POV and the complete approach set before emitting. If a summons exists, **read `references/cross-model-panel.md` before resolving participation**; it owns peer admission, receipts, unbiased payloads, reconciliation, disclosure, and the non-voting rule. Finish that branch before composing the result. Emit the subject-shape contract from `references/method.md` as a compact chat block, citing evidence rather than reprinting dossiers.

### Phase 4: Follow-up

**Read `references/followup.md` before follow-up decisions.** It owns the read-only close, four-part handoff gate, subject-shape routing, tier-gated continuation, optional write-up/capture, and warm-invocation guest rule. Implementation, commit, and landing remain outside this Skill.

**Warm invocations stay a guest:** output the POV block, hand control back, and offer no continuation unless the user asks.
