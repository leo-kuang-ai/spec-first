# modes and output

### Phase 0a: Freeze effective mode before any tool call

Normalize mode before interpreting intent or running any repository command. This is an exit gate, not a later presentation choice:

```yaml
effective_mode: default | agent
source_mutation_gate: open | closed
artifact_write_gate: review-artifacts-only
```

When `mode:agent` or its `mode:headless` alias is present, set `effective_mode: agent`, `mutation_policy: report-only`, and `source_mutation_gate: closed`. In this mode, adjacent fix/apply wording is intent data, not mutation authority. Do not call project-writing tools, `apply_patch`, edit/write APIs, `git apply`, `git restore`, `git checkout`, formatters with write flags, or any command that can rewrite reviewed source. The only permitted writes are run-scoped review artifacts and deterministic evidence under the exact artifact roots owned below.

Generate the run ID and resolve `REVIEW_ARTIFACT_DIR` here, before scope inspection. Use the OS-native temporary-directory rules in Stage 4 and reuse the same canonical path for the entire run. Failure to create an artifact directory does not open the source mutation gate; `mode:agent` continues report-only with an in-band limitation.

### Phase 0: Resolve mutation, commit, and dispatch policy

Before scope detection, derive three independent run-local facts from the current user request and any visible upstream handoff:

```yaml
mutation_policy: report-only | apply-fixes
commit_authorization: authorized | missing
worker_dispatch_authorization: authorized | missing
capability_probe: not_applicable | attempted | unavailable
worker_dispatch_capability: available | missing | unknown
worker_context_isolation: isolated | inherited | unknown
worker_model_override: supported | unsupported | unknown
worker_bounded_parallelism: supported | unsupported | unknown
```

- Ordinary requests to "review", "check", "audit", or run `spec-code-review` use `mutation_policy: report-only`.
- **Report-only means the reviewed files stay byte-identical.** Under `report-only`, never "helpfully" fix, revert, restore, or normalize a defect you found — not even to undo an obviously bad change, and not even when the finding is P0. Finding a bug is evidence for the report; repairing it belongs to an explicitly authorized `apply-fixes` run (or the caller). `git restore`, `git checkout <file>`, `git apply -R`, edit/write tools on reviewed source, and formatter runs that rewrite it are all violations, regardless of the declared `mutation_policy` in the output JSON matching report-only.
- Use `mutation_policy: apply-fixes` only when the current user or upstream caller explicitly says review-and-fix, review and fix, apply fixes, or equivalent. `mode:agent` always forces report-only even when adjacent text asks to apply.
- `apply-fixes` authorizes only bounded local review-owned edits. It does not authorize commit, push, PR creation/update, tickets, or unrelated cleanup.
- Set `commit_authorization: authorized` only when commit creation is separately explicit. Without commit authorization, return a verified uncommitted review-fix set.
- Set `worker_dispatch_authorization: authorized` only when the current user/upstream explicitly requests subagents, personas, delegated reviewers, multi-agent review, or parallel review. A review invocation, task context, plan, available primitive, or permission setting is not dispatch authorization. Missing authorization forbids schema discovery and fixes `capability_probe: not_applicable` + `worker_dispatch_capability: unknown`. Only after authorization may the current-session registry/schema be consumed as `provider_untrusted` evidence; confirmed absence records `subagent_capability_missing`, while unavailable/incomplete/ambiguous discovery records `worker_capability_unproven`. Normalize every path as `worker_dispatch_outcome`; use only live facts for isolation, model override, parallelism, permission, capacity, output, and mutation claims.

If review repo scope is ambiguous in a parent multi-repo workspace, stop before local diff claims or apply and return a failure reason naming the required selected child repo/current checkout; do not open a blocking prompt. Read-only PR-remote scope may proceed from explicit PR metadata without choosing a sibling checkout. Generated runtime mirrors remain out of source-fix scope.

## Operating principles

Same review pipeline for default and `mode:agent`:

- **Report-only by default; never land.** Never push, open PRs, or file tickets in any mode. Ordinary default review and every `mode:agent` run report findings only. Stage 5c runs solely for default mode with `mutation_policy: apply-fixes`; commit remains a separate authorization gate.
- **Agent mode never mutates.** In **`mode:agent`** it never mutates the tree, regardless of adjacent apply/fix wording.
- **No blocking prompts.** Never use `AskUserQuestion`, `request_user_input`, or other blocking question tools. Infer intent, plan, and scope from explicit tokens, git state, PR metadata, and conversation. Note uncertainty in Coverage or the verdict — do not stop to ask.
- **Explicit mutations only.** Never run `gh pr checkout`, `git checkout`, `git switch`, or similar branch-switch commands. Passing a PR number, URL, or branch name selects **review scope**, not permission to mutate the working tree. To review local uncommitted work on a feature branch, check out that branch yourself (or stay on it) and pass `base:` or no target.
- **Smart defaults.** Untracked files: review tracked changes only and list excluded paths in Coverage. Plan: use `plan:` when passed; otherwise discover conservatively from PR body or branch keywords. Weak advisory P2/P3 from testing/maintainability alone: demote to `testing_gaps` / `residual_risks` per Stage 5.
- **Report outcomes, not machinery.** What you show the user is about the review: what's being examined (the PR/branch), which coverage is included and the one-line reason for each conditional lens, the independent cross-model pass and which model runs it, and the findings. Keep the skill's internals out of user-facing text — model-tier assignments, raw scope-mode codenames (`local-aligned`/`pr-remote`), staging the diff to disk, loading persona files, parallel-dispatch bookkeeping, and step-by-step narration of your own setup. Name what the user would recognize (a PR number, a reviewer's concern, a peer model), not the plumbing. This governs *what* you surface and suppress; it does not script the wording — use your own voice.

## Anti-Rationalization Red Flags

| 红旗念头 | 停下来做什么 |
| --- | --- |
| 「看着没问题，跳过应有的证伪」 | 按当前风险运行被触发的 adversarial/validator/direct fact check；未运行的独立视角必须在 Coverage 降级。 |
| 「这条 finding 大概成立」 | 回到 source、diff、test、log 或 artifact 核对；provider/advisory evidence 不能升级为 confirmed。 |
| 「口头说一下 residual 就行」 | 产出结构化 finding、Actionable Findings、Coverage 与 durable limitation，让下游不依赖会话记忆。 |

这是注意力提醒,不是 gate,也不替代 LLM 判断;最终是否停下、如何处理仍由你按当前证据决定。

## Output format

| Invocation | Deliverable |
|------------|-------------|
| **Default** | Markdown report (pipe-delimited finding tables where useful) + Actionable Findings summary; optional Applied section only for explicit `mutation_policy: apply-fixes` |
| **`mode:agent`** | One JSON object (see ### JSON output format below) + artifacts under the returned concrete `artifact_path` when writable |

`mode:agent` is **report-only**: it skips the Stage 5c apply (the caller applies) and serializes findings as JSON instead of markdown. It does not change reviewer selection, merge logic, or scope rules — the JSON is the deterministic contract for programmatic and cross-harness callers (Codex and other harnesses). The default markdown is the human view; keep it ASCII-safe (pipe tables, `->` not middot `·`, no box-drawing) so it degrades gracefully across terminals.
