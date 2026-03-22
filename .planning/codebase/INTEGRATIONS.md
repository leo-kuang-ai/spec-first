# External Integrations

> Generated: 2026-03-23
> Focus: tech

## Summary

spec-first integrates with Claude CLI for skill execution and E2E testing, Anthropic API for LLM-as-judge evaluations, and system browsers for cookie import. The project has minimal external dependencies, relying primarily on local browser automation via Playwright/Chromium.

## APIs & External Services

**Anthropic API:**
- Service: Claude LLM for quality evaluation
- SDK: `@anthropic-ai/sdk@^0.78.0`
- Auth: `ANTHROPIC_API_KEY` environment variable
- Usage: LLM-as-judge scoring in `test/helpers/llm-judge.ts`
- Models used: `claude-sonnet-4-6` (configurable via `EVALS_MODEL`)

**Claude CLI:**
- Service: External Claude Code subprocess execution
- Usage: E2E testing via `claude -p` command
- Integration: `test/helpers/session-runner.ts` spawns Claude as subprocess
- Output: NDJSON streaming for real-time progress
- Auth: Uses Claude CLI's own authentication (no API key needed)

**Gemini CLI (optional):**
- Service: Alternative AI for E2E testing
- Integration: `test/helpers/gemini-session-runner.ts`
- Usage: `bun run test:gemini` commands

**Codex CLI (optional):**
- Service: OpenAI Codex for E2E testing
- Integration: `test/helpers/codex-session-runner.ts`
- Auth: Uses Codex's own config at `~/.codex/`
- Usage: `bun run test:codex` commands

## Data Storage

**Databases:**
- SQLite (via `bun:sqlite`)
  - Purpose: Read browser cookie databases for import
  - Location: Browser profile directories (Chrome, Arc, Brave, Edge, Comet)
  - Implementation: `browse/src/cookie-import-browser.ts`

**File Storage:**
- Local filesystem only
- State directory: `<project>/.spec-first/`
  - `browse.json` - Server state (port, token, PID)
  - `browse-console.log` - Console messages
  - `browse-network.log` - Network requests
  - `browse-dialog.log` - Dialog interactions
- Eval storage: `~/.spec-first-dev/evals/`
  - JSON results from E2E test runs
  - Comparison data between runs
- Test transcripts: `~/.spec-first-dev/e2e-runs/<runId>/`
  - NDJSON transcripts per test
  - `progress.log` for real-time status

**Caching:**
- None (stateless server, in-memory buffers only)

## Authentication & Identity

**Auth Provider:**
- None (local tool, no user accounts)

**Internal Auth:**
- Server auth: Random UUID token generated at startup
- Token stored in `.spec-first/browse.json`
- CLI sends token via `Authorization: Bearer <token>` header
- Purpose: Prevent unauthorized access to localhost server

## Browser Integration

**Cookie Import:**
- Supported browsers: Comet, Chrome, Arc, Brave, Edge
- Implementation: `browse/src/cookie-import-browser.ts`
- Methods:
  1. Cookie picker UI (opens browser for domain selection)
  2. Direct import via `--domain` flag
- Cookie decryption: Native OS crypto (Keychain on macOS)

**Browser Detection:**
- Auto-detects installed browsers via profile directory scanning
- Platform-aware paths (macOS/Linux/Windows)

## CI/CD & Deployment

**Hosting:**
- GitHub (source repository)
- NPM (package distribution planned)
- Local installation: `~/.claude/skills/spec-first/`

**CI Pipeline:**
- GitHub Actions: `.github/workflows/skill-docs.yml`
- Triggers: push, pull_request
- Checks: SKILL.md freshness (regeneration validation)
- Runner: `ubuntu-latest` with Bun setup

**Installation Methods:**
1. Clone + `bun install` + `./setup` (development)
2. Symlink to `~/.claude/skills/spec-first/` (global install)

## External Tool Dependencies

**Required for Full Functionality:**
- Claude CLI (`claude`) - For E2E tests
- Playwright browsers - Auto-installed on first `browse` command

**Optional:**
- Gemini CLI - For Gemini E2E tests
- Codex CLI - For Codex E2E tests

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## File System Integration

**Monitored Directories:**
- `.spec-first/` - Server state and logs
- `~/.spec-first-dev/` - Eval results and E2E transcripts
- `~/.codex/` - Codex CLI config (for Codex E2E tests)

**Skill Directory Structure:**
- Skills are directories containing `SKILL.md` (generated from `SKILL.md.tmpl`)
- Symlinked to `~/.claude/skills/` for Claude Code discovery
- Examples: `ship/`, `review/`, `retro/`, `brainstorm/`, etc.

## Environment Configuration

**Required env vars:**
- `ANTHROPIC_API_KEY` - For `bun run test:evals` only

**Optional env vars:**
- `BROWSE_PORT` - Debug override for server port
- `BROWSE_IDLE_TIMEOUT` - Server shutdown timeout
- `EVALS_MODEL` - Override eval model
- `EVALS_ALL=1` - Force all tests
- `EVALS_CONCURRENCY` - Parallel test limit

**Secrets location:**
- Environment variables only (no secrets in repo)
- `.env.example` provided as template (not committed with values)

---

*Integration audit: 2026-03-23*
