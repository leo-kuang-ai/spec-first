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

The parser tests explicitly require the first to return null and the second to return a non-null result (`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/test/entries.test.js:5-10`, relative to the fixture root).

The historical NaN symptom comes from the README. The available current source does not establish the exact pre-fix conversion expression.

## What Didn't Work

No failed investigation attempts or attempted fixes are documented in the supplied evidence. Do not reconstruct them from the final implementation.

The old learning states the general validation rule but omits the concrete request-shape distinction. This update adds that distinction while preserving recovery guidance that cannot be recovered from the parser tests.

## Solution

The parser checks the type and finiteness of the parsed amount:

    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      return null;
    }

This is the current implementation at `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/src/server.js:8-10`, relative to the fixture root. It rejects numeric strings rather than converting them.

The POST handler calls the parser, returns HTTP 400 with `invalid amount` when it receives null, and only then appends a valid entry to the array (`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/src/server.js:19-22`). This ordering is directly visible in source; the supplied tests do not exercise HTTP requests.

### Preserve historical recovery knowledge

The existing learning records this recovery instruction:

> Reconcile already imported rows against the original bank export before reimporting; never delete unrelated rows.

Preserve this as historical recovery guidance from `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/existing-learning.md:3`. The validation fix prevents the demonstrated invalid input from being accepted; it does not itself repair earlier records.

No importer, bank export, reconciliation log, or idempotency contract is present in the supplied fixture. Before applying the recovery instruction to a real dataset, verify those inputs and the actual import contract. No reconciliation or reimport is claimed here.

## Why This Works

The guard requires a JavaScript number and requires that number to be finite. A string containing digits fails the type check. Returning null lets the handler reject the request before its `entries.push(entry)` call.

The supplied `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/compound-proof.json` records a successful local run of `node --test test/entries.test.js` from the fixture directory: exit code 0, two tests passed, zero failed. The test source confirms coverage of numeric-string rejection and numeric acceptance.

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
