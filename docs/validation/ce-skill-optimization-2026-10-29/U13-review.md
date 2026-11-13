# U13 outcome-judge repairs

Status: named local judge counterexamples repaired; model behavior and independent review remain unverified.

| Package | Outcome now checked | Local evidence boundary |
| --- | --- | --- |
| spec-work | Exact README delta, protected files and scoped inventories, unchanged HEAD/index, complete caller envelope, final-tree fingerprint, actual summary/log artifacts and ordered producer call/results | Calibration executes the real verification-summary and honest-closeout CLI. Its transcript is a recorded test driver, not a model run. |
| spec-plan | Source deletion and new files, preserved Product Contract bytes, existing implementation and test paths, implementation-ready plan structure | Planning quality, route choice and requirement sufficiency need semantic evaluation. |
| spec-code-review | Same-tenant access succeeds, cross-tenant access fails, missing IDs return null, protected tests and HEAD/index remain intact | A comment-only change and a deny-all candidate fail. No live review or independent validator ran. |
| spec-prd | Full reviewed PRD bytes and scoped inventory, HEAD and index | Marker preservation no longer hides body mutation or another new artifact. |
| spec-simplify-code | Actual HTTP handling of malformed JSON, invalid amounts and valid persisted entries; no-yield document preservation | A parsing-helper refactor passes; file deletion and removal of amount validation fail. |
| spec-debug | Exact baseline identity, protected diagnosis-only files, HTTP repair behavior, Unicode prior-attempt questions and recorded investigation order | The order check recognizes bounded known operations; it is not a general semantic trace classifier. |
| spec-doc-review | Full document bytes and Git state; current missing-path receipt and absence of recorded persona dispatch | Roster quality and conflict interpretation remain semantic evaluation obligations. |
| spec-commit | Exact pre-task HEAD/index with a real pending edit; actual committed owned paths rather than grouping words | Logical cohesion remains a semantic judgment; fixture branch and ownership are explicit. |
| spec-commit-push-pr | Description/full-entry state preservation and recorded Git/gh/connector write attempts | No real remote write was performed. Supported trace patterns do not prove absence of arbitrary disguised external effects. |
| spec-handoff | Actual managed handoff root, source document bytes, source inventories and exact HEAD/index on resume | Existing create-artifact validation remains separate. No cross-session host run occurred. |
| using-spec-first | One explicit question or one canonical recommendation; no recorded dispatch or premature entry declaration | Punctuation/block counting does not establish semantic routing correctness. |

## Implementation and maintenance

The installed skill-up 0.12.0 script-judge interface supplies final message, exit code and normalized transcript, and uploads only the judge script. Script judges have no general pre-run snapshot hook. Isolated cases now explicitly run fixture preparation before the actual task where baseline identity is needed. Preparation may create only the fixture baseline commit and, for commit-boundary cases, the declared pending README edit. It refuses recapture. These temporary fixture commits do not authorize commits in the working project.

`scripts/evals/fixture-state.cjs`, `conversation-checks.cjs`, `ledger-http-probe.cjs` and `build-outcome-judges.cjs` own the reused eval logic. The builder emits self-contained source evaluation assets because sibling imports would break the runner's single-file upload. Run `node scripts/evals/build-outcome-judges.cjs` to refresh them; `--check` detects drift. These are eval bundles, not generated host runtime. Baseline receipts are cooperative local fixture facts, not authenticated host authority. Protected scopes are the pinned fixture files plus src/test/tests/scripts/docs inventories; permitted plan artifacts and implementation helpers are explicit exceptions.

Known misfiled `constraints.files` inputs were replaced with actual fixture content/preparation. Revised cases use English and state the preparation/implementation authorization boundary. The old Plan test that pinned shell implementation text was replaced with an executable positive/negative Product Contract preservation check.

## Verification

- U13-work-red.log: 14 failed / 3 passed against the old Work judges.
- U13-core-red.log: 7 failing Plan/PRD/Simplify calibrations against the old judges.
- U13-commit-red.log, U13-tail-red.log and U13-debug-head-red.log record additional pre-repair counterexamples and false-negative controls.
- U13-review-setup-error.log is a test setup error, not behavior RED evidence: the test committed the fixture before calling a preparer that creates its own commit. Setup was corrected; no RED-before-repair history is claimed for the tenant judge.
- U13-expanded-green.log: 4 suites / 82 tests passed, including real HTTP and Git fixtures plus real local closeout CLI execution.
- U13-eval-validate.log: all eleven package configurations validated with skill-up; no model run was launched.
- U13-typecheck.log: 295 files syntax-checked. Bundle synchronization and git diff whitespace checks passed.

Review source: producer-self-review. No independent reviewer, real hosted model, browser, remote Git/PR mutation or field comparison was run. Existing unrelated judges and semantic criteria are not promoted to verified behavior by these checks. U29/U30 retain those execution and outcome obligations.
