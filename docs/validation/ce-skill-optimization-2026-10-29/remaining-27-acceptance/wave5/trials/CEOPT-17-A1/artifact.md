The supplied receipts establish successful web-port selection and refreshed version B DOM criteria. Both missing-argument cases exceeded the parent’s 2-second bound. Keyboard-focus work remains unverified.

| Case | Recorded evidence | Disposition |
|---|---|---|
| `missing-port` | `--port` alone; timeout after 2.0027 seconds; no stdout/stderr; `exit_code: null`; parent terminated the owned process | No bounded argument-error response was demonstrated. The parent timeout contained execution; it does not establish graceful helper termination or an infinite loop. |
| `missing-type` | `--type` alone; timeout after 2.0030 seconds; no stdout/stderr; `exit_code: null`; parent terminated the owned process | Same unresolved missing-value handling. The process timeout is separate from the model-trial deadline. |
| `procfile-web` | Worker appears first with port `9200`; web specifies `4300`; helper returned `4300`, exit `0`, in approximately 0.0083 seconds | Correct web-port selection for this fixture. Neither command was started by that helper; port discovery alone establishes no server readiness. |

The frozen port reference explicitly selects the Procfile web line. A discovered port must still be an integer within `1–65535`; `4300` satisfies that bound. This evidence does not cover other malformed arguments or port ranges.

The page lifecycle is actual **parent-operated local execution against synthetic HTML**, distinct from the separately labeled synthetic owner feedback:

- The parent started version A as PID `17621` at `http://127.0.0.1:57289/`. Its browser snapshot showed `Total: 12` and disabled `Add entry`.
- The parent stopped A and started version B as PID `17647` at the same origin. The HTTP response was `200`, and its recorded source hash matched version B: `77455357199117a2ac6a6189ea13ac30cc2aa1ac078e711ae2fb608190bab96d`.
- A snapshot taken after replacement still showed A. Same-origin server replacement therefore did not make the existing browser document current.
- Following the parent’s recorded reload, the snapshot identified version B, showed `Total: 18`, and listed `Add entry` without the disabled state. Together with B’s HTTP body, this supports the two requested DOM-state criteria for that recorded run. It does not demonstrate button activation behavior.
- The earlier A observation is not acceptance evidence for B. The post-reload B observation is the applicable browser evidence.

For the feedback/resume continuation, retain `Total: 18` and the enabled button as the established recorded state. Keep **keyboard focus: pending verification**. No supplied receipt demonstrates Tab traversal, focus order, visible focus, keyboard activation, or absence of a focus trap. Screenshot-save records establish that the parent saved files; I did not inspect those images and make no visual-quality or focus-fix claim.

The feedback is explicitly synthetic, not an actual user message or additional mutation authority. This trial authorizes read-only interpretation only: branch mutation, local fixes, commit, and landing are not authorized. No source changes or commands recorded inside the receipts were executed by this worker.

For a subsequent authorized browser check, `spec-polish` should hand the bounded keyboard-focus action plan to `spec-test-browser` with a newly verified exact loopback origin. The recorded origin preserves `http`, `127.0.0.1`, and port `57289`, but it is historical: final cleanup closed the parent browser successfully and terminated the server. A currently running server cannot be inferred. Resumption requires renewed instance attribution and reachability, followed by a current browser observation. If browser capability remains unavailable, retain the pending focus work and use attributed receipts or human inspection without inventing interactions.

Changed paths: none. `commit_status: not-created` (`commit_authorization_missing`). `landing_status: not-created` (`landing_authorization_missing`). No product UI, actual user feedback, Figma comparison, autonomous browser inspection, or completed keyboard-focus fix is established.
