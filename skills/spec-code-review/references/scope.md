# scope

## Review Scope

A full review spawns generic subagents for all 4 always-on personas plus the 2 spec-first always-on local prompt assets, then adds whichever cross-cutting and stack-specific conditionals fit the diff (Stage 3c can collapse this to a lite roster for trivial, low-risk diffs). The model naturally right-sizes: a small config change triggers 0 conditionals = 6 reviewers. A Rails auth feature might trigger security + reliability + adversarial = 9 reviewers.

## Protected Artifacts

The following paths are spec-first pipeline artifacts and must never be flagged for deletion, removal, or gitignore by any reviewer:

- `docs/brainstorms/*` -- legacy requirements documents created by older spec-brainstorm versions
- `docs/plans/*.{md,html}` -- unified plan artifacts created by spec-brainstorm or spec-plan (decision artifacts; execution progress is derived from git, not stored in plan bodies)
- `docs/solutions/*.md` -- solution documents created during the pipeline

If a reviewer flags any file in these directories for cleanup or removal, discard that finding during synthesis.

## Plan Requirements Completeness

When a plan is provided via `plan:<path>` or discovered from PR/branch context,
classify readiness before checking completeness:

- Unified artifact: metadata includes `artifact_contract: spec-unified-plan/v1`.
  - `artifact_readiness: requirements-only` can inform product intent, but it
    must not trigger implementation-unit completeness findings. Report that the
    artifact was not implementation-ready if the diff appears to implement it.
  - `artifact_readiness: implementation-ready` is eligible for full
    requirements and U-ID completeness checks.
  - Invalid progress-like readiness values (`active`, `in_progress`,
    `completed`, `done`) are contract errors.
- Legacy plan: use the existing completeness checks.

Extract requirements from these shapes, in order:

1. Unified `Product Contract` -> `### Requirements`
2. Legacy top-level `## Requirements`
3. Legacy `## Requirements Trace`

For unified implementation-ready plans, also extract U-IDs from
`## Implementation Units` and compare against PR body/branch context when
available. Do not require every Product Contract R-ID to map one-to-one to a
single U-ID; verify that implemented U-IDs cite the relevant R/F/AE/KTD IDs and
that no claimed U-ID is missing from the plan.

Task-mode exception: completeness scope is the selected Task Card, its `source_unit`/`requirement_refs`, and the bounded task delta only. Do not flag other plan requirements or U-IDs as unaddressed during an early task review; the final full review owns whole-plan completeness.

## How to Run

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
