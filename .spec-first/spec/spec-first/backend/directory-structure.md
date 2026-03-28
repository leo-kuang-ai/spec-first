# Directory Structure

> How backend code is organized in this project.

---

## Overview

This is a TypeScript CLI tool with a modular architecture. Code is organized by function:
- **Commands** - CLI command implementations
- **Configurators** - Platform-specific setup logic
- **Templates** - Template files for user projects
- **Types** - Shared TypeScript types
- **Utils** - Shared utility functions

---

## Directory Layout

```
packages/cli/src/
├── cli/
│   └── index.ts              # CLI entry point (commander)
├── commands/
│   ├── init.ts               # Initialize spec-first in project
│   └── update.ts             # Update existing installation
├── configurators/
│   ├── index.ts              # Platform registry
│   ├── shared.ts             # Shared configurator utilities
│   ├── claude.ts             # Claude Code configurator
│   ├── cursor.ts             # Cursor configurator
│   └── ...                   # Other platform configurators
├── templates/
│   ├── claude/               # Claude Code templates
│   ├── cursor/               # Cursor templates
│   └── ...                   # Other platform templates
├── types/
│   ├── ai-tools.ts           # Platform registry (AI_TOOLS)
│   └── migration.ts          # Migration types
├── utils/
│   ├── file.ts               # File operations
│   └── ...                   # Other utilities
├── config/
│   └── brand.ts              # Branding configuration
└── constants/
    ├── paths.ts              # Path constants
    └── version.ts            # Version info
```

---

## Module Organization

### Adding a New Platform

When adding support for a new AI coding tool:

1. Add entry to `src/types/ai-tools.ts` → `AI_TOOLS` registry
2. Create `src/configurators/{platform}.ts`
3. Create `src/templates/{platform}/` directory
4. Register in `src/configurators/index.ts` → `PLATFORM_FUNCTIONS`
5. Add CLI flag in `src/cli/index.ts`

### Configurator Pattern

Each platform configurator exports a function that:
- Takes `projectRoot` and `options` as parameters
- Copies templates to the appropriate location
- Returns success/failure status

Example: `src/configurators/claude.ts`

---

## Naming Conventions

- **Files**: kebab-case (e.g., `ai-tools.ts`, `file-utils.ts`)
- **Directories**: kebab-case (e.g., `configurators/`, `templates/`)
- **Platform names**: Match the tool's official name (e.g., `claude`, `cursor`, `codex`)

---

## Examples

Well-organized modules:
- `src/configurators/claude.ts` - Clean platform configurator
- `src/types/ai-tools.ts` - Registry pattern with const assertions
- `src/commands/init.ts` - Command implementation with proper error handling
