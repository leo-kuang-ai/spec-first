# Implementation Loop

## Owned

Execute a dependency-ready slice, capture evidence, apply existing patterns, and track completion. `references/execution-strategy.md` owns commit and dispatch authorization; `references/feedback-and-tests.md` owns proof selection; `references/implementation-quality.md` owns durable-surface and simplification decisions.

## Not Owned

Changing plan scope, inventing authorization, semantic completion from script output alone, or bypassing caller/standalone shipping gates.

## Trigger

Read before the first implementation write, including trivial work, and use it for each unit or authorized independent wave.

## Fallback

Do not implement or declare completion without the loop's scope and evidence checks. Missing dispatch uses the authorized inline path; missing verification keeps completion open.

1. **Task Execution Loop**

   Execute one dependency-ready unit/task at a time, or one bounded disjoint wave when dispatch/isolation facts allow it:

   1. Recheck task-pack/source-plan pins and `stop_if` when applicable; drift or stop conditions halt this task and dependents before mutation.
   2. Capture pre-task dirty/untracked/file facts, read the active unit packet and current source, and verify whether the work already exists before reimplementing. When any part of the unit's completion depends on out-of-repo state (a console setting, DNS record, CMS object, live-system rows), that part has no git-derived completion signal: decide it from the observed state of the deliverable, never from a clean tree or a tracker write — mark complete only when that state is already satisfied; execute only when it is observably unsatisfied and re-applying is safe or the user has authorized it; otherwise ask or block. Repository-derived completion still follows the already-exists check above.
   3. For behavior-bearing work, apply [Feedback and tests](feedback-and-tests.md): establish the smallest loop, choose proof/characterization/replacement evidence, and keep the slice vertical.
   4. Before durable-surface mutation, apply [Implementation quality](implementation-quality.md): inventory current owners, recheck `reuse / extend / compose / new`, and stop back on unapproved architecture/scope.
   5. Implement only the current slice in canonical source, update the correct existing/new tests, rerun the same loop, then run applicable system-wide/integration checks.
   6. Inspect the actual changed tree against declared scope; record behavior/test/red-or-characterization/command/result/exception evidence. Do not reconstruct worker-only pre-implementation observations from the diff.
   7. For task packs, compute attributed task delta facts and close any `review_gate: required` with bounded `spec-code-review mode:agent` before dependent waves. Caller-owned fixes rerun affected verification; at most one follow-up review is allowed. Blocking/degraded round two stops; non-blocking P2/P3 remains run-local residual work.
   8. Mark complete only after scope, evidence, required review, and blockers close. Record a logical commit candidate; create it only with `commit_authorization: authorized`.

   Execution notes are intent, not enums. Proof-first requires observing the expected failure before production change; characterization records existing behavior without declaring it correct. Trivial rename/config/style/generated/manual-only work may use an explicit replacement check. Never add duplicate tests merely to demonstrate ceremony, over-implement beyond the active slice, or claim coverage for a check that did not run.
2. **Commit Checkpoint**

   Follow `references/execution-strategy.md` § Commit Authorization. Local implementation and green tests do not authorize a commit. Workers never commit. Without explicit commit authorization, keep verified changes uncommitted and report coherent commit candidates; with authorization, the orchestrator stages only run-owned files and commits only a verified logical unit.

3. **Follow Existing Patterns**

   - The plan should reference similar code - read those files first
   - Match naming conventions exactly
   - Reuse existing components where possible
   - Follow the project's coding standards already in your context
   - When in doubt, grep for similar implementations

4. **Test Continuously**

   - Run relevant tests after each significant change
   - Don't wait until the end to test
   - Fix failures immediately
   - Add new tests for new behavior, update tests for changed behavior, remove tests for deleted behavior
   - **Unit tests with mocks prove logic in isolation. Integration tests with real objects prove the layers work together.** If your change touches callbacks, middleware, or error handling — you need both.

5. **Simplify as You Go**

   At a behavior-cluster/dependency-wave boundary, read `references/implementation-quality.md` § Simplification At Phase Boundaries. Classify findings as `remove-now`, `minimality-debt`, `protected`, or `architecture-mismatch`; do not default to extract-helper, delete security/data-integrity/a11y/observability/required-verification code for lower LOC, or widen scope to pay unrelated debt.

   If **`spec-simplify-code`** is available, invoke it at phase boundaries (especially before Phase 3 when the cluster has >=30 substantive human-authored code lines). Generated, mechanical, configuration-only, or test-fixture volume alone does not trigger this threshold. Preserve the same classification and protected-surface constraints. Pass relevant settled decisions as structure constraints, not as an expansion of the simplification scope; concrete defect evidence still requires resolution. Otherwise, perform the bounded pass inline. Rerun the same feedback loop for every `remove-now` or authorized architecture correction.

6. **Figma Design Sync** (if applicable)

   For UI work with Figma designs:

   - Implement components following design specs
   - Read `references/agents/figma-design-sync.md` to compare implementation against the Figma design. Dispatch a generic subagent only when `references/execution-strategy.md` permits it; otherwise apply the same prompt inline and disclose missing independent coverage.
   - Fix visual differences identified
   - Repeat until implementation matches design

7. **Frontend Design Guidance** (if applicable)

   For UI tasks without a Figma design -- where the implementation touches view, template, component, layout, or page files, creates user-visible routes, or the plan contains explicit UI/frontend/design language:

   - Apply the frontend guidance embedded in this skill and the active repo instructions: preserve existing design-system conventions, use real UI controls and states, keep layouts responsive, and verify text does not overflow or overlap.
   - When browser tooling is available, inspect the changed UI at desktop and mobile widths before final validation. If no browser access is available, do a code-level responsive/layout review and record that browser verification was unavailable.
   - Phase 4's screenshot capture still applies when the change is user-visible.

8. **Track Progress**
   - Keep the task list updated as you complete tasks
   - Note any blockers or unexpected discoveries
   - Do not create replacement tasks when scope expands; for task-pack input honor `stop_if` and return to `spec-write-tasks`/`spec-plan`, and for direct-plan input return to the plan owner when acceptance, architecture, ownership, or verification scope changes
   - Keep user informed of major milestones
   - When the plan defines U-IDs for Implementation Units, or the plan or origin document carries stable R-IDs (and optionally A/F/AE IDs), reference them in blockers, deferred-work notes, task summaries, and final verification — not routine status updates. U-IDs anchor units across plan edits; R/A/F/AE anchor product intent across the brainstorm-plan handoff. Use the IDs the plan supplies and do not invent ones it does not. This preserves traceability without burying signal under noise.
