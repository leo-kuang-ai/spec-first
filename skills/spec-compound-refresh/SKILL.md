---
name: spec-compound-refresh
description: Refresh docs/solutions learnings against the current codebase. Use when auditing stale, overlapping, superseded, or drifted learnings; avoid general refactor, debugging, or code review unless docs/solutions is explicit.
argument-hint: "[optional: scope hint — directory, filename, module, or keyword] [mode:non-interactive]"
---

# Compound Refresh

## Project Intelligence Evidence Boundary

Graph output is advisory navigation for finding candidate solution records or affected code. Confirm freshness, supersession, and applicability from current source, tests, docs, contracts, or owner evidence before refreshing durable knowledge; empty graph results have no negative authority. Direct reads remain valid when readiness is unknown or unavailable.

Maintain the quality of `docs/solutions/` over time. This workflow reviews existing learnings against the current codebase, then refreshes any derived pattern docs that depend on them.

## Workflow Contract Summary

- **Inputs:** `docs/solutions/`, `CONCEPTS.md`, an optional scope hint, and current source/test/doc evidence.
- **Outputs:** Keep/Update/Consolidate/Replace/Delete/Stale classifications, applied maintenance, and a complete Applied/Recommended report.
- **Hard exits:** unresolved source truth, target repo, write scope, or classification cannot become confirmed current knowledge. In headless mode, record uncertainty as stale only under the classification reference's evidence rules.
- **Publication:** prepare owner-private candidates; validate and make the semantic promotion decision before changing durable targets. `references/publication.md` owns target identity, freshness checks, ordered publication, and partial results for every mutation.
- **Worker boundary:** record `worker_dispatch_authorization` and related capability facts before any dispatch; investigation workers are read-only and never write a tracked successor, stage, or commit. Inline fallback must not claim independent investigation coverage. Missing authorization is recorded as `dispatch_authorization_missing`; an unavailable worker surface is `subagent_capability_missing` or `worker_capability_unproven` according to the dispatch evidence.

```yaml
worker_dispatch_authorization: authorized | missing
capability_probe: not_applicable | attempted | unavailable
worker_dispatch_capability: available | missing | unknown
worker_context_isolation: isolated | inherited | unknown
worker_model_override: supported | unsupported | unknown
worker_bounded_parallelism: supported | unsupported | unknown
worker_dispatch_outcome: <record the live result>
```

Capability results are `provider_untrusted` until confirmed by the current host; an unavailable or ambiguous surface is `worker_capability_unproven`, and the inline/serial fallback must be labeled accordingly.
- **Authority:** current source and verification evidence take precedence over historical learnings. Local mutation, commit, and landing require separate authority. `mode:headless` / `mode:non-interactive` only change interaction; they do not grant commit, push, or PR authority. Record `commit_reason: commit_authorization_missing` when needed; without landing authorization, do not push or open/update PR.

```yaml
mutation_authorization: authorized | missing
commit_authorization: authorized | missing
landing_authorization: authorized | missing
```
- Refresh is current-source anchored: re-read the defining source refs before updating a learning and retain observed revision/freshness and limitations. Unavailable evidence alone does not prove staleness; preserve unverifiable but plausible claims with a verification gap under `references/classify.md`. Historical cache, session transcript, or provider output is advisory and never a substitute for current-source evidence.
- **Consumers:** maintainers and planning, implementation, debugging, and review workflows that read `docs/solutions/` or `CONCEPTS.md`.

## Mode Detection

Read `references/modes.md` before resolving mode, authority, blocking questions, or a standalone `CONCEPTS.md` bootstrap request. It owns the `mode:non-interactive`/`mode:headless` parsing, conservative unattended behavior, and the mutation/commit/landing separation.

## Optional Worth Audit

Ordinary refresh checks accuracy and duplication between learnings. When the user asks whether accurate learnings still earn their place, or asks to prune content already recoverable elsewhere, read `references/worth-audit.md` before investigation. It owns intent resolution, quoted recovery evidence, and the separate authority for worth-based cuts. A generic drift refresh never enables this lens. An ambiguous cleanup request may produce recommendations but does not authorize deleting accurate content.

## Interaction Principles

**These principles apply to interactive mode only. In headless mode, skip all user questions and apply the headless mode rules above.**

Follow the same interaction style as `spec-brainstorm`:

- Ask questions **one at a time** — use the platform's blocking question tool: the host's blocking question tool already in the current tool list, matched by capability (if a matching tool is listed but unloaded, load it through the host's tool-discovery primitive). Fall back to numbered options in plain text only when no such tool is in the list or a real question call errors. Never silently skip the question
- Prefer **multiple choice** when natural options exist
- Start with **scope and intent**, then narrow only when needed
- Do **not** ask the user to make decisions before you have evidence
- Lead with a recommendation and explain it briefly

The goal is not to force the user through a checklist. The goal is to help them make a good maintenance decision with the smallest amount of friction.

## Refresh Order

Refresh in this order:

1. Review the relevant individual learning docs first
2. Note which learnings stayed valid, were updated, were consolidated, were replaced, or were deleted
3. Then review any pattern docs that depend on those learnings

Why this order:

- learning docs are the primary evidence
- pattern docs are derived from one or more learnings
- stale learnings can make a pattern look more valid than it really is

If the user starts by naming a pattern doc, you may begin there to understand the concern, but inspect the supporting learning docs before changing the pattern.

## Maintenance Model

For each candidate artifact, classify it into one of five outcomes:

| Outcome | Meaning | Default action |
|---------|---------|----------------|
| **Keep** | Still accurate and still useful | No file edit by default; report that it was reviewed and remains trustworthy |
| **Update** | Core solution is still correct, but references drifted | Apply evidence-backed in-place edits |
| **Consolidate** | Two or more docs overlap heavily but are both correct | Merge unique content into the canonical doc, delete the subsumed doc |
| **Replace** | The old artifact is now misleading, but there is a known better replacement | Create a trustworthy successor, then delete the old artifact |
| **Delete** | No longer useful, applicable, or distinct | Delete the file — git history preserves it if anyone needs to recover it later |

## Core Rules

1. **Evidence informs judgment.** The signals below are inputs, not a mechanical scorecard. Use engineering judgment to decide whether the artifact is still trustworthy.
2. **Prefer no-write Keep.** Do not update a doc just to leave a review breadcrumb.
3. **Separate descriptive drift from implementation conflict.** Descriptions of current mechanics follow verified implementation evidence. Independently supported guidance does not become false merely because code stopped following it. Apply `references/classify.md` before changing recommendations; report potential implementation regressions without modifying product code or the governing guidance file.
4. **Be decisive within evidence and authority.** Prepare unambiguous authorized updates without another question. Ask only for missing material decisions in interactive mode. In headless mode preserve uncertain claims; stale annotations require independent evidence of drift. Every durable mutation still passes the publication boundary.
5. **Avoid low-value churn.** Do not edit a doc just to fix a typo, polish wording, or make cosmetic changes that do not materially improve accuracy or usability.
6. **Use Update only for meaningful, evidence-backed drift.** Paths, module names, related links, category metadata, code snippets, and clearly stale wording are fair game when fixing them materially improves accuracy.
7. **Use Replace only when there is a real replacement.** That means either:
   - the current conversation contains a recently solved, verified replacement fix, or
   - the user has provided enough concrete replacement context to document the successor honestly, or
   - the codebase investigation found the current approach and can document it as the successor, or
   - newer docs, pattern docs, PRs, or issues provide strong successor evidence.
8. **Deletion requires the complete evidence gate.** Missing code alone does not prove the problem domain disappeared. Apply the three-condition gate in `references/classify.md`, including actual successor coverage and inbound-citation meaning, before deleting. Substantive citations require preserving their content through Keep or a verified successor; genuine uncertainty is never deletion authority.
9. **Evaluate document-set design, not just accuracy.** In addition to checking whether each doc is accurate, evaluate whether it is still the right unit of knowledge. If two or more docs overlap heavily, determine whether they should remain separate, be cross-scoped more clearly, or be consolidated into one canonical document. Redundant docs are dangerous because they drift silently — two docs saying the same thing will eventually say different things.
10. **Delete, don't archive.** There is no `_archived/` directory. When a doc is no longer useful, delete it. Git history preserves every deleted file — that is the archive. A dedicated archive directory creates problems: archived docs accumulate, pollute search results, and nobody reads them. If someone needs a deleted doc, `git log --diff-filter=D -- docs/solutions/` will find it.

## Scope Selection

Read `references/scope.md` before discovering candidates or routing by scope. It owns narrowing order, empty-store behavior, broad-sweep triage, and catalog README cleanup.

## Phase 1: Investigate Candidate Learnings

Read `references/investigate.md` before reading or dispatching investigation work. It owns current-source checks, document-set analysis, named-guidance contradictions, memory limits, and worker evidence boundaries.

## Phase 2: Classify the Right Maintenance Action

Read `references/classify.md` after evidence collection and before assigning Keep, Update, Consolidate, Replace, Delete, or Stale. It owns the Update/Replace boundary, deletion and relocation gates, pattern guidance, and interactive decisions.

## Phase 4: Prepare the Chosen Action

For each candidate, prepare the flow that matches its classification from `references/classify.md`. Read `references/per-action-flows.md` and `references/publication.md` before preparing mutations. No durable write occurs in this phase:

- **Keep** — no file edit by default; summarize why the learning remains trustworthy.
- **Update** — candidate edits for meaningful reference drift, preserving the valid solution.
- **Consolidate** — prepare the canonical candidate, retain unique content, and map citations and catalog entries before scheduling subsumed paths for deletion. An authorized split prepares independently useful successors under the same publication boundary.
- **Replace** — obtain a private successor draft through an authorized read-only worker or inline fallback. Preserve same-path identity; schedule old-path deletion only for a different-path successor. When proven drift lacks sufficient successor evidence, prepare a stale annotation instead.
- **Delete** — establish the evidence gate and prepare citation cleanup; recheck before deletion at publication.

Only one flow runs per candidate; the reference contains the per-action criteria, examples, and step-by-step instructions.

## Phase 4.5: Vocabulary Capture

Read `references/concepts-vocabulary.md` unconditionally after per-document actions. It owns qualifying terms, scoped seeding, reconciliation, scrub rules, and silent vocabulary edits.

## Phase 4.75: Validate And Publish

Follow `references/publication.md` after learning, citation, catalog, and vocabulary candidates are ready. Publish only approved dependency groups. Failed validation leaves final targets unchanged; a partial publication remains incomplete and reports exact changed and pending paths. A candidate is never an Applied result.

## Output Format

Read `references/report.md` after processing the selected scope. The full per-file Applied/Recommended report is the deliverable.

## Phase 5: Commit Changes

Read `references/commit.md` after the report and only when verified refresh-owned files changed. It owns git context checks, selective staging, commit authorization, and the separate landing boundary.

## Relationship to spec-compound

- `spec-compound` captures a newly solved, verified problem
- `spec-compound-refresh` maintains older learnings as the codebase evolves — both their individual accuracy and their collective design as a document set

Use **Replace** only when the refresh process has enough real evidence to write a trustworthy successor. When evidence is insufficient, mark as stale and recommend `spec-compound` for when the user next encounters that problem area.

Use **Consolidate** when accumulated learnings overlap without independent retrieval value. `spec-compound` may create, update, or skip a learning; refresh maintains the resulting set. Worth audit optionally applies the capture bar to accurate existing content without turning ordinary refresh into a pruning run.

## Discoverability Check

Read `references/discoverability.md` after the report. It owns the semantic `docs/solutions/` and optional `CONCEPTS.md` discoverability check, mode-specific edit boundary, and same-authority commit handling.
