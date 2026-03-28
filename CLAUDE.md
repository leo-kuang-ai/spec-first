# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

spec-first is a multi-platform AI coding workflow tool distributed as an npm package. It generates platform-specific configuration files (`.claude/`, `.cursor/`, `.codex/`, etc.) that enable spec-driven development with task management, context injection, and session memory.

## Development Commands

```bash
# Build (compile TypeScript + copy templates)
pnpm build

# Run tests
pnpm test                    # All tests
pnpm test:watch              # Watch mode
vitest run test/path.test.ts # Single test file

# Code quality
pnpm lint                    # ESLint on src/ and test/
pnpm lint:fix                # Auto-fix lint issues
pnpm typecheck               # TypeScript type check
pnpm format                  # Prettier format

# Python scripts (in .spec-first/scripts/)
pnpm lint:py                 # basedpyright on Python files
```

## Architecture

### Core Structure

```
packages/cli/
├── src/
│   ├── cli/index.ts          # CLI entry point (commander)
│   ├── commands/             # init.ts, update.ts
│   ├── configurators/        # Platform-specific setup functions
│   ├── templates/            # Template files for each platform
│   ├── types/ai-tools.ts     # Platform registry (AI_TOOLS)
│   └── utils/                # Shared utilities
└── test/                     # Vitest tests (mirrors src/ structure)
```

### Platform Registry Pattern

`src/types/ai-tools.ts` is the single source of truth for platform data. When adding a new platform:

1. Add entry to `AI_TOOLS` registry
2. Create `src/configurators/{platform}.ts`
3. Create `src/templates/{platform}/` directory
4. Register in `src/configurators/index.ts` → `PLATFORM_FUNCTIONS`
5. Add CLI flag in `src/cli/index.ts`

### Template System

Templates are copied to `dist/templates/` during build. Each platform has:
- `index.ts` — exports template content as strings
- Template files organized by category (commands, skills, etc.)

### Python Scripts

The `.spec-first/scripts/` directory contains Python utilities for task management:
- `task.py` — Create, start, finish, archive tasks
- `get_context.py` — Get session context
- `add_session.py` — Record session to journal

These scripts are installed into user projects and provide the runtime workflow.

## Code Conventions

- **TypeScript ESM**: Uses `.js` extensions in imports (required for ESM)
- **Const assertions**: Use `as const` for registries and type inference
- **Error handling**: Use `chalk.red()` for error messages, `process.exit(1)` for failures
- **File paths**: Use `node:path` and `node:fs` modules

## Test Patterns

- Integration tests use real file system operations in temp directories
- Unit tests focus on pure functions (template content, utilities)
- Test files mirror src structure: `test/commands/init.test.ts` for `src/commands/init.ts`
