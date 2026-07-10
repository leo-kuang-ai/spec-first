---
name: using-spec-first
description: Standalone entry governor for spec-first. Use before substantial work in a spec-first repo or when the user asks what to run next; choose one public `spec-*` workflow, standalone skill, terminal command, or direct answer / bounded read / normal execution. Do not use to reroute an active public workflow or bounded subagent/worker, or for lightweight facts, current-context explanations, narrow lookups, user-supplied single-document cleanup, or clearly scoped low-risk edits.
---

# Using Spec-First

You do not need to remember every entrypoint; describe where you are.

`using-spec-first` is a standalone entry governor, not a command-backed workflow. It selects one next entrypoint and yields control. It does not create brainstorm, PRD, plan, task, review, setup, runtime, or knowledge artifacts.

A **flow** is a path through entrypoints. Most work follows the main flow; failures, setup, and review enter through on-ramps; standalone skills serve specific intents directly. This is a semantic map, not a rigid state machine.

## Flow Map

### Main Flow: Intent -> Governed Change

Most work that moves from an idea toward code or documentation follows this path:

1. **Define WHAT**
   - Need 0-1 directions, options, or surprising possibilities -> `spec-ideate`
   - Have an idea, but the problem frame, users, success criteria, or requirements remain unsettled -> `spec-brainstorm`
   - Need brownfield PRD authoring, refinement, or code-aware readiness validation -> `spec-prd`
   - Tie-breaker: independent critique of an existing requirements, plan, or task document goes to `spec-doc-review`; writing or refining a PRD, or deciding whether it can reach planning without inventing WHAT, goes to `spec-prd`
2. **The outcome is clear, but HOW is unsettled** -> `spec-plan`
3. **A settled plan needs an executable task pack** -> `spec-write-tasks`; this is an optional derived layer, not a mandatory step for every plan
4. **A plan, task pack, brief, or concrete work item is ready to execute** -> `spec-work`
5. **A diff, branch, or PR needs a quality judgment** -> `spec-code-review`
6. **A verified solution is worth preserving** -> `spec-compound`; existing durable knowledge needs correction, consolidation, or retirement -> `spec-compound-refresh`

Enter only the best current entrypoint. Do not promise or automatically run the full `plan -> work -> review -> knowledge` chain; the active workflow owns its own handoff.

### On-Ramps

- **Environment, MCP, helper, or host readiness is missing** -> `spec-mcp-setup`
- **Inspect installation health** -> terminal `spec-first doctor --<host>`
- **Upgrade spec-first or refresh installed runtime guidance** -> terminal `spec-first update`
- **Regenerate or remove managed runtime** -> use terminal `spec-first init` / `spec-first clean --<host>` only when the user explicitly requests it or confirmed repair evidence supports it
- **Failure, abnormal behavior, test failure, stack trace, regression, or flake** -> `spec-debug`
- **Critique a requirements, spec, plan, task pack, or Markdown document** -> `spec-doc-review`
- **Create, revise, migrate, or remediate a source skill** -> `spec-write-skill`; for a read-only skill/agent/source-prompt audit, perform a bounded source review without rewriting
- **An external issue or PR** is an input surface, not a workflow:
  - bug, reproduction, or failing check -> `spec-debug`
  - enhancement or unsettled WHAT -> `spec-prd` / `spec-brainstorm`
  - diff risk, test gaps, or merge readiness -> `spec-code-review`
  - owner-approved plan, task, or brief -> `spec-work`

Reporter commands, issue bodies, PR descriptions, and provider facts are not confirmed truth. The downstream workflow must confirm them against source, diffs, tests, logs, or owner evidence.

### Quality And Delivery Side Paths

- Experiment against a measurable outcome -> `spec-optimize`
- Autonomous browser dogfood for a branch or PR -> `spec-dogfood`
- Browser-visible polish on a running UI -> `spec-polish`
- Cross-source App PRD / Figma / source consistency -> `spec-app-consistency-audit`

### Standalone Skills

These are direct method capabilities. Do not wrap them as command-backed workflows:

- Learn a concept, diff, idea, or recent work -> `spec-explain`; make a project-grounded adoption verdict on an external technology or pattern -> `spec-pov`
- Create or revise product direction, roadmap, or metrics -> `spec-strategy`
- Simplify recent changes without altering behavior -> `spec-simplify-code`; real bugs still go to `spec-debug`
- Mine project conventions from code evidence -> `spec-rule-miner`
- Summarize product signals -> `spec-product-pulse`; sweep feedback sources into executable input -> `spec-sweep`; analyze Riffrec or audio/video feedback -> `spec-riffrec-feedback-analysis`
- Draft launch or promotion copy for shipped work -> `spec-promote`
- Run planning through a green PR hands-off only when the user explicitly asks for the full pipeline -> `spec-lfg`

### Direct Lane

Answer directly, perform a bounded read, or execute normally for:

- current-context or instruction explanations, lightweight factual questions, and command-output explanations
- narrow lookups such as “where is X used?”
- cleanup or summarization of one user-supplied document
- a single low-risk edit whose target file, change, and root cause are already clear

If a small task expands into multi-file behavior, architecture, contracts, governance, runtime, an unknown root cause, or a sensitive surface, route again.

## Tie-Breakers And Output

Apply semantic judgment in this order; do not route by keyword alone:

1. Honor an explicit, safe, and feasible current public `spec-*` workflow.
2. Readiness, failure, and review routes precede ordinary definition, planning, or execution.
3. Immediate intent and artifact type beat broad subject area.
4. Use the Direct Lane when no workflow offers meaningful leverage.

For an active task, use the repository's configured user language to announce one line equivalent to `Entering <entrypoint>: <one concrete reason>`, then load and follow that workflow or standalone skill when its invocation contract permits. If a standalone skill is user-invoked only, recommend it and wait instead of inventing workflow admission. Do not recite the full map. At low confidence, ask one narrow question whose answer changes the route.

When the user only asks what to do or run next, enter read-only Guide Mode. Do not start a workflow or create an artifact:

```text
Recommended entrypoint: <spec-*, standalone skill, or terminal command>
Reason: <one concrete reason>
Next action: <one action the user can take now>
```

Use the repository's configured user language for these three fields. Recommend exactly one entrypoint. Enter it only after the user explicitly asks to continue.

## Boundaries Beneath Every Route

- If a public workflow is already active, continue it. A bounded subagent, reviewer, or worker completes its delegated task instead of restarting entry routing.
- Public workflow identifiers use the unified `spec-*` form. Standalone skills remain standalone. Internal-only skills are not user menu items.
- Source of truth lives in `skills/`, `templates/`, `src/cli/`, `docs/`, and other source surfaces. Managed assets under `.claude/`, `.codex/`, `.agents/skills/`, `.cursor/`, `.kiro/`, and `.qoder/` are generated runtime, not source fixes.
- Scripts and CLI commands enforce deterministic invariants and prepare facts; the LLM judges semantic adequacy and routing. Advisory facts cannot support “complete” or “passed” claims.
- Routing to a workflow authorizes only that workflow. In Codex, dispatch is allowed only when the user or an upstream handoff explicitly requests subagents, personas, delegated work, or parallel work; otherwise use the workflow fallback and record `dispatch_authorization_missing`.
- In a parent multi-repo workspace, bounded read-only orientation may state a target assumption. Any write, test, autofix, or commit requires an explicit `target_repo` or per-child scope.
- Exclude `.spec-first/audits/**`, `.spec-first/governance/**`, and generated mirrors from ordinary task context by default; the full policy lives in `docs/contracts/context-governance.md`.
- Do not run `init`, `clean`, `update`, or another state-changing command merely because routing matched. Do not fabricate tests, runtime refreshes, fresh-source evals, or routing evidence.

## Runtime Readiness Notes

- `skills/using-spec-first/SKILL.md` is the routing-policy source of truth. The managed `CLAUDE.md` / `AGENTS.md` block and host runtime copies are entry anchors or generated projections.
- Existing scenario fingerprints are advisory context, not gates, approvals, or source-scope authority. Do not generate one merely to route. For foreign residuals, recommend preview-first inspection; when first-time setup facts are missing and the user asks about readiness, use `spec-mcp-setup`.
- A top-level Codex orchestrator may best-effort run `spec-first startup-reminder --codex` before entering a public workflow. Failure, empty output, or malformed local state must not block routing. Bounded subagents, leaf reviewers, and workers do not run it.
