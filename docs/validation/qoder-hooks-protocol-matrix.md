---
schema_version: qoder-hooks-protocol-matrix/v1
producer: spec-first Phase 0a Qoder protocol spike
freshness: "2026-07-10T00:00:00+08:00; local PATH probe plus Qoder app/log evidence"
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
| PATH-visible Qoder CLI | `command -v qoder` returned empty output on 2026-07-10 | confirmed local negative |
| Qoder desktop app | `/Applications/Qoder.app` and `/Applications/Qoder CN.app` exist | advisory app presence |
| Qoder app version | Qoder logs mention stable `1.13.0` update checks under `~/Library/Application Support/Qoder/logs/20260709T235955/` | advisory log evidence |
| Project runtime mirror | `.qoder/commands/**`, `.qoder/skills/**`, `.qoder/rules/spec-first.md`, `.qoder/spec-first/state.json` exist in the current repo as generated runtime | advisory runtime state |
| Official hooks docs | Qoder hooks docs describe project-level `.qoder/settings.json`, command hooks, `PreToolUse`, and `exit 2` blocking | advisory documentation |

## Matrix Rows

| eventGroup | surface | version | settingsShape | commandShape | matcher | triggerCommand | stdinSampleRedacted | stdoutShape | stderrShape | exitCode | observedResult | authorityLevel | reasonCode | limitations | sourceRefsOrLogPath |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SessionStart | cli | unavailable | `.qoder/settings.json` hooks object | shell command string documented; exec-form unverified | `startup\|resume\|clear\|compact\|new` candidate | not run | none | unobserved | unobserved | unobserved | no CLI trigger environment | blocked | qoder_cli_unavailable | No PATH-visible `qoder` CLI; cannot prove event source matcher, cwd, stdout `additionalContext`, or command execution safety | local `command -v qoder`; official docs advisory |
| PreToolUse | cli | unavailable | `.qoder/settings.json` hooks object | shell command string documented; exec-form unverified | `Write\|Edit\|MultiEdit` candidate | not run | none | unobserved | unobserved | unobserved | no CLI trigger environment | blocked | qoder_cli_unavailable | Official docs support `PreToolUse` and `exit 2`, but local CLI behavior, tool-name matcher, cwd, and shell/PATH resolution are not confirmed | local `command -v qoder`; official docs advisory |
| Stop | cli | unavailable | `.qoder/settings.json` hooks object | shell command string documented; exec-form unverified | no matcher candidate | not run | none | unobserved | unobserved | unobserved | no CLI trigger environment | blocked | qoder_cli_unavailable | Official surfaces differ on whether Stop can block; no local CLI trigger evidence | local `command -v qoder`; official docs advisory |
| SessionStart | ide | app 1.13.0 advisory | shared project `.qoder/settings.json` | shell command string documented for shared hooks | not tested | not run | none | unobserved | unobserved | unobserved | loader safety not verified | degraded | shared_loader_safety_unconfirmed | App presence/logs do not prove shared settings loader accepts CLI-only SessionStart entries | `/Applications/Qoder.app`; Qoder app logs |
| PreToolUse | ide | app 1.13.0 advisory | shared project `.qoder/settings.json` | shell command string documented for shared hooks | not tested | not run | none | unobserved | unobserved | unobserved | loader safety not verified | degraded | shared_loader_safety_unconfirmed | App presence/logs do not prove IDE/JB behavior support or loader safety for generated spec-first entries | `/Applications/Qoder.app`; Qoder app logs |
| Stop | ide | app 1.13.0 advisory | shared project `.qoder/settings.json` | shell command string documented for shared hooks | not tested | not run | none | unobserved | unobserved | unobserved | loader safety not verified | degraded | shared_loader_safety_unconfirmed | App presence/logs do not prove Stop blocking behavior; docs indicate surface-specific differences | `/Applications/Qoder.app`; Qoder app logs |

## Phase 0b Decision

No row is `authorityLevel: confirmed`. Therefore Phase 0b must not write any managed `.qoder/settings.json` hook entry by default.

Phase 0b may still install managed hook script files as inert managed runtime assets:

- `.qoder/hooks/session-start`
- `.qoder/hooks/prd-prewrite-guard`
- `.qoder/hooks/prd-readiness-guard`

Doctor/init drift handling must report settings entries as `degraded-by-design` with `reasonCode: qoder_cli_unavailable` and must not treat that status as hard runtime drift. A future validation row can upgrade one event group to `confirmed`; only then may source code enable the corresponding managed settings entry.
