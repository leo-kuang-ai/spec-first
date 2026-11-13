---
title: Numeric ledger input
date: "2026-10-30"
last_updated: "2026-10-30"
category: logic-errors
module: SolvedLedger
problem_type: logic_error
component: application_code
severity: medium
symptoms:
  - "Historical report: POST /entries accepted string amounts, stored NaN, and returned ok."
root_cause: missing_validation
resolution_type: code_fix
source_refs:
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/README.md"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/src/server.js"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/test/entries.test.js"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/existing-learning.md"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/compound-proof.json"
invalidation_condition: "Recheck this learning when the input schema, validation-before-persistence ordering, or import idempotency contract changes; inspect the current parser, persistence call site, tests, and applicable import contract before retaining or revising its guidance."
tags:
  - "ledger"
  - "numeric-validation"
  - "recovery"
---

# Numeric ledger input

## Problem

The supplied SolvedLedger README records a historical bug in which
POST /entries accepted string amounts, stored NaN, and returned ok.
The current source contains the numeric validation fix. The historical
pre-fix implementation is not supplied, so the exact conversion that
produced NaN cannot be reconstructed from this evidence.

Source paths below are relative to
`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/`.

## Symptoms

The reported historical symptom is silent acceptance of invalid ledger
amounts. The demonstrated regression input is
`{"amount":"12","note":"x"}`: its amount is a JSON string, despite looking
numeric.

The supplied test expects that input to return null; it separately expects
`{"amount":12,"note":"x"}` to return a non-null entry
(`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/test/entries.test.js:5` and `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/test/entries.test.js:9`).

## What Didn't Work

No investigation attempts or failed remedies are supplied. Do not infer
a prior coercion strategy from the current fix or the test names.

## Solution

Validate numeric amounts before persistence. The current parser rejects
amounts unless they are JavaScript numbers and finite:

    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      return null;
    }

This guard is defined in `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/src/server.js:8`. It distinguishes a quoted
numeric string from a numeric JSON value without coercing the input.

The request handler checks the parser result before appending an entry.
A rejected amount produces status 400 and `invalid amount`
(`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/src/server.js:19`–`21`). These HTTP-path statements are source-grounded;
the supplied tests exercise the parser directly.

Preserve the existing learning's unique historical recovery guidance:
reconcile already imported rows against the original bank export before
reimporting; never delete unrelated rows. This is retained guidance from
`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/existing-learning.md`, not a recovery procedure executed or verified by
the supplied parser tests. The available fixture does not expose an
importer or establish its idempotency behavior.

## Why This Works

The guard checks the parsed value's type and finiteness before constructing
the entry (`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/src/server.js:6`–`11`). The handler's rejection branch occurs
before `entries.push(entry)` (`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/src/server.js:19`–`21`).

This prevents the demonstrated string amount from reaching the append
operation. It does not establish that every malformed request is handled:
JSON parsing occurs before the guard, and malformed JSON is outside the
two supplied test cases.

Fixing future acceptance and recovering historical rows are separate
responsibilities. The parser guard does not repair already imported data.

## Prevention

- Preserve the string-rejection and numeric-acceptance regression cases.
- Keep amount validation ahead of the persistence operation.
- When changing the input schema, review the guard and its tests together.
- Before historical recovery, reconcile against the original bank export
  and inspect the actual import idempotency contract. Preserve unrelated rows.
- Add targeted coverage for any newly claimed input or HTTP behavior;
  do not treat the present parser tests as comprehensive request coverage.

## Evidence and freshness

Reviewed against the supplied fixture source on 2026-10-30. No repository
revision or source digest is supplied for the successful test receipt.

The parent-provided `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/compound-proof.json`, relative to the fixture
directory, records `node --test test/entries.test.js` with exit code 0,
two passing tests, and zero failures. It supports the two parser cases
described above. This read-only review did not rerun tests and does not
establish HTTP integration, historical data recovery, deployment, or
remote landing.
