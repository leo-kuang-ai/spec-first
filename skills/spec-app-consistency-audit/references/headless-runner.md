# Headless Runner And Artifact Lifecycle

Deferred operational detail for `spec-app-consistency-audit`. `SKILL.md` keeps the
trigger surface, mode contract, execution skeleton, and output/evidence contracts;
this reference carries the deterministic runner internals and artifact-lifecycle
rules that downstream LLM/Report-Writer steps and maintainers read on demand.

Source of truth for runner behavior remains `scripts/run-audit.js` and the
`tests/unit/spec-app-consistency-audit-*.test.js` suite; this prose documents intent.

## Artifact Lifecycle Detail

`latest-summary.json` is only a pointer to the latest complete/degraded run.
Consumers must validate `head_sha`, `diff_hash`, `worktree_fingerprint`, and
`audit_verdict_scope` against `metadata.json` before treating any run artifact as
current evidence.

`metadata.json` starts with `status: started`. The headless runner finalizes the run
to `complete`, `degraded`, or `failed` via `finalizeMetadata` in
`build-run-metadata.js` after `merge-contracts:report` succeeds (or in the catch path
before the failed envelope is rendered). Finalize never inspects business issue
severity; `degraded` is derived from `audit-report.json#scope_and_degraded_modes`,
`failed` is derived from the runner's reason code, and `complete` is the default
success path. Do not mark metadata complete in early scope/preflight steps.

`audit-report.json` and `issues.json` carry an `issue_synthesis_status` enum:

- `not_run`: the runner produced the static contract chain but no LLM/human audit has
  supplied semantic issues yet. The headless envelope reports `Verdict: Awaiting LLM
  audit` and an `Awaiting LLM audit` line; the runner does not invent issues.
- `llm_provided`: a downstream LLM step staged raw issues at
  `<run-dir>/input/raw-issues.json` (or via `--raw-issues <path>`) before invoking the
  runner. The caller must pass `--issue-synthesis-status llm_provided`; the runner
  refuses to forward this value when no input is staged
  (`issue_synthesis_status_without_input`).
- `fixture_provided`: tests/fixtures stage raw issues with the same contract; the
  caller passes `--issue-synthesis-status fixture_provided`.

`validate-artifacts.js` enforces the enum on both artifacts and rejects
missing/out-of-range values with `issue_synthesis_status_required` /
`invalid_issue_synthesis_status`.

## Headless Runner Internals

`scripts/run-audit.js` is the deterministic entrypoint for the static artifact chain.
It is a subprocess orchestrator only — it never invents issues, never calls an LLM, and
never fetches remote Figma/PRD assets.

v1 commitment: the runner accepts `mode:headless` only. Passing `mode:default` or
`mode:report-only` returns a `mode_unsupported` failed envelope. `mode:headless`
requires `base:<git-ref>`; missing it returns `scope_headless_missing_base`.
Runner-owned fail-fast paths are: `mode_unsupported`, `scope_headless_missing_base`,
`raw_issues_value_missing` (a flag value check), `issue_synthesis_status_without_input`
(refusing to forward `llm_provided`/`fixture_provided` when no raw issues are staged),
and `issue_synthesis_status_required_with_input` (refusing to silently default
`not_run` when raw issues are actually present). Every downstream subprocess that emits
its own headless failure envelope (e.g. `build-run-metadata`, `build-impact-facts`) is
propagated verbatim, preserving the upstream `Reason code:`.

Pipeline order. The subprocess sequence below is the source contract for the runner;
the in-process steps `12` and `14` are runner-only wrappers:

1. `build-run-metadata.js` → `metadata.json` (`status: started`)
2. `preflight.js` → `preflight.json`
3. `build-impact-facts.js` → `impact-facts.json`
4. `extract-prd-contract` / `extract-figma-contract` / `extract-code-contract` →
   product/figma/codebase contracts
5. `extract-page-routes` (depends on the three above) → `page-route-contract.json`
6. `extract-kmp-architecture` / `extract-engineering-quality` / `extract-components` /
   `extract-modules` / `extract-analytics` / `extract-i18n`
7. `build-industry-profile.js` → `industry-profile.preview.json`
8. `select-rule-packs.js` → `industry-rule-pack-selection.json`
9. `merge-contracts.js` (Form 1, all 12 contracts) → `merged-context.json`
10. `merge-contracts.js` (Form 2, `--issues-artifact --issue <raw> from:code-review
    run-id:<id>`) → `issues.json`
11. `merge-contracts.js` (Form 3, `--source --run-dir run-id:<id> --artifacts
    page-route,engineering-quality --issue issues.json`) → `audit-report.json`
12. `finalizeMetadata` (in-process) — promote `metadata.json` from `started` to
    `complete` or `degraded` based on `audit-report.json#scope_and_degraded_modes`.
13. `build-audit-context.js` → `app-audit-context.json`
14. `buildLatestSummary` (in-process) → `latest-summary.json`
15. `build-artifact-manifest.js` → `artifact-manifest.json`
16. `render-headless-envelope.js` → `headless-envelope.txt`

If the caller has not staged raw LLM issues at `<run-dir>/input/raw-issues.json` (or
supplied `--raw-issues <path>`), the runner writes `{ issues: [], rejected_issues: [] }`
and forces `issue_synthesis_status` to `not_run`; in that auto-stub path the runner
drops `--issue-synthesis-status` from the merge-contracts forwarding so an accidental
`llm_provided`/`fixture_provided` flag cannot reach an empty-issue artifact.

On any subprocess exit ≠ 0 after `metadata.json` has been written, the runner finalizes
it to `status: failed` (best-effort) and emits a single failure envelope at the
configured output path. Failures during `build-run-metadata` itself leave
`metadata.json` absent or stuck at `started`; the failure envelope still reaches stdout
/ `--output`.
