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
  - "The fixture README reports that POST /entries accepted string amounts, stored NaN, and returned ok."
root_cause: missing_validation
resolution_type: code_fix
source_refs:
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/README.md"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/src/server.js"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/test/entries.test.js"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/existing-learning.md"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/compound-proof.json"
invalidation_condition: "Recheck this learning when the accepted amount schema, validation-before-append ordering, or import idempotency contract changes. Inspect the defining source, regression tests, and available import contract before revising input or recovery guidance."
tags:
  - "ledger"
  - "numeric-validation"
  - "data-integrity"
  - "recovery"
---

# Numeric ledger input

Validate numeric amounts before persistence. Unique historical recovery: reconcile already imported rows against the original bank export before reimporting; never delete unrelated rows.

## Problem and diagnosis

The fixture README reports that POST /entries previously accepted string amounts, stored NaN, and still returned ok. This describes the historical defect; the supplied current implementation contains the fix. The pre-fix implementation and investigation history are unavailable, so the exact conversion that produced NaN and any failed repair attempts are not established.

The important request-shape distinction is a JSON number versus a JSON string containing digits:

- `{"amount":"12","note":"x"}` must be rejected.
- `{"amount":12,"note":"x"}` is accepted by the current parser.

The supplied tests exercise these two cases directly in `test/entries.test.js:5–10`. They do not exercise HTTP requests.

## Current fix

In `src/server.js:6–11`, the parser reads the original JSON value and rejects it unless it is a finite JavaScript number:

    const { amount, note } = JSON.parse(body || '{}');
    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      return null;
    }

This checks the value's type without coercing numeric strings into accepted amounts.

The handler then checks the result before appending (`src/server.js:19–22`):

    const entry = parseEntry(body);
    if (!entry) { res.statusCode = 400; return res.end('invalid amount'); }
    entries.push(entry);
    res.end('ok');

This source ordering establishes rejection before mutation of the in-memory entries array. It does not establish database persistence, import behavior, or end-to-end HTTP verification.

## Historical recovery

Preserve the existing learning's recovery instruction: reconcile already imported rows against the original bank export before reimporting; never delete unrelated rows.

This instruction is inherited historical guidance from `existing-learning.md`. No importer, original bank export, recovery execution log, or import idempotency implementation is supplied here. Consequently, this record preserves the recovery knowledge without claiming that recovery was performed or validated.

Preventing new invalid entries does not by itself establish that previously affected data has been repaired. Before applying the historical recovery procedure to a real dataset, establish the affected-row scope and current import idempotency contract.

## Verification and prevention

The parent-supplied `compound-proof.json` records a successful local run of `node --test test/entries.test.js`: two tests passed, with zero failures. The tests demonstrate parser rejection of a quoted numeric amount and acceptance of a numeric amount.

Preserve those regression cases and the validation-before-append ordering. An HTTP-level check of status, response body, and unchanged entries after rejection would add coverage; it was not run in this review and is not present in the supplied receipt.

The current parser calls JSON.parse without a local catch. Malformed JSON handling is outside the demonstrated fix and must not be described as verified by these two tests. Non-finite rejection is visible in source but is not separately exercised by the supplied tests.

## Freshness and applicability

Reviewed against the supplied fixture on 2026-10-30. No commit, release, or deployment status was verified. The test receipt has no source digest or revision binding.

This learning applies to the supplied SolvedLedger amount boundary. Reassess it if numeric strings become intentionally supported, the amount schema changes, validation moves relative to mutation, or the import idempotency contract changes.
