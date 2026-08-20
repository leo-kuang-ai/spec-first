# Shared References

Canonical sources for references used by multiple skills. Each skill maintains a self-contained copy in its own `references/` directory for independent distribution (per `skills-lock.json` model), but maintenance happens here.

## Files

- `html-rendering.md` — HTML plan/doc rendering principles (637 lines)
  - Used by: `spec-plan`, `spec-ideate`, `spec-brainstorm`
  - Defines Goal Capsule, section types, responsive design, theme-aware CSS
- `markdown-rendering.md` — Markdown plan/doc rendering principles (350 lines)
  - Used by: `spec-plan`, `spec-ideate`, `spec-brainstorm`
  - Defines section types, code fences, tables, front matter
- `concepts-vocabulary.md` — Compound workflow terminology (88 lines)
  - Used by: `spec-compound`, `spec-compound-refresh`
  - Defines artifact, aspect, horizon, durable knowledge, synthesis
- `settled-decisions.md` — How to document decisions in plans (124 lines)
  - Used by: `spec-plan`, `spec-brainstorm`
  - Decision record format, rationale, alternatives, constraints
- `tracker-defer.md` — Deferred work tracking contract (156 lines)
  - Used by: `spec-work`, `spec-lfg`
  - Format for parking out-of-scope work, follow-up conditions
- `yaml-schema.md` — Compound YAML schema reference (267 lines)
  - Used by: `spec-compound`, `spec-compound-refresh`
  - Full schema, validation rules, examples

**Total**: 6 files, 16 copies synced (was 19 before html-rendering.md漂移修复)

**Known drift (not yet synced)**: 8 file groups with diverged copies require manual merge decision:
- `cross-model-review.md` (2 versions), `intake.md` (2), `interview.md` (3)
- `model-tiers.md` (2), `pipeline-return.md` (2), `review-output-template.md` (2)
- `subagent-template.md` (3), `synthesis-summary.md` (2)

## Sync Workflow

**After editing a shared reference:**

```bash
npm run sync:shared-references
```

This copies `_shared/references/*.md` to each skill's `references/` directory per the map in `scripts/sync-shared-references.js`.

**CI check (detects drift):**

```bash
npm run check:shared-references
```

Exit code 1 if any per-skill copy diverges from its shared source. Run this in CI to catch manual edits to copies.

## Why Not Symlinks or Cross-Skill Paths?

Skills are designed for independent distribution (`skills-lock.json` shows external skills like `autoresearch`, `baoyu-*` pulled from other repos). Cross-skill references (`../spec-plan/references/html-rendering.md`) would break when a skill is distributed alone. Duplication with sync script preserves self-containment.

## Adding a New Shared Reference

1. Move the canonical version to `skills/_shared/references/`
2. Add the source → targets mapping to `SYNC_MAP` in `scripts/sync-shared-references.js`
3. Run `npm run sync:shared-references`
4. Commit all files (shared source + per-skill copies)
