# Directory Structure

> How frontend code is organized in this project.

---

## Overview

**Note**: This is primarily a CLI backend project with no traditional frontend (React/Vue/etc.). The "frontend" patterns here refer to the TypeScript module organization used throughout the codebase.

---

## Directory Layout

```
packages/cli/src/
├── cli/                    # CLI entry point
│   └── index.ts            # Commander.js setup
├── commands/               # Command implementations
│   ├── init.ts             # spec-first init
│   └── update.ts           # spec-first update
├── configurators/          # Platform configuration
│   ├── index.ts            # Platform registry
│   ├── claude.ts           # Claude Code setup
│   ├── cursor.ts           # Cursor setup
│   └── shared.ts           # Shared utilities
├── templates/              # Template content
│   ├── claude/             # Claude templates
│   ├── cursor/             # Cursor templates
│   ├── common/             # Shared templates
│   └── extract.ts          # Template extraction
├── types/                  # TypeScript types
│   ├── ai-tools.ts         # Platform types
│   └── migration.ts        # Migration types
├── utils/                  # Utility functions
│   ├── file-writer.ts      # File operations
│   ├── project-detector.ts # Detection logic
│   └── template-fetcher.ts # Remote templates
├── constants/              # Constants
│   ├── paths.ts            # Path constants
│   └── version.ts          # Version info
└── config/                 # Configuration
    └── brand.ts            # Branding config
```

---

## Module Organization

### Entry Points

- `src/index.ts` - Package entry, re-exports version
- `src/cli/index.ts` - CLI entry with Commander setup

### Feature Modules

Each feature follows this pattern:

```
feature/
├── index.ts          # Public API
├── types.ts          # Feature types (if needed)
├── implementation.ts # Core logic
└── utils.ts          # Feature utilities (if needed)
```

### Adding a New Platform

1. Add to `src/types/ai-tools.ts`:
   - Add to `AITool` type
   - Add to `CliFlag` type
   - Add config to `AI_TOOLS`

2. Create configurator `src/configurators/{platform}.ts`

3. Create templates `src/templates/{platform}/`

4. Register in `src/configurators/index.ts`

5. Add CLI flag in `src/cli/index.ts`

6. Add to `InitOptions` in `src/commands/init.ts`

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Directories | kebab-case | `configurators/`, `multi-agent/` |
| Files | kebab-case | `file-writer.ts`, `project-detector.ts` |
| Functions | camelCase | `getConfiguredPlatforms()` |
| Types/Interfaces | PascalCase | `AIToolConfig`, `InitOptions` |
| Constants | UPPER_SNAKE_CASE | `AI_TOOLS`, `DIR_NAMES` |

---

## Import Patterns

```typescript
// 1. Node built-ins with "node:" prefix
import fs from "node:fs";
import path from "node:path";

// 2. External packages
import chalk from "chalk";
import { Command } from "commander";

// 3. Internal modules with .js extension
import { init } from "../commands/init.js";
import { BRAND } from "../config/brand.js";
```

---

## Examples

### Well-organized modules

- `src/configurators/index.ts` - Clean registry pattern
- `src/types/ai-tools.ts` - Single source of truth
- `src/utils/file-writer.ts` - Focused utility module
