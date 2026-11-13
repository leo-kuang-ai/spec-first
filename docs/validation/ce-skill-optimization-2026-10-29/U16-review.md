# U16 caller-owned feedback conversation completion

Status: mechanism verified within the local facts below. Independent review, real-host orchestration and remote conversation outcomes remain not-run.

The CE return-to-caller/resume sources carry durable source/reply identity and publication checks, but also allow resolver-owned commits and no-change remote writes. Spec-first adopts the pending-action identity and recovery requirements while preserving zero remote writes in pipeline-return and separate local-fix, commit, landing, reply and resolution authorities.

The resolver now returns one pending action per source, with exact PR host/base/head identity, tool-computed source-body hash, observed discussion/reply identity, code dependency, prepared text and remaining conditions. LFG explicitly consumes these after publication, or independently for no-code replies, through Full Mode's existing reply/readback/resolve protocol. The commit helper returns actual publication facts and does not complete conversations. Existing visible replies skip reposting; unknown outcomes require fresh readback; needs-human stays open. Exact base-repository arguments were added to Full Mode's commands. Truncated conversation reads no longer justify assuming a reply is absent.

A new read-only `inspect-fix-publication.cjs` checks current selected-PR identity and compares the exact fix SHA against the actual head repository. Only ahead/identical with the fix as merge base is verified. It executes GET calls only and preserves refusal/unavailable reasons. It does not enforce caller authority, decide source semantics, authenticate independent verification or perform replies/resolutions. The caller protocol remains a loud prose contract and must be tested in U29.

## Verification

- U16-first-check.log: 5 suites / 62 tests passed for publication facts, existing reply helpers and consumer contracts.
- U16-green.log: a real calibration failure exposed the new offline judge overlooking attempted helper writes without a tool result. It now scans all recorded tool calls, not only completed call/result pairs.
- U16-green-2.log: 6 suites / 92 tests passed, including fork/Enterprise identity, invalid inputs with zero calls, unavailable provider, divergent ancestry, exact GET recorder, missing pending actions, no-code publication false prerequisite and recorded reply/resolve attempts.
- U16-eval-validate.log: four resolver cases validate. The new offline fixture preserves an existing submitted reply and open thread; it is explicitly fixture-only and was calibrated with synthetic driver output, not executed by a model.
- U16-typecheck.log: 300 JavaScript files checked. Bundle drift and whitespace checks passed.

The fake gh tests prove actual local argv/protocol behavior only. No real PR, post-publication model continuation, remote retry or independent reviewer ran. Recorded command-pattern checks are bounded and cannot detect every disguised external effect. Missing reply/resolve authority must remain pending; no such authority was invented in this implementation session. No commits, push, PR or communications occurred.
