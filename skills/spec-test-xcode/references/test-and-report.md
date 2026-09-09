# Test And Report

Read before screen interaction, human verification, failure handling, summary, or cleanup. Apply the entrypoint's source-binding and URL effect boundaries.

## Exercise The Scoped Screens

For each scoped screen, use `take_screenshot` with the selected simulator UUID and a descriptive filename. Inspect rendered controls, expected content, layout, and error states. Use `get_sim_logs` to check crashes, exceptions, error logs, and failed network requests. Record actual outcomes and evidence references.

SwiftUI `Text` with inline `AttributedString` links may report a successful automated tap without firing the gesture. A tap return is not evidence the link opened. When no effect is visible, request a manual tap or, when the URL is known and the entrypoint's URL authority is satisfied, use `xcrun simctl openurl <device> <URL>`. Observe the resulting navigation/app state before assigning a passing outcome.

## Human Verification

Request the specific action and observed result for flows automation cannot complete: Sign in with Apple, push notifications, sandbox purchases, camera/photos permissions, location, or inline text links. Use the active host's supported question channel, or a direct question when unavailable. Do not treat an unanswered question, elapsed time, or a successful tool invocation as a human confirmation.

Record Pass only from a completed positive observation, Fail from a reported/observed failure, and Skip when the check has no completed outcome. Continue independent checks while a human action remains pending.

## Handle Failures

Capture the failed screen, logs, and reproduction steps. Ask whether to investigate now or continue the remaining checks when existing scope does not resolve that decision. Continuing without investigation keeps the failure recorded as Fail.

For investigation, hand the specific evidence and existing authority to `spec-debug`; the handoff authorizes diagnosis, not a shipping tail. Apply an accepted fix only within current mutation authority. Refresh the pre-build source identity, rebuild, reinstall, relaunch, and retest the affected behavior. Only a completed passing retest replaces Fail. Missing or failed retesting cannot change Fail into Skip.

## Summary

Return this information using the repository's configured user language:

- **Project:** name and path.
- **Scheme:** selected scheme.
- **Simulator:** device and UUID.
- **Provider:** XcodeBuildMCP and available server/tool identity.
- **Target identity:** project/workspace, scheme, simulator, bundle ID.
- **Source binding:** revision with dirty-state/fingerprint, or explicit limitation.
- **Evidence authority:** provider-confirmed, transcribed, or mixed.
- **Freshness:** build start, final action completion, and comparison with the latest pre-build identity.
- **Limitations:** incomplete/manual-only checks, missing logs, tool gaps, or source mismatch.
- **Claim ceiling:** exactly the observed build/run/screens.

Include build status, a screen table with Pass/Fail/Skip and evidence, console errors, human verifications, remaining failures, and overall PASS/FAIL/PARTIAL.

Any remaining Fail, including a failed build or readiness stage, makes the result FAIL. With no Fail, any scoped incomplete/Skip check or source-binding limitation makes it PARTIAL. Otherwise it is PASS. Screens that were never exercised remain Skip; a failure cannot be erased by choosing to continue.

## Cleanup

Stop only the log capture started by this run using its handle and `stop_log_capture`. Leave a prebooted simulator as found. Shut down a simulator booted by this run only when cleanup scope allows it; do not interrupt another session's simulator.
