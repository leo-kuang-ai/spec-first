# Compound Refresh Recommendation

Recommend consolidating the two short learnings without losing either recovery safeguard, and refining the glossary while preserving **Ledger space** as a resolvable historical alias. All changes remain candidates. The supplied validation receipt reports failure; nothing was published.

## Scope and status

Reviewed only the assigned frozen Skill package, five supplied fixture files, and the named validation receipt.

All fixture paths below are relative to:

`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/refresh/`

| Summary | Result |
|---|---|
| Learnings scanned | 2 |
| Additional artifacts reviewed | Glossary, historical consumer, invalid candidate |
| Worth lens | Off |
| Consolidation recommended | 1 cluster containing 2 learnings |
| Updated / consolidated / replaced / deleted / marked stale, applied | 0 / 0 / 0 / 0 / 0 |
| CONCEPTS.md | Changes recommended, not published |
| Publication status | Not attempted |
| Semantic review | Inline, fixture-bounded; no independent investigation |
| New validation execution | Not performed, as instructed |

This is a mediated recommendation. File reads establish the supplied texts, not implementation correctness, production behavior, or repository-wide consumer coverage.

```yaml
mutation_authorization: missing
commit_authorization: missing
landing_authorization: missing
commit_reason: commit_authorization_missing
worker_dispatch_authorization: missing
capability_probe: not_applicable
worker_dispatch_capability: unknown
worker_context_isolation: unknown
worker_model_override: unknown
worker_bounded_parallelism: unknown
worker_dispatch_outcome: "No dispatch; delegation prohibited by the request."
```

## Applied

None. No files were written, deleted, staged, committed, or published.

The receipt explicitly states that no publication was attempted. It does not establish a partial publication.

## Recommended

### Learning consolidation

**Classification:** Consolidate, candidate only.

**Proposed canonical target:** `learning-b.md`.

**Potential subsumed path:** `learning-a.md`, retained until a future authorized consolidation and its dependencies are verified.

Both texts state:

> Validate numeric amounts before write.

Their unique content is complementary:

| Source | Unique recovery knowledge to preserve |
|---|---|
| `learning-a.md` | “Preserve original bank exports for row-level reconciliation.” |
| `learning-b.md` | “For retry duplicates, compare original import IDs before reimport; never erase unrelated rows.” |

Neither existing document fully subsumes the other. Deleting either unchanged would lose useful guidance. A compact canonical document can preserve all three safeguards with little retrieval cost. Selecting `learning-b.md` is an editorial recommendation because it already contains the retry-specific guidance; no chronology or authority superiority is inferred.

The supplied corpus does not establish the guidance’s implementation witnesses or original incident history. Preserve these plausible claims; missing corroboration is not evidence of staleness. Neither learning contains an existing invalidation condition, which is a legacy evidence gap rather than deletion authority.

No explicit inbound links to either learning appear in the supplied files. Repository-wide citations and catalog rows were outside the permitted scope, so deletion readiness remains unverified.

### Glossary refinement

**Classification:** Update with synonym folding, candidate only.

`CONCEPTS.md` defines Workspace as a tenant-isolated accounting scope and explicitly calls Ledger space its historical alias. `import-v1.md` supplies a substantive consumer:

> Legacy API field ledger_space_id still identifies the Workspace. The old term is consumed here and must remain resolvable.

Preserve Workspace’s definition and Ledger space’s name under the surviving entry. This is an alias relationship, not concept retirement or replacement. Keep the concrete API-field detail in `import-v1.md`; it need not become implementation detail in the glossary.

Proposed glossary changes: zero new concepts, one alias fold, one retained historical-consumer explanation, zero retirements. No broader domain model was supplied, so additional vocabulary is not invented.

### Invalid candidate

**Classification:** Keep as validation evidence; exclude from promoted knowledge.

`invalid-candidate.md` has:

```yaml
source_refs: []
invalidation_condition: null
```

Its body mentions a request-shape diagnosis detail without specifying or substantiating that diagnosis. Do not merge this into the canonical learning as confirmed knowledge. Retain the original candidate as evidence of the failed attempt; the consolidation draft below contains only guidance recoverable from the two existing learnings.

The invalid candidate also lacks required shared schema fields such as `module`, `date`, `problem_type`, `component`, and `severity`. That is a manual schema observation, distinct from the two errors reported by the supplied validator receipt.

## Actual validation evidence

Receipt:

`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/refresh-validation-failure.json`

The receipt records this command, which was **not rerun** during this review:

```bash
bash skills/spec-compound-refresh/scripts/run-python.sh \
  skills/spec-compound-refresh/scripts/validate-frontmatter.py \
  --promotion \
  docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/refresh/invalid-candidate.md
```

Recorded result:

```text
exit_code: 1

promotion requires non-empty top-level 'source_refs' array
promotion requires non-empty top-level 'invalidation_condition'
```

Recorded candidate SHA-256:

```text
335ff42d6323b91a91ded75141eb22646560eba738d3aaf1d6da30a42b1df427
```

The hash is receipt-supplied, not independently recomputed here. The receipt describes an actual deliberately invalid candidate check and explicitly says no publication was attempted.

**Consequence:** that candidate failed promotion validation. Adding fields in a draft would not retroactively turn this failure into a pass. The proposed drafts below have no successful validation receipt.

## Proposed final content

These are complete textual candidates for review, not filesystem changes or publication-ready assertions.

### `learning-b.md` — proposed canonical learning

The metadata classification is an editorial proposal: knowledge track, `best_practice`, application responsibility, and provisional medium severity. No measured incident severity was supplied. The references recover the original fixture guidance; they do not prove application behavior.

```markdown
---
title: "Numeric validation and safe import recovery"
date: "2026-10-30"
module: "Accounting imports"
problem_type: best_practice
component: application_code
severity: medium
source_refs:
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/refresh/learning-a.md"
  - "docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave1/fixtures/refresh/learning-b.md"
invalidation_condition: "Re-review this guidance if the governing import contract changes numeric validation timing, original export retention, import ID identity, or recovery deletion scope; compare the revised contract and implementation evidence against each preserved safeguard before changing or retiring it."
applies_when:
  - "Validating numeric amounts before an import write"
  - "Reconciling imported rows with original bank exports"
  - "Investigating retry duplicates before reimport"
tags: ["accounting-imports", "numeric-validation", "reconciliation", "retry-recovery"]
---

# Numeric validation and safe import recovery

## Context

The supplied learnings share a numeric-validation rule and contribute complementary safeguards for reconciliation and retry recovery.

## Guidance

- Validate numeric amounts before write.
- Preserve original bank exports for row-level reconciliation.
- For retry duplicates, compare original import IDs before reimport.
- Never erase unrelated rows during retry recovery.

## Why This Matters

Keeping these rules together preserves both reconciliation evidence and the boundary on retry recovery. Numeric validation alone does not replace either safeguard.

## When to Apply

Use this guidance when validating import amounts, reconciling imported rows, or investigating duplicates before a retry.

## Evidence and limitations

This candidate consolidates the supplied learning-a.md and learning-b.md texts. Their shared rule and unique recovery guidance are preserved.

No implementation, test, incident record, or governing import contract was supplied. Application behavior and operational effectiveness remain unverified. The separate invalid promotion candidate does not establish a request-shape diagnosis and contributes no confirmed diagnosis to this learning.

## Source preservation

The source references identify the original fixture texts. Before deleting or overwriting those sources during any future publication, preserve their original contents in a durable, recoverable form and update these references to that verified evidence. The canonical document must not rely solely on a deleted path or its own rewritten contents as proof of provenance.
```

The `source_refs` above remain resolvable in the unchanged supplied fixture. They are **not a deletion-ready provenance arrangement**: deleting `learning-a.md` or overwriting `learning-b.md` requires verified recovery references first. No commit identifier or retained-copy path is invented.

### `CONCEPTS.md` — proposed glossary

```markdown
# Concepts

## Workspace

A tenant-isolated accounting scope.

*Historical alias:* Ledger space.

Ledger space means the same concept and remains resolvable for the import-v1 consumer.
```

### `import-v1.md` — retained unchanged

```markdown
Legacy API field ledger_space_id still identifies the Workspace. The old term is consumed here and must remain resolvable.
```

## Reviewed without edits

| File | Classification | Disposition |
|---|---|---|
| `import-v1.md` | Keep | Supplies the consumer evidence requiring alias preservation. |
| `invalid-candidate.md` | Keep as failed-validation evidence | Remains invalid and unpublished; its unsupported diagnosis is not promoted. |

`learning-a.md`, `learning-b.md`, and `CONCEPTS.md` also remain physically unchanged; their proposed mutations are listed under Recommended.

## Conditions before any future publication

1. Resolve the actual destination repository and authorized document scope; this trial authorizes neither publication nor deletion.
2. Preserve recoverable original learning contents and establish durable provenance before replacing or deleting their paths.
3. Check current implementation or governing evidence, inbound citations, substantive consumer references, catalog entries, and final links within the authorized repository.
4. Validate the complete canonical candidate with the promotion and claims checks. Review semantic evidence separately; parser success alone would not establish correctness.
5. Snapshot target identity and freshness with tools. Publish approved glossary and canonical content, repair dependent citations/catalog entries, and verify actual destinations before considering deletion of `learning-a.md`.
6. Leave the original learning in place if validation, provenance, citation repair, or publication fails. Report any actual partial effects by exact path.

No new validators, claims checks, hashes, tests, or publication checks were executed. This was an inline textual review, not a manual substitute for a successful validator run.

## Discoverability and remaining gaps

No instruction surface, catalog, pattern document, or declared application model was supplied in this fixture. Discoverability and wider consumer coverage therefore remain unassessed; no instruction-file change is proposed. No legacy archive was present in the supplied fixture listing.

The safe immediate result is this recommendation: preserve all existing files, retain the historical alias and unique recovery knowledge, and keep the proposed consolidation and glossary update explicitly unpublished.
