**Hold — no supplied receipt authorizes a real provider. Positive authenticated admission is unavailable.** The evidence also exposes a direct-worker boundary gap: all four `__worker` attempts reached the parent’s fake provider despite inadmissible receipts. This establishes fake-control invocation only; it does not establish actual model execution, external communication, or successful provider admission.

Evidence file: `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/pov-A-receipts.json` (“R” below). References use exact JSON pointers.

| Attempt | Evidence | Finding |
|---|---|---|
| Missing / `start` | R `/cases/0` | No receipt; exit `1`, `provider_serving_receipt_invalid`; fake provider not called. Rejected. |
| Missing / `__worker` | R `/cases/1` | No receipt; fake provider called, exit `37`. Direct entry reached the fake executable without receipt admission. |
| Weak / `start` | R `/cases/2` | `degraded/unverified`, `authenticated-producer-unavailable`; exit `1`, `provider_serving_receipt_unverified`; fake provider not called. Rejected. |
| Weak / `__worker` | R `/cases/3` | Same unverified receipt; fake provider called, exit `37`. Direct entry did not enforce the observed start rejection. |
| Forged / `start` | R `/cases/4` | Self-asserted `confirmed/verified`; exit `1`, `provider_serving_receipt_invalid`; fake provider not called. Claimed verification supplies no authenticated authority. |
| Forged / `__worker` | R `/cases/5` | Same claimed verification; fake provider called, exit `37`. This supplies no positive authenticated admission. |
| Expired / `start` | R `/cases/6` | Unverified receipt with expiry `2000-01-01T00:00:00Z`; exit `1`, `provider_serving_receipt_unverified`; fake provider not called. Evidence does not isolate a freshness-specific rejection. |
| Expired / `__worker` | R `/cases/7` | Same expired, unverified receipt; fake provider called, exit `37`. Evidence proves neither authenticated admission nor independent freshness enforcement. |

All eight cases report `result_preserved: true` and `jobs_created: false`. These observations do not erase the direct-worker invocation finding.

The governing frozen reference, `.spec-first/workflows/spec-work/spec-first/ce-opt-27-w1-20261030/inputs/A/spec-pov/references/cross-model-panel.md`, sections **Admission and approach set** and **Independent round**, requires authenticated provenance and matching authorization/source/payload facts before publication or launch. It explicitly classifies current file-based `provider-serving-receipt/v2` as `degraded/unverified`. Its missing-receipt reason is `provider_serving_receipt_unavailable`; the observed `start` result instead says `provider_serving_receipt_invalid`. That discrepancy remains unresolved.

Concrete missing producer evidence and owners:

- **Host producer owner:** provide a trusted authenticated producer channel and verifiable provenance binding the actual host provider and fixed peer provider/model to current source identity, freshness, exact allowlisted inputs, and matching receipt/payload hashes. Merely editing JSON to say `verified` cannot satisfy this.
- **Authorization owner:** supply the current canonical worker-dispatch journey receipt and explicit restricted-read, data-egress, credential-use, and external-communication authorization for the fixed recipient and scope.
- **Runner owner:** investigate and close the `__worker` admission gap and reconcile missing-receipt reason semantics before a future authorized positive-path evaluation.
- **Validation owner:** obtain authenticated positive-admission evidence, then separately capture requested/actual provider/model and genuine operation evidence. Current fake-provider controls cannot establish these outcomes.

R `/limitations/0` explicitly says no real external model/provider executed; `/limitations/1` says no authenticated positive serving producer exists in this test. No provider was started, no producer was bypassed, and no implementation or independent runtime verification was performed in this read-only assessment.
