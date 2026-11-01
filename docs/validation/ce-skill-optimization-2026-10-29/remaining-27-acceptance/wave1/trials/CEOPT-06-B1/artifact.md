Ran Full-mode analysis within the requested read-only, mediated-draft boundary. Publication was not attempted.

# Candidate and disposition

**Disposition: update the existing learning, preserve its recovery guidance, and withhold publication pending candidate validation.** The overlap is high: both documents concern numeric ledger input validation. The distinct supported addition is the request-shape diagnosis—`"12"` is a JSON string, whereas `12` is a JSON number; the current guard rejects the former before persistence.

The recovery guidance qualifies for retention because the final implementation and its two tests do not explain how to handle already imported rows. Its provenance is the supplied existing learning, not newly verified recovery execution.

## Proposed replacement for `fixtures/compound/existing-learning.md`

The following is candidate content only; no file was written.

```markdown
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
(`test/entries.test.js:5` and `test/entries.test.js:9`).

## What Didn't Work

No investigation attempts or failed remedies are supplied. Do not infer
a prior coercion strategy from the current fix or the test names.

## Solution

Validate numeric amounts before persistence. The current parser rejects
amounts unless they are JavaScript numbers and finite:

    if (typeof amount !== 'number' || !Number.isFinite(amount)) {
      return null;
    }

This guard is defined in `src/server.js:8`. It distinguishes a quoted
numeric string from a numeric JSON value without coercing the input.

The request handler checks the parser result before appending an entry.
A rejected amount produces status 400 and `invalid amount`
(`src/server.js:19`–`21`). These HTTP-path statements are source-grounded;
the supplied tests exercise the parser directly.

Preserve the existing learning's unique historical recovery guidance:
reconcile already imported rows against the original bank export before
reimporting; never delete unrelated rows. This is retained guidance from
`existing-learning.md`, not a recovery procedure executed or verified by
the supplied parser tests. The available fixture does not expose an
importer or establish its idempotency behavior.

## Why This Works

The guard checks the parsed value's type and finiteness before constructing
the entry (`src/server.js:6`–`11`). The handler's rejection branch occurs
before `entries.push(entry)` (`src/server.js:19`–`21`).

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

The parent-provided `../compound-proof.json`, relative to the fixture
directory, records `node --test test/entries.test.js` with exit code 0,
two passing tests, and zero failures. It supports the two parser cases
described above. This read-only review did not rerun tests and does not
establish HTTP integration, historical data recovery, deployment, or
remote landing.
```

## Invalid candidate assessment

The supplied `invalid-candidate.md` is **not eligible for promotion**:

- `source_refs: []` is empty.
- `invalidation_condition: null` is not a non-empty string.
- It also lacks the shared classification fields required for a new learning. The receipt does not claim to validate those fields.

The actual `compound-validation-failure.json` records exit code **1**, explicitly reporting both promotion-field failures. Its candidate digest is `335ff42d6323b91a91ded75141eb22646560eba738d3aaf1d6da30a42b1df427`; its stated scope says no publication was attempted. That result applies to the supplied invalid candidate, not to the replacement drafted above.

Adding a useful diagnosis detail does not override failed validation. Repairing the candidate text also does not retroactively turn that failure into a passing receipt.

## Validation and publication state

| Item | Observed state |
|---|---|
| Existing local parser proof | Supplied receipt: exit 0, two tests passed |
| Supplied invalid candidate | Supplied receipt: exit 1; promotion blocked |
| Replacement candidate above | Source-grounded draft; validators not executed |
| Semantic review | Inline, non-independent; historical recovery explicitly attributed |
| Target existence/hash rechecks | Not performed |
| Durable learning publication | Not attempted |
| Files written by this trial | None |

The replacement's frontmatter has been inspected manually for required fields, allowed classification values, quoted strings, and meaningful promotion fields. This is not a bundled-validator pass. Execution was prohibited by the task, rather than shown to be unavailable.

Related-document coverage was limited to the supplied existing learning and invalid candidate; no broader corpus or external search was performed. Session history, optional enhancement, independent review, and instruction-file edits were omitted within the assigned boundary.

**Vocabulary capture:** scanned the supplied material; no qualifying project-specific terms identified. “Ledger entry,” numeric validation, and persistence do not gain a distinct domain meaning from this fixture sufficient to justify glossary entries. No glossary was read or changed.

**Next publication condition:** the authorized publisher must validate the exact assembled replacement, adjudicate its claims, and recheck the existing target before replacement. Saving this response as a trial artifact does not publish the learning into durable knowledge.

**Documentation skipped — publication withheld; candidate returned for parent handling.**
