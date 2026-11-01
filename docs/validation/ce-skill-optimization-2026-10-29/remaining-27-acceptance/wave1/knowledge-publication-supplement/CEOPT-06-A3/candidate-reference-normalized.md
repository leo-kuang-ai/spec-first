---
title: "Numeric ledger input"
date: "2026-10-30"
last_updated: "2026-10-30"
category: "logic-errors"
module: "SolvedLedger entry ingestion"
problem_type: "logic_error"
component: "application_code"
severity: "high"
symptoms:
  - "The fixture README reports that string amounts were accepted, stored as NaN, and acknowledged with ok before the fix."
root_cause: "missing_validation"
resolution_type: "code_fix"
source_refs:
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/README.md"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/src/server.js"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/test/entries.test.js"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/existing-learning.md"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/compound-proof.json"
invalidation_condition: "Recheck when the entry input schema, numeric representation, validation-before-storage order, or import idempotency contract changes. Read the updated parser, request handler, relevant tests, and import contract; revise any guidance that no longer matches those sources. The supplied fixture does not expose an import implementation or idempotency contract."
tags:
  - "ledger"
  - "numeric-input"
  - "data-integrity"
  - "recovery"
---

# Numeric ledger input

Validate numeric amounts before persistence. Preserve the historical recovery rule: reconcile already imported rows against the original bank export before reimporting; never delete unrelated rows.

## Problem

The supplied README reports a prior silent-NaN bug: `POST /entries` accepted string amounts, stored NaN, and still returned `ok` (`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/README.md:3-4`). The pre-fix implementation is not supplied, so its exact conversion mechanism cannot be reconstructed from this evidence.

This learning combines the supported input diagnosis with recovery knowledge retained from the existing learning.

## Symptoms

- Historically reported: a string amount could be accepted and acknowledged despite an invalid stored value (`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/README.md:3-4`).
- In the fixed fixture, `parseEntry('{"amount":"12","note":"x"}')` returns `null`; the regression assertion is in `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/test/entries.test.js:5-7`.
- A numeric amount in `{"amount":12,"note":"x"}` returns a non-null result in the acceptance assertion (`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/test/entries.test.js:9-11`).

## What Didn't Work

No failed implementation attempts or investigation sequence are provided. Do not invent them.

A request that looks numerically valid to a person is not necessarily valid for this parser. A quoted amount remains a string after JSON parsing. The current guard rejects it rather than coercing it.

Fixing validation of new input also does not establish that previously imported rows have been reconciled or repaired.

## Solution

Keep the amount check before constructing and storing an entry. The supplied implementation uses:

```js
const { amount, note } = JSON.parse(body || '{}');
if (typeof amount !== 'number' || !Number.isFinite(amount)) {
  return null;
}
```

This is the defining guard in `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/src/server.js:6-10`. An accepted result contains the original numeric amount (`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/src/server.js:11`).

The request handler checks the parser result before adding it to the in-memory array:

```js
const entry = parseEntry(body);
if (!entry) { res.statusCode = 400; return res.end('invalid amount'); }
entries.push(entry);
res.end('ok');
```

This order is visible in `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/src/server.js:19-22`. The fixture stores entries in memory (`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/src/server.js:3`); this evidence does not establish database durability.

For historical recovery, retain the existing instruction exactly in substance: **reconcile already imported rows against the original bank export before reimporting; never delete unrelated rows** (`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/existing-learning.md:3`). This is preserved documentary guidance. No import implementation, reconciliation execution, or successful recovery receipt is supplied.

## Why This Works

The diagnosis is about request value type, not how an amount is visually formatted. `{"amount":"12"}` and `{"amount":12}` have different types after parsing; the `typeof` check rejects the former. `Number.isFinite` additionally restricts accepted numbers to finite values (`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/src/server.js:6-10`).

Returning `null` lets the handler reject the request before `entries.push` and before the `ok` response (`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/src/server.js:19-22`). This ordering is supported by source inspection, not an HTTP integration test in the supplied proof.

The retained recovery rule addresses a separate temporal boundary: preventing future invalid entries does not repair historical imports.

## Prevention

- Preserve the paired regression cases for quoted and numeric amounts (`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/test/entries.test.js:5-11`).
- Preserve rejection before storage when changing request handling.
- Treat malformed JSON and unsupported top-level request shapes as separate verification needs. The supplied parser calls `JSON.parse` and destructures its result without a local catch (`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/src/server.js:6`); the two supplied tests do not establish safe handling of all request bodies.
- Before any historical reimport, reconcile affected rows against the original bank export and preserve unrelated rows. Confirm the actual import idempotency contract before undertaking recovery.
- Recheck this learning when the input schema, numeric representation, storage order, or import idempotency contract changes.

## Evidence and freshness

This candidate was assembled on 2026-10-30 from the assigned frozen fixture and parent-supplied receipts. The fixture package declares version `1.1.0` (`package.json:1`); no Git revision or source-content digest is supplied with the test receipt.

`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/compound-proof.json` records `node --test test/entries.test.js` in the compound fixture with exit code `0`, two passing tests, and zero failures. Those tests establish the quoted-amount rejection and numeric-amount acceptance cases at the parser level.

The receipt is existing evidence, not a test run performed while preparing this document. It does not prove HTTP behavior through a live server, persistence durability, recovery success, comprehensive input validation, deployment, or learning-publication validation.
