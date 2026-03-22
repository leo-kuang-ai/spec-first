# Architecture

**Analysis Date:** 2026-03-23

## Pattern Overview

**Overall:** Multi-component AI development workflow toolkit with three primary subsystems:
1. **Browse** - Persistent headless browser CLI with HTTP server architecture
2. **Skills** - Template-driven prompt engineering system for AI coding assistants
3. **Test Infrastructure** - Multi-tier evaluation framework (static, E2E, LLM-judge)

**Key Characteristics:**
- **CLI-Server Architecture**: Browse commands are thin CLI wrappers around a persistent HTTP server
- **Template Generation**: SKILL.md files are generated from .tmpl templates with placeholder resolution
- **Multi-host Support**: Skills work with both Claude Code and OpenAI Codex via host-specific paths
- **Diff-based Testing**: E2E tests selectively run based on git diff touchfiles
- **Circular Buffer Logging**: In-memory event buffers with async disk flush for console/network/dialog capture

## Layers

**Browse CLI Layer:**
- Purpose: User-facing command interface for browser automation
- Location: `browse/src/cli.ts`
- Contains: Server lifecycle management, command dispatch, state file handling
- Depends on: HTTP server, config resolution
- Used by: End users via `$B <command>` or `browse <command>`

**Browse Server Layer:**
- Purpose: Persistent headless Chromium daemon with Playwright orchestration
- Location: `browse/src/server.ts`
- Contains: HTTP routing, auth token validation, command dispatch to handlers
- Depends on: BrowserManager, command handlers (read/write/meta)
- Used by: CLI layer via HTTP POST requests

**Command Handler Layer:**
- Purpose: Individual command implementations organized by category
- Location: `browse/src/read-commands.ts`, `browse/src/write-commands.ts`, `browse/src/meta-commands.ts`
- Contains: Playwright operations mapped to browse commands
- Depends on: BrowserManager for page/context access
- Used by: Server layer command router

**Browser Manager Layer:**
- Purpose: Chromium lifecycle, state management, tab handling, ref resolution
- Location: `browse/src/browser-manager.ts`
- Contains: Browser launch/close, context recreation, tab management, state save/restore, ref map
- Depends on: Playwright chromium module
- Used by: All command handlers

**Skill Generation Layer:**
- Purpose: Transform .tmpl templates into ready-to-use SKILL.md prompts
- Location: `scripts/gen-skill-docs.ts`
- Contains: Placeholder resolution, command reference generation, snapshot flag tables
- Depends on: Command registry (`browse/src/commands.ts`), snapshot flags (`browse/src/snapshot.ts`)
- Used by: Build process, dev:skill watch mode

**Test Infrastructure Layer:**
- Purpose: Multi-tier validation and evaluation
- Location: `test/` directory with helpers in `test/helpers/`
- Contains: Session runners (claude/codex/gemini), LLM judge, eval persistence, touchfile tracking
- Depends on: Anthropic SDK, spawn for subprocess management
- Used by: CI/CD pipeline, local development testing

## Data Flow

**Browse Command Execution:**

1. User invokes `$B goto https://example.com`
2. CLI reads state file from `.spec-first/browse.json` for port/token
3. If server not running or stale PID, spawn server process (bun/node)
4. CLI sends HTTP POST to `http://127.0.0.1:{port}/command` with Bearer auth
5. Server validates auth, routes to `handleWriteCommand('goto', ...)`
6. Handler calls `browserManager.getPage().goto(url)`
7. Playwright navigates, returns result
8. Server returns response to CLI, CLI prints to stdout

**Skill Template Generation:**

1. `bun run gen:skill-docs` reads all `**/SKILL.md.tmpl` files
2. For each template, find `{{PLACEHOLDER}}` patterns
3. Resolve placeholders from source:
   - `{{COMMAND_REFERENCE}}` - generated from `COMMAND_DESCRIPTIONS` registry
   - `{{SNAPSHOT_FLAGS}}` - generated from `SNAPSHOT_FLAGS` metadata
   - `{{PREAMBLE}}` - generated with update check, telemetry, branch detection
4. Format and write to corresponding `SKILL.md` file
5. Validation: `--dry-run` compares generated vs committed, exits 1 if different

**E2E Test Execution:**

1. `bun run test:evals` calculates git diff against base branch
2. Touchfile system maps changed files to affected tests
3. Selected tests run in parallel with configurable concurrency
4. Each test spawns `claude -p` or `codex` subprocess with streaming NDJSON
5. Session runner collects tool calls, transcripts, browse errors
6. Results persisted to `~/.spec-first-dev/evals/` with timestamped JSON
7. Auto-comparison with previous run generates delta report

**State Management:**
- Browser state (cookies, localStorage, tabs) persisted in memory on BrowserManager
- Ref map (`@e1`, `@c1` locators) cleared on navigation, stored per-page
- Last snapshot text retained across navigations for diff comparison
- Server state file (port, token, PID) written atomically to `.spec-first/browse.json`

## Key Abstractions

**Ref-based Element Selection:**
- Purpose: Stable element references via accessibility tree parsing
- Examples: `browse/src/snapshot.ts` (generation), `browse/src/browser-manager.ts` (resolution)
- Pattern: `ariaSnapshot()` → parse tree → assign `@e1`, `@e2` → store `Locator` in ref map → resolve on command

**Command Registry:**
- Purpose: Single source of truth for all browse commands
- Examples: `browse/src/commands.ts`
- Pattern: Three sets (`READ_COMMANDS`, `WRITE_COMMANDS`, `META_COMMANDS`) + `COMMAND_DESCRIPTIONS` map
- Validation: Load-time assertions ensure descriptions cover all commands

**Circular Buffer:**
- Purpose: Efficient in-memory logging with bounded memory
- Examples: `browse/src/buffers.ts`
- Pattern: Fixed-size ring buffer for console/network/dialog entries, async disk flush every 1s

**Template Context:**
- Purpose: Host-aware path resolution for skill generation
- Examples: `scripts/gen-skill-docs.ts`
- Pattern: `HOST_PATHS` map defines paths for `claude` vs `codex`, context passed to all resolvers

**Touchfile System:**
- Purpose: Map source file changes to affected tests
- Examples: `test/helpers/touchfiles.ts`
- Pattern: Each test declares file dependencies, `eval:select` calculates transitive closure

## Entry Points

**Browse Binary:**
- Location: `browse/dist/browse` (compiled from `browse/src/cli.ts`)
- Triggers: User invocation via `$B` alias or `browse` command
- Responsibilities: Server lifecycle, command dispatch, state file management

**Browse Server:**
- Location: `browse/src/server.ts`
- Triggers: CLI spawn on first command or server restart
- Responsibilities: HTTP routing, Chromium lifecycle, idle timeout, crash handling

**Skill Generation:**
- Location: `scripts/gen-skill-docs.ts`
- Triggers: Build process, `bun run gen:skill-docs`, dev:skill watch mode
- Responsibilities: Template parsing, placeholder resolution, file generation

**E2E Session Runner:**
- Location: `test/helpers/session-runner.ts`
- Triggers: Test framework via `runSkillTest()` calls
- Responsibilities: Subprocess spawning, NDJSON streaming, heartbeat writing, result collection

## Error Handling

**Strategy:** Fail-fast with actionable messages, no silent self-healing

**Patterns:**
- **Chromium Crash**: Server exits with error message, CLI auto-restarts on next command
- **Element Not Found**: "Ref @e3 not found. Run 'snapshot' to get fresh refs."
- **Timeout**: Playwright TimeoutError wrapped into actionable message with hints
- **Auth Mismatch**: 401 response triggers server restart with fresh token
- **Consecutive Failures**: After 3 failures, hint suggests `handoff` command

## Cross-Cutting Concerns

**Logging:** Circular buffers in memory, async flush to `.spec-first/browse-*.log` files every 1s

**Validation:**
- Command validation via `ALL_COMMANDS` set membership
- Snapshot flag validation via `parseSnapshotArgs()` against `SNAPSHOT_FLAGS`
- Template freshness via `--dry-run` comparison

**Authentication:** Random UUID token per server instance, Bearer auth on all `/command` endpoints

**Idle Management:** 30-minute idle timeout, configurable via `BROWSE_IDLE_TIMEOUT` env var

**Platform Support:** Windows falls back to Node.js server bundle (Bun Playwright incompatibility)

**Language Support:** Skills support zh/en output via `~/.spec-first/lang` config file

---

*Architecture analysis: 2026-03-23*
