The supplied receipts support the web-port selection and the refreshed version B content criteria. Both missing-argument cases failed to finish within the parent’s two-second bound. Keyboard-focus review remains unverified.

| Case | Recorded evidence | Disposition |
|---|---|---|
| `missing-port` | `--port` produced no output and timed out after 2.0027 seconds; `exit_code` is null. | Bounded argument handling is not demonstrated. The parent terminated its owned process; this was not a clean argument rejection. No port was resolved. |
| `missing-type` | `--type` produced no output and timed out after 2.0030 seconds; `exit_code` is null. | Same unresolved failure: no bounded diagnostic or successful resolution. Do not guess a type or substitute a default to proceed. |
| `procfile-web` | With worker port `9200` listed before web port `4300`, the resolver returned `4300`, exit 0, in 0.00835 seconds. | Correct web-line selection for this fixture. `4300` is within 1–65535. This proves discovery only; neither process was started by this helper. |

The two-second helper timeout is separate from the model-trial deadline. These observations establish the failures within that bound, not their underlying implementation cause or eventual behavior.

The page lifecycle must be interpreted by server identity and browser freshness, not origin alone:

- The parent initially served version A with PID `17621` at `http://127.0.0.1:57289/`. Its browser snapshot showed `Total: 12` and a disabled `Add entry` button.
- The parent stopped A and started version B with PID `17647` at the same origin. The recorded HTTP 200 response matched B’s source hash, `77455357199117a2ac6a6189ea13ac30cc2aa1ac078e711ae2fb608190bab96d`, and contained `Total: 18` and a button without the disabled attribute.
- The browser snapshot taken after server replacement but before reload still showed A. That stale document cannot establish B’s state.
- After the parent’s recorded reload, the browser snapshot identified `Ledger fixture B`, showed `Total: 18`, and listed `Add entry` without the disabled state. Together with the HTTP evidence, this supports both supplied B content criteria. It does not establish that clicking the button works.
- Screenshot creation was recorded, but I did not inspect those images. No visual-quality or keyboard-focus conclusion follows from their existence.
- Final cleanup records browser close exit 0 and server termination with exit `-15`. The receipt therefore does not establish a currently running server or open browser.

For the labeled feedback/resume scenario, retain B’s total of 18 and enabled button as the last evidenced state. Keep keyboard focus explicitly **pending verification**: the supplied evidence contains no keyboard navigation, focus-order, focus visibility, or activation checks. There is no basis to call focus defective or fixed.

The feedback is synthetic owner input, not an actual user message or new mutation authorization. This trial authorizes read-only interpretation only: no checkout, source edits, commit, or landing. On a later authorized live continuation, server identity and reachability must first be re-established after cleanup. Automated focus checks belong to `spec-test-browser`, using the verified exact origin and a separate minimal route/action plan. If that capability is unavailable, report the limitation and continue through human inspection without inventing browser activity; capability repair belongs to `spec-runtime-setup`.

Changed paths: none. `commit_status: not-created`; `landing_status: not-performed`. All lifecycle and browser observations above are attributed to parent-operated receipts on a synthetic page, not autonomous execution, actual product feedback, or visual acceptance.
