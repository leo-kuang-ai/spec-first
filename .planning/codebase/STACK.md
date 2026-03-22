# Technology Stack

> Generated: 2026-03-23
> Focus: tech

## Summary

spec-first is a TypeScript-based AI engineering workflow toolkit built on Bun runtime. It provides Claude Code skills for structured development workflows and a fast headless browser CLI powered by Playwright. The project uses a minimal dependency approach with Bun-native APIs for HTTP serving, SQLite, and file operations.

## Languages

**Primary:**
- TypeScript - All source code (`.ts` files throughout)
- ES Modules - `"type": "module"` in package.json

**Secondary:**
- Shell scripts - Build automation (`browse/scripts/build-node-server.sh`)
- Markdown - Documentation and skill templates (`SKILL.md.tmpl` files)

## Runtime

**Environment:**
- Bun 1.3.5+ (engine requirement: `>=1.0.0`)
- No Node.js required for runtime (Bun compiles to standalone binaries)

**Package Manager:**
- Bun (built-in package manager)
- Lockfile: `bun.lock` present

**Binary Compilation:**
- `bun build --compile` produces standalone executables
- Output: `browse/dist/browse` (main CLI binary)
- Cross-platform support: macOS/Linux native, Windows via Node.js bundle

## Frameworks

**Core:**
- Bun.serve - HTTP server for persistent browser daemon
- Playwright 1.58.2 - Headless browser automation (Chromium)

**Testing:**
- Bun test - Built-in test runner with `--retry`, `--concurrent` support
- No external test framework required

**Build/Dev:**
- Bun build - Native TypeScript compilation
- No bundler or transpiler needed (Bun runs TS directly)

## Key Dependencies

**Critical:**
- `playwright@^1.58.2` - Browser automation, Chromium control, page interactions
- `diff@^7.0.0` - Text diffing for snapshot comparison (`/browse diff` command)

**Dev Dependencies:**
- `@anthropic-ai/sdk@^0.78.0` - LLM-as-judge evaluations (paid tests only)

**Bun Built-ins (no npm install needed):**
- `bun:sqlite` - Cookie database access for browser import
- `Bun.spawn` / `Bun.serve` - Process and HTTP server management
- Native `fetch`, `fs`, `path`, `crypto`, `os` modules

## Configuration

**Environment:**
- Bun auto-loads `.env` (no dotenv package needed)
- Config directory: `.spec-first/` (project-local state)
- State file: `.spec-first/browse.json` (port, token, PID)

**Key Environment Variables:**
- `ANTHROPIC_API_KEY` - Required for LLM-as-judge evals (`bun run test:evals`)
- `BROWSE_PORT` - Override server port (default: random 10000-60000)
- `BROWSE_IDLE_TIMEOUT` - Server auto-shutdown timeout (default: 1800000ms = 30 min)
- `BROWSE_STATE_FILE` - Override state file location
- `EVALS_MODEL` - Override eval model (default: `claude-sonnet-4-6`)
- `EVALS_ALL=1` - Force all tests regardless of diff
- `EVALS_CONCURRENCY` - Max concurrent E2E tests (default: 15)

**Build Configuration:**
- No `tsconfig.json` (Bun handles TypeScript natively)
- Entry points defined in `package.json` scripts

## Platform Requirements

**Development:**
- Bun 1.0.0+
- Playwright browsers (auto-installed on first run)
- Claude CLI (for E2E tests: `claude -p`)

**Production:**
- Standalone binary (no runtime dependencies)
- Chromium (bundled with Playwright)
- macOS, Linux, or Windows supported

**Platform-Specific Notes:**
- Windows: Falls back to Node.js for server (Bun+Playwright Chromium incompatibility)
- macOS/Linux: Full Bun runtime

## Version Information

**Project Version:**
- Current: 0.9.8.0 (from `package.json`)

**Binary Versioning:**
- Git commit hash stored in `browse/dist/.version`
- Auto-restart on binary update (version mismatch detection)

---

*Stack analysis: 2026-03-23*
