# Reviewed Scope And Provenance

Read before Stage 1. This file owns local, remote, and task scope, snapshot validation, and the inline path when dispatch is unavailable. Remote review must not inspect unrelated local source.

### Stage 1: Determine scope

Compute the diff range, file list, and diff. Minimize permission prompts by combining into as few commands as possible.

#### Task-scoped `mode:agent` intake

When `task-pack:`, `task:`, and `task-context:` are present, run this branch before the ordinary `base:` fast path. This is a bounded review of one Task Card inside the current checkout. It remains report-only: task context never enables Stage 5c, checkout mutation, commit, push, PR, or ticket creation.

The caller-owned context file must be local, readable, inside the caller's authorized work-run/artifact root, and shaped as:

```json
{
  "schema_version": "spec-code-review-task-context/v1",
  "task_pack_digest": "sha256:<64-hex>",
  "source_plan": "docs/plans/...",
  "source_plan_section_titles": ["### U6. ...", "### Interface Contracts"],
  "work_run_base": "<same ref or resolved SHA passed via base:>",
  "pre_task_dirty_files": ["repo/relative/path"],
  "pre_task_untracked_files": ["repo/relative/path"],
  "pre_task_file_facts": [
    {
      "path": "repo/relative/path",
      "base_content_sha256": "sha256:<64-hex> | absent",
      "pre_task_content_sha256": "sha256:<64-hex> | absent"
    }
  ],
  "task_delta_files": [
    {
      "path": "repo/relative/path",
      "change_kind": "modified | added | deleted | renamed",
      "old_path": "repo/relative/old-path | null",
      "current_content_sha256": "sha256:<64-hex> | absent"
    }
  ],
  "task_owned_untracked_files": ["repo/relative/new-path"]
}
```

These are caller-captured run facts, not workflow state. The caller must capture the pre-task facts before task mutation; the reviewer must not reconstruct or invent them after the fact. Normalize all paths to repo-relative POSIX paths, reject absolute paths, `..` escape, generated runtime mirrors, secret-path matches, duplicate/conflicting entries, and rename endpoints outside the task's declared/allowed surface.

Validate before reviewer dispatch:

1. Read the task pack, find exactly one `Task Pack Contract` JSON block, and select exactly one Task Card whose `task_id` equals `task:`. An unknown task_id, unreadable pack, duplicate task ID, or malformed contract returns `status: failed` without dispatch.
2. Hash the current task-pack file bytes as SHA-256 and compare them with `task_pack_digest`. Digest drift returns `status: failed`, `required_gate_eligible: false`, and reason `task-pack-digest-drift`; do not silently review a different pack.
3. Confirm task-pack `source_plan`, optional explicit `plan:`, context `source_plan`, and `work_run_base`/`base:` agree. A mismatch is a failed scope contract, not inferred intent.
4. Read the Task Card's `files`, `expected_side_effects`, `review_gate`, and `review_focus`. The declared files plus narrowly bounded expected side effects are the allowed task surface. `review_focus` guides reviewers but never suppresses correctness findings.
5. Require a pre-task file fact for every task delta path and both rename endpoints. Re-hash every current delta file and compare it with `current_content_sha256` (`absent` for deletion). Missing, drifting, or contradictory attribution returns `status: degraded`, reason `task-scope-unattributed`, and `required_gate_eligible: false`; a required review must not pass on an invented or concurrently changed task diff.

### Task-Scoped Live Plan Context

`source_plan_section_titles` is an optional producer label list of exact visible section headings relevant to the selected Task Card. It transports only the current plan path plus section titles: never plan body bytes, hashes, byte offsets, anchors, access-control claims, or a second context schema.

When task context provides readable `source_plan` and one or more titles, reviewers re-read that same live file in the current checkout and use only the named sections as plan context. The producer does not attest that the plan is unchanged and the reviewer does not reconstruct a same-session hash check. Ordinary bounded heading lookup is enough; do not introduce an anchor parser.

When the path is missing/unreadable, a title is absent, or section labels are absent, retain the attributed task diff review but set `plan_context_mode: diff-only` and record respectively `task-plan-unreadable`, `task-plan-section-unreadable`, or `task-plan-section-hints-missing`. Do not claim plan-aware coverage, do not invent omitted requirements, and do not fail the task solely because the additive plan context is unavailable.

Build one review bundle with per-file provenance:

- **`exact-file`**: `base_content_sha256` equals `pre_task_content_sha256`, including `absent == absent`. The file had no pre-task divergence from the work-run baseline, so its current base-to-working-tree patch is attributable to this task.
- **`cumulative-file`**: the hashes differ. Include the file's full current diff against `base:` and disclose that it also contains pre-existing dirty work or earlier task changes. Do not call it an isolated task diff; reviewers may mark unrelated hunks `pre_existing`.
- **Task-owned new file**: the path is in `task_delta_files` and `task_owned_untracked_files`, was `absent` at base and pre-task, exists now, and is declared/allowed. Include a full-addition patch or bounded full content generated without assuming POSIX `/dev/null`; do not apply the standalone rule that excludes all untracked files.
- **Pre-existing untracked**: paths listed in `pre_task_untracked_files` stay excluded and disclosed when untouched. If the task delta claims one, attribution is degraded and the required gate is ineligible because no base-to-pre-task boundary exists.
- **Scope expansion**: a delta or task-owned new file outside declared `files` and bounded `expected_side_effects` returns `status: failed`, reason `task-scope-expansion`, and names the paths. Do not broaden review scope to legitimize the mutation.
- **Unattributed current file**: a changed/untracked path claimed by neither pre-task facts nor task delta returns degraded `task-scope-unattributed`; do not hide it or call the task clean.

Set per-file isolation and one aggregate `task_diff_isolation`: `exact-file` when every included file is exact, `cumulative-file` when every included file is cumulative, `mixed` when both are fully attributed, and `degraded` when any required fact or file attribution is missing. `cumulative-file`/`mixed` are honest bounded review scopes with limitations; only `degraded` or failed scope makes `required_gate_eligible: false` before findings are considered.

For task mode, `BASE` remains the work-run baseline used for file diffs and reviewer context. It is not a pre-task snapshot. Set `FILES` to the attributed task bundle, `DIFF` to the labeled per-file patches/content, and `UNTRACKED` to two separate lists: excluded pre-existing untracked files and included task-owned untracked files. Pass the Task Card, observed/expected pack digest, source plan, `source_plan_section_titles`, `plan_context_mode`, declared files, delta files, file isolation map, aggregate isolation, review focus, and limitations to every reviewer and validator. Requirements completeness is limited to this Task Card's cited source refs; final branch/plan completeness remains the Phase 3 full review's job.

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

This path works with any ref — a SHA, `origin/main`, a branch name. Callers reviewing the current checkout should pass explicit `base:` when auto-detection is unnecessary. **Do not combine `base:` with a PR number or branch target.** If both are present, stop with an error: "Cannot use `base:` with a PR number or branch target — `base:` implies the current checkout is already the correct branch. Pass `base:` alone, or pass the target alone and let scope detection resolve the base."

**If a PR number or GitHub URL is provided as an argument:**

Do **not** check out the PR branch. Scope comes from GitHub read APIs plus optional local alignment when HEAD already matches the PR head branch.

**Skip-condition pre-check.** Before scope detection, run a PR-state probe:

```
gh pr view <number-or-url> --json state,title,body,files
```

Apply skip rules in order:

- `state` is `CLOSED` or `MERGED` -> stop with reason `PR is closed/merged; not reviewing.`
- **Trivial-PR judgment**: perform this conservative judgment in the orchestrator inline from the PR title, body, and changed file paths; this pre-gate check does not dispatch a sub-agent. Ask: "Is this an automated or trivial PR that does not warrant a code review? Consider dependency lock-file or manifest-only bumps, automated release commits, and chore version increments with no substantive code changes." When in doubt, answer no — false negatives (skipped reviews that should run) are more costly than false positives (an unnecessary review). If the judgment returns yes: stop with reason `PR appears to be a trivial automated PR; not reviewing. Run without a PR argument to review the current branch, or pass base:<ref> if review is intended.`

When any skip rule fires, stop without dispatching reviewers. **Default mode:** emit the reason as plain text. **`mode:agent`:** emit JSON only — `{"status":"skipped","reason":"<same message>"}` — so programmatic callers can parse the outcome. **Standalone**, **`base:`**, and **branch-remote** paths are unaffected. **Draft PRs are reviewed normally.**

If no skip rule fires, fetch PR metadata **without checkout**:

```
gh pr view <number-or-url> --json title,body,baseRefName,headRefName,headRefOid,isCrossRepository,url,files,reviews,comments --jq '{title, body, baseRefName, headRefName, headRefOid, isCrossRepository, url, files: [.files[].path], hasPriorComments: ((.reviews | map(select(.state != "APPROVED" or .body != "")) | length) > 0 or (.comments | length) > 0)}'
```

Set `BASE:` to `pr:<number-or-url>` (logical marker — not a git SHA). Set `UNTRACKED:` from `git ls-files --others --exclude-standard` on the **current** checkout (usually empty during PR-remote review).

**PR scope mode.** Classify as **`local-aligned`** only when **all** of these hold; otherwise use **`pr-remote`**. A matching branch name alone is not enough — a fork PR or a stale local branch can share a name with the PR head while pointing at unrelated code, and trusting the name would diff and inspect the wrong tree.

1. `git rev-parse --abbrev-ref HEAD` equals `headRefName`.
2. The PR is **not** cross-repository (`isCrossRepository` is false).
3. The PR head commit is contained in the local checkout: `git merge-base --is-ancestor <headRefOid> HEAD` exits 0. This confirms the working tree actually carries the PR head (allowing unpushed local fixes layered on top) rather than an unrelated same-named branch.

- **`local-aligned`** — all three checks pass. Local Read/Grep/git blame against workspace files are valid for PR changed paths.
- **`pr-remote`** — any check fails. The working tree is **not** the PR head; workspace file contents for changed paths may be stale or unrelated.

**Diff by scope mode** (do not mix remote and local diffs — contradictory hunks cause false positives):

- **`local-aligned`:** Resolve `<resolved-base-ref>` from `baseRefName` (fetch if needed). Compute `BASE=$(git merge-base HEAD <resolved-base-ref>)`, then set `FILES:` from `git diff --name-only $BASE` and `DIFF:` from `git diff -U10 $BASE` (includes committed, staged, and unstaged changes on the PR branch). Do **not** call `gh pr diff` or append remote hunks — when unpushed fixes exist, the local tree is canonical. Note in Coverage: `scope: local-aligned (PR; local tree diff)`.
- **`pr-remote`:** Set `FILES:` from the PR `files` array. Set `DIFF:` from `gh pr diff <number-or-url> --color=never`. If `gh pr diff` fails, stop with an actionable error — do not fall back to checkout.

When **`pr-remote`**, before Stage 4:

1. Best-effort fetch PR head without checkout: `git fetch --no-tags origin <headRefName>:refs/review/pr-<number>-head` (substitute PR number from metadata).
2. When fetch succeeds, set `PR_HEAD_REF=refs/review/pr-<number>-head` for reviewers and validators. When fetch fails, omit `PR_HEAD_REF` and note in Coverage — reviewers must rely on diff hunks only.
3. Best-effort fetch the PR base without checkout: `git fetch --no-tags origin <baseRefName>`. When it succeeds, resolve a concrete ref with `git rev-parse FETCH_HEAD` and set `PR_BASE_REF` to that SHA — a **real git base ref** reviewers and validators use for file-level git diffs (e.g. `data-migration-reviewer` runs `git diff <PR_BASE_REF> -- db/schema.rb`/`structure.sql`). The `pr:<number-or-url>` logical marker in `BASE:` stays the scope marker; `PR_BASE_REF` is the diffable base. When the fetch fails, omit `PR_BASE_REF` and note in Coverage — schema-drift and other git-diff checks fall back to diff hunks only and must **not** assume `main`.
4. Include `<pr-scope-mode>pr-remote</pr-scope-mode>` and, when set, `<pr-head-ref>...</pr-head-ref>` and `<pr-base-ref>...</pr-base-ref>` in the Stage 4 review context bundle.

Reviewers and Stage 5b validators in **`pr-remote`** mode must **not** Read/Grep workspace paths for files in `FILES:`. Inspect via `git show <PR_HEAD_REF>:<path>` when `PR_HEAD_REF` is set, otherwise use only the provided diff hunks. **`local-aligned`** uses normal workspace inspection.

**If a branch name is provided as an argument:**

Substitute the provided branch name as `<branch>`. Do **not** check out `<branch>`.

If `git rev-parse --abbrev-ref HEAD` equals `<branch>`, use the **standalone (current branch)** path below — same tree, explicit branch name; do not use remote-only diff.

Otherwise diff the remote/local ref **without checkout**:

1. Try `gh pr view <branch> --json baseRefName,url,headRefName` — if a PR exists, prefer the **PR number/URL path** above (same remote diff rules).
2. Else resolve `<branch>` as `origin/<branch>` or `<branch>` after `git fetch --no-tags origin <branch>` when needed.
3. Resolve default base branch (same logic as standalone). Compute `BASE=$(git merge-base <base-ref> <branch-ref>)` and `git diff -U10 $BASE <branch-ref>`.
4. If `<branch-ref>` cannot be resolved locally, stop: "Cannot diff branch `<branch>` without checkout. Check out that branch, pass its open PR URL/number, or review the current branch with `base:`."

On success for remote branch diff, set **branch-remote scope**. The working tree is **not** `<branch>`. Include `<pr-scope-mode>branch-remote</pr-scope-mode>` and `<branch-head-ref><branch-ref></branch-head-ref>` in the Stage 4 review context bundle. Reviewers and Stage 5b validators must **not** Read/Grep workspace paths for files in `FILES:`. Inspect via `git show <branch-ref>:<path>` or diff hunks only.

Produce:

```
echo "BASE:$BASE" && echo "FILES:" && git diff --name-only $BASE <branch-ref> && echo "DIFF:" && git diff -U10 $BASE <branch-ref> && echo "UNTRACKED:" && git ls-files --others --exclude-standard
```

**If no argument (standalone on current branch):**

Apply the same base-detection logic as branch mode above, using the current branch (i.e., `gh pr view --json baseRefName,url` with no argument defaults to the current branch).

If no base can be resolved, **stop**. Do not fall back to `git diff HEAD` — a standalone review without the base would only show uncommitted changes and silently miss all committed work on the branch.

On success, produce the diff:

```
echo "BASE:$BASE" && echo "FILES:" && git diff --name-only $BASE && echo "DIFF:" && git diff -U10 $BASE && echo "UNTRACKED:" && git ls-files --others --exclude-standard
```

Using `git diff $BASE` (without `..HEAD`) diffs the merge-base against the working tree, which includes committed, staged, and unstaged changes together.

**Untracked file handling:** Outside task mode, always inspect `UNTRACKED:`. Untracked paths are out of scope unless staged. When non-empty, list excluded files in Coverage and continue on tracked changes only — never stop or prompt. Task mode uses the caller-captured pre-task/task-owned classification above instead of this blanket exclusion.

### Stage 1a: Freeze the reviewed local scope

For `mode:agent` and every report-only review whose reviewed tree is local (`base:`, standalone, `local-aligned`, or task-scoped current checkout), freeze the diff before semantic review. Set `SKILL_DIR` and run:

```bash
SCOPE_SNAPSHOT="$REVIEW_ARTIFACT_DIR/scope-snapshot.json"
DIFF_A="$BASE"
DIFF_B=""
SCOPE_ARGS=(--base "$DIFF_A" --snapshot-out "$SCOPE_SNAPSHOT")
[ -n "${DIFF_B:-}" ] && SCOPE_ARGS+=(--head "$DIFF_B")
bash "$SKILL_DIR/scripts/run-python.sh" "$SKILL_DIR/scripts/review-scope.py" "${SCOPE_ARGS[@]}"
```

The returned `changed_files`, `files_changed`, and `diff_sha256` are immutable scope facts for the rest of the run. `mode:agent` JSON must use the frozen `files_changed`; never recompute it after tests or inspection. For task mode, the task-attributed bundle remains the semantic review scope, while the whole local base-to-working-tree snapshot is only the mutation detector. Remote-only PR/branch review has no reviewed local tree and records the guard as not applicable.

If the helper, snapshot write, or artifact root is unavailable, keep `source_mutation_gate: closed`, record `mutation_guard_unavailable`, and do not emit a successful/complete machine handoff. Do not replace the deterministic snapshot with remembered prose or a later `git diff`.

### Stage 1b: Compute scope signals (cheap, deterministic)

Derive deterministic signals from the resolved diff once, so reviewer selection (Stage 3) and the small-diff fast path (Stage 3c) do not each re-reason over the whole diff. **These signals only ever shrink the roster via Stage 3c, and that gate fails closed (Stage 3c) — so any failure here (unresolved base, count failure, an uncounted file type) must surface as `UNKNOWN`/non-zero `UNCOUNTED_FILES`, never as a silent `0` that reads as "trivial."**

**Set `DIFF_A`/`DIFF_B` to the two endpoints to diff, by Stage 1 scope mode:**
- **`local-aligned` / standalone / `base:`** — `DIFF_A="$BASE"` (a real SHA/ref), `DIFF_B` empty (diffs base vs working tree).
- **`pr-remote` / `branch-remote`** — `DIFF_A=<PR_BASE_REF>`, `DIFF_B=<PR_HEAD_REF>` (or `<branch-head-ref>`) — the **fetched** refs from Stage 1. Do **not** model-count from hunks (it drifts per host/model). If either ref was not fetched, skip the block and emit `EXEC_LINES:UNKNOWN` + `UNCOUNTED_FILES:1` so Stage 3c forces the full roster.
- **Task-scoped `mode:agent`** — compute signals from the attributed task `FILES`/`DIFF` bundle only, including task-owned full-addition files. Never count the entire base-to-working-tree diff. If any task file is degraded/unattributed or cannot be counted consistently, emit `EXEC_LINES:UNKNOWN` + `UNCOUNTED_FILES:1` so the full roster runs and the coverage limitation remains visible.

For every non-task scope, set `SKILL_DIR` to this Skill's runtime directory and run the facts helper through its portable Python wrapper:

```bash
SCOPE_ARGS=(--base "$DIFF_A")
[ -n "${DIFF_B:-}" ] && SCOPE_ARGS+=(--head "$DIFF_B")
bash "$SKILL_DIR/scripts/run-python.sh" "$SKILL_DIR/scripts/review-scope.py" "${SCOPE_ARGS[@]}"
```

Consume only its JSON facts (`status`, endpoints, `exec_lines`, `uncounted_files`, `changed_files`, path `signals`, test/agent-surface flags, fixed `docs/solutions` corpus presence, and `lite_eligible`). The helper does not select personas or decide semantic risk. A non-`complete` status, malformed output, invocation failure, or changed-file mismatch becomes `EXEC_LINES:UNKNOWN` plus `UNCOUNTED_FILES:1`; never reconstruct a favorable zero. Task-scoped mode continues to compute from its attributed bundle and uses the same fail-closed fields because the helper intentionally has no authority to reinterpret caller-owned task attribution.

`EXEC_LINES` counts changed executable lines (added + removed, counted code extensions only — so a modified line counts as 2; the Stage 3c `<40` threshold is in add+delete units). `EXEC_LINES:UNKNOWN` means the base was unresolved — treat as non-trivial. `UNCOUNTED_FILES` is the count of changed files outside the code set (skill `.md`, JSON schemas, `.sh`, config, CI, lockfiles, unknown extensions) — **spec-first's own product surface is mostly uncounted, which is exactly why Stage 3c must fail closed on it.** The `SIGNALS` list is **path heuristics, not selection decisions**: Stage 3 still applies judgment and adds the matching conditional persona only when the runtime concern is real. Content-based risk (auth, payments, data mutation) is **not** path-derivable — read it from the diff in Stage 3 as before; it also disqualifies the Stage 3c fast path regardless of line count.

### Stage 1c: Dispatch gate and inline fallback

After scope/diff/task-context resolution, enforce the Phase 0 dispatch policy before profile derivation, persona loading, team announcements, validators, or cross-model work.

- If `worker_dispatch_authorization: missing`, select the bounded inline report-only path, set `status: degraded` and `coverage.dispatch_reason_code: dispatch_authorization_missing`.
- If authorization is present but confirmed current-session capability is missing, use the same path with `subagent_capability_missing`; if the probe is unavailable or cannot establish a unique eligible candidate, use `worker_capability_unproven`.
- On this path, continue only through Stage 2 intent discovery and Stage 2b plan/task completeness context when applicable, then perform the inline pass, run the mandatory Stage 5e mutation check, and go to Stage 6. Skip Stage 2c, Stages 3/3b/3c, persona/validator/cross-model dispatch, and Stage 5/5b/5c. No persona prompt may be represented as independently executed.
- Reuse the Phase 0a Run ID/artifact-directory setup before synthesis even though no reviewer is dispatched. If the directory is unavailable, keep the complete result in band with `artifact_path: null` and `artifact_write_status: unavailable`.

Inline fallback output contract:

1. Inspect the entire resolved diff or attributed task bundle once with direct correctness, testing, project-standards, scope, and plan/task-completeness checks. These are orchestrator checks, not executed personas.
2. Normalize every surviving issue directly into the final finding fields, assign stable `#` values in Stage 5 ordering, set `reviewers: ["inline-fallback"]`, and derive `actionable_findings` from the normal routing fields. Do not emit a preliminary fast-pass block or claim validation/cross-reviewer agreement.
3. Set `reviewers: ["inline-fallback"]`, `coverage.dispatch_reason_code` to the concrete fallback reason, and record independent/validator/cross-model coverage as not run. When no targeted command ran, use the Stage 5d `no-targeted-command-executed` evidence shape.
4. Return `status: degraded` and `verdict: Not ready` even when no issue is found; single-model bounded coverage cannot close merge readiness. In task mode also set `required_gate_eligible: false`.

The explicit Quick Review Short-Circuit is separate: when the user asked for a quick/light review and the harness has a built-in report-only reviewer, use that path as requested rather than labelling it a failed multi-agent run.
