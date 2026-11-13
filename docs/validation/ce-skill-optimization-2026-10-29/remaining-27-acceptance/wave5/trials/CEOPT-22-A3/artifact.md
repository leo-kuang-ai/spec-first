Disposition: the supplied parent-operated receipts support a successful loopback preview lifecycle, token-gated identity access, updated content delivery, restart continuity, and repeated stop handling. They do not establish genuine human experience, a product decision, production approval, or external-service authorization.

Evidence source: `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave5/prototype-A-receipts.json`. Record references below use zero-based JSON pointers.

| Receipt reference | Disposition |
| --- | --- |
| `/records/0` | Initial `start` exited 0 and reported `started`, binding `127.0.0.1:59134`, PID `18921`, with the throwaway root ending in `ce27-prototype-2kbcooqk/A`. `owner_pid` was `null`; this alone does not establish parent-process supervision. |
| `/records/1` | `initial-get` returned HTTP 200 with `Throwaway total12`. Headers include `Cache-Control: no-store`, CSP, `no-referrer`, and `nosniff`. This confirms the recorded HTTP response, not browser rendering or human inspection. |
| `/records/2` | `unauthenticated-identity` returned 404, supporting rejection of identity access without authentication. |
| `/records/3` | `wrong-token-identity` returned 404, supporting rejection with the supplied incorrect token. |
| `/records/4` | `authenticated-identity` returned 200 and reported the same root and PID `18921` as the initial start. Together with the preceding negative cases, this supports token-gated identity behavior for the tested requests. |
| `/records/5` | `reload-current-content` returned 200 with `Throwaway total18`, replacing the earlier `total12` response. This supports delivery of changed content within the running preview; it does not prove interactive browser reload behavior. |
| `/records/6` | First `stop` exited 0 and reported `stopped` for the same root. |
| `/records/7` | `after-stop-http` reported `unavailable` with `URLError`, corroborating loss of HTTP availability after the first stop. The error does not independently identify its precise transport cause. |
| `/records/8` | `status` exited 0 and reported `stopped`, consistent with the stop receipt and unavailable HTTP response. |
| `/records/9` | Restart exited 0 and reported the same root at `127.0.0.1:59145`, with new PID `18925`. This supports a new preview instance over the retained root. |
| `/records/10` | `resumed-current-content` returned 200 with `Throwaway total18`. Recorded `old_pid: 18921`, `new_pid: 18925`, and `token_changed: true` support retained content and instance/token renewal. No old-token request against the resumed instance is supplied, so old-token rejection after restart remains unverified. |
| `/records/11` | Second `stop` exited 0 and reported `stopped`. No subsequent HTTP probe is supplied for this instance. |
| `/records/12` | Final `status` exited 0 and reported `stopped`, corroborating the second stop at the command-report level. |
| `/records/13` | Repeated `stop` exited 0 and again reported `stopped`, supporting idempotent handling of an already-stopped root in this case. |

The applicable frozen contract is `.spec-first/workflows/spec-work/spec-first/ce-opt-27-w1-20261030/inputs/A/spec-prototype/SKILL.md`, especially **Boundaries**, **Run-Local Phases**, and **Output**. Its `references/preview.md` specifies canonical root reuse, ownership/symlink checks, loopback binding, private instance tokens, token-bound identity, and server self-close rather than direct PID signaling. The receipts support observed root reuse and loopback operation, but do not independently expose filesystem ownership/mode checks, symlink rejection, token-file privacy, invalid-host rejection, identity-mismatch stop refusal, or the internal stop mechanism. Those facets remain unverified by this packet.

The recorded CSP restricts ordinary assets and connections to the same origin, allows inline scripts/styles and `data:` images, and prohibits objects, framing, and form actions. Its presence is confirmed in the supplied successful responses; browser enforcement and attempted external-load rejection were not tested in the supplied evidence.

The artifact root is `/private/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/ce27-prototype-2kbcooqk/A`. Its content survived the recorded stop/restart interval; temporary-root durability beyond that interval is unverified and remains best effort under `references/preview.md`. The supplied metadata lists source SHA-256 `94442c66dc5fa85ceb6641bd1b644d8a66ab7cac5e741ce0f28f152d5c1162c3`; I did not independently recompute it.

Human decision state: **unresolved; human experience and acceptance are not evidenced**. Under `references/scoping.md` and `references/build.md`, these HTTP controls cannot select a winner or justify a `decisions.md` capsule. An unattended attempt to proceed as a product prototype must return `blocked-human-experience-required`.

Next owner: the parent/current workflow owner retains this lifecycle evidence and any remaining technical verification. The current product owner and intended human participant own the unresolved experience and choice. Only an actual settled human choice can support a decision capsule and handoff to the existing `spec-brainstorm` or `spec-plan` owner.

All execution described above is attributed to the parent-operated receipts. My work was restricted to reading the assigned frozen Skill, its relevant references, request, and receipt file; I performed no mutation, helper execution, test, browser interaction, network request, or delegation.
