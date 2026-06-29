# Existing Capability / Reuse Analysis

Use this reference as a plan-time Decision Lens when a plan proposes a new source surface. It keeps `reuse / extend / new` decisions explicit without turning every plan into a heavy template.

Load this reference only when the plan proposes adding or replacing one of these surfaces: files, references, agents, skills, scripts, helpers, templates, workflows, schemas, artifact contracts, source-of-truth entries, or source/runtime projection surfaces.

Do not load it for single-line prose fixes, docs-only small edits, clearly scoped bug fixes that only touch existing files, test assertion updates, changelog-only updates, or cases where the user explicitly named the exact new file and no system boundary changes.

## Existing Capability Inventory

Before proposing a new surface, inspect the current source of truth for similar capabilities:

- Existing `skills/`, `agents/`, `templates/`, `src/cli/`, `docs/contracts/`, and nearby tests.
- Existing references already loaded by `spec-plan`, especially `governance-boundaries.md`, `planning-flow.md`, `plan-template.md`, and domain-specific references.
- Existing helpers, command registries, schemas, eval fixtures, and runtime projection tests.
- Existing rejected or deferred rationale from current plans, review reports, or `docs/solutions/` when the plan already cites them.

Record only the evidence that materially changes the decision. Do not perform broad repo archaeology when a bounded search proves the answer.

## Reuse / Extend / New Decision

For each proposed new surface, choose one of:

- **Reuse** - Use an existing capability as-is and point the plan at it.
- **Extend** - Add focused behavior to an existing source-of-truth because it already owns the boundary.
- **New** - Create a new source surface because existing owners cannot absorb the decision without mixing concerns, creating a second truth source, or making the hot path too large.

The plan must explain the decision in one or two sentences. A useful decision names the rejected owner and the boundary reason:

```text
Reuse decision: create new `reuse-analysis.md` because `governance-boundaries.md`
owns context/evidence trust and `planning-flow.md` owns phase routing; neither should
own `reuse / extend / new` design decisions.
```

If the answer is `new`, also state the new source-of-truth and which older or adjacent paths remain advisory, generated, or out of scope.

## Ownership Boundaries

| Surface | Owns | Does not own |
| --- | --- | --- |
| `reuse-analysis.md` | Existing capability inventory, `reuse / extend / new` decisions, source-of-truth fit, new-surface necessity, work-phase recheck | Context trust policy, enterprise risk readiness, plan depth scoring, default template skeleton |
| `governance-boundaries.md` | Context/evidence/source-runtime/provider trust boundaries | Whether a new capability should exist |
| `planning-flow.md` | When the reuse decision lens is triggered in the planning flow | The full reuse rubric or ownership table |
| `plan-template.md` | Optional right-size place to show reuse decisions | A mandatory reuse matrix in every plan |
| `enterprise-plan-review.md` | Enterprise high-risk readiness triggers, hard gates, appendices, and rubric | General capability reuse decisions |

When these boundaries conflict, prefer adding a small pointer to the owner rather than duplicating the rubric.

## Non-Goals

- Do not judge product priority or business value.
- Do not let scripts decide whether a new surface is semantically justified.
- Do not replace deepening, review, or implementation verification.
- Do not require Lightweight plans to output a long reuse matrix.
- Do not treat generated runtime mirrors (`.claude/**`, `.codex/**`, `.agents/skills/**`) as existing capability source-of-truth.
- Do not encode organization-specific policy, forbidden technology lists, or compliance rules.
- Do not require a new helper, runner, schema, or telemetry source for this lens.

## Output Location

Keep the output proportional to the plan:

- For a small or medium plan, add one `Key Technical Decisions` entry or one `Reuse decision:` bullet in the relevant Implementation Unit `Approach`.
- For Deep plans or plans adding several new surfaces, add an optional `## Existing Capability / Reuse Analysis` section.
- Do not add a required section to the core plan skeleton.

Good minimal output:

```text
Reuse decision: extend `deepening-workflow.md` because it already owns confidence-first scoring; do not create a separate enterprise workflow.
```

## Work-Phase Recheck

`spec-work` must recheck the current source before implementing the new surface. If current source shows the plan's `new` decision is stale, prefer `reuse` or `extend`, then explain the deviation in closeout with direct evidence.

The implementation closeout should mention the recheck only when it changed the plan, found a stale assumption, or materially supports why a new source surface was still necessary.
