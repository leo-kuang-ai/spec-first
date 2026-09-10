---
name: spec-compound
description: Document a recently solved problem or durable project vocabulary in docs/solutions/ or CONCEPTS.md. Use when capturing a learning after work.
argument-hint: "[optional: brief context] [mode:headless] "
---

# spec-compound

## Project Intelligence Evidence Boundary

Use graph candidates only to locate material for a solution record. Durable knowledge promotion requires current source, tests, logs, docs, contracts, or owner evidence; `provider_untrusted` candidates, empty results, and handoff artifacts cannot become confirmed knowledge. Fall back to bounded direct reads when providers are unavailable.

**Outcome:** one solved problem becomes a source-grounded, reusable learning under `docs/solutions/`.
**Done:** the approved candidate is published, applicable validations pass, vocabulary capture is recorded (including no qualifying terms), and the mode's truthful completion report is emitted.

## Workflow Contract Summary

- **Inputs:** one recently solved and verified problem, or vocabulary grounded in that problem.
- **Outputs:** one learning with provenance, applicability, freshness, and an invalidation condition; optional local vocabulary maintenance.
- **Hard exits:** unresolved problem, insufficient verification, ambiguous target/source owner, or failed promotion leaves durable knowledge unpublished.
- **Authority:** current source/test/log and verified outcomes determine facts; the orchestrator judges reuse value and owns publication.
- **Consumers:** `spec-plan`, `spec-work`, `spec-debug`, `spec-code-review`, and project maintainers.

## Preconditions And Mode

Only capture reasoning that is not readily recoverable from final code, tests, or existing docs and whose loss would plausibly cause recurrence, material risk, or substantial rediscovery. Apply this counterfactual: if the learning document disappeared, would a future engineer reading the final implementation still be likely to repeat the mistake or redo substantial investigation? If not, write nothing. A completed task, large diff, or explicit invocation does not lower that bar. If no learning qualifies, write nothing and the completion report says why.

An existing learning that became materially inaccurate or incomplete qualifies because leaving it would mislead: update that learning instead of creating a duplicate.

Document one non-trivial solved problem per run. Process distinct learnings in separate sequential runs with fresh grounding; do not batch drafts and stitch cross-references afterward. If nothing is solved and verified, write nothing and report why.

A standalone request to bootstrap `CONCEPTS.md` belongs to `spec-compound-refresh`; exit this workflow after that handoff. This skill seeds only the learning's investigated area.

Read `references/modes.md` before any action. It owns invocation arguments, quoted-token preservation, depth selection, and dispatch authorization. Default to Full; Lightweight requires a low-risk, bounded, source-grounded learning backed by verification. High-risk material never downgrades merely because context is tight.

`mode:headless` runs Full without session history, blocking questions, optional candidate enhancement, or instruction-file edits. Emit `Documentation complete` only after successful publication; otherwise report the failure, no-op, or exact partial publication.

## Write And Evidence Boundaries

- Only the orchestrator writes product files. Research roles use verified owner-private scratch; missing dispatch authorization runs the same roles inline or serially, without independent coverage claims.
- Prepare learning and vocabulary candidates privately. Final paths stay untouched until semantic promotion and target existence/SHA-256 rechecks succeed. Per-target atomic replacement is not a multi-target transaction.
- Current source is the authority. Preserve direct source refs, revision/freshness, applicability, and invalidation. History, memory, and provider candidates are advisory.
- Session-history reads require explicit restricted-read authorization independently of dispatch. Missing authorization skips discovery without inspecting private roots.
- Instruction-file edits require authorized interactive Full scope; headless and Lightweight only report gaps. Cross-document maintenance belongs to a scoped `spec-compound-refresh` handoff.
- No source-code mutation, commit, push, or generated-runtime edit is authorized by this skill.

## Full Mode

Read each reference when its step is reached, before executing that step. Resolve skill-local paths from the directory containing this `SKILL.md`; user-repo paths remain relative to the selected repo.

1. **Research:** read `references/research.md`; create verified private scratch and execute the three research roles. Read and include the actual schema, category guide, and selected prompt contents needed by each authorized worker.
2. **Session history:** read `references/session-history.md` only for an eligible, separately authorized interactive Full run. It is a Phase 1 input; skipped, failed, or irrelevant history must be recorded, then continue to assembly.
3. **Assembly and grounding:** wait for all started research and history inputs; read `references/assembly.md`. Assemble candidates, validate frontmatter/promotion shape, capture vocabulary, and ground claims.
4. **Optional enhancement:** read `references/enhancement.md` only when an interactive Full candidate benefits from a specialized check. Revalidate changed candidates before promotion.
5. **Publication:** read `references/promotion.md` and make the semantic promotion decision. Recheck targets before publishing approved candidates; report partial failures exactly.
6. **Refresh and discoverability:** after successful publication, read `references/refresh-and-discoverability.md`. Preserve the mode's edit boundaries and keep follow-ups narrowly scoped.
7. **Report:** read `references/report.md`; emit the actual output, checks, vocabulary result, execution limits, and refresh recommendation. Stop without a follow-up menu.

## Lightweight Mode

Read `references/lightweight.md` instead of the Full sequence. It carries its own completion output and links the shared candidate validation/publication rules. It never dispatches workers or reads session history, never seeds absent vocabulary, and never edits instruction files. Reduced research does not waive semantic promotion.
