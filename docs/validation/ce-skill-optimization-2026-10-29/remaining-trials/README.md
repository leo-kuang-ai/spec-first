# Remaining CE acceptance evidence

Overall acceptance remains incomplete. This successor adds 18 independently adjudicated bounded task responses, a 13-suite paired deterministic experiment, and actual browser execution. Together with the [previous 24 responses](../readonly-trials/README.md), seven skills have 42 bounded passing responses: three per arm per scenario. Both arms pass; no causal superiority, cost equivalence, authenticated serving identity or full workflow acceptance is established.

## Native task responses

| Scenario | Skill | Baseline | Candidate | Scope |
|---|---|---|---|---|
| CEOPT-03 | spec-code-review | 3/3 pass | 3/3 pass | Offline tenant-isolation source review, unsupported allegation rejection, case-distinct file identities |
| CEOPT-05 | spec-commit-push-pr | 3/3 pass | 3/3 pass | Description-only PR drafts, exact base, project template and non-closing related issue |
| CEOPT-20 | spec-product-pulse | 3/3 pass | 3/3 pass | Export-backed report, canonical revenue source, zero/timeout/not-run distinction |

The [frozen protocol](protocol-wave3.json) binds 110 files before dispatch. [Trial index](trial-index.json) links complete responses and recorded tool events. The [independent judge](judge-wave3.json) read all 18 responses and traces; 69 calls have matching outputs. Observed actions were local reads. This is recorded compliance, not enforced isolation. Two task attempts and one judge attempt received HTTP 429 and were retried unchanged; timing is not comparable. Optional omissions are preserved in the judge report, not silently converted into defects.

## Deterministic comparison

[Protocol](paired-mechanisms-protocol.json), [results](paired-mechanisms-results.json) and [independent review](paired-mechanisms-review.json) bind the same current test driver to original A and candidate B source snapshots in disposable roots. A: 184 passes / 148 failures. B: 332 passes / zero failures across 13 suites. No suite-load failures or pending cases are hidden.

The evidence includes executable scoring, path-containment, finding-filtering, watch-state, locking and admission counterexamples. It also includes absent new helpers, output contracts, v2/v1 schema incompatibility, seven fixture TypeError cascades and static prose checks. Therefore 148 is a failed-test count, not a defect count or quality-improvement percentage. External providers are mocked; publication uses local bare Git remotes. The source snapshot predates the browser-policy successor below. The review did not independently rerun the tests.

## Actual browser failure and repair

The installed agent-browser 0.34.0 binary passed [exact-origin conformance](browser-probe.json). The [negative plan](browser-reject-vitals-first-prepare.json) was rejected before browser execution. In the [initial real run](browser-positive-run.json), open and vitals passed but title retrieval failed: the generated policy allowed CLI spelling `get`, while the native provider checks protocol action `title`. [Raw failure](browser-private-records/positive/raw/step-003.json) is retained.

The source wrapper now adds only protocol aliases for already-supported operations: `gettext`, `inputvalue`, `title`, `url`, `count`, `viewport`, `requests`, `getbyrole`, `getbylabel`, `getbytestid`, `getbytext`. Default deny remains in force; arbitrary evaluate/upload are not allowed. The exact upstream command mapping was read from agent-browser v0.34.0 `cli/src/commands.rs`; the fetch copy is in the run-local evidence directory. This fixes translation within the existing owner, without adding browser effects or new public operations.

The [independent successor review](browser-policy-review.json) found no actionable defect and preserves the remaining limits: viewport sizing is not device emulation; network raw output includes headers; successful action envelopes alone do not prove origin isolation. The [red regression](browser-policy-red.log) failed on the missing policy names; [focused regression](browser-policy-green.log) passed after repair. The [actual successor run](browser-policy-successor/browser-positive-run.json) passed all six steps: open, vitals, title, URL, mobile viewport, network metadata. [Cleanup](browser-policy-successor/browser-positive-cleanup.json) completed. Caller-owned synthetic servers were stopped and process-owned scratch roots removed after retaining evidence. Historical raw absolute paths are mapped to `browser-private-records/` in the initial directory and `browser-policy-successor/browser-private-records/` for the successor; they are not live recovery paths.

This is real browser evidence for synthetic localhost behavior, not application visual quality or model-controlled full workflow acceptance. Locator/value/count aliases have source and local contract evidence; they are not claimed as live-tested in the six-step successor. Full Xcode/simulator validation remains unavailable: `xcodebuild -version` reports that the active CommandLineTools directory is not full Xcode.

## Current accounting and limitations

[All 34 dispositions](all34-disposition.json) retains every skill and excludes the four explicitly skipped packages. U6 positive authenticated provider admission remains unavailable. Mutation-capable independent workers still lack the required host enforcement receipt. Twenty-seven skills have no model task trials; deterministic fixtures and platform probes do not replace those trials. U29 remains partial and U30 inconclusive. No project commit, push, PR, global install or runtime-mirror mutation occurred.

[Independent remaining-input review](remaining-input-review.json) inspected all 18 assigned scenarios. [Hash-bound input recipes](remaining-input-bindings.json) identify reusable actual files, required new fixture variants and genuine external prerequisites. This is preparation evidence, not executed trials; several tasks are locally feasible and must not be labeled externally blocked. Browser readiness was established by the parent after dispatch; the reviewer correctly leaves that capability unprobed in its own report. Xcode readiness is recorded in [the actual probe](xcode-readiness.json).

The [structured closeout](closeout-envelope.json) remains degraded because required full acceptance is not run. The current plan lifecycle stays unchanged. The browser source successor has 55 passing focused tests and an independent bounded review; five Changelog checks, source integrity, syntax and whitespace also passed. Historical full-suite results are not presented as a full-suite rerun after this successor.
