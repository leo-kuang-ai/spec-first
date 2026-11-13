---
title: "Numeric ledger input"
date: "2026-10-30"
last_updated: "2026-10-30"
category: "logic-errors"
module: "SolvedLedger entry input"
problem_type: logic_error
component: application_code
severity: medium
symptoms:
  - "The supplied incident README reports string amounts being accepted, stored as NaN, and acknowledged with ok."
root_cause: missing_validation
resolution_type: code_fix
source_refs:
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/src/server.js"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/test/entries.test.js"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/README.md"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/existing-learning.md"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/compound-proof.json"
invalidation_condition: "Recheck this learning when the amount input schema, validation-before-storage ordering, or import idempotency contract changes. Inspect the defining source, relevant tests, and import contract read-only; revise claims whose assumptions no longer hold."
tags:
  - "ledger"
  - "numeric-input"
  - "validation"
  - "recovery"
---

# Numeric ledger input

Validate numeric amounts before persistence. Unique historical recovery: reconcile already imported rows against original bank export before reimporting; never delete unrelated rows.

## Request-shape diagnosis

A numeric-looking string is not a JSON number. The supplied regression test passes `{"amount":"12","note":"x"}` and expects rejection; it separately checks that `{"amount":12,"note":"x"}` is accepted.

Current `src/server.js:6` parses the request body with `JSON.parse`. Lines 8–9 reject an amount unless it is both a JavaScript number and finite:

    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      return null;
    }

This preserves the input type distinction rather than coercing numeric-looking text. The endpoint checks the result before inserting: line 20 returns HTTP 400 with `invalid amount` for a rejected entry, while lines 21–22 append an accepted entry and respond `ok`. These endpoint behaviors are supported by source inspection, not an HTTP test receipt.

The incident README reports that the earlier implementation accepted string amounts, stored NaN, and returned ok. The pre-fix implementation is not supplied, so its precise conversion mechanism cannot be reconstructed from the current source. In particular, JSON parsing alone does not turn the string `"12"` into NaN.

## Recovery knowledge that must survive the code fix

The existing learning records a separate historical recovery requirement: reconcile already imported rows against the original bank export before reimporting, and never delete unrelated rows.

Preserve this instruction because rejecting future invalid requests does not establish that earlier imported data has been reconciled. The current fixture contains neither an importer nor bank exports, reconciliation evidence, or an import idempotency contract. Accordingly, this is retained historical recovery guidance, not a claim that recovery was executed or verified.

Before carrying out a recovery, establish the affected rows and the applicable reimport/idempotency rules from the actual system. This document does not authorize deletion or reimport.

## Verification and limitations

The parent-supplied `compound-proof.json` records:

- Command: `node --test test/entries.test.js`.
- Working directory: the supplied compound fixture.
- Exit code: 0.
- Two tests passed, zero failed.

The inspected tests at `test/entries.test.js:5–10` cover rejection of the string amount `"12"` and a non-null result for numeric amount `12`. They do not assert exact accepted fields, exercise HTTP responses, inspect stored data, or verify historical recovery. The finite-number guard is visible in source but is not independently exercised by the two supplied test cases.

No tests were rerun while preparing this draft. The supplied receipt has no source digest or execution timestamp, so it is evidence of the recorded fixture run, not proof of a newly executed check against a cryptographically pinned revision.

## Prevention and freshness

Keep the type-and-finiteness guard before entry insertion. Retain the string-versus-number regression distinction. When extending verification, separately cover endpoint rejection without insertion and invalid numeric cases; those checks are recommendations, not completed results.

This candidate was prepared from the supplied fixture as observed on 2026-10-30. No Git revision, remote merge state, deployment status, or production outcome was established. Its creation date records this candidate preparation; the original learning provides no earlier documentation date.

Reassess the learning when the input schema or import idempotency contract changes, including any deliberate move to a different representation of amounts. Verify the new contract before applying or removing the recovery guidance.
