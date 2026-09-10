# Targeted Mode

Read this reference when Mode Detection in `SKILL.md` routes to **Targeted Mode**: a specific comment or thread URL was provided. Targeted mode addresses only that thread.

## 1. Extract Thread Context

Parse the URL to extract HOST, OWNER, REPO, PR number, and comment REST ID. Set `GH_HOST` to that exact HOST for all `gh` and helper calls and pass OWNER/REPO explicitly; do not fall back to the checkout's repository or github.com. Confirm access with `gh repo view` for this repository before fetching.

```text
https://HOST/OWNER/REPO/pull/NUMBER#discussion_rCOMMENT_ID
```

Get comment details and the GraphQL node ID via REST:

```bash
gh api repos/OWNER/REPO/pulls/comments/COMMENT_ID \
  --jq '{node_id, path, line, body}'
```

Map the comment to its thread ID using [../scripts/get-thread-for-comment](../scripts/get-thread-for-comment). Resolve the script through the loaded skill directory so repo-root execution and installed runtime execution both work:

```bash
SKILL_DIR="<absolute path of the directory containing this SKILL.md>"
bash "$SKILL_DIR/scripts/get-thread-for-comment" PR_NUMBER COMMENT_NODE_ID OWNER/REPO
```

The script paginates the top-level `reviewThreads` connection and returns the matching thread with full comment details. If it reports that nested thread comments are truncated, treat the missing target as incomplete evidence rather than confirmed absence.

## 2. Fix, Reply, Resolve

Before judgment, read Full Mode steps 2 and 7 in [full-mode.md](full-mode.md) and reconcile the reply and resolution conditions. A resolution-pending target skips judgment, fixing, validation, commit, push, and another reply; verify its existing submitted reply and empty pending-review state, then perform only authorized resolution. A pending human decision remains open. These shared checks also apply to new replies.

Read [evaluation-rubric.md](evaluation-rubric.md) and judge this thread before any resolver dispatch. Account for `isOutdated` and the location fields (`line`, `originalLine`, `startLine`, `originalStartLine`). The cross-item reasoning is mostly inert for a single thread, but the read-depth and divert logic still apply: do not fix on reviewer authority alone.

Apply all five Exit Authority Admission facts from SKILL.md. Without `local_fix_authorization`, validate against source without editing; without `reply_authorization`, do not post; without `thread_resolution_authorization`, do not resolve. Commit and push also require their own authority; one cannot imply another.

Handle only `fixed` / `fixed-differently` verdicts through the same Mutating resolver dispatch boundary as Full Mode. First read `references/agents/pr-comment-resolver.md`. Dispatch one generic worker only with `local_fix_authorization: authorized`, `worker_dispatch_authorization: authorized`, `worker_dispatch_capability: available`, and safe isolation of this thread's work. If a local fix is authorized but dispatch is unavailable, apply the same prompt sequentially inline with its fallback reason. Without local-fix authority, retain the pending list.

Pass the same fields full mode does, including `isOutdated` and the location fields: `line`, `originalLine`, `startLine`, `originalStartLine`. Targeted threads can be outdated too and need the same relocation handling.

For `replied`, `not-addressing`, or `declined`, compose the reply text from the rubric, skip validation/commit/push, then only post when `reply_authorization: authorized` and only resolve when `thread_resolution_authorization: authorized`. For `needs-human`, compose `decision_context`; post only with reply authority, always leave the thread open, and present the decision to the user.

For fix verdicts, follow the same separately authorized validate -> commit -> push -> reply -> resolve flow as Full Mode steps 5-7 in [full-mode.md](full-mode.md). A missing exit authority stops that exit and every downstream claim that depends on it.
