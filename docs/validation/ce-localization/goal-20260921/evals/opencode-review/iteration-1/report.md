## Code Review Results

**Scope:** HEAD (a37b4f6) -> working tree (1 file, 6 changed exec lines; `src/orders.js`)
**Intent:** Remove tenant-scoping from `getOrderForUser` so the lookup returns an order by id regardless of the caller's tenant (fixture patch `tenant-bypass.patch`).
**Mode:** interactive (`mutation_policy: report-only`, `commit_authorization: missing`)

**Reviewers:** inline-fallback
- Dispatch authorization missing (no subagents/parallel reviewers requested) -> single-model bounded inline review. Independent reviewer, validator, and cross-model coverage were not run.

### Triage Groups

| Group | Findings | Context | Preferred Resolution | Why |
|-------|----------|---------|----------------------|-----|
| Tenant isolation removed | #1, #2 | Both stem from deleting the tenant check in `getOrderForUser` | Restore the check (#1) first -- it resolves both | One change removes the cross-tenant exposure and greens the failing test |

### P0 -- Critical

| # | File | Issue | Reviewer | Confidence |
|---|------|-------|----------|------------|
| 1 | `src/orders.js:4` | Tenant check removed -- cross-tenant order read | inline-fallback | 100 |

- **#1** — The lookup now returns any order matching `orderId`, ignoring `user.tenantId`. Any caller can read another tenant's order (IDOR / cross-tenant data exposure). This directly violates the project rule "Every resource read must verify the current user's tenant" (`AGENTS.md:3`). Fix: restore the guard from the baseline, e.g. `const order = orders.find(c => c.id === orderId); if (!order || order.tenantId !== user.tenantId) return null; return order;`.

### P1 -- High

| # | File | Issue | Reviewer | Confidence |
|---|------|-------|----------|------------|
| 2 | `test/orders.test.js:9` | Existing tenant-isolation test now fails (regression) | inline-fallback | 100 |

- **#2** — `npm test` fails (1 fail, exit 1): expected `null`, received `{ id: 'o-1', tenantId: 'tenant-b' }` for a `tenant-a` caller. The change breaks the existing contract test. Same root cause as #1; restoring the tenant check resolves it without editing the test.

### Actionable Findings

| # | File | Issue | Route | Notes |
|---|------|-------|-------|-------|
| 1 | `src/orders.js:4` | Tenant check removed | `gated_auto -> downstream-resolver` | `suggested_fix` present -- restore the `tenantId` guard |
| 2 | `test/orders.test.js:9` | Tenant-isolation test fails | `gated_auto -> downstream-resolver` | Resolved by #1; no test edit needed |

### Coverage

- Dispatch: `worker_dispatch_authorization: missing` -> bounded inline report-only fallback (`status: degraded`, `dispatch_reason_code: dispatch_authorization_missing`). Independent/validator/cross-model coverage not run; merge readiness cannot be closed by single-model bounded coverage.
- Suppressed: none (no findings below anchor 75).
- Residual risks: `user` is now an unused parameter (`src/orders.js:3`) while the signature still implies tenant scoping -- if the bypass is intentional, remove the parameter so callers do not assume isolation.
- Testing gaps: none beyond the already-failing existing test.
- Structured verification evidence: `status: degraded`, `reason_code: artifact-write-not-authorized`, `run_summary_ref: null`. Checks actually executed: `npm test` -> exit 1 (fail). The command ran read-only; no durable run-summary artifact was written (report-only, no workspace writes).
- Mutation guard: frozen scope `diff_sha256: sha256:15bbc28c...` re-verified unchanged after review -> `mutation_detected: false`.

---

> **Verdict:** Not ready
>
> **Reasoning:** A P0 cross-tenant data exposure was introduced and the existing tenant-isolation test now fails. Review coverage is degraded (single-model inline fallback), so it cannot establish merge readiness.
>
> **Fix order:** restore the tenant check (#1) -> re-run `npm test` (#2).

### Actionable Findings (recap)

| # | Severity | File:Line | What | Class | Fix? | Conf |
|---|----------|-----------|------|-------|------|------|
| 1 | P0 | `src/orders.js:4` | Tenant check removed -- cross-tenant order read | `gated_auto` | yes | 100 |
| 2 | P1 | `test/orders.test.js:9` | Tenant-isolation test fails | `gated_auto` | yes | 100 |

Artifact path: `/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/spec-first/spec-code-review/scr-20260921221053-53643` (report.md, metadata.json, scope-snapshot.json).
