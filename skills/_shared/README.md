# Shared references

Edit shared wording in `skills/_shared/references/`. Each listed package ships and reads its own `references/<file>` so it also works when installed alone. The distribution map is `SYNC_MAP` in [`scripts/sync-shared-references.js`](../../scripts/sync-shared-references.js); a reader of a resulting plan, glossary, ticket or learning is not another copy target.

| Shared source | Packages receiving a copy | When the package reads it |
|---|---|---|
| `html-rendering.md` | `spec-plan`, `spec-ideate`, `spec-brainstorm` | Present the selected artifact as a single HTML document; its producer's section contract supplies the content. |
| `markdown-rendering.md` | `spec-plan`, `spec-ideate`, `spec-brainstorm` | Present the selected artifact in Markdown, preserving producer-owned headings, metadata and IDs. |
| `concepts-vocabulary.md` | `spec-compound`, `spec-compound-refresh` | Capture or maintain project terms in `CONCEPTS.md`; lightweight capture can update but not seed a glossary. |
| `settled-decisions.md` | `spec-plan`, `spec-brainstorm` | Carry examined user choices into their owning technical or product decision without asking again or inventing assent. |
| `tracker-defer.md` | `spec-work`, `spec-lfg` | File explicitly deferred findings at an authorized destination. `spec-work` owns the policy; `spec-lfg` uses the non-interactive mode. |
| `yaml-schema.md` | `spec-compound`, `spec-compound-refresh` | Consult the frontmatter guide alongside the package's `schema.yaml` when classifying or materially rewriting a learning. |

After editing a source, run `npm run sync:shared-references`, then `npm run check:shared-references`. The check is read-only: it reports each registered package path and detects missing or divergent copies. It does not discover new consumers or validate artifact quality. When adding a shared source, add its intended targets to `SYNC_MAP` and update the table before syncing.

**Matching names are not a distribution rule.** `cross-model-review.md`, `review-output-template.md`, `subagent-template.md`, `intake.md`, `interview.md`, `pipeline-return.md` and `synthesis-summary.md` have package-specific callers and outputs. Even the similar `model-tiers.md` files retain different evidence on fallback: brainstorm needs the grounding dossier and claim checks; sweep needs retrieved media and per-finding evidence. Do not synchronize an entire file by basename.
