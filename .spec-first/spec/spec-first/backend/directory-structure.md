# Directory Structure

> How TypeScript/Node.js code is organized in this project.

---

## Overview

spec-first is a multi-platform AI coding workflow tool distributed as an npm package. The codebase follows a modular architecture with clear separation between CLI, commands, configurators, templates, and utilities.

---

## Directory Layout

```
packages/cli/
├── src/
│   ├── cli/                    # CLI entry point and command parsing
│   │   └── index.ts            # Commander CLI setup
│   ├── commands/               # CLI command implementations
│   │   ├── init.ts             # `spec-first init` command
│   │   └── update.ts           # `spec-first update` command
│   ├── configurators/          # Platform-specific setup functions
│   │   ├── index.ts            # Exports PLATFORM_FUNCTIONS registry
│   │   ├── claude.ts           # Claude Code configuration
│   │   ├── cursor.ts           # Cursor configuration
│   │   ├── codex.ts            # Codex CLI configuration
│   │   └── ...                 # Other platform configurators
│   ├── templates/              # Template files for each platform
│   │   ├── claude/             # Claude Code templates
│   │   │   ├── commands/       # Slash commands (.md)
│   │   │   ├── agents/         # Agent definitions (.md)
│   │   │   ├── hooks/          # Python hooks (.py)
│   │   │   └── settings.json   # Hook configurations
│   │   ├── spec-first/         # Core spec-first templates
│   │   │   └── scripts/        # Python runtime scripts
│   │   └── index.ts            # Template exports
│   ├── types/                  # TypeScript type definitions
│   │   ├── ai-tools.ts         # Platform registry (AI_TOOLS)
│   │   └── migration.ts        # Migration types
│   ├── utils/                  # Shared utilities
│   │   ├── file-writer.ts      # File writing with conflict handling
│   │   ├── template-fetcher.ts # Template download utilities
│   │   └── project-detector.ts # Monorepo/package detection
│   ├── config/                 # Configuration constants
│   │   ├── brand.ts            # Branding constants
│   │   └── paths.ts            # Path constants
│   ├── constants/              # Other constants
│   └── migrations/             # Migration manifests
└── test/                       # Vitest tests (mirrors src/ structure)
```

---

## Module Organization

### Adding a New Platform

When adding a new AI tool platform, follow this pattern:

1. **Add entry to `AI_TOOLS` registry** in `src/types/ai-tools.ts`:

```typescript
"new-tool": {
  name: "New Tool",
  templateDirs: ["common", "new-tool"],
  configDir: ".new-tool",
  cliFlag: "new-tool",
  defaultChecked: false,
  hasPythonHooks: false,
},
```

2. **Create configurator** in `src/configurators/new-tool.ts`:

```typescript
export async function configureNewTool(cwd: string): Promise<void> {
  // Copy templates to target directory
}
```

3. **Create templates** in `src/templates/new-tool/`:

```
src/templates/new-tool/
├── commands/spec/    # Platform-specific commands
└── index.ts          # Template exports
```

4. **Register in `src/configurators/index.ts`**:

```typescript
import { configureNewTool } from "./new-tool.js";

export const PLATFORM_FUNCTIONS: Record<CliFlag, PlatformConfigFn> = {
  // ...
  newTool: configureNewTool,
};
```

5. **Add CLI flag** in `src/cli/index.ts` and `src/commands/init.ts`

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| File names | `kebab-case.ts` | `file-writer.ts`, `project-detector.ts` |
| Class names | `PascalCase` | `ProcessEngine`, `TemplateFetcher` |
| Function names | `camelCase` | `getToolConfig()`, `writeFile()` |
| Constants | `SCREAMING_SNAKE_CASE` | `AI_TOOLS`, `TIMEOUTS`, `PATHS` |
| Interfaces | `PascalCase` (no `I` prefix) | `AIToolConfig`, `WriteOptions` |
| Types | `PascalCase` | `AITool`, `CliFlag`, `WriteMode` |
| Enums | `PascalCase` | Not used (prefer union types) |

---

## Import Patterns

Use ESM with `.js` extensions (required for TypeScript ESM):

```typescript
// ✅ Correct - use node: prefix for built-ins
import fs from "node:fs";
import path from "node:path";

// ✅ Correct - use .js extension for local imports
import { writeFile } from "../utils/file-writer.js";
import { AI_TOOLS } from "../types/ai-tools.js";

// ❌ Wrong - missing .js extension
import { writeFile } from "../utils/file-writer";
```

---

## Examples

### Well-organized modules

- **`src/types/ai-tools.ts`** - Single source of truth for platform registry
- **`src/utils/file-writer.ts`** - Focused utility with clear responsibilities
- **`src/configurators/claude.ts`** - Clean configurator pattern

### Key patterns

1. **Registry pattern**: `AI_TOOLS` in `src/types/ai-tools.ts` is the single source of truth
2. **Configurator pattern**: Each platform has a dedicated configurator function
3. **Template organization**: Templates are grouped by platform and type
