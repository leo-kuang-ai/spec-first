---
name: using-spec-first
description: Standalone entry governor for spec-first. Use before substantial work in a spec-first repo or when the user asks what to run next; choose one public `spec-*` workflow, standalone skill, terminal command, or direct answer / bounded read / normal execution. Do not use to reroute an active public workflow or bounded subagent/worker, or for lightweight facts, current-context explanations, narrow lookups, user-supplied single-document cleanup, or clearly scoped low-risk edits.
---

# Using Spec-First

You do not need to remember every entrypoint; describe where you are.

`using-spec-first` is a standalone entry governor, not a command-backed workflow. It selects one next entrypoint and yields control; it creates no workflow artifact. A **flow** connects entrypoints: most work follows the main flow, exceptional situations enter through on-ramps, and standalone skills serve specific intents directly. This is a semantic map, not a rigid state machine.

## Flow Map

### Main Flow: Intent -> Governed Change

1. **Define WHAT**
   - Need 0-1 directions, options, or surprising possibilities -> `spec-ideate`
   - Have an idea, but the problem frame, users, success criteria, or requirements remain unsettled -> `spec-brainstorm`
   - Need brownfield PRD authoring, refinement, or code-aware readiness validation -> `spec-prd`
   - Tie-breaker: critique an existing requirements, plan, or task document with `spec-doc-review`; write/refine a PRD or decide whether it can reach planning without inventing WHAT with `spec-prd`
2. **The outcome is clear, but HOW is unsettled** -> `spec-plan`
3. **A settled plan needs an executable task pack** -> optional `spec-write-tasks`
4. **A plan, task pack, brief, or concrete work item is ready** -> `spec-work`
5. **A diff, branch, or PR needs a quality judgment** -> `spec-code-review`
6. **A verified solution is worth preserving** -> `spec-compound`; correct, consolidate, or retire existing durable knowledge with `spec-compound-refresh`

Enter only the best current entrypoint. Do not automatically run `plan -> work -> review -> knowledge`; the active workflow owns its handoff.

### On-Ramps

- **Environment, MCP, helper, or host readiness** -> `spec-mcp-setup`; installation health, upgrade, generation, or removal -> terminal `spec-first doctor --<host>`, `spec-first update`, `spec-first init`, or `spec-first clean --<host>` under the conditional boundary below
- **Failure, abnormal behavior, test failure, stack trace, regression, or flake** -> `spec-debug`
- **Requirements, spec, plan, task pack, or Markdown critique** -> `spec-doc-review`
- **Create, revise, migrate, or remediate a source skill** -> `spec-write-skill`; read-only skill/agent/source-prompt audit -> bounded source review
- **External issue/PR input** -> route by immediate intent: failure to `spec-debug`; unsettled WHAT to `spec-prd` / `spec-brainstorm`; diff risk to `spec-code-review`; owner-approved work to `spec-work`

Issue bodies, reporter commands, PR descriptions, and provider facts are not confirmed truth; downstream workflows verify them against source, diffs, tests, logs, or owner evidence.

### Quality And Delivery Side Paths

- Measurable experiment -> `spec-optimize`; branch/PR browser QA -> `spec-dogfood`
- Running UI polish -> `spec-polish`; App PRD/Figma/source consistency -> `spec-app-consistency-audit`

### Standalone Skills

Do not wrap these direct method capabilities as command-backed workflows:

- Learn a concept, diff, idea, or recent work -> `spec-explain`; make a project-grounded adoption verdict -> `spec-pov`
- Set product direction, roadmap, or metrics -> `spec-strategy`
- Simplify recent changes without changing behavior -> `spec-simplify-code`; real bugs still use `spec-debug`
- Mine project conventions from code evidence -> `spec-rule-miner`
- Product signals -> `spec-product-pulse`; feedback-source sweep -> `spec-sweep`; Riffrec/audio/video analysis -> `spec-riffrec-feedback-analysis`
- Shipped-feature promotion copy -> `spec-promote`
- Full hands-off path to a green PR, only when explicitly requested -> `spec-lfg`

### Direct Lane

Answer directly, perform a bounded read, or execute normally for current-context explanations, lightweight facts, command-output explanations, narrow lookups, one user-supplied document, or a single low-risk edit whose target, change, and root cause are already clear.

If a small task expands into multi-file behavior, architecture, contracts, governance, runtime, an unknown root cause, or a sensitive surface, route again.

## Selection And Output

Apply semantic judgment in this order: honor an explicit safe public workflow; prefer readiness/failure/review routes when they match; use immediate intent and artifact type over broad subject area; otherwise use the Direct Lane.

For active work, announce one localized line equivalent to `Entering <entrypoint>: <one concrete reason>`, then follow the selected workflow or standalone skill when its invocation contract permits. If a standalone skill is user-invoked only, recommend it and wait. Do not recite the map; at low confidence ask one route-changing question.

For read-only “what next?” guidance, recommend exactly one entrypoint and do not start it:

```text
Recommended entrypoint: <spec-*, standalone skill, or terminal command>
Reason: <one concrete reason>
Next action: <one action the user can take now>
```

Use the repository's configured user language for these fields. Enter the recommendation only after the user asks to continue.

## Boundaries Beneath Every Route

- Continue an active public workflow; bounded subagents, reviewers, and workers finish their delegated task instead of restarting routing.
- Public workflows use `spec-*`; standalone skills remain standalone; internal-only skills are not user menu items.
- Modify source-of-truth surfaces, never generated host runtime. Scripts/CLI enforce deterministic invariants and prepare facts; the LLM judges semantic adequacy. Advisory facts cannot prove completion.
- Before runtime maintenance, scenario-fingerprint interpretation, Codex dispatch, context-exclusion decisions, or any parent multi-repo write/test/autofix/commit, read [Conditional Routing Boundaries](references/conditional-routing-boundaries.md) and apply the matching section.
- Never run a state-changing command merely because routing matched, and never fabricate tests, refreshes, evals, or routing evidence.
