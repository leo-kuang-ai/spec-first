Ran Full-mode research and grounding inline, adapted to the read-only mediated draft scope. Publication is withheld; the supplied invalid candidate failed validation, and the replacement draft below has not been executed through validators or written to disk.

# Numeric ledger input — candidate and disposition

## Disposition

Update the existing `fixtures/compound/existing-learning.md` in place if later authorized and validated; do not create a duplicate learning. Overlap is high across the problem, root cause, solution approach, referenced files, and prevention rule. Preserve its title and unique recovery instruction while adding the supported request-shape diagnosis.

The learning qualifies because the historical reconciliation guidance is not recoverable from the supplied final implementation or its two tests. The implementation explains rejection of invalid new input; it does not explain how to recover already imported rows safely.

The supplied `compound-validation-failure.json` records an actual exit code of **1** for `invalid-candidate.md`, with these failures:

- `promotion requires non-empty top-level 'source_refs' array`
- `promotion requires non-empty top-level 'invalidation_condition'`

Its recorded candidate SHA-256 is `335ff42d6323b91a91ded75141eb22646560eba738d3aaf1d6da30a42b1df427`. I did not independently recompute that digest. The receipt explicitly states that no publication was attempted.

The invalid candidate is **rejected for promotion**. Adding useful diagnosis prose does not override the failed gate. The replacement below supplies concrete references and an invalidation condition, but this is a proposed repair, **not a validated replacement**. The failed receipt cannot be converted into a pass or applied to different candidate bytes.

## Complete replacement candidate

The following fenced content is the proposed complete replacement for the supplied existing learning. Paths in its frontmatter are relative to `/Users/kuang/xiaobu/spec-first`; abbreviated fixture paths in the body are relative to the named compound fixture.

```markdown
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

The supplied README reports a prior silent-NaN bug: `POST /entries` accepted string amounts, stored NaN, and still returned `ok` (`README.md:3-4`). The pre-fix implementation is not supplied, so its exact conversion mechanism cannot be reconstructed from this evidence.

This learning combines the supported input diagnosis with recovery knowledge retained from the existing learning.

## Symptoms

- Historically reported: a string amount could be accepted and acknowledged despite an invalid stored value (`README.md:3-4`).
- In the fixed fixture, `parseEntry('{"amount":"12","note":"x"}')` returns `null`; the regression assertion is in `test/entries.test.js:5-7`.
- A numeric amount in `{"amount":12,"note":"x"}` returns a non-null result in the acceptance assertion (`test/entries.test.js:9-11`).

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

This is the defining guard in `src/server.js:6-10`. An accepted result contains the original numeric amount (`src/server.js:11`).

The request handler checks the parser result before adding it to the in-memory array:

```js
const entry = parseEntry(body);
if (!entry) { res.statusCode = 400; return res.end('invalid amount'); }
entries.push(entry);
res.end('ok');
```

This order is visible in `src/server.js:19-22`. The fixture stores entries in memory (`src/server.js:3`); this evidence does not establish database durability.

For historical recovery, retain the existing instruction exactly in substance: **reconcile already imported rows against the original bank export before reimporting; never delete unrelated rows** (`existing-learning.md:3`). This is preserved documentary guidance. No import implementation, reconciliation execution, or successful recovery receipt is supplied.

## Why This Works

The diagnosis is about request value type, not how an amount is visually formatted. `{"amount":"12"}` and `{"amount":12}` have different types after parsing; the `typeof` check rejects the former. `Number.isFinite` additionally restricts accepted numbers to finite values (`src/server.js:6-10`).

Returning `null` lets the handler reject the request before `entries.push` and before the `ok` response (`src/server.js:19-22`). This ordering is supported by source inspection, not an HTTP integration test in the supplied proof.

The retained recovery rule addresses a separate temporal boundary: preventing future invalid entries does not repair historical imports.

## Prevention

- Preserve the paired regression cases for quoted and numeric amounts (`test/entries.test.js:5-11`).
- Preserve rejection before storage when changing request handling.
- Treat malformed JSON and unsupported top-level request shapes as separate verification needs. The supplied parser calls `JSON.parse` and destructures its result without a local catch (`src/server.js:6`); the two supplied tests do not establish safe handling of all request bodies.
- Before any historical reimport, reconcile affected rows against the original bank export and preserve unrelated rows. Confirm the actual import idempotency contract before undertaking recovery.
- Recheck this learning when the input schema, numeric representation, storage order, or import idempotency contract changes.

## Evidence and freshness

This candidate was assembled on 2026-10-30 from the assigned frozen fixture and parent-supplied receipts. The fixture package declares version `1.1.0` (`package.json:1`); no Git revision or source-content digest is supplied with the test receipt.

`compound-proof.json` records `node --test test/entries.test.js` in the compound fixture with exit code `0`, two passing tests, and zero failures. Those tests establish the quoted-amount rejection and numeric-amount acceptance cases at the parser level.

The receipt is existing evidence, not a test run performed while preparing this document. It does not prove HTTP behavior through a live server, persistence durability, recovery success, comprehensive input validation, deployment, or learning-publication validation.
```

## Grounding and execution boundaries

The Context Analyzer, Solution Extractor, Related Docs Finder, and semantic-grounding roles were applied inline against the bounded supplied material. No independent reviewer or additional agent was dispatched.

The unique historical recovery instruction remains attributed to `existing-learning.md:3`; it is not presented as an executed recovery. The additional request-shape diagnosis is grounded in `src/server.js:6-10` and the contrasting test inputs. No pre-fix conversion code, merge, release, or production outcome is claimed.

Vocabulary capture: scanned the supplied learning and fixture; no qualifying project-specific terms were identified. Numeric validation, ledger entries, and bank exports do not acquire sufficiently distinct project-specific meanings in this material to justify glossary entries. No `CONCEPTS.md` changes are proposed; broader vocabulary inspection was outside scope.

No files were written, no tests or validator scripts were executed, no external requests were made, and no session history was inspected. Candidate review here is manual and non-independent. Validator availability was not probed; execution was prohibited, not demonstrated unavailable.

Before a later publication, the owner must validate the exact replacement candidate, review its grounding, record and recheck the existing target’s existence and SHA-256, and publish only within an authorized scope. The existing path and recovery content should be preserved. Saving this response as a trial artifact does not itself promote the learning.

**Publication state: not attempted. Invalid candidate: failed. Replacement candidate: drafted, validation pending. Documentation skipped.**
