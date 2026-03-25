# Database Guidelines

> Database patterns and conventions for this project.

---

## Overview

**This project does not use a database.** It is a CLI tool that operates on the filesystem and does not persist data.

---

## Data Persistence

Instead of a database, this project uses:

| Storage | Purpose |
|---------|---------|
| `.spec-first/tasks/*.json` | Task tracking |
| `.spec-first/workspace/*/journal-*.md` | Session journals |
| `.spec-first/.version` | Version tracking |
| `.spec-first/.developer` | Developer identity |
| `config.yaml` | Project configuration |

---

## File-based Data Patterns

When working with JSON files:

```typescript
// Read
const content = fs.readFileSync(filePath, "utf-8");
const data = JSON.parse(content) as TaskJson;

// Write
fs.writeFileSync(filePath, JSON.stringify(taskJson, null, 2), "utf-8");
```

### Safe file operations

```typescript
// Check existence first
if (!fs.existsSync(filePath)) {
  return; // or handle missing file
}

// Use recursive for directories
fs.mkdirSync(dirPath, { recursive: true });
```

---

## No Migrations Needed

Since there is no database, schema changes are handled by:
1. Updating TypeScript interfaces
2. Providing default values for new fields
3. Version compatibility in `update` command
