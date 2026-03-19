# Skill Governance And Phase-3 Closure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the remaining governance gaps around confirm-policy truth, phase-3 conflict blocking, and feature/status control-plane alignment without expanding scope.

**Architecture:** Tighten governance in three layers: docs/frontmatter as the declared source, router/CLI as the enforced source, and tests as the drift gate. For phase-3 writeback, add deterministic conflict detection before docs refresh so unsafe structural merges block instead of silently skipping.

**Tech Stack:** TypeScript, Vitest, markdown skill docs, existing CLI router and first-runtime modules

---

### Task 1: Lock confirm-policy governance with tests

**Files:**
- Modify: `tests/unit/skill-catalog.test.ts`
- Modify: `skills/spec-first/README.md`
- Modify: `skills/spec-first/*/SKILL.md`

**Step 1: Write the failing test**

Assert that every formal skill declares `confirm_policy` in frontmatter and that the value matches the README strategy table.

**Step 2: Run test to verify it fails**

Run: `pnpm -s vitest run tests/unit/skill-catalog.test.ts`

Expected: FAIL because most skills do not yet declare `confirm_policy`.

**Step 3: Write minimal implementation**

Add `confirm_policy` to each formal skill frontmatter and align the README table with the declared values.

**Step 4: Run test to verify it passes**

Run: `pnpm -s vitest run tests/unit/skill-catalog.test.ts`

Expected: PASS

### Task 2: Lock phase-3 conflict blocking with tests

**Files:**
- Modify: `tests/unit/first-incremental-update.test.ts`
- Modify: `tests/unit/first-governance.test.ts`
- Modify: `src/core/skill-runtime/first-incremental-update.ts`
- Modify: `src/core/skill-runtime/first-governance.ts`

**Step 1: Write the failing tests**

Add one test that feeds conflicting structural changes into incremental update and expects `conflicts` to be returned with no docs refresh. Add one governance test that expects writeback to be blocked when structural conflicts are detected.

**Step 2: Run tests to verify they fail**

Run: `pnpm -s vitest run tests/unit/first-incremental-update.test.ts tests/unit/first-governance.test.ts`

Expected: FAIL because conflicts are not currently produced or blocked.

**Step 3: Write minimal implementation**

Detect conflicting `update/remove` actions as explicit `ConflictRecord`s and make governance block when conflicts are present.

**Step 4: Run tests to verify they pass**

Run: `pnpm -s vitest run tests/unit/first-incremental-update.test.ts tests/unit/first-governance.test.ts`

Expected: PASS

### Task 3: Align feature help and docs with the enforced confirmation model

**Files:**
- Modify: `tests/unit/feature-skill-docs.test.ts`
- Modify: `src/cli/commands/feature.ts`
- Modify: `skills/spec-first/17-feature/SKILL.md`

**Step 1: Write the failing test**

Assert that skill docs and command help consistently show `switch <featureId> --yes`.

**Step 2: Run test to verify it fails**

Run: `pnpm -s vitest run tests/unit/feature-skill-docs.test.ts`

Expected: FAIL because command help still omits `--yes`.

**Step 3: Write minimal implementation**

Update CLI help and error usage text to match the documented confirmed switch path.

**Step 4: Run test to verify it passes**

Run: `pnpm -s vitest run tests/unit/feature-skill-docs.test.ts`

Expected: PASS

### Task 4: Verify targeted and full regression

**Files:**
- Test: `tests/unit/skill-catalog.test.ts`
- Test: `tests/unit/first-incremental-update.test.ts`
- Test: `tests/unit/first-governance.test.ts`
- Test: `tests/unit/feature-skill-docs.test.ts`

**Step 1: Run targeted regression**

Run: `pnpm -s vitest run tests/unit/skill-catalog.test.ts tests/unit/first-incremental-update.test.ts tests/unit/first-governance.test.ts tests/unit/feature-skill-docs.test.ts`

Expected: PASS

**Step 2: Run full regression**

Run: `pnpm -s vitest run`

Expected: PASS with no new failures

**Step 3: Run typecheck**

Run: `pnpm -s typecheck`

Expected: PASS
