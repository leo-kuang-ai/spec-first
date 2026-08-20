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

**Reviewed 2026-08-20 (see `docs/10-prompt/spec-first代码审查方案.md` Step 2 P2)**: the 8 file groups previously listed here as "known drift requiring manual merge decision" were re-diffed. 7 of the 8 are independently authored content that happen to share a filename — titles diverge from line 1 (e.g. `cross-model-review.md`: "Cross-Model Adversarial Pass" vs "Cross-Model Whole-Document Pass", backed by different scripts and gate structures; `intake.md`, `interview.md`, `pipeline-return.md`, `review-output-template.md`, `subagent-template.md`, `synthesis-summary.md` are the same pattern). These are correctly independent — not drift, no merge action needed, no consumer/owner ambiguity to resolve.

**One real candidate**: `model-tiers.md` (`skills/spec-sweep/references/`, `skills/spec-brainstorm/references/`) has identical structure — same four sections (extraction/generation/ceiling tier + degradation rule), same sentence patterns, only the worker-role nouns differ (e.g. "media-analyzer workers" vs "claim verifier"). This looks like a shared template with skill-specific nouns substituted in, not independent authorship. Not added to `SYNC_MAP` yet: the skill-specific nouns are load-bearing content, not incidental — syncing the shared scaffolding would require extracting a parameterized template (nouns as variables), which is a bigger change than the sync script currently supports. Left as an open `architecture-mismatch` note rather than force-synced.

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
