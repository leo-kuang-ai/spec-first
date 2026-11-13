**No supplied receipt authorizes a real provider launch. Positive authenticated admission is unavailable.** All four `start` attempts reject admission, while all four direct `__worker` attempts reach the parent’s fail-fast fake provider. This exposes a direct-worker admission concern in the recorded controls; it does **not** demonstrate real provider access or model execution.

Evidence shorthand:

- **R**: `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/pov-A-receipts.json`
- **P**: `.spec-first/workflows/spec-work/spec-first/ce-opt-27-w1-20261030/inputs/A/spec-pov/references/cross-model-panel.md`

| Case | Entrypoint | Recorded finding | Exact evidence |
|---|---|---|---|
| Missing | `start` | Exit `1`, `provider_serving_receipt_invalid`; fake provider not called. | R `/cases/0` |
| Missing | `__worker` | Exit `37`; fake provider called despite absent receipt. | R `/cases/1` |
| Weak | `start` | Exit `1`, `provider_serving_receipt_unverified`; fake provider not called. | R `/cases/2` |
| Weak | `__worker` | Exit `37`; fake provider called with degraded, unverified receipt. | R `/cases/3` |
| Forged | `start` | Exit `1`, `provider_serving_receipt_invalid`; self-claimed `confirmed/verified` rejected. | R `/cases/4` |
| Forged | `__worker` | Exit `37`; fake provider called with self-claimed verification. | R `/cases/5` |
| Expired | `start` | Exit `1`, `provider_serving_receipt_unverified`; expiration-specific enforcement is not established because the receipt is also unverified. | R `/cases/6` |
| Expired | `__worker` | Exit `37`; fake provider called with unverified receipt expired in 2000. | R `/cases/7` |

Every case records `result_preserved: true` and `jobs_created: false`. These outcomes do not erase the direct-worker fake invocation. R `/limitations/0` explicitly states that only fail-fast fake executables were available and no real external model/provider executed.

**The missing producer is substantive, not a receipt-file formatting problem.** R `/limitations/1` states that no authenticated positive serving producer exists and file-based verification claims remain untrusted. P, “Independent round,” requires an authenticated host producer channel and otherwise forbids publishing a packet or starting a peer. Editing a file to say `verified`, changing timestamps, or invoking `__worker` cannot supply that channel.

Before any future positive admission, the responsible owners need:

- **Host/provider integration owner:** evidence from an authenticated host producer channel establishing current serving identity, including the host provider and fixed peer provider/model. The supplied material neither provides that evidence nor specifies a complete producer implementation.
- **Dispatch/admission owner:** a current canonical worker-dispatch journey receipt proving the eligible attempt; applicable delegated-work and independent restricted-read, data-egress, credential-use, and external-communication authorization; exact allowlisted `input_refs`; minimized, secret-redacted payload; current source identity; and matching receipt/payload hashes. These requirements appear in P, “Admission and approach set.”
- **Runner owner:** investigate and close or explicitly constrain the direct `__worker` path demonstrated by R `/cases/1`, `/cases/3`, `/cases/5`, and `/cases/7`. These controls do not establish that this entrypoint enforces authenticated admission before invoking a provider executable.
- **Validation owner:** after the authenticated producer exists, demonstrate positive admission and rejection behavior across both entrypoints under separately authorized conditions. Requested/actual provider and model evidence is needed before claiming independent corroboration; see P, “Reconciliation and claim boundary.”

One reporting discrepancy remains: P, “Independent round,” names `provider_serving_receipt_unavailable` for a missing receipt, whereas R `/cases/0/stderr` records `provider_serving_receipt_invalid`. The contract/runner owner should reconcile this; it does not change the rejection outcome.

This assessment used file reads only. No provider, helper, script, test, browser, network operation, or delegation was initiated. Real-provider admission, authenticated positive execution, expiration-specific rejection, and independent model corroboration remain unproven.
