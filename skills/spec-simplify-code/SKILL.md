---
name: spec-simplify-code
description: "Simplify recently changed code for clarity, reuse, quality, and efficiency while preserving behavior. Use for tidy/refactor passes; use spec-debug for bugs."
argument-hint: "[blank to simplify current branch changes, or describe what to simplify]"
---

Simplify recently changed code for clarity, reuse, quality, and efficiency while preserving exact behavior. Prioritize readable, explicit code over compact code — fewer lines is not the goal.

## Step 1: Identify scope

Resolve the simplification scope in this order:

1. **If the user explicitly named a scope** (a file, a directory, "the function I just wrote", "the changes from this morning"), use that scope. Treat user-named scope as authoritative — do not widen it.
2. **Otherwise, in a git repository**, default to the diff between the current branch and its base branch (e.g., `git diff origin/main...` or against the configured upstream). This covers the common case of "simplify everything I've added on this feature branch before opening a PR." If the branch has no upstream or base ref, fall back to staged + unstaged changes (`git diff HEAD`).
3. **Outside a git repository or when no diff is available**, review the most recently modified files mentioned by the user or edited earlier in this conversation.

If none of the above produces a non-empty scope, stop and ask the user what to simplify rather than guessing. Use the platform's blocking question tool: `AskUserQuestion` in Claude Code (call `ToolSearch` with `select:AskUserQuestion` first if its schema isn't loaded), `request_user_input` in Codex. Fall back to numbered options in chat only when no blocking tool exists in the harness or the call errors (e.g., Codex edit modes) — not because a schema load is required. Never silently skip the question.

**Preflight — skip a no-yield scope before loading review lenses.** If the
resolved scope contains no substantive human-authored code and consists only
of documentation/Markdown, generated or vendored files, dependency/lockfiles,
or purely mechanical formatting, lint, or mass-rename churn, stop with a
one-line `nothing to simplify` result. On a mixed diff, narrow the scope to the
substantive code files. This is a change-kind gate, not a size threshold, and
it never widens beyond caller-authorized paths.

When the caller provides a plan as context, the plan is not additional
simplification scope. Preserve any `session-settled:` structural decisions:
deliberately separate implementations or duplicated package-local runtime
assets remain separate even when consolidation would otherwise look cleaner.

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

Do not paraphrase these rubrics from memory — read each file and pass it verbatim, or the reviewer loses the gating rules that keep the pass behavior-preserving.

**Bounded dispatch.** When dispatch is authorized and available, queue the three reviewers and launch only as many as the harness accepts at once; treat a concurrency/active-agent-limit error as backpressure (leave the reviewer queued and retry after a slot frees), not as reviewer failure. Inline fallback runs the lenses serially when shared context or edit overlap makes concurrency unsafe.

**Model selection.** Request the balanced mid-tier only when `worker_model_override: supported` and the current schema exposes an explicit selector. Otherwise omit the override, inherit the parent model, and record `model_override_unsupported` or `model_override_unknown` as applicable; task wording alone does not select a different model.

**Permission mode.** For an authorized dispatch, omit the `mode` parameter so the user's configured permission settings apply. Permission settings are execution conditions, not dispatch authorization.

## Step 3: Fix issues

Complete all three review lenses, whether dispatched or inline. Aggregate their findings and fix each issue directly. If a finding is a false positive or not worth addressing, note it and move on. Do not argue with the finding or raise questions to the user, just skip it.

Before applying each fix, confirm it preserves behavior: same output for every input, same error behavior, and same side effects and ordering. If a fix can't clear that test, skip it — automated checks in Step 4 don't cover every behavior.

**Never simplify away a safety check.** Input validation at trust boundaries, error handling that prevents data loss, security checks (authorization, escaping, sanitization), and accessibility affordances are not removable boilerplate — preserve them even when a finding frames them as redundant or inline-able. Code that drops one of these is not simpler, it is unfinished. If a proposed simplification would thin or remove one, skip it.

## Step 4: Verify behavior is preserved

The premise of this skill is that simplification preserves exact functionality. After applying fixes:

**Run typecheck and lint over the full project.** They are usually fast and catch the most common simplification regressions — broken imports, unused exports, dropped type narrowings, dead code other modules still reference.

**Run tests:**
- Run tests scoped to the changed paths. CI runs the full suite on PR — this local check is a fast signal, not the final guarantee. Match scope to blast radius; a 3-line simplification doesn't warrant a 20-minute test run.
- Broaden scope when the change has obvious wide reach — e.g., a heavily-imported utility was rewritten, or the code-quality reviewer's consolidation/dedup fixes modified shared code. This is a judgment call about ripple risk, not a mechanical rule.
- If the test runner has no scoping mechanism, run the full suite.

Surface any failure clearly with the failing check name and the relevant output. Do not relax assertions, weaken type signatures, or skip tests to make checks pass — that defeats the "preserves functionality" guarantee. Either fix the underlying break introduced by simplification, or revert the specific change that caused the regression.

If no test suite, lint, or typecheck is configured, state that explicitly in the summary; do not silently skip verification.

## Step 5: Summarize

Briefly summarize what was good vs improved and fixed, including which checks were run and their results. If there were no findings to act on, confirm the code didn't require any changes.

**Quantify the impact by dimension.** Report what was actually applied, not a line count: fixes applied per reviewer dimension (reuse, quality, efficiency), how many findings were skipped as false-positive or not worth addressing, and the behavior-preservation result (checks run and outcome). For example: "Applied 6 — reuse 2, quality 3, efficiency 1; skipped 2 false positives; typecheck + lint clean, 11 scoped tests pass." Do not headline a net-lines-removed figure or frame fewer lines as the win — many clarity, safety, and efficiency fixes preserve or add lines. The measure is what improved and that behavior held, not how much code shrank.
