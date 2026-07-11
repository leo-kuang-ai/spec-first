---
schema_version: qoder-hooks-protocol-matrix/v1
producer: spec-first Phase 0a Qoder protocol spike
freshness: "2026-07-11T09:57:38+08:00; local qodercli 1.0.41 embedded protocol docs, isolated migration probe, and unauthenticated headless execution attempt"
artifact_type: validation-matrix
authority_level: mixed-by-row
reason_code: qoder_hooks_protocol_matrix
consumer: Phase 0b Qoder Runtime Lifecycle
---

# Qoder Hooks Protocol Matrix

This artifact records the Phase 0a evidence available in the current local environment. It is an input to Phase 0b Qoder runtime lifecycle implementation; only rows with `authorityLevel: confirmed` may become managed `.qoder/settings.json` entries.

## Environment Evidence

| Fact | Evidence | Authority |
| --- | --- | --- |
| PATH-visible Qoder CLI | `command -v qoder` returned empty output, but `command -v qodercli` returned `/Users/kuang/.local/bin/qodercli` and `qodercli --version` returned `1.0.41` on 2026-07-10 | confirmed local presence via `qodercli` |
| Qoder desktop app | `/Applications/Qoder.app` and `/Applications/Qoder CN.app` exist | advisory app presence |
| Qoder app version | Qoder logs mention stable `1.13.0` update checks under `~/Library/Application Support/Qoder/logs/20260709T235955/` | advisory log evidence |
| Project runtime mirror | `.qoder/commands/**`, `.qoder/skills/**`, `.qoder/rules/spec-first.md`, `.qoder/spec-first/state.json` exist in the current repo as generated runtime | advisory runtime state |
| Embedded hook protocol | `strings ~/.qoder/bin/qodercli/qodercli-1.0.41` exposes the bundled hook configuration reference: project `.qoder/settings.json`, optional matcher semantics, command exec form with `args`, SessionStart/PreToolUse/Stop events, stdin JSON, `hookSpecificOutput.hookEventName`, and exit code `2` blocking | confirmed for qodercli 1.0.41 protocol shape |
| Isolated migration writer | `qodercli --cwd <temp-project> --config-dir <temp-config> hooks migrate --from-claude` exited `0` and wrote `.qoder/settings.json` event arrays and matchers in the temporary project | confirmed writer surface; migration dropped Claude `args`, so migration output is not sufficient activation evidence |
| Headless execution attempt | A temporary project passed an inline SessionStart exec-form probe to `qodercli -p`; the CLI returned `Not logged in · Please run /login` with exit `1`, and the marker file was absent | confirmed environment limitation; no event execution evidence |

## Matrix Rows

| eventGroup | surface | version | settingsShape | commandShape | matcher | triggerCommand | stdinSampleRedacted | stdoutShape | stderrShape | exitCode | observedResult | authorityLevel | reasonCode | limitations | sourceRefsOrLogPath |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SessionStart | cli | qodercli 1.0.41 | `.qoder/settings.json` hooks object confirmed | exec form with literal `args` confirmed by bundled docs | matcher optional for lifecycle events | `qodercli -p` attempted in temp project | none; hook did not execute | auth error result JSON | none | 1 | Protocol is confirmed, but the local CLI was not authenticated and the SessionStart marker was not written | degraded | qoder_hook_activation_unverified | Authenticated event execution, cwd/env delivery, and `additionalContext` consumption remain unobserved | local binary docs; isolated migration probe; `/tmp/spec-first-qoder-session.U82wM5` execution attempt |
| PreToolUse | cli | qodercli 1.0.41 | `.qoder/settings.json` hooks object confirmed | exec form and exit `2` deny semantics confirmed by bundled docs | `Write\|Edit\|MultiEdit` | not run after SessionStart auth failure | none | unobserved | unobserved | unobserved | Protocol shape is confirmed; real tool-event execution is not | degraded | qoder_hook_activation_unverified | Requires an authenticated session that invokes Write/Edit/MultiEdit and observes allow/deny behavior | local binary docs; isolated migration probe |
| Stop | cli | qodercli 1.0.41 | `.qoder/settings.json` hooks object confirmed | exec form and exit `2` deny semantics confirmed by bundled docs | matcher optional for lifecycle events | not run after SessionStart auth failure | none | unobserved | unobserved | unobserved | Protocol shape is confirmed; real Stop execution and blocking are not | degraded | qoder_hook_activation_unverified | Requires an authenticated session and observation of `stop_hook_active` recursion protection | local binary docs; isolated migration probe |
| SessionStart | ide | app 1.13.0 advisory | shared project `.qoder/settings.json` | shell command string documented for shared hooks | not tested | not run | none | unobserved | unobserved | unobserved | loader safety not verified | degraded | shared_loader_safety_unconfirmed | App presence/logs do not prove shared settings loader accepts CLI-only SessionStart entries | `/Applications/Qoder.app`; Qoder app logs |
| PreToolUse | ide | app 1.13.0 advisory | shared project `.qoder/settings.json` | shell command string documented for shared hooks | not tested | not run | none | unobserved | unobserved | unobserved | loader safety not verified | degraded | shared_loader_safety_unconfirmed | App presence/logs do not prove IDE/JB behavior support or loader safety for generated spec-first entries | `/Applications/Qoder.app`; Qoder app logs |
| Stop | ide | app 1.13.0 advisory | shared project `.qoder/settings.json` | shell command string documented for shared hooks | not tested | not run | none | unobserved | unobserved | unobserved | loader safety not verified | degraded | shared_loader_safety_unconfirmed | App presence/logs do not prove Stop blocking behavior; docs indicate surface-specific differences | `/Applications/Qoder.app`; Qoder app logs |

## Phase 0b Decision

The qodercli 1.0.41 settings and command protocol is confirmed, so `protocol-unconfirmed` is no longer an accurate capability reason. No event row has authenticated execution evidence, and the shared IDE loader remains unverified. Therefore Phase 0b still must not write any managed `.qoder/settings.json` hook entry by default.

Phase 0b may still install managed hook script files as inert managed runtime assets:

- `.qoder/hooks/session-start`
- `.qoder/hooks/prd-prewrite-guard`
- `.qoder/hooks/prd-readiness-guard`

Doctor/init drift handling must report intentionally omitted settings entries as `degraded-by-design` with `reasonCode: qoder_hook_activation_unverified` and must not treat that status as hard runtime drift. A future authenticated CLI journey plus shared-loader safety check can upgrade an event group to `confirmed`; only then may source code enable the corresponding managed settings entry.
