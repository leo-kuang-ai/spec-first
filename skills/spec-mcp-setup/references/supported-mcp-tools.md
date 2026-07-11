# Supported MCP Tools

本文总结当前 `spec-mcp-setup` registry。Machine source of truth 是 `skills/spec-mcp-setup/setup-registry.json`，schema version 为 `setup-registry.v8`；generated host 从 loaded skill root 消费其共置 runtime projection。

## Current Required Tools

| Tool | Required | Category | Host config | Command |
| --- | --- | --- | --- | --- |
| Sequential Thinking | Yes | `mcp` | Yes | `npx -y @modelcontextprotocol/server-sequential-thinking@latest` |
| Context7 | Yes | `mcp` | Yes | `npx -y @upstash/context7-mcp@latest` |
| CodeGraph | No, explicit opt-in | `mcp` | Yes | `codegraph serve --mcp` |

## Setup Rules

- Baseline entries may have `required=true`; optional MCP entries must carry `opt_in.explicit_consent_required=true`.
- 统一 registry 区分 `tools`、`helpers` 与 `providers`，同时集中管理 dependency pin、host target、platform override、install safety 与 artifact contract。
- MCP tools must define deterministic install, host config, detection, summary, and uninstall metadata.
- Package-backed setup paths normally request latest versions through `@latest`.
- Warmup cache lives under `$HOME/.spec-first/cache/mcp-warmup/` unless `SPEC_FIRST_WARMUP_CACHE_DIR` overrides it.
- `--verify-only` / `--refresh-facts` 会重新验证并刷新 setup-owned facts，但不执行安装或 host config 写入。
- Supported host MCP config targets:
  - Claude Code: managed/user JSON `mcpServers`.
  - Codex: user/system TOML `mcp_servers` sections.
  - Kiro: workspace `.kiro/settings/mcp.json` by default; user `~/.kiro/settings/mcp.json` only with `--user-scope` or `KIRO_USER_SCOPE=1`.
  - Qoder: local `.qoder/settings.local.json` by default; user `~/.qoder/settings.json` only with `--user-scope` or `QODER_USER_SCOPE=1`.
  - Cursor：默认写 project `.cursor/mcp.json`；只有使用 `--user-scope` 才写 user `~/.cursor/mcp.json`。
- Claude、Kiro、Qoder 与 Cursor config 使用 JSON `mcpServers`；Codex 使用 bounded TOML section editing。两者都保留无关 entry、拒绝有歧义或无效输入，并要求 secret-like value 保持为 environment reference。

## Runtime 入口

先解析 loaded skill directory，再使用公开 mode argument 调用 `node <loaded-skill-root>/scripts/setup.cjs`。项目 cwd 绝不能作为 support-file lookup root。`scripts/check-health` 只是 `--check` 的 Node compatibility shim；Windows 直接使用同一 `setup.cjs` 入口，不存在 platform-specific companion。

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
