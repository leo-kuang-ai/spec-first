CEOPT-29-A2 disposition: **FAIL for A’s ordering and cleanup controls; historical browser positive PASS within its limited scope.** This was a read-only assessment. All executions below were parent-operated; I ran no browser, producer, tests, or mutations.

Evidence references:

- **A-order:** `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave5/browser-order-A-receipt.json`
- **A-cleanup:** `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave5/browser-cleanup-A-receipts.json`
- **Historical:** `docs/validation/ce-skill-optimization-2026-10-29/remaining-trials/browser-policy-successor/`

| Supplied case | Disposition | Evidence and interpretation |
|---|---|---|
| `vitals` before first `open` | **FAIL** | A-order `/input/steps` places `vitals` first, but `/actual_validation/ok` is `true` and validation preserves that order. This contradicts the frozen Skill’s open-first boundary. Actual browser execution was **not-run**; the receipt expressly covers validation only. |
| Injected close exit `0` | **PASS, limited** | A-cleanup `/cases/0`: producer exits `0`, reports `passed`, and retains no diagnostic root. This is compatible with successful cleanup, but the receipt does not expose an independent close-result field. |
| Injected close exit `9` | **FAIL** | A-cleanup `/cases/1`: despite injected close failure, producer exits `0`, reports `passed`, and provides no independent cleanup failure. Successful checks conceal the cleanup blocker. |
| Close-failure diagnostic retention | **FAIL** | A-cleanup `/cases/1/diagnostic_root_retained_by_producer` is `false`; `/retained_json_evidence` is `{}`. Parent archival does not establish producer-retained failure diagnostics. |
| Historical rejection of vitals-first prepare | **PASS, bounded** | Historical `browser-local-receipt.json` `/calls/0` records exit `1`. The detailed rejection receipt was not supplied, so its exact reason is unverified. This historical result does not repair A-order’s acceptance. |
| Historical positive prepare | **PASS** | Historical `browser-local-receipt.json` `/calls/1` records exit `0`. |
| Historical actual-browser positive run | **PASS, limited** | Historical `browser-positive-run.json`: `completed`, null reason, six action subprocess calls. Every supplied step passed: `open`, `vitals`, `get`, `get`, `viewport`, `network-metadata`, indexes `0–5`. |
| Historical browser cleanup | **PASS** | Historical `browser-positive-cleanup.json` reports `completed`, null reason; local receipt `/calls/3` records exit `0`. |
| Historical caller cleanup | **PASS as recorded** | Historical `browser-local-receipt.json` reports server and scratch cleanup `completed`. This is caller activity, not Skill-owned server cleanup. |

For **both** close injections, the fake-browser producer reports all nine supplied conformance cases passed: `initial-open-and-frame`, `same-origin-redirect`, `cross-origin-redirect`, `same-origin-link`, `cross-origin-link`, `cross-origin-form`, `cross-origin-script`, `cross-origin-popup`, and `cross-origin-direct-open` (A-cleanup `/cases/0/stdout/cases` and `/cases/1/stdout/cases`). Positive actions return `0`; prohibited actions return `1` with `ERR_BLOCKED_BY_CLIENT`; blocked-origin counters remain zero. These are **fake-browser fixture outcomes**, not confirmation of actual browser enforcement or crash behavior.

Historical positive evidence came from the **B-produced historical execution**, not an A producer run. Its caller-owned synthetic origin was `http://127.0.0.1:50523`. The six private raw pointers are preserved under `browser-positive-run.json` `/steps/0–5/raw_output_path`; their contents and continued availability were not verified, and the local receipt says scratch cleanup completed.

Remaining facets are **not-run or not established**: A actual-browser execution, actual browser close/crash failure, current probe readiness and identity-bound conformance, real request-time origin enforcement, affected application route mapping, branch identity, application rendering/visual correctness, accessibility, screenshots, console-error attribution, semantic effects and authorization, human-only flows, and full model workflow behavior. No supplied evidence supports promoting those facets to PASS.

A needs evidence that vitals-first validation rejects before execution, and that nonzero close outcomes remain explicit blockers with retained diagnostics. The historical successful run supplies a useful bounded positive control; it cannot substitute for either missing A control.
