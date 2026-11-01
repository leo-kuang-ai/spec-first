The supplied receipts support a parent-operated local HTTP preview lifecycle, including token-gated identity, updated content, stop, and restart. They do not establish human experience, a product decision, visual adequacy, production approval, or external-service authorization.

| Recorded case | Evidence-grounded disposition |
| --- | --- |
| Initial start | Exit code `0`; reports `127.0.0.1:59151`, PID `18930`, and the temporary artifact root below. This supports the recorded loopback start. `owner_pid: null` supplies no evidence of parent-process lifetime supervision. |
| Initial content | HTTP `200` serves `Throwaway total12`. Headers include `Cache-Control: no-store`, same-origin CSP, `no-referrer`, and `nosniff`. These are observed HTTP controls, not evidence of browser rendering or human interaction. |
| Unauthenticated identity | HTTP `404` with `Not found`; this request did not disclose identity. |
| Wrong-token identity | HTTP `404` with `Not found`; the supplied wrong token did not gain identity access. |
| Authenticated identity | HTTP `200` reports `running`, matching the initial root and PID `18930`. Together, the three identity cases support token-gated instance identification for these requests. Token secrecy in storage and every possible access path are not independently demonstrated. |
| Reloaded content | HTTP `200` now serves `Throwaway total18`. This demonstrates changed bytes returned by the running server. It does not show a browser refresh or that a person saw the change. |
| First stop | Exit code `0` reports `stopped`. The subsequent HTTP request is unavailable with `URLError`, and status also reports `stopped`; these corroborate loss of HTTP availability after this stop. |
| Restart | Exit code `0` reports the same root, new port `59167`, and new PID `18942`. The receipt records `token_changed: true`. |
| Resumed content | HTTP `200` serves `Throwaway total18`, supporting retention of the changed content across this recorded restart. It does not demonstrate persistent application state, recovery after OS cleanup, or future artifact durability. |
| Final stop and status | Both exit successfully and report `stopped`. No separate post-stop HTTP probe is supplied for this second instance. |
| Repeated stop | Exit code `0` again reports `stopped`, supporting idempotent stop behavior in the recorded stopped state. |

The recorded artifact root is:

`/private/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/ce27-prototype-2kbcooqk/B`

The frozen preview contract requires stop to authenticate the identified instance and request self-closure through loopback, never signal a PID directly. The receipts corroborate shutdown outcomes but do not expose enough internal transport evidence to independently establish that implementation detail. They also do not exercise blocked identity verification, unauthorized stop, rejection of a previous instance’s token after restart, non-loopback host rejection, or IPv6.

Remaining boundaries and limitations:

- Directory ownership, symlink rejection, private permissions, and canonical-path checks before each lifecycle operation are requirements of the frozen references; their execution is not shown here.
- The CSP headers express restrictions on external loads and connections. No browser enforcement or external-resource attempt is recorded.
- Temporary storage offers best-effort retention only. Stopping a preview is not authorization to delete a kept artifact; deletion or preservation checks are not supplied.
- The receipts explicitly describe an actual **parent-controlled** lifecycle and state that no production files, real services, or external resources were used. I performed only assigned-file reads; I did not reproduce the commands.
- No additional synthetic cases or separately named fixture appear in the assigned request or receipt. There is no basis to invent outcomes for them.
- The HTML responses do not establish a bounded product question, comparable options, adequate interaction fidelity, or visual quality. No human observation, choice, or decision capsule is evidenced.

Human decision state remains **unresolved**. A new unattended prototype build without a human available would return `blocked-human-experience-required`; this read-only receipt assessment does not authorize such a build. No `decisions.md` or production write-back is warranted by these receipts. The next owner is the existing related `spec-brainstorm` or `spec-plan` owner, if one exists; otherwise return the unresolved question, artifact path, and limitations to the current product owner.
