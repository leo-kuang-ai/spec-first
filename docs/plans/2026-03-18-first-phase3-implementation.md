# First Phase 3 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the minimum reliable phase-3 writeback loop so wrap-up/done can detect structural feature changes and incrementally update project-level `first` runtime truth plus docs projections.

**Architecture:** Reuse the existing governance trigger in `advance.ts` and extend it with a deterministic semantic path. Feature artifacts are parsed into `StructuralChange[]`, mapped to affected runtime assets, merged into the current `first` runtime JSON, then projected docs and governance logs are updated with the specific asset set touched by the change.

**Tech Stack:** TypeScript, Vitest, existing `first-runtime-store` / `first-doc-projection` / `first-governance` modules

---

### Task 1: Add structural change detection

**Files:**
- Create: `src/core/skill-runtime/first-change-detection.ts`
- Test: `tests/unit/first-change-detection.test.ts`

**Step 1: Write the failing tests**

- Cover `design.md` module/API/flow extraction
- Cover `retro.md` risk/convention extraction
- Cover `spec.md` fallback extraction
- Cover dedupe against existing runtime assets

**Step 2: Run tests to verify they fail**

Run: `pnpm -s vitest run tests/unit/first-change-detection.test.ts`

**Step 3: Implement minimal detector**

- Parse feature artifact sections by heading
- Emit deterministic `StructuralChange[]`
- Compare against current runtime truth to avoid duplicate adds

**Step 4: Run tests to verify they pass**

Run: `pnpm -s vitest run tests/unit/first-change-detection.test.ts`

### Task 2: Add asset mapping and incremental runtime update

**Files:**
- Create: `src/core/skill-runtime/first-asset-mapper.ts`
- Create: `src/core/skill-runtime/first-incremental-update.ts`
- Modify: `src/core/skill-runtime/first-context.ts`
- Test: `tests/unit/first-incremental-update.test.ts`

**Step 1: Write the failing tests**

- Map each change type to runtime assets and docs projections
- Incrementally merge summary/api/flow/convention data
- Refresh only affected docs and update runtime index entries

**Step 2: Run tests to verify they fail**

Run: `pnpm -s vitest run tests/unit/first-incremental-update.test.ts`

**Step 3: Implement minimal incremental updater**

- Merge only additive structural changes
- Reuse `refreshFirstDocsFromRuntime`
- Add/export runtime-index sync helper for targeted assets

**Step 4: Run tests to verify they pass**

Run: `pnpm -s vitest run tests/unit/first-incremental-update.test.ts`

### Task 3: Integrate semantic writeback into governance flow

**Files:**
- Modify: `src/core/skill-runtime/first-governance.ts`
- Modify: `src/core/process-engine/advance.ts`
- Test: `tests/unit/first-governance.test.ts`
- Test: `tests/integration/first-governance-e2e.test.ts`

**Step 1: Write/adjust failing tests**

- Feature-local structural changes should no longer be `must_not_update`
- Governance log should include structural changes and incremental mode
- wrap_up/done should trigger semantic writeback when feature artifacts changed

**Step 2: Run tests to verify they fail**

Run: `pnpm -s vitest run tests/unit/first-governance.test.ts tests/integration/first-governance-e2e.test.ts`

**Step 3: Implement governance integration**

- Detect structural changes for the current feature
- Prefer incremental structural writeback over generic refresh-all/docs-only
- Trigger `syncBackgroundInputStatus()` after successful writeback
- Extend governance log/result payload with structural metadata

**Step 4: Run tests to verify they pass**

Run: `pnpm -s vitest run tests/unit/first-governance.test.ts tests/integration/first-governance-e2e.test.ts`

### Task 4: Update docs and run final verification

**Files:**
- Modify: `docs/01-需求文档/优势借鉴分析/13-项目认知-done0317/new/2026-03-18-first-第三阶段技术改造方案.md`

**Step 1: Update phase-3 doc progress**

- Mark semantic detection / incremental update / governance integration as completed
- Keep LLM conflict resolution as remaining work

**Step 2: Run targeted plus full regression**

Run:

```bash
pnpm -s vitest run tests/unit/first-change-detection.test.ts tests/unit/first-incremental-update.test.ts tests/unit/first-governance.test.ts tests/integration/first-governance-e2e.test.ts
pnpm -s vitest run
```

**Step 3: Confirm outputs**

- Expected: all targeted tests pass
- Expected: full suite remains green
