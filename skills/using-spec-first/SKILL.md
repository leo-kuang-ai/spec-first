---
name: using-spec-first
description: Standalone entry governor for spec-first. Use before substantial work in a spec-first repo or when the user asks what to run next; choose one public `spec-*` workflow, standalone skill, terminal command, or Direct Lane. Do not use to reroute active public workflows or bounded workers, or for lightweight facts, current-context explanations, narrow lookups, user-supplied single-document cleanup, or clearly scoped low-risk edits.
---

# Using Spec-First

`using-spec-first` is a standalone entry governor, not a command-backed workflow. It selects one next entrypoint and yields control; it creates no workflow artifact. It is a semantic map, not a rigid state machine.

## Workflow Contract Summary

- **Input:** User intent, current workflow, artifact type, failure or environment signals, and project routing rules.
- **Output:** Hand control to one public workflow, standalone skill, command, or Direct Lane. The route map also defines `runtime-maintenance` and bounded source review.
- **Authority:** User intent and project source govern routing. Selection authorizes no downstream work, commit, or landing and creates no state.
- **Consumers:** The user, public workflows, standalone skills, and host entrypoints.

## Fast Paths

- Continue an active public workflow or bounded worker; do not restart routing.
- Use the Direct Lane only for current-context explanations, lightweight facts, command-output explanations, narrow lookups, one user-supplied document, or a single clearly scoped low-risk edit.
- Do **not** use the Direct Lane when the request includes document review/critique, a failure/error/stack trace, environment/setup/runtime concerns, an explicit workflow name, handoff/context reset, knowledge promotion, or an unresolved build goal, target user, success/acceptance criterion, or mutually exclusive implementation direction. If a Direct Lane task expands to multi-file behavior, architecture, governance, runtime, an unknown root cause, or a sensitive surface, stop and route again.

## Route Selection

These rules also apply when loaded standalone. Route failures, regressions, flakes, errors, or explicit fix requests to `spec-debug`, never Direct Lane. In an active workflow, the current owner handles failures and hands off only when they exceed its scope. Honor an explicitly named workflow. Route PR feedback to `spec-resolve-pr-feedback`, a green-PR request to `spec-lfg`, external adoption decisions to `spec-pov`, and cross-session handoffs to `spec-handoff`.

Hosts may shorten descriptions. Use the loaded instructions and route map for triggers, exclusions, and authority; length alone proves neither truncation nor misrouting.

For every request outside the fast paths, and to validate an explicit public route or answer “what next?”, read [Public Route Map](references/public-route-map.md). Select exactly one entrypoint; do not automatically chain the flow. Prefer readiness, failure, or review routes when they match; otherwise use immediate intent and artifact type. **Checkpoint — ask:** at low confidence, ask at most one route-changing question, then stop and wait for the answer before routing further.

For active work, announce one localized line equivalent to `Entering <entrypoint>: <one concrete reason>`, then follow the selected route. If a standalone skill is user-invoked only, recommend it and wait. For recommendation-only requests, return exactly one recommendation and wait:

Route missing required capabilities to `spec-runtime-setup`. If an optional capability is unavailable, disclose the limitation and continue. Do not automatically chain requirements to execution.

```text
Recommended entrypoint: <spec-*, standalone skill, or terminal command>
Reason: <one concrete reason>
Next action: <one action the user can take now>
```

Use the repository's configured user language. **Checkpoint — wait:** For recommendation-only, comparison, or next-step requests, give one entry and reason, then wait. When explicitly requested to execute, continue under existing authorization unless a route-changing fact or new side-effect authorization is missing.

For the first substantive result, identify host, target, entrypoint, time, outcome, source, and unfinished work. A welcome message, route recommendation, setup receipt, or file alone does not prove success. Do not create example files or automatically commit, release, or promote knowledge. The current owner retains the existing authorization.

## Exit Boundaries

Hard exit gates cover mutation, verification claims, source/runtime, handoff/context reset, and knowledge promotion. A route match never authorizes an exit. Never claim verification or completion without traceable evidence, and never fabricate tests, refreshes, evals, or routing evidence. Modify source-of-truth surfaces, never generated host runtime; scripts/tools prepare deterministic facts while LLMs judge semantic adequacy.

Before project-intelligence use, runtime maintenance, scenario-fingerprint interpretation, worker dispatch, the Codex startup reminder, ordinary-context exclusions, handoff/context reset, knowledge promotion, or any parent multi-repo write, test, autofix, or commit, read [Conditional Routing Boundaries](references/conditional-routing-boundaries.md) and apply the matching section.
