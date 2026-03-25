# Directory Structure

> How backend code is organized in this project.

---

## Overview

This is a TypeScript CLI project using Node.js ESM modules. The codebase follows a feature-based organization with clear separation between CLI, commands, configurators, templates, and utilities.

---

## Directory Layout

```
packages/cli/src/
├── cli/                    # CLI entry point and command definitions
│   └── index.ts            # Commander.js setup, option parsing
├── commands/               # Command implementations (init, update)
│   ├── init.ts             # `spec-first init` command
│   └── update.ts           # `spec-first update` command
├── configurators/          # Platform-specific configuration logic
│   ├── index.ts            # Platform registry and helper functions
│   ├── claude.ts           # Claude Code configurator
│   ├── cursor.ts           # Cursor configurator
│   ├── iflow.ts            # iFlow CLI configurator
│   └── ...                 # Other platform configurators
├── templates/              # Template files for each platform
│   ├── claude/             # Claude Code templates
│   ├── cursor/             # Cursor templates
│   ├── common/             # Shared templates
│   └── ...                 # Other platform templates
├── types/                  # TypeScript type definitions
│   ├── ai-tools.ts         # AI tool types and registry
│   └── migration.ts        # Migration types
├── utils/                  # Utility functions
│   ├── file-writer.ts      # File writing with conflict handling
│   ├── project-detector.ts # Project type detection
│   ├── template-fetcher.ts # Remote template downloading
│   └── ...                 # Other utilities
├── constants/              # Constants and configuration
│   ├── paths.ts            # Path constants
│   └── version.ts          # Version info
├── config/                 # Branding and config
│   └── brand.ts            # Brand configuration
└── index.ts                # Package entry point
```

---

## Module Organization

### Adding a New Platform

When adding a new AI tool platform:

1. **Add to types**: Update `AI_TOOLS` in `src/types/ai-tools.ts`
2. **Create configurator**: Add `src/configurators/{platform}.ts`
3. **Create templates**: Add `src/templates/{platform}/`
4. **Register**: Add to `PLATFORM_FUNCTIONS` in `src/configurators/index.ts`
5. **Add CLI flag**: Update `src/cli/index.ts` and `InitOptions` in `src/commands/init.ts`

### Feature Module Pattern

Each major feature should follow this pattern:

```
feature/
├── index.ts          # Public exports
├── types.ts          # Feature-specific types
├── implementation.ts # Core logic
└── utils.ts          # Feature utilities
```

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `file-writer.ts`, `project-detector.ts` |
| Directories | kebab-case | `configurators/`, `multi-agent/` |
| Functions | camelCase | `getPythonCommand()`, `writeFile()` |
| Classes/Types | PascalCase | `AITool`, `WriteOptions`, `InitOptions` |
| Constants | UPPER_SNAKE_CASE | `AI_TOOLS`, `PLATFORM_FUNCTIONS`, `DIR_NAMES` |
| Private module vars | camelCase with leading underscore | `_cliFlagCheck` |

---

## Import Style

```typescript
// 1. Node.js built-ins (with "node:" prefix)
import fs from "node:fs";
import path from "node:path";

// 2. External packages
import chalk from "chalk";
import { Command } from "commander";

// 3. Internal modules (with .js extension for ESM)
import { init } from "../commands/init.js";
import { BRAND } from "../config/brand.js";
```

**Important**: Always use `.js` extension in imports even for `.ts` files (required for ESM compatibility).

---

## Examples

### Well-organized modules

- **`src/configurators/index.ts`** - Clean registry pattern with derived helpers
- **`src/types/ai-tools.ts`** - Single source of truth for platform data
- **`src/utils/file-writer.ts`** - Focused utility with clear interface
