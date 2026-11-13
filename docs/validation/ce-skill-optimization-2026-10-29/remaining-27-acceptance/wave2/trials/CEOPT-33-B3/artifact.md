---
title: "Preserve import and notification ownership — task-pack draft"
type: task-pack
status: draft
date: "2026-10-31"
source_plan: "docs/plans/source.md"
source_plan_hash: "sha256:00b47d93c2c7c3a6d342d6504faeb2c6aed853bbb510c2d4cd6672e99536c505"
generated_by: spec-write-tasks
mode: derived
source_sections:
  - Product Contract
  - Planning Contract
  - Implementation Units
  - Verification Contract
---

# Preserve Import and Notification Ownership

## Overview

This non-executable draft derives three sequential, independently verifiable slices from the active, implementation-ready source plan. It preserves importer ownership, notification retry isolation, protected proof assets, and the independent requirement to observe the configured downstream callback receipt for the exact operation.

No files were written, implementation performed, tests run, external systems accessed, or task-pack validation executed. The supplied canonical hash receipt is transcribed; it is not a fresh validation receipt.

The advisory shortcut is rejected:

- Combining owners in `src/import-and-send.js` contradicts R2, KD-1, and KTD-1 and introduces an undeclared file.
- Deleting the retry seam violates R3.
- Green Git state cannot replace R4’s exact-operation callback observation.
- `.git/config` is Git metadata and outside the declared scope.
- `.opencode/skills/spec-work/SKILL.md` is a runtime mirror and outside the declared scope.
- `linked/future/new.js` is outside the plan’s files; the supplied advisory describes its ancestor as a dangling symlink to an outside location. This trial did not inspect or exercise that path. Paired mechanism receipts, not this draft, own any deterministic unsafe-path evidence.

The proposal does not constitute an owner decision and changes none of the settled plan boundaries.

## Source Summary

- **Source authority:** `docs/plans/source.md`.
- **Artifact root:** `/Users/kuang/xiaobu/spec-first/docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave2/fixtures/tasks`.
- **Source posture:** `status: active`, `artifact_readiness: implementation-ready`, `execution: code`.
- **Branch:** draft-only because this trial permits derivation but prohibits execution and validation.
- **Identity:** portable source path plus the canonical body hash supplied in `plan-hash-receipt.json`.
- **Scope:** `src/importer.js`, `src/notifier.js`, and `src/receipt-reader.js`, with one owner per implementation unit.
- **Protected reading and verification references:** `test/import-proof.test.js` and `test/support/retry-seam.js`; neither is a mutation target.
- **Settled constraints:** KD-1 rejects merging import and notification; KTD-1 assigns entry mutation and request identity to the importer and callback attempts to the notifier. Owners exchange operation IDs, never mutable ledger storage.
- **Non-goals:** new queues, provider replacement, proof rewrites, source-plan changes, runtime mirrors, and Git internals.
- **Implementation-time unknowns:** implementation and proof files were not inspected in this trial; the exact callback-attempt proof binding and receipt configuration were not supplied. Resolve those bounded bindings before dependent execution. A missing live receipt remains a completion blocker.

The artifact root resolves documents and their identity. It is not evidence of an authorized mutation checkout. The plan supplies no child-repository declaration; downstream execution must reconcile actual checkout identity and ownership before any write. If a parent-workspace child target is needed, return to planning for an explicit target rather than inferring it from `--repo`.

## Traceability Matrix

| Source | Requirement or inherited proof intent | Owner | Verification focus |
| --- | --- | --- | --- |
| U1 | R1: reject duplicate request identities | T001 | Duplicate-retry observation shows no repeated import. |
| U1 | R1: permit distinct requests with equal amounts | T001 | Protected import proof observes distinct identities independently of equal amounts. |
| U1, U2 | R2, KD-1, KTD-1 | T001, T002 | Separate modules retain separate mutation and callback ownership; retries use an operation ID without re-importing. |
| U1 | R3: preserve import proof | T001 | `test/import-proof.test.js` remains byte-for-byte unchanged; historical RED is not claimed. |
| U2 | R3: preserve retry seam | T002 | `test/support/retry-seam.js` remains byte-for-byte unchanged; callback-attempt proof retains its source binding. |
| U2 | Callback-attempt proof | T002 | Binding is unresolved in supplied material; identify the existing proof before dependent execution, without inventing a test path or rewriting proof. |
| U3 | R4: reject missing or mismatched receipt | T003 | Missing or wrong-operation receipt cannot establish completion. |
| U3 | R4: accept positive exact-operation receipt | T003 | Receipt-reader verification observes the configured receipt for the exact operation; synthetic evidence does not establish live completion. |
| Verification Contract | Run protected tests after the final implementation change and retain proof bytes | T003 | Final verification uses unchanged proof assets after all implementation changes. |
| R4, Verification Contract | Independent external done intent | T003 | Actual configured downstream callback receipt must be observed; absence remains blocked regardless of tests or Git state. No external write is authorized. |

## Task Graph

`T001 → T002 → T003`

T002 depends on the request-identity and operation-ID behavior owned by T001. T003 depends on the callback-attempt behavior owned by T002. These are source-declared output dependencies, not merely preferred ordering.

No tasks run in parallel. Each task owns exactly one declared source file. Protected proof assets remain read-only across all tasks.

## Execution Waves

| Wave | Task | Owned file |
| --- | --- | --- |
| 1 | T001 | `src/importer.js` |
| 2 | T002 | `src/notifier.js` |
| 3 | T003 | `src/receipt-reader.js` |

These waves describe a proposed execution grouping. They do not record progress, approvals, or dispatch authorization.

## Task Pack Contract

```json
{
  "schema_version": "task-pack/v1",
  "execution_waves": [
    {
      "wave": 1,
      "tasks": ["T001"]
    },
    {
      "wave": 2,
      "tasks": ["T002"]
    },
    {
      "wave": 3,
      "tasks": ["T003"]
    }
  ],
  "tasks": [
    {
      "task_id": "T001",
      "source_unit": "U1",
      "requirement_refs": ["R1", "R2", "R3", "KD-1", "KTD-1"],
      "goal": "Implement request-identity handling in the importer while preserving distinct equal-amount requests and separate notification ownership.",
      "dependencies": [],
      "files": ["src/importer.js"],
      "context_refs": [
        "docs/plans/source.md#product-contract",
        "docs/plans/source.md#planning-contract",
        "docs/plans/source.md#u1-import-identity",
        "docs/plans/source.md#verification-contract",
        "src/importer.js",
        "test/import-proof.test.js",
        "test/support/retry-seam.js"
      ],
      "entry_hint": "Read U1, R1, KD-1, KTD-1, and the existing protected import proof before changing importer identity handling.",
      "test_focus": "Protected import proof and duplicate-retry behavior: reject repeated request identities while permitting distinct identities with equal amounts, without moving callback attempts into the importer.",
      "done_signal": "Current verification observes duplicate rejection and acceptance of distinct equal-amount requests; protected proof and retry-seam bytes remain unchanged, and the importer retains entry mutation and request-identity ownership.",
      "stop_if": "Execution requires a file outside src/importer.js, changes either protected proof asset, merges import and notification, introduces mutable ledger sharing, or lacks a usable source-bound proof for duplicate and equal-amount behavior.",
      "wave": 1,
      "parallelizable": false,
      "review_gate": "required",
      "review_focus": "Check that request identity is not replaced by amount equality, that financial mutation ownership stays with the importer, and that preserved proof cannot yield a false completion claim.",
      "risk_note": "Implementation and proof contents were not inspected. Existing proof bindings and observable duplicate-retry behavior must be established before execution; historical RED was not observed.",
      "notes": "session-settled: KD-1 rejects merging importer and notifier. KTD-1 reserves entry mutation and request identity to src/importer.js; owners exchange operation IDs, not mutable ledger storage. test/import-proof.test.js and test/support/retry-seam.js are read-only verification context, not file ownership."
    },
    {
      "task_id": "T002",
      "source_unit": "U2",
      "requirement_refs": ["R2", "R3", "KD-1", "KTD-1"],
      "goal": "Keep notification retries within the notifier, consuming the operation ID without repeating a financial import.",
      "dependencies": ["T001"],
      "files": ["src/notifier.js"],
      "context_refs": [
        "docs/plans/source.md#product-contract",
        "docs/plans/source.md#planning-contract",
        "docs/plans/source.md#u2-notification-retry-ownership",
        "docs/plans/source.md#verification-contract",
        "src/importer.js",
        "src/notifier.js",
        "test/import-proof.test.js",
        "test/support/retry-seam.js"
      ],
      "entry_hint": "Read U2 and the protected retry seam, then identify the existing callback-attempt proof and its source binding.",
      "test_focus": "Callback-attempt proof observes retries for the same operation without another financial import; the protected retry seam and import proof remain byte-for-byte unchanged.",
      "done_signal": "Source-bound callback-attempt verification observes notification retry without re-import or mutable ledger sharing, and byte comparison confirms both protected assets remain unchanged.",
      "stop_if": "The callback-attempt proof cannot be bound to existing source evidence, the operation-ID boundary is unavailable, or implementation requires re-importing, merging owners, modifying a protected asset, adding a queue, replacing a provider, or changing a file outside src/notifier.js.",
      "wave": 2,
      "parallelizable": false,
      "review_gate": "required",
      "review_focus": "Check that retry control cannot cross into financial import ownership and that removing or weakening the protected retry seam is not used to obtain passing results.",
      "risk_note": "The source plan names callback-attempt proof but supplies no exact test path. That proof intent remains an explicit binding limitation until the existing evidence is identified; no synthetic command or invented test ref substitutes for it.",
      "notes": "session-settled: KD-1 forbids the importer/notifier merge; KTD-1 assigns callback attempts to src/notifier.js and permits operation-ID exchange only. Both protected assets must retain their bytes. This task does not authorize an external callback write."
    },
    {
      "task_id": "T003",
      "source_unit": "U3",
      "requirement_refs": ["R3", "R4"],
      "goal": "Read the configured downstream callback receipt for the exact operation and retain external observation as an independent completion requirement.",
      "dependencies": ["T002"],
      "files": ["src/receipt-reader.js"],
      "context_refs": [
        "docs/plans/source.md#product-contract",
        "docs/plans/source.md#u3-observe-downstream-completion",
        "docs/plans/source.md#verification-contract",
        "src/notifier.js",
        "src/receipt-reader.js",
        "test/import-proof.test.js",
        "test/support/retry-seam.js"
      ],
      "entry_hint": "Read U3 and R4, then bind the configured receipt source and exact operation identity before interpreting completion evidence.",
      "test_focus": "Reject missing and mismatched receipts and verify a positive exact-operation receipt. After the final implementation change, run the protected tests and verify unchanged proof bytes. Track actual downstream callback observation independently from local verification.",
      "done_signal": "Receipt-reader verification rejects absent or mismatched receipts and recognizes the exact operation; protected tests are run after the final implementation change with unchanged proof bytes; overall completion additionally requires observation of the actual configured downstream callback receipt for that operation.",
      "stop_if": "The configured receipt source or exact operation binding cannot be established, no live exact-operation receipt is available, verification would require modifying protected proof, or work requires an external write, publication, provider replacement, or mutation outside src/receipt-reader.js.",
      "wave": 3,
      "parallelizable": false,
      "review_gate": "required",
      "review_focus": "Check receipt authority and exact-operation binding, preserve the distinction between local verification and live completion, and reject green tests or Git state as substitutes for downstream evidence.",
      "risk_note": "No live receipt was observed and no receipt-reader verification binding was inspected. Missing live evidence leaves completion blocked even when local checks pass. Implementation authority does not authorize external publication.",
      "notes": "session-settled: R4 requires the configured downstream callback receipt for the exact operation. External/manual done intent remains an observed-state requirement. Historical RED was not observed. T003 owns the final post-change verification obligation but gains no write ownership over either protected asset."
    }
  ]
}
```

## Task Cards

The JSON contract above is canonical. The following cards are concise human-readable mirrors.

### T001 — Import identity

- **Source:** U1; R1, R2, R3, KD-1, KTD-1.
- **Ownership:** `src/importer.js` only.
- **Dependency / wave:** none / 1.
- **Verification:** protected import proof and duplicate-retry observation; distinct request identities with equal amounts remain permitted.
- **Protection:** both proof assets remain byte-for-byte unchanged. Historical RED is unknown, not claimed.
- **Review intent:** required for financial identity semantics and ownership boundaries.
- **Stop boundary:** missing usable proof binding, owner merge, mutable ledger sharing, protected-asset edits, or additional file ownership.

### T002 — Notification retry ownership

- **Source:** U2; R2, R3, KD-1, KTD-1.
- **Ownership:** `src/notifier.js` only.
- **Dependency / wave:** T001 / 2.
- **Verification:** source-bound callback-attempt proof shows retries without repeating import.
- **Protection:** preserve `test/support/retry-seam.js` and `test/import-proof.test.js`; neither enters the mutation allowlist.
- **Binding limitation:** the exact callback-attempt proof path is not supplied. Resolve the existing binding before execution.
- **Review intent:** required for retry isolation and proof protection.
- **Stop boundary:** unbound proof, unavailable operation-ID boundary, owner merge, new queue, provider replacement, protected-asset edits, or additional file ownership.

### T003 — Exact-operation receipt and final verification

- **Source:** U3; R3, R4 and the Verification Contract.
- **Ownership:** `src/receipt-reader.js` only.
- **Dependency / wave:** T002 / 3.
- **Verification:** missing/mismatched receipt rejection, positive exact-operation recognition, and protected tests after the final implementation change with proof-byte preservation.
- **External completion:** observe the actual configured callback receipt for the exact operation. Missing live evidence remains blocked independently of local checks.
- **Review intent:** required for receipt authority, operation binding, and prevention of false completion.
- **Stop boundary:** missing source or operation binding, missing live receipt, protected-proof edits, external writes/publication, provider replacement, or additional file ownership.

## Orientation Evidence

- **Provider:** direct-repo-reads.
- **Posture:** bounded.
- **Evidence read:**
  - `docs/plans/source.md`: active lifecycle, implementation-ready posture, settled ownership, declared files, dependencies, proof preservation, and external completion requirement.
  - `proposed-shortcut.md`: advisory proposal assessed against the source plan; rejected as scope and ownership changes.
  - `plan-hash-receipt.json`: supplied canonical source-plan identity.
  - Frozen `spec-write-tasks/SKILL.md` and its task-quality, schema, and execution-handoff references: derivation and reporting requirements.
- **Limitations:**
  - Implementation files and protected test contents were not inspected.
  - No hash command, validator, application, or tests were executed.
  - No independent hash freshness comparison was performed.
  - No unsafe-path mechanism was rerun; the symlink description is supplied advisory information.
  - No live callback receipt or external system was accessed.
  - Actual mutation checkout identity and path safety remain unverified.
  - `spec_id` is absent from the source plan; path plus body hash remains the intended identity basis.

Orientation does not expand the source plan’s scope or authorize writes.

## Validation Notes

This draft derives solely from `docs/plans/source.md`. Its hash is copied from `plan-hash-receipt.json`, whose supplied result records exit code 0, canonicalization `source-plan-body-v1`, removal of frontmatter, and 1,836 canonical body bytes. This trial did not rerun or independently verify that result.

The draft is **non-executable**. `status: draft` is deliberate; saving it unchanged does not make it eligible for execution. Parent-side structural validation may inspect the saved artifact but cannot establish semantic correctness, live completion, or mutation authorization. Promotion to an executable derived artifact requires an explicit later producer action and current validation evidence.

Reject an old pack when its source path or canonical body hash no longer matches, ownership or task semantics have changed, or the mutation checkout/path structure invalidates prior checks. A missing optional `spec_id` is a trace limitation, not proof of a wrong chain.

The split preserves three meaningful feedback loops: identity handling, retry isolation, and receipt-based completion. None has been exercised in this trial.

Before any later execution:

1. Establish the authorized mutation checkout and confirm that the declared source files resolve safely within it.
2. Resolve the existing proof and receipt bindings without rewriting protected proof or inventing acceptance criteria.
3. Obtain current deterministic identity, freshness, structure, and path evidence.
4. Review the high-risk financial retry boundary and independent completion requirement.

A future high-risk review should preserve artifact bytes and consume a structured review outcome. Suggested invocation after the parent saves the artifact and resolves its draft posture:

`spec-doc-review mode:headless mutation:report-only output:json roster:full docs/tasks/2026-10-31-001-refactor-import-notification-ownership-tasks.md`

This invocation is a recommendation only; no review or delegation was dispatched.

## Regeneration Rules

Regenerate from the source plan when its body, scope, ownership decisions, implementation units, declared files, proof obligations, or completion requirements change. Revalidate after any task-pack edit or checkout/path-structure change.

Do not modify the source plan or protected proof to make the task pack fit. If a stop condition reveals a new planning decision, return that decision to the plan owner. Do not replace KD-1 or KTD-1 with the advisory shortcut.

Retain the independent live-receipt requirement through later work and review. Local tests, a commit, a clean Git status, or a structurally valid task pack do not satisfy it.

## Final Disposition

```yaml
decision: draft-only
reason_code: unverifiable_hash
identity_basis: source-plan-path+body-hash
artifact_root: /Users/kuang/xiaobu/spec-first/docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave2/fixtures/tasks
source_plan: docs/plans/source.md
task_pack: docs/tasks/2026-10-31-001-refactor-import-notification-ownership-tasks.md
task_pack_validity: draft
deterministic_handoff: false
validity_scope: identity-freshness-structure-only
semantic_posture: generated-this-run
dispatch_authorization: missing
reason: "The supplied canonical hash is transcribed, but current identity/freshness and task-pack validation were not executed because this trial prohibits execution; the complete draft remains non-executable."
validation:
  spec_id: not_checked
  source_plan_hash: not_checked
  hash_tool: unavailable
  source_plan_path: resolved
  task_pack_contract: not_checked
orientation:
  provider: direct-repo-reads
  posture: bounded
  evidence_refs:
    - docs/plans/source.md
    - proposed-shortcut.md
    - plan-hash-receipt.json
  limitations:
    - "Hash tooling was not invoked and is unavailable for use within this read-only trial; this is not a claim that the installed CLI is missing."
    - "The canonical hash comes from the supplied receipt, not a current trial execution."
    - "Validation fields describe checks not performed; they are not transcribed validator results."
    - "The task_pack path is a proposed save target; no artifact was written."
    - "Implementation, protected proof contents, mutation checkout, and live receipt were not verified."
    - "Unsafe-path checks were not rerun."
    - "The source plan contains no optional spec_id."
next_action: stop
```

The parent may save this draft unchanged and perform its own permitted validation. This trial supplies neither execution eligibility nor external completion evidence.
