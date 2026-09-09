---
name: spec-test-xcode
description: "Build and test iOS apps on simulator using XcodeBuildMCP. Use after iOS changes or to verify app behavior and crashes; return observed build, screen, log, and human-check evidence."
argument-hint: "[scheme name or 'current' to use default]"
disable-model-invocation: true
---

# Xcode Test

Build, install, launch, and exercise the selected iOS app. Return a bounded PASS, FAIL, or PARTIAL result with screenshots, logs, source binding, and limitations.

This skill is user-invoked only. Static Swift review is not simulator testing. A testing request does not authorize installing tools, source edits, commits, pushes, or PRs. Use existing authorization for an accepted fix; otherwise report the proposed change.

## Required Reads

- Before readiness checks, project/scheme selection, simulator boot, build, install, or launch, read [Setup and build](references/setup-and-build.md). Stop if the provider or app cannot reach the required ready state.
- Before screen interaction, human verification, failure handling, summary, or cleanup, read [Test and report](references/test-and-report.md). Preserve observed failures until a completed passing retest replaces them.

## Evidence Boundary

Before the first build, record project/workspace path, scheme, simulator identity, and the best available source identity. Include Git revision and dirty-state/fingerprint context. Non-Git targets or unavailable fingerprints remain explicit source-binding limitations. Refresh that identity before rebuilding after source changes.

MCP readiness proves only the provider probe responded; it does not prove build, install, launch, or any rendered screen. Report those observations separately. Use `provider-confirmed` only for actual tool calls with returned results. Human observations and caller-supplied output remain `transcribed` unless backed by a verifiable provider/process receipt.

After the final build/retest and all final tested actions, recapture the revision and working-tree fingerprint using the same method as the latest pre-build identity. Mark `source-bound` only when the comparison matches. A mismatch or unavailable recapture forbids `source-bound` and makes the result PARTIAL/degraded unless an observed failure already requires FAIL. Rebuild/retest against the new identity when final-tree evidence is required. Revision alone cannot bind a dirty working tree.

PARTIAL must list its limitations and must not become PASS. Return bounded provider evidence to the caller; do not create a parallel `EVIDENCE.md` or shared evidence artifact. The caller may cite results in its run summary only with a real canonical command identity plus provider, target, source binding, freshness, and limitations. Otherwise retain them outside `verification-run-summary.v1` as provider evidence with a narrower claim.

## URL Effect Boundary

`xcrun simctl openurl <device> <URL>` is an effect-bearing fallback, not an automatic tap substitute. Parse the exact target before execution: reject `file:`, `data:`, and `javascript:` URLs; allow credential-free loopback HTTP(S) only after displaying the resolved URL; and require the run-local fact `url_open_authorization: authorized | missing` for external HTTP(S) or custom app schemes. Show the exact target, scheme, expected network/app-state effect, and device before asking. Missing authority returns `url_open_authorization_missing` with zero `simctl openurl` calls. Permission to build/test, simulator selection, a visible link, or a known URL does not imply this authority.
