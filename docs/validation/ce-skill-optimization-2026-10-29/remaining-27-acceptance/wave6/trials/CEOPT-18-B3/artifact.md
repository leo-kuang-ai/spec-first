**Real-provider admission remains blocked. No supplied file receipt authorizes a provider, and positive authenticated admission is unavailable in this test.** All eight attempts failed before the fake-provider control was called. This establishes recorded negative-path behavior, not successful model execution.

Reference roots:

- `E` = `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/pov-B-receipts.json`
- `P` = `.spec-first/workflows/spec-work/spec-first/ce-opt-27-w1-20261030/inputs/B/spec-pov/references/cross-model-panel.md`

| Case | Entrypoint | Recorded rejection | Finding | Evidence |
|---|---|---|---|---|
| Missing | `start` | `provider_serving_receipt_invalid` | No receipt; admission denied. | `E:5–15` |
| Missing | `__worker` | `provider_serving_receipt_unverified` | Authenticated producer channel disabled; direct invocation grants no admission. | `E:16–26` |
| Weak | `start` | `provider_serving_receipt_unverified` | Explicit `degraded/unverified` receipt cannot authorize execution. | `E:27–42` |
| Weak | `__worker` | `provider_serving_receipt_unverified` | Same producer blocker applies to the internal entrypoint. | `E:43–58` |
| Forged | `start` | `provider_serving_receipt_invalid` | Self-asserted `confirmed/verified` fields supply no authenticated provenance. | `E:59–73` |
| Forged | `__worker` | `provider_serving_receipt_unverified` | Claimed verification cannot bypass the disabled producer channel. | `E:74–88` |
| Expired | `start` | `provider_serving_receipt_unverified` | Receipt is unverified and contains an expired timestamp; this result does **not** isolate freshness validation. | `E:89–105` |
| Expired | `__worker` | `provider_serving_receipt_unverified` | Same unresolved freshness facet and producer blocker. | `E:106–122` |

Every case records exit code `1`, empty stdout, `fake_provider_called: false`, `jobs_created: false`, and `result_preserved: true`. The parent’s fail-fast fake executables are controls; the evidence explicitly says no real external model/provider executed and no authenticated positive serving producer exists (`E:124–126`).

The frozen contract separately specifies `provider_serving_receipt_unavailable` for a missing receipt (`P:21`). The recorded missing-input outcomes differ between entrypoints. That discrepancy remains unresolved; these receipts establish rejection, not uniform canonical reason-code behavior.

Concrete evidence still needed before any future activation:

- **Host/authenticated-producer owner:** a demonstrably authenticated host producer channel and a current producer-issued serving receipt that the consumer verifies through that channel. Editing JSON labels is insufficient (`P:21`).
- **Dispatch/admission owner:** the eligible attempt’s canonical worker-dispatch journey receipt; explicit delegation and applicable restricted-read, data-egress, credential-use, and external-communication authority; exact allowlisted inputs; redaction; current source identity; matching receipt/payload hashes (`P:11`).
- **Runner owner:** evidence binding worker scope and receipt freshness to the admitted job, enforcing deadlines and output caps, and validating the complete result schema through both entrypoints (`P:33`). Neither dormant code nor zero-call controls proves these properties.
- **Future validation owner:** after those prerequisites and appropriate authorization exist, retain actual launch/provider evidence, requested and actual provider/model identities, hashes, status, limitations, and reap outcome. Independence additionally requires different host/peer providers (`P:21,37–39`).

For now, retain the in-process fallback and keep provider admission deferred. No provider, helper, test, network operation, mutation, or delegation was performed in this assessment; only the assigned frozen files were read.
