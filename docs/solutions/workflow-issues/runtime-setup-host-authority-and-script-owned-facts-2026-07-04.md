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
  - "允许 LLM 通过 Write、Update 或 Edit 修改 setup facts，会绕过统一 host-authority gate，并可能创建无效 host id。"
  - "Patching generated runtime mirrors directly fixes one project temporarily but does not repair the source projection."
applicable_versions:
  - "spec-first 1.12.1 multi-host runtime setup"
invalidation_condition: "当 host runtime 暴露可替代 entrypoint host pin 的确定性 current-host API 时重新评估。"
source_refs:
  - "skills/spec-mcp-setup/SKILL.md"
  - "skills/spec-mcp-setup/scripts/setup.cjs"
  - "skills/spec-mcp-setup/scripts/lib/host-authority.cjs"
  - "skills/spec-mcp-setup/scripts/lib/host-config.cjs"
  - "skills/spec-mcp-setup/scripts/lib/facts.cjs"
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

Claude Code ran `spec-mcp-setup` in a project that also had Codex and Kiro artifacts. The workflow output first treated the current host as Kiro and wrote Kiro-oriented setup information. A later run showed an even more important failure mode: instead of only choosing the wrong host config path, the model directly updated `.spec-first/config/tool-facts.json` and `.spec-first/config/runtime-capabilities.json` to `host: kiro-cli`.

That value was not a valid spec-first host id, and it was not produced by the setup scripts. The source-confirmed fix added host pins to generated setup surfaces and strengthened `spec-mcp-setup` so setup facts and host MCP config are script-owned outputs, not files for the LLM to patch by hand.

## Guidance

For Runtime Setup, the current host must come from an explicit host authority:

- The public entrypoint is authoritative: `spec-mcp-setup` means Claude, `spec-mcp-setup` means Codex, generated Kiro Agent Skill means Kiro, and generated Qoder command/Skill means Qoder.
- Generated host setup surface 调用 `setup.cjs` 时，应使用 `MCP_SETUP_HOST=<host>` 固定 Node 入口执行身份。
- `setup.cjs` 在解析 host config path 或写入 setup facts 前校验该显式 canonical host pin。自动发现的 host candidate 保持 advisory-only。
- Previous `.spec-first/config/*` files are drift evidence only. They must not override the current entrypoint host.

The write boundary is just as important:

- `.spec-first/config/tool-facts.json` 与 `.spec-first/config/runtime-capabilities.json` 必须由 `setup.cjs` 通过 facts module 和 atomic write gate 写入。
- Host MCP config 必须在显式 host authority 确认后，由 `setup.cjs` 通过 host-config transaction 写入。
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
- Treat `spec-mcp-setup` as Claude host authority.
- 调用共置 Node 入口前设置 `MCP_SETUP_HOST=claude`。
- 使用 `node <loaded-skill-root>/scripts/setup.cjs --verify-only` 刷新 `.spec-first/config/*`。
```

Incorrect pattern:

```text
The project contains `.kiro/settings/mcp.json`, so update setup facts to host `kiro-cli`.
```

Correct repair after polluted facts:

```bash
spec-mcp-setup --verify-only
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
- tests 或 smoke evidence 通过统一 Node 入口刷新 setup facts
```

## Related

- `docs/solutions/workflow-issues/host-entrypoint-mapping-source-boundary-2026-04-29.md`
- `docs/solutions/workflow-issues/modify-source-not-artifacts-2026-04-13.md`
- `skills/spec-mcp-setup/SKILL.md`
- `tests/unit/init-source-path-coverage.test.js`
