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
  - "The fixture README reports that POST /entries previously accepted string amounts, stored NaN, and returned ok."
root_cause: missing_validation
resolution_type: code_fix
source_refs:
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/README.md"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/src/server.js:5"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/test/entries.test.js:5"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/compound-proof.json"
invalidation_condition: "Recheck this learning when the amount input schema, validation-before-storage ordering, or import idempotency contract changes; inspect the revised parser, route, tests, and any documented import contract before reusing its recommendations."
tags:
  - "numeric-input"
  - "ledger"
  - "data-recovery"
---

# Numeric ledger input

Validate numeric amounts before persistence. Unique historical recovery: reconcile already imported rows against original bank export before reimporting; never delete unrelated rows.

## Problem

The fixture README reports a resolved bug in which `POST /entries` accepted string amounts, stored `NaN`, and still returned `ok`. The current source demonstrates the preventive guard; the supplied fixture does not contain the historical implementation or a reproduced pre-fix failure.

This learning applies to SolvedLedger's finite-number amount contract and to preserving the existing recovery guidance when refreshing its documentation.

## Symptoms

A JSON string such as `{"amount":"12","note":"x"}` and a JSON number such as `{"amount":12,"note":"x"}` carry different types even though the amount looks similar to a person.

The supplied tests establish the intended distinction at the parser boundary: the string case returns `null`, while the numeric case returns a non-null result (`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/test/entries.test.js:5-10`, relative to the fixture root).

## What Didn't Work

No failed investigation attempts are documented in the supplied evidence. Do not invent a sequence of attempted fixes.

The historical string-acceptance failure is reported by the README. The current source does not establish exactly how the old implementation produced `NaN`.

## Solution

The current parser reads the JSON properties and rejects amounts that are not finite numbers:

```js
const { amount, note } = JSON.parse(body || '{}');
if (typeof amount !== 'number' || !Number.isFinite(amount)) {
  return null;
}
```

Defining source: `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/src/server.js:6-10`, relative to the fixture root.

The route checks this result before storing the entry:

```js
const entry = parseEntry(body);
if (!entry) { res.statusCode = 400; return res.end('invalid amount'); }
entries.push(entry);
res.end('ok');
```

Defining source: `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/src/server.js:19-22`.

For diagnosis, inspect the actual JSON value type. Quoted numeric text does not satisfy this contract, and the current parser does not coerce it to a number. The server stores accepted entries in an in-memory array; this source does not establish durable database persistence.

For historical recovery, retain the instruction from the pre-existing learning: reconcile already imported rows against the original bank export before reimporting, and never delete unrelated rows. Fixing validation prevents new invalid acceptance; it does not demonstrate that historical records were repaired.

No bank import, reconciliation, or idempotency implementation is included in this fixture. The recovery instruction is preserved historical guidance, not a verified recovery procedure or authorization to mutate data.

## Why This Works

The type check rejects string amounts, and `Number.isFinite` excludes non-finite numeric values. Returning `null` causes the route to exit with HTTP 400 before `entries.push`.

The request-shape distinction is supported directly by the parser and the two tests. It explains why a visually numeric string must not be treated as equivalent to a JSON number.

Preserving recovery guidance matters because a future engineer reading only the fixed parser could conclude that correcting input validation also resolves previously imported data. The supplied evidence supports no such conclusion.

## Prevention

- Preserve the regression contrast between the string `"12"` and number `12`.
- Keep validation before entry insertion.
- Treat historical reconciliation as separate work, using the original bank export and protecting unrelated rows.
- Before claiming endpoint behavior was exercised, obtain HTTP-level evidence; the supplied tests call `parseEntry` directly.
- Before claiming recovery succeeded, obtain reconciliation evidence and verify the applicable import idempotency contract.

## Evidence and Freshness

The assigned fixture was inspected on 2026-10-30. Its package declares version `1.1.0`; no Git revision, merge, or release state was verified.

The parent-supplied `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/compound-proof.json` records `node --test test/entries.test.js` in the compound fixture, exit code `0`, two passing tests, and zero failures. This is existing local proof, not a test run performed while drafting this learning.

The tests cover rejection of one string amount and acceptance of one numeric amount. They do not exercise the HTTP route, historical recovery, malformed JSON handling, or all invalid input variants. Source inspection supports the route ordering and finite-number guard independently of those test coverage limits.

The recovery sentence is retained from the pre-update `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/existing-learning.md`. It remains historical guidance with the implementation limitations stated above.
