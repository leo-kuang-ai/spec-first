# Codebase Structure

**Analysis Date:** 2026-03-23

## Directory Layout

```
spec-first/
├── browse/              # Headless browser CLI + server
│   ├── src/             # TypeScript source
│   ├── dist/            # Compiled binary
│   ├── test/            # Integration tests
│   └── scripts/         # Build scripts
├── scripts/             # Build + DX tooling
├── test/                # Skill validation + eval tests
│   ├── helpers/         # Test infrastructure
│   └── fixtures/        # Test data
├── .agents/skills/      # Skill symlink targets for Codex
├── docs/                # Documentation (user manual, planning)
├── qa/                  # /qa skill implementation
├── qa-only/             # /qa-only skill (report-only)
├── review/              # /review skill implementation
├── ship/                # /ship skill implementation
├── design-review/       # /design-review skill
├── plan-ceo-review/     # /plan-ceo-review skill
├── plan-eng-review/     # /plan-eng-review skill
├── plan-design-review/  # /plan-design-review skill
├── brainstorm/          # /brainstorm skill
├── investigate/         # /investigate skill
├── retro/               # /retro skill
├── focus-requirements/  # /focus-requirements skill
├── design-consultation/ # /design-consultation skill
├── document-release/    # /document-release skill
├── codex/               # /codex skill (adversarial review)
├── canary/              # /canary skill
├── freeze/              # /freeze skill
├── careful/             # /careful skill
├── guard/               # /guard skill
├── unfreeze/            # /unfreeze skill
├── benchmark/           # /benchmark skill
├── land-and-deploy/     # /land-and-deploy skill
├── setup-deploy/        # /setup-deploy skill
├── setup-browser-cookies/ # /setup-browser-cookies skill
├── spec-first-upgrade/  # /spec-first-upgrade skill
├── .spec-first/         # Local state (browse.json, logs)
└── bin/                 # Helper scripts (update-check, config, etc.)
```

## Directory Purposes

**`browse/`:**
- Purpose: Headless browser CLI and persistent server
- Contains: TypeScript source, compiled binary, integration tests
- Key files: `browse/src/cli.ts` (entry point), `browse/src/server.ts` (daemon), `browse/src/commands.ts` (registry)

**`scripts/`:**
- Purpose: Build tooling and DX utilities
- Contains: Skill doc generator, health dashboard, eval management CLI
- Key files: `scripts/gen-skill-docs.ts`, `scripts/skill-check.ts`, `scripts/eval-*.ts`

**`test/`:**
- Purpose: Test infrastructure and test suites
- Contains: Static validation, E2E tests, LLM-judge tests, helpers
- Key files: `test/skill-validation.test.ts`, `test/skill-e2e-*.test.ts`, `test/helpers/session-runner.ts`

**`test/helpers/`:**
- Purpose: Shared test infrastructure
- Contains: Session runners, LLM judge, eval persistence, touchfile system
- Key files: `test/helpers/session-runner.ts`, `test/helpers/llm-judge.ts`, `test/helpers/eval-store.ts`

**`test/fixtures/`:**
- Purpose: Test data and ground truth
- Contains: Planted-bug fixtures, ground truth JSON, eval baselines
- Key files: Various JSON fixtures for QA testing

**Skill directories (`qa/`, `review/`, `ship/`, etc.):**
- Purpose: Individual skill implementations
- Contains: `SKILL.md.tmpl` (template), `SKILL.md` (generated), optional `bin/` scripts
- Pattern: Each skill is self-contained with its own prompt template

**`.agents/skills/spec-first*/`:**
- Purpose: Symlink targets for Codex agent skills
- Contains: Symlinks back to root skill directories
- Pattern: `spec-first-{skill-name}` maps to `{skill-name}/`

**`.spec-first/`:**
- Purpose: Local runtime state
- Contains: `browse.json` (server state), log files, session files
- Key files: `browse.json`, `browse-console.log`, `browse-network.log`

## Key File Locations

**Entry Points:**
- `browse/src/cli.ts`: CLI entry point, server lifecycle
- `browse/src/server.ts`: HTTP server, Chromium daemon
- `browse/src/find-browse.ts`: Binary finder utility

**Configuration:**
- `package.json`: Build scripts, dependencies, version
- `browse/src/config.ts`: State file paths, directory resolution
- `browse/src/commands.ts`: Command registry (single source of truth)

**Core Logic:**
- `browse/src/browser-manager.ts`: Chromium lifecycle, state management
- `browse/src/snapshot.ts`: Accessibility tree parsing, ref generation
- `browse/src/read-commands.ts`: Read-only operations (text, html, links, etc.)
- `browse/src/write-commands.ts`: Mutating operations (goto, click, fill, etc.)
- `browse/src/meta-commands.ts`: Server control, tabs, screenshots

**Testing:**
- `test/skill-validation.test.ts`: Tier 1 static validation (free, <1s)
- `test/gen-skill-docs.test.ts`: Template generator quality checks
- `test/skill-e2e-*.test.ts`: Tier 2 E2E tests (paid, diff-based)
- `test/skill-llm-eval.test.ts`: Tier 3 LLM-judge evaluations

**Build:**
- `scripts/gen-skill-docs.ts`: Template → SKILL.md generator
- `scripts/skill-check.ts`: Health dashboard for all skills
- `scripts/dev-skill.ts`: Watch mode with auto-regeneration

## Naming Conventions

**Files:**
- TypeScript source: `kebab-case.ts` (e.g., `browser-manager.ts`, `read-commands.ts`)
- Test files: `*.test.ts` (e.g., `skill-validation.test.ts`)
- Skill templates: `SKILL.md.tmpl`
- Generated skills: `SKILL.md`
- Shell scripts: `kebab-case` (no extension)

**Directories:**
- Skill directories: `kebab-case` (e.g., `design-review`, `plan-ceo-review`)
- Source directories: lowercase (e.g., `src/`, `test/`, `scripts/`)

**Commands:**
- Browse commands: lowercase single word or hyphenated (e.g., `goto`, `cookie-import`)
- Snapshot flags: short (`-i`) and long (`--interactive`) forms

## Where to Add New Code

**New Browse Command:**
1. Add command to appropriate set in `browse/src/commands.ts` (`READ_COMMANDS`, `WRITE_COMMANDS`, or `META_COMMANDS`)
2. Add description to `COMMAND_DESCRIPTIONS` with category, description, and optional usage
3. Implement handler in appropriate commands file (`read-commands.ts`, `write-commands.ts`, or `meta-commands.ts`)
4. Rebuild: `bun run build`
5. Add tests in `browse/test/`

**New Snapshot Flag:**
1. Add flag metadata to `SNAPSHOT_FLAGS` array in `browse/src/snapshot.ts`
2. Update `SnapshotOptions` interface with new option
3. Implement flag logic in `handleSnapshot()`
4. Rebuild: `bun run build` (regenerates SKILL.md files with new flag)

**New Skill:**
1. Create directory: `mkdir <skill-name>`
2. Create template: `touch <skill-name>/SKILL.md.tmpl`
3. Add frontmatter with name, version, description, allowed-tools
4. Run `bun run gen:skill-docs` to generate initial SKILL.md
5. Add symlink target in `.agents/skills/` if supporting Codex

**New E2E Test:**
1. Create test file: `test/skill-e2e-{category}.test.ts`
2. Define touchfile dependencies in `test/helpers/touchfiles.ts`
3. Use `runSkillTest()` from session-runner
4. Add to test selection in `package.json` scripts

**New Helper Utility:**
1. Add script to `scripts/` directory
2. Add npm script to `package.json` if CLI-facing
3. Update CLAUDE.md with usage documentation

## Special Directories

**`~/.spec-first/`:**
- Purpose: User-wide configuration and state
- Contains: `lang` (language preference), `proactive` (suggestion setting), analytics
- Generated: Yes (auto-created on first use)
- Committed: No (user-specific)

**`~/.spec-first-dev/`:**
- Purpose: Development-time artifacts
- Contains: `evals/` (eval results), `e2e-runs/` (test transcripts), `plans/` (local planning docs)
- Generated: Yes (created by test infrastructure)
- Committed: No (development-only)

**`~/.claude/skills/spec-first/`:**
- Purpose: Active skill installation for Claude Code
- Contains: Symlink to working directory (dev mode) or copy (installed)
- Generated: Yes (via `setup` script)
- Committed: No (installation artifact)

**`browse/dist/`:**
- Purpose: Compiled binaries and server bundles
- Contains: `browse` (compiled CLI), `find-browse`, `server-node.mjs` (Windows fallback)
- Generated: Yes (by `bun run build`)
- Committed: Yes (binaries are versioned)

**`docs/用户手册/`:**
- Purpose: User-facing documentation (Chinese)
- Contains: Installation guide, skill list, FAQ, best practices
- Generated: Partial (some files manually maintained)
- Committed: Yes

---

*Structure analysis: 2026-03-23*
