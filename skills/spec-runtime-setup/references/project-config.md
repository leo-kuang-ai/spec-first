# Project-local config bootstrap

Read this reference before any project-local config mutation. It carries the detailed preflight, scope, authorization, and verification rules while `SKILL.md` retains the public setup contract.

## Surfaces and ownership

Project-local setup has two separate surfaces:

1. Setup-owned facts: `.spec-first/config/tool-facts.json`, `.spec-first/config/runtime-capabilities.json`, and when applicable `.spec-first/workspace/scenario-fingerprint-setup.json`.
2. Local config bootstrap: `.spec-first/config.local.example.yaml`, local override state for `.spec-first/config.local.yaml`, and `.gitignore` coverage for `.spec-first/*.local.yaml`. Missing local override means `defaults-active`，不是“未处理的可选项”。

Local config bootstrap is project-local and local-only. It may refresh the example, create the local override, and ensure the ignore rule only through an explicitly authorized project-config action. It reports legacy project config signals for manual review, but never copies legacy files, translates old key names, or treats old defaults as spec-first truth.

## Authorized actions

- `--check`, `--plan`, and `--verify-only` do not bootstrap project config.
- `--project-config` may refresh `.spec-first/config.local.example.yaml`, create `.spec-first/config.local.yaml` only when the action is explicitly selected, and ensure `.spec-first/*.local.yaml` is ignored.
- Bare setup reports example/local/gitignore/legacy status and leaves a missing local override as `defaults-active`.
- Do not auto-delete legacy project config or migrate legacy keys. Deleting obsolete legacy markdown requires an explicit owner approval.

Project-local config actions never install providers or edit host config. Host/provider actions never migrate local config keys. Keep all writes under the resolved target root; resolve Git roots with `git rev-parse --show-toplevel` where applicable and use the exact folder target for non-Git projects.

## Active consumers and defaults

The only active local rendering preferences are `verification_profile_path`, `feedback_sources` / `sweep_*`, `pulse_*`, `spec_promote_spiral_optout`, `plan_skip_scoping_confirm`, `plan_output`, `brainstorm_output`, and `ideate_output`. The latter three are read by `spec-plan`, `spec-brainstorm`, and `spec-ideate`; invalid or commented values fall back to `spec-plan=md`, `spec-brainstorm=md`, and `spec-ideate=html`. Pipeline override remains owned by each consumer. Runtime Setup does not call those workflows or promote local preferences to runtime authority.

## Verification and handoff

After an authorized project-config action, re-run `setup.cjs --verify-only` and report:

- example config freshness;
- local override state (`created`, `present`, or `defaults-active`);
- `.spec-first/*.local.yaml` ignore coverage;
- legacy markdown/config signals and any remaining manual action.

Do not collapse these rows into a single setup-complete claim. Preserve unrelated user settings, never overwrite an existing local override without explicit authorization, and keep generated host runtime mirrors outside this source reference. The reference itself is canonical source; generated runtime is refreshed only through `spec-first init`.
