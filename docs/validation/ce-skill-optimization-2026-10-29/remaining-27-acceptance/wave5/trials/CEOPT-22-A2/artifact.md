Disposition: the supplied receipts support a successful parent-operated loopback preview lifecycle, including token-gated identity, updated content, stop, restart, and repeated stop. Human experience, product acceptance, and production readiness remain unresolved.

Evidence references below use zero-based `records[n]` in `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave5/prototype-A-receipts.json`. I only read the assigned frozen Skill, its `references/preview.md`, the request, and the receipts; I executed no lifecycle operations.

| Receipt | Evidence-grounded disposition |
| --- | --- |
| `records[0]`, initial `start` | Exit `0`; reports root `/private/var/folders/0v/f_smd31500113ppkqs66c9yr0000gn/T/ce27-prototype-2kbcooqk/A`, explicit loopback host `127.0.0.1`, port `59134`, PID `18921`, and `owner_pid:null`. This establishes the recorded start, without proving directory ownership or an owner-process lifetime binding. |
| `records[1]`, `initial-get` | HTTP `200` serves `Throwaway total12`. Recorded headers include `no-store`, CSP, `no-referrer`, and `nosniff`. CSP restricts assets and connections to the declared same-origin allowances, while permitting inline scripts/styles and data images. This is HTTP evidence, not browser rendering or human experience. |
| `records[2]`, `unauthenticated-identity` | HTTP `404`, `Not found`: the recorded identity request without authentication did not disclose identity. |
| `records[3]`, `wrong-token-identity` | HTTP `404`, `Not found`: the recorded wrong-token request was rejected. |
| `records[4]`, `authenticated-identity` | HTTP `200`; identity returns the same root and PID `18921`. Together with `[2]` and `[3]`, this supports token-gated identity for the tested instance. |
| `records[5]`, `reload-current-content` | HTTP `200` now serves `Throwaway total18`, with `no-store` and the same protective headers. This supports retrieval of changed content during the run; it does not establish automatic browser refresh. |
| `records[6]`, first `stop` | Exit `0`; reports `stopped` for the same root. The response alone does not expose the internal stop mechanism. |
| `records[7]`, `after-stop-http` | HTTP unavailable with `URLError`, corroborating that the tested endpoint became unavailable after stop. |
| `records[8]`, stopped `status` | Exit `0`; reports `stopped`, consistent with `[6]` and `[7]`. |
| `records[9]`, restart | Exit `0`; restarts the same root on `127.0.0.1:59145`, with new PID `18925` and `owner_pid:null`. |
| `records[10]`, `resumed-current-content` | HTTP `200` serves `Throwaway total18`; the receipt records old PID `18921`, new PID `18925`, and `token_changed:true`. This supports retained current content and recorded instance-token rotation. It does not test rejection of the previous token against the restarted instance. |
| `records[11]`, second `stop` | Exit `0`; reports `stopped` for the resumed run. No separate post-stop HTTP probe is supplied for this instance. |
| `records[12]`, final `status` | Exit `0`; reports `stopped`, corroborating the second stop at the status-report level. |
| `records[13]`, repeated `stop` | Exit `0`; again reports `stopped`, supporting idempotent stop behavior in the already-stopped case. |

The governing frozen source is `.spec-first/workflows/spec-work/spec-first/ce-opt-27-w1-20261030/inputs/A/spec-prototype/SKILL.md`, especially **Boundaries**, **Run-Local Phases**, and **Output**. Its `references/preview.md` requires canonical-root reuse, ownership and symlink checks before lifecycle operations, owner-private tokens, token-bound identity, and self-closing stop without direct PID signaling. The receipts consistently identify one root, but do not independently establish those filesystem checks, token-file permissions, script identity checks, or the absence of direct signals. They also do not exercise invalid hosts, mismatched identity, blocked stop, stale-token rejection after restart, or owner-exit cleanup. These facets remain unverified rather than failed.

The two source texts describe stop differently: the Skill summarizes identity-checked signaling, whereas `references/preview.md` explicitly requires server self-close and forbids direct PID signaling. The receipts cannot resolve that wording discrepancy or identify the implementation used. The source owner should reconcile it; no broader process signal is justified by this evidence.

The artifact root is temporary storage with best-effort survival, as stated in `references/preview.md`; no durable retention or visual/behavioral adequacy is established. The receipt limitations explicitly attribute execution to the parent and exclude human acceptance, production files, real services, and external resources. A local HTTP `200` does not authorize external services or establish product approval.

Human decision state: **unresolved**. No human experience or choice is supplied, so there is no basis to select a winner, write `decisions.md`, or apply production changes. The next owner is the current product/prototype owner, who must arrange genuine human experience of the bounded question. After an actual choice, the existing `spec-brainstorm` or directly related `spec-plan` owner receives the decision handoff. The parent validation owner retains responsibility for any additional lifecycle evidence.
