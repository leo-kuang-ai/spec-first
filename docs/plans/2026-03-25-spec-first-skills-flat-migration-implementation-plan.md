# Spec-First Skills Flat Migration Implementation Plan

## Task 1: Inventory and Guardrail Setup

### Scope

- Capture the old-path inventory with `rg` across `src/`, `tests/`, `scripts/`, `skills/`, `README*`, `PROJECT-INTRODUCTION.md`, and `docs/`.
- Update the migration design doc with the final execution boundary.

### Output

- Design doc states the runtime/cache/layout boundary explicitly.
- Legacy-path inventory is recorded as migration evidence.

### Verification

- Confirm the design doc says:
  - `skills/` is the only runtime source root
  - `~/.spec-first/skills/` is the only spec-first user cache root
  - `~/.codex/skills/` is flat
  - `.claude/commands/spec-first/` remains grouped by command namespace
  - historical docs may retain old paths, current docs may not

