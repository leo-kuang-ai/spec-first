# Skill Governance Review Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make spec-first end-to-end skill flow enforceable at runtime and auditable across the full skill catalog.

**Architecture:** Tighten the runtime hard-gate so every stage-bound skill is blocked outside its declared stage, then repair the few skill assets that currently break discoverability or reference integrity, and finally add catalog-level tests so the rules cannot silently drift again.

**Tech Stack:** TypeScript, Vitest, Markdown skill assets

---

### Task 1: Expand stage hard-gates to the full stage-bound skill set

**Files:**
- Modify: `src/core/skill-runtime/hard-gate.ts`
- Test: `tests/unit/hard-gate.test.ts`

**Step 1: Write the failing tests**

Add tests for:
- `spec` blocked outside `01_specify`
- `spec-review` blocked outside `01_specify`
- `research` blocked outside `02_design`
- `task` blocked outside `03_plan`
- `test` blocked outside `05_verify`

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/hard-gate.test.ts`
Expected: new assertions fail because hard-gate mapping is incomplete.

**Step 3: Write minimal implementation**

Update `HARD_GATE_STAGE_REQUIREMENTS` to cover all stage-bound skills.

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/hard-gate.test.ts`
Expected: PASS

### Task 2: Fix skill asset quality gaps

**Files:**
- Modify: `skills/spec-first/11-plan/SKILL.md`
- Modify: `skills/spec-first/20-spec-review/SKILL.md`

**Step 1: Write the failing test**

Add catalog assertions for:
- `11-plan` has a command declaration
- `20-spec-review` only references existing local paths

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/skill-catalog.test.ts`
Expected: FAIL on the two asset issues.

**Step 3: Write minimal implementation**

- Add command declaration to `11-plan/SKILL.md`
- Fix reference paths in `20-spec-review/SKILL.md`

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/skill-catalog.test.ts`
Expected: PASS

### Task 3: Add full catalog governance tests

**Files:**
- Create: `tests/unit/skill-catalog.test.ts`

**Step 1: Write the test**

Cover:
- every formal skill has valid front matter
- every referenced local `references/*.md` file exists
- every stage-bound skill has a hard-gate mapping
- every user-invocable stage skill exposes a command line

**Step 2: Run test to verify behavior**

Run: `npx vitest run tests/unit/skill-catalog.test.ts`
Expected: PASS after Tasks 1-2 are implemented.

### Task 4: Run focused regression verification

**Files:**
- Test: `tests/unit/hard-gate.test.ts`
- Test: `tests/unit/skill-runtime.test.ts`
- Test: `tests/unit/skill-catalog.test.ts`

**Step 1: Run focused tests**

Run: `npx vitest run tests/unit/hard-gate.test.ts tests/unit/skill-runtime.test.ts tests/unit/skill-catalog.test.ts`

**Step 2: Confirm results**

Expected: PASS with no new blocking regressions.

### Task 5: Write the review report

**Files:**
- Create: `docs/04-审查报告/2026-03-06-skill-governance-and-quality-review.md`

**Step 1: Summarize end-to-end flow findings**

Include:
- process flow conclusions
- runtime governance conclusions
- per-skill quality findings

**Step 2: Record outcomes**

Include:
- fixed issues
- residual risks
- recommended next batch
