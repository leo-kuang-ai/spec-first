Ran Full-mode review inline, limited to the requested read-only, mediated draft. Data-integrity guidance warrants Full review; no publication was attempted.

# Numeric ledger input: candidate and disposition

## Disposition

**Prepare an update to `fixtures/compound/existing-learning.md`; do not create a duplicate learning.** The existing learning and proposed addition address the same amount-validation boundary. Preserve its title and historical recovery guidance, adding the supported distinction between a JSON numeric string and a JSON number.

The unique recovery knowledge qualifies for preservation because the current implementation and tests do not explain how to recover previously imported records. That guidance is attributed to the existing learning; the fixture contains no importer or reconciliation verification.

**Reject `invalid-candidate.md` for promotion.** The supplied `compound-validation-failure.json` records exit code `1` with:

```text
promotion requires non-empty top-level 'source_refs' array
promotion requires non-empty top-level 'invalidation_condition'
```

Its recorded candidate SHA-256 is `335ff42d6323b91a91ded75141eb22646560eba738d3aaf1d6da30a42b1df427`. The receipt explicitly states that no publication was attempted. The current invalid candidate also lacks required classification fields; these are manual schema observations, not additional reported validator errors.

The replacement below is **an unpublished candidate**. Its content has been reviewed inline, but neither bundled validator was executed on it. The invalid candidate’s failed receipt cannot establish validation of this replacement.

## Complete replacement candidate

All source references below are relative to `/Users/kuang/xiaobu/spec-first`. The intended update target remains the supplied existing learning; no move into `docs/solutions/` is implied.

```markdown
---
title: "Numeric ledger input"
date: "2026-10-30"
last_updated: "2026-10-30"
category: "logic-errors"
module: "SolvedLedger entry input"
problem_type: logic_error
component: application_code
severity: high
symptoms:
  - "The fixture README reports that POST /entries previously accepted string amounts, stored NaN, and returned ok."
root_cause: missing_validation
resolution_type: code_fix
source_refs:
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/README.md"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/src/server.js"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/test/entries.test.js"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/existing-learning.md"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/compound-proof.json"
invalidation_condition: "Recheck this guidance when the amount input schema, validation-before-storage ordering, or import idempotency contract changes. Inspect the changed parser, route, tests, and any actual importer contract before retaining the diagnosis or applying historical recovery advice."
tags:
  - "ledger"
  - "numeric-input"
  - "request-validation"
  - "data-recovery"
---

# Numeric ledger input

Validate numeric amounts before persistence. Preserve a separate recovery step for records already affected by an earlier input defect.

## Problem

The supplied SolvedLedger README reports a historical bug in which POST /entries accepted string amounts, stored NaN, and returned ok. The current source adds an amount guard before an entry can reach storage.

This finding applies to the supplied fixture. Its current storage is an in-memory array; the available evidence does not establish production persistence, deployment, or a completed recovery.

## Symptoms

The important request-shape distinction is between:

- `{"amount":"12","note":"x"}`: the amount is a JSON string.
- `{"amount":12,"note":"x"}`: the amount is a JSON number.

The parser tests explicitly require the first to return null and the second to return a non-null result (`test/entries.test.js:5–10`, relative to the fixture root).

The historical NaN symptom comes from the README. The available current source does not establish the exact pre-fix conversion expression.

## What Didn't Work

No failed investigation attempts or attempted fixes are documented in the supplied evidence. Do not reconstruct them from the final implementation.

The old learning states the general validation rule but omits the concrete request-shape distinction. This update adds that distinction while preserving recovery guidance that cannot be recovered from the parser tests.

## Solution

The parser checks the type and finiteness of the parsed amount:

    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      return null;
    }

This is the current implementation at `src/server.js:8–10`, relative to the fixture root. It rejects numeric strings rather than converting them.

The POST handler calls the parser, returns HTTP 400 with `invalid amount` when it receives null, and only then appends a valid entry to the array (`src/server.js:19–22`). This ordering is directly visible in source; the supplied tests do not exercise HTTP requests.

### Preserve historical recovery knowledge

The existing learning records this recovery instruction:

> Reconcile already imported rows against the original bank export before reimporting; never delete unrelated rows.

Preserve this as historical recovery guidance from `existing-learning.md:3`. The validation fix prevents the demonstrated invalid input from being accepted; it does not itself repair earlier records.

No importer, bank export, reconciliation log, or idempotency contract is present in the supplied fixture. Before applying the recovery instruction to a real dataset, verify those inputs and the actual import contract. No reconciliation or reimport is claimed here.

## Why This Works

The guard requires a JavaScript number and requires that number to be finite. A string containing digits fails the type check. Returning null lets the handler reject the request before its `entries.push(entry)` call.

The supplied `compound-proof.json` records a successful local run of `node --test test/entries.test.js` from the fixture directory: exit code 0, two tests passed, zero failed. The test source confirms coverage of numeric-string rejection and numeric acceptance.

That receipt supports those two parser cases. It does not establish HTTP behavior through execution, malformed-JSON handling, recovery correctness, importer idempotency, or deployment. The guard's broader type and finiteness behavior is source-grounded rather than exhaustively tested by this receipt.

## Prevention

- Keep numeric strings and numeric values as distinct regression cases.
- Preserve validation before the storage mutation.
- If HTTP behavior is changed, verify both the rejection response and absence of a stored invalid entry.
- Treat historical-data repair separately from prevention of new invalid entries.
- Reconcile affected imported rows against the original bank export before reimporting, subject to verification of the real importer contract; never delete unrelated rows.
- Revisit this learning if the schema deliberately begins accepting numeric strings or if the import idempotency contract changes.

## Evidence freshness and limits

The supplied fixture source, tests, README, existing learning, and proof receipt were read on 2026-10-30. No Git revision or source digest was collected. The proof receipt contains no source hash binding it to the currently read files, so it is reported as a supplied prior local result, not a freshly reproduced test run.

Historical recovery advice remains explicitly attributed to the existing learning. This candidate does not claim a verified importer or successful recovery.
```

## Review and publication state

| Item | Actual state |
|---|---|
| Solved-bug evidence | Current source plus supplied prior receipt for two parser tests |
| Overlap | High; update the supplied existing learning |
| Unique knowledge | Historical bank-export reconciliation and protection of unrelated rows preserved |
| Distinct addition | Numeric string versus numeric JSON value; rejection-before-append ordering |
| Invalid candidate | Failed promotion validation; unpublished |
| Replacement candidate | Draft returned inline; automated validation not run |
| Semantic review | Inline and non-independent; historical recovery explicitly qualified |
| Vocabulary | Scanned the investigated area; no qualifying project-specific terms. No vocabulary changes |
| Corpus coverage | Supplied fixture only; no repository-wide overlap claim |
| Session history / external research | Not read or requested |
| Files written / publication | None |
| Refresh recommendation | No broader consolidation justified by the supplied corpus |

Execution restrictions prevented script execution, scratch creation, target hashing, and publication. They were not treated as validator unavailability or as validation success. Future publication requires validation of the exact replacement, semantic approval, and target existence/SHA-256 checks before replacing the existing learning. Parent persistence of this response is evidence retention, not knowledge promotion.

Documentation skipped — publication was outside this mediated trial; the requested candidate and disposition are provided above.
