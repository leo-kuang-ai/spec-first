# Skill: doctor

## Trigger
- Stage: any (independent of stage)
- Command: `/spec-first:doctor`

## MCP & Skills Health Check (Required)
- MUST check both hosts:
  - `Codex`: `~/.codex/config.toml`, `~/.codex/skills/`
  - `Claude Code`: `~/.config/claude-code/mcp.json`, `~/.config/claude-code/settings.json`, `~/.claude/skills/`
- Install scope MUST be user-level global directories (home-based paths), not project-local paths.
- Required MCP set (both hosts): `sequential-thinking`, `context7`, `serena`, `fetch`, `playwright-mcp`
- Required skills (both hosts): `find-skills`, `skill-creator`
- For `serena`, prefer `uvx --from git+https://github.com/oraios/serena serena start-mcp-server`; allow compatibility fallback to `serena-mcp-server` / `npx -y mcp-server-serena`
- For `fetch`, enforce executable target `uvx mcp-server-fetch`
- If any item is missing or misconfigured, MUST auto-install/auto-fix, then re-check and report final status

## Phases
- P0: Locate project root and host config files (`Codex` + `Claude`)
- P1: Run doctor baseline checks (Node, Git, hooks, config, gate degradation, file capacity)
- P2: Run MCP/skills checks for required set and detect missing/misconfigured items
- P3: If needed, auto-install/auto-fix missing MCP/skills and re-run checks
- P4: Present diagnostics + remediation summary (before/after status)
- P5: No project file writes (environment configs may be updated)

## CLI Dependencies
- `spec-first doctor`

## Output Paths
- None in project workspace (environment config files may be updated)

## confirm_policy
- Recommended: assisted (auto-fix may update local host configs)

## Success Criteria
- 诊断报告已展示（Node/Git/Hook/Config/Gate/文件膨胀检测结果）
- MCP required set 在 `Codex` + `Claude Code` 均通过
- skills required set 在 `Codex` + `Claude Code` 均通过
- 如发生自动修复，已输出修复前后差异
