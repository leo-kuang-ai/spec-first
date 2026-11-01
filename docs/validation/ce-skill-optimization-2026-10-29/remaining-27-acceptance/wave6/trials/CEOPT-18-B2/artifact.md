No supplied file receipt authorizes a real provider. Positive authenticated admission is unavailable in the supplied evidence; both entrypoints remain closed. Retain the in-process fallback and defer provider activation.

References below use:

- **R**: `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/pov-B-receipts.json`
- **P**: `.spec-first/workflows/spec-work/spec-first/ce-opt-27-w1-20261030/inputs/B/spec-pov/references/cross-model-panel.md`

| Case | Entrypoint | Observed admission outcome | Evidence |
|---|---|---|---|
| Missing | `start` | Rejected: `provider_serving_receipt_invalid` | R:5–15 |
| Missing | `__worker` | Rejected: `provider_serving_receipt_unverified`; authenticated producer channel disabled | R:16–26 |
| Weak | `start` | Degraded/unverified receipt rejected: `provider_serving_receipt_unverified` | R:27–42 |
| Weak | `__worker` | Same rejection; direct worker invocation provides no bypass | R:43–58 |
| Forged | `start` | Self-declared `confirmed/verified` rejected: `provider_serving_receipt_invalid` | R:59–73 |
| Forged | `__worker` | Self-declared verification rejected: producer channel disabled | R:74–88 |
| Expired | `start` | Unverified receipt rejected; no isolated demonstration of freshness enforcement | R:89–105 |
| Expired | `__worker` | Same rejection; freshness enforcement remains unproven independently | R:106–122 |

All eight attempts report exit code `1`, empty stdout, no fake-provider call, preserved result, and no created jobs. These are supplied negative-control observations, not independently rerun results. The parent harness placed fail-fast fake-provider executables at the front of `PATH`; no real external model/provider ran. It explicitly reports no authenticated positive serving producer (R:124–126). Therefore these controls establish neither successful provider admission nor actual model identity, credentials, connectivity, output quality, or cross-provider independence.

The frozen contract agrees that file-based `provider-serving-receipt/v2` remains degraded/unverified, and that neither `start` nor `__worker` currently activates a provider (P:21, P:33). One reason-code discrepancy remains: the contract specifies `provider_serving_receipt_unavailable` for a missing receipt, while the observed missing cases return `invalid` and `unverified` respectively. The runner/contract owner should reconcile that mismatch without weakening rejection.

Concrete evidence still needed, with responsible next actions:

- **Authenticated host-producer owner:** supply a verifiable host-origin producer channel and fresh evidence resolving the actual host provider and fixed peer provider/model. A file claiming `verified` is insufficient. Independence additionally requires different host and peer providers (P:21).
- **Dispatch/admission owner:** provide the current canonical worker-dispatch journey receipt, explicit delegation authority, independent restricted-read/data-egress/credential-use/external-communication authorizations, exact allowlisted `input_refs`, minimized redacted payload, current source identity, and matching receipt/payload hashes (P:11). The recorded source hash alone does not establish these bindings.
- **Runner owner:** prove that worker scope and receipt freshness bind to the admitted job; deadline and output-byte limits apply; and the complete result schema is validated. Dormant implementation and zero-call controls do not prove those activation guarantees (P:33).
- **Validation owner, after producer and admission evidence exist:** obtain separately authorized positive admission evidence and retain requested/actual provider/model, status, hashes, provenance, limitations, reason codes, and reap outcome (P:37–39). Preserve the negative controls and separately test stale authenticated evidence.

No provider was started, no missing-producer gate was bypassed, and no files were changed during this assessment. The read-only assessment is complete; authenticated positive admission and real provider operation remain unverified.
