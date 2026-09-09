---
name: spec-compound-refresh
description: Refresh docs/solutions learnings against the current codebase. Use when auditing stale, overlapping, superseded, or drifted learnings; avoid general refactor, debugging, or code review unless docs/solutions is explicit.
argument-hint: "[optional: scope hint — directory, filename, module, or keyword] [mode:headless] "
---

# Compound Refresh

## Project Intelligence Evidence Boundary

Graph output is advisory navigation for finding candidate solution records or affected code. Confirm freshness, supersession, and applicability from current source, tests, docs, contracts, or owner evidence before refreshing durable knowledge; empty graph results have no negative authority. Direct reads remain valid when readiness is unknown or unavailable.

Maintain the quality of `docs/solutions/` over time. This workflow reviews existing learnings against the current codebase, then refreshes any derived pattern docs that depend on them.

## Workflow Contract Summary

- **输入：** `docs/solutions/`、`CONCEPTS.md`、可选 scope hint，以及当前 source/test/doc evidence。
- **输出：** Keep/Update/Consolidate/Replace/Delete/Stale 分类、已应用的知识维护变更和完整 Applied/Recommended 报告。
- **硬出口：** source truth、目标 repo、写入范围或语义分类无法确认时不得把猜测写成 current knowledge；headless 只能把歧义标 stale。
- **Worker boundary:** record `worker_dispatch_authorization` and related capability facts before any dispatch; investigation workers are read-only and never write a tracked successor, stage, or commit. Inline fallback must not claim independent investigation coverage.

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
- **权威：** 当前代码与验证证据优先于旧 learning；本地 mutation、commit 和 landing 分别需要独立授权。`mode:headless` / `mode:non-interactive` 只改变交互方式；they do not grant commit, push, or PR authority. 缺少提交授权时记录 `commit_reason: commit_authorization_missing`；without landing authorization, do not push or open/update PR。

```yaml
mutation_authorization: authorized | missing
commit_authorization: authorized | missing
landing_authorization: authorized | missing
```
- Refresh is current-source anchored: re-read the defining source refs before updating a learning, retain observed revision/freshness and limitations, and mark the item stale when the source cannot be confirmed. Historical cache, session transcript, or provider output is advisory and never a substitute for the current source.
- **消费者：** 项目维护者，以及读取 `docs/solutions/`/`CONCEPTS.md` 的规划、实现、调试和审查 workflow。

## Mode Detection

Read `references/modes.md` before resolving mode, authority, blocking questions, or a standalone `CONCEPTS.md` bootstrap request. It owns the `mode:non-interactive`/`mode:headless` parsing, conservative unattended behavior, and the mutation/commit/landing separation.

## Interaction Principles

**These principles apply to interactive mode only. In headless mode, skip all user questions and apply the headless mode rules above.**

Follow the same interaction style as `spec-brainstorm`:

- Ask questions **one at a time** — use the platform's blocking question tool: `AskUserQuestion` in Claude Code (call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded), `request_user_input` in Codex. Fall back to numbered options in plain text only when no blocking tool exists in the harness or the call errors (e.g., Codex edit modes) — not because a schema load is required. Never silently skip the question
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
3. **Match docs to reality, not the reverse.** When current code differs from a learning, update the learning to reflect the current code. The skill's job is doc accuracy, not code review — do not ask the user whether code changes were "intentional" or "a regression." If the code changed, the doc should match. If the user thinks the code is wrong, that is a separate concern outside this workflow.
4. **Be decisive, minimize questions.** When evidence is clear (file renamed, class moved, reference broken), apply the update. In interactive mode, only ask the user when the right action is genuinely ambiguous. In headless mode, mark ambiguous cases as stale instead of asking. The goal is automated maintenance with human oversight on judgment calls, not a question for every finding.
5. **Avoid low-value churn.** Do not edit a doc just to fix a typo, polish wording, or make cosmetic changes that do not materially improve accuracy or usability.
6. **Use Update only for meaningful, evidence-backed drift.** Paths, module names, related links, category metadata, code snippets, and clearly stale wording are fair game when fixing them materially improves accuracy.
7. **Use Replace only when there is a real replacement.** That means either:
   - the current conversation contains a recently solved, verified replacement fix, or
   - the user has provided enough concrete replacement context to document the successor honestly, or
   - the codebase investigation found the current approach and can document it as the successor, or
   - newer docs, pattern docs, PRs, or issues provide strong successor evidence.
8. **Delete when the code is gone, and only after checking for inbound links.** If the referenced code, controller, or workflow no longer exists in the codebase and no successor can be found, delete the file — don't default to Keep just because the general advice is still "sound." When in doubt between Keep and Delete, ask the user (in interactive mode) or mark as stale (in headless mode). Inbound links inform classification, not cleanup: cleanup is always mechanical, but **decorative** citations (principle stated inline) allow Delete, while **substantive** citations (citing doc relies on the cited doc) signal Replace. The auto-delete case is missing code, no matching successor, and citations absent or decorative.
9. **Evaluate document-set design, not just accuracy.** In addition to checking whether each doc is accurate, evaluate whether it is still the right unit of knowledge. If two or more docs overlap heavily, determine whether they should remain separate, be cross-scoped more clearly, or be consolidated into one canonical document. Redundant docs are dangerous because they drift silently — two docs saying the same thing will eventually say different things.
10. **Delete, don't archive.** There is no `_archived/` directory. When a doc is no longer useful, delete it. Git history preserves every deleted file — that is the archive. A dedicated archive directory creates problems: archived docs accumulate, pollute search results, and nobody reads them. If someone needs a deleted doc, `git log --diff-filter=D -- docs/solutions/` will find it.

## Scope Selection

Read `references/scope.md` before discovering candidates or routing by scope. It owns narrowing order, empty-store behavior, broad-sweep triage, and catalog README cleanup.

## Phase 1: Investigate Candidate Learnings

Read `references/investigate.md` before reading or dispatching investigation work. It owns current-source checks, document-set analysis, named-guidance contradictions, memory limits, and worker evidence boundaries.

## Phase 2: Classify the Right Maintenance Action

Read `references/classify.md` after evidence collection and before assigning Keep, Update, Consolidate, Replace, Delete, or Stale. It owns the Update/Replace boundary, deletion and relocation gates, pattern guidance, and interactive decisions.

## Phase 4: Execute the Chosen Action

For each candidate, execute the flow that matches its classification from `references/classify.md`. Read `references/per-action-flows.md` and follow the matching section:

- **Keep** — no file edit by default; summarize why the learning remains trustworthy.
- **Update** — in-place edits when the solution is still substantively correct (path renames, link refreshes, module renames).
- **Consolidate** — merge overlapping docs into a canonical doc, apply the same promotion exit to the materially rewritten canonical doc (and every new split successor), then update cross-references and delete subsumed docs. The orchestrator handles consolidation directly.
- **Replace** — obtain a successor draft through an authorized subagent or inline/serial fallback, then let the orchestrator write the tracked successor, validate parser safety plus the `source_refs` / `invalidation_condition` promotion exit, validate cited claims, and only then delete the old. When evidence is insufficient, mark stale instead.
- **Delete** — final inbound-link check, then remove. Reclassify if late-discovered substantive citations surface.

Only one flow runs per candidate; the reference contains the per-action criteria, examples, and step-by-step instructions.

## Phase 4.5: Vocabulary Capture

Read `references/concepts-vocabulary.md` unconditionally after per-document actions. It owns qualifying terms, scoped seeding, reconciliation, scrub rules, and silent vocabulary edits.

## Output Format

Read `references/report.md` after processing the selected scope. The full per-file Applied/Recommended report is the deliverable.

## Phase 5: Commit Changes

Read `references/commit.md` after the report and only when verified refresh-owned files changed. It owns git context checks, selective staging, commit authorization, and the separate landing boundary.

## Relationship to spec-compound

- `spec-compound` captures a newly solved, verified problem
- `spec-compound-refresh` maintains older learnings as the codebase evolves — both their individual accuracy and their collective design as a document set

Use **Replace** only when the refresh process has enough real evidence to write a trustworthy successor. When evidence is insufficient, mark as stale and recommend `spec-compound` for when the user next encounters that problem area.

Use **Consolidate** proactively when the document set has grown organically and redundancy has crept in. Every `spec-compound` invocation adds a new doc — over time, multiple docs may cover the same problem from slightly different angles. Periodic consolidation keeps the document set lean and authoritative.

## Discoverability Check

Read `references/discoverability.md` after the report. It owns the semantic `docs/solutions/` and optional `CONCEPTS.md` discoverability check, mode-specific edit boundary, and same-authority commit handling.

