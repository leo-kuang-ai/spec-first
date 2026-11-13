Ran Full-mode research and grounding inline, adapted to the read-only mediated draft scope. Publication is skipped; the candidate below has not been written or validated by executable checks.

# Numeric ledger learning candidate and disposition

## Disposition

**Proposed action:** update `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/compound/existing-learning.md` in place, preserving its title and unique recovery guidance. Do not create a competing learning.

Overlap is high across all five dimensions: problem, root cause, solution, referenced files, and prevention. The additional request-shape diagnosis belongs in the existing learning. Its historical recovery instruction is not recoverable from the current implementation or tests, so preserving it passes the reuse threshold.

**Invalid candidate:** reject promotion. The supplied `compound-validation-failure.json` records exit code `1` and these errors:

```text
promotion requires non-empty top-level 'source_refs' array
promotion requires non-empty top-level 'invalidation_condition'
```

The receipt identifies candidate SHA-256 `335ff42d6323b91a91ded75141eb22646560eba738d3aaf1d6da30a42b1df427`; this digest was supplied, not recomputed here. The inspected invalid candidate has `source_refs: []` and `invalidation_condition: null`, consistent with the reported errors. It also lacks required classification fields, so fixing only those two promotion-shape errors would not establish full schema compliance.

The receipt explicitly states that no publication was attempted. This is a failed candidate validation, not partial publication. Passing application tests cannot override it.

## Proposed replacement content

The following is the complete proposed content of the existing learning. Its file path remains unchanged.

```markdown
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
```

## Evidence and publication boundary

- **Source grounding:** performed inline and non-independently. The guard and insertion order were checked directly against `src/server.js:6–22`; test scope was checked against `test/entries.test.js:5–10`.
- **Historical claims:** the pre-fix symptom is attributed to the supplied README. Recovery guidance is attributed to the existing learning and preserved without inventing recovery results.
- **Candidate checks:** frontmatter fields, enum choices, quoting, reference relevance, and the concrete invalidation trigger were reviewed manually. No executable frontmatter or claims validator ran for this replacement; its executable validation status remains **not run**.
- **Vocabulary capture:** scanned the supplied learning and fixture; no qualifying project-specific terms. “Entry,” “amount,” “bank export,” and “idempotency” do not require new project-specific glossary definitions on this evidence. No vocabulary candidate or file mutation.
- **Execution limits:** no delegation, session-history access, external requests, tests, writes, or publication. No independent reviewer coverage is claimed. Broader related-document and discoverability checks were outside the supplied scope.
- **Before any future publication:** validate the actual saved replacement, resolve any flags, and recheck the existing target’s existence and SHA-256 before replacement. Neither the failed receipt nor the application proof establishes validation of this new text. Saving this response as a trial artifact would not itself promote the learning.

**Documentation skipped — complete draft returned for parent storage; durable learning publication was not attempted.**
