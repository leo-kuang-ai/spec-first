---
name: spec-simplify-code
description: "Simplify recently changed code for clarity, reuse, quality, and efficiency while preserving behavior. Use for tidy/refactor passes; use spec-debug for bugs. Not for new features or behavior changes."
argument-hint: "[blank to simplify current branch changes, or describe what to simplify] [proof-test:<path>]"
---

Simplify recently changed code for clarity, reuse, quality, and efficiency while preserving exact behavior. Prioritize readable, explicit code over compact code — fewer lines is not the goal.

## Proof context and caller ownership

A `proof-test:<path>` token names protected verification context, never additional mutation scope. Remove these tokens before resolving scope; accept multiple paths. Paths containing whitespace may be supplied in the caller's structured evidence instead. Consume the caller's verification evidence, source/test refs, limitations and settled decisions alongside the scope. A caller-owned pass returns to that caller without a commit, landing or independent workflow tail.

A request to inspect or suggest improvements is report-only: return findings and evidence without applying fixes. An explicit simplify/refactor request or caller handoff authorizes only its bounded cleanup. Do not infer file mutation from reviewer recommendations.

## Step 1: Identify scope

**Not-a-simplification input first.** A request that reports broken behavior — a crash, a failing test, wrong output — is a bug, not a simplification pass. Do not fix the bug here. Name `spec-debug` in the reply and route out; the caller can return for a behavior-preserving cleanup after the fix lands.

Resolve the simplification scope in this order:

1. **If the user explicitly named a scope** (a file, a directory, "the function I just wrote", "the changes from this morning"), use that scope. Treat user-named scope as authoritative — do not widen it.
2. **Otherwise, in a git repository**, default to the diff between the current branch and its base branch (e.g., `git diff origin/main...` or against the configured upstream). This covers the common case of "simplify everything I've added on this feature branch before opening a PR." If the branch has no upstream or base ref, fall back to staged + unstaged changes (`git diff HEAD`).
3. **Outside a git repository or when no diff is available**, review the most recently modified files mentioned by the user or edited earlier in this conversation.

If none of the above produces a non-empty scope, stop and ask the user what to simplify rather than guessing. Use the platform's blocking question tool: the host's blocking question tool already in the current tool list, matched by capability (if a matching tool is listed but unloaded, load it through the host's tool-discovery primitive). Fall back to numbered options in chat only when no such tool is in the list or a real question call errors. Never silently skip the question.

**Preflight — skip a no-yield scope before loading review lenses.** If the
resolved scope contains no substantive human-authored code and consists only
of documentation/Markdown, generated or vendored files, dependency/lockfiles,
or purely mechanical formatting, lint, or mass-rename churn, stop with a
one-line `nothing to simplify` result. On a mixed diff, narrow the scope to the
substantive code and test files. This is a change-kind gate, not a size threshold, and
it never widens beyond caller-authorized paths.

Read imports, callers and nearby implementations to prove equivalence, but reading them does not add them to the mutation scope. Do not consolidate across package or runtime ownership boundaries merely because code resembles a shared helper.

When the caller provides a plan as context, the plan is not additional
simplification scope. Preserve any `session-settled:` structural decisions:
deliberately separate implementations or duplicated package-local runtime
assets remain separate even when consolidation would otherwise look cleaner.

Before the pass, identify the tests used as proof from explicit `proof-test:` paths and the caller/session verification evidence, including unchanged regression and characterization tests. Read their test-only helpers, fixtures and seams; capture their current path and byte identity with tools. Carry the originating unit/task, observed command/log and freshness limitation. Missing or stale evidence is a limitation, not permission to drop protection: preserve all tests added/changed by the current work and their test-only seams until the caller reconciles the proof set. A missing named proof file blocks a verified preservation claim. Do not fabricate an earlier RED result or hash.

## Step 2: Run 3 review lenses

在派发 reviewer 前记录：

```yaml
worker_dispatch_authorization: authorized | missing
capability_probe: not_applicable | attempted | unavailable
worker_dispatch_capability: available | missing | unknown
worker_context_isolation: isolated | inherited | unknown
worker_model_override: supported | unsupported | unknown
worker_bounded_parallelism: supported | unsupported | unknown
```

`workflow invocation does not authorize dispatch`。只有当前用户或可见 upstream handoff 明确请求 subagent、delegated work、persona 或 parallel work 时，才可把三个 review lens 派发给 generic workers。缺授权时不得探测 tool schema，固定为 `capability_probe: not_applicable` + `worker_dispatch_capability: unknown`，inline 或 serial 执行全部三个 lens 并记录 `dispatch_authorization_missing`。只有授权后才把 current-session registry/schema 作为 `provider_untrusted` evidence 检查：确认缺失时记录 `subagent_capability_missing`；surface 不可用、schema 不完整或候选不唯一时记录 `worker_capability_unproven`，均 inline 或 serial。隔离、模型覆盖和有界并发只取 live facts；required isolation 未满足时保持依赖 gate 打开，model unknown 时继承，parallelism unknown 时串行。记录 `worker_dispatch_outcome`。Inline fallback 保留三个 rubric 的完整覆盖，但不得声称三个 independent reviewers 或 multi-agent coverage。

When authorization is present and the current-session semantic probe yields one eligible generic worker candidate, dispatch three bounded workers — code-reuse, code-quality, and efficiency reviewers. Otherwise run the reviews inline or serially. For each reviewer or inline lens, read its prompt asset from this skill's directory and use the **full file content** together with the resolved scope (the full diff or file set) so the review has complete context:

- `references/personas/code-reuse-reviewer.md` — existing utilities, duplicated functionality, reimplemented stdlib/runtime primitives.
- `references/personas/code-quality-reviewer.md` — redundant state, parameter sprawl, copy-paste, leaky abstractions, stringly-typed code, dead code, over-nesting, and the over-simplification balance guard.
- `references/personas/efficiency-reviewer.md` — unnecessary work, missed concurrency, hot-path bloat, no-op updates, memory leaks.

When the resolved scope includes substantive tests or the caller requests test-quality review, read `references/test-value-lens.md` within the code-quality lens. It is conditional read-only assessment, not a fourth default reviewer, broader mutation scope or permission to weaken proof.

Do not paraphrase these rubrics from memory — read each file and pass it verbatim, or the reviewer loses the gating rules that keep the pass behavior-preserving.

**Bounded dispatch.** When dispatch is authorized and available, queue the three reviewers and launch only as many as the harness accepts at once; treat a concurrency/active-agent-limit error as backpressure (leave the reviewer queued and retry after a slot frees), not as reviewer failure. Inline fallback runs the lenses serially when shared context or edit overlap makes concurrency unsafe.

**Model selection.** Request the balanced mid-tier only when `worker_model_override: supported` and the current schema exposes an explicit selector. Otherwise omit the override, inherit the parent model, and record `model_override_unsupported` or `model_override_unknown` as applicable; task wording alone does not select a different model.

**Permission mode.** For an authorized dispatch, omit the `mode` parameter so the user's configured permission settings apply. Permission settings are execution conditions, not dispatch authorization.

## Step 3: Fix issues

Complete all three review lenses, whether dispatched or inline. Aggregate their findings; in report-only requests return them without edits. For authorized cleanup, fix each justified in-scope issue. If a finding is a false positive or not worth addressing, note it and move on. Do not argue with the finding or raise questions to the user, just skip it.

Before applying each fix, confirm it preserves behavior: same output for every input, same error behavior, and same side effects and ordering. If a fix can't clear that test, skip it — automated checks in Step 4 don't cover every behavior.

**Protect the proof.** Skip any finding that deletes, weakens, renames, moves, merges or rewrites a proof test or its test-only seam. This includes an otherwise tempting helper cleanup. Production code exercised by those tests may still be refactored within scope when behavior remains equivalent. Protection is scoped to this cleanup pass: a source-backed defect in the test or changed acceptance returns to the caller for evidence reconciliation, not silent assertion weakening. Include these constraints in every reviewer packet or inline lens.

**Never simplify away a safety check.** Input validation at trust boundaries, error handling that prevents data loss, security checks (authorization, escaping, sanitization), and accessibility affordances are not removable boilerplate — preserve them even when a finding frames them as redundant or inline-able. Code that drops one of these is not simpler, it is unfinished. If a proposed simplification would thin or remove one, skip it.

## Step 4: Verify behavior is preserved

The premise of this skill is that simplification preserves exact functionality. After applying fixes:

**Run typecheck and lint over the full project.** They are usually fast and catch the most common simplification regressions — broken imports, unused exports, dropped type narrowings, dead code other modules still reference.

Compare protected paths and bytes against the pre-pass snapshot. Report any mismatch before claiming preservation; never restore unrelated user edits wholesale. Rerun the named proof tests and the original reproducer when available, even if a changed-path heuristic would omit them. Capture actual commands/results and the current tree identity; earlier green results become stale after a production edit. The caller owns the complete final-tree verification and closeout.

**Run tests:**
- Run tests scoped to the changed paths. Future CI remains pending until an actual result exists; this local check is a bounded signal. Match scope to blast radius; a 3-line simplification doesn't warrant a 20-minute test run.
- Broaden scope when the change has obvious wide reach — e.g., a heavily-imported utility was rewritten, or the code-quality reviewer's consolidation/dedup fixes modified shared code. This is a judgment call about ripple risk, not a mechanical rule.
- If the test runner has no scoping mechanism, run the full suite.

Surface any failure clearly with the failing check name and the relevant output. Do not relax assertions, weaken type signatures, or skip tests to make checks pass — that defeats the "preserves functionality" guarantee. Either fix the underlying break introduced by simplification, or revert the specific change that caused the regression.

If no test suite, lint, or typecheck is configured, state that explicitly in the summary; do not silently skip verification.

## Step 5: Summarize

Return the protected proof paths and test-only seams, byte-comparison outcome, evidence origin, rerun results and missing/stale limitations to the caller. Do not mark required proof as passed when it was unavailable.

Briefly summarize what was good vs improved and fixed, including which checks were run and their results. If there were no findings to act on, confirm the code didn't require any changes.

**Quantify the impact by dimension.** Report what was actually applied, not a line count: fixes applied per reviewer dimension (reuse, quality, efficiency), how many findings were skipped as false-positive or not worth addressing, and the behavior-preservation result (checks run and outcome). For example: "Applied 6 — reuse 2, quality 3, efficiency 1; skipped 2 false positives; typecheck + lint clean, 11 scoped tests pass." Do not headline a net-lines-removed figure or frame fewer lines as the win — many clarity, safety, and efficiency fixes preserve or add lines. The measure is what improved and that behavior held, not how much code shrank.
