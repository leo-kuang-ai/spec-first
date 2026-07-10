---
schema_version: qoder-hooks-protocol-matrix/v1
producer: spec-first Phase 0a Qoder protocol spike
freshness: "2026-07-10T16:06:40+08:00; local qodercli PATH/help probe plus Qoder app/log evidence"
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
| Official hooks docs | Qoder hooks docs describe project-level `.qoder/settings.json`, command hooks, `PreToolUse`, and `exit 2` blocking | advisory documentation |
| Qoder hooks CLI management surface | `qodercli hooks --help` exists and only exposes `hooks migrate --from-claude`; no no-side-effect hook trigger/probe command is shown | confirmed local CLI help |

## Matrix Rows

| eventGroup | surface | version | settingsShape | commandShape | matcher | triggerCommand | stdinSampleRedacted | stdoutShape | stderrShape | exitCode | observedResult | authorityLevel | reasonCode | limitations | sourceRefsOrLogPath |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SessionStart | cli | qodercli 1.0.41 | `.qoder/settings.json` hooks object | shell command string documented; exec-form unverified | `startup\|resume\|clear\|compact\|new` candidate | not run | none | unobserved | unobserved | unobserved | CLI exists, but no no-side-effect trigger/probe command is available and no session event was run | degraded | qoder_hook_protocol_unconfirmed | Cannot prove event source matcher, cwd, stdout `additionalContext`, command execution safety, or shared-loader safety from `qodercli --help` alone | local `qodercli --version`; `qodercli hooks --help`; official docs advisory |
| PreToolUse | cli | qodercli 1.0.41 | `.qoder/settings.json` hooks object | shell command string documented; exec-form unverified | `Write\|Edit\|MultiEdit` candidate | not run | none | unobserved | unobserved | unobserved | CLI exists, but no real Write/Edit/MultiEdit hook trigger was run | degraded | qoder_hook_protocol_unconfirmed | Official docs support `PreToolUse` and `exit 2`, but local tool-name matcher, cwd, stdin shape, and shell/PATH resolution are not confirmed | local `qodercli --version`; `qodercli hooks --help`; official docs advisory |
| Stop | cli | qodercli 1.0.41 | `.qoder/settings.json` hooks object | shell command string documented; exec-form unverified | no matcher candidate | not run | none | unobserved | unobserved | unobserved | CLI exists, but no real Stop hook trigger was run | degraded | qoder_hook_protocol_unconfirmed | Official surfaces differ on whether Stop can block; local exit-code/stderr behavior is not confirmed | local `qodercli --version`; `qodercli hooks --help`; official docs advisory |
| SessionStart | ide | app 1.13.0 advisory | shared project `.qoder/settings.json` | shell command string documented for shared hooks | not tested | not run | none | unobserved | unobserved | unobserved | loader safety not verified | degraded | shared_loader_safety_unconfirmed | App presence/logs do not prove shared settings loader accepts CLI-only SessionStart entries | `/Applications/Qoder.app`; Qoder app logs |
| PreToolUse | ide | app 1.13.0 advisory | shared project `.qoder/settings.json` | shell command string documented for shared hooks | not tested | not run | none | unobserved | unobserved | unobserved | loader safety not verified | degraded | shared_loader_safety_unconfirmed | App presence/logs do not prove IDE/JB behavior support or loader safety for generated spec-first entries | `/Applications/Qoder.app`; Qoder app logs |
| Stop | ide | app 1.13.0 advisory | shared project `.qoder/settings.json` | shell command string documented for shared hooks | not tested | not run | none | unobserved | unobserved | unobserved | loader safety not verified | degraded | shared_loader_safety_unconfirmed | App presence/logs do not prove Stop blocking behavior; docs indicate surface-specific differences | `/Applications/Qoder.app`; Qoder app logs |

## Phase 0b Decision

No row is `authorityLevel: confirmed`. Therefore Phase 0b must not write any managed `.qoder/settings.json` hook entry by default.

Phase 0b may still install managed hook script files as inert managed runtime assets:

- `.qoder/hooks/session-start`
- `.qoder/hooks/prd-prewrite-guard`
- `.qoder/hooks/prd-readiness-guard`

Doctor/init drift handling must report settings entries as `degraded-by-design` with `reasonCode: qoder_hook_protocol_unconfirmed` and must not treat that status as hard runtime drift. A future validation row can upgrade one event group to `confirmed`; only then may source code enable the corresponding managed settings entry.
