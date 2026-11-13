CEOPT-30-B1: **Actual readiness FAIL; synthetic navigation assertion FAIL.** These are separate findings; neither proves an actual app build or simulator test.

Evidence root: `docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/`.

| Case | Finding | Exact evidence |
|---|---|---|
| Actual readiness | Supplied `xcodebuild -version` record exited **1**: active developer directory is `/Library/Developer/CommandLineTools`, while the tool requires Xcode. This is a readiness failure, **not a failed app build**. | `xcode-readiness.json:2–9` |
| Actual build/install/test/navigation | Build explicitly unattempted. Install, launch, screen testing and navigation have no supplied execution evidence and remain **Skip / not verified**. No actual app, scheme, simulator or callable MCP tool is bound. | `xcode-readiness.json:9–10` |
| Synthetic tap control | Tap receipt reports success for `Settings`, but the supplied after-state remains `Entries`, `Total: 12`. The requested “Settings screen is visible” assertion therefore **fails within the synthetic control**. No successful navigation is established. | `xcode-tap-fixture.json:8–20` |
| Synthetic identity | `invalid.fixture.ledger` / `LedgerFixture` are fixture identities from fixture build settings; they identify no actual tested target and prove no build/install/test capability. | `xcode-tap-fixture.json:2–6,21` |

The frozen B skill requires stopping dependent testing when readiness fails (`inputs/B/spec-test-xcode/references/setup-and-build.md:7–9`, under `.spec-first/workflows/spec-work/spec-first/ce-opt-27-w1-20261030/`). It also requires inspecting the resulting state rather than treating a successful tap as navigation evidence (`references/test-and-report.md:7–11`). An observed readiness or assertion failure remains Fail until a completed passing retest replaces it (`references/test-and-report.md:23,42`).

Evidence authority is **transcribed supplied records**, not provider-confirmed execution in this assessment. Actual source revision, dirty-tree fingerprint, pre/post-build comparison, timestamps, build artifacts, screenshots and runtime logs are unavailable; **source-bound** cannot be claimed. The readiness stderr is a tooling diagnostic, not an app console error. No completed human verification is supplied.

Remaining owners/actions:

- **Environment owner:** separately authorize and restore full Xcode/toolchain readiness and connected XcodeBuildMCP capability; obtain a successful readiness probe before dependent work.
- **Test owner:** bind the real project, scheme, simulator, artifact-derived bundle ID and source identity; then perform build/install/launch and collect screen/log evidence plus final source comparison.
- **App/test owner:** retain the synthetic failed assertion; reproduce against the real bound target and inspect post-action state/logs. A passing retest is required to replace failure; the fixture does not establish its cause.

Assessment used file reads only. No setup changes, app/simulator operations, MCP calls or retests were performed.
