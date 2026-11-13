Hold — none of the supplied file receipts authorizes a real provider. Positive authenticated admission is unavailable in this evidence set. The direct-worker controls nevertheless reached a fake provider in all four cases, so the observed protection at `start` does not establish protection at `__worker`.

Evidence references below use:

- `R`: `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/pov-A-receipts.json`
- `C`: `.spec-first/workflows/spec-work/spec-first/ce-opt-27-w1-20261030/inputs/A/spec-pov/references/cross-model-panel.md`

| Receipt | Entrypoint | Observed result | Admission finding | Evidence |
|---|---|---|---|---|
| Missing | `start` | Exit 1; `provider_serving_receipt_invalid`; fake provider not called | Rejected before the fake provider | `R:5–15` |
| Missing | `__worker` | Exit 37; fake provider called | Direct path reached the control despite no receipt | `R:16–26` |
| Weak | `start` | Exit 1; `provider_serving_receipt_unverified`; fake provider not called | Degraded/unverified receipt rejected | `R:27–42` |
| Weak | `__worker` | Exit 37; fake provider called | Direct path reached the control despite unverified admission | `R:43–58` |
| Forged | `start` | Exit 1; `provider_serving_receipt_invalid`; fake provider not called | Self-declared `confirmed/verified` was insufficient | `R:59–73` |
| Forged | `__worker` | Exit 37; fake provider called | Direct path reached the control despite unsupported verification claims | `R:74–88` |
| Expired | `start` | Exit 1; `provider_serving_receipt_unverified`; fake provider not called | Rejected as unverified; this does not isolate freshness enforcement | `R:89–105` |
| Expired | `__worker` | Exit 37; fake provider called | Direct path reached the control with an expired, unverified receipt | `R:106–122` |

Every case records `result_preserved: true` and `jobs_created: false`. These facts do not negate the recorded direct-worker executable calls. Only fail-fast fake provider executables were available at the front of `PATH`; no actual external model/provider ran (`R:124–126`). Exit 37 therefore proves neither successful provider operation nor a real-provider admission rejection.

The frozen contract requires an authenticated host producer channel; file-based `provider-serving-receipt/v2` remains degraded/unverified (`C:21`). It also requires explicit dispatch authority, a current canonical worker-dispatch journey receipt, separate restricted-read/data-egress/credential-use/external-communication authorization, exact allowlisted `input_refs`, redaction, current source identity, and matching receipt/payload hashes (`C:11`). None is established merely by the forged status fields.

Remaining owners and actions:

- **Host admission/producer owner:** supply a trusted, authenticated producer channel and independently verifiable evidence binding the eligible attempt to current source identity, exact payload hashes and read scope, required authorizations, and fixed host/peer provider/model identities. Establish current validity/freshness through that channel. Editing receipt status fields is insufficient.
- **Worker adapter/security owner:** investigate and close or otherwise substantiate the direct `__worker` admission boundary. The eight observations establish a control-path discrepancy, not its source-level cause or real-provider exploitability.
- **Contract owner:** reconcile the missing-receipt reason-code mismatch: the contract specifies `provider_serving_receipt_unavailable` (`C:21`), while missing/`start` records `provider_serving_receipt_invalid` (`R:11`).
- **Validation owner:** after a producer exists and separate execution authorization is granted, verify authenticated positive admission and negative rejection at both entrypoints. Distinguish a trusted admission result from actual provider/model operation and from independent corroboration (`C:35–37`).

This review performed file reads only. No provider, helper, test, browser, network operation, mutation, or delegation was performed. Real-provider admission, authenticated positive operation, independent peer coverage, and source-level root cause remain unverified.
