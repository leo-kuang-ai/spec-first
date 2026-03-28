---
name: mcp-installer
description: Use when installing or updating a fixed MCP bundle across detected AI coding clients such as Claude Code, Cursor, Windsurf, Kiro, or Codex, especially when config scopes, paths, or update rules differ by platform.
---

# MCP Global Installer

## Core Principle

Only touch clients that are detected, writable, and explicitly selected. Treat the manifest in `docs/01-需求分析/MCP工具/mcp工具.md` and the design notes in `docs/plans/2026-03-28-mcp-global-installer-skill-design.md` as the source of truth. Never invent package names, config paths, or scope rules.

"Global" means per-client global scope. If a client only supports project scope, use that scope only when the adapter explicitly supports it. Do not claim system-wide activation.

## Trust Boundary

| Trusted input | Do not infer from |
|---|---|
| Manifest entries in `mcp工具.md` | Memory, examples, package names that "look right" |
| Verified adapter code | Directory names alone |
| Detected platform config files | Assumptions about a client's default layout |
| Explicit user selection | "Probably relevant" platforms |

| Hard stop | Reason |
|---|---|
| Missing manifest metadata | Do not synthesize command, args, or package names |
| Missing tested adapter | Do not guess the config shape |
| Read-only target | Do not attempt a write anyway |
| Validation mismatch after write | Do not keep the broken config |

## When to Use

- A fixed MCP bundle needs to be installed or updated across detected AI coding clients.
- The target clients use different config locations, scopes, or merge rules.
- You need backup, atomic write, verification, and rollback around MCP registration.

## When Not to Use

- The task is installing the AI client itself, not MCP configuration.
- The user wants arbitrary MCPs outside the fixed manifest bundle.
- The client is not detected, not writable, or not supported by a tested adapter.
- The task is only documentation work with no config mutation.

## Quick Reference

| Step | Rule |
|---|---|
| Detect | Find installed clients first |
| Filter | Keep only writable targets |
| Ask | Let the user choose target clients |
| Resolve | Read tool metadata from the manifest |
| Apply | Backup, merge, write, verify, replace |
| Recover | Roll back only the failed client |
| Report | Show installed, updated, skipped, failed |

## Workflow

1. Detect the supported clients from the platform matrix.
2. Keep only clients that exist and are writable.
3. Show the detected targets to the user and ask which ones to configure.
4. Resolve the v1 MCP bundle from the manifest, not from hardcoded assumptions.
5. For each selected client:
   - back up the current config
   - parse the current state
   - merge required MCP entries
   - write to a temp file
   - validate the file format
   - atomically replace the original
   - reread and confirm the entries exist
6. Return a short report with installed, updated, skipped, and failed items.

## Platform Rules

| Client | Scope | Rule |
|---|---|---|
| Claude Code | global | Use the writable global config path for that client |
| Cursor | global | Use the writable global MCP config for that client |
| Windsurf | global | Use the writable global MCP config for that client |
| Kiro | global/project | Prefer global; use project scope only if the adapter explicitly supports it |
| Codex | project | Only touch project-level `mcp.json` |
| Other templates | adapter-based | Support only when a tested adapter exists; otherwise stop and report unsupported |

## Update Rules

- If an entry exists with the same definition, skip it.
- If an entry exists with a different definition, update it.
- Preserve unrelated fields and other MCP servers.
- Never delete user-added servers outside the target keys.
- Never write to a platform that is absent, read-only, or unsupported.
- Never synthesize package metadata from the tool label.

## Red Flags

Stop and re-evaluate if any of these show up:

- "Global" is being treated as machine-wide auto-enable.
- A package name is being copied from memory instead of the manifest.
- The adapter is missing but the implementation wants to guess the path.
- A write failure is being ignored so the next platform can continue.
- Verification is being skipped because the config "looks right".

## Rationalization Table

| Excuse | Reality |
|---|---|
| "It is global, so one write should cover everything" | Global is per-client scope, not system-wide enablement |
| "The package name looks official enough" | If it is not in the manifest or a verified source, do not write it |
| "The client is probably using the same JSON shape" | Different clients have different merge and preservation rules |
| "Rollback is overkill" | A failed config write can break the user's editor state |
| "Unsupported means maybe it still works" | Unsupported means stop until a tested adapter exists |

## Failure Handling

- Parse error: stop that client and keep its backup.
- Write error: remove the temp file and restore the backup.
- Verify mismatch: roll back that client and report the diff.
- Network failure or runtime failure: fail only the current client or tool, then continue with the rest.
- Concurrent edit detected: reread once, retry merge once, then stop that client if the conflict remains.

## V1 Bundle

Resolve tool metadata from the manifest before writing. The required bundle is fixed to:

- Serena
- GitNexus
- ABCoder
- Sequential Thinking
- Context7

## Common Mistakes

- Treating global as machine-wide auto-enable
- Hardcoding package names or config paths
- Installing into undetected platforms
- Overwriting unrelated config
- Skipping verification
- Continuing after a failed rollback

## References

- `docs/01-需求分析/MCP工具/mcp工具.md`
- `docs/plans/2026-03-28-mcp-global-installer-skill-design.md`
