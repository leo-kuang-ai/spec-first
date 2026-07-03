# Supported MCP Tools

This reference summarizes the current `spec-mcp-setup` registry. The machine source of truth is `skills/spec-mcp-setup/mcp-tools.json`.

## Current Required Tools

| Tool | Required | Category | Host config | Command |
| --- | --- | --- | --- | --- |
| Sequential Thinking | Yes | `mcp` | Yes | `npx -y @modelcontextprotocol/server-sequential-thinking@latest` |
| Context7 | Yes | `mcp` | Yes | `npx -y @upstash/context7-mcp@latest` |
| CodeGraph | No, explicit opt-in | `mcp` | Yes | `codegraph serve --mcp` |

## Setup Rules

- Baseline entries may have `required=true`; optional MCP entries must carry `opt_in.explicit_consent_required=true`.
- Current registry categories are `mcp` only. Required helper/provider tools live in `helper-tools.json` and `provider-tools.json`, not in `mcp-tools.json`.
- MCP tools must define deterministic install, host config, detection, summary, and uninstall metadata.
- Package-backed setup paths normally request latest versions through `@latest`.
- Warmup cache lives under `$HOME/.spec-first/cache/mcp-warmup/` unless `SPEC_FIRST_WARMUP_CACHE_DIR` overrides it.
- `--verify-only` only reads facts and must not perform installs or host config writes.
- Supported host MCP config targets:
  - Claude Code: managed/user JSON `mcpServers`.
  - Codex: user/system TOML `mcp_servers` sections.
  - Kiro: workspace `.kiro/settings/mcp.json` by default; user `~/.kiro/settings/mcp.json` only with `--user-scope` or `KIRO_USER_SCOPE=1`.
- Kiro config writes use JSON `mcpServers`, preserve unrelated entries, reject invalid JSON instead of overwriting, and must write secret-like values only as env var references.

## Required Helper Tools

`agent-browser` and ast-grep are required helper tools for workflows that need browser automation or structural search. Each helper is not an MCP server, has no host config write, and is reported under `"helper_tools"` in setup-owned facts.

## Project Setup Facts

Setup writes project-local facts under `.spec-first/config/` when target writes are allowed:

- `tool-facts.json`: setup-owned tool and helper readiness facts.
- `runtime-capabilities.json`: setup-owned direct evidence posture and host ledger pointer.

These files are setup facts, not semantic code evidence. Downstream workflows decide what source files, tests, logs, or docs are relevant for the user's task.

## Handoff

After setup:

- If any row is `action-required`, fix that row and rerun setup.
- If a parent workspace target is ambiguous, choose a child repo and rerun with `--repo <child>`.
- If required runtime is ready, continue to the workflow that matches the user intent: plan, work, review, debug, or docs.
