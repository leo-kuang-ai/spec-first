# First Cognition Compiler Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade `first` from a project overview generator into a project cognition compiler with canonical runtime truth, phase-aware consumption, and writeback governance.

**Architecture:** Keep `.spec-first/runtime/first/` as the single source of truth, project only canonical docs into `docs/first/`, and evolve downstream skill injection from summary-only context to structured required/optional/fallback slices. Deliver in strict order: Phase 0.5 boundary cleanup, Phase 1 asset expansion plus consumption, then Phase 2 governance and writeback loop.

**Tech Stack:** TypeScript, Vitest, Spec-First runtime/context pipeline, CLI commands under `src/cli/commands`, runtime assets under `src/core/skill-runtime`.

---

## Progress Status

- Completed `T01-T03`: canonical vs legacy docs boundary, README projection contract, CLI/health wording alignment.
- Completed `T04`: `steering.json` runtime/store/bootstrap/context/projection loop.
- Completed `T05`: `conventions.json` runtime/store/bootstrap/context/projection loop.
- Completed `T06`: `critical-flows.json` runtime/store/bootstrap/context/projection loop, plus backward-compatible index normalization.
- Completed `T07`: `change-map.json` runtime/store/bootstrap/context/projection loop, plus `handleFirst` canonical docs restore path when runtime truth is healthy but projection docs are missing.
- Completed `T08`: `entry-guide.json` runtime/store/bootstrap/context/projection loop.
- Completed `T09`: `reboot-guide.json` runtime/store/bootstrap/context/projection loop.
- Completed `T10`: docs projection contract for all new canonical assets is stable and covered by refresh/projection tests.
- Completed `T11`: `context-resolver` now exposes `required / optional / fallback` skill context with stable degradation metadata.
- Completed `T12`: `onboarding/spec/design/task/plan/orchestrate/code/review/verify` now consume non-summary canonical assets in runtime notices.
- Completed `T13`: `project-cognition-updates.jsonl` append-only governance log under `.spec-first/runtime/first/`.
- Completed `T14`: `advance()` now triggers project cognition diff analysis on `06_wrap_up` and terminal `08_done`.
- Completed `T15`: minimal `Project Cognition Gate` now classifies `must_update / should_update / must_not_update` and blocks invalid writeback attempts without breaking stage advance.
- Completed `T16`: approved governance writes back canonical truth via `bootstrap / refresh-all / refresh-docs-from-runtime`.
- Completed `T17`: end-to-end governance verification now covers `wrap_up -> release -> done` runtime writeback and `release -> done` canonical docs reprojection through the real `advance()` path.
- Completed `T18`: enhancement projection docs now derive `common-playbooks.md` and `known-risks-and-traps.md` from existing runtime truth without expanding the runtime health contract.
- Completed `T19`: task-category injection now narrows `entry-guide` and `change-map` slices for planning/orchestrate style skills, reducing irrelevant context in large repos.
- Completed `T20`: governance update logs now reserve `topicKey / assetId / updateSource` metadata for a future memory backend without introducing one now.
- Verification refresh completed on `2026-03-16`: fixed init-chain regressions caused by legacy three-asset fixtures in `tests/unit/init.test.ts` and `tests/unit/cli-init-stage.test.ts`, and revalidated full repo health with `pnpm vitest run`, `pnpm typecheck`, `pnpm lint`.
- Latest verification baseline: `176` test files passed, `1571` tests passed, `7` skipped.
- Mainline target `T01-T20` is complete. Remaining work is follow-up hardening only, not a blocked primary task.

### Task 1: Phase 0.5 Boundary Cleanup

**Files:**
- Modify: `src/core/skill-runtime/first-artifact-mapping.ts`
- Modify: `src/core/skill-runtime/first-doc-projection.ts`
- Modify: `src/core/skill-runtime/first-change-detector.ts`
- Modify: `src/cli/commands/first.ts`
- Test: `tests/unit/first-artifact-mapping.test.ts`
- Test: `tests/unit/first-doc-projection.test.ts`
- Test: `tests/unit/first-command.test.ts`

**Step 1: Write the failing tests**

- Assert README projection contains `Canonical Projection Docs`, `Legacy / Reference Docs`, and `Skill Consumption Contract`
- Assert CLI help and runtime refresh output use `canonical projection docs`
- Assert `--check-health` output states it checks runtime truth plus canonical projection docs only

**Step 2: Run tests to verify RED**

Run: `pnpm vitest tests/unit/first-doc-projection.test.ts tests/unit/first-command.test.ts tests/unit/first-artifact-mapping.test.ts`
Expected: FAIL because current README/CLI wording does not expose canonical vs legacy boundaries.

**Step 3: Write minimal implementation**

- Introduce canonical projection doc constants in mapping layer
- Update README projection rendering to explain runtime canonical truth, canonical projection docs, legacy/reference docs, and consumption contract
- Tighten CLI and health wording to match the contract

**Step 4: Run tests to verify GREEN**

Run: `pnpm vitest tests/unit/first-doc-projection.test.ts tests/unit/first-command.test.ts tests/unit/first-artifact-mapping.test.ts`
Expected: PASS

### Task 2: Runtime Schema Expansion

**Files:**
- Modify: `src/core/skill-runtime/first-runtime-types.ts`
- Modify: `src/core/skill-runtime/first-runtime-store.ts`
- Modify: `src/core/skill-runtime/first-bootstrap.ts`
- Modify: `src/core/skill-runtime/first-context.ts`
- Modify: `src/core/skill-runtime/first-artifact-mapping.ts`
- Modify: `src/core/skill-runtime/first-doc-projection.ts`
- Test: `tests/unit/first-runtime-types.test.ts`
- Test: `tests/unit/first-runtime-store.test.ts`
- Test: `tests/unit/first-context.test.ts`
- Test: `tests/unit/first-doc-projection.test.ts`

**Step 1: Write failing tests for new canonical assets**

- Add coverage for `steering.json`
- Add coverage for `conventions.json`
- Add coverage for `critical-flows.json`
- Add coverage for `change-map.json`
- Add coverage for `entry-guide.json`
- Add coverage for `reboot-guide.json`

**Step 2: Run tests to verify RED**

Run: `pnpm vitest tests/unit/first-runtime-types.test.ts tests/unit/first-runtime-store.test.ts tests/unit/first-context.test.ts tests/unit/first-doc-projection.test.ts`
Expected: FAIL because schema/store/projection do not yet support new assets.

**Step 3: Write minimal implementation**

- Extend runtime types and store readers/writers/index health entries
- Bootstrap minimal non-empty structured assets with evidence
- Project only canonical docs for these assets

**Step 4: Run tests to verify GREEN**

Run: `pnpm vitest tests/unit/first-runtime-types.test.ts tests/unit/first-runtime-store.test.ts tests/unit/first-context.test.ts tests/unit/first-doc-projection.test.ts`
Expected: PASS

### Task 3: Skill Consumption Upgrade

**Files:**
- Modify: `src/core/skill-runtime/context-resolver.ts`
- Modify: `src/core/skill-runtime/dispatcher.ts`
- Modify: `src/core/skill-runtime/first-context.ts`
- Test: `tests/unit/context-resolver.test.ts`
- Test: `tests/unit/dispatcher-first-runtime.test.ts`
- Test: `tests/integration/skill-render.test.ts`

**Step 1: Write failing tests**

- Assert resolved context exposes `required`, `optional`, and `fallback`
- Assert non-summary canonical assets are injected for `spec/design/code/verify`
- Assert missing required assets emit stable warnings/recommendations

**Step 2: Run tests to verify RED**

Run: `pnpm vitest tests/unit/context-resolver.test.ts tests/unit/dispatcher-first-runtime.test.ts tests/integration/skill-render.test.ts`
Expected: FAIL because current resolver mainly injects summary-level context.

**Step 3: Write minimal implementation**

- Expand resolved context structure
- Add phase-aware asset selection and downgrade path
- Update dispatcher prompt assembly to surface richer slices

**Step 4: Run tests to verify GREEN**

Run: `pnpm vitest tests/unit/context-resolver.test.ts tests/unit/dispatcher-first-runtime.test.ts tests/integration/skill-render.test.ts`
Expected: PASS

### Task 4: Phase-Aware Skill Adoption

**Files:**
- Modify: skill runtime/context injection code used by onboarding/spec/design/task/code/verify
- Test: `tests/unit/onboarding-skill-docs.test.ts`
- Test: `tests/unit/spec-skill-docs.test.ts`
- Test: `tests/unit/design-skill-docs.test.ts`
- Test: `tests/unit/task-skill-docs.test.ts`
- Test: `tests/unit/code-skill-docs.test.ts`
- Test: `tests/unit/verify-skill-docs.test.ts`

**Step 1: Write failing tests**

- Verify each target skill consumes at least one non-summary canonical asset

**Step 2: Run tests to verify RED**

Run: `pnpm vitest tests/unit/onboarding-skill-docs.test.ts tests/unit/spec-skill-docs.test.ts tests/unit/design-skill-docs.test.ts tests/unit/task-skill-docs.test.ts tests/unit/code-skill-docs.test.ts tests/unit/verify-skill-docs.test.ts`
Expected: FAIL until adoption is wired.

**Step 3: Write minimal implementation**

- Hook steering/reboot/critical-flows/change-map/entry-guide into the correct skills in staged order

**Step 4: Run tests to verify GREEN**

Run: `pnpm vitest tests/unit/onboarding-skill-docs.test.ts tests/unit/spec-skill-docs.test.ts tests/unit/design-skill-docs.test.ts tests/unit/task-skill-docs.test.ts tests/unit/code-skill-docs.test.ts tests/unit/verify-skill-docs.test.ts`
Expected: PASS

### Task 5: Governance and Writeback Loop

**Files:**
- Modify: runtime store and done/wrap-up related command/runtime files
- Add/Modify: cognition diff analyzer and gate evaluator files
- Test: `tests/unit/control-plane-governance.test.ts`
- Test: `tests/unit/release-evidence-governance.test.ts`
- Test: `tests/integration/skill-integration.test.ts`

**Step 1: Write failing tests**

- Assert `project-cognition-updates.jsonl` is appended
- Assert wrap_up/done computes cognition diff with `must_update/should_update/must_not_update`
- Assert `Project Cognition Gate` blocks invalid project-level writeback

**Step 2: Run tests to verify RED**

Run: `pnpm vitest tests/unit/control-plane-governance.test.ts tests/unit/release-evidence-governance.test.ts tests/integration/skill-integration.test.ts`
Expected: FAIL because governance loop is incomplete.

**Step 3: Write minimal implementation**

- Add append-only update log
- Add diff analyzer and gate decision
- Refresh canonical truth and docs projection after approved writeback

**Step 4: Run tests to verify GREEN**

Run: `pnpm vitest tests/unit/control-plane-governance.test.ts tests/unit/release-evidence-governance.test.ts tests/integration/skill-integration.test.ts`
Expected: PASS

### Task 6: End-to-End Verification

**Files:**
- Modify: end-to-end or integration test files as needed
- Test: `tests/integration/skill-render.test.ts`
- Test: `tests/integration/skill-integration.test.ts`
- Test: `tests/e2e/core-flow.test.ts`

**Step 1: Write failing end-to-end coverage**

- Simulate first generation, downstream consumption, wrap_up/done, and project cognition writeback

**Step 2: Run tests to verify RED**

Run: `pnpm vitest tests/integration/skill-render.test.ts tests/integration/skill-integration.test.ts tests/e2e/core-flow.test.ts`
Expected: FAIL until the closed loop is complete.

**Step 3: Write minimal implementation**

- Fill any remaining gaps exposed by the end-to-end scenario

**Step 4: Run final verification**

Run: `pnpm vitest`
Run: `pnpm lint`
Run: `pnpm typecheck`
Expected: PASS
