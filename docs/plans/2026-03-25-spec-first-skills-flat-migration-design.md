# Spec-First Skills Flat Migration Design

Date: 2026-03-25

## Goal

Flatten `skills/spec-first/*` into `skills/*` with no compatibility layer, while keeping the command namespace `spec-first:*` unchanged.

## Inventory

Legacy-path inventory was captured with:

```bash
rg -n 'skills/spec-first|~/.spec-first/skills/spec-first|~/.codex/skills/spec-first' src tests scripts skills README* PROJECT-INTRODUCTION.md docs
```

The inventory shows legacy references still exist in runtime code, tests, docs, and project introduction materials. Historical docs may keep those references, but current docs and runtime-facing assets may not.

## Final Execution Boundary

- `skills/` is the only runtime source root.
- `~/.spec-first/skills/` is the only spec-first user cache root.
- `~/.codex/skills/` is flat.
- `.claude/commands/spec-first/` remains grouped by command namespace.
- Historical docs may retain old paths, current docs may not.

## Non-Goals

- No backward-compatibility layer for `skills/spec-first/*`.
- No alternate runtime source roots.
- No nested cache layout under `~/.spec-first/skills/spec-first/`.
- No change to the `spec-first:*` command namespace.

## Guardrails

1. Treat `skills/*` as the authoritative runtime layout for current code and tests.
2. Treat `~/.spec-first/skills/*` as the authoritative user cache layout for spec-first skills.
3. Keep deploy-time command grouping under `.claude/commands/spec-first/` only.
4. Allow old-path references only in historical documentation or migration evidence.

