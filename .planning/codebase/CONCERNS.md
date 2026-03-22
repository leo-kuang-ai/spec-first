# Codebase Concerns

> Generated: 2026-03-23
> Focus: concerns

## Summary

The spec-first codebase is generally healthy with strong test coverage and clear architecture. Primary concerns center around the large monolithic `gen-skill-docs.ts` file (1947 lines), pervasive use of `any` types, and environment-dependent test behavior that could cause CI flakiness.

## Critical Concerns

### 1. Large Monolithic Generator File

**Issue:** `scripts/gen-skill-docs.ts` is 1947 lines, handling template parsing, placeholder resolution, validation, and generation for multiple hosts (Claude, Codex).

**Files:** `scripts/gen-skill-docs.ts`

**Impact:** Difficult to test, maintain, and reason about. Changes risk breaking multiple skills simultaneously.

**Fix approach:** Split into focused modules:
- `template-parser.ts` - Template reading and placeholder extraction
- `resolvers/` - One resolver per placeholder type
- `validators/` - Skill validation logic
- `generator.ts` - Orchestration only

### 2. Pervasive `any` Type Usage

**Issue:** 30+ instances of `any` type usage across codebase, weakening TypeScript's safety guarantees.

**Files:**
- `browse/src/server.ts` - `handleCommand(body: any)`, `wrapError(err: any)`
- `browse/src/snapshot.ts` - `(opts as any)[flag.optionKey]`
- `test/helpers/session-runner.ts` - `resultLine: any = null`
- `test/helpers/eval-store.ts` - Multiple catch blocks with `err: any`
- `test/helpers/llm-judge.ts` - `err: any`, map callbacks with `any`

**Impact:** Runtime errors that TypeScript cannot catch; poor IDE support; refactoring risk.

**Fix approach:**
1. Define proper interfaces for command bodies, error types
2. Use `unknown` with type guards for catch blocks
3. Add strict type checking in CI

### 3. Console Logging Instead of Structured Logging

**Issue:** Widespread use of `console.log/error` for server and tool output rather than structured logging.

**Files:**
- `browse/src/server.ts` - Server lifecycle messages
- `scripts/skill-check.ts` - Dashboard output

**Impact:** Difficult to parse logs programmatically; no log levels; no correlation IDs for tracing.

**Fix approach:** Introduce a lightweight logging utility with levels (debug, info, warn, error) and JSON output option.

## Medium Priority

### 4. Test File Size and Complexity

**Issue:** Several test files exceed 600 lines, making them hard to maintain.

**Files:**
- `browse/test/commands.test.ts` - 1804 lines
- `test/skill-validation.test.ts` - 1442 lines
- `test/gen-skill-docs.test.ts` - 928 lines

**Impact:** Difficult to find related tests; slow to load in IDEs; merge conflicts more likely.

**Fix approach:** Split by feature area (e.g., `skill-validation-structure.test.ts`, `skill-validation-references.test.ts`).

### 5. Environment Variable Dependency for Test Selection

**Issue:** Complex test selection logic depends on multiple environment variables (`EVALS`, `EVALS_ALL`, `EVALS_BASE`, `EVALS_FAST`, `EVALS_MODEL`) with conditional behavior.

**Files:**
- `test/helpers/e2e-helpers.ts` - Lines 26-83
- `test/skill-e2e-*.test.ts` - Duplicated env var checks

**Impact:** Hard to reason about which tests will run; CI configuration complexity; easy to accidentally skip tests.

**Fix approach:** Consolidate test selection logic into single configuration object; document expected behavior clearly.

### 6. Duplicate Eval Enablement Checks

**Issue:** Nearly identical eval enablement and diff detection code repeated across multiple test files.

**Files:**
- `test/skill-routing-e2e.test.ts` - Lines 15-29
- `test/codex-e2e.test.ts` - Lines 37-63
- `test/gemini-e2e.test.ts` - Lines 34-59
- `test/skill-llm-eval.test.ts` - Lines 24-48

**Impact:** Maintenance burden; risk of inconsistency if one file is updated but not others.

**Fix approach:** Extract to shared helper; all test files import from `test/helpers/e2e-helpers.ts`.

### 7. Timeout Constants Scattered

**Issue:** Timeout values defined inline throughout codebase rather than centralized.

**Files:**
- `browse/src/server.ts` - `IDLE_TIMEOUT_MS = 1800000`
- `browse/src/config.ts` - `timeout: 2_000`
- `browse/src/read-commands.ts` - `timeout: 5000`
- `test/helpers/session-runner.ts` - `timeout = 120_000`
- `test/helpers/gemini-session-runner.ts` - `timeoutMs = 300_000`

**Impact:** Difficult to tune timeouts globally; no clear documentation of timeout hierarchy.

**Fix approach:** Create `config/timeouts.ts` with named constants and documentation.

### 8. Null Return Patterns

**Issue:** Many functions return `null` to indicate failure or empty state rather than using more explicit patterns.

**Files:**
- `browse/src/config.ts` - Lines 35, 38, 148
- `browse/src/find-browse.ts` - Lines 20, 23, 46
- `browse/src/browser-manager.ts` - Lines 240, 418, 550
- `test/helpers/eval-store.ts` - Lines 155, 172

**Impact:** Callers must remember to check for null; easy to miss error conditions.

**Fix approach:** Consider Result/Either pattern or throw typed exceptions for error cases.

## Low Priority / Observations

### 9. Single @ts-ignore in Tests

**Issue:** One `@ts-ignore` comment in test file for monkey-patching.

**Files:** `browse/test/cookie-import-browser.test.ts` - Line 129

**Impact:** Minor - test-only code, intentional bypass.

**Recommendation:** Add comment explaining why the ignore is necessary; consider if test design can be improved.

### 10. No Explicit Error Boundary for Async Operations

**Issue:** Several async operations lack explicit error handling, relying on process-level handlers.

**Files:** `browse/src/browser-manager.ts` - Chromium disconnect handler calls `process.exit(1)`

**Impact:** Clean shutdown requires external process management.

**Observation:** This appears intentional per comments ("We do NOT try to self-heal"), but worth documenting in architecture.

### 11. Hardcoded User Agent String Management

**Issue:** Custom user agent handling through instance variable with no validation.

**Files:** `browse/src/browser-manager.ts` - Lines 44, 77-78

**Impact:** Invalid user agent strings could cause unexpected browser behavior.

**Recommendation:** Add validation for user agent format.

### 12. TODOS.md in Chinese

**Issue:** `TODOS.md` contains Chinese text, potentially limiting accessibility for international contributors.

**Files:** `TODOS.md`

**Impact:** Non-Chinese speakers cannot understand planned work.

**Recommendation:** Translate to English or provide both versions.

### 13. Generated SKILL.md Files Committed

**Issue:** Generated files (`SKILL.md`) are committed to repository, causing merge conflicts.

**Files:** All `SKILL.md` files in skill directories

**Impact:** Merge conflicts require regeneration rather than resolution; larger repo size.

**Mitigation:** CLAUDE.md already documents proper merge conflict resolution. Consider `.gitattributes` to mark as generated.

## Test Coverage Gaps

### 14. No Unit Tests for Browser Manager Edge Cases

**Issue:** `browse/src/browser-manager.ts` (634 lines) lacks dedicated unit test file.

**Files:** `browse/src/browser-manager.ts`

**Gap:** No tests for context recreation, dialog handling, ref map management.

**Risk:** Regressions in browser lifecycle could break all E2E tests.

**Priority:** Medium - Covered indirectly by E2E tests but unit tests would catch regressions faster.

### 15. Cookie Import Browser Not Fully Tested

**Issue:** `browse/src/cookie-import-browser.ts` (417 lines) has integration tests but limited unit test coverage.

**Files:** `browse/src/cookie-import-browser.ts`

**Gap:** Error handling paths, edge cases in cookie parsing.

## Key Files

- `scripts/gen-skill-docs.ts` - Large monolithic file (1947 lines), primary refactoring candidate
- `browse/src/server.ts` - Core server with any types and console logging
- `browse/src/browser-manager.ts` - Browser lifecycle, lacks unit tests
- `test/helpers/e2e-helpers.ts` - Duplicated env var logic should be centralized here
- `test/helpers/eval-store.ts` - Multiple any types in error handling
- `browse/src/snapshot.ts` - Type casting with any for dynamic option handling
- `TODOS.md` - Planned work in Chinese, needs translation

---

*Concerns audit: 2026-03-23*
