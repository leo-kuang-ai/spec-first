---
name: spec-code-review
description: "Structured code review using tiered persona agents, confidence-gated findings, and a merge/dedup pipeline. Use when reviewing code changes before creating a PR."
argument-hint: "[blank to review current branch, or provide PR link]"
---

# Code Review

Reviews code changes using dynamically selected reviewer personas. When the host exposes a reviewer dispatch primitive, spawns parallel sub-agents by default that return structured JSON, then merges and deduplicates findings into a single report. When dispatch is unavailable, explicitly disabled, or unsafe, falls back to a single-agent report-only review instead of bypassing host boundaries.

## Workflow Contract Summary

### When To Use

Use before creating a PR, after completing implementation work, or whenever a scoped code diff needs structured review with confidence-gated findings and optional safe fixes.

### When Not To Use

Do not use for requirements/plan-only document review, planning unresolved work, creating commits/pushes/PRs, filing tracker tickets without an explicit routing decision, or treating optional external-tool startup failure as a reviewer failure.

### Inputs

Current branch diff, PR URL/number, branch target, or explicit `base:<sha-or-ref>`; optional `plan:<path>` and mode token (`mode:autofix`, `mode:report-only`, or `mode:headless`); repository instructions, plan/task/work artifacts, package/test context, and optional external-tool evidence as advisory review context.

### Outputs

A merged findings report with severity, confidence, evidence, `autofix_class`, owner routing, residual status, Diff Boundary Review, Graph-Assisted Impact Review Coverage, first-class `test_gaps`, and Coverage; structured headless/autofix output when a mode token requests it; `safe_auto` edits only when the selected mode allows mutation.

### Artifacts

Session-scoped review artifacts live under the OS temp directory and are named in `Artifact:` lines or structured returns. Durable repo-local evidence exists only when the workflow explicitly routes it, such as accepted residual docs or PR text.

### Failure Modes

Conflicting mode flags, missing headless diff scope, unsafe shared-checkout switching, unavailable/unsafe dispatch, degraded optional external-tool evidence, or zero reviewer results. Fall back to single-agent report-only when safe, or emit the documented failure envelope for headless/programmatic callers.

### Workflow

Resolve scope and mode, run runtime/readiness preflight, select scale-aware reviewers, dispatch or fall back, synthesize/deduplicate findings, apply only allowed `safe_auto` fixes, then present or return the mode-specific handoff.

### Downstream Consumers

`spec-work` shipping review, PR preparation, tracker-defer handoff, human reviewers, and `spec-compound` when accepted findings become reusable knowledge.

## Scenario Capability

Follows `docs/contracts/workflows/scenario-capability-matrix.md` with high-risk overrides because this workflow can make user-visible findings and, in autofix modes, mutate source.

Overrides: high-risk

- `foreign-residual-workspace` -> `blocked-action-required`: stop before autofix or PR-ready review claims until `spec-first clean --workspace-orphans` preview and `spec-first init` refresh local artifacts, or the user explicitly accepts degraded evidence.
- optional external-tool evidence unavailable -> `fallback-only`: use bounded direct diff/source/test evidence and record the limitation in Coverage; do not claim blast radius, related tests, or changed-symbol coverage that was not confirmed from direct evidence.
- `non-git-build-workspace` coverage gaps -> `partial`: review covered git roots normally, but treat uncovered build modules as direct-read/test candidates before raising cross-module findings.

## Examples As Context

When editing or reviewing this workflow prompt, or when running fresh-source eval for review posture drift, read `skills/spec-code-review/evals/examples.json` as examples-as-context. These examples are not a deterministic router, state machine, semantic readiness gate, or substitute for LLM judgment during ordinary code reviews.

## Context Orientation Anchor

Orient review from the diff scope, current user request, plan/task/work artifacts when present, already-loaded host/project instructions, package manifests and command registries, nearby implementation files, nearby tests, and test results. Treat `AGENTS.md`, `CLAUDE.md`, and project role docs as host instruction sources that are normally already loaded by the current session, not automatic re-read targets for every review run. Read those source instruction files only when `docs/contracts/context-governance.md`'s Host Instruction Reuse Policy allows it; Stage 3b is the narrow project-standards persona exception and discovers paths before leaf reviewers read relevant sections. Use bounded direct diff/source reads, `rg`, ast-grep when useful, package/test facts, logs, and user-provided artifacts as review evidence. External tools may prioritize inspection, but they do not define scope authority or replace reviewer judgment. Findings still need direct source, diff, test, contract, log, or artifact confirmation.

## Domain Language And Decision Ledger

When review findings depend on domain terminology, project-specific concepts, or ADR-like decisions, consume existing context before asking questions or raising gaps that repo/docs can answer: already-loaded project standards and host instructions, `docs/contracts/`, existing brainstorms/plans/solutions, and any repo-local glossary or ADR-like artifacts that actually exist. Team standards under `docs/standards/**` are governed by `docs/contracts/team-standards.md`; project-standards findings may enforce only `trust=confirmed,lifecycle_state=active`, scope-matched rules and must cite both the standard rule ID/section and the diff/source violation. `observed`, `suggested`, `imported`, `conflict`, `confirmed-draft`, and `docs/standards/candidates/**` are not hard findings. Read `AGENTS.md` / `CLAUDE.md` source only under the Host Instruction Reuse Policy or the Stage 3b project-standards persona exception, not as a default domain-context step. Do not require a fixed `CONTEXT.md`, `docs/adr/`, or glossary directory. If those artifacts are absent, record the limitation in Coverage as advisory context rather than blocking the review.

For major review decisions or residuals, carry a lightweight decision note: `question`, `recommended_answer`, `source_tag`, `chosen_answer`, `consequence`, and `deferred_reason` when unresolved. Use source tags such as `confirmed`, `advisory`, `session-local`, `stale`, or `user`. Recommend an ADR-like artifact only when the decision is hard to reverse, would be surprising without context, and reflects a real tradeoff; do not create the artifact from review unless an explicit workflow route chooses that work.

## Feedback Loop Review Boundary

When reviewing behavior-bearing changes, check whether the work established and reran a feedback loop appropriate to the change: failing or characterization tests, CLI invocation, HTTP/browser script, trace replay, throwaway harness, property/fuzz loop, or another focused command. Findings should name the missing observable risk, not demand TDD ritual by default.

For docs-only and config-only changes, docs contract checks, schema/help/render checks, generated catalog diff checks, or diff-shape review can be sufficient verification. Do not flag "no test-first loop" when the change has no behavior-bearing code and another observable check proves the intended effect.

## Anti-Rationalization Red Flags

| 红旗念头 | 停下来做什么 |
| --- | --- |
| 「看着没问题,跳过对抗复核」 | 跑该跑的对抗、证伪或 confidence-gate 视角,再给出 verdict。 |
| 「这条 finding 大概成立」 | 回到 source、diff、test、log 或 artifact 证据核对,确认后再定级;advisory 不能当 confirmed。 |
| 「口头说一下结论就行」 | 产出结构化 finding、Coverage 与 residual risk,让下游能处理而不是靠会话记忆。 |

这是注意力提醒,不是 gate,也不替代 LLM 判断;最终是否停下、如何处理仍由你按当前证据决定。

## Runtime Context Exclusion

遵循 `docs/contracts/context-governance.md`：普通 Code Review context 默认排除 `.spec-first/audits/**`、`.spec-first/governance/**` 和 generated mirrors（`.claude/**`、`.codex/**`、`.agents/skills/**`）。除非 diff 或用户请求明确指向 setup/update/runtime drift/audit/governance evidence，否则不要把这些路径放进 reviewer prompt、broad repo search 或 review context bundle；被排除时，在 Coverage 中报告 path 或 reason，而不是静默扫描。

## Cache-Friendly Context Layout

保持本 `SKILL.md` 作为 stable instruction prefix：workflow contract、hard boundaries、reviewer routing 和 reference index。把 volatile data 放入 dynamic suffix：当前 user request、diff summary、tool summary、temporary evidence、`artifact-summary.v1`，以及来自 `docs/contracts/context-bundle.md` 的 `context-bundle.v1`。Stage 5 synthesis 先消费 reviewer JSON；reviewer 返回 schema 以 `skills/spec-code-review/references/findings-schema.json` 为准，使用 P0-P3 severity 与 0/25/50/75/100 confidence anchors。`docs/contracts/workflows/review-finding.md` 的 `review-finding.v1` 仅用于 downstream / compact mapped summary，不替代 code-review reviewer JSON schema。

Maintain a run-local context ledger for this workflow: paths read, reason, phase, and compact summary. Reuse loaded summaries within the same workflow run. Re-read only when exact wording is needed, the file changed, prior evidence is insufficient, or the user explicitly asks.

## Summary-First Handoff

When consuming plan, work, task-pack, debug, or compound artifacts, read an `artifact-summary.v1` summary and precise artifact path first. Open the full artifact only when `full_artifact_read_triggers` apply: the summary is missing requirement/task/finding/evidence detail needed for review, exact prose or line references are required for an actionable finding, or 互依赖任务 need concrete implementation details rather than only upstream conclusions. If no usable summary exists, record `summary_missing` and inspect the smallest explicit source path needed. If full content is opened, record `full_artifact_read_reason` with the matched trigger.

When producing downstream review handoff, provide an `artifact-summary.v1`-style summary with verdict, actionable findings, residual status, evidence paths, reviewer artifact path, limitations, and recommended next action. If handing off a `context-bundle.v1`, keep context budget accounting in the existing `related_paths`, `evidence_paths`, `excluded_context`, `budget`, and `budget_used` fields; do not introduce a second included/omitted schema.

## Direct Review Evidence Boundary

Code Review does not require external-tool readiness before reviewer dispatch. Use direct diff reads, source reads, `rg`, ast-grep, package/test facts, logs, and user-provided artifacts to build review context and confirm findings. If a claimed impact surface cannot be confirmed from bounded direct evidence, record it as residual risk or a test candidate instead of raising it as a confirmed finding.

When review runs from a parent workspace containing multiple independent Git repos, group changed files by Git repo and keep file references, suggested fixes, and risk assessments scoped to the repo that owns the file. For read-only review questions without a diff, ask for or infer only bounded candidate repos from the user request and direct file discovery. Autofix review must not edit a child repo unless that repo is explicit in the diff or `target_repo` scope.

## Diff Boundary Review

Every review treats "did the diff stay inside the authorized work?" as a first-class review axis, not as incidental intent checking.

Compute and carry these run-level fields from Stage 2 through Stage 6:

- `scope_boundary`: `clean | concern | violation | unknown`
- `authorized_scope_source`: `explicit-touch-set | declared-files-only | inferred-plan | diff-only | unknown`
- `scope_boundary_evidence`: compact source refs, plan refs, declared files, diff files, or limitation notes that justify the boundary verdict

Boundary verdict rules:

- Use `clean` only when an explicit touch set, declared files, or plan requirements directly cover the changed files and behavior. A diff-only inference is never enough for `clean`.
- Use `unknown` when no plan, task, PR intent, explicit touch set, or declared file list exists. Do not label thin intent as clean.
- Use `concern` when the diff plausibly reaches outside stated intent but needs owner or plan confirmation before calling it unauthorized.
- Use `violation` when direct diff/source/plan evidence shows an unauthorized file, behavior, source/runtime boundary change, generated runtime edit, or requirement omission.
- Implementer reports, PR prose, commit messages, or work closeouts are claim sources only. Verify them against diff/source/test/log/contract evidence before using them to lower boundary risk.
- When `CHANGELOG.md`, release notes, review docs, or validation docs add repo-relative path references, verify referenced artifacts that are claimed as shipped are in `FILES:` / tracked diff, already tracked by `git ls-files -- <path>`, or explicitly declared excluded/not-shipping. If a newly referenced path exists only in `UNTRACKED:`, set `scope_boundary: concern`, derive `finding_type: untracked_referenced_artifact` alongside `missing_verification`, and keep it actionable until the artifact is staged/tracked or the reference is removed/deferred. Do not lower this to `clean` only because the file exists on disk.

Stage 5 synthesis derives `finding_type` for surfaced findings without changing `references/findings-schema.json`. Minimum derived labels are `scope_creep`, `unauthorized_file_change`, `unverifiable_claim`, and `missing_verification`. High-confidence scope-boundary findings must remain in the primary finding set; do not silently demote them into residual risks or testing gaps only. Schema promotion is deferred until report/headless consumers prove they need reviewer-return fields.

## Capability-Class Evidence Boundary

Follows `docs/contracts/project-graph-consumption.md`. When setup/runtime facts expose optional `capability-class` candidates such as `code-graph` or `project-graph`, use them only as advisory review inputs through their native MCP or CLI surface. Confirm freshness through `readiness_status`, lifecycle display bits, and direct source/test/log evidence before relying on impact, affected-test, or ownership candidates; provider self-reported freshness is not a confirmed review fact. A `stale` graph still serves exploration-tier orientation when you annotate that it lags HEAD, but a review conclusion must be re-grounded regardless. When the capability is missing, when readiness facts are unavailable or self-reported as `unknown`/`unverified`, on call failure, or when disabled/unsafe, continue with bounded diff/source reads, `rg`, ast-grep, package/test facts, and logs. Record any used candidate in Coverage as `provider_untrusted`; never-block review on its availability, and keep setup-side `lifecycle.fallback_used` separate from consumption-side fallback notes.

Graph-Assisted Impact Review is a bounded advisory lens for impact-sensitive diffs. Trigger it for shared helpers, public APIs, workflow/contract/source-runtime changes, exported symbols, CLI/runtime generation, security/permission surfaces, cross-module changes, or owner-requested impact review. Classify graph use with stable Coverage fields:

- `graph_assist`: `used | fallback | not_applicable`
- `graph_reason_code`: `candidate_results | provider_missing | readiness_unknown | stale | call_failed | disabled_or_unsafe | markdown_only_diff | no_candidates`
- `provider_untrusted.summaries[]`: query/tool summary, accepted candidates, rejected candidates, freshness/readiness notes, and limitations
- `expansion_budget`: minimal-first budget used for candidate expansion, normally `max_5_high_impact_symbols`

Candidate fields, when present, are advisory only: `changed_symbols`, `changed_entrypoints`, `changed_contracts`, `symbol_mapping_status`, `tests_for_query_result`, `missing_test_confirmation`, `impact_chain_candidates`, `blast_radius_candidates`, `affected_test_candidates`, `caller_callee_paths`, `review_priority_candidates`, `test_gaps`, and `limitations`. These shrink the next direct read; they do not prove affected tests, ownership, severity, confidence, scope boundary, merge readiness, or a confirmed finding.

Use minimal-first expansion: start with at most 5 high-impact symbols or entrypoints. Expand callers, flows, source snippets, and affected-test candidates only for medium/high risk, public/contract/source-runtime/security/permission changes, explicit test gaps, or owner-requested impact review. Ordinary docs-only/prose-only diffs can use `graph_assist: not_applicable` with `graph_reason_code: markdown_only_diff`; source-runtime instruction prose such as `skills/**`, workflow contracts, templates, runtime projection source, or CLI/workflow harness docs remains impact-sensitive and should use `fallback/readiness_unknown` when provider readiness is unknown. `graph_assist: used` requires `graph_reason_code: candidate_results` plus at least one of `changed_symbols`, `caller_callee_paths`, or `affected_test_candidates`; `no_candidates` proves only that the provider path ran.

## Progress Reporting Boundary

User-visible progress updates are operational evidence, not a reasoning scratchpad. During long reviews, keep updates short and grounded in concrete facts or actions: scope resolution, file counts, selected reviewers, fallback mode, validation status, or the next inspection step. Do not expose private deliberation, tentative inner monologue, or first-person reasoning such as "I'm thinking", "I need to consider", or "I think". If a point is uncertain, state the verified limitation and the next check instead of narrating speculation. Use the repository language policy from the active `CLAUDE.md` / `AGENTS.md` `spec-first:lang` block for new prose unless the user requested otherwise.

## Argument Parsing

Parse `$ARGUMENTS` for the following optional tokens. Strip each recognized token before interpreting the remainder as the PR number, GitHub URL, or branch name.

| Token | Example | Effect |
|-------|---------|--------|
| `mode:autofix` | `mode:autofix` | Select autofix mode (see Mode Detection below) |
| `mode:report-only` | `mode:report-only` | Select report-only mode |
| `mode:headless` | `mode:headless` | Select headless mode for programmatic callers (see Mode Detection below) |
| `base:<sha-or-ref>` | `base:abc1234` or `base:origin/main` | Skip scope detection — use this as the diff base directly. For manual re-review of the same branch, pass the last reviewed HEAD SHA to review only newer changes. |
| `plan:<path>` | `plan:docs/plans/2026-03-25-001-feat-foo-plan.md` | Load this plan for requirements verification |

All tokens are optional. Each one present means one less thing to infer. When absent, fall back to existing behavior for that stage.

**Conflicting mode flags:** If multiple mode tokens appear in arguments, stop and do not dispatch agents. If `mode:headless` is one of the conflicting tokens, emit the headless error envelope: `Review failed (headless mode). Reason: conflicting mode flags — <mode_a> and <mode_b> cannot be combined.` Otherwise emit the generic form: `Review failed. Reason: conflicting mode flags — <mode_a> and <mode_b> cannot be combined.`

## Quick Review Short-Circuit

If `$ARGUMENTS` indicates the user wants a quick, fast, or light code review, prefer the current harness's built-in lightweight review surface when one exists. Announce the chosen path before other work: Quick review or Multi-agent review.

Programmatic callers (`mode:autofix`, `mode:report-only`, or `mode:headless`) bypass this shortcut and always run the full pipeline because callers depend on structured output and artifacts.

Sequence:

1. **Use a real built-in only.** If the current harness exposes a built-in code review command or tool, run it and stop. Forward a PR number, GitHub URL, or branch target when the built-in accepts one; otherwise review the current checkout.
2. **No invented fallback.** If the current harness has no built-in review command or tool, do not pretend a quick review happened. Continue into the full spec-code-review pipeline.
3. **Codex note.** Codex currently has no universal slash-command review primitive in this source contract. Unless the active runtime explicitly provides one, quick intent falls through to the full pipeline.

## Mode Detection

| Mode | When | Behavior |
|------|------|----------|
| **Interactive** (default) | No mode token present | Review, apply safe_auto fixes automatically, present findings, ask for policy decisions on gated/manual findings, and optionally continue into fix/push/PR next steps |
| **Autofix** | `mode:autofix` in arguments | No user interaction. Review, apply only policy-allowed `safe_auto` fixes, re-review in bounded rounds, write a run artifact capturing residual downstream work |
| **Report-only** | `mode:report-only` in arguments | Strictly read-only. Review and report only, then stop with no edits, artifacts, commits, pushes, or PR actions |
| **Headless** | `mode:headless` in arguments | Programmatic mode for skill-to-skill invocation. Apply `safe_auto` fixes silently (single pass), return all other findings as structured text output, write run artifacts, and return "Review complete" signal. No interactive prompts. |

### Run artifact boundary

`<review-artifact-dir>/` is a session/orchestrator handoff, not repo-local durable truth. Resolve it under the current OS temp directory (`os.tmpdir()` / `$TMPDIR` / `%TEMP%`) and include the concrete path in every `Artifact:` line or structured return. Do not hardcode `/tmp`; Windows native runs commonly use `%TEMP%`. Use the artifact directory to coordinate reviewer JSON, detail enrichment, autofix residuals, and headless callers during the current run. Do not promise it will be committed or retained. Durable review evidence is created only when the workflow explicitly routes it: PR descriptions may include accepted Known Residuals, and the no-PR shipping path may create `docs/residual-review-findings/<branch-or-head-sha>.md` for accepted residuals. Do not copy full-detail reviewer JSON into repo-local docs by default.

### Autofix mode rules

- **Skip all user questions.** Never pause for approval or clarification once scope has been established.
- **Apply only `safe_auto -> review-fixer` findings.** Leave `gated_auto`, `manual`, `human`, and `release` work unresolved.
- **Write a run artifact** under `<review-artifact-dir>/` summarizing findings, applied fixes, residual actionable work, and advisory outputs. Orchestrators read this artifact to route residual `downstream-resolver` findings; the skill itself does not file tickets or prompt the user in autofix.
- **Emit a compact Residual Actionable Work summary in the autofix return** listing each residual `downstream-resolver` finding with its stable `#`, severity, file:line, title, and autofix_class. Structure the summary as two separate contiguous sections: applied `safe_auto` fixes first, then residual non-auto findings. Within the residual section, reuse each finding's stable `#` from Stage 5 -- never renumber. Include the run-artifact path. Callers read this summary directly without parsing the artifact. When no residuals exist, state `Residual actionable work: none.` explicitly.
- **Never commit, push, or create a PR** from autofix mode. Parent workflows own those decisions.

### Report-only mode rules

- **Skip all user questions.** Infer intent conservatively if the diff metadata is thin.
- **Never edit files or externalize work.** Do not write `<review-artifact-dir>/`, do not file tickets, and do not commit, push, or create a PR.
- **Safe for parallel read-only verification.** `mode:report-only` is the only mode that is safe to run concurrently with browser testing on the same checkout.
- **Do not switch the shared checkout.** If the caller passes an explicit PR or branch target, `mode:report-only` must run in an isolated checkout/worktree or stop instead of running `gh pr checkout` / `git checkout`.
- **Do not overlap mutating review with browser testing on the same checkout.** If a future orchestrator wants fixes, run the mutating review phase after browser testing or in an isolated checkout/worktree.

### Headless mode rules

- **Skip all user questions.** Never use the platform question tool (`AskUserQuestion` in Claude Code or `request_user_input` in Codex) or other interactive prompts. Infer intent conservatively if the diff metadata is thin.
- **Require a determinable diff scope.** If headless mode cannot determine a diff scope (no branch, PR, or `base:` ref determinable without user interaction), emit `Review failed (headless mode). Reason: no diff scope detected. Re-invoke with a branch name, PR number, or base:<ref>.` and stop without dispatching agents.
- **Apply only `safe_auto -> review-fixer` findings in a single pass.** No bounded re-review rounds. Leave `gated_auto`, `manual`, `human`, and `release` work unresolved and return them in the structured output.
- **Return all non-auto findings as structured text output.** Use the headless output envelope format (see Stage 6 below) preserving severity, autofix_class, owner, requires_verification, confidence, pre_existing, and suggested_fix per finding. Enrich with detail-tier fields (why_it_matters, evidence[]) from reviewer returns first, using parent-owned artifact files only as an optional cache (see Detail enrichment in Stage 6).
- **Write a run artifact** under `<review-artifact-dir>/` summarizing findings, applied fixes, and advisory outputs. Include the artifact path in the structured output.
- **Do not file tickets or externalize work.** The caller receives structured findings and routes downstream work itself.
- **Do not switch the shared checkout.** If the caller passes an explicit PR or branch target, `mode:headless` must run in an isolated checkout/worktree or stop instead of running `gh pr checkout` / `git checkout`. When stopping, emit `Review failed (headless mode). Reason: cannot switch shared checkout. Re-invoke with base:<ref> to review the current checkout, or run from an isolated worktree.`
- **Not safe for concurrent use on a shared checkout.** Unlike `mode:report-only`, headless mutates files (applies `safe_auto` fixes). Callers must not run headless concurrently with other mutating operations on the same checkout.
- **Never commit, push, or create a PR** from headless mode. The caller owns those decisions.
- **End with "Review complete" as the terminal signal** so callers can detect completion. If all reviewers fail or time out, emit `Code review degraded (headless mode). Reason: 0 of N reviewers returned results.` followed by "Review complete".

### Interactive mode rules

- **Pre-load the platform question tool before any question fires.** In Claude Code, `AskUserQuestion` is a deferred tool — its schema is not available at session start. At the start of Interactive-mode work (before Stage 2 intent-ambiguity questions, the After-Review routing question, walk-through per-finding questions, bulk-preview Proceed/Cancel, and tracker-defer failure sub-questions), call `ToolSearch` with query `select:AskUserQuestion` to load the schema. Load it **once, eagerly, at the top of the Interactive flow** — do not wait for the first question site and do not decide it on a per-site basis. On Codex this preload step does not apply.
- **The numbered-list fallback only applies when the harness genuinely lacks a blocking question tool** — `ToolSearch` returns no match, the tool call explicitly fails, or the runtime mode does not expose it (e.g., Codex edit modes where `request_user_input` is unavailable). A pending schema load is not a fallback trigger; call `ToolSearch` first per the pre-load rule. Rendering a question as narrative text because the tool feels inconvenient, because the model is in report-formatting mode, or because the instruction was buried in a long skill is a bug. A question that calls for a user decision must either fire the tool or fall back loudly.

## Severity Scale

All reviewers use P0-P3:

| Level | Meaning | Action |
|-------|---------|--------|
| **P0** | Critical breakage, exploitable vulnerability, data loss/corruption | Must fix before merge |
| **P1** | High-impact defect likely hit in normal usage, breaking contract | Should fix |
| **P2** | Moderate issue with meaningful downside (edge case, perf regression, maintainability trap) | Fix if straightforward |
| **P3** | Low-impact, narrow scope, minor improvement | User's discretion |

## Action Routing

Severity answers **urgency**. Routing answers **who acts next** and **whether this skill may mutate the checkout**.

| `autofix_class` | Default owner | Meaning |
|-----------------|---------------|---------|
| `safe_auto` | `review-fixer` | Local, deterministic fix suitable for the in-skill fixer when the current mode allows mutation |
| `gated_auto` | `downstream-resolver` or `human` | Concrete fix exists, but it changes behavior, contracts, permissions, or another sensitive boundary that should not be auto-applied by default |
| `manual` | `downstream-resolver` or `human` | Actionable work that should be handed off rather than fixed in-skill |
| `advisory` | `human` or `release` | Report-only output such as learnings, rollout notes, or residual risk |

Routing rules:

- **Synthesis owns the final route.** Persona-provided routing metadata is input, not the last word.
- **Choose the more conservative route on disagreement.** A merged finding may move from `safe_auto` to `gated_auto` or `manual`, but never the other way without stronger evidence.
- **Only `safe_auto -> review-fixer` enters the in-skill fixer queue automatically.**
- **`requires_verification: true` means a fix is not complete without targeted tests, a focused re-review, or operational validation.**

## Reviewers

18 reviewer personas in layered conditionals, plus Spec-First-specific agents. See the persona catalog included below for the full catalog.

**CLI readiness boundary:** Keep `spec-cli-readiness-reviewer` as the conditional reviewer for CLI-facing diffs. This project is itself a CLI/workflow harness, so changes to `src/cli/`, command definitions, argument parsing, runtime generation, or command handler behavior need autonomous-agent usability review. `spec-cli-agent-readiness-reviewer` is a separate manual/deep-dive agent for CLI source, plans, or specs; it is not a replacement for the structured JSON persona.

**Default core reviewers (full or sensitive reviews):**

The scale-aware reviewer preflight in Stage 3 may replace this default core with a smaller minimum set for low-risk diffs. For medium, broad, sensitive, or unclear diffs, use the full default core below.

| Agent | Focus |
|-------|-------|
| `spec-correctness-reviewer` | Logic errors, edge cases, state bugs, error propagation |
| `spec-testing-reviewer` | Coverage gaps, weak assertions, brittle tests |
| `spec-maintainability-reviewer` | Coupling, complexity, naming, dead code, abstraction debt |
| `spec-project-standards-reviewer` | CLAUDE.md and AGENTS.md compliance -- frontmatter, references, naming, portability |
| `spec-agent-native-reviewer` | Verify new features are agent-accessible |
| `spec-learnings-researcher` | Search docs/solutions/ for past issues related to this PR |

**Cross-cutting conditional (selected per diff):**

| Agent | Select when diff touches... |
|-------|---------------------------|
| `spec-security-reviewer` | Auth, public endpoints, user input, permissions |
| `spec-performance-reviewer` | DB queries, data transforms, caching, async |
| `spec-api-contract-reviewer` | Routes, serializers, type signatures, versioning |
| `spec-data-migrations-reviewer` | Migration files, schema dumps (`db/schema.rb`, `structure.sql`), backfill scripts, or data transformations -- not model/query-only changes without migration artifacts |
| `spec-reliability-reviewer` | Error handling, retries, timeouts, background jobs |
| `spec-adversarial-reviewer` | Diff >=50 changed non-test/non-generated/non-lockfile lines, or auth, payments, data mutations, external APIs |
| `spec-cli-readiness-reviewer` | CLI command definitions, argument parsing, CLI framework usage, command handler implementations |
| `spec-previous-comments-reviewer` | Reviewing a PR that has existing review comments or threads |

**Stack-specific conditional (selected per diff):**

| Agent | Select when diff touches... |
|-------|---------------------------|
| `spec-dhh-rails-reviewer` | Rails architecture, service objects, session/auth choices, or Hotwire-vs-SPA boundaries |
| `spec-kieran-rails-reviewer` | Rails application code where conventions, naming, and maintainability are in play |
| `spec-kieran-python-reviewer` | Python modules, endpoints, scripts, or services |
| `spec-kieran-typescript-reviewer` | TypeScript components, services, hooks, utilities, or shared types |
| `spec-julik-frontend-races-reviewer` | Stimulus/Turbo controllers, DOM events, timers, animations, or async UI flows |
| `spec-swift-ios-reviewer` | Swift files, SwiftUI views, UIKit controllers, entitlements, privacy manifests, Core Data models, SPM manifests, storyboards/XIBs, or semantic build-setting/target/signing changes in .pbxproj |

**Spec-First conditional (migration-specific):**

| Agent | Select when diff includes migration artifacts |
|-------|------------------------------------------|
| `spec-schema-drift-detector` | Cross-references schema.rb against included migrations |
| `spec-deployment-verification-agent` | Produces deployment checklist with SQL verification queries for risky migration artifacts |

## Review Scope

When dispatch is available, every full multi-persona review first runs the Stage 3 scale-aware reviewer preflight, then spawns the selected core reviewers plus whichever cross-cutting and stack-specific conditionals fit the diff. Low-risk tiny diffs can use a minimum set of 2-3 reviewers. Medium, broad, sensitive, or unclear diffs use the full default core of 4 persona reviewers plus the 2 Spec-First agents. A Rails auth feature might trigger security + reliability + kieran-rails + dhh-rails on top of the full default core.

If dispatch is unavailable, explicitly disabled by the user, or unsafe for the selected review mode, run the single-agent report-only fallback described in Stage 4. Do not silently skip review and do not work around the boundary by invoking hidden helpers or external CLIs as pseudo-agents.

## Protected Artifacts

The following paths are spec-first pipeline artifacts and must never be flagged for deletion, removal, or gitignore by any reviewer:

- `docs/brainstorms/*` -- requirements documents created by spec-brainstorm
- `docs/plans/*.md` -- plan files created by spec-plan (decision artifacts; execution progress is derived from git, not stored in plan bodies)
- `docs/solutions/*.md` -- solution documents created during the pipeline

If a reviewer flags any file in these directories for cleanup or removal, discard that finding during synthesis.

## How to Run

### Stage 1: Determine scope

Compute the diff range, file list, and diff. Minimize permission prompts by combining into as few commands as possible.

**If `base:` argument is provided (fast path):**

The caller already knows the diff base. Skip all base-branch detection, remote resolution, and merge-base computation. Use the provided value directly:

```
BASE_ARG="{base_arg}"
BASE=$(git merge-base HEAD "$BASE_ARG" 2>/dev/null) || BASE="$BASE_ARG"
```

Then produce the same output as the other paths:

```
echo "BASE:$BASE" && echo "FILES:" && git diff --name-only $BASE && echo "DIFF:" && git diff -U10 $BASE && echo "UNTRACKED:" && git ls-files --others --exclude-standard
```

This path works with any ref — a SHA, `origin/main`, a branch name. Automated callers (spec-work, best-judgment, sbest-judgment) should prefer this to avoid the detection overhead. Interactive users can also use it for manual incremental re-review: record the HEAD SHA from the last completed review, then rerun review with `base:<that-sha>` so only changes since that point are in scope. This only narrows the diff range; reviewers still analyze the new range independently and no cross-run finding deduplication is implied. **Do not combine `base:` with a PR number or branch target.** If both are present, stop with an error: "Cannot use `base:` with a PR number or branch target — `base:` implies the current checkout is already the correct branch. Pass `base:` alone, or pass the target alone and let scope detection resolve the base." This avoids scope/intent mismatches where the diff base comes from one source but the code and metadata come from another.

**If a PR number or GitHub URL is provided as an argument:**

If `mode:report-only` or `mode:headless` is active, do **not** run `gh pr checkout <number-or-url>` on the shared checkout. For `mode:report-only`, tell the caller: "mode:report-only cannot switch the shared checkout to review a PR target. Run it from an isolated worktree/checkout for that PR, or run report-only with no target argument on the already checked out branch." For `mode:headless`, emit `Review failed (headless mode). Reason: cannot switch shared checkout. Re-invoke with base:<ref> to review the current checkout, or run from an isolated worktree.` Stop here unless the review is already running in an isolated checkout.

**Skip-condition pre-check.** Before checkout or scope detection, run a PR-state probe to decide whether the review should proceed:

```
gh pr view <number-or-url> --json state,title,body,files
```

Apply skip rules in order:

- `state` is `CLOSED` or `MERGED` -> stop with message `PR is closed/merged; not reviewing.`
- **Trivial-PR judgment**: make a conservative inline orchestrator judgment from the PR title, body, and changed file paths. Do not call `Agent`, `Task`, `spawn_agent`, or an equivalent dispatch primitive in this Stage 1 skip pre-check; reviewer dispatch authorization is not established until the Stage 4 dispatch gate. Consider dependency lock-file or manifest-only bumps, automated release commits, and chore version increments with no substantive code changes. When in doubt, answer no — skipped reviews that should have run are more costly than unnecessary reviews. If the judgment returns yes: stop with message `PR appears to be a trivial automated PR; not reviewing. Run without a PR argument to review the current branch, or pass base:<ref> if review is intended.`

When any skip rule fires, emit the message and stop without dispatching reviewers, switching the checkout, or running scope detection. **Standalone branch mode and `base:` mode are unaffected** -- they always run the full review. **Draft PRs are reviewed normally** -- draft status is not a skip condition; early feedback on in-progress work is valuable.

If no skip rule fires, proceed to the checkout logic below.

First, verify the worktree is clean before switching branches:

```
git status --porcelain
```

If the output is non-empty, inform the user: "You have uncommitted changes on the current branch. Stash or commit them before reviewing a PR, or use standalone mode (no argument) to review the current branch as-is." Do not proceed with checkout until the worktree is clean.

Then check out the PR branch so persona agents can read the actual code (not the current checkout):

```
gh pr checkout <number-or-url>
```

Then fetch PR metadata. Capture the base branch name and the PR base repository identity, not just the branch name. Project `reviews` and `comments` to a `hasPriorComments` boolean via `--jq` -- counting only, not materializing review or comment bodies into the orchestrator's context. The reviews filter excludes approval-state submissions with empty bodies, so PRs with only approval clicks correctly fall through the gate. Stage 3 uses `hasPriorComments` to decide whether to spawn `previous-comments`:

```
gh pr view <number-or-url> --json title,body,baseRefName,headRefName,url,reviews,comments --jq '{title, body, baseRefName, headRefName, url, hasPriorComments: ((.reviews | map(select(.state != "APPROVED" or .body != "")) | length) > 0 or (.comments | length) > 0)}'
```

Use the repository portion of the returned PR URL as `<base-repo>` (for example, `sunrain520/spec-first` from `https://github.com/sunrain520/spec-first/pull/348`).

Then compute a local diff against the PR's base branch so re-reviews also include local fix commits and uncommitted edits. Substitute the PR base branch from metadata (shown here as `<base>`) and the PR base repository identity derived from the PR URL (shown here as `<base-repo>`). Resolve the base ref from the PR's actual base repository, not by assuming `origin` points at that repo:

```
PR_BASE_REMOTE=$(git remote -v | awk 'index($2, "github.com:<base-repo>") || index($2, "github.com/<base-repo>") {print $1; exit}')
if [ -n "$PR_BASE_REMOTE" ]; then PR_BASE_REMOTE_REF="$PR_BASE_REMOTE/<base>"; else PR_BASE_REMOTE_REF=""; fi
PR_BASE_REF=$(git rev-parse --verify "$PR_BASE_REMOTE_REF" 2>/dev/null || git rev-parse --verify <base> 2>/dev/null || true)
if [ -z "$PR_BASE_REF" ]; then
  if [ -n "$PR_BASE_REMOTE_REF" ]; then
    git fetch --no-tags "$PR_BASE_REMOTE" <base>:refs/remotes/"$PR_BASE_REMOTE"/<base> 2>/dev/null || git fetch --no-tags "$PR_BASE_REMOTE" <base> 2>/dev/null || true
    PR_BASE_REF=$(git rev-parse --verify "$PR_BASE_REMOTE_REF" 2>/dev/null || git rev-parse --verify <base> 2>/dev/null || true)
  else
    if git fetch --no-tags https://github.com/<base-repo>.git <base> 2>/dev/null; then
      PR_BASE_REF=$(git rev-parse --verify FETCH_HEAD 2>/dev/null || true)
    fi
    if [ -z "$PR_BASE_REF" ]; then PR_BASE_REF=$(git rev-parse --verify <base> 2>/dev/null || true); fi
  fi
fi
if [ -n "$PR_BASE_REF" ]; then BASE=$(git merge-base HEAD "$PR_BASE_REF" 2>/dev/null) || BASE=""; else BASE=""; fi
```

```
if [ -n "$BASE" ]; then echo "BASE:$BASE" && echo "FILES:" && git diff --name-only $BASE && echo "DIFF:" && git diff -U10 $BASE && echo "UNTRACKED:" && git ls-files --others --exclude-standard; else echo "ERROR: Unable to resolve PR base branch <base> locally. Fetch the base branch and rerun so the review scope stays aligned with the PR."; fi
```

Extract PR title/body, base branch, and PR URL from `gh pr view`, then extract the base marker, file list, diff content, and `UNTRACKED:` list from the local command. Do not use `gh pr diff` as the review scope after checkout -- it only reflects the remote PR state and will miss local fix commits until they are pushed. If the base ref still cannot be resolved from the PR's actual base repository after the fetch attempt, stop instead of falling back to `git diff HEAD`; a PR review without the PR base branch is incomplete.

**If a branch name is provided as an argument:**

Check out the named branch, then diff it against the base branch. Substitute the provided branch name (shown here as `<branch>`).

If `mode:report-only` or `mode:headless` is active, do **not** run `git checkout <branch>` on the shared checkout. For `mode:report-only`, tell the caller: "mode:report-only cannot switch the shared checkout to review another branch. Run it from an isolated worktree/checkout for `<branch>`, or run report-only on the current checkout with no target argument." For `mode:headless`, emit `Review failed (headless mode). Reason: cannot switch shared checkout. Re-invoke with base:<ref> to review the current checkout, or run from an isolated worktree.` Stop here unless the review is already running in an isolated checkout.

First, verify the worktree is clean before switching branches:

```
git status --porcelain
```

If the output is non-empty, inform the user: "You have uncommitted changes on the current branch. Stash or commit them before reviewing another branch, or provide a PR number instead." Do not proceed with checkout until the worktree is clean.

```
git checkout <branch>
```

Then detect the review base branch and compute the merge-base. Run the trusted `skills/spec-code-review/scripts/resolve-base.sh` helper, which handles fork-safe remote resolution with multi-fallback detection (PR metadata -> `origin/HEAD` -> `gh repo view` -> common branch names). Runtime adapters rewrite this source path to the loaded workflow skill directory during `spec-first init`; never run a repo-root `scripts/resolve-base.sh` from the project under review.

```
RESOLVE_OUT=$(bash skills/spec-code-review/scripts/resolve-base.sh) || { echo "ERROR: resolve-base.sh failed"; exit 1; }
if [ -z "$RESOLVE_OUT" ] || echo "$RESOLVE_OUT" | grep -q '^ERROR:'; then echo "${RESOLVE_OUT:-ERROR: resolve-base.sh produced no output}"; exit 1; fi
BASE=$(echo "$RESOLVE_OUT" | sed 's/^BASE://')
```

If the script outputs an error, stop instead of falling back to `git diff HEAD`; a branch review without the base branch would only show uncommitted changes and silently miss all committed work.

On success, produce the diff:

```
echo "BASE:$BASE" && echo "FILES:" && git diff --name-only $BASE && echo "DIFF:" && git diff -U10 $BASE && echo "UNTRACKED:" && git ls-files --others --exclude-standard
```

You may still fetch additional PR metadata with `gh pr view` for title, body, linked issues, and the same projected `hasPriorComments` boolean from PR mode. Do not fail if no PR exists -- leave `hasPriorComments=false`.

**If no argument (standalone on current branch):**

Detect the review base branch and compute the merge-base using the same trusted `skills/spec-code-review/scripts/resolve-base.sh` helper as branch mode:

```
RESOLVE_OUT=$(bash skills/spec-code-review/scripts/resolve-base.sh) || { echo "ERROR: resolve-base.sh failed"; exit 1; }
if [ -z "$RESOLVE_OUT" ] || echo "$RESOLVE_OUT" | grep -q '^ERROR:'; then echo "${RESOLVE_OUT:-ERROR: resolve-base.sh produced no output}"; exit 1; fi
BASE=$(echo "$RESOLVE_OUT" | sed 's/^BASE://')
```

If the script outputs an error, stop instead of falling back to `git diff HEAD`; a standalone review without the base branch would only show uncommitted changes and silently miss all committed work on the branch.

On success, produce the diff:

```
echo "BASE:$BASE" && echo "FILES:" && git diff --name-only $BASE && echo "DIFF:" && git diff -U10 $BASE && echo "UNTRACKED:" && git ls-files --others --exclude-standard
```

Using `git diff $BASE` (without `..HEAD`) diffs the merge-base against the working tree, which includes committed, staged, and unstaged changes together.

**Untracked file handling:** Always inspect the `UNTRACKED:` list, even when `FILES:`/`DIFF:` are non-empty. Untracked files are outside review scope until staged. If the list is non-empty, tell the user which files are excluded. If any of them should be reviewed, stop and tell the user to `git add` them first and rerun. Only continue when the user is intentionally reviewing tracked changes only. In `mode:headless` or `mode:autofix`, do not stop to ask — proceed with tracked changes only and note the excluded untracked files in the Coverage section of the output.

### Stage 2: Intent discovery

Understand what the change is trying to accomplish. The source of intent depends on which Stage 1 path was taken:

**PR/URL mode:** Use the PR title, body, and linked issues from `gh pr view` metadata. Supplement with commit messages from the PR if the body is sparse.

**Branch mode:** Run `git log --oneline ${BASE}..<branch>` using the resolved merge-base from Stage 1.

**Standalone (current branch):** Run:

```
echo "BRANCH:" && git rev-parse --abbrev-ref HEAD && echo "COMMITS:" && git log --oneline ${BASE}..HEAD
```

Combined with conversation context (plan section summary, PR description), write a 2-3 line intent summary:

```
Intent: Simplify tax calculation by replacing the multi-tier rate lookup
with a flat-rate computation. Must not regress edge cases in tax-exempt handling.
```

Pass this to every reviewer in their spawn prompt. Intent shapes *how hard each reviewer looks*, not which reviewers are selected.

**When intent is ambiguous:**

- **Interactive mode:** Ask one question using the platform's blocking question tool (`AskUserQuestion` in Claude Code or `request_user_input` in Codex): "What is the primary goal of these changes?" Do not spawn reviewers until intent is established. **Claude Code only:** if `AskUserQuestion` has not yet been loaded this session (per the Interactive mode rules pre-load), call `ToolSearch` with query `select:AskUserQuestion` first before asking. Fall back to numbered options in chat only when the harness genuinely lacks a blocking tool or the call errors (e.g., Codex edit modes) — not because a schema load is required. Never silently skip the question.
- **Autofix/report-only/headless modes:** Infer intent conservatively from the branch name, diff, PR metadata, and caller context. Note the uncertainty in Coverage or Verdict reasoning instead of blocking.

### Stage 2b: Plan discovery (requirements verification)

Locate the plan document so Stage 6 can verify requirements completeness. Check these sources in priority order — stop at the first hit:

1. **`plan:` argument.** If the caller passed a plan path, use it directly. Read the file to confirm it exists.
2. **PR body.** If PR metadata was fetched in Stage 1, scan the body for paths matching `docs/plans/*.md`. If exactly one match is found and the file exists, use it as `plan_source: explicit`. If multiple plan paths appear, treat as ambiguous — demote to `plan_source: inferred` for the most recent match that exists on disk, or skip if none exist or none clearly relate to the PR title/intent. Always verify the selected file exists before using it — stale or copied plan links in PR descriptions are common.
3. **Auto-discover.** Extract 2-3 keywords from the branch name (e.g., `feat/onboarding-skill` -> `onboarding`, `skill`). Glob `docs/plans/*` and filter filenames containing those keywords. If exactly one match, use it. If multiple matches or the match looks ambiguous (e.g., generic keywords like `review`, `fix`, `update` that could hit many plans), **skip auto-discovery** — a wrong plan is worse than no plan. If zero matches, skip.

**Confidence-first tagging:** Record how the plan was found:
- `plan:` argument -> `plan_source: explicit` (high confidence)
- Single unambiguous PR body match -> `plan_source: explicit` (high confidence)
- Multiple/ambiguous PR body matches -> `plan_source: inferred` (lower confidence)
- Auto-discover with single unambiguous match -> `plan_source: inferred` (lower confidence)

If a plan is found, read its **Requirements** section — `## Requirements` in current plans, `## Requirements Trace` in legacy ones — and the R-IDs (R1, R2, etc.) listed there, plus **Implementation Units** under the `## Implementation Units` section. Recognize both current heading-style units (`### U1. [Name]`) and legacy list-item units (`- U1. **[Name]**`); the reader must remain compatible with older plans while new plans use heading-style units. Store the extracted requirements list, implementation unit IDs/titles, and `plan_source` for Stage 6. Do not block the review if no plan is found — requirements verification is additive, not required.

### Stage 2c: Boundary source discovery

Build the Diff Boundary Review input from the strongest available source:

1. Explicit touch set or task pack declared files -> `authorized_scope_source: explicit-touch-set`.
2. PR/work/plan text with concrete declared files only -> `authorized_scope_source: declared-files-only`.
3. Plan requirements and implementation units that imply file or behavior scope -> `authorized_scope_source: inferred-plan`.
4. Diff and branch/commit intent only -> `authorized_scope_source: diff-only`.
5. No usable scope signal -> `authorized_scope_source: unknown`.

Record `scope_boundary_evidence` as a compact list. It may include plan requirement IDs, implementation unit IDs, declared file paths, diff files, user-stated intent, and limitations. Do not record implementer claims as confirmed evidence unless they were checked against diff/source/test/log/contract. If the strongest source is `diff-only` or `unknown`, initialize `scope_boundary: unknown` unless Stage 5 later finds direct evidence for `concern` or `violation`.

**Changelog/release-note path reference check:** If `CHANGELOG.md` or a release-note/validation doc is in `FILES:`, inspect added lines for newly added repo-relative source/artifact path references (backtick paths, Markdown links, or plain path-like refs such as `docs/...`, `skills/...`, `src/...`, `templates/...`, `agents/...`, `tests/...`). Compare to `FILES:`, `git ls-files -- <path>`, and `UNTRACKED:`. A referenced path that exists only in `UNTRACKED:` is excluded from review and shipping scope; initialize or raise `scope_boundary: concern`, add `untracked-referenced-artifact:<path>` to `scope_boundary_evidence`, and derive `finding_type: untracked_referenced_artifact`. The derived label is workflow-local and does not require a findings-schema change. In `mode:headless` or `mode:autofix`, do not stage the artifact; report the boundary concern and continue only within the tracked review scope.

### Stage 3: Select reviewers

Read the diff and file list from Stage 1. Start with the deterministic scale-aware reviewer preflight below, then decide which conditional reviewers fit the diff. Conditional selection is agent judgment, not keyword matching.

#### Scale-aware reviewer preflight

Compute and record these facts before choosing the reviewer team:

- `changed_file_count`: tracked files in `FILES:`.
- `untracked_excluded_count`: untracked files excluded from review scope.
- `non_test_non_generated_non_lock_line_count`: changed executable/source lines excluding tests, generated files, vendored files, lockfiles, snapshots, and markdown/prose-only files.
- `docs_only`: every tracked changed file is Markdown, docs prose, images, examples, or non-runtime documentation.
- `simple_config_only`: changed files are package metadata, lint/test config, YAML/JSON/TOML config, or CI config with no executable source edits.
- `sensitive_diff`: any changed file or diff hunk touches auth, permissions, secrets, payments, migrations, public APIs, `src/cli/`, `bin/`, `templates/`, `skills/`, `agents/`, runtime generation, release packaging, CI publish/release gates, database schema/data, or production deploy config.
- `prior_comments_present`: Stage 1 `hasPriorComments=true`.
- `plan_explicit`: Stage 2b found an explicit plan.

When the source checkout has the helper available, also run the deterministic resource lens before reviewer selection:

```bash
spec-first internal resource-governance-lens \
  --target-repo <repo-root> \
  --json
```

Record `resource_lens_status`, advisory dimensions, and `reason_codes` with the preflight facts. Resource lens facts are advisory: they may justify reviewer focus or closeout notes, but they do not block review, do not replace reviewer judgment, and do not treat generated runtime paths as `evidence_ref` values. If the helper is unavailable, keep the existing scale-aware preflight and record `resource-governance-lens unavailable` in Coverage.

When confirmed findings or resource advisories reveal a repeated governance miss, the synthesis may record a small advisory shadow hit only when the current mode permits writes. In `mode:report-only` or single-agent report-only fallback, do not run this command; render `Rule Maturity Candidates` in Stage 6 and note skipped recording in Coverage instead.

```bash
spec-first internal rule-maturity record --rule-id summary-generated-output-staged --workflow spec-code-review --evidence-ref <durable-review-artifact-or-finding-ref> --reason-code <reason-code> --json
```

Only record when there is durable evidence and one of these signals exists: a P1/P2 finding exposes a repeated governance gap, the same low-level issue appears at least twice in one review, or an advisory clearly violates a registered contract or plan non-goal. Use `rule_id` as `lens-family + problem-class` kebab-case, carry `similar_existing_rule_ids` when known, and continue with Coverage noting degraded posture if `rule-maturity record` is unavailable or rejected. Do not automatically adjudicate, promote, demote, or convert the observation into a code-review finding.

Progressive disclosure boundary: low-risk docs-only, simple config, and tiny executable diffs may use a minimum reviewer set; high-risk workflow, contract, release, source/runtime boundary, external-tool evidence, security, or cross-module changes must use the full default core plus applicable conditional reviewers. The goal is to avoid unbounded fan-out on small diffs without hiding risk.

Use the minimum reviewer set only when all of these are true:

1. `changed_file_count <= 2`.
2. `untracked_excluded_count == 0`.
3. `sensitive_diff == false`.
4. `prior_comments_present == false`.
5. `plan_explicit == false`.
6. Either `docs_only == true`, `simple_config_only == true`, or `non_test_non_generated_non_lock_line_count <= 25`.

Minimum sets:

| Diff class | Reviewers |
|------------|-----------|
| `docs_only` | `spec-project-standards-reviewer`, `spec-maintainability-reviewer` |
| `simple_config_only` | `spec-correctness-reviewer`, `spec-testing-reviewer`, `spec-project-standards-reviewer` |
| tiny executable diff | `spec-correctness-reviewer`, `spec-testing-reviewer`, `spec-maintainability-reviewer` |

If any minimum-set condition is false, use the full default core: `spec-correctness-reviewer`, `spec-testing-reviewer`, `spec-maintainability-reviewer`, `spec-project-standards-reviewer`, `spec-agent-native-reviewer`, and `spec-learnings-researcher`. Always add applicable conditional reviewers after core selection. `mode:headless` and `mode:report-only` keep their structured output contracts while using the same scale-aware reviewer selection. `mode:autofix` may use the minimum set only for `docs_only` or `simple_config_only`; otherwise use the full default core because mutating review needs stronger coverage.

Record the preflight facts, selected core tier (`minimum` or `full`), and reason in Coverage. Also include resource lens advisory status when available. If the facts are missing, ambiguous, or contradicted by the diff, choose the full default core.

**File-type awareness for conditional selection:** Instruction-prose files (Markdown skill definitions, JSON schemas, config files) are product code but do not benefit from runtime-focused reviewers. The adversarial reviewer's techniques (race conditions, cascade failures, abuse cases) target executable code behavior. For diffs that only change instruction-prose files, skip adversarial unless the prose describes auth, payment, or data-mutation behavior. Count only executable code lines toward line-count thresholds.

**`previous-comments` is PR-only AND comment-gated.** Only select this persona when both conditions hold:

1. Stage 1 gathered PR metadata (PR number or URL was provided as an argument, or `gh pr view` returned metadata for the current branch).
2. `hasPriorComments` from Stage 1 is true.

Skip it for standalone branch reviews, PRs with no prior feedback yet, and approval-only reviews with empty bodies. There is nothing for the persona to verify in those cases, and an empty subagent run still costs the full startup overhead.

Stack-specific personas are additive. A Rails UI change may warrant `kieran-rails` plus `julik-frontend-races`; a TypeScript API diff may warrant `kieran-typescript` plus `api-contract` and `reliability`.

For Spec-First conditional agents, check if the diff includes files matching `db/migrate/*.rb`, `db/schema.rb`, `structure.sql`, or data backfill scripts. Do not trigger migration-only agents for model/query-only changes without migration artifacts.

Announce the team before spawning:

```
Review team:
- core tier: full -- sensitive CLI/runtime diff
- correctness (core)
- testing (core)
- maintainability (core)
- project-standards (core)
- spec-agent-native-reviewer (core)
- spec-learnings-researcher (core)
- security -- new endpoint in routes.rb accepts user-provided redirect URL
- kieran-rails -- controller and Turbo flow changed in app/controllers and app/views
- dhh-rails -- diff adds service objects around ordinary Rails CRUD
- data-migrations -- adds migration 20260303_add_index_to_orders
- spec-schema-drift-detector -- migration files present
```

This is progress reporting, not a blocking confirmation.

#### Direct evidence routing candidates

When the diff is broad or impact-sensitive, Stage 3 records direct evidence targets instead of external-tool calls:

- Route handler / public API diff -> inspect handler source, callers/consumers found by `rg`, route definitions, tests, and response-shape contracts when present.
- Response shape / consumer access diff -> inspect the route response source, consumer property reads, fixtures, and tests before raising shape drift.
- Shared symbol / helper diff -> inspect direct imports/callers found by `rg` or ast-grep, then sample representative tests.
- MCP/RPC tool definition diff -> inspect the tool definition, handler, descriptions, generated runtime expectations, and tests.
- Workspace multi-repo diff -> resolve direct evidence per child repo and keep findings scoped to the child repo that owns the file.

Direct evidence targets are review focus, not scope expansion. Do not raise a finding solely from a name match; every finding must be confirmed by diff/source/test/contract/log evidence before it enters the merged finding set.

#### Graph-assisted impact candidates

For impact-sensitive diffs, decide whether Graph-Assisted Impact Review applies. Reuse `docs/contracts/project-graph-consumption.md`; do not introduce a graph-specific evidence schema and do not read raw project-graph artifact JSON.

When a capability-class provider is ready and relevant, gather a minimal candidate set and record:

- `changed_symbols`, `changed_entrypoints`, and `changed_contracts` when the diff can be mapped to source symbols or contract surfaces.
- `symbol_mapping_status`: `mapped | degraded | not_applicable`, with a limitation when large hunks, Markdown/prose, generated files, or provider gaps prevent reliable symbol mapping.
- `caller_callee_paths`, `impact_chain_candidates`, and `blast_radius_candidates` only within the minimal-first budget.
- `affected_test_candidates`, `tests_for_query_result`, `missing_test_confirmation`, and `test_gaps` when candidate tests exist, when expected tests are missing, or when provider/read evidence cannot identify or confirm a test path.
- `review_priority_candidates` ordered by impact, publicness, contract/source-runtime sensitivity, security/permission risk, and missing-test signal.
- `limitations` explaining unsupported file types, stale/unknown readiness, no candidates, or bounded sampling.

Every graph-derived candidate is `provider_untrusted` until confirmed by bounded source/test/log/contract evidence. A reviewer may use candidates to choose which files to inspect next, but a finding that cites graph impact must cite the confirming source, diff, test, log, or contract evidence as the finding evidence.

### Stage 3b: Discover project standards paths

Before spawning sub-agents, find the file paths (not contents) of all relevant standards files for the `project-standards` persona. This is the explicit leaf-reviewer exception to the Host Instruction Reuse Policy: the parent orchestrator discovers paths, and the `project-standards` reviewer reads only the relevant sections. Use the native file-search/glob tool to locate:

1. Use the native file-search tool (e.g., Glob in Claude Code) to find all `**/CLAUDE.md` and `**/AGENTS.md` in the repo.
2. Filter to those whose directory is an ancestor of at least one changed file. A standards file governs all files below it (e.g., `plugins/spec-first/AGENTS.md` applies to everything under `plugins/spec-first/`).
3. If `docs/contracts/team-standards.md` exists, include that contract and `docs/standards/index.md` in the path list. The leaf reviewer uses the contract/index to select only `trust=confirmed,lifecycle_state=active`, scope-matched rule files from `docs/standards/**`; it must not receive or read the full standards corpus by default.

Pass the resulting path list to the `project-standards` persona inside a `<standards-paths>` block in its review context (see Stage 4). The persona reads the files itself, targeting only the sections and standards rule cards relevant to the changed file types. This keeps the orchestrator's work cheap (path discovery only), avoids bloating the subagent prompt with content the reviewer may not fully need, and prevents ordinary review orientation from re-reading root host instruction files or dumping `docs/standards/**`.

### Stage 4: Spawn sub-agents

#### Runtime readiness preflight

Before creating a run ID or dispatching reviewers, run a read-only host/runtime readiness preflight for the current repo. This preflight is deterministic evidence prepared by `spec-mcp-setup`; it does not decide review quality or scope.

Use the current-host runtime path when the workflow is installed, and the source path when developing spec-first itself:

| Context | Preflight command |
|---------|-------------------|
| Codex runtime | `bash .agents/skills/spec-mcp-setup/scripts/detect-tools.sh` |
| Claude runtime | `bash .claude/spec-first/workflows/spec-mcp-setup/scripts/detect-tools.sh` |
| Source checkout | `bash skills/spec-mcp-setup/scripts/detect-tools.sh` |

If the target repo was selected with an explicit `--repo` / child scope earlier in the workflow, pass the same repo selector to the preflight. Do not use this preflight to select a repo; repo scope still comes from Stage 1 and the current review target.

Interpret the JSON facts narrowly:

- `host_config_status: ready | fallback-active | registry-args-drift | not-required` means the host config is acceptable for dispatch. `registry-args-drift` is acceptable-but-degraded: record the tool id, `result`, `reason_code`, and next action posture in Coverage, but do not treat it as unsafe by itself.
- `host_config_status: action-required | precedence-blocked`, missing required dependencies, or a non-ready required MCP project status means the current runtime is not safe for multi-persona dispatch.
- A required MCP startup/config failure is a **runtime boundary issue**, not a code-review finding. Record it once in Coverage with the tool id, status, and next action.
- Missing optional external-tool evidence does not by itself disable reviewer dispatch; it only limits the review claims and should be carried into Coverage when relevant.

After `detect-tools.sh` and before reviewer dispatch, consolidate direct handoff evidence once:

- If a `plan:` argument or Stage 2b discovery found a plan, inspect its source refs, direct evidence notes, limitations, and repo scope.
- If the caller explicitly handed off a spec-work run artifact path / `run_id`, or if the source-owned reader can read a recent artifact, read direct source/test/log evidence as best-effort supplement. Prefer `spec-first internal spec-work-run-artifact read --target-repo <repo>` and add `--workspace-slug` / `--run-id` when an exact selector is available; do not directly scan `.spec-first/workflows/spec-work/**` or implement "latest run.json" selection in this skill prose.
- Before consuming work artifact evidence, confirm it is bound to the current review scope: explicit path/run id came from this handoff, or artifact `plan_path` / `source_refs` reasonably match the current `plan:`, review base, and changed files. If the reader returns not-found/not-readable, direct evidence is missing, schema/shape is unavailable, or scope mismatches, record the limitation and do not inject the artifact evidence into reviewer prompts.
- Carry the consolidated direct evidence posture to Stage 6 Coverage. Do not ask each persona reviewer to repeat the same setup preflight.

When a required MCP server is not host-config-ready before dispatch, do not spawn reviewer agents in Codex or Claude. This is a runtime boundary issue, and the fallback is mode-aware:

- **Interactive/report-only:** set `single_agent_report_only_fallback: true`, treat the effective mode as report-only, and run the selected persona lenses inline with bounded direct repo reads. This avoids multiplying the same MCP startup failure across every leaf reviewer.
- **Headless:** emit `Review failed (headless mode). Reason: required MCP runtime not ready: <tool id> <status>/<reason_code>.` Stop without dispatching reviewers, applying fixes, creating `<review-artifact-dir>/`, or claiming "Review complete".
- **Autofix:** emit `Review failed. Reason: required MCP runtime not ready: <tool id> <status>/<reason_code>. Mutating review requires safe reviewer/fixer dispatch capability.` Stop without dispatching reviewers, applying fixes, or writing run artifacts.

If the preflight script is missing or cannot run, do not invent readiness facts; record `runtime readiness preflight unavailable` in Coverage and continue only if the host has not already reported MCP startup failure in the current session and the selected mode can safely continue without mutation. If the host has already reported `MCP startup incomplete` or equivalent startup failure, apply the same mode-aware fallback above.

### Dispatch capability gate

Before creating a run ID or dispatching any reviewer, confirm the current host exposes a dispatch primitive and the selected reviewers are part of this documented code-review phase. Dispatch capability is part of the runtime boundary, not a reviewer-selection preference.

Reviewers are analysis agents, not implementation workers. Dispatch is bounded to the resolved diff scope, selected reviewer personas, advisory facts, and output schema. Do not create hidden implement/check agents from code review. Mutation is allowed only through documented `safe_auto` / selected Apply paths in the chosen mode; report-only fallback, unsafe runtime, or missing dispatch capability must not edit source, generated runtime mirrors, or workflow artifacts.

- In Codex, the current tool contract controls dispatch permission. A workflow entrypoint by itself is not enough to call `spawn_agent`; require an explicit user request for subagents/parallel agents/delegated review or an explicit parent-orchestrator delegation whose visible parent request or handoff evidence carries that permission.
- In Claude, follow the current host's documented workflow-owned dispatch admission rules; if the host contract is unavailable or ambiguous, prefer the single-agent report-only fallback.
- If the user explicitly requested subagents, parallel agents, or delegated review and the host exposes a dispatch primitive, continue with normal multi-persona dispatch.
- If the active workflow or parent orchestrator explicitly delegated this code-review workflow and that visible delegation includes reviewer-dispatch permission, continue with normal multi-persona dispatch.
- If the user explicitly requests report-only/no-agents mode, the host lacks a dispatch primitive, or the current runtime cannot call it, do not call `Agent`, `Task`, `spawn_agent`, or equivalent dispatch tools.
- Codex may expose reviewer dispatch through `spawn_agent`, but use it only when both the host capability and the current permission boundary allow it. Do not downgrade solely because the host is Codex when the permission boundary is satisfied.

When dispatch is unavailable, explicitly disabled, or unsafe, set `single_agent_report_only_fallback: true` and run the rest of the review in read-only form:

- Treat the effective mode as report-only, even if no `mode:report-only` token was provided.
- If the user requested `mode:autofix` or `mode:headless`, stop and explain that mutating review requires reviewer/fixer dispatch capability or an isolated workflow that permits it; offer report-only as the safe fallback.
- Do not create `<review-artifact-dir>/` and do not write reviewer artifacts.
- The orchestrator applies the selected persona lenses itself, serially, using the same diff, plan, standards, and direct evidence.
- Skip Stage 5b validator dispatch and all fixer paths.
- In Coverage, state `single-agent report-only fallback: reviewer dispatch unavailable, explicitly disabled, or unsafe`.

#### Model tiering

Three reviewers inherit the session model with no override: `spec-correctness-reviewer`, `spec-security-reviewer`, and `spec-adversarial-reviewer`. These perform the highest-stakes analysis — logic bugs, security vulnerabilities, adversarial failure scenarios — and should run at whatever capability level the user has configured. If the user is on Opus, these get Opus.

All other persona sub-agents and Spec-First agents use the platform's mid-tier model to reduce cost and latency when the host exposes a stable, configured model alias. See the Spawning subsection for the dispatch-time override; the imperative lives there so it is applied at the point of action. On other platforms, do not invent a model name from memory; use only a host-provided stable alias or omit the model parameter, and on other platforms use a host-provided cheap stable alias or omit the model parameter and let agents inherit the default -- a working review on the parent model is better than a broken dispatch from an unrecognized model name.

The orchestrator (this skill) also inherits the session model; it handles intent discovery, reviewer selection, finding merge/dedup, and synthesis -- tasks that benefit from the same reasoning capability the user configured.

#### Run ID

Generate a unique run identifier before dispatching any agents. This ID scopes parent/orchestrator-owned reviewer detail files and the post-review run artifact to the same directory.

```js
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const runId = `${new Date().toISOString().replace(/[-:.TZ]/g, '')}-${crypto.randomBytes(4).toString('hex')}`;
const reviewArtifactDir = path.join(os.tmpdir(), 'spec-first', 'spec-code-review', runId);
fs.mkdirSync(reviewArtifactDir, { recursive: true });
```

Pass `{run_id}` and `{review_artifact_dir}` to every persona sub-agent as correlation metadata only. Do not ask leaf reviewers to write files directly. Reviewer agents return full structured JSON to the orchestrator; after each return, the orchestrator may write that JSON to `<review-artifact-dir>/{reviewer_name}.json` in modes that permit run artifacts.

**Report-only mode:** Skip run-id generation and directory creation. Do not pass `{run_id}` to agents. Agents return full structured JSON to the parent with no file write, consistent with report-only's no-write contract.

**Single-agent report-only fallback:** also skip run-id generation and directory creation. There are no agent artifact files; Stage 6 must omit artifact-enriched detail that is unavailable and name the fallback in Coverage.

#### Spawning

Omit the `mode` parameter when dispatching sub-agents so the user's configured permission settings apply. Do not pass `mode: "auto"`.

**Codex `spawn_agent` parameter hygiene.** Codex reviewer prompts are self-contained: pass the persona, diff-scope rules, output schema, PR metadata, intent, file list, diff, and standards paths in the `message` or `items` payload instead of relying on inherited thread context. Dispatch one reviewer per `spawn_agent` call; do not bundle multiple reviewer personas into one sub-agent prompt. For Codex reviewer personas, prefer the default sub-agent type and omit `agent_type`; these reviewers are specialized by the prompt, not by a generic explorer/worker role. If a specific runtime genuinely needs an `agent_type`, omit `fork_context` (or leave it false); do not combine `fork_context: true` with `agent_type`. If a Codex dispatch fails before the reviewer starts because of parameter incompatibility, correct the parameters once and retry through the bounded scheduler; record it as an orchestrator dispatch correction, not a reviewer failure. If a runtime requires `fork_context: true` for a particular dispatch, omit `agent_type` and still include the full self-contained review context.

**Model override at dispatch time.** Pass the platform's mid-tier model on every dispatch except `spec-correctness-reviewer`, `spec-security-reviewer`, and `spec-adversarial-reviewer`, which inherit the session model. In Claude Code, add `model: "sonnet"` to the Agent tool call. On other platforms, use only a host-provided stable alias or omit the override. Check this on every Agent / `spawn_agent` / equivalent call in the dispatch loop.

**Bounded parallel dispatch.** Respect the current harness's active-subagent limit. Queue selected reviewers, dispatch only as many as the harness accepts, and fill freed slots as reviewers complete. Treat active-agent/thread/concurrency-limit spawn errors as backpressure, not reviewer failure: leave the reviewer queued and retry after a slot frees. Record a reviewer as failed only after successful dispatch times out/fails, or when dispatch fails for a non-capacity reason.

Codex scheduling rules:

- Start with at most 4 active reviewer agents unless the runtime explicitly advertises a lower or higher safe cap. Do not launch every selected reviewer in one burst.
- A generic `Agent spawn failed` with one or more active reviewers is presumed capacity/backpressure first, even if the error text does not name a limit. Wait for any active reviewer to complete, then retry the same queued reviewer once.
- A spawn failure that includes `MCP startup incomplete`, `MCP startup failed`, or a required MCP server name is a runtime readiness failure. Stop launching new reviewers, record the degraded tool once in Coverage, collect any already-started reviewers that can complete, and apply remaining persona lenses inline through the single-agent report-only fallback.
- Parameter incompatibility remains separate from capacity: correct `spawn_agent` parameters once per the Codex parameter hygiene rule, then retry through the same queue.
- Only mark a queued reviewer as failed after the bounded retry path rules out capacity/backpressure and runtime-readiness fallback, or after a successfully spawned reviewer times out/fails.

Spawn each selected persona reviewer using the subagent template included below. Each persona sub-agent receives:

1. Their persona file content (identity, failure modes, calibration, suppress conditions)
2. Shared diff-scope rules from the diff-scope reference included below
3. The JSON output contract from the findings schema included below
4. PR metadata: title, body, and URL when reviewing a PR (empty string otherwise). Passed in a `<pr-context>` block so reviewers can verify code against stated intent
5. Review context: intent summary, file list, diff
6. Run ID and review artifact directory for modes that create run artifacts, plus reviewer name for correlation and parent-owned artifact filenames
7. Boundary context from Stage 2c, wrapped in `<boundary-context>`: `scope_boundary`, `authorized_scope_source`, `scope_boundary_evidence`, declared files/touch set when known, plan requirement or implementation-unit refs, and limitations.
8. Graph impact context from Stage 3, wrapped in `<graph-impact-context>`: `graph_assist`, `graph_reason_code`, `expansion_budget`, `provider_untrusted.summaries[]`, candidate fields, rejected candidates, test candidates, `test_gaps`, and limitations. This context is advisory/provider_untrusted unless confirmed by direct evidence.
9. **For `project-standards` only:** the standards file path list from Stage 3b, wrapped in a `<standards-paths>` block appended to the review context

Persona sub-agents are **read-only** with respect to the project and the filesystem: they review and return structured JSON. They do not edit project files or write temp artifacts. They must not propose unrelated or speculative refactors, but may propose the smallest finding-scoped structural fix when it is grounded in the diff and surrounding code (for example a mechanical helper extraction that the schema's `suggested_fix` rules allow). Artifact persistence is parent/orchestrator-owned so reviewer capability frontmatter does not need broad `Write`.

Read-only here means **non-mutating**, not "no shell access." Reviewer sub-agents may use non-mutating inspection commands when needed to gather evidence or verify scope, including read-oriented `git` / `gh` usage such as `git diff`, `git show`, `git blame`, `git log`, and `gh pr view`. They must not edit project files, change branches, commit, push, create PRs, or otherwise mutate the checkout or repository state.

Each persona sub-agent returns full JSON (all schema fields) to the orchestrator. In non-report-only modes, the orchestrator may persist that exact return to `<review-artifact-dir>/{reviewer_name}.json` for detail enrichment and debugging:

```json
{
  "reviewer": "security",
  "findings": [
    {
      "title": "User-supplied ID in account lookup without ownership check",
      "severity": "P0",
      "file": "orders_controller.rb",
      "line": 42,
      "why_it_matters": "Any signed-in user can read another user's orders by pasting the target account ID into the URL. The controller looks up the account and returns its orders without verifying the current user owns it.",
      "confidence": 100,
      "evidence": [
        "orders_controller.rb:42 -- account = Account.find(params[:account_id])"
      ],
      "autofix_class": "gated_auto",
      "owner": "downstream-resolver",
      "requires_verification": true,
      "pre_existing": false,
      "suggested_fix": "Add current_user.owns?(account) guard before lookup"
    }
  ],
  "residual_risks": [...],
  "testing_gaps": [...]
}
```

Detail-tier fields (`why_it_matters`, `evidence`) come from the reviewer return first. Persisted artifact files are an optional parent-owned cache for downstream detail enrichment; if artifact persistence fails, the in-memory return still provides everything the merge needs.

**Spec-First always-on agents** (spec-agent-native-reviewer, spec-learnings-researcher) are dispatched as standard Agent calls through the same bounded scheduler as the persona agents. Give them the same review context bundle the personas receive: entry mode, any PR metadata gathered in Stage 1, intent summary, review base branch name when known, `BASE:` marker, file list, diff, and `UNTRACKED:` scope notes. Do not invoke them with a generic "review this" prompt. Their output is unstructured and synthesized separately in Stage 6.

**Spec-First conditional agents** (spec-schema-drift-detector, spec-deployment-verification-agent) are also dispatched as standard Agent calls through the same bounded scheduler when applicable. Pass the same review context bundle plus the applicability reason (for example, which migration files triggered the agent). For spec-schema-drift-detector specifically, pass the resolved review base branch explicitly so it never assumes `main`. Their output is unstructured and must be preserved for Stage 6 synthesis just like the Spec-First always-on agents.

### Stage 5: Merge findings

Convert multiple reviewer JSON returns into one deduplicated, confidence-gated finding set. The returns contain merge-tier fields (title, severity, file, line, confidence, autofix_class, owner, requires_verification, pre_existing, suggested_fix) plus detail-tier fields (`why_it_matters`, `evidence`). Stage 5 uses merge-tier fields for dedup and keeps detail-tier fields attached for Stage 6; persisted artifact files are a cache, not the source of truth.

`confidence` is one of 5 discrete anchors (`0`, `25`, `50`, `75`, `100`) with behavioral definitions in the findings schema. Synthesis treats anchors as integers; do not coerce to floats.

1. **Validate.** Check each reviewer return for required top-level and per-finding fields, plus value constraints. Drop malformed returns or findings. Record the drop count.
   - **Top-level required:** reviewer (string), findings (array), residual_risks (array), testing_gaps (array). Drop the entire return if any are missing or wrong type.
   - **Per-finding required for current full reviewer returns:** title, severity, file, line, why_it_matters, evidence, confidence, autofix_class, owner, requires_verification, pre_existing
   - **Legacy/compact degraded returns:** if a returned finding has valid merge-tier fields but lacks detail-tier fields (`why_it_matters`, `evidence`), keep it only when the current output mode can safely omit detail and record the degradation in Coverage. Headless output, tracker externalization, and any surface that needs ticket/body detail should treat missing detail as degraded and must not claim full-schema validation.
   - **Value constraints:**
     - severity: P0 | P1 | P2 | P3
     - autofix_class: safe_auto | gated_auto | manual | advisory
     - owner: review-fixer | downstream-resolver | human | release
     - confidence: integer in {0, 25, 50, 75, 100}
     - line: positive integer
     - pre_existing, requires_verification: boolean
   - Validate current reviewer returns against the full schema. If a detail-tier field is malformed but the merge-tier fields are valid, keep the finding only under the legacy/compact degraded rule above.
2. **Deduplicate.** Compute fingerprint: `normalize(file) + line_bucket(line, +/-3) + normalize(title)`. When fingerprints match, merge: keep highest severity, keep highest anchor, note which reviewers flagged it. Dedup runs over the full validated set (including anchor 50) so cross-reviewer promotion in step 3 can lift matching anchor-50 findings into the actionable tier.
3. **Cross-reviewer agreement.** When 2+ independent reviewers flag the same issue (same fingerprint), promote the merged finding by one anchor step up to the high-confidence tier: `50 -> 75`, `75 -> 75`, `100 -> 100`. Cross-reviewer corroboration is a stronger signal than any single reviewer's anchor, but it does not by itself satisfy the `100` anchor's "verifiable from code alone, no interpretation required" bar. Promote to `100` only when the merged direct evidence independently meets that bar. Note the agreement in the Reviewer column of the output (e.g., "security, correctness").
4. **Separate pre-existing.** Pull out findings with `pre_existing: true` into a separate list.
5. **Resolve disagreements.** When reviewers flag the same code region but disagree on severity, autofix_class, or owner, annotate the Reviewer column with the disagreement (e.g., "security (P0), correctness (P1) -- kept P0"). This transparency helps the user understand why a finding was routed the way it was.
6. **Normalize routing.** For each merged finding, set the final `autofix_class`, `owner`, and `requires_verification`. If reviewers disagree, keep the most conservative route. Synthesis may narrow a finding from `safe_auto` to `gated_auto` or `manual`, but must not widen it without new evidence.
6a. **Derive Phase A report labels.** Add synthesis-owned labels for report/headless output without requiring leaf reviewers to return new schema fields:
   - `finding_type`: derive at least `scope_creep`, `unauthorized_file_change`, `unverifiable_claim`, and `missing_verification` when the finding evidence supports those meanings. Other findings may omit the label.
   - `scope_boundary`: keep the run-level value from Stage 2c unless a surviving finding proves `concern` or `violation`.
   - `authorized_scope_source`: carry the Stage 2c source value unchanged so downstream readers can tell whether the boundary verdict came from an explicit touch set, declared files, an inferred plan, diff-only context, or unknown scope.
   High-confidence `scope_creep` and `unauthorized_file_change` findings are primary findings. Do not reroute them into `residual_risks`, `testing_gaps`, or advisory-only prose just because they are governance findings.
6b. **Derive the recommended action.** Interactive mode's walk-through and best-judgment paths present a per-finding recommended action (Apply / Defer / Skip / Acknowledge). The recommendation is derived from the normalized `autofix_class` and the presence of `suggested_fix` using this mapping:

| `autofix_class` | `suggested_fix` present? | Recommended action |
|-----------------|--------------------------|--------------------|
| `safe_auto`     | auto-applied before the routing question | Apply |
| `gated_auto`    | yes                      | Apply |
| `gated_auto`    | no                       | Defer |
| `manual`        | yes                      | Apply |
| `manual`        | no                       | Defer |
| `advisory`      | n/a                      | Acknowledge |

The presence of `suggested_fix` is the authoritative signal that the agent can act on the finding. A `manual` finding with a concrete `suggested_fix` recommends Apply because the persona committed to a defensible fix shape grounded in review context. A `manual` finding without `suggested_fix` recommends Defer because the persona signaled that the fix needs context the reviewer cannot provide. `autofix_class` itself is not collapsed by this mapping; the report still records `manual` vs `gated_auto`.

**Cross-reviewer tie-break.** When contributing reviewers implied different actions for the same merged finding, synthesis picks the most conservative using the order `Skip > Defer > Apply > Acknowledge`. This rule fires only on multi-reviewer disagreement; the mapping above is the single-reviewer default. Tie-break guarantees that identical review artifacts produce the same recommendation deterministically, so best-judgment results are auditable and the walk-through's recommendation is stable across re-runs.
6c. **Mode-aware demotion of weak general-quality findings.** Some persona output is real signal but does not warrant primary-findings attention. Reroute it to the existing soft buckets so the primary findings table stays focused on actionable issues.

A finding qualifies for demotion when **all** of these hold:
   - Severity is P2 or P3 (P0 and P1 always stay in primary findings)
   - `autofix_class` is `advisory` (concrete-fix findings stay in primary)
   - **All** contributing reviewers are `testing` or `maintainability` — if any other persona also flagged this finding, cross-reviewer corroboration is present and the finding stays in primary findings regardless of its severity or advisory status (expand the weak-signal list later only with evidence)

When a finding qualifies, route by mode:
   - **Interactive and report-only modes:** Move the finding out of the primary findings set. If the contributing reviewer is `testing`, append `<file:line> -- <title>` to `testing_gaps`. If `maintainability`, append the same to `residual_risks`. Record the demotion count for Coverage. The finding does not appear in the Stage 6 findings table. Soft-bucket entries are FYI items; include detail only when it helps and is already available from the reviewer return.
   - **Headless and autofix modes:** Suppress the finding entirely. Record the suppressed count in Coverage as "mode-aware demotion suppressions" so the user can see what was filtered.

Demotion is intentionally narrow. The conservative scope (testing/maintainability + P2/P3 + advisory) is the starting point; do not expand the rule by guessing which other personas overproduce noise. If real review runs show another persona consistently emitting weak signal, expand with evidence.

7. **Confidence-first gate.** After dedup, promotion, and demotion have shaped the primary set, suppress remaining findings below anchor 75. Exception: P0 findings at anchor 50+ survive the gate -- critical-but-uncertain issues must not be silently dropped. Record the suppressed count by anchor (so Coverage can report "N findings suppressed at anchor 50, M at anchor 25"). The gate runs late deliberately: anchor-50 findings need a chance to be promoted by step 3 (cross-reviewer corroboration) or rerouted by step 6c (mode-aware demotion to soft buckets) before any drop decision.
8. **Partition the work.** Build three sets:
   - in-skill fixer queue: only `safe_auto -> review-fixer`
   - residual actionable queue: unresolved `gated_auto` or `manual` findings whose owner is `downstream-resolver`
   - report-only queue: `advisory` findings plus anything owned by `human` or `release`
9. **Sort and number.** Order by severity (P0 first) -> anchor (descending) -> file path -> line number, then assign monotonically increasing `#` values across the full primary finding set in that sorted order. Do not restart numbering inside each severity table or autofix/routing bucket. If later sections repeat a finding (for example Residual Actionable Work after `safe_auto` fixes are applied), reuse the same stable `#` so users and downstream workflows can reference findings by `#` after the autofix loop rewrites the report.
10. **Collect coverage data.** Union residual_risks and testing_gaps across reviewers. Keep `test_gaps` as a first-class Coverage signal: include reviewer `testing_gaps`, graph-assisted `affected_test_candidates` gaps, direct-evidence missing-test observations, and any requirement/plan verification gaps that are not already primary findings. Do not hide test gaps only in recommendations prose.
10a. **Collect graph-assisted coverage data.** Carry `graph_assist`, `graph_reason_code`, `expansion_budget`, `provider_untrusted.summaries[]`, `changed_symbols`, `changed_entrypoints`, `changed_contracts`, `symbol_mapping_status`, `impact_chain_candidates`, `blast_radius_candidates`, `caller_callee_paths`, `affected_test_candidates`, `tests_for_query_result`, `missing_test_confirmation`, `review_priority_candidates`, `test_gaps`, and `limitations` into Stage 6. If graph candidates were rejected because direct evidence did not confirm them, list the rejection in `provider_untrusted.summaries[]` instead of creating a finding.
11. **Preserve Spec-First agent artifacts.** Keep the learnings, agent-native, schema-drift, and deployment-verification outputs alongside the merged finding set. Do not drop unstructured agent output just because it does not match the persona JSON schema.

### Stage 5b: Validation pass (externalizing modes only)

Independent verification gate. Spawn one validator sub-agent per surviving finding using `references/validator-template.md`. The validator's job is to re-check the finding against the diff and surrounding code with no commitment to the original persona's analysis. Findings the validator rejects are dropped; findings the validator confirms flow through unchanged.

**When this stage runs:**

| Mode | Runs Stage 5b? | Where |
|------|---------------|-------|
| `headless` | Yes, eagerly | Between Stage 5 and Stage 6 |
| `autofix` | Yes, eagerly | Between Stage 5 and Stage 6 |
| `interactive`, walk-through routing (option A) — per-finding phase | No -- the user is the per-finding validator | n/a |
| `interactive`, walk-through routing (option A) — Auto-resolve with best judgment on the rest handoff | No -- the best-judgment path dispatches the fixer immediately; the fixer's apply/fail outcome is the validation | n/a |
| `interactive`, best-judgment routing (option B) | No -- the best-judgment path dispatches the fixer immediately; the fixer's apply/fail outcome is the validation | n/a |
| `interactive`, File-tickets routing (option C) | Yes, on all pending findings | Before tracker dispatch |
| `interactive`, Report-only routing (option D) | No -- nothing is being externalized | n/a |
| `report-only` | No -- read-only mode externalizes nothing | n/a |
| single-agent report-only fallback | No -- dispatch is unavailable, explicitly disabled, or unsafe | n/a |

When Stage 5b does not run, the merged finding set from Stage 5 flows through to Stage 6 unchanged. When it runs, the steps below execute on the relevant set.

The best-judgment path skips Stage 5b deliberately. Running validators before fixer dispatch is duplicate research: the fixer re-checks each finding while applying or proposing the fix, and items where the cited evidence no longer matches the code are routed to the `failed` bucket during the fix attempt. The user reviews via diff and the post-run failure-handling question, not via a pre-dispatch validator gate.

**Steps:**

1. **Select findings to validate.**
   - **headless/autofix:** All survivors of Stage 5.
   - **interactive File-tickets (option C):** All pending findings regardless of recommended action. Option C externalizes every finding as a ticket, so every finding needs validation.
2. **Apply dispatch budget cap.** If the selected set exceeds 15 findings, dispatch validators only for the highest-severity 15 (P0 first, then P1, then P2, then P3, breaking ties by anchor descending). Do not drop the remainder. Mark each over-budget finding as `validation_skipped/over_budget`, carry it unchanged into the next phase, and record the skipped count for the Coverage section. The cap limits validator fan-out only; it must not erase already-surviving findings from headless, autofix, ticket, or final-report outputs.
3. **Spawn validators with bounded parallelism.** One sub-agent per finding, dispatched independently using the validator template and the same bounded scheduler from Stage 4. Each validator receives:
   - The finding's title, severity, file, line, suggested_fix, original reviewer name, and confidence-first anchor
   - `why_it_matters` when available — loaded from the reviewer return. If the return has only merge-tier fields because a legacy reviewer/template was used, omit it and record the degradation. The validator proceeds without it, using the diff and cited code directly.
   - The full diff
   - Read-tool access to inspect the cited code, callers, guards, framework defaults, and git blame
4. **Collect verdicts.** Each validator returns `{ "validated": true | false, "reason": "<one sentence>" }`.
   - `validated: true` -> finding survives unchanged into the next phase (Stage 6 for headless/autofix, dispatch for interactive)
   - `validated: false` -> finding is dropped; record the validator's reason in Coverage
   - Validator failure (timeout, dispatch error, malformed JSON) -> keep the finding, mark validation as `degraded/unvalidated`, and record the validator failure reason in Coverage. Do not treat infrastructure failure as counter-evidence. P0/P1 unvalidated findings must remain visible and should keep the verdict at "Not ready" or "Ready with fixes" unless another confirmed resolution exists.
5. **Use mid-tier model for validators.** Same model class (sonnet) the persona reviewers use. Validators are read-only — same constraints as persona reviewers. They may use non-mutating inspection commands (Read, Grep, Glob, git blame, gh).
6. **Record metrics for Coverage.** Total dispatched, validated true count, validated false count (with reasons), failures, and over-budget validation skips.

**Why per-finding bounded dispatch (not batched):** Independence is the point. A single batched validator looking at all findings together pattern-matches across them and recreates the persona-bias problem. Per-finding dispatch preserves fresh context while the scheduler respects harness limits. Per-file batching is a plausible future optimization for reviews with many findings clustered in few files; not implemented today.

### Stage 6: Synthesize and present

Assemble the final report using **pipe-delimited markdown tables for findings** from the review output template included below. The table format is mandatory for finding rows in interactive mode — do not render findings as freeform text blocks or horizontal-rule-separated prose. Escape every literal pipe character inside table cell text as `\|` before rendering so file paths, shell snippets, TypeScript union types, and markdown examples cannot corrupt the table. Other report sections (Applied Fixes, Learnings, Coverage, etc.) use bullet lists and the `---` separator before the verdict, as shown in the template.

1. **Header.** Scope, intent, mode, reviewer team with per-conditional justifications.
2. **Findings.** Rendered as pipe-delimited tables grouped by severity (`### P0 -- Critical`, `### P1 -- High`, `### P2 -- Moderate`, `### P3 -- Low`). Each finding row shows `#`, file, issue, reviewer(s), confidence, and synthesized route. Omit empty severity levels. Never render findings as freeform text blocks or numbered lists. Finding numbers come from the stable assignment in Stage 5 -- never re-derive them per severity table.
3. **Requirements Completeness.** Include only when a plan was found in Stage 2b. For each requirement (R1, R2, etc.) and implementation unit in the plan, report whether corresponding work appears in the diff. Use a simple checklist: met / not addressed / partially addressed. Routing depends on `plan_source`:
   - **`explicit`** (caller-provided or PR body): Flag unaddressed requirements as P1 findings with `autofix_class: manual`, `owner: downstream-resolver`. These enter the residual actionable queue.
   - **`inferred`** (auto-discovered): Flag unaddressed requirements as P3 findings with `autofix_class: advisory`, `owner: human`. These stay in the report only — no autonomous follow-up. An inferred plan match is a hint, not a contract.
   Omit this section entirely when no plan was found — do not mention the absence of a plan.
4. **Applied Fixes.** Include only if a fix phase ran in this invocation.
5. **Residual Actionable Work.** Include when unresolved actionable findings were handed off or should be handed off.
6. **Pre-existing.** Separate section, does not count toward verdict.
7. **Learnings & Past Solutions.** Surface spec-learnings-researcher results: if past solutions are relevant, flag them as "Known Pattern" with links to docs/solutions/ files. Recalled learnings are advisory candidate evidence, not confirmed findings — a `legacy_unstructured_advisory` recall in particular must not be promoted to a confirmed finding. Use each hit's `source_refs` / `source_reads_required` to confirm against current diff/source/test/doc evidence before a recalled pattern changes a review verdict; 不依赖模型自评.
8. **Learning Capture Recommendation.** Decide whether the current review produced a new reusable lesson worth capturing. This recommendation is advisory only: it is not a finding, not residual actionable work, not a verdict input, not an autofix item, and not a merge gate. Use the same three-tier judgment as Work/Debug:
   - **Skip silently** for mechanical fixes, one-off docs edits, formatting-only changes, or review results with no generalizable lesson. If the lesson cannot be stated in one sentence, skip rather than offer.
   - **Offer neutrally** when the lesson can be stated in one sentence, such as a repeated finding pattern, reusable review heuristic, source/runtime or host-entrypoint boundary lesson, external-tool evidence limitation, or known pattern future reviews should remember.
   - **Lean into the offer** when the pattern appears in 3+ places or reveals a wrong assumption about a shared dependency, framework, workflow, source/runtime boundary, or external-evidence convention.
   When offering, phrase it as the user's choice to run the current host's compound entrypoint with brief context. In report-only, autofix, and headless modes, ask no questions; include at most one advisory line when learning-worthy evidence exists. Do not automatically run `spec-compound`, do not write `docs/solutions/`, do not file tickets, and do not add extra prompts because of this checklist. If an older learning appears stale, recommend `spec-compound-refresh` only with a narrow scope hint and only after the new learning-capture path is clear.
9. **Agent-Native Gaps.** Surface spec-agent-native-reviewer results. Omit section if no gaps found.
10. **Schema Drift Check.** If spec-schema-drift-detector ran, summarize whether drift was found. If drift exists, list the unrelated schema objects and the required cleanup command. If clean, say so briefly.
11. **Deployment Notes.** If spec-deployment-verification-agent ran, surface the key Go/No-Go items: blocking pre-deploy checks, the most important verification queries, rollback caveats, and monitoring focus areas. Keep the checklist actionable rather than dropping it into Coverage.
12. **Resource Advisory.** If `resource-governance-lens` returned `status=advisory`, list the advisory dimensions and reason codes using `subject_path` for the file under discussion and `evidence_ref` for the proof source. Do not convert resource advisories into blocking findings unless a reviewer independently confirms a concrete code-review issue. A `status=unavailable` result (for example a non-git target) is a non-blocking degraded posture, not a fast-fail signal: note it in Coverage and continue; the helper exit code stays `0` for `ok`, `advisory`, and `unavailable`.
13. **Rule Maturity Candidates.** Include only when the confirmed findings or resource advisory meet the rule-maturity noise filter: P1/P2 repeated governance gap, same low-level issue appears at least twice, or a registered contract / plan non-goal is clearly violated. For each candidate list `rule_id`, `evidence_ref`, `reason_code`, `human_review_kind`, and `similar_existing_rule_ids`; use durable repo-readable evidence refs, never session-only summaries, raw lens stdout, `/tmp` files, or "see above". This section is an advisory queue for humans, not a finding, not a verdict input, and not an automatic `adjudicate`, `promote`, or `demote` action.
14. **Coverage.** Suppressed count by anchor (e.g., "N findings suppressed at anchor 50, M at anchor 25"), mode-aware demotion count (interactive/report-only) or suppression count (headless/autofix), validator drop count and reasons (when Stage 5b ran), validator over-budget validation skips (when the 15-cap fired), residual risks, first-class `test_gaps`, failed/timed-out reviewers, resource lens status/reason codes, direct evidence posture, Diff Boundary Review fields, Graph-Assisted Impact Review fields, and any intent uncertainty carried by non-interactive modes. Include `Direct evidence: <source refs/checks/logs used> | limitations: <reason>` when coverage depends on bounded direct evidence; for multi-repo review, report evidence per child repo. External-tool evidence is advisory whenever it is degraded or unconfirmed by source.
   - Stable boundary fields: `scope_boundary`, `authorized_scope_source`, `scope_boundary_evidence`, and run-level `finding_type` summaries for derived boundary/verification labels.
   - Stable graph fields: `graph_assist`, `graph_reason_code`, `expansion_budget`, `provider_untrusted.summaries[]`, and any populated candidate fields from `changed_symbols`, `changed_entrypoints`, `changed_contracts`, `symbol_mapping_status`, `impact_chain_candidates`, `blast_radius_candidates`, `caller_callee_paths`, `affected_test_candidates`, `tests_for_query_result`, `missing_test_confirmation`, `review_priority_candidates`, `test_gaps`, and `limitations`.
   - Do not let downstream-consumption gates depend on human-only prose. If a value is meant for automation or headless callers, render it with the stable field name above.
15. **Verdict.** Ready to merge / Ready with fixes / Not ready. Fix order if applicable. When an `explicit` plan has unaddressed requirements, the verdict must reflect it — a PR that's code-clean but missing planned requirements is "Not ready" unless the omission is intentional. When an `inferred` plan has unaddressed requirements, note it in the verdict reasoning but do not block on it alone.

When the review established targeted validation, surface that as a structured `verification-run-summary.v1` ref in Coverage or artifact handoff instead of a freeform "tests passed" claim. If the review closeout is based on structured claims, use `honest-closeout.v1`; when structured claim or evidence objects are missing, mark the closeout `degraded` rather than quietly implying verification.

Do not include time estimates.

**Format verification:** Before delivering the report, verify the findings sections use pipe-delimited table rows (`| # | File | Issue | ... |`) not freeform text, and verify cell text with literal `|` is escaped as `\|`. If you catch yourself rendering findings as prose blocks separated by horizontal rules or bullet points, or leaving unescaped pipes inside cells, stop and reformat into valid tables.

### Headless output format

In `mode:headless`, replace the interactive pipe-delimited table report with a structured text envelope. The envelope follows the same structural pattern as spec-doc-review's headless output (completion header, metadata block, findings grouped by autofix_class, trailing sections) while using spec-code-review's own section headings and per-finding fields.

```
Code review complete (headless mode).

Scope: <scope-line>
Intent: <intent-summary>
Reviewers: <reviewer-list with conditional justifications>
Verdict: <Ready to merge | Ready with fixes | Not ready>
Artifact: <review-artifact-dir>/
scope_boundary: <clean | concern | violation | unknown>
authorized_scope_source: <explicit-touch-set | declared-files-only | inferred-plan | diff-only | unknown>
finding_type: <derived labels present in this report, or none>
graph_assist: <used | fallback | not_applicable>
graph_reason_code: <candidate_results | provider_missing | readiness_unknown | stale | call_failed | disabled_or_unsafe | markdown_only_diff | no_candidates>
expansion_budget: <max_5_high_impact_symbols | not_applicable | other explicit budget>

Applied N safe_auto fixes.

Gated-auto findings (concrete fix, changes behavior/contracts):

[P1][gated_auto -> downstream-resolver][needs-verification] File: <file:line> -- <title> (<reviewer>, confidence-first <N>)
  Why: <why_it_matters>
  Suggested fix: <suggested_fix or "none">
  Evidence: <evidence[0]>
  Evidence: <evidence[1]>

Manual findings (actionable, needs handoff):

[P1][manual -> downstream-resolver] File: <file:line> -- <title> (<reviewer>, confidence-first <N>)
  Why: <why_it_matters>
  Evidence: <evidence[0]>

Advisory findings (report-only):

[P2][advisory -> human] File: <file:line> -- <title> (<reviewer>, confidence-first <N>)
  Why: <why_it_matters>

Pre-existing issues:
[P2][gated_auto -> downstream-resolver] File: <file:line> -- <title> (<reviewer>, confidence-first <N>)
  Why: <why_it_matters>

Residual risks:
- <risk>

Learnings & Past Solutions:
- <learning>

Learning Capture Recommendation:
- <advisory recommendation, only when this review produced a reusable new lesson>

Agent-Native Gaps:
- <gap description>

Schema Drift Check:
- <drift status>

Deployment Notes:
- <deployment note>

Testing gaps:
- <gap>

Coverage:
- scope_boundary_evidence: <plan refs / declared files / diff refs / limitations>
- provider_untrusted.summaries[]: <graph/code-graph candidate summary, rejected candidate, freshness, or limitation>
- expansion_budget: <max_5_high_impact_symbols | not_applicable | other explicit budget>
- changed_symbols: <symbol candidates or none>
- changed_entrypoints: <entrypoint candidates or none>
- changed_contracts: <contract candidates or none>
- symbol_mapping_status: <mapped | degraded | not_applicable>
- impact_chain_candidates: <impact chain candidates or none>
- blast_radius_candidates: <blast radius candidates or none>
- caller_callee_paths: <path candidates or none>
- affected_test_candidates: <test candidates or none>
- tests_for_query_result: <confirmed tests for candidates or none>
- missing_test_confirmation: <unconfirmed or missing test evidence or none>
- review_priority_candidates: <risk-ranked candidates or none>
- test_gaps: <first-class test gaps or none>
- Suppressed: <N> findings below anchor 75 (P0 at anchor 50+ retained)
- Mode-aware demotion suppressions: <N> findings suppressed (testing/maintainability advisory P2-P3)
- Validator drops: <N> findings rejected by Stage 5b validator
  - <file:line> -- <reason>
- Validator over-budget skips: <N> findings exceeded the 15-cap, were marked `validation_skipped/over_budget`, and still appear in the output
- Untracked files excluded: <file1>, <file2>
- Failed reviewers: <reviewer>

Review complete
```

**Detail enrichment (headless only):** The headless envelope includes `Why:`, `Evidence:`, and `Suggested fix:` lines. After merge (Stage 5), use detail-tier fields from the surviving reviewer returns. Parent-owned artifact files under `<review-artifact-dir>/` are an optional cache for debugging and downstream lookup, not the authority for detail enrichment.
   - **Field tiers:** `Why:` and `Evidence:` are detail-tier -- load from reviewer returns first. `Suggested fix:` is merge-tier -- use it directly from the same reviewer return.
   - **Artifact matching:** Only when in-memory detail is unavailable and parent-owned artifacts exist, look up detail-tier fields in the artifact files of the contributing reviewers. Match on `file + line_bucket(line, +/-3)` (the same tolerance used in Stage 5 dedup) within each contributing reviewer's artifact. When multiple artifact entries fall within the line bucket, apply `normalize(title)` to both the merged finding's title and each candidate entry's title as a tie-breaker.
   - **Reviewer order:** Try contributing reviewers in the order they appear in the merged finding's reviewer list; use the first match.
   - **No-match fallback:** If no reviewer return or parent-owned artifact contains a match, omit the `Why:` and `Evidence:` lines for that finding and note the gap in Coverage. The `Suggested fix:` line can still be populated from merge-tier fields when present.

**Formatting rules:**
- The `[needs-verification]` marker appears only on findings where `requires_verification: true`.
- The `Artifact:` line gives callers the path to the full run artifact for machine-readable access to the complete findings schema. The text envelope is the primary handoff; the artifact is for debugging and full-fidelity access.
- Findings with `owner: release` appear in the Advisory section (they are operational/rollout items, not code fixes).
- Findings with `pre_existing: true` appear in the Pre-existing section regardless of autofix_class.
- The Verdict appears in the metadata header (deliberately reordered from the interactive format where it appears at the bottom) so programmatic callers get the verdict first.
- Omit any section with zero items.
- If all reviewers fail or time out, emit `Code review degraded (headless mode). Reason: 0 of N reviewers returned results.` followed by "Review complete".
- End with "Review complete" as the terminal signal so callers can detect completion.

## Quality Gates

Before delivering the review, verify:

1. **Every finding is actionable.** Re-read each finding. If it says "consider", "might want to", or "could be improved" without a concrete fix, rewrite it with a specific action. Vague findings waste engineering time.
2. **No false positives from skimming.** For each finding, verify the surrounding code was actually read. Check that the "bug" isn't handled elsewhere in the same function, that the "unused import" isn't used in a type annotation, that the "missing null check" isn't guarded by the caller.
3. **Severity is calibrated.** A style nit is never P0. A SQL injection is never P3. Re-check every severity assignment.
4. **Line numbers are accurate.** Verify each cited line number against the file content. A finding pointing to the wrong line is worse than no finding.
5. **Protected artifacts are respected.** Discard any findings that recommend deleting or gitignoring files in `docs/brainstorms/`, `docs/plans/`, or `docs/solutions/`.
6. **Findings don't duplicate linter output.** Don't flag things the project's linter/formatter would catch (missing semicolons, wrong indentation). Focus on semantic issues.
7. **Source validation is present.** Every surviving finding must be backed by diff/source/test/contract evidence, not external-tool output alone.

## Language-Aware Conditionals

This skill uses stack-specific reviewer agents when the diff clearly warrants them. Keep those agents opinionated. They are not generic language checkers; they add a distinct review lens on top of the always-on and cross-cutting personas.

Do not spawn them mechanically from file extensions alone. The trigger is meaningful changed behavior, architecture, or UI state in that stack.

## After Review

### Mode-Driven Post-Review Flow

After presenting findings and verdict (Stage 6), route the next steps by mode. Review and synthesis stay the same in every mode; only mutation and handoff behavior changes.

#### Step 1: Build the action sets

- **Clean review** means zero findings after suppression and pre-existing separation. Skip the fix/handoff phase when the review is clean.
- **Fixer queue:** final findings routed to `safe_auto -> review-fixer`.
- **Residual actionable queue:** unresolved `gated_auto` or `manual` findings whose final owner is `downstream-resolver`.
- **Report-only queue:** `advisory` findings and any outputs owned by `human` or `release`.
- **Never convert advisory-only outputs into fix work or ticket handoff.** Deployment notes, residual risks, and release-owned items stay in the report.

#### Step 2: Choose policy by mode

**Interactive mode**

- Apply `safe_auto -> review-fixer` findings automatically without asking. These are safe by definition.
- **Zero-remaining case:** if no `gated_auto` or `manual` findings remain after the `safe_auto` pass, skip the routing question entirely. Emit a one-line completion summary phrased so advisory and pre-existing findings (which are not handled by this flow) are not implied to be cleared. When no advisory or pre-existing findings remain in the report, `All findings resolved — N safe_auto fixes applied.` is accurate. When advisory and/or pre-existing findings do remain, use the qualified form `All actionable findings resolved — N safe_auto fixes applied. (K advisory, J pre-existing findings remain in the report.)`, omitting any zero-count clause. Follow the summary with the existing end-of-review verdict, then proceed to Step 5 per the gating rule there.
- **Tracker pre-detection:** before rendering the routing question, consult `references/tracker-defer.md` for the session's tracker tuple `{ tracker_name, confidence, named_sink_available, any_sink_available }`. The probe runs at most once per session and is cached for the rest of the run. `named_sink_available` drives the option C label (inline tracker name only when the named sink can actually be invoked). `any_sink_available` drives whether option C is offered at all (it can still be offered when the named tracker is unreachable but GitHub Issues via `gh` works).
- **Verify question-tool pre-load (checklist, Claude Code only).** Before firing the routing question in Claude Code, confirm `AskUserQuestion` is loaded (per Interactive mode rules at the top of this skill). If not yet loaded this session, call `ToolSearch` with query `select:AskUserQuestion` now. Do not proceed to the routing question without this verification. Rendering the question as narrative text because the schema isn't loaded yet is a bug, not a valid fallback. On Codex this checklist does not apply — there is no `ToolSearch` preload step to perform. (If `request_user_input` is unavailable in the current Codex runtime mode, use the numbered-list fallback described below.)
- **Routing question.** Ask using the platform's blocking question tool (`AskUserQuestion` in Claude Code or `request_user_input` in Codex). Stem: `What should the agent do with the remaining N findings?` — use third-person voice referring to "the agent", not first-person "me" / "I". Options:

  ```
  (A) Review each finding one by one — accept the recommendation or choose another action
  (B) Auto-resolve with best judgment — apply per-finding fixes the agent can defend, surface the rest
  (C) File a [TRACKER] ticket per finding without applying fixes
  (D) Report only — take no further action
  ```

  Render option C per `references/tracker-defer.md`: when `confidence = high` AND `named_sink_available = true`, replace `[TRACKER]` with the concrete name and keep the full label (e.g., `File a Linear ticket per finding without applying fixes`). When `any_sink_available = true` but either `confidence = low` or `named_sink_available = false` (GitHub Issues via `gh` is working as the fallback), use the generic label `File an issue per finding without applying fixes` — this is a whole-label substitution, not a `[TRACKER]` token swap. When `any_sink_available = false`, **omit option C entirely** and add one line to the stem explaining that no issue tracker is configured for this checkout (Linear, GitHub Issues, etc., were probed and unavailable). The three remaining options (A, B, D) survive.

  The numbered-list text fallback applies when `ToolSearch` explicitly returns no match for the platform's question tool or the tool call errors (including Codex runtime modes where `request_user_input` is unavailable). It does not apply when the agent simply hasn't loaded the tool yet — in that case, load it now (see the verification checklist above). When the fallback applies, present the options as a numbered list and wait for the user's reply — never silently skip the question.

- **Dispatch on selection.** Route by the option letter (A / B / C / D), not by the rendered label string. The option-C label varies by tracker-detection confidence (`File a [TRACKER] ticket per finding without applying fixes` for a named tracker, `File an issue per finding without applying fixes` as the generic fallback, or omitted entirely when no sink is available — see `references/tracker-defer.md`), and options A / B / D have a single canonical label each. The letter is the stable dispatch signal; the canonical labels below are shown for documentation only. A low-confidence run that rendered option C as the generic label routes to the same branch as a high-confidence run that rendered it with the named tracker.
  - (A) `Review each finding one by one` — before presenting the first finding, read `references/walkthrough.md` in full. It is the canonical spec for the per-finding presentation format and option menu. Then enter the per-finding walk-through loop. The walk-through accumulates Apply decisions in memory; Defer decisions execute inline via `references/tracker-defer.md`; Skip / Acknowledge decisions are recorded as no-action. `Auto-resolve with best judgment on the rest` exits the loop and dispatches one fixer pass on the union of already-accumulated Apply decisions plus remaining undecided findings. When the user works through every finding without invoking that shortcut, dispatch one fixer subagent for the accumulated Apply set at end of loop (Step 3). Emit the unified completion report after dispatch.
  - (B) `Auto-resolve with best judgment — apply per-finding fixes the agent can defend, surface the rest` — dispatch the fixer subagent (Step 3) immediately on the full pending action set (`gated_auto` + `manual` + `advisory`). No Stage 5b validator pre-pass. No bulk-preview approval gate. The fixer applies items with concrete `suggested_fix`, no-ops on advisory items, and routes items where the fix cannot be applied cleanly, or where cited evidence no longer matches the code, to a `failed` bucket with a one-line reason.

    **After the fixer returns, the order is:**
    1. If `failed` is empty, emit the unified completion report and proceed to Step 5 per its gating rule.
    2. If `failed` is non-empty, fire the post-run failure-handling question before emitting the report. Stem: `N findings could not be auto-resolved. What should the agent do with them?` Options:
       - `File tickets for these` — route the failed set through `references/tracker-defer.md` Interactive mode. Omit this option when `any_sink_available = false`, and say no issue tracker is configured for this checkout.
       - `Walk through these one at a time` — re-enter the walk-through loop scoped to the failed set. Items with `suggested_fix` recommend Apply; items without `suggested_fix` recommend Defer and do not offer Apply.
       - `Ignore — leave them in the report` — record the failed list as residual actionable work.

    After the user's choice executes, emit the unified completion report reflecting any tickets filed or additional fixes applied during walk-through re-entry.
  - (C) `File a [TRACKER] ticket per finding without applying fixes` (or the generic `File an issue per finding without applying fixes` when the named-tracker label is not used) — first run Stage 5b validation on every pending finding. Drop validator-rejected findings with their reasons recorded in Coverage. Then load `references/bulk-preview.md` with every surviving finding in the file-tickets bucket. On `Proceed`, route every finding through `references/tracker-defer.md`; no fixes are applied. On `Cancel`, return to this routing question. Emit the unified completion report.
  - (D) `Report only — take no further action` — do not enter any dispatch phase. Emit the completion report, then proceed to Step 5 per its gating rule (`fixes_applied_count > 0` from earlier `safe_auto` passes). If no fixes were applied this run, stop after the report.

- The walk-through's completion report, the best-judgment / File-tickets completion report, and the zero-remaining completion summary all follow the unified completion-report structure documented in `references/walkthrough.md`. Use the same structure across every terminal path.

**Autofix mode**

- Ask no questions.
- Apply only the `safe_auto -> review-fixer` queue.
- Leave `gated_auto`, `manual`, `human`, and `release` items unresolved.
- Prepare residual work only for unresolved actionable findings whose final owner is `downstream-resolver`.

**Report-only mode**

- Ask no questions.
- Do not build a fixer queue.
- Do not write run artifacts.
- Stop after Stage 6. Everything remains in the report.

**Headless mode**

- Ask no questions.
- Apply only the `safe_auto -> review-fixer` queue in a single pass. Do not enter the bounded re-review loop (Step 3). Spawn one fixer subagent, apply fixes, then proceed directly to Step 4.
- Leave `gated_auto`, `manual`, `human`, and `release` items unresolved — they appear in the structured text output.
- Output the headless output envelope (see Stage 6) instead of the interactive report.
- Write a run artifact (Step 4). Do not file tickets or externalize work — the caller owns that.
- Stop after the structured text output and "Review complete" signal. No commit/push/PR.

#### Step 3: Apply fixes with one fixer

- Spawn exactly one fixer subagent for the current fixer queue in the current checkout. That fixer applies all approved changes and runs the relevant targeted tests in one pass against a consistent tree.
- Do not fan out multiple fixers against the same checkout. Parallel fixers require isolated worktrees/branches and deliberate mergeback.
- **Homogeneous queue** (autofix, headless, walk-through Apply set): every item is `safe_auto -> review-fixer` or every item carries a concrete `suggested_fix`. Apply each item. If a walk-through Apply item lacks `suggested_fix`, route it to `failed` with reason `no fix proposed by reviewer`.
- **Heterogeneous queue** (best-judgment path): the queue may mix `gated_auto`, `manual`, and `advisory`. Apply items with `suggested_fix`, no-op advisory items, and route anything that cannot be applied cleanly to `failed` with a one-line reason.
- If any applied finding has `requires_verification: true`, run the relevant targeted verification before reporting it as applied.
- Do not start a mutating review round concurrently with browser testing on the same checkout. Future orchestrators that want both must either run `mode:report-only` during the parallel phase or isolate the mutating review in its own checkout/worktree.

#### Step 4: Emit artifacts and downstream handoff

- In interactive, autofix, and headless modes, write a per-run artifact under `<review-artifact-dir>/` containing:
  - synthesized findings (merged output from Stage 5)
  - applied fixes
  - residual actionable work
  - advisory-only outputs
  Per-agent full-detail JSON files (`{reviewer_name}.json`) are already present in this directory from Stage 4 dispatch.
- Also write `metadata.json` alongside the findings so downstream skills (e.g., `spec-polish-beta`) can verify the artifact matches the current branch and HEAD. Minimum fields:
  ```json
  {
    "run_id": "<run-id>",
    "branch": "<git branch --show-current at dispatch time>",
    "head_sha": "<git rev-parse HEAD at dispatch time>",
    "verdict": "<Ready to merge | Ready with fixes | Not ready>",
    "completed_at": "<ISO 8601 UTC timestamp>"
  }
  ```
  Capture `branch` and `head_sha` at dispatch time (before any autofixes land), and write the file after the verdict is finalized. This file is additive -- pre-existing artifacts that predate this field are still valid, and downstream skills fall back to file mtime when it is missing.
- In autofix mode, the run artifact is the handoff. Orchestrators read the artifact's residual actionable work and route it as appropriate. The skill itself does not file tickets or prompt the user in autofix.
- Interactive mode may offer to externalize residual actionable work via `references/tracker-defer.md` (named tracker -> GitHub Issues via `gh`), but it is not required to finish the review.
- The review artifact remains temporary even when it contains complete reviewer JSON. When residual review findings must survive the session, write only a concise durable summary through the shipping workflow's accepted-residual path or PR Known Residuals section; do not durable-store the full per-reviewer JSON bundle by default.

#### Step 5: Final next steps

**Interactive mode only.** After the fix-review cycle completes (clean verdict or the user chose to stop), offer next steps based on the entry mode. Reuse the resolved review base/default branch from Stage 1 when known; do not hard-code only `main`/`master`.

**The gate is total fixes applied this run, not routing option.** Track `fixes_applied_count` across the whole Interactive invocation. This counter includes both the `safe_auto` fixes applied automatically before the routing question (see Step 2 Interactive mode) AND any Apply decisions executed by routing option A (walk-through) or option B (Auto-resolve with best judgment). Routing options C (File tickets) and D (Report only) add zero to this counter; neither does a walk-through that ends with only Skip / Defer / Acknowledge, and neither does an Auto-resolve with best judgment run that applies no fixes.

Step 5 runs only when `fixes_applied_count > 0`. If the counter is zero — no `safe_auto` fixes were applied AND the routing path produced no additional Apply — skip Step 5 entirely and exit after the completion report. Asking "push fixes?" when nothing changed in the working tree is incoherent.

Common outcomes:

- `safe_auto` produced fixes AND the user picked any routing option → Step 5 runs (counter > 0 from the safe_auto pass alone).
- No `safe_auto` fixes AND the user picked option C or D → Step 5 skipped.
- No `safe_auto` fixes AND walk-through / Auto-resolve with best judgment finished with zero Applies → Step 5 skipped.
- Zero-remaining case (no `gated_auto` / `manual` after `safe_auto`) with at least one `safe_auto` fix → Step 5 runs; the routing question was never asked but the counter is > 0.

- **PR mode (entered via PR number/URL):**
  - **Push fixes** -- push commits to the existing PR branch
  - **Exit** -- done for now
- **Branch mode (feature branch with no PR, and not the resolved review base/default branch):**
  - **Create a PR (Recommended)** -- push and open a pull request
  - **Continue without PR** -- stay on the branch
  - **Exit** -- done for now
- **On the resolved review base/default branch:**
  - **Continue** -- proceed with next steps
  - **Exit** -- done for now

If "Create a PR": first publish the branch with `git push --set-upstream origin HEAD`, then use `gh pr create` with a title and summary derived from the branch changes.
If "Push fixes": push the branch with `git push` to update the existing PR.

**Autofix, report-only, and headless modes:** stop after the report, artifact emission, and residual-work handoff. Do not commit, push, or create a PR.

## Fallback

If the platform supports reviewer dispatch but not parallel sub-agents, dispatch reviewers sequentially through the same Stage 4 scheduler. If the platform supports sub-agents but caps active concurrency, use the bounded queueing rules in Stage 4 rather than treating cap-related spawn failures as reviewer failures. If the platform has no dispatch primitive, or dispatch is explicitly disabled or unsafe, use the Stage 4 single-agent report-only fallback instead of pretending sequential persona dispatch is available. Everything else (stages, output format, merge pipeline) stays the same.

---

## Included References

### Persona Catalog

@./references/persona-catalog.md

### Subagent Template

@./references/subagent-template.md

### Diff Scope Rules

@./references/diff-scope.md

### Findings Schema

@./references/findings-schema.json

### Review Output Template

@./references/review-output-template.md
