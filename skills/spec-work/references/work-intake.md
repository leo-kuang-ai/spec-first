# Work Intake

## Owned

Bare-prompt discovery and bounded plan reading after the entrypoint classifies input.

## Not Owned

Task-pack validation, lifecycle/readiness classification, source ownership, or authorization. `references/work-intake-and-task-pack.md` remains the task-pack owner.

## Trigger

Read before scanning a bare prompt or reading an executable plan's implementation units.

## Fallback

If unavailable, stop before deriving implementation tasks; preserve the entrypoint's readiness and scope decisions.

**Bare prompt** (input is a description of work, not a file path):

0. **Open-ended symptom check.** A symptom report with no error text, no stack, no failing test, and no concrete reproducible behavior ("it feels off", "something is wrong somewhere, fix it") is an open-ended diagnosis request, not an implementation prompt: name `spec-debug` as the owning workflow and route there instead of entering implementation here. Finding and fixing the bug yourself inside this workflow is doing spec-debug's job in the wrong place, even when the diagnosis is quick.

1. **Scan the work area**

   - Identify files likely to change based on the prompt
   - Find existing test files for those areas (search for test/spec files that import, reference, or share names with the implementation files)
   - Note local patterns and conventions in the affected areas

2. **Assess complexity and route**

   | Complexity | Signals | Action |
   |-----------|---------|--------|
   | **Trivial** | 1-2 files, no behavioral change (typo, config, rename) | Proceed to Phase 1 step 2 (execution boundary), then implement directly — no task list, no execution loop. Apply Test Discovery if the change touches behavior-bearing code |
   | **Small / Medium** | Clear scope, under ~10 files | Build a task list from discovery. Proceed to Phase 1 step 2 |
   | **Large** | Cross-cutting, architectural decisions, 10+ files, touches auth/payments/migrations | Inform the user this would benefit from `spec-brainstorm` or `spec-plan` to surface edge cases and scope boundaries. Honor their choice. If proceeding, build a task list and continue to Phase 1 step 2 |

1. **Read Plan and Clarify** _(skip if arriving from Phase 0 with a bare prompt)_

   - For validated task-pack input, treat the resolved `source_plan` as the plan read below and use only the machine-readable `Task Pack Contract`/`execution_waves` for task creation. Follow `references/work-intake-and-task-pack.md`; do not re-split from the source plan or human-readable cards.
   - For unified plans, size your read. A short plan (lightweight or requirements-only, a screen or two) can be read in full. For a long implementation-ready plan, do **not** read the whole document first — it is expensive and unnecessary. Build a section map, then read only what the active unit needs: metadata, then `Goal Capsule`, `Verification Contract`, `Definition of Done`, the `Implementation Units` heading list, and only the active U-ID section plus referenced R/F/AE/KTD excerpts. Read appendices or unrelated U-IDs only when the active unit cites them. To build the map: in **markdown** scan headings (`rg -n '^#{1,3} ' <plan>` — top-level sections plus `### U<N>.` units); in **HTML** scan the `<h1>`–`<h3>` heading elements and their anchor ids. Match on the stable section names / unit IDs (`Goal Capsule`, `Verification Contract`, `### U<N>.`, …), ignoring HTML wrapper tags — not on a format-specific pattern.
   - For legacy plans, read the work document completely. Both formats (`.md`, `.html`) carry the same section names and IDs; HTML just wraps them in semantic elements (`<section>`, `<article>`, etc.).
   - Treat the plan as a decision artifact, not an execution script
   - If the plan includes sections such as `Implementation Units`, `Work Breakdown`, `Requirements` (or legacy `Requirements Trace`), `Files`, `Test Scenarios`, or `Verification`, use those as the primary source material for execution
   - Check for `Execution note` on each implementation unit — these carry the plan's natural-language execution direction for that unit (for example, start from failing proof, characterize legacy behavior, or prefer smoke/runtime verification). Note them when creating tasks, but do not reduce them to keyword matching.
   - Check for a `Deferred to Implementation` or `Implementation-Time Unknowns` section — these are questions the planner intentionally left for you to resolve during execution. Note them before starting so they inform your approach rather than surprising you mid-task
   - Check for a `Scope Boundaries` section — these are explicit non-goals. Refer back to them if implementation starts pulling you toward adjacent work
   - Review any references or links provided in the plan
   - For a direct implementation-ready plan whose unit count, dependency graph, context volume, or verification spread makes a derived index materially useful, suggest `spec-write-tasks` once as an optional path. Never auto-compile it and never block direct execution solely because a task pack would help.
   - If the user explicitly asks for TDD, test-first, characterization-first execution, or a specific verification style in this session, honor that direction even if the plan has no `Execution note`
   - Check current source, the plan, and the conversation first. Ask only about material ambiguity that cannot be resolved independently and affects the goal, acceptance, scope, or material side effects.
   - Explicit clarification answers take effect directly, without another approval of the same answer. Record necessary context and continue. If an answer introduces a new incompatible choice or material side effect, ask only about that new part.
   - **Do not edit the plan body during execution.** The plan is a decision artifact; progress lives in git commits and the task tracker, not the plan. The only permitted plan mutation is the final shipping closeout transition described in `references/shipping-workflow.md`: after the completion gates close, the tail owner may use the deterministic helper to change a Markdown source plan from `active` to `completed`. This marker is not progress or completion evidence. Leaf workers, reviewers, and subagents never mutate plan status. Legacy `- [ ]` / `- [x]` marks remain ignored; per-unit completion is determined from current source and verification evidence.
