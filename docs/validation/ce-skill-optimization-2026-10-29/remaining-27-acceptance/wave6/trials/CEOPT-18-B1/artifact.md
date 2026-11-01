**Hold — no supplied file receipt authorizes a real provider launch.** All eight recorded attempts fail closed. Positive authenticated admission is unavailable in this evidence set; real provider behavior remains untested.

Evidence: `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/pov-B-receipts.json` (abbreviated `R` below).

| Case | Entrypoint | Observed rejection | Exact reference |
|---|---|---|---|
| missing | `start` | `provider_serving_receipt_invalid` | `R: $.cases[0]` |
| missing | `__worker` | `provider_serving_receipt_unverified (authenticated producer channel disabled)` | `R: $.cases[1]` |
| weak | `start` | Same unverified/channel-disabled rejection | `R: $.cases[2]` |
| weak | `__worker` | Same unverified/channel-disabled rejection | `R: $.cases[3]` |
| forged | `start` | `provider_serving_receipt_invalid` | `R: $.cases[4]` |
| forged | `__worker` | Unverified/channel-disabled rejection | `R: $.cases[5]` |
| expired | `start` | Unverified/channel-disabled rejection | `R: $.cases[6]` |
| expired | `__worker` | Unverified/channel-disabled rejection | `R: $.cases[7]` |

Every case records exit code `1`, empty stdout, `fake_provider_called: false`, `jobs_created: false`, and `result_preserved: true`. The forged receipt’s claimed `confirmed/verified` fields grant no authority. The expired cases demonstrate rejection, but their channel-disabled errors do **not** independently establish expiry validation.

These are parent-harness fake-provider controls: fail-fast executables were placed at the front of `PATH`. Their zero-call results support the recorded negative admission behavior, not successful model execution, actual provider isolation, or authenticated positive admission. `R: $.limitations[0–1]` explicitly says no real external provider ran and no authenticated positive serving producer exists in this test.

The governing frozen reference is `.spec-first/workflows/spec-work/spec-first/ce-opt-27-w1-20261030/inputs/B/spec-pov/references/cross-model-panel.md`, sections **Admission and approach set** and **Independent round**. It treats file-based `provider-serving-receipt/v2` as degraded/unverified, requires an authenticated host producer channel, and prohibits direct-worker admission shortcuts. Its canonical missing-receipt wording is `provider_serving_receipt_unavailable`; the recorded missing `start` attempt instead reports `invalid`. That discrepancy remains unresolved without permitted implementation evidence.

Before reconsidering activation, the responsible owners need:

- **Host producer owner:** authenticated, independently verifiable serving evidence identifying the actual host provider/model, current source identity and freshness, with matching receipt/payload hashes. Self-declared JSON verification is insufficient.
- **Admission/authorization owner:** a current canonical worker-dispatch journey receipt plus explicit restricted-read, data-egress, credential-use and external-communication authority; fixed recipient, exact allowlisted input references and minimized/redacted payload.
- **Runner owner:** evidence binding worker scope and receipt freshness to the admitted job, enforcing deadlines and output byte caps, and validating the complete result schema. The frozen reference explicitly says dormant code and local zero-call tests do not establish this activation contract.
- **Verification owner:** after those prerequisites and separate launch authorization exist, collect a controlled positive admission result and actual requested/served provider/model evidence. This assessment authorizes no such launch.

Attribution: bounded serial reading of the assigned frozen B Skill, its references, the named request and receipts only. No independent scouts, execution tests, provider calls, mutation or bypass occurred. Real serving, positive authentication, freshness enforcement and full activation remain unverified.
