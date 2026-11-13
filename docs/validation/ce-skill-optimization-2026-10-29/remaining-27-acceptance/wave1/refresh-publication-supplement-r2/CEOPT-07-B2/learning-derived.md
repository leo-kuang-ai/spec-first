---
title: "Numeric validation and recoverable bank imports"
module: "Bank import guidance"
date: "2026-10-30"
problem_type: documentation_gap
component: documentation
severity: low
source_refs:
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/refresh-publication-supplement-r2/CEOPT-07-B2/source-recovery/learning-a.md"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/refresh-publication-supplement-r2/CEOPT-07-B2/source-recovery/learning-b.md"
invalidation_condition: "Reassess when an authoritative import contract or verified implementation changes numeric validation before writes, the use of original exports for row-level reconciliation, or original import IDs for retry recovery; compare that evidence against each retained rule before revising or retiring it."
applies_when:
  - "Preparing numeric amounts for a bank import write"
  - "Reconciling imported rows against original bank exports"
  - "Investigating duplicate rows before retrying an import"
tags:
  - "bank-import"
  - "numeric-validation"
  - "row-reconciliation"
  - "retry-recovery"
---

# Numeric validation and recoverable bank imports

## Context

The supplied learnings repeat a numeric-validation rule while recording
different recovery precautions. This document brings those precautions together
without discarding either source's unique guidance.

## Guidance

- Validate numeric amounts before writing.
- Preserve original bank exports for row-level reconciliation.
- When investigating retry duplicates, compare original import IDs before
  reimporting.
- Never erase unrelated rows during recovery.

## Why This Matters

Validation, reconciliation, and retry recovery serve different purposes.
Preserving the original exports retains the material needed for row-level
comparison. Comparing original import IDs preserves the supplied retry
diagnostic step, while the unrelated-row constraint limits recovery scope.

These practices come from the supplied learning documents. Their implementation
and effectiveness have not been independently verified against application code,
tests, or incident evidence in this review.

## When to Apply

Use this guidance when preparing bank imports, reconciling imported rows, or
investigating duplicate rows before a retry.

## Evidence and Limits

The source references identify the original learning documents as read for this
draft. They establish the provenance of the documented practices, not a verified
production incident or implementation.

Before replacing either original or deleting a subsumed path, preserve its
original contents in verifiable durable history or retained recovery evidence
and update these references to recoverable historical sources. A self-reference
to the rewritten canonical document is not sufficient historical provenance.

No request-shape diagnosis is established by the supplied evidence.

## Parent evaluation provenance

Only the source references above were rebound to retained byte-identical originals by the parent. This is an evaluation derivative, not a newly verified application fix or a model-authored publication result. The original fixture guidance remains historically attributed and operationally unverified.
