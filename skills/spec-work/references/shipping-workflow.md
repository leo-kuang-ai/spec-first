# Shipping Workflow

This file contains the shipping workflow (Phase 3-4). It is loaded when all Phase 2 tasks are complete and execution transitions to quality check.

## Owned

- Final simplify/review/residual gates, final verification, structured closeout, conditional work run artifact, lifecycle closeout, and authorization-aware handoff/landing.
- Materialize portable review evidence and keep completion claims tied to actual checks.

## Not Owned

- Plan/task-pack intake, implementation decomposition, worker dispatch internals, product/architecture redesign, or inferred commit/landing authorization.
- Treating lifecycle status, review prose, or planned commands as completion evidence.

## Trigger

Load only after every in-scope Phase 2 task/unit is accounted for and implementation mutation is ready to enter quality/shipping. Return-to-Caller loads only the structured evidence closeout subset it owns.

## Fallback

If this reference cannot be read or a required quality/evidence gate cannot run, do not claim completion, mutate plan lifecycle, commit, push, or open a PR. Return the verified implementation facts available plus explicit not-run/degraded reason and the owner action needed.

## Contents

- [Phase 3: Quality Check](#phase-3-quality-check)
- [Phase 4: Ship It](#phase-4-ship-it)
- [Quality Checklist](#quality-checklist)
- [Code Review](#code-review)

## Phase 3: Quality Check

1. **准备最终验证运行（Prepare Verification Run）**

   在任何 simplify、review followup 或 residual fix 之前，先固定一个 target repo、一个 fresh safe `run-id` 和最终验证候选集；同一次 shipping closeout 的日志、run summary 与 conditional run artifact 必须复用同一个 `run-id`。先调用：

   ```bash
   spec-first internal verification-profile load \
     --target-repo <repo-root> \
     --json
   ```

   `verification-profile` 只准备候选 checks 与工具事实，不执行命令，也不判断哪些 checks 在语义上充分。LLM 根据 active instructions、plan requirements、changed surface 与项目脚本选择最终 checks；计划、profile 或文档里出现过的命令只是 candidate，未实际执行的 planned command 不是 run evidence，更不能标为 `passed`。

   预留 repo-local run root：`.spec-first/workflows/spec-work/<workspace-slug>/<run-id>/`。此时不要提前调用 `verification-run-summary record`：后续 simplify/review fix 可能改变代码，最终 summary 只能转录所有 mutation 结束后的真实结果。

2. **Simplify** (conditional — separate from code review)

   Before code review, invoke **`spec-simplify-code`** when the diff is non-mechanical and large enough to benefit (default: **>=30 changed lines**). Skip when the diff is purely mechanical (formatting, dependency bumps, lint-only fixes, generated artifacts).

   This step refines reuse, quality, and efficiency on the **current diff** so any later review sees cleaner code. It is not a substitute for code review.

   Pass `plan:<path>` or a scope hint when the plan or user narrowed what changed. If the skill is unavailable on the harness, skip or do a brief manual pass for obvious duplicate/dead code — code review (step 3) still runs regardless.

3. **Code Review**

   Review the diff with **`spec-code-review`** — the spec-first portable review skill — as the single path. It self-right-sizes (a lite roster for small, low-risk, code-only diffs; the full roster otherwise), so there is no "escalate to a heavier reviewer" decision and **no harness-specific review detection** — it behaves identically on every harness. (This replaces the former Tier 1 harness-native `/review` / Tier 2 escalation split: the size and sensitive-surface judgment that used to live here now lives inside `spec-code-review`'s own reviewer selection and small-diff gate.)

   **Skip dedicated review only for a purely mechanical diff** — formatting, dependency-version bumps, lint-only fixes, generated artifacts (the same class step 2 skips for simplify). Note in the shipping summary: `Code review: skipped (mechanical diff)`. Everything else gets reviewed.

   Task-pack `review_gate: required` reviews are early, bounded feedback only. They never replace this full work-run/branch review, even when every Task Card closed cleanly.

   **Review is not fix — two steps:**

   **3a. Review (read-only).** Invoke `spec-code-review` with `mode:agent` (add `plan:<path>` when known; `base:<ref>` when the diff base is resolved). Pass **`depth:full`** when the plan, the task, or the user explicitly asked for a full / deep / thorough review — that is the one escalation signal `spec-code-review` cannot infer from the diff alone. Do not pass `mode:autofix`. Parse the JSON and retain its concrete `artifact_path`; never derive an artifact directory from `run_id`.

   **3b. Apply fixes (caller-owned).** Load `references/review-findings-followup.md`: filter on JSON, batch by file, and use only explicitly authorized worker dispatch. The orchestrator integrates and tests. Commit only when `commit_authorization: authorized`; otherwise keep the verified review fixes uncommitted. Then proceed to the Residual Work Gate.

   **If independent `spec-code-review` coverage is unavailable** — including `dispatch_authorization_missing`, `subagent_capability_missing`, unauthenticated/hard-capped dispatch, or `status: failed`/`degraded` without independent coverage — preserve any bounded inline findings, but treat the dedicated review as unavailable. In an **interactive** session, run the harness-native report-only review if one exists (e.g. `/review`) and apply fixes only under the existing caller authorization; when no native reviewer exists, perform and record an explicit manual diff scan. In a **non-interactive** session, note `Code review: skipped (independent spec-code-review unavailable)` and add the manual diff scan to Final Validation. This fallback is not persona/validator/cross-model evidence, and required task-level review gates remain blocked when their contract requires independent coverage. Never silently ship a non-mechanical change with no review of any kind.

4. **Residual Work Gate** (REQUIRED when `spec-code-review` ran and left actionable residuals)

   After code review and review-findings followup, inspect the **Actionable Findings** summary (or read `review.json` under the returned non-null `artifact_path` if the summary was truncated). If `artifact_path` is unavailable, use the in-band JSON and preserve the limitation; do not re-run review just to recreate a temp artifact. If one or more actionable `downstream-resolver` findings were not applied in followup, do not proceed to Final Validation until they are resolved or durably recorded.

   **Non-interactive / autonomous sessions (no human can answer — e.g. an `lfg`-style pipeline or a headless run):** do **not** call the blocking tool — that would hang the pipeline. After step 3b auto-applied every mechanically-eligible finding, take the `Accept and proceed` path automatically: record the remaining actionable residuals verbatim to the durable Known Residuals sink (the PR description's Known Residuals section, or `docs/residual-review-findings/<branch-or-head-sha>.md` on the no-PR path) and continue to Final Validation. Residuals are recorded, never dropped — this keeps autonomous shipping unblocked without losing findings.

   **Interactive sessions:** Ask the user using the platform's blocking question tool (`AskUserQuestion` in Claude Code with `ToolSearch select:AskUserQuestion` pre-loaded if needed, `request_user_input` in Codex). Fall back to numbered options in chat only when the harness genuinely lacks a blocking tool. Never silently skip the gate.

   Stem: `Code review left N actionable finding(s) not yet fixed. How should the agent proceed?`

   Options (four or fewer, self-contained labels):
   - `Apply/fix now` — load `references/review-findings-followup.md`, use authorized batched fix workers or inline fallback for remaining eligible findings, and run tests. Commit only when separately authorized; optionally re-run `spec-code-review` only after the diff changed materially.
   - `File tickets via project tracker` — load `references/tracker-defer.md` in Interactive mode; the agent files tickets in the project's detected tracker (or `gh` fallback, or leaves them in the report if no sink exists) and proceeds to Final Validation.
   - `Accept and proceed` — record the residual findings verbatim in a durable "Known Residuals" sink before shipping. If a PR will be created or updated in Phase 4, include them in the PR description's "Known Residuals" section (the agent owns this when calling `spec-commit-push-pr`). If the user later chooses the no-PR `spec-commit` path, create `docs/residual-review-findings/<branch-or-head-sha>.md`, include the accepted findings and source review-run context, stage it with the implementation commit, and mention the file path in the final summary. The user has acknowledged the risk, but the findings must not live only in the transient session.
   - `Stop — do not ship` — abort the shipping workflow. The user will handle findings manually before re-invoking.

   Skip this gate entirely when the review reported `Actionable findings: none.` (and followup applied everything mechanical), or when dedicated review was skipped (mechanical diff or `spec-code-review` unavailable). Do not proceed past this gate on an `Accept and proceed` decision (including the autonomous auto-accept above) until the agent has recorded whether the durable sink is `PR Known Residuals` or `docs/residual-review-findings/<branch-or-head-sha>.md`.

   A session-temp review `artifact_path` is never the durable sink. When later shipping, resume, tracker, compound, or release work needs full review evidence, materialize sanitized repo-local review evidence in the current spec-work run artifact and reference that copy; if materialization fails, preserve the structured finding summary and an explicit copy-failure limitation. Never persist only the temp path.

5. **Final Validation**
   - All tasks marked completed
   - Testing addressed -- tests pass and new/changed behavior has corresponding test coverage (or an explicit justification for why tests are not needed)
   - Linting passes
   - Code follows existing patterns
   - Figma designs match (if applicable)
   - No console errors or warnings
   - If the plan has a `Requirements` section (or legacy `Requirements Trace`), verify each requirement is satisfied by the completed work
   - If any `Deferred to Implementation` questions were noted, confirm they were resolved during execution

   现在才实际执行（actually run）Step 1 选择的最终 checks。每个 check 都记录真实 `command`、`ran`、`exit_code`、`status`、`required_tools`、`missing_tools` 和 `reason_code`，并把 bounded、secret-stripped 输出写为当前 run root 下的 repo-relative redacted log，例如 `.spec-first/workflows/spec-work/<workspace-slug>/<run-id>/logs/<check-id>.log`。不要把 terminal transcript、session temp path 或未脱敏原始输出直接作为 durable log。

   - `passed` 只允许 `ran=true`、`exit_code=0` 且存在 repo-relative redacted log。
   - `failed` 必须保留真实非零 `exit_code` 与日志，不得因为后续解释而改写为 passed。
   - dry-run 或仅可调度但未执行的 check 必须是 `not-run` + `reason_code: schedulable`；不得升级为 passed。
   - 缺工具必须是 `not-run` + `reason_code: missing_dependency`，并列出 `missing_tools`。
   - simplify、review followup 或 residual fix 触及某个 check 的覆盖面时，最终 closeout 使用修复后复跑结果；修复前的绿灯不能支撑最终完成声明。

5.1 **Structured Verification And Evidence Closeout**

   依次完成以下步骤。Scripts 只校验/转录确定性事实；LLM 仍负责选择 checks、判断 claims、选择 durable trigger 和解释 limitation。

   **A. 先物化需要跨会话保留的 review evidence。** 如果 task/final `spec-code-review` 返回的是 OS session-temp `artifact_path`，只筛选本次 spec-work caller actually consumed 的 `review.json` 与结构化 finding summary；做 sanitize/redact 后复制到当前 `.spec-first/workflows/spec-work/<workspace-slug>/<run-id>/review/`。验证复制目标是 target repo 内的普通文件，不接受 symlink、path escape 或机器特定绝对路径。

   复制失败时保留 in-band structured finding summary，并增加 `review-evidence-copy-failed` limitation。不得把绝对 temp path 写入 `artifact_refs`、`read_artifacts`、run artifact、resume、tracker、compound、release 或最终跨会话 handoff；copy fail 必须显式留下 limitation，不能用“review 已完成”掩盖证据不可携带。

   **B. 记录 immutable verification summary。** 根据 Final Validation 的真实结果组装 `verification-run-summary` input，然后调用：

   ```bash
   spec-first internal verification-run-summary record \
     --workflow spec-work \
     --input <verification-run-summary-input.json> \
     --run-id <run-id> \
     --target-repo <repo-root> \
     --json
   ```

   保存返回的 `run_summary_ref`。Helper 不执行或重跑命令、不推断 exit code、不深度清洗日志；它只验证 payload、路径、日志前缀和 schema。相同 workspace/run-id 的 summary 是 immutable；`run-summary-already-exists` 不能通过覆盖旧文件修复，必须保留 reason 并停止 verified closeout claim。

   **C. 校验 structured claims。** 使用实际 run summary 组装 validation claims；review/impact claims 只能引用 target repo 内真实存在的普通文件，例如上一步物化的 review summary、source/plan 或 changed-surface evidence。运行：

   ```bash
   spec-first internal honest-closeout validate \
     --input <honest-closeout-claims.json> \
     --target-repo <repo-root> \
     --json
   ```

   validation claim 使用 `verification-run-summary:<check-id>`；不得 cherry-pick 通过项隐藏 `failed`、`not-run` 或 `degraded` check。保存 `overall`、`overall_reason_code` 与逐 claim verdict。`overall != verified` 时 Completion Response 必须保留 `degraded` / `unsupported` 及具体 reason/limitation，must not 声称 `all tests passed` 或“全部验证通过”。Required verification 未通过或未运行仍阻断 complete；optional evidence 的诚实降级只限制对应 claim，不自动伪造成全局失败或成功。

   **D. 条件式写入 spec-work durable run artifact。** LLM 按顺序判断并在首个命中处停止：

   - `trigger-task-pack`：输入是 validated task pack；
   - `trigger-not-run-validation`：run summary 至少一个 check 为 `not-run`；
   - `trigger-deferred-follow-up`：存在 durable deferred follow-up；
   - `trigger-substantive-work`：跨切面、compaction/resume、limited optional evidence、review/compound/release handoff 等让 context loss 具有真实成本。

   没有 trigger 时不调用 producer，返回 `run_artifact_path: null` 与 `run_artifact_reason_code: no-trigger-matched`。命中时组装现有 `spec-work-run-artifact-payload/v2`，设置 `producer.workflow_integrated=true` 与匹配的 trigger reason，并调用：

   ```bash
   spec-first internal spec-work-run-artifact write \
     --input <closeout-payload.json> \
     --run-id <run-id> \
     --target-repo <repo-root>
   ```

   `script_confirmed.validation.run_summary_ref` 必须指向 same workflow、same workspace、same run-id 的 `.spec-first/workflows/spec-work/<workspace-slug>/<run-id>/verification-run-summary.json`。`script_confirmed.artifact_refs` 与 `llm_asserted.read_artifacts` 只能引用 repo-relative materialized evidence；不得引用 session-temp absolute path。相同 run-id 不可覆盖；`artifact-already-exists`、`producer-error` 或其他 `not-written` reason 原样进入 handoff。

   **E. 形成 closeout envelope。** Standalone 与 Return-to-Caller 均返回 `verification_run_summary_ref`、`honest_closeout_verdict`、`run_artifact_path`、`run_artifact_reason_code`、`claim_limitations`。Return-to-Caller 仍跳过 standalone simplify/review/PR/lifecycle tail，但不能跳过自己已执行 local verification 的 structured evidence closeout；caller 继续拥有最终 review、plan lifecycle 与 landing。

5.2 **Plan Status Closeout**

   This is the only shipping closeout that may mutate plan `status`. Run it only after Final Validation, required review, and Residual Work Gate obligations have closed. `completed` is an audit marker for scoped development work; it is not proof of tests, CI, merge, release, or field outcome. Leaf workers, reviewers, and fix subagents never perform this mutation.

   Resolve lifecycle applicability before calling the helper:

   - A lifecycle-managed candidate is a non-symlink regular direct `docs/plans/*.md` software plan with exactly one readable status: either `artifact_contract: spec-unified-plan/v1` plus `execution: code`, or a compatible legacy `type: feat | fix | refactor` plan whose execution is absent or `code`. Only `active` and `completed` candidates enter the mutation helper.
   - Direct lifecycle-managed Markdown plan: update that plan.
   - Validated task pack input: require exactly one `source_plan`; update it only when it resolves to the lifecycle-managed candidate above. The task pack stays `status: derived` or `draft`.
   - Return-to-Caller: do not write. Return both `plan_status_completion_candidate` and `plan_status_completion_degraded_reason` so LFG/caller can apply the same decision after its own gates.
   - HTML, historical missing/closed plans, read-compatible `partially-shipped`/`superseded` plans, and otherwise valid source plans outside the direct Markdown boundary: do not mutate. Report respectively `html-plan-lifecycle-degraded`, `legacy-plan-lifecycle-degraded`, `read-compatible-status-unmanaged`, or `source-plan-path-lifecycle-degraded`. These explicit degraded outcomes do not invalidate development completion already established by verification and review.

   For an applicable candidate, invoke `spec-first internal plan-status complete --target-repo <root> --plan <repo-relative-source-plan> --json`. `active → completed` and `plan-status-already-completed` are successful closeouts. Duplicate, malformed, invalid, unsafe-path, read, or write failures on an applicable lifecycle-managed plan keep it unchanged and block the lifecycle closeout claim. Missing status on a unified lifecycle-managed Markdown plan is also a contract failure; legacy missing/closed status follows the explicit degraded branch above rather than forcing migration. The helper re-reads current disk content and uses the shared temp-file + rename writer: POSIX replacement is atomic, Windows replacement is best effort with retry, and neither path is a cross-process CAS. The shipping-tail single-writer rule remains a loud convention.

6. **Prepare Operational Validation Plan** (REQUIRED)
   - Add a `## Post-Deploy Monitoring & Validation` section to the PR description for every change.
   - Include concrete:
     - Log queries/search terms
     - Metrics or dashboards to watch
     - Expected healthy signals
     - Failure signals and rollback/mitigation trigger
     - Validation window and owner
   - If there is truly no production/runtime impact, still include the section with: `No additional operational monitoring required` and a one-line reason.

## Phase 4: Ship It

1. **Prepare Validation Context**

   Do not try to launch a dedicated spec-first evidence-capture workflow. Modern harnesses provide their own browser, screenshot, terminal recording, and artifact capture tools; use those directly only when the user asks or when the artifact already exists.

   Note whether the completed work has observable behavior (UI rendering, CLI output, API/library behavior with a runnable example, generated artifacts, or workflow output), and summarize any manual validation performed. Retain user-supplied evidence (URL, markdown embed, local artifact path) for the verified handoff; pass it to a PR workflow only if landing is later authorized.

2. **Resolve Commit And Landing Authorization**

   Read the current user request and visible upstream handoff; do not infer authority from skill invocation, branch ownership, plan metadata, a green tree, or tool availability.

   - `commit_authorization: authorized` only when the current user or upstream owner explicitly requests local commit creation.
   - `landing_authorization: authorized` only when the current user or upstream owner explicitly requests push, PR creation/update, or another outward landing action.
   - Landing authorization may include the commit needed for that landing only when the request says so; otherwise keep the two decisions separate.
   - Return-to-Caller mode never commits, pushes, or opens a PR. It returns the structured envelope to its caller.
   - Without commit authorization, verified work remains uncommitted. With no landing authorization, do not push and do not open a PR.

   Apply the matching path:

   - **No commit authorization:** leave verified changes uncommitted and return a verified handoff with changed files, checks, review/residual posture, lifecycle result, coherent commit candidates, and limitations.
   - **Commit authorized, landing not authorized:** use the repo's commit workflow for run-owned files only. Do not push and do not open a PR. Return the local commit(s) in the verified handoff.
   - **Landing authorized:** use the requested landing workflow only after all quality, residual, lifecycle, and branch-safety gates close. Pass the plan summary, testing notes, evidence context, Figma link when applicable, Post-Deploy Monitoring & Validation, and accepted Known Residuals. Do not broaden a push request into PR creation or a PR request into unrelated tracker/release actions.

   Pre-existing dirty paths remain user-owned. Never stage them into an authorized commit or landing action.

3. **Notify User / Return Verified Handoff**
   - Summarize what was completed
   - Include `verification_run_summary_ref`, `honest_closeout_verdict`, `run_artifact_path`, `run_artifact_reason_code`, and any `claim_limitations`
   - State whether changes are uncommitted, committed locally, pushed, or attached to a PR, with the authorization basis
   - Link to PR only if one was explicitly authorized and created
   - Note any follow-up work needed
   - Suggest next steps if applicable

## Quality Checklist

Before creating PR, verify:

- [ ] All clarifying questions asked and answered
- [ ] All tasks marked completed
- [ ] Testing addressed -- tests pass AND new/changed behavior has corresponding test coverage (or an explicit justification for why tests are not needed)
- [ ] Linting passes (use linting-agent)
- [ ] Code follows existing patterns
- [ ] Figma designs match implementation (if applicable)
- [ ] Validation/evidence context preserved in the verified handoff and passed to a PR workflow only when landing was authorized
- [ ] `commit_authorization` checked before staging/commit; unrelated dirty files excluded
- [ ] `landing_authorization` checked before push/PR; no outward action inferred from skill invocation
- [ ] Commit messages follow conventional format when commits were authorized
- [ ] PR description includes Post-Deploy Monitoring & Validation section (or explicit no-impact rationale) when a PR was authorized
- [ ] Simplify: `spec-simplify-code` when diff >=30 lines (or skipped with reason)
- [ ] Code review: `spec-code-review` ran (self-sized), or skipped (mechanical diff / unavailable — noted in summary); residuals handled via the Residual Work Gate
- [ ] Authorized PR description includes summary, testing notes, evidence when captured, and accurate attribution

## Code Review

Single portable path: **`spec-code-review`** self-sizes (lite roster for small low-risk code-only diffs, full roster otherwise). No harness-native review detection, no escalation tiers — the size/sensitive-surface judgment lives inside `spec-code-review` now.

**Skip** only for a purely mechanical diff (formatting, dep-bumps, lint-only, generated). Everything else is reviewed.

**Two steps — review is not fix.** (3a) Review-only via `mode:agent`; add `depth:full` when the plan/task/user explicitly asked for a deep review. (3b) Batched fix subagents per `references/review-findings-followup.md`; residuals → Residual Work Gate.

**If `spec-code-review` can't run** (no subagent dispatch): interactive → harness-native review if present, fix inline; non-interactive → skip-with-note + manual diff scan in Final Validation. Never silently ship a non-mechanical change unreviewed.
