# Spec System

Maintain coding standards that guide AI development. Supports single-repo and monorepo layouts with dynamic discovery.

---

## Directory Structure

### Single Repo

```
.spec-first/spec/
├── frontend/                   # Frontend guidelines
│   ├── index.md                # Overview and quick reference
│   ├── component-guidelines.md
│   └── ...
│
├── backend/                    # Backend guidelines
│   ├── index.md
│   ├── directory-structure.md
│   └── ...
│
└── guides/                     # Thinking guides (shared)
    ├── index.md
    ├── cross-layer-thinking-guide.md
    ├── code-reuse-thinking-guide.md
    └── cross-platform-thinking-guide.md
```

### Monorepo (Per-Package)

When `packages:` is defined in `config.yaml`, specs are organized per-package:

```
.spec-first/spec/
├── cli/                        # Package: cli
│   ├── backend/
│   │   ├── index.md
│   │   └── *.md
│   └── unit-test/
│       ├── index.md
│       └── *.md
│
├── docs-site/                  # Package: docs-site
│   └── docs/
│       ├── index.md
│       └── *.md
│
└── guides/                     # Shared across all packages
    ├── index.md
    └── *.md
```

**Discovery**: `python3 .spec-first/scripts/get_context.py --mode packages` lists all packages, paths, types, and spec layers.

---

## Spec Categories

### Package-Specific Layers

Each package can have its own set of layers (subdirectories):

| Layer | Content |
|-------|---------|
| `frontend/` | UI, components, state management, styling |
| `backend/` | API, services, database, error handling |
| `unit-test/` | Test conventions, mock strategies, integration patterns |
| `docs/` | Documentation guidelines |
| `shared/` | Cross-layer standards (TypeScript, git, quality) |
| `big-question/` | Deep-dive technical investigations |

### Guides (`guides/`)

Cross-cutting thinking guides shared across all packages:

- How to think about cross-layer changes
- Code reuse strategies
- Platform considerations

---

## Index Files

Each layer has an `index.md` that:

1. Provides category overview
2. Lists all specs with links
3. Includes a **Pre-Development Checklist**
4. Includes a **Quality Check** section

### Example: `cli/backend/index.md`

```markdown
# Backend Development Guidelines

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Directory Structure](./directory-structure.md) | Module organization | Done |
| [Error Handling](./error-handling.md) | Error strategies | Done |

## Pre-Development Checklist

Before writing backend code, read:
- Error handling → error-handling.md
- Logging → logging-guidelines.md

## Quality Check

After writing code:
1. Run `pnpm lint && pnpm typecheck`
2. Check relevant guidelines
```

---

## Dynamic Spec Discovery

The session-start hook dynamically discovers spec directories instead of hardcoding `frontend/backend/guides`:

1. Iterates all subdirectories under `.spec-first/spec/`
2. For monorepo: iterates `spec/<package>/<layer>/`
3. Reads `index.md` from each discovered layer
4. Injects all found indexes into session context

This means adding a new spec category only requires creating the directory — no hook modification needed.

### Spec Scope Filtering

In monorepo projects, `session.spec_scope` in `config.yaml` controls which packages' specs are loaded:

```yaml
session:
  spec_scope: active_task    # Only load specs for the current task's package
```

---

## Using Specs

### In JSONL Context Files

Reference specs in task context:

```jsonl
{"file": ".spec-first/spec/cli/backend/index.md", "reason": "Backend overview"}
{"file": ".spec-first/spec/cli/backend/error-handling.md", "reason": "Error patterns"}
```

### Manual Reading (Non-Hook Platforms)

Read specs at session start:

```
1. Read .spec-first/spec/{package}/{layer}/index.md
2. Follow the Pre-Development Checklist
3. Read specific guidelines as needed
```

---

## Creating New Specs

### 1. Choose Location

- Single repo: `.spec-first/spec/<layer>/`
- Monorepo: `.spec-first/spec/<package>/<layer>/`

### 2. Create Spec File

```bash
touch .spec-first/spec/cli/backend/new-pattern.md
```

### 3. Follow Format

````markdown
# [Spec Title]

## Overview
Brief description.

## Guidelines

### 1. [Guideline Name]

**Do:**
```typescript
// Good example
```

**Don't:**
```typescript
// Bad example
```

## Related Specs
- [Related Spec](./related-spec.md)
````

### 4. Update Index

Add to the layer's `index.md` Guidelines Index table.

### 5. Reference in JSONL

Add to relevant task context files.

---

## Best Practices

1. **Keep specs focused** - One topic per file
2. **Use examples** - Show do/don't patterns
3. **Link related specs** - Cross-reference
4. **Update regularly** - Specs evolve with codebase
5. **Index everything** - Keep index files current
6. **Guides are shared** - Put cross-package concerns in `guides/`
