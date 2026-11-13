The assigned receipts support a **parent-operated local HTTP lifecycle**: start, serve updated content, stop, restart with a new instance, and stop again. They do **not** establish human experience, a product decision, production approval, or authorization to contact external services. I only read the assigned frozen Skill, its relevant references, and the named request and receipts; I did not execute the recorded commands.

Evidence source: `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave5/prototype-A-receipts.json`.

| Recorded case | Evidence-grounded disposition |
|---|---|
| Initial `start` | Exit 0 reports a temporary-root preview at `127.0.0.1:59134`, PID `18921`. This supports the recorded loopback start; it does not independently establish directory ownership, symlink checks, or prior permission. |
| `initial-get` | HTTP 200 returns `Throwaway total12`. This confirms the recorded response body, not browser rendering or interactive behavior. |
| `unauthenticated-identity` | HTTP 404 with `Not found` supports rejection of this unauthenticated identity request. |
| `wrong-token-identity` | HTTP 404 supports rejection of this incorrect token. Neither negative case proves exhaustive resistance to unauthorized requests. |
| `authenticated-identity` | HTTP 200 reports `running` with the same root and PID `18921`. Together with the two negative cases, this supports token-gated identity for the tested instance. The secret itself is absent from the supplied output. |
| `reload-current-content` | HTTP 200 returns `Throwaway total18` instead of `total12`, supporting fresh content delivery after an update. It does not prove browser reload behavior, application state transitions, or a human-observed adjustment. |
| First `stop` | Exit 0 reports `stopped` for the assigned root. |
| `after-stop-http` | `unavailable` / `URLError` corroborates loss of HTTP availability after that stop. The generic error does not identify its underlying cause by itself. |
| First stopped `status` | Exit 0 reports `stopped`, consistent with the first stop and unavailable HTTP response. |
| Second `start` | Exit 0 reports the same root at `127.0.0.1:59145`, now PID `18925`. This supports a new preview instance over the retained root. |
| `resumed-current-content` | HTTP 200 still returns `Throwaway total18`; the record explicitly reports changed PID and `token_changed: true`. This supports content retention across this restart and reported token rotation. It does not demonstrate rejection of the previous instance’s token against the new server. |
| Second `stop` | Exit 0 reports `stopped` for the resumed instance’s root. |
| Second stopped `status` | Exit 0 reports `stopped`, corroborating the second cleanup report. There is no second post-stop HTTP probe in these receipts. |
| Repeated `stop` | Exit 0 again reports `stopped`, supporting an idempotent stopped-state response for this sequence. |

The successful HTML and identity responses include `Cache-Control: no-store`, a CSP restricted to same-origin assets/connections with the specified inline/data allowances, `Referrer-Policy: no-referrer`, and `X-Content-Type-Options: nosniff`. These are observed **HTTP controls**. The receipts do not show browser enforcement, attempted external-resource blocking, rendered quality, accessibility, interaction fidelity, or actual human use. CSP also does not grant external-service authorization.

The frozen `references/preview.md` specifies token-bound loopback identity and cooperative server shutdown, explicitly prohibiting direct PID signaling. These receipts are consistent with that intended lifecycle, but cannot prove the internal shutdown mechanism or complete PID/root/script/instance validation. Missing lifecycle facets include mismatched or stale identity, PID reuse, blocked-stop handling, unsafe roots, non-loopback rejection, IPv6 operation, owner-process exit, and old-token rejection after restart. `owner_pid: null` provides no evidence of owner-linked cleanup.

The recorded artifact root is:

`/private/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/ce27-prototype-2kbcooqk/A`

Its availability now is unverified. A successful restart during this short sequence does not establish durable retention; the frozen preview reference describes temporary storage as best effort and requires preserving kept artifacts during normal cleanup.

The supplied limitations explicitly state: “Actual parent-controlled loopback lifecycle; no human-experience acceptance or user approval.” They also state that no production files, real services, or external resources were used. There are no separately identified synthetic cases or separately named fixture in the supplied request/receipt, so no additional case coverage can be inferred.

**Human decision state: unresolved.** No bounded product question, comparative options, human observation, selected direction, rejected alternatives, or agreed adjustments are evidenced. Consequently, there is no basis to create or treat `decisions.md` as settled, apply a direction, or claim a production outcome. An unattended attempt to perform the actual prototype experience remains `blocked-human-experience-required`; this read-only receipt assessment is not that experience. The next owner remains the current product owner, with unresolved evidence returned to the directly related `spec-brainstorm` or `spec-plan` owner if one exists. No owning plan was supplied here.
