Ran Full mode as a read-only, mediated draft review because ledger data integrity and historical recovery guidance require careful grounding.

# Numeric ledger learning candidate and disposition

**Disposition: update the existing learning; do not create a duplicate. Publication remains unperformed.** The supplied invalid candidate failed its actual promotion validation. The replacement candidate below has not undergone executable validation and is not approved for publication.

## Evidence and overlap

The supplied `existing-learning.md` already teaches numeric validation before persistence and contains unique recovery guidance: reconcile previously imported rows against the original bank export before reimporting, and never delete unrelated rows. Preserve that guidance. The final implementation alone does not recover it, so retaining this learning meets the reuse threshold.

The supported addition is the exact request-shape distinction and rejection order: a quoted numeric amount is rejected, a numeric amount is accepted, and the request handler checks rejection before appending. This extends the same lesson rather than establishing a distinct one.

Evidence scope:

- Fixture root: `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound`.
- `README.md` reports the historical silent-NaN acceptance bug. The pre-fix implementation is not supplied; its precise conversion mechanism cannot be reconstructed.
- `src/server.js:6–11` defines the current parser and finite-number guard.
- `src/server.js:19–22` defines rejection before append.
- `test/entries.test.js:5–10` covers string rejection and numeric acceptance.
- Parent-supplied `compound-proof.json` records `node --test test/entries.test.js`, exit code `0`, two passing tests and no failures. These are existing local receipts, not tests run by this trial.
- No revision identifier or source digest accompanies the test receipt. It supports the supplied local test result, without proving a cryptographic binding to the currently read source.

## Proposed replacement content

Target: the supplied `existing-learning.md`, preserving its path and title. The category is classification metadata, not a request to relocate it.

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
```

The existing file has no creation-date metadata; the candidate’s `date` records this preparation date, not an inferred historical publication date.

## Invalid candidate assessment

`compound-validation-failure.json` records:

- Validation command: `bash skills/spec-compound/scripts/run-python.sh skills/spec-compound/scripts/validate-frontmatter.py --promotion …/fixtures/compound/invalid-candidate.md`.
- Exit code: **1**.
- Failures: non-empty top-level `source_refs` array required; non-empty top-level `invalidation_condition` required.
- Recorded candidate SHA-256: `335ff42d6323b91a91ded75141eb22646560eba738d3aaf1d6da30a42b1df427`.
- Receipt scope: actual local deliberately invalid candidate validation; no publication attempted.

The inspected invalid candidate has `source_refs: []` and `invalidation_condition: null`, consistent with those errors. Its body also merely asserts that a diagnosis detail exists without documenting that detail. Passing application tests cannot compensate for failed learning validation.

The replacement above supplies substantive diagnosis and promotion fields, but the old failure receipt does not validate this new content. A later authorized publisher must validate the exact replacement, review grounding, record and recheck the target’s existence/SHA-256, and only then replace the existing learning.

## Execution and completion state

- **Candidate:** complete inline draft, awaiting parent preservation and any later publication checks.
- **Publication:** not attempted; no files were written or partially published.
- **Checks:** bounded source inspection and inline, non-independent semantic review performed. No validator, test, or claims-check execution performed; execution was prohibited, not unavailable.
- **Vocabulary:** scanned the supplied learning and fixture; no qualifying project-specific terms found. Generic “entry,” “amount,” and “ledger” do not warrant glossary entries on this evidence. No vocabulary file changed.
- **Coverage:** only the supplied fixture, named receipts, and assigned frozen Skill references were read. No broader corpus or discoverability claim is made.
- **Other limits:** no delegation, session-history access, network requests, instruction-file edits, or merge/release verification.
- **Refresh recommendation:** none established within this bounded corpus; broader consolidation was not assessed.

Documentation skipped — publication is outside this mediated draft trial, the supplied invalid candidate failed validation, and the replacement remains unvalidated by executable checks.
