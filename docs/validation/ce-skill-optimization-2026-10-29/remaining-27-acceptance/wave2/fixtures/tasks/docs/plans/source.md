---
title: Preserve import and notification ownership
type: refactor
status: active
artifact_contract: spec-unified-plan/v1
artifact_readiness: implementation-ready
execution: code
---

# Preserve Import and Notification Ownership

## Product Contract

R1: Reject duplicate request identities while permitting distinct requests with equal amounts.
R2: Keep importing and notification delivery as separate owners. KD-1 rejects merging them: retrying notification must never repeat a financial import.
R3: Protect test/import-proof.test.js and test/support/retry-seam.js byte-for-byte. Historical RED was not observed; do not invent it.
R4: Completion requires the configured downstream callback receipt for the exact operation. Green tests or Git state alone are insufficient. No external write is authorized by this fixture.

## Planning Contract

KTD-1: src/importer.js owns entry mutation and request identity; src/notifier.js owns callback attempts. They exchange operation IDs, not mutable ledger storage.
Non-goals: new queue, provider replacement, rewriting proof, changes to source plan, runtime mirrors or Git internals.

## Implementation Units

### U1: Import identity
Files: src/importer.js. Implement request-identity handling preserving distinct equal-amount requests. Verify protected import proof and a duplicate-retry scenario.

### U2: Notification retry ownership
Depends on U1. Files: src/notifier.js. Consume the operation ID without rerunning the import. Verify callback-attempt proof and preserve the retry seam.

### U3: Observe downstream completion
Depends on U2. Files: src/receipt-reader.js. Read the exact callback receipt; missing live receipt remains blocked. Verify mismatched/missing receipt rejection and positive exact-operation receipt.

## Verification Contract

Run the protected tests after the last implementation change; retain proof bytes. Exact downstream callback observation is an independent completion facet. Implementation authority does not authorize external publication.
