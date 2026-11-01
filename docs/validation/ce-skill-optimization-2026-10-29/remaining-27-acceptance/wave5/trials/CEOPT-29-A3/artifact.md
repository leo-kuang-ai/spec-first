Disposition: **FAIL for the supplied A controls; historical browser execution passes only its recorded steps.** This trial performed file reads only. All execution evidence was supplied by the parent; no browser, test, script, or network execution occurred here.

Evidence references below use:
- `W5` = `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave5`
- `H` = `docs/validation/ce-skill-optimization-2026-10-29/remaining-trials/browser-policy-successor`

| Supplied case | Disposition | Evidence and implication |
|---|---|---|
| A: `vitals` before `open` | **FAIL** | `W5/browser-order-A-receipt.json#/input/steps` places `vitals` first; `/actual_validation/ok` is `true`, preserving that ordering. Validation accepted a page observation before navigation, violating the frozen Skill’s open-first boundary. Browser execution was **not-run**, as `/limitation` explicitly states. |
| A: injected close exit `0` | **PASS, bounded** | `W5/browser-cleanup-A-receipts.json#/cases/0`: producer exits `0`, conformance reports `passed`, positive control passes, and prohibited-origin hits are zero. This is a fake-browser producer control, not actual browser enforcement. Cleanup success is consistent with the injected exit; the supplied output does not expose a separate cleanup result. |
| A: injected close exit `9` | **FAIL** | Same file, `/cases/1`: despite injected cleanup failure, producer exits `0` and reports `passed`. No separate cleanup failure is preserved. `/diagnostic_root_retained_by_producer` is `false` and `/retained_json_evidence` is `{}`. Passed action controls conceal the cleanup failure and its diagnostics. |
| Historical vitals-first rejection | **PASS, limited receipt evidence** | `H/browser-local-receipt.json#/calls/0` records `reject-vitals-first-prepare`, exit `1`. Its referenced detailed rejection JSON was not supplied for this trial, so the precise rejection reason cannot be independently established here. |
| Historical positive prepare | **PASS, receipt level** | Same file, `/calls/1` records exit `0`. Detailed prepare/probe evidence is outside the supplied set. |
| Historical actual-browser positive run | **PASS for six recorded steps** | `H/browser-positive-run.json`: `status=completed`, `reason_code=null`, `action_process_calls=6`; indexes `0–5`—`open`, `vitals`, `get`, `get`, `viewport`, `network-metadata`—all pass with exit `0`. |
| Historical browser cleanup | **PASS** | `H/browser-positive-cleanup.json` reports `completed`, `reason_code=null`; `H/browser-local-receipt.json#/calls/3` records exit `0`. Server and scratch cleanup are separately recorded as completed. |

For **both** A fake-browser cleanup cases, all nine named conformance cases report passed: initial-open-and-frame, same-origin redirect, cross-origin redirect, same-origin link, cross-origin link, cross-origin form, cross-origin script, cross-origin popup, and cross-origin direct-open. The negative cases record `ERR_BLOCKED_BY_CLIENT`, with zero prohibited-origin hits. These simulated results do not establish real request-time enforcement or a real browser crash.

Diagnostic retention is inadequate for A’s close9 failure: the parent archived the receipt, but the producer retained neither a diagnostic root nor JSON diagnostics. For the historical positive run, each step records a private raw-output path under `/private/var/folders/.../ce-browser-aa03q1q6/positive/raw/step-00N.json`. Those are receipt pointers, not verified currently accessible files; scratch cleanup is recorded as completed.

The shared positive evidence is **historical B-produced execution**, parent-supplied for comparison. It is not an A producer run and cannot repair A’s ordering or cleanup defects. Its origin is the recorded caller-owned synthetic loopback page, `http://127.0.0.1:50523`; it proves neither application branch identity nor application-wide correctness.

Remaining facets are **not-run or unestablished**: fresh A actual-browser execution; detailed probe, executable-identity and complete real-browser conformance evidence; corrected ordering rejection; close9 diagnostic preservation; affected application-route coverage; screenshots and visual quality; attributable console-error checks; accessibility and substantive content assertions; synthetic interactions and durable-effect authorization; OAuth/email/payment/SMS or other human-only flows; and a complete model workflow. No absent facet should be counted as passed.
