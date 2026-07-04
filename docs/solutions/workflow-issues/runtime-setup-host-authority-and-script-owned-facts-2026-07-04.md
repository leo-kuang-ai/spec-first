---
title: "Runtime Setup host authority and script-owned facts"
date: 2026-07-04
category: workflow-issues
module: runtime-setup-host-authority
problem_type: workflow_issue
component: development_workflow
severity: high
applies_when:
  - "Adding or changing a spec-first host adapter"
  - "Projecting spec-mcp-setup into a host runtime"
  - "Refreshing .spec-first/config setup facts or host MCP config"
  - "Diagnosing a setup run that reported the wrong current host"
domain: host-runtime-setup
pattern: "Entrypoint host authority plus script-owned setup facts"
rejected_alternatives:
  - "Inferring the current host from PATH, generated runtime directories, or stale setup facts can select a different installed host."
  - "Letting the LLM Write, Update, or Edit setup facts bypasses detect-host and can create invalid host ids."
  - "Patching generated runtime mirrors directly fixes one project temporarily but does not repair the source projection."
applicable_versions:
  - "spec-first 1.12.1 multi-host runtime setup"
invalidation_condition: "Re-evaluate when host runtimes expose a deterministic current-host API that replaces entrypoint pins and detect-host scripts."
source_refs:
  - "skills/spec-mcp-setup/SKILL.md"
  - "src/cli/adapters/claude.js"
  - "src/cli/adapters/kiro.js"
  - "src/cli/adapters/qoder.js"
  - "tests/unit/init-source-path-coverage.test.js"
  - "docs/solutions/workflow-issues/host-entrypoint-mapping-source-boundary-2026-04-29.md"
  - "docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md"
tags: [runtime-setup, host-authority, generated-runtime, mcp-setup, setup-facts]
---

# Runtime Setup host authority and script-owned facts

## Context

Claude Code ran `/spec:mcp-setup` in a project that also had Codex and Kiro artifacts. The workflow output first treated the current host as Kiro and wrote Kiro-oriented setup information. A later run showed an even more important failure mode: instead of only choosing the wrong host config path, the model directly updated `.spec-first/config/tool-facts.json` and `.spec-first/config/runtime-capabilities.json` to `host: kiro-cli`.

That value was not a valid spec-first host id, and it was not produced by the setup scripts. The source-confirmed fix added host pins to generated setup surfaces and strengthened `spec-mcp-setup` so setup facts and host MCP config are script-owned outputs, not files for the LLM to patch by hand.

## Guidance

For Runtime Setup, the current host must come from an explicit host authority:

- The public entrypoint is authoritative: `/spec:mcp-setup` means Claude, `$spec-mcp-setup` means Codex, generated Kiro Agent Skill means Kiro, and generated Qoder command/Skill means Qoder.
- Generated host setup surfaces should pin script execution with `MCP_SETUP_HOST=<host>` when invoking setup scripts.
- A fresh `detect-host.*` JSON result is the deterministic fact used to select host config paths and setup facts.
- Previous `.spec-first/config/*` files are drift evidence only. They must not override the current entrypoint host.

The write boundary is just as important:

- `.spec-first/config/tool-facts.json` and `.spec-first/config/runtime-capabilities.json` must be written by `verify-tools.*` / `write-setup-facts.*`.
- Host MCP config must be written by `configure-host.*` / `install-mcp.*` after host detection.
- Do not use `Write`, `Update`, or `Edit` to patch setup facts or host MCP config, even when the desired JSON change looks obvious.
- Do not infer host identity from `PATH`, the presence of `.kiro/`, `.qoder/`, `.codex/`, or another generated runtime directory.

When a host projection is generated, add a projection contract test that checks the runtime setup surface contains the host pin and the script-owned facts rule. This makes prompt/source changes durable instead of relying on the current session remembering the incident.

## Why This Matters

Runtime Setup is a mutation workflow. A wrong host decision can write the wrong config file, refresh the wrong ledger pointer, or make downstream workflows believe the project is ready for a host that was not actually running.

The failure is subtle because all of these signals can coexist on a developer machine:

- multiple host CLIs on `PATH`
- generated runtime directories for several hosts
- stale setup facts from a previous host run
- host-native config files left by an earlier experiment

Those are useful diagnostic facts, but they are not the current host. Letting the LLM combine them semantically without a hard host authority recreates the exact class of bug that setup scripts exist to avoid.

Script-owned setup facts also protect schema quality. The script layer knows the allowed host ids, marker paths, selected scopes, generated runtime manifest state, and reason codes. Manual JSON edits can create states such as `host: kiro-cli`, which look plausible to a human but are outside the runtime contract.

## When to Apply

- Adding a new supported host such as Cursor, Gemini CLI, or OpenCode.
- Updating a host adapter's runtime projection for `spec-mcp-setup`.
- Extending MCP setup to a new host config format or scope.
- Repairing a setup run that reports the wrong host or points `runtime-capabilities.json` at another host's ledger.
- Reviewing plans that propose using existing runtime directories or config files as current-host detection.

## Examples

Correct host projection pattern:

```text
Generated Claude Runtime Setup:
- Treat `/spec:mcp-setup` as Claude host authority.
- Set `MCP_SETUP_HOST=claude` before setup script calls.
- Use `verify-tools.sh` to refresh `.spec-first/config/*`.
```

Incorrect pattern:

```text
The project contains `.kiro/settings/mcp.json`, so update setup facts to host `kiro-cli`.
```

Correct repair after polluted facts:

```bash
MCP_SETUP_HOST=claude bash .claude/spec-first/workflows/spec-mcp-setup/scripts/verify-tools.sh
```

Incorrect repair:

```text
Update `.spec-first/config/runtime-capabilities.json` by hand until the report looks right.
```

For new hosts, the minimum regression coverage should assert:

```text
- generated setup surface includes `MCP_SETUP_HOST=<host>`
- generated setup surface says entrypoint host is authoritative
- generated setup surface forbids Write/Update/Edit on setup facts and host MCP config
- setup facts are refreshed through the script path in tests or smoke evidence
```

## Related

- `docs/solutions/workflow-issues/host-entrypoint-mapping-source-boundary-2026-04-29.md`
- `docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md`
- `skills/spec-mcp-setup/SKILL.md`
- `tests/unit/init-source-path-coverage.test.js`
