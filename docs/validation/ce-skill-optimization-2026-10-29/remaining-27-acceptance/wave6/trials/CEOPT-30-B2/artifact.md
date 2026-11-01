**Actual readiness: FAIL.** The supplied `xcode-readiness.json` records `xcodebuild -version` exiting **1**: the active developer directory is `/Library/Developer/CommandLineTools`, and the command requires Xcode.

- **Build:** not attempted (`actual_build_attempted: false`); this is a readiness failure, not a failed app build.
- **Install, launch, screen tests and navigation:** not run or established.
- **Capability/target limits:** no app, scheme, simulator or callable MCP tool is bound (`limitation`). No successful MCP readiness probe is evidenced.
- **Source binding:** unavailable; no actual target identity, revision, working-tree fingerprint or final comparison is supplied.
- **Evidence authority:** supplied/transcribed process output, without an independently verified process receipt.

**Synthetic control: FAIL for the requested assertion.** In `xcode-tap-fixture.json`, `tap_receipt.success` is `true` for `Settings`, but both `before` and `after` show `Entries` / `Total: 12`. The assertion “Settings screen is visible” therefore fails within the fixture. The receipt establishes no successful navigation. No subsequent passing retest is supplied.

The fixture explicitly identifies itself as synthetic (`evidence_type`). Its `invalid.fixture.ledger` bundle ID and `LedgerFixture` scheme come from fixture build settings (`app_identity`); they establish no actual built, installed or tested application. The fixture provides no runtime logs, gesture-cause diagnosis or source binding.

**Responsible next actions:** The environment/provider owner must resolve actual Xcode readiness and establish a callable XcodeBuildMCP provider through separately authorized setup. The test owner must then obtain a successful readiness probe, bind the actual target/source, and collect build, install, launch, screen and log evidence. For the synthetic case, retain the failed assertion; an actual test owner must reproduce and observe the resulting screen before making any real navigation claim.

**Exact references** — evidence directory:  
`docs/validation/ce-skill-optimization-2026-10-29/remaining-27-acceptance/wave6/`

- `CEOPT-30-request.txt`: actual-first assessment and synthetic separation.
- `xcode-readiness.json`: `command`, `exit_code`, `stderr`, `actual_build_attempted`, `limitation`.
- `xcode-tap-fixture.json`: `evidence_type`, `app_identity`, `before`, `tap_receipt`, `after`, `requested_assertion`, `constraints`.

Applied frozen guidance under `.spec-first/workflows/spec-work/spec-first/ce-opt-27-w1-20261030/inputs/B/spec-test-xcode/`: `SKILL.md` → **Evidence Boundary**; `references/setup-and-build.md` → **Verify Readiness**; `references/test-and-report.md` → **Exercise The Scoped Screens**, **Handle Failures**, **Summary**.

Only assigned files were read; no execution or mutation was performed beyond those reads.
